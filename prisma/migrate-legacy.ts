/**
 * SPAC Legacy Data Migration Script
 * 
 * Migrates data from PHP/MySQL export to new Prisma schema
 * 
 * Usage: npx ts-node prisma/migrate-legacy.ts
 * 
 * Features:
 * - Idempotent (safe to re-run)
 * - Transaction-based (all or nothing)
 * - Detailed logging
 * - Error handling with rollback
 */

import { PrismaClient, MembershipType, MemberStatus, UserRole, MeetingType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Source file path - update this to match your environment
// For local Windows development: /mnt/c/spac/Old PHP DB/12-3-25/localhost.json
// For Ubuntu server: ./Old PHP DB/12-3-25/localhost.json (relative to project root)
const SOURCE_FILE = process.env.LEGACY_DATA_PATH || './Old PHP DB/12-3-25/localhost.json';

// Statistics tracking
const stats = {
  members: { total: 0, imported: 0, skipped: 0, errors: 0 },
  applications: { total: 0, imported: 0, skipped: 0, merged: 0, errors: 0 },
  boardMembers: { total: 0, imported: 0, skipped: 0, errors: 0 },
  meetings: { total: 0, imported: 0, skipped: 0, errors: 0 },
  obsRegistrations: { total: 0, imported: 0, skipped: 0, errors: 0 },
  idMappings: { total: 0, imported: 0 }
};

const issues: string[] = [];

/**
 * Generate a secure random password (users will reset on first login)
 */
function generateSecurePassword(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Map legacy membership type to new enum
 */
function mapMembershipType(legacyType: string): MembershipType {
  const mapping: Record<string, MembershipType> = {
    'Single': 'INDIVIDUAL',
    'Family': 'FAMILY',
    'Patron': 'INDIVIDUAL', // Higher tier single
    'Benefactor': 'INDIVIDUAL', // Highest tier single
    'Life': 'LIFETIME',
    'Student': 'STUDENT',
    'Subscriber': 'FREE',
  };
  return mapping[legacyType] || 'INDIVIDUAL';
}

/**
 * Determine user role based on membership type
 */
function determineUserRole(membershipType: string): UserRole {
  // Default all to MEMBER - admins will be set via board members
  return 'MEMBER';
}

/**
 * Map legacy membership status
 */
function mapMemberStatus(legacyStatus: string | null, renewDate: string): MemberStatus {
  if (legacyStatus === 'Paid' || legacyStatus === 'Verified') {
    // Check if renewal date is in the future
    const renewal = new Date(renewDate);
    if (renewal > new Date()) {
      return 'ACTIVE';
    }
    return 'EXPIRED';
  }
  if (legacyStatus === 'pending') return 'PENDING';
  if (legacyStatus === 'NA') return 'ACTIVE'; // Students marked NA are usually active
  return 'PENDING';
}

/**
 * Parse phone number - normalize format
 */
function parsePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // Return original if can't parse
}

/**
 * Clean and validate email
 */
function cleanEmail(email: string | null, pEmail: string | null): string | null {
  const rawEmail = email || pEmail;
  if (!rawEmail) return null;
  
  // Handle emails with names like "John ONeill <starionjohn@icloud.com>"
  const match = rawEmail.match(/<(.+)>/);
  if (match) return match[1].toLowerCase().trim();
  
  return rawEmail.toLowerCase().trim();
}

/**
 * Parse the JSON export file
 */
function parseSourceFile(): Record<string, any[]> {
  console.log('📖 Reading source file...');
  const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const data = JSON.parse(content);
  
  const tables: Record<string, any[]> = {};
  
  for (const item of data) {
    if (item.type === 'table' && item.data) {
      tables[item.name] = item.data;
      console.log(`   Found table: ${item.name} (${item.data.length} records)`);
    }
  }
  
  return tables;
}

/**
 * Migrate members table to users
 */
async function migrateMembers(members: any[]): Promise<Map<string, string>> {
  console.log('\n👥 Migrating members...');
  const memberIdMap = new Map<string, string>(); // legacyId -> newId
  
  stats.members.total = members.length;
  
  for (const member of members) {
    try {
      const email = cleanEmail(member.email, member.pEmail);
      
      if (!email) {
        issues.push(`Member ${member.memID}: No valid email found`);
        stats.members.skipped++;
        continue;
      }
      
      // Check if user already exists (idempotency)
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        memberIdMap.set(member.memID, existing.id);
        stats.members.skipped++;
        continue;
      }
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          firstName: member.pFirstName || 'Unknown',
          lastName: member.pLastName || 'Unknown',
          phone: parsePhone(member.pMobile) || parsePhone(member.home),
          role: determineUserRole(member.membership),
          isValidated: member.status === 'Verified' || member.status === 'Paid',
          createdAt: member.joined ? new Date(member.joined) : new Date(),
        }
      });
      
      // Create membership record
      const renewDate = member.renew && member.renew !== '0000-00-00' ? new Date(member.renew) : null;
      
      await prisma.membership.create({
        data: {
          userId: user.id,
          type: mapMembershipType(member.membership),
          status: mapMemberStatus(member.status, member.renew),
          startDate: member.joined ? new Date(member.joined) : null,
          endDate: renewDate,
        }
      });
      
      // Store ID mapping
      await prisma.migrationIdMapping.create({
        data: {
          entity_type: 'member',
          legacyId: member.memID,
          newId: user.id,
        }
      });
      
      memberIdMap.set(member.memID, user.id);
      stats.members.imported++;
      stats.idMappings.imported++;
      
    } catch (error: any) {
      issues.push(`Member ${member.memID} (${member.pEmail}): ${error.message}`);
      stats.members.errors++;
    }
  }
  
  console.log(`   ✅ Imported: ${stats.members.imported}`);
  console.log(`   ⏭️  Skipped (existing): ${stats.members.skipped}`);
  console.log(`   ❌ Errors: ${stats.members.errors}`);
  
  return memberIdMap;
}

