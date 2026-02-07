export const dynamic = 'force-dynamic';
/**
 * Admin Users API
 *
 * CRUD operations for user management.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAdmin,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildWhereClause,
} from '../utils';

// GET /api/admin/users - List users
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters, ['name', 'email', 'firstName', 'lastName']);

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [field]: order },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          phone: true,
          emailVerified: true,
          isValidated: true,
          isBanned: true,
          bannedFromClassifieds: true,
          bannedFromMedia: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
          membership: {
            select: {
              type: true,
              status: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Bulk delete users
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing ids array' },
        { status: 400 }
      );
    }

    await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin users bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}
