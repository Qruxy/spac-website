/**
 * Event Registration API
 *
 * Handles free event registrations (no payment required).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Zod schema for event registration
const EventRegistrationSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
  guestCount: z.number().int().min(0).max(10).default(0),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input with Zod
    const result = EventRegistrationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { eventId, guestCount } = result.data;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify this is a free event (price is 0 or null)
    const isFreeEvent = Number(event.memberPrice) === 0 && Number(event.guest_price) === 0;
    if (!isFreeEvent) {
      return NextResponse.json(
        { error: 'This event requires payment. Please use the checkout flow.' },
        { status: 400 }
      );
    }

    // Check if user is already registered (outside tx — fast-path rejection)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        userId: session.user.id,
        status: { not: 'CANCELLED' },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Atomically check capacity and create registration in a transaction.
    // Lock the event row (SELECT FOR UPDATE) so concurrent requests queue up
    // rather than racing past the capacity check simultaneously.
    let registration: Awaited<ReturnType<typeof prisma.registration.create>>;
    try {
      registration = await prisma.$transaction(async (tx) => {
        if (event.capacity) {
          await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
          const count = await tx.registration.count({
            where: { eventId, status: { in: ['CONFIRMED', 'PENDING'] } },
          });
          if (count >= event.capacity) {
            throw Object.assign(new Error('AT_CAPACITY'), { code: 'AT_CAPACITY' });
          }
        }
        return tx.registration.create({
          data: {
            eventId,
            userId: session.user.id,
            status: 'CONFIRMED',
            guestCount,
          },
        });
      });
    } catch (txErr) {
      if ((txErr as { code?: string }).code === 'AT_CAPACITY') {
        return NextResponse.json(
          { error: 'This event is at full capacity' },
          { status: 400 }
        );
      }
      throw txErr;
    }

    // Log the registration
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        actorId: session.user.id,
        subjectId: session.user.id,
        action: 'CREATE',
        entityType: 'Registration',
        entityId: registration.id,
        metadata: {
          eventId,
          eventTitle: event.title,
          guestCount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        status: registration.status,
        eventId: registration.eventId,
      },
    });
  } catch (error) {
    console.error('Event registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// Cancel registration
export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Get registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this registration' },
        { status: 403 }
      );
    }

    // Update registration status
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Log the cancellation
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        actorId: session.user.id,
        subjectId: session.user.id,
        action: 'UPDATE',
        entityType: 'Registration',
        entityId: registrationId,
        metadata: {
          eventId: registration.eventId,
          eventTitle: registration.event.title,
          status: 'CANCELLED',
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    );
  }
}
