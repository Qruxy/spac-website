/**
 * QR Check-In API
 *
 * POST /api/check-in/[uuid]
 * Processes event check-in when an admin/moderator scans a member's QR code.
 * Looks up the user by qrUuid, finds today's active event registration,
 * marks attendance, and awards any earned badges.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { awardBadgesForCheckIn } from '@/lib/badges';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // Authenticate: require ADMIN or MODERATOR role
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Moderator role required' },
        { status: 403 }
      );
    }

    const { uuid } = await params;

    // Look up user by QR UUID
    const user = await prisma.user.findFirst({
      where: { qrUuid: uuid },
      include: {
        membership: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build today's date range (start and end of day in UTC)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Find the user's registration for an active event happening today
    const registration = await prisma.registration.findFirst({
      where: {
        userId: user.id,
        status: { in: ['CONFIRMED', 'PENDING'] },
        event: {
          status: 'PUBLISHED',
          startDate: { lte: endOfToday },
          endDate: { gte: startOfToday },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        event: { startDate: 'asc' },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'No event registration found for today' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (registration.checkedInAt) {
      return NextResponse.json(
        { error: 'Already checked in' },
        { status: 409 }
      );
    }

    // Update registration: mark as attended
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        checkedInAt: now,
        checkedInById: session.user.id,
        status: 'ATTENDED',
      },
    });

    // Award badges for check-in
    const newBadges = await awardBadgesForCheckIn(user.id, registration.event.id);

    return NextResponse.json({
      success: true,
      user: {
        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
        membership: user.membership?.status || 'NONE',
      },
      event: {
        title: registration.event.title,
      },
      newBadges,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