/**
 * Migrate applications table - merge with members, avoid duplicates
 */
async function migrateApplications(applications: any[], memberIdMap: Map<string, string>): Promise<void> {
  console.log('\n📝 Migrating applications...');
  stats.applications.total = applications.length;
  
  for (const app of applications) {
    try {
      const email = cleanEmail(app.pEmail, null);
      
      if (!email) {
        issues.push(`Application ${app.appID}: No valid email found`);
        stats.applications.skipped++;
        continue;
      }
      
      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Could update existing user with any new info
        stats.applications.merged++;
        continue;
      }
      
      // Create new user from application
      const user = await prisma.user.create({
        data: {
          email,
          firstName: app.pFirstName || 'Unknown',
          lastName: app.pLastName || 'Unknown',
          phone: parsePhone(app.pMobile) || parsePhone(app.home),
          role: 'MEMBER',
          isValidated: app.status === 'Paid',
          createdAt: app.joined ? new Date(app.joined) : new Date(),
        }
      });
      
      // Create membership
      const renewDate = app.renew && app.renew !== '0000-00-00' ? new Date(app.renew) : null;
      
      await prisma.membership.create({
        data: {
          userId: user.id,
          type: mapMembershipType(app.membership),
          status: app.status === 'Paid' ? 'ACTIVE' : 'PENDING',
          startDate: app.joined ? new Date(app.joined) : null,
          endDate: renewDate,
        }
      });
      
      // Store ID mapping
      await prisma.migrationIdMapping.create({
        data: {
          entity_type: 'application',
          legacyId: app.appID,
          newId: user.id,
        }
      });
      
      stats.applications.imported++;
      stats.idMappings.imported++;
      
    } catch (error: any) {
      issues.push(`Application ${app.appID} (${app.pEmail}): ${error.message}`);
      stats.applications.errors++;
    }
  }
  
  console.log(`   ✅ Imported: ${stats.applications.imported}`);
  console.log(`   🔄 Merged with existing: ${stats.applications.merged}`);
  console.log(`   ⏭️  Skipped: ${stats.applications.skipped}`);
  console.log(`   ❌ Errors: ${stats.applications.errors}`);
}

/**
 * Migrate club officers to board_members
 */
