/**
 * Membership Checkout API
 *
 * Creates a PayPal subscription for membership subscriptions.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPayPalSubscription } from '@/lib/paypal';
import { getMembershipPlanId, type MembershipTier } from '@/lib/paypal/products';

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
    const { tier, interval = 'annual' } = body as {
      tier: MembershipTier;
      interval: 'monthly' | 'annual';
    };

    if (!tier || tier === 'FREE') {
      return NextResponse.json(
        { error: 'Invalid membership tier' },
        { status: 400 }
      );
    }

    const planId = getMembershipPlanId(tier, interval);

    if (!planId || planId.startsWith('plan_')) {
      return NextResponse.json(
        { error: 'PayPal subscription plans not yet configured. Please contact support.' },
        { status: 400 }
      );
    }

    // Create PayPal subscription
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const subscription = await createPayPalSubscription({
      planId,
      returnUrl: `${baseUrl}/api/checkout/membership/activate?userId=${session.user.id}&tier=${tier}&interval=${interval}`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
      subscriberEmail: session.user.email,
      subscriberName: session.user.name || undefined,
      metadata: {
        userId: session.user.id,
        membershipType: tier,
        interval,
      },
    });

    // Find the approval URL
    const approvalLink = subscription.links.find(link => link.rel === 'approve');

    return NextResponse.json({
      subscriptionId: subscription.id,
      url: approvalLink?.href,
    });
  } catch (error) {
    console.error('Membership checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
