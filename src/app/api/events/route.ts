/**
 * Public Events API
 *
 * Returns published events for the public events page and calendar.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/events - Get published events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    // Build where clause
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    };

    // Filter by type if provided (case-insensitive)
    if (type && type !== 'all') {
      where.type = {
        equals: type,
        mode: 'insensitive',
      };
    }

    // Filter by date range if provided (for calendar views)
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        (where.startDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.startDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit ? parseInt(limit) : undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        locationName: true,
        locationAddress: true,
        capacity: true,
        memberPrice: true,
        guest_price: true,
        campingAvailable: true,
        camping_price: true,
        registration_opens: true,
        registration_closes: true,
        isRecurring: true,
        recurrencePattern: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    // Transform events to include computed fields
    const transformedEvents = events.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      locationName: event.locationName,
      locationAddress: event.locationAddress,
      capacity: event.capacity,
      memberPrice: Number(event.memberPrice),
      guestPrice: Number(event.guest_price),
      campingAvailable: event.campingAvailable,
      campingPrice: Number(event.camping_price),
      registrationOpens: event.registration_opens?.toISOString() || null,
      registrationCloses: event.registration_closes?.toISOString() || null,
      isRecurring: event.isRecurring,
      recurrencePattern: event.recurrencePattern,
      registrationCount: event._count.registrations,
      spotsAvailable: event.capacity
        ? event.capacity - event._count.registrations
        : null,
    }));

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error('Public events fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