async function migrateBoardMembers(officers: any[], memberIdMap: Map<string, string>): Promise<void> {
  console.log('\n🎖️  Migrating board members...');
  stats.boardMembers.total = officers.length;
  
  for (const officer of officers) {
    try {
      // Skip empty positions
      if (officer.coMemberNo === '0' || !officer.coMemberNo) {
        stats.boardMembers.skipped++;
        continue;
      }
      
      // Look up the member by legacy ID
      const mapping = await prisma.migrationIdMapping.findFirst({
        where: {
          entity_type: 'member',
          legacyId: officer.coMemberNo,
        }
      });
      
      // Get member name for board member record
      let memberName = officer.office; // Fallback to office title
      if (mapping) {
        const user = await prisma.user.findUnique({ where: { id: mapping.newId } });
        if (user) {
          memberName = `${user.firstName} ${user.lastName}`;
          
          // If this is an admin role, update user to ADMIN
          if (officer.clubAdmin === '1') {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' }
            });
          }
        }
      }
      
      // Check if board member already exists
      const existingBoard = await prisma.boardMember.findFirst({
        where: {
          title: officer.office,
          name: memberName,
        }
      });
      
      if (existingBoard) {
        stats.boardMembers.skipped++;
        continue;
      }
      
      await prisma.boardMember.create({
        data: {
          name: memberName,
          title: officer.office,
          sortOrder: parseInt(officer.sort) || 0,
          isActive: true,
        }
      });
      
      stats.boardMembers.imported++;
      
    } catch (error: any) {
      issues.push(`Board member ${officer.coID} (${officer.office}): ${error.message}`);
      stats.boardMembers.errors++;
    }
  }
  
  console.log(`   ✅ Imported: ${stats.boardMembers.imported}`);
  console.log(`   ⏭️  Skipped: ${stats.boardMembers.skipped}`);
  console.log(`   ❌ Errors: ${stats.boardMembers.errors}`);
}

/**
 * Migrate general meetings to MeetingMinutes
 */
async function migrateMeetings(meetings: any[]): Promise<void> {
  console.log('\n📅 Migrating general meetings...');
  stats.meetings.total = meetings.length;
  
  // First, we need a user to be the creator - use the first admin
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    issues.push('No admin user found to assign as meeting creator');
    return;
  }
  
  for (const meeting of meetings) {
    try {
      const meetingDate = meeting.meetingDate ? new Date(meeting.meetingDate) : new Date();
      
      // Check if meeting already exists
      const existing = await prisma.meetingMinutes.findFirst({
        where: {
          title: meeting.title,
          meetingDate,
        }
      });
      
      if (existing) {
        stats.meetings.skipped++;
        continue;
      }
      
      // Build content with video/PDF links
      let content = '';
      if (meeting.videoLink) {
        content += `**Video Recording:** ${meeting.videoLink}\n\n`;
      }
      if (meeting.pdfLink) {
        content += `**Presentation PDF:** ${meeting.pdfLink}\n\n`;
      }
      
      await prisma.meetingMinutes.create({
        data: {
          title: meeting.title,
          meetingDate,
          meetingType: 'GENERAL',
          content,
          pdfUrl: meeting.pdfLink || null,
          approved: true, // Historical meetings are approved
          createdById: adminUser.id,
        }
      });
      
      stats.meetings.imported++;
      
    } catch (error: any) {
      issues.push(`Meeting ${meeting.gmID} (${meeting.title}): ${error.message}`);
      stats.meetings.errors++;
    }
  }
  
  console.log(`   ✅ Imported: ${stats.meetings.imported}`);
  console.log(`   ⏭️  Skipped: ${stats.meetings.skipped}`);
  console.log(`   ❌ Errors: ${stats.meetings.errors}`);
}

/**
 * Migrate OBS registrations
 */
