/**
 * SPAC Legacy PHP Database Migration Script
 *
 * Migrates data from the old MariaDB dump (localhost.sql) into PostgreSQL via Prisma.
 * Covers: members, board members, meetings, motions, OBS, sponsors, outreach.
 *
 * Usage: npx tsx scripts/migrate-php-data.ts [path-to-sql-file]
 * Default path: ./Old PHP DB/12-3-25/localhost.sql
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { parseSqlDump } from './migration/sql-parser';
import { migrateMembers } from './migration/migrate-members';
import { migrateBoardMembers } from './migration/migrate-board';
import { migrateMeetings } from './migration/migrate-meetings';
import { migrateMotions } from './migration/migrate-motions';
import { migrateOBS } from './migration/migrate-obs';
import { migrateSponsors } from './migration/migrate-sponsors';
import { migrateOutreach } from './migration/migrate-outreach';
import { MigrationLogger } from './migration/utils';

const prisma = new PrismaClient({ log: ['error'] });
const logger = new MigrationLogger();

async function main() {
  const sqlPath = process.argv[2] || path.join(process.cwd(), 'Old PHP DB', '12-3-25', 'localhost.sql');

  logger.section('SPAC Legacy Data Migration');
  logger.info(`SQL dump: ${sqlPath}`);
  logger.info(`Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED'}`);
  logger.info(`Started: ${new Date().toISOString()}`);

  // Phase 0: Parse SQL dump
  logger.section('Phase 0: Parsing SQL Dump');
  const tables = parseSqlDump(sqlPath);
  logger.info(`Parsed ${tables.size} tables:`);
  for (const [name, rows] of tables) {
    logger.info(`  ${name}: ${rows.length} rows`);
  }

  // Phase 1: Members & Families (must be first - other entities reference users)
  logger.section('Phase 1: Members & Families');
  const { systemUserId, memberIdMap } = await migrateMembers(prisma, tables, logger);
  logger.info(`Member ID map size: ${memberIdMap.size}`);

  // Phase 2: Board Members (depends on member mappings)
  logger.section('Phase 2: Board Members');
  await migrateBoardMembers(prisma, tables, memberIdMap, logger);

  // Phase 3: Meeting Minutes
  logger.section('Phase 3: Meeting Minutes');
  const meetingDateMap = await migrateMeetings(prisma, tables, systemUserId, logger);

  // Phase 4: Motions (depends on meeting records)
  logger.section('Phase 4: Motions');
  await migrateMotions(prisma, tables, meetingDateMap, systemUserId, logger);

  // Phase 5: OBS Configs, Registrations, & Financials
  logger.section('Phase 5: OBS Data');
  await migrateOBS(prisma, tables, logger);

  // Phase 6: OBS Sponsors
  logger.section('Phase 6: OBS Sponsors');
  await migrateSponsors(prisma, tables, logger);

  // Phase 7: Outreach Committee (depends on member mappings)
  logger.section('Phase 7: Outreach Committee');
  await migrateOutreach(prisma, tables, memberIdMap, logger);

  // Final summary
  logger.summary();

  // Print database counts
  logger.section('DATABASE COUNTS');
  const counts = {
    users: await prisma.user.count(),
    memberships: await prisma.membership.count(),
    families: await prisma.family.count(),
    boardMembers: await prisma.boardMember.count(),
    meetingMinutes: await prisma.meetingMinutes.count(),
    motions: await prisma.motion.count(),
    obsConfigs: await prisma.oBSConfig.count(),
    obsRegistrations: await prisma.oBSRegistration.count(),
    obsFinancials: await prisma.oBSFinancial.count(),
    outreachMembers: await prisma.outreachCommitteeMember.count(),
    migrationMappings: await prisma.migrationIdMapping.count(),
  };
  for (const [key, count] of Object.entries(counts)) {
    logger.info(`  ${key}: ${count}`);
  }

  logger.info(`\nCompleted: ${new Date().toISOString()}`);
}

main()
  .catch((err) => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
