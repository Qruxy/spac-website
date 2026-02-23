export const dynamic = 'force-dynamic';
/**
 * OBS Check-In API
 *
 * POST - Check in a registration (and award badges)
 * DELETE - Undo check-in (and revoke unqualified badges)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { awardBadgesForCheckIn, revokeBadgesIfUnqualified } from '@/lib/badges';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await request.json(); // consume body (unused — checkedInById always taken from session)

    const registration = await prisma.oBSRegistration.update({
      where: { id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInById: session.user.id, // always use session; never trust client-supplied value
      },
    });

    // Award badges if the registration is linked to a user account
    let newBadges: string[] = [];
    if (registration.userId) {
      newBadges = await awardBadgesForCheckIn(registration.userId, null, {
        isOBSEvent: true,
      });
    }

    return NextResponse.json({ ...registration, newBadges });
  } catch (error) {
    console.error('Check-in failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch registration before updating to get userId
    const existing = await prisma.oBSRegistration.findUnique({
      where: { id },
      select: { userId: true },
    });

    const registration = await prisma.oBSRegistration.update({
      where: { id },
      data: {
        checkedIn: false,
        checkedInAt: null,
        checkedInById: null,
      },
    });

    // Revoke badges the user no longer qualifies for
    let revokedBadges: string[] = [];
    if (existing?.userId) {
      revokedBadges = await revokeBadgesIfUnqualified(existing.userId);
    }

    return NextResponse.json({ ...registration, revokedBadges });
  } catch (error) {
    console.error('Undo check-in failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
