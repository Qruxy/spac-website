/**
 * Meeting Minutes Migration: generalMeetings -> MeetingMinutes
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyGeneralMeeting } from './types';
import { parseDate, MigrationLogger } from './utils';

export async function migrateMeetings(
  prisma: PrismaClient,
  tables: ParsedTables,
  systemUserId: string,
  logger: MigrationLogger
): Promise<Map<string, string>> {
  const meetings = (tables.get('generalMeetings') || []) as unknown as LegacyGeneralMeeting[];
  logger.info(`Source: ${meetings.length} general meetings`);

  // Map of date string -> meetingId (for motions linking)
  const meetingDateMap = new Map<string, string>();

  for (const meeting of meetings) {
    try {
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'meeting', legacyId: String(meeting.gmID) } },
      });
      if (existing) {
        meetingDateMap.set(meeting.meetingDate, existing.newId);
        logger.track('meetings', 'skipped');
        continue;
      }

      const meetingDate = parseDate(meeting.meetingDate);
      if (!meetingDate) {
        logger.warn(`Meeting ${meeting.gmID}: invalid date ${meeting.meetingDate}`);
        logger.track('meetings', 'failed');
        continue;
      }

      // Build content with video and PDF links
      const contentParts: string[] = [];
      if (meeting.videoLink) contentParts.push(`Video: ${meeting.videoLink}`);
      if (meeting.pdfLink) contentParts.push(`PDF: ${meeting.pdfLink}`);

      const record = await prisma.meetingMinutes.create({
        data: {
          title: meeting.title || `General Meeting - ${meeting.meetingDate}`,
          meetingDate,
          meetingType: 'GENERAL',
          content: contentParts.length > 0 ? contentParts.join('\n') : null,
          pdfUrl: meeting.pdfLink || null,
          approved: true,
          createdById: systemUserId,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'meeting', legacyId: String(meeting.gmID) } },
        update: { newId: record.id },
        create: { entity_type: 'meeting', legacyId: String(meeting.gmID), newId: record.id },
      });

      meetingDateMap.set(meeting.meetingDate, record.id);
      logger.track('meetings', 'success');
    } catch (err) {
      logger.error(`Failed to migrate meeting ${meeting.gmID}`, err);
      logger.track('meetings', 'failed');
    }
  }

  return meetingDateMap;
}
