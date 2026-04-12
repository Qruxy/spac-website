/**
 * scripts/import-legacy-members.ts
 *
 * Imports legacy member data from the old PHP/MySQL DB export.
 * Matches by pEmail (case-insensitive) to current users.
 * ONLY fills in NULL/empty fields — never overwrites existing data.
 * NEVER touches passwordHash or any auth fields.
 *
 * Run: npx tsx scripts/import-legacy-members.ts
 * Safe to re-run (idempotent).
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface LegacyMember {
  memID?: string;
  appID?: string;
  pEmail?: string;
  email?: string;
  pFirstName?: string;
  pLastName?: string;
  cFirstName?: string;
  cLastName?: string;
  cEmail?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  home?: string;
  pMobile?: string;
  cMobile?: string;
  joined?: string;
  renew?: string;
  membership?: string;
}

function nullIfEmpty(v: string | undefined | null): string | null {
  if (!v || v.trim() === '' || v === '0000-00-00') return null;
  return v.trim();
}

function parseDateSafe(v: string | undefined | null): Date | null {
  const s = nullIfEmpty(v);
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  // Reject obviously bogus dates
  if (d.getFullYear() < 1950 || d.getFullYear() > 2100) return null;
  return d;
}

async function main() {
  // Load legacy data
  const dataPath = path.join(__dirname, 'legacy-db-export.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌  scripts/legacy-db-export.json not found.');
    console.error('    Export your legacy DB and save it to that path, then re-run.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as {
    members?: LegacyMember[];
    application?: LegacyMember[];
  };

  const members: LegacyMember[] = raw.members ?? [];
  const applications: LegacyMember[] = raw.application ?? [];

  console.log(`Loaded ${members.length} members, ${applications.length} applications from legacy export.`);

  // Build a deduplicated list: members first (primary), then application entries
  // not already covered by email match from members.
  const memberEmails = new Set(
    members
      .map((m) => (m.pEmail ?? m.email ?? '').toLowerCase())
      .filter(Boolean)
  );

  const appOnlyRecords = applications.filter((a) => {
    const e = (a.pEmail ?? '').toLowerCase();
    return e && e !== 'testing@gmail.com' && !memberEmails.has(e);
  });

  const allLegacy: LegacyMember[] = [
    ...members.filter((m) => {
      const e = (m.pEmail ?? m.email ?? '').toLowerCase();
      return e && e !== 'testing@gmail.com';
    }),
    ...appOnlyRecords,
  ];

  console.log(`Processing ${allLegacy.length} unique legacy records.\n`);

  let matched = 0;
  let updated = 0;
  let skipped = 0; // no match in live DB
  let noChange = 0; // match found, all fields already populated
  let errors = 0;

  for (const legacy of allLegacy) {
    const email = nullIfEmpty(legacy.pEmail ?? legacy.email);
    if (!email) {
      skipped++;
      continue;
    }

    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { membership: true },
      });

      if (!user) {
        skipped++;
        continue;
      }

      matched++;

      // Build update payload — only set fields that are currently null/empty
      const userUpdate: Record<string, unknown> = {};

      if (!user.street && nullIfEmpty(legacy.street))
        userUpdate.street = nullIfEmpty(legacy.street);
      if (!user.city && nullIfEmpty(legacy.city))
        userUpdate.city = nullIfEmpty(legacy.city);
      if (!user.state && nullIfEmpty(legacy.state))
        userUpdate.state = nullIfEmpty(legacy.state);
      if (!user.zip && nullIfEmpty(legacy.zip))
        userUpdate.zip = nullIfEmpty(legacy.zip);
      if (!user.homePhone && nullIfEmpty(legacy.home))
        userUpdate.homePhone = nullIfEmpty(legacy.home);
      if (!user.phone && nullIfEmpty(legacy.pMobile))
        userUpdate.phone = nullIfEmpty(legacy.pMobile);
      if (!user.companionFirstName && nullIfEmpty(legacy.cFirstName))
        userUpdate.companionFirstName = nullIfEmpty(legacy.cFirstName);
      if (!user.companionLastName && nullIfEmpty(legacy.cLastName))
        userUpdate.companionLastName = nullIfEmpty(legacy.cLastName);
      if (!user.companionMobile && nullIfEmpty(legacy.cMobile))
        userUpdate.companionMobile = nullIfEmpty(legacy.cMobile);
      if (!user.companionEmail && nullIfEmpty(legacy.cEmail))
        userUpdate.companionEmail = nullIfEmpty(legacy.cEmail);

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: userUpdate });
      }

      // Membership start date — only set if null
      const joinedDate = parseDateSafe(legacy.joined);
      if (joinedDate && user.membership && !user.membership.startDate) {
        await prisma.membership.update({
          where: { id: user.membership.id },
          data: { startDate: joinedDate },
        });
        userUpdate.__membershipStartDate = joinedDate.toISOString().split('T')[0];
      }

      if (Object.keys(userUpdate).length > 0) {
        const fieldsUpdated = Object.keys(userUpdate).join(', ');
        console.log(`✅  ${email} → updated: ${fieldsUpdated}`);
        updated++;
      } else {
        noChange++;
      }
    } catch (err) {
      console.error(`❌  Error processing ${email}:`, err);
      errors++;
    }
  }

  console.log('\n───────────────────────────────────');
  console.log(`Total legacy records:  ${allLegacy.length}`);
  console.log(`Matched in live DB:    ${matched}`);
  console.log(`Updated:               ${updated}`);
  console.log(`Already complete:      ${noChange}`);
  console.log(`No match (skipped):    ${skipped}`);
  console.log(`Errors:                ${errors}`);
  console.log('───────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
