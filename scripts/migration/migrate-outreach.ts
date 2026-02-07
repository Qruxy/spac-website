/**
 * Outreach Committee Migration: outreachCommittee -> OutreachCommitteeMember
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyOutreachCommittee } from './types';
import { MigrationLogger } from './utils';

export async function migrateOutreach(
  prisma: PrismaClient,
  tables: ParsedTables,
  memberIdMap: Map<number, string>,
  logger: MigrationLogger
) {
  const committee = (tables.get('outreachCommittee') || []) as unknown as LegacyOutreachCommittee[];
  logger.info(`Source: ${committee.length} outreach committee members`);

  for (const member of committee) {
    try {
      const legacyKey = `outreach_${member.memID}`;
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'outreach', legacyId: legacyKey } },
      });
      if (existing) {
        logger.track('outreach', 'skipped');
        continue;
      }

      // Look up user by legacy member ID
      const userId = memberIdMap.get(member.memID);
      if (!userId) {
        logger.warn(`Outreach member ${member.memID}: not found in migration map, skipping`);
        logger.track('outreach', 'failed');
        continue;
      }

      // Check if already an outreach member
      const existingMember = await prisma.outreachCommitteeMember.findUnique({
        where: { userId },
      });
      if (existingMember) {
        logger.track('outreach', 'skipped');
        continue;
      }

      // Map role: ocAdmin=1 -> CHAIR (if first one), otherwise VOLUNTEER
      const role = member.ocAdmin === 1 ? 'CHAIR' : 'VOLUNTEER';

      const record = await prisma.outreachCommitteeMember.create({
        data: {
          userId,
          role,
          isActive: true,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'outreach', legacyId: legacyKey } },
        update: { newId: record.id },
        create: { entity_type: 'outreach', legacyId: legacyKey, newId: record.id },
      });

      logger.track('outreach', 'success');
    } catch (err) {
      logger.error(`Failed to migrate outreach member ${member.memID}`, err);
      logger.track('outreach', 'failed');
    }
  }
}