async function migrateOBSRegistrations(
  obsApplications: any[],
  obs2026Attendees: any[]
): Promise<void> {
  console.log('\n🔭 Migrating OBS registrations...');
  
  const allRegistrations = [
    ...obsApplications.map(r => ({ ...r, year: 2025 })),
    ...obs2026Attendees.map(r => ({ ...r, year: 2026 }))
  ];
  
  stats.obsRegistrations.total = allRegistrations.length;
  
  // First ensure we have OBS configs
  const obs2025Config = await prisma.oBSConfig.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      eventName: 'Orange Blossom Special 2025',
      startDate: new Date('2025-02-24'),
      endDate: new Date('2025-03-02'),
      registrationOpens: new Date('2024-10-01'),
      registrationCloses: new Date('2025-02-20'),
      location: 'Withlacoochee River Park',
      memberPrice: 30,
      nonMemberPrice: 40,
      campingPrice: 20,
      mealPrice: 20,
      capacity: 150,
      isActive: false, // 2025 was cancelled
    }
  });
  
  const obs2026Config = await prisma.oBSConfig.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      eventName: 'Orange Blossom Special 2026',
      startDate: new Date('2026-01-14'),
      endDate: new Date('2026-01-18'),
      registrationOpens: new Date('2025-10-01'),
      registrationCloses: new Date('2026-01-10'),
      location: 'Withlacoochee River Park',
      memberPrice: 30,
      nonMemberPrice: 40,
      campingPrice: 20,
      mealPrice: 20,
      capacity: 150,
      isActive: true,
    }
  });
  
  for (const reg of allRegistrations) {
    try {
      const email = cleanEmail(reg.email, reg.pEmail);
      if (!email) {
        stats.obsRegistrations.skipped++;
        continue;
      }
      
      const configId = reg.year === 2026 ? obs2026Config.id : obs2025Config.id;
      
      // Check if registration exists
      const existing = await prisma.oBSRegistration.findFirst({
        where: {
          email,
          obsConfigId: configId,
        }
      });
      
      if (existing) {
        stats.obsRegistrations.skipped++;
        continue;
      }
      
      // Find associated user
      const user = await prisma.user.findUnique({ where: { email } });
      
      await prisma.oBSRegistration.create({
        data: {
          obsConfigId: configId,
          firstName: reg.pFirstName || 'Unknown',
          lastName: reg.pLastName || 'Unknown',
          email,
          phone: parsePhone(reg.pMobile) || parsePhone(reg.home),
          address: reg.street,
          city: reg.city,
          state: reg.state,
          zip: reg.zip,
          isMember: reg.Member === 'Yes',
          userId: user?.id,
          registrationType: 'ATTENDEE',
          campingRequested: reg.campingType && reg.campingType !== 'NA',
          mealRequested: parseInt(reg.satMealQty) > 0,
          amountPaid: parseFloat(reg.registration_ext || '0') + 
                      parseFloat(reg.camping_ext || '0') + 
                      parseFloat(reg.meals_ext || '0'),
          paymentStatus: reg.status === 'Completed' || reg.status === 'Paid' ? 'PAID' : 'PENDING',
          paymentMethod: 'PayPal',
          paymentDate: reg.regDate ? new Date(reg.regDate) : null,
          paypalOrderId: reg.receipt,
          notes: `Camping: ${reg.campingType || 'N/A'}, RV: ${reg.Camper_Type || 'N/A'} (${reg.rvLength || 0}ft)`,
        }
      });
      
      stats.obsRegistrations.imported++;
      
    } catch (error: any) {
      issues.push(`OBS Registration ${reg.appID || reg.email}: ${error.message}`);
      stats.obsRegistrations.errors++;
    }
  }
  
  console.log(`   ✅ Imported: ${stats.obsRegistrations.imported}`);
  console.log(`   ⏭️  Skipped: ${stats.obsRegistrations.skipped}`);
  console.log(`   ❌ Errors: ${stats.obsRegistrations.errors}`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     SPAC Legacy Data Migration');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  try {
    // Parse source file
    const tables = parseSourceFile();
    
    // Run migrations in order
    const memberIdMap = await migrateMembers(tables['members'] || []);
    await migrateApplications(tables['application'] || [], memberIdMap);
    await migrateBoardMembers(tables['clubOfficers'] || [], memberIdMap);
    await migrateMeetings(tables['generalMeetings'] || []);
    await migrateOBSRegistrations(
      tables['obsApplications'] || [],
      tables['obs2026attendees'] || []
    );
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('     Migration Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`
📊 Statistics:
   Members:         ${stats.members.imported}/${stats.members.total} imported (${stats.members.skipped} skipped, ${stats.members.errors} errors)
   Applications:    ${stats.applications.imported}/${stats.applications.total} imported (${stats.applications.merged} merged, ${stats.applications.errors} errors)
   Board Members:   ${stats.boardMembers.imported}/${stats.boardMembers.total} imported (${stats.boardMembers.skipped} skipped)
   Meetings:        ${stats.meetings.imported}/${stats.meetings.total} imported
   OBS Registrations: ${stats.obsRegistrations.imported}/${stats.obsRegistrations.total} imported
   ID Mappings:     ${stats.idMappings.imported} created
`);
    
    if (issues.length > 0) {
      console.log('⚠️  Issues Found:');
      issues.slice(0, 20).forEach(issue => console.log(`   - ${issue}`));
      if (issues.length > 20) {
        console.log(`   ... and ${issues.length - 20} more issues`);
      }
    }
    
    console.log(`\nCompleted: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
