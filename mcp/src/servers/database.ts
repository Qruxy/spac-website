/**
 * SPAC Database MCP Server
 *
 * Provides tools for querying and managing SPAC member data,
 * events, and registrations during development.
 */

import { MCPServer } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Database connection helper (to be configured)
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
// TOOL DEFINITIONS
// ============================================

const listMembersTool = createTool({
  id: 'list-members',
  description: 'List SPAC members with optional filtering by status and pagination',
  inputSchema: z.object({
    limit: z.number().min(1).max(100).default(50).describe('Maximum number of members to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip'),
    status: z.enum(['active', 'expired', 'pending', 'all']).default('all').describe('Filter by membership status'),
    search: z.string().optional().describe('Search by name or email'),
  }),
  outputSchema: z.object({
    members: z.array(z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.string(),
      membershipStatus: z.string().nullable(),
      membershipType: z.string().nullable(),
      createdAt: z.string(),
    })),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { limit, offset, status, search } = context;
    const db = await getPool();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status !== 'all') {
      whereClause += ` AND m.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u LEFT JOIN memberships m ON u.id = m.user_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch members
    params.push(limit, offset);
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role,
              m.status as membership_status, m.type as membership_type, u.created_at
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id
       ${whereClause}
       ORDER BY u.last_name, u.first_name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      members: result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        membershipStatus: row.membership_status,
        membershipType: row.membership_type,
        createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
      })),
      total,
      hasMore: offset + result.rows.length < total,
    };
  },
});

const getMemberTool = createTool({
  id: 'get-member',
  description: 'Get detailed information about a specific member by ID or email',
  inputSchema: z.object({
    id: z.string().optional().describe('Member ID'),
    email: z.string().email().optional().describe('Member email'),
  }).refine(data => data.id || data.email, {
    message: 'Either id or email must be provided',
  }),
  outputSchema: z.object({
    member: z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string().nullable(),
      role: z.string(),
      qrUuid: z.string(),
      stripeCustomerId: z.string().nullable(),
      membership: z.object({
        type: z.string(),
        status: z.string(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
      }).nullable(),
      createdAt: z.string(),
    }).nullable(),
  }),
  execute: async ({ context }) => {
    const { id, email } = context;
    const db = await getPool();

    const whereClause = id ? 'u.id = $1' : 'u.email = $1';
    const param = id || email;

    const result = await db.query(
      `SELECT u.*, m.type as membership_type, m.status as membership_status,
              m.start_date, m.end_date
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id
       WHERE ${whereClause}`,
      [param]
    );

    if (result.rows.length === 0) {
      return { member: null };
    }

    const row = result.rows[0];
    return {
      member: {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        role: row.role,
        qrUuid: row.qr_uuid,
        stripeCustomerId: row.stripe_customer_id,
        membership: row.membership_type ? {
          type: row.membership_type,
          status: row.membership_status,
          startDate: row.start_date?.toISOString() ?? null,
          endDate: row.end_date?.toISOString() ?? null,
        } : null,
        createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
      },
    };
  },
});

const listEventsTool = createTool({
  id: 'list-events',
  description: 'List upcoming or past events with optional filtering',
  inputSchema: z.object({
    limit: z.number().min(1).max(100).default(20).describe('Maximum events to return'),
    status: z.enum(['draft', 'published', 'cancelled', 'completed', 'all']).default('published'),
    type: z.enum(['star_party', 'meeting', 'workshop', 'obs_session', 'outreach', 'all']).default('all'),
    upcoming: z.boolean().default(true).describe('Only show future events'),
  }),
  outputSchema: z.object({
    events: z.array(z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      type: z.string(),
      status: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      locationName: z.string(),
      registrationCount: z.number(),
    })),
  }),
  execute: async ({ context }) => {
    const { limit, status, type, upcoming } = context;
    const db = await getPool();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status !== 'all') {
      whereClause += ` AND e.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (type !== 'all') {
      whereClause += ` AND e.type = $${paramIndex}`;
      params.push(type.toUpperCase());
      paramIndex++;
    }

    if (upcoming) {
      whereClause += ` AND e.start_date > NOW()`;
    }

    params.push(limit);

    const result = await db.query(
      `SELECT e.*, COUNT(r.id) as registration_count
       FROM events e
       LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'CANCELLED'
       ${whereClause}
       GROUP BY e.id
       ORDER BY e.start_date ${upcoming ? 'ASC' : 'DESC'}
       LIMIT $${paramIndex}`,
      params
    );

    return {
      events: result.rows.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        status: row.status,
        startDate: row.start_date?.toISOString() ?? '',
        endDate: row.end_date?.toISOString() ?? '',
        locationName: row.location_name,
        registrationCount: parseInt(row.registration_count) || 0,
      })),
    };
  },
});

