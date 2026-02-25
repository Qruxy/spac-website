export const dynamic = 'force-dynamic';

/**
 * OBS Registration Admin API — single record
 *
 * GET    /api/admin/obs/registrations/[id]  — fetch registration details
 * PATCH  /api/admin/obs/registrations/[id]  — update badgePrinted, checkedIn, paymentStatus
 * DELETE /api/admin/obs/registrations/[id]  — delete registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const registration = await prisma.oBSRegistration.findUnique({ where: { id } });
    if (!registration) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Failed to fetch OBS registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const { badgePrinted, checkedIn, paymentStatus } = body as {
      badgePrinted?: boolean;
      checkedIn?: boolean;
      paymentStatus?: string;
    };

    const updateData: Record<string, unknown> = {};

    if (badgePrinted !== undefined) {
      updateData.badgePrinted = badgePrinted;
    }

    if (checkedIn !== undefined) {
      updateData.checkedIn = checkedIn;
      updateData.checkedInAt = checkedIn ? new Date() : null;
      if (checkedIn) {
        updateData.checkedInById = session.user.id;
      }
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID') {
        updateData.paymentDate = new Date();
      }
    }

    const registration = await prisma.oBSRegistration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Failed to update OBS registration:', error);
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

    await prisma.oBSRegistration.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete OBS registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
