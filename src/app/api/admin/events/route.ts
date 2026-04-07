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
      recurrenceCount,
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

    // Generate recurring child events if requested
    if (isRecurring && recurrencePattern && event.startDate) {
      const childEvents: Record<string, unknown>[] = [];
      const durationMs = event.endDate
        ? event.endDate.getTime() - event.startDate.getTime()
        : 0;

      // Helper: advance a date by one recurrence step
      const advance = (d: Date): Date => {
        const next = new Date(d);
        if (recurrencePattern === 'DAILY')    next.setUTCDate(next.getUTCDate() + 1);
        if (recurrencePattern === 'WEEKLY')   next.setUTCDate(next.getUTCDate() + 7);
        if (recurrencePattern === 'BIWEEKLY') next.setUTCDate(next.getUTCDate() + 14);
        if (recurrencePattern === 'MONTHLY')  next.setUTCMonth(next.getUTCMonth() + 1);
        if (recurrencePattern === 'YEARLY')   next.setUTCFullYear(next.getUTCFullYear() + 1);
        return next;
      };

      const MAX_OCCURRENCES = 104; // safety cap (~2 years of weekly events)
      let current = advance(event.startDate); // parent is occurrence #1
      let count = 1; // parent already counts as 1

      const endByDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
      const endByCount = recurrenceCount ? parseInt(String(recurrenceCount)) : null;

      while (count < (endByCount ?? MAX_OCCURRENCES)) {
        if (endByDate && current > endByDate) break;
        if (!endByCount && !endByDate) break; // no end condition provided

        const childStartDate = new Date(current);
        const childEndDate = new Date(current.getTime() + durationMs);

        // Generate unique slug for child
        const childSlug = `${event.slug}-${count + 1}`;

        childEvents.push({
          title: event.title,
          slug: childSlug,
          description: event.description,
          type: event.type,
          status: event.status,
          startDate: childStartDate,
          endDate: childEndDate,
          timezone: event.timezone,
          locationName: event.locationName,
          locationAddress: event.locationAddress,
          capacity: event.capacity,
          memberPrice: event.memberPrice,
          guest_price: event.guest_price,
          campingAvailable: event.campingAvailable,
          camping_price: event.camping_price,
          imageUrl: event.imageUrl,
          isRecurring: false,
          parentEventId: event.id,
          createdById: auth.userId!,
        });

        current = advance(current);
        count++;
      }

      if (childEvents.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.event.createMany({ data: childEvents as any });
      }
    }

    // Log creation
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'CREATE',
        entityType: 'Event',
        entityId: event.id,
        newValues: { title, type, isRecurring, recurrencePattern },
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

// PUT /api/admin/events - Bulk status update
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids, status } = body as { ids: string[]; status: string };

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json(
        { error: 'Missing ids array or status' },
        { status: 400 }
      );
    }

    await prisma.event.updateMany({
      where: { id: { in: ids } },
      data: { status: status as any },
    });

    return NextResponse.json({ ids, status });
  } catch (error) {
    console.error('Admin events bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update events' },
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