const getEventRegistrationsTool = createTool({
  id: 'get-event-registrations',
  description: 'Get all registrations for a specific event',
  inputSchema: z.object({
    eventId: z.string().describe('Event ID'),
    status: z.enum(['pending', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'all']).default('all'),
  }),
  outputSchema: z.object({
    registrations: z.array(z.object({
      id: z.string(),
      memberName: z.string(),
      memberEmail: z.string(),
      status: z.string(),
      guestCount: z.number(),
      campingRequested: z.boolean(),
      checkedIn: z.boolean(),
      createdAt: z.string(),
    })),
    totalCount: z.number(),
  }),
  execute: async ({ context }) => {
    const { eventId, status } = context;
    const db = await getPool();

    let whereClause = 'WHERE r.event_id = $1';
    const params: any[] = [eventId];

    if (status !== 'all') {
      whereClause += ' AND r.status = $2';
      params.push(status.toUpperCase());
    }

    const result = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at`,
      params
    );

    return {
      registrations: result.rows.map((row: any) => ({
        id: row.id,
        memberName: `${row.first_name} ${row.last_name}`,
        memberEmail: row.email,
        status: row.status,
        guestCount: row.guest_count || 0,
        campingRequested: row.camping_requested || false,
        checkedIn: !!row.checked_in_at,
        createdAt: row.created_at?.toISOString() ?? '',
      })),
      totalCount: result.rows.length,
    };
  },
});

const getMembershipStatsTool = createTool({
  id: 'get-membership-stats',
  description: 'Get aggregate statistics about club membership',
  inputSchema: z.object({}),
  outputSchema: z.object({
    totalMembers: z.number(),
    activeMembers: z.number(),
    expiredMembers: z.number(),
    byType: z.record(z.number()),
    recentSignups: z.number(),
  }),
  execute: async () => {
    const db = await getPool();

    const totalResult = await db.query('SELECT COUNT(*) FROM users');
    const activeResult = await db.query(
      `SELECT COUNT(*) FROM memberships WHERE status = 'ACTIVE'`
    );
    const expiredResult = await db.query(
      `SELECT COUNT(*) FROM memberships WHERE status = 'EXPIRED'`
    );
    const byTypeResult = await db.query(
      `SELECT type, COUNT(*) FROM memberships GROUP BY type`
    );
    const recentResult = await db.query(
      `SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'`
    );

    const byType: Record<string, number> = {};
    byTypeResult.rows.forEach((row: any) => {
      byType[row.type] = parseInt(row.count);
    });

    return {
      totalMembers: parseInt(totalResult.rows[0].count),
      activeMembers: parseInt(activeResult.rows[0].count),
      expiredMembers: parseInt(expiredResult.rows[0].count),
      byType,
      recentSignups: parseInt(recentResult.rows[0].count),
    };
  },
});

// ============================================
// SERVER DEFINITION
// ============================================

export const spacDatabaseServer = new MCPServer({
  name: 'spac-database',
  version: '1.0.0',
  tools: {
    'list-members': listMembersTool,
    'get-member': getMemberTool,
    'list-events': listEventsTool,
    'get-event-registrations': getEventRegistrationsTool,
    'get-membership-stats': getMembershipStatsTool,
  },
});
