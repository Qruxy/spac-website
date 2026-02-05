/**
 * Authentication Helpers
 *
 * Server-side utilities for authentication and authorization.
 */

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth.config';

export { authOptions } from './auth.config';

/**
 * Get the current session on the server
 * Cached per-request to prevent duplicate DB queries
 */
export const getSession = cache(async () => {
  return getServerSession(authOptions);
});

/**
 * Get the current user or null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  return session.user;
}

/**
 * Require specific role - redirects to dashboard if insufficient permissions
 */
export async function requireRole(allowedRoles: Array<'MEMBER' | 'MODERATOR' | 'ADMIN'>) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard?error=unauthorized');
  }
  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole(['ADMIN']);
}

/**
 * Require moderator or admin role
 */
export async function requireModerator() {
  return requireRole(['MODERATOR', 'ADMIN']);
}

/**
 * Check if user is authenticated (without redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if user has active membership
 */
export async function hasActiveMembership(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.membershipStatus === 'ACTIVE';
}
