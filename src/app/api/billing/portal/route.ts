/**
 * Billing Management API
 *
 * Handles subscription management since PayPal doesn't have a customer portal like Stripe.
 * Returns information needed to manage subscriptions.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPayPalSubscription, cancelPayPalSubscription } from '@/lib/paypal';
import { prisma } from '@/lib/db';

/**
 * GET - Get subscription details
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's membership
    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    });

    if (!membership?.paypalSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get subscription details from PayPal
    const subscription = await getPayPalSubscription(membership.paypalSubscriptionId);

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.plan_id,
      nextBillingTime: subscription.billing_info?.next_billing_time,
      subscriber: subscription.subscriber,
    });
  } catch (error) {
    console.error('Billing info error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing information' },
      { status: 500 }
    );
  }
}

/**
 * POST - For backward compatibility, returns PayPal subscription management URL
 * PayPal subscriptions are managed at: https://www.paypal.com/myaccount/autopay/
 */
export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // PayPal doesn't have a direct portal like Stripe
    // Users manage subscriptions in their PayPal account
    const paypalSubscriptionUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.paypal.com/myaccount/autopay/'
      : 'https://www.sandbox.paypal.com/myaccount/autopay/';

    return NextResponse.json({
      url: paypalSubscriptionUrl,
      message: 'You will be redirected to PayPal to manage your subscription',
    });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel subscription
 */
export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason = 'Cancelled by user' } = body;

    // Get user's membership
    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    });

    if (!membership?.paypalSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel the subscription in PayPal
    await cancelPayPalSubscription(membership.paypalSubscriptionId, reason);

    // Update local membership record
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        cancelledAt: new Date(),
        // Note: Status will be updated by webhook when it actually expires
      },
    });

    // Log the cancellation
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        actorId: session.user.id,
        subjectId: session.user.id,
        action: 'SUBSCRIPTION_CHANGE',
        entityType: 'Membership',
        entityId: membership.id,
        metadata: {
          paypalSubscriptionId: membership.paypalSubscriptionId,
          reason,
          event: 'cancelled',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled. You will have access until the end of your billing period.',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
