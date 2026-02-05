/**
 * Public Board Members API
 *
 * Get active board members for public display.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/board-members - Get active board members
export async function GET() {
  try {
    const boardMembers = await prisma.boardMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        title: true,
        email: true,
        imageUrl: true,
        bio: true,
      },
    });

    return NextResponse.json(boardMembers);
  } catch (error) {
    console.error('Board members fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board members' },
      { status: 500 }
    );
  }
}
