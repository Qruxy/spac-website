export const dynamic = 'force-dynamic';

/**
 * Admin Single Badge API
 *
 * Update, delete, or manually award a badge.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/badges/[id] - Update a badge
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, icon, category, criteria, isActive, sortOrder } = body as {
      name?: string;
      description?: string;
      icon?: string;
      category?: string;
      criteria?: Record<string, unknown> | null;
      isActive?: boolean;
      sortOrder?: number;
    };

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (category !== undefined) updateData.category = category;
    if (criteria !== undefined) updateData.criteria = criteria;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const badge = await prisma.badge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(badge);
  } catch (error) {
    console.error('Admin update badge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update badge', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/badges/[id] - Delete a badge (cascades to UserBadge records)
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    await prisma.badge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete badge error:', error);
    return NextResponse.json(
      { error: 'Failed to delete badge' },
      { status: 500 }
    );
  }
}

// POST /api/admin/badges/[id] - Manually award a badge to a user
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id: badgeId } = await params;
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Verify badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // Create the UserBadge record
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId,
        type: 'BADGE_EARNED',
        title: 'New Badge Earned!',
        body: `You earned the "${badge.name}" badge: ${badge.description}`,
        link: '/dashboard/badges',
        metadata: {
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon,
        },
      },
    });

    return NextResponse.json({ success: true, userBadge });
  } catch (error) {
    console.error('Admin award badge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle unique constraint violation (user already has this badge)
    if (errorMessage.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'User already has this badge' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to award badge', details: errorMessage },
      { status: 500 }
    );
  }
}
