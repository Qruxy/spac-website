export function generateStaticParams() { return []; }
/**
 * Admin Single User API
 *
 * Get, update, delete individual user.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        membership: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow updating certain fields
    const { name, firstName, lastName, role, phone, emailVerified, isValidated } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(emailVerified !== undefined && { emailVerified: emailVerified ? new Date() : null }),
        ...(isValidated !== undefined && { isValidated }),
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        newValues: {
          updatedFields: Object.keys(body),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const user = await prisma.user.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}