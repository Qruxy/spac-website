export const dynamic = 'force-dynamic';
/**
 * Admin Events API
 *
 * CRUD operations for event management.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import slugify from 'slugify';
import {
  requireAdmin,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildWhereClause,
} from '../utils';

// GET /api/admin/events - List events
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters, ['title', 'description']);

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { [field]: order },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin events list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Create event
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const {
      title,
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
      imageUrl,
    } = body;

    // Parse dates safely: date-only strings (no T) default to noon UTC to avoid timezone shift
    const safeDate = (val: string): Date => {
      if (val && !val.includes('T')) return new Date(val + 'T12:00:00');
      return new Date(val);
    };

    if (!title || !type || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, startDate' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Handle pricing based on isFreeEvent flag
    const finalMemberPrice = isFreeEvent ? 0 : (memberPrice ? Number(memberPrice) : 0);
    const finalGuestPrice = isFreeEvent ? 0 : (guestPrice ? Number(guestPrice) : 0);

    // Build data object matching Prisma schema field names
    const eventData: Record<string, unknown> = {
      title,
      slug,
      description: description || '',
      type,
      status: status || 'PUBLISHED', // Default to PUBLISHED so events show immediately
      startDate: safeDate(startDate),
      endDate: endDate ? safeDate(endDate) : safeDate(startDate),
      locationName: locationName || 'TBD',
      locationAddress: locationAddress || null,
      capacity: capacity ? Number(capacity) : null,
      memberPrice: finalMemberPrice,
      guest_price: finalGuestPrice,
      campingAvailable: campingAvailable ?? false,
      camping_price: campingPrice ? Number(campingPrice) : 0,
      registration_opens: registrationOpens ? new Date(registrationOpens) : null,
      registration_closes: registrationCloses ? new Date(registrationCloses) : null,
      isRecurring: isRecurring ?? false,
      recurrencePattern: recurrencePattern || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      imageUrl: imageUrl || null,
      createdById: auth.userId!,
    };

    const event = await prisma.event.create({
      data: eventData as Parameters<typeof prisma.event.create>[0]['data'],
    });

    // Log creation
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'CREATE',
        entityType: 'Event',
        entityId: event.id,
        newValues: { title, type },
      },
    });

    // Revalidate the events pages so new events show immediately
    revalidatePath('/events');
    revalidatePath('/');

    return NextResponse.json(event);
  } catch (error) {
    console.error('Admin create event error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create event', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events - Bulk delete events
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

    await prisma.event.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin events bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete events' },
      { status: 500 }
    );
  }
}
