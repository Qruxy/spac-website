export const dynamic = 'force-dynamic';
/**
 * Admin Stats API
 *
 * Returns dashboard statistics and analytics.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../utils';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all counts in parallel
    const [
      totalUsers,
      upcomingEvents,
      activeMemberships,
      activeListings,
      pendingMedia,
      recentRegistrations,
      pendingListings,
      newUsersThisMonth,
      confirmedRegistrations,
      membershipsByType,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Upcoming events (next 30 days)
      prisma.event.count({
        where: {
          startDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          status: 'PUBLISHED',
        },
      }),

      // Active memberships
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Active listings
      prisma.listing.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Pending media for review
      prisma.media.count({
        where: {
          status: 'PENDING',
        },
      }),

      // Recent registrations (last 7 days)
      prisma.registration.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Pending listings for approval
      prisma.listing.count({
        where: {
          status: 'PENDING_APPROVAL',
        },
      }),

      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),

      // Confirmed registrations for upcoming events
      prisma.registration.count({
        where: {
          status: 'CONFIRMED',
          event: {
            startDate: {
              gte: now,
            },
          },
        },
      }),

      // Memberships by type
      prisma.membership.groupBy({
        by: ['type'],
        where: {
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const baseStats = {
      totalUsers,
      upcomingEvents,
      activeMemberships,
      activeListings,
      pendingMedia,
      recentRegistrations,
      pendingListings,
      newUsersThisMonth,
      confirmedRegistrations,
      membershipsByType: membershipsByType.reduce(
        (acc, m) => ({ ...acc, [m.type]: m._count.id }),
        {}
      ),
    };

    // Return detailed analytics if requested
    if (detailed) {
      const [
        eventsByMonth,
        registrationsByStatus,
        topEvents,
        recentAuditLogs,
      ] = await Promise.all([
        // Events created by month (last 6 months)
        prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
          SELECT
            DATE_TRUNC('month', start_date) as month,
            COUNT(*) as count
          FROM events
          WHERE start_date >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', start_date)
          ORDER BY month DESC
          LIMIT 6
        `.then(rows => rows.map(r => ({ month: r.month, count: Number(r.count) }))),

        // Registrations by status
        prisma.registration.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // Top 5 upcoming events by registration count
        prisma.event.findMany({
          where: {
            startDate: { gte: now },
            status: 'PUBLISHED',
          },
          select: {
            id: true,
            title: true,
            startDate: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: {
            registrations: {
              _count: 'desc',
            },
          },
          take: 5,
        }),

        // Recent audit logs
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      return NextResponse.json({
        ...baseStats,
        analytics: {
          eventsByMonth,
          registrationsByStatus: registrationsByStatus.reduce(
            (acc, r) => ({ ...acc, [r.status]: r._count.id }),
            {}
          ),
          topEvents: topEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            registrations: e._count.registrations,
          })),
          recentActivity: recentAuditLogs.map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            user: log.users
              ? `${log.users.firstName} ${log.users.lastName}`
              : 'System',
            createdAt: log.createdAt,
          })),
        },
      });
    }

    return NextResponse.json(baseStats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
