export const dynamic = 'force-dynamic';

/**
 * OBS Financial Line Item — single record
 *
 * PUT    /api/admin/obs/financials/[id]  — update
 * DELETE /api/admin/obs/financials/[id]  — delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { category, description, amount, isIncome, date } = body as {
      category?: string;
      description?: string;
      amount?: number;
      isIncome?: boolean;
      date?: string;
    };

    const item = await prisma.oBSFinancial.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(isIncome !== undefined && { isIncome }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update OBS financial item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    await prisma.oBSFinancial.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete OBS financial item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
