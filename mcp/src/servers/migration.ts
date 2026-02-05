/**
 * SPAC Migration MCP Server
 *
 * Tools for migrating data from PHP/MySQL to PostgreSQL.
 * Handles member, event, registration, and media data migration.
 */

import { MCPServer } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Database connection helper
let pool: any = null;

async function getPool() {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// ============================================
// INPUT SCHEMAS - Define expected PHP data format
// ============================================

const PhpMemberSchema = z.object({
  id: z.number().describe('PHP auto-increment ID'),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().optional().nullable(),
  membership_type: z.string().optional().default('FREE'),
  status: z.string().optional().default('ACTIVE'),
  join_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

const PhpEventSchema = z.object({
  id: z.number().describe('PHP auto-increment ID'),
  title: z.string(),
  description: z.string().optional().default(''),
  type: z.string().optional().default('MEETING'),
  location_name: z.string().optional().default('TBD'),
  location_address: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  is_obs: z.boolean().optional().default(false),
  max_attendees: z.number().optional().nullable(),
  member_price: z.number().optional().nullable(),
  non_member_price: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

const PhpRegistrationSchema = z.object({
  id: z.number().describe('PHP auto-increment ID'),
  member_id: z.number().describe('PHP member ID'),
  event_id: z.number().describe('PHP event ID'),
  status: z.string().optional().default('CONFIRMED'),
  guest_count: z.number().optional().default(0),
  camping: z.boolean().optional().default(false),
  camping_nights: z.number().optional().default(0),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

const PhpMediaSchema = z.object({
  id: z.number().describe('PHP auto-increment ID'),
  member_id: z.number().optional().nullable(),
  event_id: z.number().optional().nullable(),
  url: z.string(),
  filename: z.string().optional(),
  caption: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

// ============================================
// ENUM MAPPERS
// ============================================

function mapMembershipType(phpType: string): string {
  const mapping: Record<string, string> = {
    individual: 'INDIVIDUAL',
    family: 'FAMILY',
    student: 'STUDENT',
    free: 'FREE',
    lifetime: 'LIFETIME',
    // Add more mappings as needed
  };
  return mapping[phpType.toLowerCase()] || 'FREE';
}

function mapMemberStatus(phpStatus: string): string {
  const mapping: Record<string, string> = {
    active: 'ACTIVE',
    expired: 'EXPIRED',
    pending: 'PENDING',
    cancelled: 'CANCELLED',
    suspended: 'SUSPENDED',
  };
  return mapping[phpStatus.toLowerCase()] || 'PENDING';
}

function mapEventType(phpType: string): string {
  const mapping: Record<string, string> = {
    star_party: 'STAR_PARTY',
    starparty: 'STAR_PARTY',
    meeting: 'MEETING',
    workshop: 'WORKSHOP',
    obs: 'OBS_SESSION',
    obs_session: 'OBS_SESSION',
    outreach: 'OUTREACH',
    social: 'SOCIAL',
    special: 'SPECIAL',
  };
  return mapping[phpType.toLowerCase()] || 'MEETING';
}

function mapRegistrationStatus(phpStatus: string): string {
  const mapping: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    waitlisted: 'WAITLISTED',
    cancelled: 'CANCELLED',
    attended: 'ATTENDED',
    no_show: 'NO_SHOW',
  };
  return mapping[phpStatus.toLowerCase()] || 'CONFIRMED';
}

function mapPhotoCategory(phpCategory: string | null): string | null {
  if (!phpCategory) return null;
  const mapping: Record<string, string> = {
    deep_sky: 'DEEP_SKY',
    deepsky: 'DEEP_SKY',
    planets: 'PLANETS',
    moon: 'MOON',
    lunar: 'MOON',
    sun: 'SUN',
    solar: 'SUN',
    events: 'EVENTS',
    equipment: 'EQUIPMENT',
    nightscape: 'NIGHTSCAPE',
    other: 'OTHER',
  };
  return mapping[phpCategory.toLowerCase()] || 'OTHER';
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) + '-' + Date.now().toString(36);
}

function createCuid(): string {
  // Simple CUID-like ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const validateImportDataTool = createTool({
  id: 'validate-import-data',
  description: 'Validate PHP export data before importing. Returns validation results and field mapping preview.',
  inputSchema: z.object({
    dataType: z.enum(['members', 'events', 'registrations', 'media']),
    data: z.array(z.record(z.any())).describe('Array of records to validate'),
    limit: z.number().optional().default(5).describe('Number of records to preview'),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    totalRecords: z.number(),
    validRecords: z.number(),
    errors: z.array(z.object({
      index: z.number(),
      legacyId: z.number().optional(),
      errors: z.array(z.string()),
    })),
    preview: z.array(z.record(z.any())),
  }),
  execute: async ({ context }) => {
    const { dataType, data, limit } = context;
    const schemas: Record<string, z.ZodType> = {
      members: PhpMemberSchema,
      events: PhpEventSchema,
      registrations: PhpRegistrationSchema,
      media: PhpMediaSchema,
    };

    const schema = schemas[dataType];
    const errors: Array<{ index: number; legacyId?: number; errors: string[] }> = [];
    const validRecords: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = schema.safeParse(data[i]);
      if (!result.success) {
        errors.push({
          index: i,
          legacyId: data[i].id,
          errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        });
      } else {
        validRecords.push(result.data);
      }
    }

    return {
      valid: errors.length === 0,
      totalRecords: data.length,
      validRecords: validRecords.length,
      errors: errors.slice(0, 20), // Limit error output
      preview: validRecords.slice(0, limit),
    };
  },
});

const importMembersTool = createTool({
  id: 'import-members',
  description: 'Import members from PHP database export. Creates User and Membership records.',
  inputSchema: z.object({
    members: z.array(PhpMemberSchema).describe('Array of member records from PHP'),
    dryRun: z.boolean().default(false).describe('If true, validate only without inserting'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    imported: z.number(),
    skipped: z.number(),
    errors: z.array(z.object({
      legacyId: z.number(),
      email: z.string(),
      error: z.string(),
    })),
    idMappings: z.array(z.object({
      legacyId: z.number(),
      newId: z.string(),
      email: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { members, dryRun } = context;
    const db = await getPool();
    const errors: Array<{ legacyId: number; email: string; error: string }> = [];
    const idMappings: Array<{ legacyId: number; newId: string; email: string }> = [];
    let imported = 0;
    let skipped = 0;

    for (const member of members) {
      try {
        // Check if member already exists (by email or legacy ID mapping)
        const existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1',
          [member.email]
        );

        if (existingUser.rows.length > 0) {
          skipped++;
          idMappings.push({
            legacyId: member.id,
            newId: existingUser.rows[0].id,
            email: member.email,
          });
          continue;
        }

        const existingMapping = await db.query(
          `SELECT new_id FROM migration_id_mappings WHERE table_name = 'members' AND legacy_id = $1`,
          [member.id]
        );

        if (existingMapping.rows.length > 0) {
          skipped++;
          continue;
        }

        if (dryRun) {
          const newId = createCuid();
          idMappings.push({
            legacyId: member.id,
            newId,
            email: member.email,
          });
          imported++;
          continue;
        }

        // Insert user
        const newId = createCuid();
        const qrUuid = uuidv4();
        const fullName = `${member.first_name} ${member.last_name}`;

        await db.query(
          `INSERT INTO users (id, email, first_name, last_name, name, phone, role, qr_uuid, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'MEMBER', $7, $8, NOW())`,
          [
            newId,
            member.email,
            member.first_name,
            member.last_name,
            fullName,
            member.phone || null,
            qrUuid,
            member.created_at ? new Date(member.created_at) : new Date(),
          ]
        );

        // Insert membership
        const membershipId = createCuid();
        const membershipType = mapMembershipType(member.membership_type || 'FREE');
        const memberStatus = mapMemberStatus(member.status || 'ACTIVE');

        await db.query(
          `INSERT INTO memberships (id, user_id, type, status, start_date, end_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            membershipId,
            newId,
            membershipType,
            memberStatus,
            member.join_date ? new Date(member.join_date) : null,
            member.expiry_date ? new Date(member.expiry_date) : null,
          ]
        );

        // Store ID mapping
        await db.query(
          `INSERT INTO migration_id_mappings (table_name, legacy_id, new_id)
           VALUES ('members', $1, $2)`,
          [member.id, newId]
        );

        idMappings.push({
          legacyId: member.id,
          newId,
          email: member.email,
        });
        imported++;
      } catch (error) {
        errors.push({
          legacyId: member.id,
          email: member.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
      idMappings,
    };
  },
});

const importEventsTool = createTool({
  id: 'import-events',
  description: 'Import events from PHP database export.',
  inputSchema: z.object({
    events: z.array(PhpEventSchema).describe('Array of event records from PHP'),
    dryRun: z.boolean().default(false),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    imported: z.number(),
    skipped: z.number(),
    errors: z.array(z.object({
      legacyId: z.number(),
      title: z.string(),
      error: z.string(),
    })),
    idMappings: z.array(z.object({
      legacyId: z.number(),
      newId: z.string(),
      slug: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { events, dryRun } = context;
    const db = await getPool();
    const errors: Array<{ legacyId: number; title: string; error: string }> = [];
    const idMappings: Array<{ legacyId: number; newId: string; slug: string }> = [];
    let imported = 0;
    let skipped = 0;

    for (const event of events) {
      try {
        // Check for existing mapping
        const existingMapping = await db.query(
          `SELECT new_id FROM migration_id_mappings WHERE table_name = 'events' AND legacy_id = $1`,
          [event.id]
        );

        if (existingMapping.rows.length > 0) {
          skipped++;
          continue;
        }

        const newId = createCuid();
        const slug = generateSlug(event.title);

        if (dryRun) {
          idMappings.push({ legacyId: event.id, newId, slug });
          imported++;
          continue;
        }

        const eventType = mapEventType(event.type || 'MEETING');
        const endDate = event.end_date
          ? new Date(event.end_date)
          : new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000); // +3 hours

        await db.query(
          `INSERT INTO events (
            id, slug, title, description, type, status, location_name, location_address,
            start_date, end_date, is_obs_event, max_attendees, member_price, non_member_price,
            is_free, requires_registration, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'PUBLISHED', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
          [
            newId,
            slug,
            event.title,
            event.description || '',
            eventType,
            event.location_name || 'TBD',
            event.location_address || null,
            new Date(event.start_date),
            endDate,
            event.is_obs || false,
            event.max_attendees || null,
            event.member_price || null,
            event.non_member_price || null,
            !event.member_price && !event.non_member_price,
            !!event.max_attendees,
            event.created_at ? new Date(event.created_at) : new Date(),
          ]
        );

        await db.query(
          `INSERT INTO migration_id_mappings (table_name, legacy_id, new_id)
           VALUES ('events', $1, $2)`,
          [event.id, newId]
        );

        idMappings.push({ legacyId: event.id, newId, slug });
        imported++;
      } catch (error) {
        errors.push({
          legacyId: event.id,
          title: event.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
      idMappings,
    };
  },
});

const importRegistrationsTool = createTool({
  id: 'import-registrations',
  description: 'Import event registrations. Requires members and events to be imported first.',
  inputSchema: z.object({
    registrations: z.array(PhpRegistrationSchema),
    dryRun: z.boolean().default(false),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    imported: z.number(),
    skipped: z.number(),
    unmappedMembers: z.array(z.number()),
    unmappedEvents: z.array(z.number()),
    errors: z.array(z.object({
      legacyId: z.number(),
      error: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const { registrations, dryRun } = context;
    const db = await getPool();
    const errors: Array<{ legacyId: number; error: string }> = [];
    const unmappedMembers = new Set<number>();
    const unmappedEvents = new Set<number>();
    let imported = 0;
    let skipped = 0;

    for (const reg of registrations) {
      try {
        // Look up new IDs
        const memberMapping = await db.query(
          `SELECT new_id FROM migration_id_mappings WHERE table_name = 'members' AND legacy_id = $1`,
          [reg.member_id]
        );
        const eventMapping = await db.query(
          `SELECT new_id FROM migration_id_mappings WHERE table_name = 'events' AND legacy_id = $1`,
          [reg.event_id]
        );

        if (memberMapping.rows.length === 0) {
          unmappedMembers.add(reg.member_id);
          skipped++;
          continue;
        }
        if (eventMapping.rows.length === 0) {
          unmappedEvents.add(reg.event_id);
          skipped++;
          continue;
        }

        const userId = memberMapping.rows[0].new_id;
        const eventId = eventMapping.rows[0].new_id;

        // Check for existing registration
        const existingReg = await db.query(
          `SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2`,
          [userId, eventId]
        );

        if (existingReg.rows.length > 0) {
          skipped++;
          continue;
        }

        if (dryRun) {
          imported++;
          continue;
        }

        const newId = createCuid();
        const status = mapRegistrationStatus(reg.status || 'CONFIRMED');

        await db.query(
          `INSERT INTO registrations (
            id, event_id, user_id, status, guest_count, camping_requested, camping_nights, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            newId,
            eventId,
            userId,
            status,
            reg.guest_count || 0,
            reg.camping || false,
            reg.camping_nights || 0,
            reg.notes || null,
            reg.created_at ? new Date(reg.created_at) : new Date(),
          ]
        );

        await db.query(
          `INSERT INTO migration_id_mappings (table_name, legacy_id, new_id)
           VALUES ('registrations', $1, $2)`,
          [reg.id, newId]
        );

        imported++;
      } catch (error) {
        errors.push({
          legacyId: reg.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0 && unmappedMembers.size === 0 && unmappedEvents.size === 0,
      imported,
      skipped,
      unmappedMembers: Array.from(unmappedMembers),
      unmappedEvents: Array.from(unmappedEvents),
      errors,
    };
  },
});

const getMigrationStatusTool = createTool({
  id: 'get-migration-status',
  description: 'Get current migration status and statistics.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    members: z.object({
      migrated: z.number(),
      total: z.number(),
    }),
    events: z.object({
      migrated: z.number(),
      total: z.number(),
    }),
    registrations: z.object({
      migrated: z.number(),
      total: z.number(),
    }),
    media: z.object({
      migrated: z.number(),
      total: z.number(),
    }),
    lastMigration: z.string().nullable(),
  }),
  execute: async () => {
    const db = await getPool();

    const membersMigrated = await db.query(
      `SELECT COUNT(*) FROM migration_id_mappings WHERE table_name = 'members'`
    );
    const membersTotal = await db.query('SELECT COUNT(*) FROM users');

    const eventsMigrated = await db.query(
      `SELECT COUNT(*) FROM migration_id_mappings WHERE table_name = 'events'`
    );
    const eventsTotal = await db.query('SELECT COUNT(*) FROM events');

    const regsMigrated = await db.query(
      `SELECT COUNT(*) FROM migration_id_mappings WHERE table_name = 'registrations'`
    );
    const regsTotal = await db.query('SELECT COUNT(*) FROM registrations');

    const mediaMigrated = await db.query(
      `SELECT COUNT(*) FROM migration_id_mappings WHERE table_name = 'media'`
    );
    const mediaTotal = await db.query('SELECT COUNT(*) FROM media');

    const lastMigration = await db.query(
      `SELECT MAX(migrated_at) as last FROM migration_id_mappings`
    );

    return {
      members: {
        migrated: parseInt(membersMigrated.rows[0].count),
        total: parseInt(membersTotal.rows[0].count),
      },
      events: {
        migrated: parseInt(eventsMigrated.rows[0].count),
        total: parseInt(eventsTotal.rows[0].count),
      },
      registrations: {
        migrated: parseInt(regsMigrated.rows[0].count),
        total: parseInt(regsTotal.rows[0].count),
      },
      media: {
        migrated: parseInt(mediaMigrated.rows[0].count),
        total: parseInt(mediaTotal.rows[0].count),
      },
      lastMigration: lastMigration.rows[0]?.last?.toISOString() || null,
    };
  },
});

const lookupIdMappingTool = createTool({
  id: 'lookup-id-mapping',
  description: 'Look up a new ID from a legacy PHP ID.',
  inputSchema: z.object({
    tableName: z.enum(['members', 'events', 'registrations', 'media']),
    legacyId: z.number(),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    newId: z.string().nullable(),
    migratedAt: z.string().nullable(),
  }),
  execute: async ({ context }) => {
    const { tableName, legacyId } = context;
    const db = await getPool();

    const result = await db.query(
      `SELECT new_id, migrated_at FROM migration_id_mappings WHERE table_name = $1 AND legacy_id = $2`,
      [tableName, legacyId]
    );

    if (result.rows.length === 0) {
      return { found: false, newId: null, migratedAt: null };
    }

    return {
      found: true,
      newId: result.rows[0].new_id,
      migratedAt: result.rows[0].migrated_at?.toISOString() || null,
    };
  },
});

const clearMigrationDataTool = createTool({
  id: 'clear-migration-data',
  description: 'Clear migrated data from a specific table. USE WITH CAUTION.',
  inputSchema: z.object({
    tableName: z.enum(['members', 'events', 'registrations', 'media', 'all']),
    confirm: z.literal(true).describe('Must be true to confirm deletion'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    deleted: z.record(z.number()),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { tableName, confirm } = context;
    if (!confirm) {
      return {
        success: false,
        deleted: {},
        message: 'Confirmation required. Set confirm: true',
      };
    }

    const db = await getPool();
    const deleted: Record<string, number> = {};

    try {
      if (tableName === 'all' || tableName === 'registrations') {
        // Delete registrations first (foreign key dependencies)
        const regsResult = await db.query(
          `DELETE FROM registrations WHERE id IN (
            SELECT new_id FROM migration_id_mappings WHERE table_name = 'registrations'
          ) RETURNING id`
        );
        deleted.registrations = regsResult.rowCount || 0;

        await db.query(`DELETE FROM migration_id_mappings WHERE table_name = 'registrations'`);
      }

      if (tableName === 'all' || tableName === 'events') {
        const eventsResult = await db.query(
          `DELETE FROM events WHERE id IN (
            SELECT new_id FROM migration_id_mappings WHERE table_name = 'events'
          ) RETURNING id`
        );
        deleted.events = eventsResult.rowCount || 0;

        await db.query(`DELETE FROM migration_id_mappings WHERE table_name = 'events'`);
      }

      if (tableName === 'all' || tableName === 'members') {
        // Delete memberships first
        await db.query(
          `DELETE FROM memberships WHERE user_id IN (
            SELECT new_id FROM migration_id_mappings WHERE table_name = 'members'
          )`
        );

        const membersResult = await db.query(
          `DELETE FROM users WHERE id IN (
            SELECT new_id FROM migration_id_mappings WHERE table_name = 'members'
          ) RETURNING id`
        );
        deleted.members = membersResult.rowCount || 0;

        await db.query(`DELETE FROM migration_id_mappings WHERE table_name = 'members'`);
      }

      if (tableName === 'all' || tableName === 'media') {
        const mediaResult = await db.query(
          `DELETE FROM media WHERE id IN (
            SELECT new_id FROM migration_id_mappings WHERE table_name = 'media'
          ) RETURNING id`
        );
        deleted.media = mediaResult.rowCount || 0;

        await db.query(`DELETE FROM migration_id_mappings WHERE table_name = 'media'`);
      }

      return {
        success: true,
        deleted,
        message: `Successfully cleared migration data for: ${tableName}`,
      };
    } catch (error) {
      return {
        success: false,
        deleted,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// ============================================
// SERVER DEFINITION
// ============================================

export const migrationServer = new MCPServer({
  name: 'spac-migration',
  version: '1.0.0',
  tools: {
    'validate-import-data': validateImportDataTool,
    'import-members': importMembersTool,
    'import-events': importEventsTool,
    'import-registrations': importRegistrationsTool,
    'get-migration-status': getMigrationStatusTool,
    'lookup-id-mapping': lookupIdMappingTool,
    'clear-migration-data': clearMigrationDataTool,
  },
});
