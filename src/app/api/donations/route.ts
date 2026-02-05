/**
 * Donations API
 *
 * Creates PayPal orders for one-time and recurring donations.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createPayPalOrder, createPayPalSubscription, capturePayPalOrder, getPayPalAccessToken } from '@/lib/paypal';
import { getSession } from '@/lib/auth';
import { rateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

// Zod schema for donation validation
const donationSchema = z.object({
  amount: z.number()
    .min(5, 'Minimum donation amount is $5')
    .max(999999, 'Amount exceeds maximum limit'),
  recurring: z.boolean().optional().default(false),
  tier: z.enum(['SUPPORTER', 'PATRON', 'BENEFACTOR']).optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = getRateLimitKey('donations', ip);
    
    if (!rateLimit(key, RATE_LIMITS.API_WRITE.limit, RATE_LIMITS.API_WRITE.windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate with Zod
    const parseResult = donationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }
    
    const { amount, recurring, tier } = parseResult.data;

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
