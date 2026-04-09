export const dynamic = 'force-dynamic';
/**
 * Admin Memberships API
 * GET  — list + filter + CSV export
 * POST — create membership (admin-assigned)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../utils';

// ─── Shared select shape ──────────────────────────────────────────────────────
const membershipSelect = {
  id:                    true,
  status:                true,
  type:                  true,
  interval:              true,
  startDate:             true,
  endDate:               true,
  paypalCurrentPeriodEnd: true,
  paypalSubscriptionId:  true,
  obsEligible:           true,
  discountPercent:       true,
  createdAt:             true,
  user: {
    select: {
      id:        true,
      firstName: true,
      lastName:  true,
      name:      true,
      email:     true,
      phone:     true,
    },
  },
} as const;

// ─── GET /api/admin/memberships ───────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);

  const page    = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit   = Math.min(200, parseInt(searchParams.get('limit') || '25', 10));
  const skip    = (page - 1) * limit;
  const search  = searchParams.get('search')?.trim() || '';
  const status  = searchParams.get('status') || '';
  const type    = searchParams.get('type')   || '';
  const sort    = searchParams.get('sort')   || 'createdAt';
  const order   = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

  // renewalDays=60 → only members whose renewal is within 60 days
  const renewalDaysParam = searchParams.get('renewalDays');
  const renewalDays = renewalDaysParam ? parseInt(renewalDaysParam, 10) : null;

  // CSV export flag
  const exportCsv = searchParams.get('export') === 'csv';
  if (exportCsv) limit === 200; // already capped above; for export bump take to all

  // ── Build where ──────────────────────────────────────────────────────────
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (type)   where.type   = type;

  if (renewalDays !== null) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000);
    where.status = 'ACTIVE';
    where.paypalCurrentPeriodEnd = { gte: now, lte: cutoff };
  }

  if (search) {
    where.user = {
      OR: [
        { email:     { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { name:      { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  try {
    // ── Stats (DB-wide, not page-scoped) ─────────────────────────────────
    const [data, total, stats] = await Promise.all([
      prisma.membership.findMany({
        where,
        skip,
        take: exportCsv ? 10000 : limit,   // unlimited for CSV
        orderBy: { [sort]: order },
        select: membershipSelect,
      }),
      prisma.membership.count({ where }),
      prisma.membership.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // ── CSV export ────────────────────────────────────────────────────────
    if (exportCsv) {
      const fmt = (d: Date | string | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

      const rows = [
        ['First Name', 'Last Name', 'Email', 'Phone', 'Type', 'Status', 'Member Since', 'Renewal Date', 'PayPal Subscription ID'].join(','),
        ...data.map(m => [
          m.user.firstName ?? '',
          m.user.lastName  ?? '',
          m.user.email,
          m.user.phone     ?? '',
          m.type,
          m.status,
          fmt(m.startDate),
          fmt(m.paypalCurrentPeriodEnd),
          m.paypalSubscriptionId ?? '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new Response(rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="spac-memberships-${new Date().toISOString().slice(0,10)}.csv"`,
        },
      });
    }

    // ── Normal JSON response ──────────────────────────────────────────────
    const statusTotals = Object.fromEntries(
      stats.map(s => [s.status, s._count])
    );

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        active:    statusTotals['ACTIVE']    ?? 0,
        expired:   statusTotals['EXPIRED']   ?? 0,
        cancelled: statusTotals['CANCELLED'] ?? 0,
        pending:   statusTotals['PENDING']   ?? 0,
      },
    });
  } catch (error) {
    console.error('Admin memberships list error:', error);
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }
}
