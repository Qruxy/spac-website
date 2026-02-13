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

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          NOT_COMPANION,
          {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
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
