/**
 * User Search API for Messages
 *
 * Allows users to search for other users to start conversations with.
 */

import { NextResponse } from 'next/server';
import { prisma, NOT_COMPANION } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Use startsWith for name fields so "Ty" matches "Tyler" but not "Murphy"
    // Only fall back to email contains for exact-looking queries (3+ chars)
    const nameFilters = [
      { firstName: { startsWith: q, mode: 'insensitive' as const } },
      { lastName: { startsWith: q, mode: 'insensitive' as const } },
    ];

    // For the combined "name" field, check startsWith and optionally contains
    // (handles "John Smith" when searching "Smi" or "John S")
    const nameContainsFilters: Array<Record<string, unknown>> = [
      { name: { startsWith: q, mode: 'insensitive' } },
    ];

    // If query has a space, also do substring match on full name
    if (q.includes(' ')) {
      nameContainsFilters.push(
        { name: { contains: q, mode: 'insensitive' } },
      );
    }

    // Only search email if query is 3+ chars to avoid noisy partial matches
    const emailFilter = q.length >= 3
      ? [{ email: { startsWith: q, mode: 'insensitive' as const } }]
      : [];

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          NOT_COMPANION,
          {
            OR: [
              ...nameFilters,
              ...nameContainsFilters,
              ...emailFilter,
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        avatarUrl: true,
        image: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 10,
    });

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User',
        email: u.email || '',
        avatarUrl: u.avatarUrl || u.image,
      })),
    });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
