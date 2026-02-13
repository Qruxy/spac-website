import { prisma } from '@/lib/db';

interface BadgeCriteria {
  type: 'event_count' | 'first_event' | 'obs_event';
  count?: number;
}

/**
 * Award badges to a user after a successful event check-in.
 * Checks all active badges with criteria and awards any the user qualifies for.
 * Returns an array of newly earned badge names.
 */
export async function awardBadgesForCheckIn(
  userId: string,
  eventId: string
): Promise<string[]> {
  // Count how many events this user has attended
  const attendedCount = await prisma.registration.count({
    where: {
      userId,
      OR: [
        { status: 'ATTENDED' },
        { checkedInAt: { not: null } },
      ],
    },
  });

  // Fetch the event being checked into (needed for obs_event criteria)
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { type: true, title: true },
  });

  // Fetch all active badges that have criteria defined
  const badges = await prisma.badge.findMany({
    where: {
      isActive: true,
      criteria: { not: null },
    },
  });

  // Fetch the user's already-earned badge IDs
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedBadgeIds = new Set(existingBadges.map((ub) => ub.badgeId));

  const newlyEarned: string[] = [];

  for (const badge of badges) {
    // Skip badges the user already has
    if (earnedBadgeIds.has(badge.id)) {
      continue;
    }

    const criteria = badge.criteria as BadgeCriteria | null;
    if (!criteria || !criteria.type) {
      continue;
    }

    let qualifies = false;

    switch (criteria.type) {
      case 'event_count':
        if (typeof criteria.count === 'number' && attendedCount >= criteria.count) {
          qualifies = true;
        }
        break;

      case 'first_event':
        if (attendedCount >= 1) {
          qualifies = true;
        }
        break;

      case 'obs_event':
        if (event) {
          const titleLower = (event.title || '').toLowerCase();
          const typeLower = (event.type || '').toLowerCase();
          if (
            titleLower.includes('obs') ||
            titleLower.includes('orange blossom') ||
            typeLower.includes('obs')
          ) {
            qualifies = true;
          }
        }
        break;
    }

    if (qualifies) {
      // Award the badge (upsert to handle any race conditions with @@unique)
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        create: {
          userId,
          badgeId: badge.id,
          eventId,
        },
        update: {},
      });

      // Create a notification for the newly earned badge
      await prisma.notification.create({
        data: {
          userId,
          type: 'BADGE_EARNED',
          title: 'Badge Earned!',
          body: `You earned the "${badge.name}" badge! ${badge.icon}`,
          link: '/dashboard',
        },
      });

      newlyEarned.push(badge.name);
    }
  }

  return newlyEarned;
}

interface DefaultBadge {
  name: string;
  icon: string;
  category: 'ATTENDANCE' | 'MILESTONE' | 'SPECIAL' | 'OBS';
  criteria: BadgeCriteria;
  description: string;
  sortOrder: number;
}

const DEFAULT_BADGES: DefaultBadge[] = [
  {
    name: 'First Light',
    icon: '\u{1F52D}',
    category: 'ATTENDANCE',
    criteria: { type: 'first_event' },
    description: 'Attended your first SPAC event',
    sortOrder: 1,
  },
  {
    name: 'Night Owl',
    icon: '\u{1F989}',
    category: 'ATTENDANCE',
    criteria: { type: 'event_count', count: 3 },
    description: 'Attended 3 events',
    sortOrder: 2,
  },
  {
    name: 'Regular Observer',
    icon: '\u{2B50}',
    category: 'ATTENDANCE',
    criteria: { type: 'event_count', count: 5 },
    description: 'Attended 5 events',
    sortOrder: 3,
  },
  {
    name: 'Dedicated Astronomer',
    icon: '\u{1F31F}',
    category: 'MILESTONE',
    criteria: { type: 'event_count', count: 10 },
    description: 'Attended 10 events',
    sortOrder: 4,
  },
  {
    name: 'Veteran Stargazer',
    icon: '\u{1F3C6}',
    category: 'MILESTONE',
    criteria: { type: 'event_count', count: 25 },
    description: 'A true SPAC veteran with 25 events',
    sortOrder: 5,
  },
  {
    name: 'Constellation Collector',
    icon: '\u{2728}',
    category: 'MILESTONE',
    criteria: { type: 'event_count', count: 50 },
    description: '50 events under your belt',
    sortOrder: 6,
  },
  {
    name: 'Century Club',
    icon: '\u{1F4AF}',
    category: 'MILESTONE',
    criteria: { type: 'event_count', count: 100 },
    description: 'An incredible 100 events attended',
    sortOrder: 7,
  },
  {
    name: 'OBS Explorer',
    icon: '\u{1F319}',
    category: 'OBS',
    criteria: { type: 'obs_event' },
    description: 'Attended an Orange Blossom Special event',
    sortOrder: 8,
  },
];

/**
 * Seed the default badge set into the database.
 * Uses upsert so it can be called safely multiple times without duplicating badges.
 */
export async function seedDefaultBadges(): Promise<void> {
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      create: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        criteria: badge.criteria,
        isActive: true,
        sortOrder: badge.sortOrder,
      },
      update: {},
    });
  }
}
