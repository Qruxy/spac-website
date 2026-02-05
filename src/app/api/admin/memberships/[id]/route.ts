/**
 * Admin Single Membership API
 *
 * Get, update individual membership.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/memberships/[id] - Get single membership
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error('Admin get membership error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/memberships/[id] - Update membership
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      type,
      status,
      startDate,
      endDate,
      obsEligible,
      discountPercent,
    } = body;

    const membership = await prisma.membership.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(obsEligible !== undefined && { obsEligible }),
        ...(discountPercent !== undefined && { discountPercent }),
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'Membership',
        entityId: id,
        newValues: {
          updatedFields: Object.keys(body),
        },
      },
    });

    return NextResponse.json(membership);
  } catch (error) {
    console.error('Admin update membership error:', error);
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    );
  }
}
