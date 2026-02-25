export const dynamic = 'force-dynamic';

/**
 * OBS QR Check-In API
 *
 * POST /api/admin/obs/registrations/by-uuid/[uuid]?obsId=X
 * Looks up a user by their qrUuid, finds their OBS registration for the
 * given obsConfigId, checks them in, and returns the registration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { awardBadgesForCheckIn } from '@/lib/badges';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { uuid } = await params;
    const obsId = request.nextUrl.searchParams.get('obsId');
    if (!obsId) return NextResponse.json({ error: 'obsId required' }, { status: 400 });

    // Find user by qrUuid
    const user = await prisma.user.findFirst({
      where: { qrUuid: uuid },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Member not found for this QR code' }, { status: 404 });
    }

    // Find their OBS registration for this config
    const registration = await prisma.oBSRegistration.findFirst({
      where: { obsConfigId: obsId, userId: user.id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: `No OBS registration found for ${user.firstName} ${user.lastName}` },
        { status: 404 },
      );
    }

    // Mark checked in
    const updated = await prisma.oBSRegistration.update({
      where: { id: registration.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInById: session.user.id,
      },
    });

    // Award badges
    let newBadges: string[] = [];
    if (user.id) {
      newBadges = await awardBadgesForCheckIn(user.id, null, { isOBSEvent: true });
    }

    return NextResponse.json({ ...updated, newBadges });
  } catch (error) {
    console.error('OBS QR check-in failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
