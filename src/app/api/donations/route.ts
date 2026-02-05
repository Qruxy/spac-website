/**
 * Donations API
 *
 * Creates PayPal orders for one-time and recurring donations.
 */

import { NextResponse } from 'next/server';
import { createPayPalOrder, createPayPalSubscription, capturePayPalOrder, getPayPalAccessToken } from '@/lib/paypal';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, recurring = false, tier } = body as {
      amount: number;
      recurring?: boolean;
      tier?: string;
    };

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 5) {
      return NextResponse.json(
        { error: 'Minimum donation amount is $5' },
        { status: 400 }
      );
    }

    if (amount > 999999) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum limit' },
        { status: 400 }
      );
    }

    // Get session (optional - donations can be anonymous)
    const session = await getSession();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const metadata = {
      type: 'donation',
      tier: tier || 'custom',
      recurring: recurring.toString(),
      ...(session?.user?.id && { userId: session.user.id }),
    };

    if (recurring) {
      // For recurring donations, we need a PayPal subscription plan
      // The plan should be created in PayPal Dashboard for donations
      // For now, we'll create a dynamic subscription
      const donationPlanId = process.env.PAYPAL_PLAN_DONATION_MONTHLY;
      
      if (!donationPlanId) {
        // If no recurring donation plan exists, fall back to one-time
        return NextResponse.json(
          { error: 'Recurring donations are not yet configured. Please make a one-time donation.' },
          { status: 400 }
        );
      }

      const subscription = await createPayPalSubscription({
        planId: donationPlanId,
        returnUrl: `${baseUrl}/donations/thank-you?subscription=true`,
        cancelUrl: `${baseUrl}/donations?canceled=true`,
        subscriberEmail: session?.user?.email,
        subscriberName: session?.user?.name || undefined,
        metadata,
      });

      // Find the approval URL
      const approvalLink = subscription.links.find(link => link.rel === 'approve');
      
      return NextResponse.json({
        subscriptionId: subscription.id,
        url: approvalLink?.href,
      });
    } else {
      // One-time donation - create PayPal order
      const order = await createPayPalOrder({
        amount,
        description: tier
          ? `${tier.charAt(0) + tier.slice(1).toLowerCase()} Donation to SPAC`
          : 'Donation to St. Pete Astronomy Club',
        returnUrl: `${baseUrl}/api/donations/capture?success=true`,
        cancelUrl: `${baseUrl}/donations?canceled=true`,
        metadata,
      });

      // Find the approval URL
      const approvalLink = order.links.find(link => link.rel === 'approve');

      return NextResponse.json({
        orderId: order.id,
        url: approvalLink?.href,
      });
    }
  } catch (error) {
    console.error('Donation checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to capture the payment after PayPal approval
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token'); // PayPal order ID
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/donations?error=missing_token`);
  }

  try {
    // Capture the payment
    const captureResult = await capturePayPalOrder(token);

    if (captureResult.status === 'COMPLETED') {
      // Payment successful - redirect to thank you page
      return NextResponse.redirect(`${baseUrl}/donations/thank-you?order_id=${captureResult.id}`);
    } else {
      return NextResponse.redirect(`${baseUrl}/donations?error=payment_failed`);
    }
  } catch (error) {
    console.error('Failed to capture donation:', error);
    return NextResponse.redirect(`${baseUrl}/donations?error=capture_failed`);
  }
}
