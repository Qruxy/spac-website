/**
 * Event Registration Checkout API
 *
 * Creates a PayPal order for paid event registrations.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPayPalOrder, capturePayPalOrder } from '@/lib/paypal';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CheckoutSchema = z.object({
  eventId: z.string().min(1),
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
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }
    const { eventId, guestCount } = parsed.data;

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

    // Check if this is a free event (both prices are 0)
    const isFreeEvent = Number(event.memberPrice) === 0 && Number(event.guest_price) === 0;
    if (isFreeEvent) {
      return NextResponse.json(
        { error: 'This event is free and does not require payment' },
        { status: 400 }
      );
    }

    // Check if user is already registered
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

    // Calculate price — query membership fresh (don't trust stale session cache)
    const freshMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
    });
    const isMember = !!freshMembership;
    const basePrice = isMember && event.memberPrice
      ? Number(event.memberPrice)
      : Number(event.guest_price || 0);
    const totalPrice = basePrice * (1 + guestCount);

    // Atomically check capacity and create PENDING registration in a transaction.
    // Lock the event row (SELECT FOR UPDATE) so concurrent checkouts queue up
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
            status: 'PENDING',
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

    // Create PayPal order — on failure, cancel the PENDING registration to free capacity
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let order;
    try {
      order = await createPayPalOrder({
        amount: totalPrice,
        description: `Event Registration: ${event.title}${guestCount > 0 ? ` (+${guestCount} guests)` : ''}`,
        returnUrl: `${baseUrl}/api/checkout/event/capture?registrationId=${registration.id}`,
        cancelUrl: `${baseUrl}/events/${event.slug}?canceled=true`,
        metadata: {
          type: 'event_registration',
          userId: session.user.id,
          eventId,
          registrationId: registration.id,
          guestCount: String(guestCount),
        },
      });
    } catch (paypalError) {
      // Rollback: cancel the PENDING registration so capacity is not permanently consumed
      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'CANCELLED' },
      }).catch(e => console.error('Failed to rollback registration:', e));
      throw paypalError;
    }

    // Find the approval URL
    const approvalLink = order.links.find(link => link.rel === 'approve');

    return NextResponse.json({
      orderId: order.id,
      url: approvalLink?.href,
    });
  } catch (error) {
    console.error('Event checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
