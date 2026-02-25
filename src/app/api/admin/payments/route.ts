export const dynamic = 'force-dynamic';
/**
 * Admin Payments API
 *
 * GET - List all payments with filters, pagination, totals
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../utils';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit    = Math.min(100, parseInt(searchParams.get('limit') || '25', 10));
  const skip     = (page - 1) * limit;
  const search   = searchParams.get('search')?.trim()  || '';
  const type     = searchParams.get('type')   || '';
  const status   = searchParams.get('status') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo   = searchParams.get('dateTo')   || '';

  try {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (type)   where.type   = type;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      const dateRange: Record<string, Date> = {};
      if (dateFrom) dateRange.gte = new Date(dateFrom);
      if (dateTo)   dateRange.lte = new Date(dateTo + 'T23:59:59Z');
      where.paidAt = dateRange;
    }

    if (search) {
      where.user = {
        OR: [
          { email:     { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [payments, total, aggregate] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:              true,
          type:            true,
          amount:          true,
          currency:        true,
          status:          true,
          description:     true,
          paypalOrderId:   true,
          paypalCaptureId: true,
          paidAt:          true,
          createdAt:       true,
          user: {
            select: {
              id:        true,
              firstName: true,
              lastName:  true,
              name:      true,
              email:     true,
            },
          },
          registrations: {
            select: {
              id:    true,
              event: { select: { title: true, slug: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      data:       payments,
      total,
      totalAmount: Number(aggregate._sum.amount ?? 0),
      page,
      totalPages:  Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin payments list error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
