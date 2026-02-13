/**
 * Database Client Export
 *
 * Re-exports the Prisma client singleton for use throughout the application.
 */

export { prisma } from './prisma';
export { prisma as db } from './prisma';

/**
 * Prisma WHERE clause that excludes companion accounts.
 *
 * Family memberships create synthetic "+companion@" user records.
 * These are NOT real users — they have no login credentials and should
 * never appear in search results, member lists, email recipients,
 * or aggregate counts.
 *
 * Usage:  prisma.user.findMany({ where: { ...NOT_COMPANION, ...otherFilters } })
 *    or:  prisma.user.count({ where: { ...NOT_COMPANION } })
 */
export const NOT_COMPANION = {
  NOT: { email: { contains: '+companion@' } },
} as const;
