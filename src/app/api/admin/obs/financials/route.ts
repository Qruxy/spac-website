export const dynamic = 'force-dynamic';

/**
 * OBS Financials API
 *
 * GET  /api/admin/obs/financials?obsId=X  — list financial line items
 * POST /api/admin/obs/financials           — create a line item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const obsId = request.nextUrl.searchParams.get('obsId');
    if (!obsId) return NextResponse.json({ error: 'obsId required' }, { status: 400 });

    const [items, regRevenue] = await Promise.all([
      prisma.oBSFinancial.findMany({
        where: { obsConfigId: obsId },
        orderBy: { date: 'desc' },
      }),
      prisma.oBSRegistration.aggregate({
        where: { obsConfigId: obsId, paymentStatus: 'PAID' },
        _sum: { amountPaid: true },
      }),
    ]);

    return NextResponse.json({
      items,
      registrationRevenue: regRevenue._sum.amountPaid?.toNumber() ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch OBS financials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { obsConfigId, category, description, amount, isIncome, date } = body as {
      obsConfigId: string;
      category: string;
      description: string;
      amount: number;
      isIncome: boolean;
      date: string;
    };

    if (!obsConfigId || !category || !description || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.oBSFinancial.create({
      data: {
        obsConfigId,
        category,
        description,
        amount,
        isIncome: isIncome ?? true,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create OBS financial item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
