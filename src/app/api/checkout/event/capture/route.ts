/**
 * Event Payment Capture API
 *
 * Captures PayPal payment after user approval and updates registration status.
 */

import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal order ID
  const registrationId = searchParams.get('registrationId');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!token || !registrationId) {
    return NextResponse.redirect(`${baseUrl}/my-events?error=missing_parameters`);
  }

  try {
    // Get the registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      return NextResponse.redirect(`${baseUrl}/my-events?error=registration_not_found`);
    }

    // Idempotency: if already confirmed, redirect to success (handles duplicate browser requests)
    if (registration.status === 'CONFIRMED') {
      return NextResponse.redirect(`${baseUrl}/my-events?registered=${registration.eventId}`);
    }

    // Only capture PENDING registrations
    if (registration.status !== 'PENDING') {
      return NextResponse.redirect(`${baseUrl}/my-events?error=registration_not_capturable`);
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(token);

    if (captureResult.status === 'COMPLETED') {
      const capturedAmount = captureResult.purchase_units[0]?.payments?.captures[0]?.amount;
      
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: registration.userId,
          type: 'EVENT_TICKET',
          amount: capturedAmount ? parseFloat(capturedAmount.value) : 0,
          currency: capturedAmount?.currency_code || 'USD',
          paypalOrderId: captureResult.id,
          status: 'SUCCEEDED',
          paidAt: new Date(),
          description: `Event registration: ${registration.event.title}`,
        },
      });

      // Update registration to confirmed
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: 'CONFIRMED',
          paymentId: payment.id,
          amountPaid: capturedAmount ? parseFloat(capturedAmount.value) : 0,
        },
      });

      // Log the event registration
      await prisma.auditLog.create({
        data: {
          user_id: registration.userId,
          actorId: registration.userId,
          subjectId: registration.userId,
          action: 'PAYMENT',
          entityType: 'Registration',
          entityId: registrationId,
          metadata: {
            eventId: registration.eventId,
            paypalOrderId: captureResult.id,
            event: 'registration_paid',
          },
        },
      });

      return NextResponse.redirect(`${baseUrl}/my-events?registered=${registration.eventId}`);
    } else {
      // Payment failed - update registration status
      await prisma.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.redirect(`${baseUrl}/events/${registration.event.slug}?error=payment_failed`);
    }
  } catch (error) {
    console.error('Failed to capture event payment:', error);
    return NextResponse.redirect(`${baseUrl}/my-events?error=capture_failed`);
  }
}
