export const dynamic = 'force-dynamic';
/**
 * Admin Single Event API
 *
 * Get, update, delete individual event.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/events/[id] - Get single event
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
        media: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            filename: true,
            alt: true,
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Add computed isFreeEvent field for the form
    const response = {
      ...event,
      isFreeEvent:
        Number(event.memberPrice) === 0 && Number(event.guest_price) === 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin get event error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events/[id] - Update event
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      slug,
      description,
      type,
      status,
      startDate,
      endDate,
      locationName,
      locationAddress,
      capacity,
      isFreeEvent,
      memberPrice,
      guestPrice,
      campingAvailable,
      campingPrice,
      registrationOpens,
      registrationCloses,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
    } = body;

    // Build update data object with correct Prisma schema field names
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (locationAddress !== undefined) updateData.locationAddress = locationAddress || null;
    if (capacity !== undefined) updateData.capacity = capacity ? Number(capacity) : null;

    // Handle pricing - if free event, set prices to 0
    if (isFreeEvent !== undefined) {
      if (isFreeEvent) {
        updateData.memberPrice = 0;
        updateData.guest_price = 0;
      } else {
        if (memberPrice !== undefined) updateData.memberPrice = Number(memberPrice) || 0;
        if (guestPrice !== undefined) updateData.guest_price = Number(guestPrice) || 0;
      }
    } else {
      if (memberPrice !== undefined) updateData.memberPrice = Number(memberPrice) || 0;
      if (guestPrice !== undefined) updateData.guest_price = Number(guestPrice) || 0;
    }

    // Camping
    if (campingAvailable !== undefined) updateData.campingAvailable = campingAvailable;
    if (campingPrice !== undefined) updateData.camping_price = Number(campingPrice) || 0;

    // Registration windows
    if (registrationOpens !== undefined) {
      updateData.registration_opens = registrationOpens ? new Date(registrationOpens) : null;
    }
    if (registrationCloses !== undefined) {
      updateData.registration_closes = registrationCloses ? new Date(registrationCloses) : null;
    }

    // Recurring events
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurrencePattern !== undefined) updateData.recurrencePattern = recurrencePattern || null;
    if (recurrenceEndDate !== undefined) {
      updateData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'Event',
        entityId: id,
        newValues: {
          updatedFields: Object.keys(body),
        },
      },
    });

    // Revalidate events pages
    revalidatePath('/events');
    revalidatePath(`/events/${event.slug}`);
    revalidatePath('/');

    return NextResponse.json(event);
  } catch (error) {
    console.error('Admin update event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update event', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const event = await prisma.event.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'Event',
        entityId: id,
        oldValues: { title: event.title },
      },
    });

    // Revalidate events pages
    revalidatePath('/events');
    revalidatePath('/');

    return NextResponse.json(event);
  } catch (error) {
    console.error('Admin delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}