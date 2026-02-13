export const dynamic = 'force-dynamic';

/**
 * User Badges API
 *
 * Returns the current user's earned badges and stats.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/user/badges - Get current user's badges
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [userBadges, totalEventsAttended, allBadgesRaw] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.registration.count({
        where: {
          userId,
          status: 'ATTENDED',
        },
      }),
      prisma.badge.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, description: true, icon: true, category: true },
      }),
    ]);

    const badges = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      category: ub.badge.category,
      earnedAt: ub.earnedAt,
      ...(ub.event ? { eventTitle: ub.event.title } : {}),
    }));

    return NextResponse.json({
      badges,
      allBadges: allBadgesRaw,
      stats: {
        totalEventsAttended,
        totalBadges: allBadgesRaw.length,
        earnedCount: badges.length,
      },
    });
  } catch (error) {
    console.error('User badges fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
