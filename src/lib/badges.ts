import { prisma } from '@/lib/db';

interface BadgeCriteria {
  type: 'event_count' | 'first_event' | 'obs_event' | 'membership_active' | 'unique_months' | 'obs_count';
  count?: number;
}

/**
 * Count total attended events for a user across both regular events
 * (Registration model) and OBS events (OBSRegistration model).
 */
async function getTotalAttendedCount(userId: string): Promise<number> {
  const [regCount, obsCount] = await Promise.all([
    prisma.registration.count({
      where: {
        userId,
        OR: [
          { status: 'ATTENDED' },
          { checkedInAt: { not: null } },
        ],
      },
    }),
    prisma.oBSRegistration.count({
      where: {
        userId,
        checkedIn: true,
      },
    }),
  ]);

  return regCount + obsCount;
}

/**
 * Count OBS events attended by a user.
 */
async function getOBSAttendedCount(userId: string): Promise<number> {
  return prisma.oBSRegistration.count({
    where: {
      userId,
      checkedIn: true,
    },
  });
}

/**
 * Count unique months in which a user attended events.
 */
async function getUniqueMonthsAttended(userId: string): Promise<number> {
  const [regs, obsRegs] = await Promise.all([
    prisma.registration.findMany({
      where: {
        userId,
        OR: [
          { status: 'ATTENDED' },
          { checkedInAt: { not: null } },
        ],
      },
      select: { checkedInAt: true, event: { select: { startDate: true } } },
    }),
    prisma.oBSRegistration.findMany({
      where: { userId, checkedIn: true },
      select: { checkedInAt: true },
    }),
  ]);

  const months = new Set<string>();

  for (const reg of regs) {
    const date = reg.checkedInAt || reg.event.startDate;
    if (date) {
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
    }
  }

  for (const obsReg of obsRegs) {
    if (obsReg.checkedInAt) {
      months.add(`${obsReg.checkedInAt.getFullYear()}-${obsReg.checkedInAt.getMonth()}`);
    }
  }

  return months.size;
}

/**
 * Check if a user has an active membership.
 */
async function hasActiveMembership(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: { userId },
    select: { status: true },
  });
  return membership?.status === 'ACTIVE';
}

/**
 * Evaluate whether a user qualifies for a badge based on its criteria.
 */
async function evaluateCriteria(
  criteria: BadgeCriteria,
  userId: string,
  context: {
    attendedCount: number;
    isOBSEvent?: boolean;
  }
): Promise<boolean> {
  switch (criteria.type) {
    case 'event_count':
      return typeof criteria.count === 'number' && context.attendedCount >= criteria.count;

    case 'first_event':
      return context.attendedCount >= 1;

    case 'obs_event':
      return context.isOBSEvent === true;

    case 'obs_count': {
      const obsCount = await getOBSAttendedCount(userId);
      return typeof criteria.count === 'number' && obsCount >= criteria.count;
    }

    case 'membership_active':
      return hasActiveMembership(userId);

    case 'unique_months': {
      const months = await getUniqueMonthsAttended(userId);
      return typeof criteria.count === 'number' && months >= criteria.count;
    }

    default:
      return false;
  }
}

/**
 * Award badges to a user after a successful event check-in.
 * Checks all active badges with criteria and awards any the user qualifies for.
 * Returns an array of newly earned badge names.
 *
 * @param userId - The user being checked in
 * @param eventId - The event ID (optional, null for OBS events)
 * @param options.isOBSEvent - Whether this is an OBS event check-in
 */
export async function awardBadgesForCheckIn(
  userId: string,
  eventId: string | null,
  options?: { isOBSEvent?: boolean }
): Promise<string[]> {
  const attendedCount = await getTotalAttendedCount(userId);

  // Determine if this is an OBS event
  let isOBSEvent = options?.isOBSEvent ?? false;
  if (!isOBSEvent && eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { type: true, title: true },
    });
    if (event) {
      const titleLower = (event.title || '').toLowerCase();
      const typeLower = (event.type || '').toLowerCase();
      isOBSEvent =
        titleLower.includes('obs') ||
        titleLower.includes('orange blossom') ||
        typeLower.includes('obs');
    }
  }

  // Fetch all active badges that have criteria defined
  const badges = await prisma.badge.findMany({
    where: {
      isActive: true,
      criteria: { not: null as unknown as undefined },
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
    if (earnedBadgeIds.has(badge.id)) {
      continue;
    }

    const criteria = badge.criteria as BadgeCriteria | null;
    if (!criteria || !criteria.type) {
      continue;
    }

    const qualifies = await evaluateCriteria(criteria, userId, {
      attendedCount,
      isOBSEvent,
    });

    if (qualifies) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: { userId, badgeId: badge.id },
        },
        create: {
          userId,
          badgeId: badge.id,
          ...(eventId ? { eventId } : {}),
        },
        update: {},
      });

      await prisma.notification.create({
        data: {
          userId,
          type: 'BADGE_EARNED',
          title: 'Badge Earned!',
          body: `You earned the "${badge.name}" badge! ${badge.icon}`,
          link: '/dashboard/badges',
        },
      });

      newlyEarned.push(badge.name);
    }
  }

  return newlyEarned;
}

/**
 * Re-evaluate a user's badges and revoke any they no longer qualify for.
 * Called when a check-in is reversed or attendance status changes.
 * Only revokes badges that have auto-award criteria (never revokes manual-only badges).
 * Returns an array of revoked badge names.
 */
