/**
 * OBS Payment Capture API
 *
 * Captures PayPal payment after user approval and updates OBS registration status.
 */

import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal order ID
  const registrationId = searchParams.get('registration_id');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!token || !registrationId) {
    return NextResponse.redirect(`${baseUrl}/obs?error=missing_parameters`);
  }

  try {
    // Get the registration
    const registration = await prisma.oBSRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return NextResponse.redirect(`${baseUrl}/obs?error=registration_not_found`);
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(token);

    if (captureResult.status === 'COMPLETED') {
      const capturedAmount = captureResult.purchase_units[0]?.payments?.captures[0]?.amount;
      
      // Update registration to paid
      await prisma.oBSRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: 'PAID',
          paymentDate: new Date(),
          amountPaid: capturedAmount ? parseFloat(capturedAmount.value) : 0,
          paypalOrderId: captureResult.id,
        },
      });

      return NextResponse.redirect(`${baseUrl}/obs/success?registration_id=${registrationId}`);
    } else {
      // Payment failed - update registration status
      await prisma.oBSRegistration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'PENDING' },
      });

      return NextResponse.redirect(`${baseUrl}/obs?error=payment_failed`);
    }
  } catch (error) {
    console.error('Failed to capture OBS payment:', error);
    return NextResponse.redirect(`${baseUrl}/obs?error=capture_failed`);
  }
}
