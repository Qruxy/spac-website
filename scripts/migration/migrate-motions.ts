/**
 * Motions Migration: motions -> Motion + auto-created MeetingMinutes (BOARD type)
 *
 * Groups motions by date. For each unique date without an existing MeetingMinutes,
 * creates a BOARD meeting record and links motions to it.
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyMotion } from './types';
import { parseDate, mapMotionStatus, MigrationLogger } from './utils';

export async function migrateMotions(
  prisma: PrismaClient,
  tables: ParsedTables,
  meetingDateMap: Map<string, string>,
  systemUserId: string,
  logger: MigrationLogger
) {
  const motions = (tables.get('motions') || []) as unknown as LegacyMotion[];
  logger.info(`Source: ${motions.length} motions`);

  // Group motions by date to create board meeting records
  const motionsByDate = new Map<string, LegacyMotion[]>();
  for (const motion of motions) {
    const dateKey = motion.date;
    if (!motionsByDate.has(dateKey)) {
      motionsByDate.set(dateKey, []);
    }
    motionsByDate.get(dateKey)!.push(motion);
  }

  logger.info(`Unique meeting dates: ${motionsByDate.size}`);

  // Create board meeting records for dates that don't have one
  for (const [dateStr] of motionsByDate) {
    if (meetingDateMap.has(dateStr)) continue;

    const meetingDate = parseDate(dateStr);
    if (!meetingDate) continue;

    try {
      const record = await prisma.meetingMinutes.create({
        data: {
          title: `Board Meeting - ${dateStr}`,
          meetingDate,
          meetingType: 'BOARD',
          approved: true,
          createdById: systemUserId,
        },
      });
      meetingDateMap.set(dateStr, record.id);
      logger.track('board_meetings_auto', 'success');
    } catch (err) {
      logger.error(`Failed to create board meeting for ${dateStr}`, err);
      logger.track('board_meetings_auto', 'failed');
    }
  }

  // Create motion records
  let motionCounter = 0;
  for (const motion of motions) {
    try {
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'motion', legacyId: String(motion.id) } },
      });
      if (existing) {
        logger.track('motions', 'skipped');
        continue;
      }

      const meetingId = meetingDateMap.get(motion.date);
      if (!meetingId) {
        logger.warn(`Motion ${motion.id}: no meeting found for date ${motion.date}`);
        logger.track('motions', 'failed');
        continue;
      }

      motionCounter++;
      const record = await prisma.motion.create({
        data: {
          meetingId,
          motionNumber: String(motion.id),
          description: motion.body || motion.title || 'No description',
          movedBy: motion.motionedBy || 'Unknown',
          secondedBy: motion.secondBy || 'Unknown',
          status: mapMotionStatus(motion.status),
          votesFor: 0,
          votesAgainst: 0,
          abstentions: 0,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'motion', legacyId: String(motion.id) } },
        update: { newId: record.id },
        create: { entity_type: 'motion', legacyId: String(motion.id), newId: record.id },
      });

      logger.track('motions', 'success');
    } catch (err) {
      logger.error(`Failed to migrate motion ${motion.id}`, err);
      logger.track('motions', 'failed');
    }
  }
}