export async function revokeBadgesIfUnqualified(
  userId: string
): Promise<string[]> {
  const attendedCount = await getTotalAttendedCount(userId);

  // Check if user has attended any OBS event (for obs_event criteria)
  const obsAttended = await getOBSAttendedCount(userId);
  // Also check regular registrations for OBS-type events
  const obsRegularEvents = await prisma.registration.count({
    where: {
      userId,
      OR: [
        { status: 'ATTENDED' },
        { checkedInAt: { not: null } },
      ],
      event: {
        OR: [
          { title: { contains: 'OBS', mode: 'insensitive' } },
          { title: { contains: 'Orange Blossom', mode: 'insensitive' } },
          { type: { contains: 'OBS', mode: 'insensitive' } },
        ],
      },
    },
  });
  const hasAnyOBS = obsAttended > 0 || obsRegularEvents > 0;

  // Get all the user's earned badges that have criteria (auto-awarded)
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  const revoked: string[] = [];

  for (const ub of userBadges) {
    const criteria = ub.badge.criteria as BadgeCriteria | null;
    // Never revoke manual-only badges (no criteria)
    if (!criteria || !criteria.type) {
      continue;
    }

    let stillQualifies = false;

    switch (criteria.type) {
      case 'event_count':
        stillQualifies = typeof criteria.count === 'number' && attendedCount >= criteria.count;
        break;
      case 'first_event':
        stillQualifies = attendedCount >= 1;
        break;
      case 'obs_event':
        stillQualifies = hasAnyOBS;
        break;
      case 'obs_count':
        stillQualifies = typeof criteria.count === 'number' && obsAttended >= criteria.count;
        break;
      case 'membership_active':
        stillQualifies = await hasActiveMembership(userId);
        break;
      case 'unique_months': {
        const months = await getUniqueMonthsAttended(userId);
        stillQualifies = typeof criteria.count === 'number' && months >= criteria.count;
        break;
      }
    }

    if (!stillQualifies) {
      await prisma.userBadge.delete({
        where: { id: ub.id },
      });
      revoked.push(ub.badge.name);
    }
  }

  return revoked;
}

/**
 * Recalculate badges for all users (or a specific user).
 * Awards any badges users qualify for but haven't earned yet.
 * Returns summary of awards made.
 */
export async function recalculateBadges(
  targetUserId?: string
): Promise<{ totalAwarded: number; userAwards: { userId: string; badges: string[] }[] }> {
  // Get all users who have any attendance (no point checking users with zero events)
  let userIds: string[];

  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const [regUsers, obsUsers] = await Promise.all([
      prisma.registration.findMany({
        where: {
          OR: [
            { status: 'ATTENDED' },
            { checkedInAt: { not: null } },
          ],
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.oBSRegistration.findMany({
        where: {
          checkedIn: true,
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const idSet = new Set<string>();
    for (const r of regUsers) idSet.add(r.userId);
    for (const r of obsUsers) {
      if (r.userId) idSet.add(r.userId);
    }
    userIds = Array.from(idSet);
  }

  // Fetch all active badges with criteria
  const badges = await prisma.badge.findMany({
    where: {
      isActive: true,
      criteria: { not: null as unknown as undefined },
    },
  });

  const userAwards: { userId: string; badges: string[] }[] = [];
  let totalAwarded = 0;

  for (const userId of userIds) {
    const attendedCount = await getTotalAttendedCount(userId);

    // Check if user has any OBS attendance
    const obsCount = await getOBSAttendedCount(userId);
    const obsRegularEvents = await prisma.registration.count({
      where: {
        userId,
        OR: [
          { status: 'ATTENDED' },
          { checkedInAt: { not: null } },
        ],
        event: {
          OR: [
            { title: { contains: 'OBS', mode: 'insensitive' } },
            { title: { contains: 'Orange Blossom', mode: 'insensitive' } },
            { type: { contains: 'OBS', mode: 'insensitive' } },
          ],
        },
      },
    });
    const hasAnyOBS = obsCount > 0 || obsRegularEvents > 0;

    // Get existing badges for this user
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedBadgeIds = new Set(existingBadges.map((ub) => ub.badgeId));

    const awarded: string[] = [];

    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as BadgeCriteria | null;
      if (!criteria || !criteria.type) continue;

      const qualifies = await evaluateCriteria(criteria, userId, {
        attendedCount,
        isOBSEvent: hasAnyOBS,
      });

      if (qualifies) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: { userId, badgeId: badge.id },
          },
          create: { userId, badgeId: badge.id },
          update: {},
        });

        await prisma.notification.create({
          data: {
            userId,
            type: 'BADGE_EARNED',
            title: 'Badge Earned!',
            body: `You earned the "${badge.name}" badge! ${badge.icon}`,
            link: '/dashboard/badges',
          },
        });

        awarded.push(badge.name);
        totalAwarded++;
      }
    }

    if (awarded.length > 0) {
      userAwards.push({ userId, badges: awarded });
    }
  }

  return { totalAwarded, userAwards };
}

// ── Default badge seeds ──

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
        criteria: badge.criteria as unknown as Record<string, unknown>,
        isActive: true,
        sortOrder: badge.sortOrder,
      },
      update: {},
    });
  }
}
