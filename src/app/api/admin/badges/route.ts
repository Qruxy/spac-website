export const dynamic = 'force-dynamic';

/**
 * Admin Badges API
 *
 * List all badges and create new badges.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../utils';

// GET /api/admin/badges - List all badges with earned counts
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const badges = await prisma.badge.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { userBadges: true },
        },
      },
    });

    const data = badges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      criteria: badge.criteria,
      isActive: badge.isActive,
      sortOrder: badge.sortOrder,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt,
      earnedCount: badge._count.userBadges,
    }));

    return NextResponse.json({ badges: data });
  } catch (error) {
    console.error('Admin badges list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

// POST /api/admin/badges - Create a new badge
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { name, description, icon, category, criteria, sortOrder } = body as {
      name: string;
      description: string;
      icon: string;
      category: string;
      criteria?: Record<string, unknown>;
      sortOrder?: number;
    };

    if (!name || !description || !icon || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, icon, category' },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        icon,
        category: category as 'ATTENDANCE' | 'MILESTONE' | 'SPECIAL' | 'OBS',
        criteria: criteria ?? undefined,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Admin create badge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create badge', details: errorMessage },
      { status: 500 }
    );
  }
}
