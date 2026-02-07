/**
 * Fix Companion Emails
 *
 * Replaces synthetic `+companion@` emails with real companion emails
 * from the legacy SQL dump data.
 */

import { PrismaClient } from '@prisma/client';
import { parseSqlDump } from './migration/sql-parser';
import type { LegacyMember } from './migration/types';
import { extractEmail } from './migration/utils';

const SQL_PATH = process.argv[2] || './Old PHP DB/12-3-25/localhost.sql';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Parse legacy data to get real companion emails
    const tables = parseSqlDump(SQL_PATH);
    const members = (tables.get('members') || []) as unknown as LegacyMember[];

    // Build map: legacyMemberId -> cEmail
    const companionEmailMap = new Map<string, string>();
    for (const m of members) {
      const cEmail = extractEmail(m.cEmail);
      const pEmail = extractEmail(m.pEmail);
      if (cEmail && cEmail !== pEmail) {
        companionEmailMap.set(String(m.memID), cEmail);
      }
    }
    console.log(`Found ${companionEmailMap.size} members with distinct companion emails in legacy data`);

    // Find all users with synthetic +companion@ emails
    const syntheticUsers = await prisma.user.findMany({
      where: {
        email: { contains: '+companion@' },
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    console.log(`Found ${syntheticUsers.length} users with synthetic +companion@ emails`);

    let fixed = 0;
    let skipped = 0;

    for (const user of syntheticUsers) {
      // Find the migration mapping to get the legacy ID
      const mapping = await prisma.migrationIdMapping.findFirst({
        where: {
          entity_type: 'member_companion',
          newId: user.id,
        },
      });

      if (!mapping) {
        console.log(`  SKIP: ${user.email} - no migration mapping found`);
        skipped++;
        continue;
      }

      // Extract the original member ID from the companion legacy ID (format: "123_companion")
      const legacyMemberId = mapping.legacyId.replace('_companion', '');
      const realEmail = companionEmailMap.get(legacyMemberId);

      if (!realEmail) {
        console.log(`  SKIP: ${user.email} - no real companion email in legacy data for member ${legacyMemberId}`);
        skipped++;
        continue;
      }

      // Check the real email isn't already taken
      const existing = await prisma.user.findUnique({ where: { email: realEmail } });
      if (existing) {
        console.log(`  SKIP: ${user.email} - real email ${realEmail} already in use by user ${existing.id}`);
        skipped++;
        continue;
      }

      // Update to real email
      await prisma.user.update({
        where: { id: user.id },
        data: { email: realEmail },
      });
      console.log(`  FIXED: ${user.email} -> ${realEmail} (${user.firstName} ${user.lastName})`);
      fixed++;
    }

    console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
