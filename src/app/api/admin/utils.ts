/**
 * Admin API Utilities
 *
 * Shared utilities for admin API routes.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Check if user has admin access
 */
export async function requireAdmin(): Promise<{
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}> {
  const session = await getSession();

  if (!session?.user) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
  };
}

/**
 * Parse pagination params from URL
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  skip: number;
  take: number;
} {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '10', 10);
  const skip = (page - 1) * perPage;
  const take = perPage;

  return { page, perPage, skip, take };
}

/**
 * Parse sort params from URL
 */
export function parseSortParams(searchParams: URLSearchParams): {
  field: string;
  order: 'asc' | 'desc';
} {
  const field = searchParams.get('sortField') || 'createdAt';
  const order = (searchParams.get('sortOrder') || 'DESC').toLowerCase() as 'asc' | 'desc';

  return { field, order };
}

/**
 * Parse filter params from URL
 */
export function parseFilterParams(searchParams: URLSearchParams): Record<string, unknown> {
  const filterStr = searchParams.get('filter');
  if (!filterStr) return {};

  try {
    return JSON.parse(filterStr);
  } catch {
    return {};
  }
}

/**
 * Build Prisma where clause from filters
 */
export function buildWhereClause(
  filters: Record<string, unknown>,
  searchFields: string[] = []
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;

    // Handle search query
    if (key === 'q' && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: value, mode: 'insensitive' },
      }));
      continue;
    }

    // Handle array of IDs
    if (key === 'ids' && Array.isArray(value)) {
      where.id = { in: value };
      continue;
    }

    // Direct match
    where[key] = value;
  }

  return where;
}
