/**
 * Membership Activation API
 *
 * Activates membership after PayPal subscription approval.
 * SECURITY: Auth required — userId is taken from session, never from query string.
 */

import { NextResponse } from 'next/server';
import { getPayPalSubscription } from '@/lib/paypal';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerAutomationEmail } from '@/lib/automation-email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('subscription_id');
  const tier = searchParams.get('tier');
  const interval = searchParams.get('interval');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Auth required — userId comes from session, NOT from the URL.
  // If session is missing (e.g. lost during PayPal redirect), send back to login
  // with the full activation URL as callbackUrl so it completes after re-auth.
  const session = await getSession();
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(`${baseUrl}/auth/signin?callbackUrl=${callbackUrl}`);
  }
  const userId = session.user.id;

  if (!subscriptionId) {
    return NextResponse.redirect(`${baseUrl}/billing?error=missing_parameters`);
  }

  try {
    // Verify the subscription is active with PayPal
    const subscription = await getPayPalSubscription(subscriptionId);

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
      return NextResponse.redirect(`${baseUrl}/billing?error=subscription_not_active`);
    }

    // SECURITY: Verify the subscription's custom_id matches the session user.
    // custom_id may be a raw userId string OR a JSON object { userId, ... } depending
    // on when the subscription was created — parse both formats.
    const rawCustomId = subscription.custom_id as string | undefined;
    let customUserId: string | undefined;
    if (rawCustomId) {
      try {
        const parsed = JSON.parse(rawCustomId);
        customUserId = typeof parsed === 'object' ? parsed.userId : rawCustomId;
      } catch {
        customUserId = rawCustomId; // not JSON — treat as raw userId
      }
    }
    if (customUserId && customUserId !== userId) {
      console.error(`[membership/activate] Subscription ${subscriptionId} custom_id userId ${customUserId} does not match session user ${userId}`);
      return NextResponse.redirect(`${baseUrl}/billing?error=subscription_mismatch`);
    }

    // Get next billing date
    const nextBillingTime = subscription.billing_info?.next_billing_time
      ? new Date(subscription.billing_info.next_billing_time)
      : new Date(Date.now() + (interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);

    // Update user and membership
    await prisma.user.update({
      where: { id: userId },
      data: { paypalSubscriberId: subscriptionId },
    });

    await prisma.membership.upsert({
      where: { userId },
      update: {
        paypalSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        type: (tier as 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'PATRON' | 'BENEFACTOR') || 'INDIVIDUAL',
        interval: interval === 'monthly' ? 'MONTHLY' : 'ANNUAL',
        paypalCurrentPeriodEnd: nextBillingTime,
        startDate: new Date(),
      },
      create: {
        userId,
        paypalSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        type: (tier as 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'PATRON' | 'BENEFACTOR') || 'INDIVIDUAL',
        interval: interval === 'monthly' ? 'MONTHLY' : 'ANNUAL',
        paypalCurrentPeriodEnd: nextBillingTime,
        startDate: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        actorId: userId,
        subjectId: userId,
        action: 'SUBSCRIPTION_CHANGE',
        entityType: 'Membership',
        entityId: userId,
        metadata: {
          membershipType: tier,
          paypalSubscriptionId: subscriptionId,
          event: 'activated',
        },
      },
    });

    // Fire-and-forget membership activated email
    prisma.user
      .findUnique({ where: { id: userId }, select: { email: true, firstName: true, name: true } })
      .then((userForEmail) => {
        if (userForEmail) {
          triggerAutomationEmail(
            'MEMBERSHIP_ACTIVATED',
            userForEmail.email,
            {
              firstName: userForEmail.firstName || '',
              name: userForEmail.name || userForEmail.firstName || '',
              email: userForEmail.email,
              membershipType: tier || 'INDIVIDUAL',
            },
            userId,
          ).catch((e) => console.error('[auto-email] membership activated:', e));
        }
      })
      .catch((e) => console.error('[auto-email] user lookup:', e));

    return NextResponse.redirect(`${baseUrl}/dashboard?membership=success`);
  } catch (error) {
    console.error('Failed to activate membership:', error);
    return NextResponse.redirect(`${baseUrl}/billing?error=activation_failed`);
  }
}
