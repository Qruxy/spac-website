/**
 * Event Registration Checkout API
 *
 * Creates a PayPal order for paid event registrations.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPayPalOrder, capturePayPalOrder } from '@/lib/paypal';
import { prisma } from '@/lib/db';

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
    const { eventId, guestCount = 0 } = body as {
      eventId: string;
      guestCount?: number;
    };

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

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

    // Check capacity
    if (event.capacity) {
      const registrationCount = await prisma.registration.count({
        where: {
          eventId,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      });

      if (registrationCount >= event.capacity) {
        return NextResponse.json(
          { error: 'This event is at full capacity' },
          { status: 400 }
        );
      }
    }

    // Calculate price - Decimal needs to be converted to number
    const isMember = session.user.membershipStatus === 'ACTIVE';
    const basePrice = isMember && event.memberPrice
      ? Number(event.memberPrice)
      : Number(event.guest_price || 0);
    const totalPrice = basePrice * (1 + guestCount);

    // Create pending registration
    const registration = await prisma.registration.create({
      data: {
        eventId,
        userId: session.user.id,
        status: 'PENDING',
        guestCount,
      },
    });

    // Create PayPal order
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const order = await createPayPalOrder({
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
