/**
 * Admin Single Registration API
 *
 * Get, update, delete individual registration.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/registrations/[id] - Get single registration
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            locationName: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Admin get registration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/registrations/[id] - Update registration
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      status,
      guestCount,
      campingRequested,
      dietary_restrictions,
      notes,
      checkedInAt,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (guestCount !== undefined) updateData.guestCount = Number(guestCount);
    if (campingRequested !== undefined) updateData.campingRequested = campingRequested;
    if (dietary_restrictions !== undefined) updateData.dietary_restrictions = dietary_restrictions;
    if (notes !== undefined) updateData.notes = notes;

    // Handle check-in
    if (checkedInAt !== undefined) {
      if (checkedInAt === null || checkedInAt === false) {
        updateData.checkedInAt = null;
        updateData.checkedInById = null;
      } else if (checkedInAt === true) {
        updateData.checkedInAt = new Date();
        updateData.checkedInById = auth.userId!;
      } else {
        updateData.checkedInAt = new Date(checkedInAt);
        updateData.checkedInById = auth.userId!;
      }
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: { title: true },
        },
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: status === 'CONFIRMED' ? 'APPROVAL' : 'UPDATE',
        entityType: 'Registration',
        entityId: id,
        newValues: {
          status,
          event: registration.event.title,
          user: `${registration.user.firstName} ${registration.user.lastName}`,
        },
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Admin update registration error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/registrations/[id] - Delete registration
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    await prisma.registration.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'Registration',
        entityId: id,
        oldValues: {
          event: registration.event.title,
          user: `${registration.user.firstName} ${registration.user.lastName}`,
          email: registration.user.email,
        },
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Admin delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
