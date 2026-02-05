#!/usr/bin/env node
/**
 * SPAC PHP to Supabase Migration Script
 * Migrates members, applications, and OBS registrations from PHP MySQL export
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Membership type mapping from PHP to new schema
const MEMBERSHIP_TYPE_MAP = {
  'Life': 'LIFETIME',
  'Single': 'INDIVIDUAL',
  'Benefactor': 'INDIVIDUAL',  // Premium tier - track in notes
  'Family': 'FAMILY',
  'Patron': 'INDIVIDUAL',       // Premium tier - track in notes
  'Subscriber': 'FREE',
  'Student': 'STUDENT',
};

// Premium membership tiers (for tracking)
const PREMIUM_TIERS = ['Benefactor', 'Patron'];

// Generate a CUID-like ID
function generateId() {
  return 'c' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Parse phone number to consistent format
function parsePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return phone || null;
}

// Parse date, handling invalid dates
function parseDate(dateStr) {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') {
    return null;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// Determine membership status based on renewal date
function getMembershipStatus(renewDate, membershipType) {
  if (membershipType === 'Life' || membershipType === 'LIFETIME') {
    return 'ACTIVE';
  }
  if (!renewDate || renewDate === '0000-00-00') {
    return 'PENDING';
  }
  const renew = new Date(renewDate);
  const now = new Date();
  return renew > now ? 'ACTIVE' : 'EXPIRED';
}

async function loadPhpData(filePath) {
  console.log(`Loading PHP data from ${filePath}...`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);

  const tables = {};
  for (const item of json) {
    if (item.type === 'table') {
      tables[item.name] = item.data || [];
    }
  }
  return tables;
}

async function migrateMembers(tables) {
  console.log('\n=== Migrating Members ===');
  const members = tables.members || [];
  const applications = tables.application || [];

  // Combine members and applications, deduplicating by email
  const emailMap = new Map();

  // Process established members first (they take priority)
  for (const m of members) {
    const email = (m.email || m.pEmail || '').toLowerCase().trim();
    if (email && !emailMap.has(email)) {
      emailMap.set(email, { ...m, source: 'members', legacyId: m.memID });
    }
  }

  // Then process applications (only if email not already present)
  for (const a of applications) {
    const email = (a.pEmail || '').toLowerCase().trim();
    if (email && !emailMap.has(email)) {
      emailMap.set(email, { ...a, source: 'application', legacyId: a.appID });
    }
  }

  console.log(`Found ${emailMap.size} unique members/applicants`);

  const results = { success: 0, failed: 0, families: 0, errors: [] };
  const idMappings = [];

  for (const [email, record] of emailMap) {
    try {
      const userId = generateId();
      const membershipType = MEMBERSHIP_TYPE_MAP[record.membership] || 'INDIVIDUAL';
      const isPremium = PREMIUM_TIERS.includes(record.membership);

      // Create primary user
      const userData = {
        id: userId,
        email: email,
        first_name: record.pFirstName || 'Unknown',
        last_name: record.pLastName || 'Unknown',
        phone: parsePhone(record.pMobile || record.home),
        role: 'MEMBER',
        created_at: parseDate(record.joined) || new Date().toISOString(),
        updated_at: parseDate(record.ts) || new Date().toISOString(),
      };

      // Insert user
      const { error: userError } = await supabase
        .from('users')
        .insert(userData);

      if (userError) {
        results.failed++;
        results.errors.push({ email, error: userError.message });
        continue;
      }

      // Create membership record
      const renewDate = parseDate(record.renew);
      const membershipData = {
        id: generateId(),
        user_id: userId,
        type: membershipType,
        status: getMembershipStatus(record.renew, record.membership),
        start_date: parseDate(record.joined),
        end_date: renewDate,
        created_at: parseDate(record.joined) || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: membershipError } = await supabase
        .from('memberships')
        .insert(membershipData);

      if (membershipError) {
        console.warn(`Membership insert failed for ${email}: ${membershipError.message}`);
      }

      // Store ID mapping
      idMappings.push({
        id: generateId(),
        entity_type: record.source === 'members' ? 'member' : 'application',
        legacy_id: record.legacyId,
        new_id: userId,
      });

      // Handle family member (secondary person) if present
      if (record.cFirstName && record.cFirstName.trim()) {
        const familyUserId = generateId();
        const familyEmail = record.cEmail || `${email.split('@')[0]}.family@spac.org`;

        // Create family group if not exists
        const familyId = generateId();
        await supabase.from('families').insert({
          id: familyId,
          name: `${record.pLastName} Family`,
        });

        // Update primary member with family
        await supabase.from('users').update({
          family_id: familyId,
          family_role: 'PRIMARY',
        }).eq('id', userId);

        // Create family member
        const familyUserData = {
          id: familyUserId,
          email: familyEmail.toLowerCase(),
          first_name: record.cFirstName,
          last_name: record.cLastName || record.pLastName,
          phone: parsePhone(record.cMobile),
          role: 'MEMBER',
          family_id: familyId,
          family_role: 'SPOUSE',
          created_at: parseDate(record.joined) || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: familyError } = await supabase
          .from('users')
          .insert(familyUserData);

        if (!familyError) {
          results.families++;

          // Create membership for family member
          await supabase.from('memberships').insert({
            id: generateId(),
            user_id: familyUserId,
            type: 'FAMILY',
            status: getMembershipStatus(record.renew, 'Family'),
            start_date: parseDate(record.joined),
            end_date: renewDate,
          });
        }
      }

      results.success++;

      if (results.success % 50 === 0) {
        console.log(`  Processed ${results.success} members...`);
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ email, error: err.message });
    }
  }

  // Insert ID mappings in batches
  if (idMappings.length > 0) {
    for (let i = 0; i < idMappings.length; i += 100) {
      const batch = idMappings.slice(i, i + 100);
      await supabase.from('migration_id_mappings').insert(batch);
    }
  }

  console.log(`\nMembers migration complete:`);
  console.log(`  Success: ${results.success}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Family members created: ${results.families}`);

  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log('\nErrors:', results.errors);
  }

  return results;
}

async function migrateOBSEvents(tables) {
  console.log('\n=== Creating OBS Events ===');

  // Get admin user for event creation (or create system user)
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'ADMIN')
    .limit(1)
    .single();

  let creatorId;
  if (!adminUser) {
    // Create system user for migrations
    creatorId = generateId();
    await supabase.from('users').insert({
      id: creatorId,
      email: 'system@spac.org',
      first_name: 'System',
      last_name: 'Migration',
      role: 'ADMIN',
    });
  } else {
    creatorId = adminUser.id;
  }

  const obsYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const eventIds = {};

  for (const year of obsYears) {
    const eventId = generateId();
    eventIds[year] = eventId;

    // Typical OBS dates (November)
    const startDate = new Date(year, 10, 1, 17, 0, 0); // Nov 1
    const endDate = new Date(year, 10, 3, 12, 0, 0);   // Nov 3

    const eventData = {
      id: eventId,
      slug: `obs-${year}`,
      title: `Orange Blossom Special ${year}`,
      description: `The ${year} Orange Blossom Special star party at Withlacoochee River Park.`,
      type: 'OBS_SESSION',
      status: year <= 2024 ? 'COMPLETED' : 'PUBLISHED',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      timezone: 'America/New_York',
      location_name: 'Withlacoochee River Park',
      location_address: '12449 Withlacoochee Blvd, Dade City, FL 33525',
      location_lat: 28.3697,
      location_lng: -82.1656,
      camping_available: true,
      created_by_id: creatorId,
    };

    await supabase.from('events').insert(eventData);
    console.log(`  Created OBS ${year} event`);

    // Store mapping
    await supabase.from('migration_id_mappings').insert({
      id: generateId(),
      entity_type: 'obs_event',
      legacy_id: year.toString(),
      new_id: eventId,
    });
  }

  return eventIds;
}

async function migrateOBSRegistrations(tables, eventIds) {
  console.log('\n=== Migrating OBS Registrations ===');

  const results = { success: 0, failed: 0 };

  for (const year of Object.keys(eventIds)) {
    const attendeesTable = `obs${year}attendees`;
    const attendees = tables[attendeesTable] || [];

    if (attendees.length === 0) continue;

    console.log(`  Processing ${attendees.length} registrations for OBS ${year}...`);

    for (const attendee of attendees) {
      try {
        const email = (attendee.email || attendee.pEmail || '').toLowerCase().trim();
        if (!email) continue;

        // Find user by email
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .limit(1)
          .single();

        if (!user) {
          // User not found, skip (they may not have been migrated)
          continue;
        }

        const registrationData = {
          id: generateId(),
          event_id: eventIds[year],
          user_id: user.id,
          status: attendee.checkedIn === '1' || attendee.checkedIn === 1 ? 'ATTENDED' : 'CONFIRMED',
          guest_count: parseInt(attendee.numGuests || attendee.guests || 0) || 0,
          camping_requested: attendee.camping === '1' || attendee.camping === 1 || attendee.camping === 'Yes',
          notes: attendee.comments || null,
          created_at: parseDate(attendee.ts || attendee.regDate) || new Date().toISOString(),
        };

        // Check if registration already exists
        const { data: existing } = await supabase
          .from('registrations')
          .select('id')
          .eq('event_id', eventIds[year])
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('registrations')
            .insert(registrationData);

          if (!error) {
            results.success++;
          } else {
            results.failed++;
          }
        }
      } catch (err) {
        results.failed++;
      }
    }
  }

  console.log(`\nOBS registrations migration complete:`);
  console.log(`  Success: ${results.success}`);
  console.log(`  Failed/Skipped: ${results.failed}`);

  return results;
}

async function main() {
  console.log('========================================');
  console.log('SPAC PHP to Supabase Migration');
  console.log('========================================\n');

  const phpDataPath = process.argv[2] || path.join(__dirname, '..', 'Old PHP DB', '12-3-25', 'localhost.json');

  if (!fs.existsSync(phpDataPath)) {
    console.error(`PHP data file not found: ${phpDataPath}`);
    process.exit(1);
  }

  try {
    // Load PHP data
    const tables = await loadPhpData(phpDataPath);

    // Migrate members
    const memberResults = await migrateMembers(tables);

    // Create OBS events and migrate registrations
    const eventIds = await migrateOBSEvents(tables);
    const obsResults = await migrateOBSRegistrations(tables, eventIds);

    // Summary
    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`Members: ${memberResults.success} migrated, ${memberResults.failed} failed`);
    console.log(`Family members: ${memberResults.families} created`);
    console.log(`OBS Events: ${Object.keys(eventIds).length} created`);
    console.log(`OBS Registrations: ${obsResults.success} migrated`);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
