/**
 * OBS Migration: obsVariables -> OBSConfig, obsFinancials -> OBSFinancial,
 * obsApplications/obsApplications2025 -> OBSRegistration,
 * obs2020-2026 attendees -> OBSRegistration (historical)
 */

import type { PrismaClient } from '@prisma/client';
import type {
  ParsedTables,
  LegacyOBSVariable,
  LegacyOBSFinancial,
  LegacyOBSApplication,
} from './types';
import { parseDate, parsePhone, MigrationLogger } from './utils';

export async function migrateOBS(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
) {
  await migrateOBSConfigs(prisma, tables, logger);
  await migrateOBSFinancials(prisma, tables, logger);
  await migrateOBSApplications(prisma, tables, 'obsApplications', 2026, logger);
  await migrateOBSApplications(prisma, tables, 'obsApplications2025', 2025, logger);
  await migrateHistoricalAttendees(prisma, tables, logger);
}

async function migrateOBSConfigs(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
) {
  const variables = (tables.get('obsVariables') || []) as unknown as LegacyOBSVariable[];
  logger.info(`Source: ${variables.length} OBS config years`);

  for (const v of variables) {
    try {
      const existing = await prisma.oBSConfig.findUnique({ where: { year: v.year } });
      if (existing) {
        logger.track('obs_configs', 'skipped');
        continue;
      }

      const startDate = parseDate(v.obsStart);
      if (!startDate) {
        logger.warn(`OBS ${v.year}: no valid start date`);
        logger.track('obs_configs', 'failed');
        continue;
      }

      // End date is typically 4 days after start (Wed-Sun)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4);

      await prisma.oBSConfig.create({
        data: {
          year: v.year,
          eventName: `Orange Blossom Special ${v.year}`,
          startDate,
          endDate,
          registrationOpens: parseDate(v.regOpens) || new Date(startDate.getFullYear() - 1, 9, 1),
          registrationCloses: parseDate(v.regCloses) || startDate,
          location: 'Withlacoochee River Park, Dade City, FL',
          memberPrice: v.primary_fee || 30,
          nonMemberPrice: (v.primary_fee || 30) * 2,
          mealPrice: v.satMealPrice || 20,
          capacity: 200,
          isActive: v.year === 2026,
        },
      });

      logger.track('obs_configs', 'success');
    } catch (err) {
      logger.error(`Failed to migrate OBS config ${v.year}`, err);
      logger.track('obs_configs', 'failed');
    }
  }
}

async function migrateOBSFinancials(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
) {
  const financials = (tables.get('obsFinancials') || []) as unknown as LegacyOBSFinancial[];
  logger.info(`Source: ${financials.length} OBS financial years`);

  const categories = [
    { key: 'regFee', category: 'Registration', description: 'Registration fee income' },
    { key: 'cabinFee', category: 'Cabin', description: 'Cabin fee income' },
    { key: 'extraNightsFee', category: 'Extra Nights', description: 'Extra camping nights income' },
    { key: 'mealsFee', category: 'Meals', description: 'Saturday meal income' },
    { key: 'lateFee', category: 'Late Fees', description: 'Late registration fee income' },
  ] as const;

  for (const f of financials) {
    const config = await prisma.oBSConfig.findUnique({ where: { year: f.year } });
    if (!config) {
      logger.warn(`OBS financial ${f.year}: no config found`);
      continue;
    }

    for (const cat of categories) {
      const amount = f[cat.key] as number;
      if (!amount || amount === 0) continue;

      const legacyKey = `obsfinancial_${f.year}_${cat.key}`;

      try {
        const existing = await prisma.migrationIdMapping.findUnique({
          where: { entity_type_legacyId: { entity_type: 'obs_financial', legacyId: legacyKey } },
        });
        if (existing) {
          logger.track('obs_financials', 'skipped');
          continue;
        }

        const record = await prisma.oBSFinancial.create({
          data: {
            obsConfigId: config.id,
            category: cat.category,
            description: cat.description,
            amount,
            isIncome: true,
            date: config.startDate,
          },
        });

        await prisma.migrationIdMapping.upsert({
          where: { entity_type_legacyId: { entity_type: 'obs_financial', legacyId: legacyKey } },
          update: { newId: record.id },
          create: { entity_type: 'obs_financial', legacyId: legacyKey, newId: record.id },
        });

        logger.track('obs_financials', 'success');
      } catch (err) {
        logger.error(`Failed to migrate OBS financial ${legacyKey}`, err);
        logger.track('obs_financials', 'failed');
      }
    }
  }
}

