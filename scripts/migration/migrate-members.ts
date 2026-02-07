/**
 * Member Migration: members + application -> User + Membership + Family
 *
 * Deduplicates by email, creates family records for companions,
 * and tracks all legacy ID mappings.
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyMember, LegacyApplication } from './types';
import {
  parseDate,
  extractEmail,
  parsePhone,
  mapMembershipType,
  getMembershipStatus,
  MigrationLogger,
} from './utils';

interface MemberMigrationResult {
  systemUserId: string;
  memberIdMap: Map<number, string>; // legacyMemID -> new userId
}

export async function migrateMembers(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
): Promise<MemberMigrationResult> {
  const members = (tables.get('members') || []) as unknown as LegacyMember[];
  const applications = (tables.get('application') || []) as unknown as LegacyApplication[];

  logger.info(`Source: ${members.length} members, ${applications.length} applications`);

  // Create system user for migration references
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@spac-migration.local' },
    update: {},
    create: {
      email: 'system@spac-migration.local',
      firstName: 'System',
      lastName: 'Migration',
      role: 'ADMIN',
      isValidated: true,
    },
  });
  logger.info(`System user: ${systemUser.id}`);

  // Build deduplicated email-to-record map (members take priority)
  const emailMap = new Map<string, { source: 'member' | 'application'; legacyId: number; record: LegacyMember | LegacyApplication }>();

  for (const m of members) {
    const email = extractEmail(m.pEmail) || extractEmail(m.email);
    if (!email) {
      logger.warn(`Member ${m.memID} has no usable email, skipping`);
      logger.track('members', 'failed');
      continue;
    }
    emailMap.set(email, { source: 'member', legacyId: m.memID, record: m });
  }

  let appDedup = 0;
  for (const a of applications) {
    const email = extractEmail(a.pEmail);
    if (!email) {
      logger.track('applications', 'failed');
      continue;
    }
    if (emailMap.has(email)) {
      appDedup++;
      continue; // Member record takes priority
    }
    emailMap.set(email, { source: 'application', legacyId: a.appID, record: a });
  }
  logger.info(`Deduplicated: ${emailMap.size} unique emails (${appDedup} applications merged with existing members)`);

  const memberIdMap = new Map<number, string>();

  for (const [email, { source, legacyId, record }] of emailMap) {
    const entityType = source === 'member' ? 'member' : 'application';

    try {
      // Idempotency check
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: entityType, legacyId: String(legacyId) } },
      });
      if (existing) {
        memberIdMap.set(legacyId, existing.newId);
        logger.track('members', 'skipped');
        continue;
      }

      // Check if user already exists by email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // Map the legacy ID to the existing user
        await prisma.migrationIdMapping.upsert({
          where: { entity_type_legacyId: { entity_type: entityType, legacyId: String(legacyId) } },
          update: { newId: existingUser.id },
          create: { entity_type: entityType, legacyId: String(legacyId), newId: existingUser.id },
        });
        memberIdMap.set(legacyId, existingUser.id);
        logger.track('members', 'skipped');
        continue;
      }

      const r = record as LegacyMember;
      const joinedDate = parseDate(r.joined);
      const renewDate = parseDate(r.renew);
      const membershipType = mapMembershipType(r.membership);
      const membershipStatus = getMembershipStatus(r.renew, r.membership);

      // Create User + Membership + Mapping in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            firstName: r.pFirstName?.trim() || 'Unknown',
            lastName: r.pLastName?.trim() || 'Unknown',
            phone: parsePhone(r.pMobile) || parsePhone(r.home),
            role: 'MEMBER',
            isValidated: true,
            isPrimaryMember: membershipType === 'FAMILY',
            createdAt: joinedDate || new Date(),
          },
        });

        await tx.membership.create({
          data: {
            userId: user.id,
            type: membershipType,
            status: membershipStatus,
            interval: 'ANNUAL',
            startDate: joinedDate || new Date(),
            endDate: membershipType === 'LIFETIME' ? null : renewDate,
          },
        });

        await tx.migrationIdMapping.create({
          data: { entity_type: entityType, legacyId: String(legacyId), newId: user.id },
        });

        return user;
      });

      memberIdMap.set(legacyId, result.id);

      // Handle companion/family member
      const companionFirst = r.cFirstName?.trim();
      const companionLast = r.cLastName?.trim() || r.pLastName?.trim();
      if (companionFirst && membershipType === 'FAMILY') {
        await createCompanion(prisma, result.id, r, email, legacyId, logger);
      }

      logger.track('members', 'success');
    } catch (err) {
      logger.error(`Failed to migrate ${entityType} ${legacyId} (${email})`, err);
      logger.track('members', 'failed');
    }
  }

  return { systemUserId: systemUser.id, memberIdMap };
}

async function createCompanion(
  prisma: PrismaClient,
  primaryUserId: string,
  record: LegacyMember,
  primaryEmail: string,
  legacyId: number,
  logger: MigrationLogger
) {
  try {
    const companionEntityType = 'member_companion';
    const companionLegacyId = `${legacyId}_companion`;

    // Idempotency check
    const existing = await prisma.migrationIdMapping.findUnique({
      where: { entity_type_legacyId: { entity_type: companionEntityType, legacyId: companionLegacyId } },
    });
    if (existing) {
      logger.track('companions', 'skipped');
      return;
    }

    // Determine companion email
    let companionEmail = extractEmail(record.cEmail);
    if (!companionEmail || companionEmail === primaryEmail) {
      // Generate synthetic email
      const [local, domain] = primaryEmail.split('@');
      companionEmail = `${local}+companion@${domain}`;
    }

    // Check if companion email already exists
    const existingCompanion = await prisma.user.findUnique({ where: { email: companionEmail } });
    if (existingCompanion) {
      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: companionEntityType, legacyId: companionLegacyId } },
        update: { newId: existingCompanion.id },
        create: { entity_type: companionEntityType, legacyId: companionLegacyId, newId: existingCompanion.id },
      });
      logger.track('companions', 'skipped');
      return;
    }

    // Create Family + Companion in a transaction
    await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: { name: `${record.pLastName?.trim() || 'Unknown'} Family` },
      });

      // Link primary user to family
      await tx.user.update({
        where: { id: primaryUserId },
        data: { familyId: family.id, family_role: 'PRIMARY' },
      });

      // Create companion user
      const companion = await tx.user.create({
        data: {
          email: companionEmail!,
          firstName: record.cFirstName?.trim() || 'Unknown',
          lastName: record.cLastName?.trim() || record.pLastName?.trim() || 'Unknown',
          phone: parsePhone(record.cMobile),
          role: 'MEMBER',
          isValidated: true,
          isPrimaryMember: false,
          familyId: family.id,
          family_role: 'SPOUSE',
        },
      });

      // Create companion membership
      await tx.membership.create({
        data: {
          userId: companion.id,
          type: 'FAMILY',
          status: getMembershipStatus(record.renew, record.membership),
          interval: 'ANNUAL',
          startDate: parseDate(record.joined) || new Date(),
          endDate: parseDate(record.renew),
        },
      });

      // Track mapping
      await tx.migrationIdMapping.create({
        data: { entity_type: companionEntityType, legacyId: companionLegacyId, newId: companion.id },
      });
    });

    logger.track('companions', 'success');
  } catch (err) {
    logger.error(`Failed to create companion for member ${legacyId}`, err);
    logger.track('companions', 'failed');
  }
}
