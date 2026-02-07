/**
 * OBS Sponsors Migration: obsSponsors -> OBSSponsor
 */

import type { PrismaClient } from '@prisma/client';
import type { ParsedTables, LegacyOBSSponsor } from './types';
import { MigrationLogger } from './utils';

export async function migrateSponsors(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
) {
  const sponsors = (tables.get('obsSponsors') || []) as unknown as LegacyOBSSponsor[];
  logger.info(`Source: ${sponsors.length} OBS sponsors`);

  for (const sponsor of sponsors) {
    try {
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'obs_sponsor', legacyId: String(sponsor.id) } },
      });
      if (existing) {
        logger.track('obs_sponsors', 'skipped');
        continue;
      }

      const record = await (prisma as any).oBSSponsor.create({
        data: {
          name: sponsor.sponsor,
          website: sponsor.website || null,
          sortOrder: sponsor.sort,
          isActive: true,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'obs_sponsor', legacyId: String(sponsor.id) } },
        update: { newId: record.id },
        create: { entity_type: 'obs_sponsor', legacyId: String(sponsor.id), newId: record.id },
      });

      logger.track('obs_sponsors', 'success');
    } catch (err) {
      logger.error(`Failed to migrate sponsor ${sponsor.id} (${sponsor.sponsor})`, err);
      logger.track('obs_sponsors', 'failed');
    }
  }
}
