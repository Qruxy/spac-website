/**
 * Board Member Migration: clubOfficers -> BoardMember
 *
 * Joins with member migration mappings to resolve names/emails.
 * Also upgrades users with clubAdmin=1 to ADMIN role.
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyClubOfficer } from './types';
import { MigrationLogger } from './utils';

export async function migrateBoardMembers(
  prisma: PrismaClient,
  tables: ParsedTables,
  memberIdMap: Map<number, string>,
  logger: MigrationLogger
) {
  const officers = (tables.get('clubOfficers') || []) as unknown as LegacyClubOfficer[];
  logger.info(`Source: ${officers.length} club officers`);

  for (const officer of officers) {
    try {
      // Idempotency check
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'board_member', legacyId: String(officer.coID) } },
      });
      if (existing) {
        logger.track('board_members', 'skipped');
        continue;
      }

      // Skip vacant positions (coMemberNo = 0)
      if (officer.coMemberNo === 0) {
        logger.warn(`Officer ${officer.coID} (${officer.office}): vacant position, skipping`);
        logger.track('board_members', 'skipped');
        continue;
      }

      // Look up the member by legacy ID
      const userId = memberIdMap.get(officer.coMemberNo);
      let name = officer.editedBy || 'Unknown';
      let email: string | null = null;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        });
        if (user) {
          name = `${user.firstName} ${user.lastName}`.trim();
          email = user.email;
        }

        // Upgrade users with clubAdmin=1 to ADMIN role
        if (officer.clubAdmin === 1) {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' },
          });
          logger.info(`Upgraded user ${name} to ADMIN role`);
        }
      } else {
        logger.warn(`Officer ${officer.coID} (${officer.office}): member ${officer.coMemberNo} not found in migration map`);
      }

      const boardMember = await prisma.boardMember.create({
        data: {
          name,
          title: officer.office,
          email,
          sortOrder: officer.sort,
          isActive: true,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'board_member', legacyId: String(officer.coID) } },
        update: { newId: boardMember.id },
        create: { entity_type: 'board_member', legacyId: String(officer.coID), newId: boardMember.id },
      });

      logger.track('board_members', 'success');
    } catch (err) {
      logger.error(`Failed to migrate officer ${officer.coID} (${officer.office})`, err);
      logger.track('board_members', 'failed');
    }
  }
}