async function migrateOBSApplications(
  prisma: PrismaClient,
  tables: ParsedTables,
  tableName: string,
  year: number,
  logger: MigrationLogger
) {
  const apps = (tables.get(tableName) || []) as unknown as LegacyOBSApplication[];
  logger.info(`Source: ${apps.length} ${tableName} registrations`);

  const config = await prisma.oBSConfig.findUnique({ where: { year } });
  if (!config) {
    logger.warn(`No OBSConfig for year ${year}, skipping ${tableName}`);
    return;
  }

  for (const app of apps) {
    try {
      const legacyKey = `${tableName}_${app.appID}`;
      const existing = await prisma.migrationIdMapping.findUnique({
        where: { entity_type_legacyId: { entity_type: 'obs_registration', legacyId: legacyKey } },
      });
      if (existing) {
        logger.track('obs_registrations', 'skipped');
        continue;
      }

      // Try to find user by email
      const email = app.email?.toLowerCase().trim();
      const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

      const isStaff = (app.title?.toLowerCase().includes('staff') || app.title?.toLowerCase().includes('chair')) && app.sort === 7;
      const amountPaid = (app.registration_ext || 0) + (app.camping_ext || 0) + (app.meals_ext || 0) + (app.membership_ext || 0);

      // Build notes with companion/camping details
      const notes: string[] = [];
      if (app.cFirstName?.trim()) notes.push(`Companion: ${app.cFirstName} ${app.cLastName || ''}`);
      if (app.Camper_Type) notes.push(`Camper: ${app.Camper_Type}`);
      if (app.rvLength) notes.push(`RV Length: ${app.rvLength}ft`);
      if (app.minor1?.trim()) notes.push(`Minor: ${app.minor1} (age ${app.minor1age})`);
      if (app.minor2?.trim()) notes.push(`Minor: ${app.minor2} (age ${app.minor2age})`);

      const record = await prisma.oBSRegistration.create({
        data: {
          obsConfigId: config.id,
          firstName: app.pFirstName?.trim() || 'Unknown',
          lastName: app.pLastName?.trim() || 'Unknown',
          email: email || 'unknown@unknown.com',
          phone: parsePhone(app.pMobile) || parsePhone(app.home),
          address: app.street || null,
          city: app.city || null,
          state: app.state || null,
          zip: app.zip || null,
          isMember: app.Member === 'Yes',
          userId: user?.id || null,
          registrationType: isStaff ? 'VOLUNTEER' : 'ATTENDEE',
          campingRequested: app.campingType !== 'No' && app.campingType !== 'NA',
          mealRequested: (app.satMealQty || 0) > 0,
          arrivalDate: parseDate(app.arrival),
          departureDate: parseDate(app.depart),
          amountPaid,
          paymentStatus: app.acceptance === 'Accepted' ? 'PAID' : 'PENDING',
          notes: notes.length > 0 ? notes.join('; ') : null,
        },
      });

      await prisma.migrationIdMapping.upsert({
        where: { entity_type_legacyId: { entity_type: 'obs_registration', legacyId: legacyKey } },
        update: { newId: record.id },
        create: { entity_type: 'obs_registration', legacyId: legacyKey, newId: record.id },
      });

      logger.track('obs_registrations', 'success');
    } catch (err) {
      logger.error(`Failed to migrate ${tableName} ${app.appID}`, err);
      logger.track('obs_registrations', 'failed');
    }
  }
}

async function migrateHistoricalAttendees(
  prisma: PrismaClient,
  tables: ParsedTables,
  logger: MigrationLogger
) {
  // Process simplified attendee tables (2021-2026)
  const attendeeTables = [
    'obs2021attendees', 'obs2022attendees', 'obs2023attendees',
    'obs2024attendees', 'obs2025attendees', 'obs2026attendees',
  ];

  for (const tableName of attendeeTables) {
    const rows = tables.get(tableName) || [];
    if (rows.length === 0) continue;

    const yearMatch = tableName.match(/obs(\d{4})/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[1]);

    const config = await prisma.oBSConfig.findUnique({ where: { year } });
    if (!config) {
      logger.warn(`No OBSConfig for year ${year}, skipping ${tableName}`);
      continue;
    }

    logger.info(`Source: ${rows.length} ${tableName} attendees`);

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx] as Record<string, unknown>;
      const email = (row.email as string)?.toLowerCase().trim();
      if (!email) continue;

      const legacyKey = `${tableName}_${idx}`;

      try {
        const existing = await prisma.migrationIdMapping.findUnique({
          where: { entity_type_legacyId: { entity_type: 'obs_hist_attendee', legacyId: legacyKey } },
        });
        if (existing) {
          logger.track('obs_hist_attendees', 'skipped');
          continue;
        }

        // Check for duplicate registration (same email + same config)
        const dupe = await prisma.oBSRegistration.findFirst({
          where: { obsConfigId: config.id, email },
        });
        if (dupe) {
          logger.track('obs_hist_attendees', 'skipped');
          continue;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        const record = await prisma.oBSRegistration.create({
          data: {
            obsConfigId: config.id,
            firstName: user?.firstName || 'Unknown',
            lastName: user?.lastName || 'Unknown',
            email,
            userId: user?.id || null,
            isMember: true,
            registrationType: 'ATTENDEE',
            paymentStatus: (row.status as string) === 'Paid' ? 'PAID' : 'PENDING',
            notes: `Legacy ${tableName} import`,
          },
        });

        await prisma.migrationIdMapping.upsert({
          where: { entity_type_legacyId: { entity_type: 'obs_hist_attendee', legacyId: legacyKey } },
          update: { newId: record.id },
          create: { entity_type: 'obs_hist_attendee', legacyId: legacyKey, newId: record.id },
        });

        logger.track('obs_hist_attendees', 'success');
      } catch (err) {
        logger.error(`Failed to migrate ${tableName} attendee ${email}`, err);
        logger.track('obs_hist_attendees', 'failed');
      }
    }
  }
}
