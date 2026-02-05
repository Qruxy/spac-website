/**
 * PayPal Webhook Handler
 *
 * Processes PayPal events for:
 * - Subscription lifecycle events
 * - Payment completion events
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayPalWebhook, getPayPalSubscription, type PayPalWebhookEvent } from '@/lib/paypal';
import { prisma } from '@/lib/db';

const webhookId = process.env.PAYPAL_WEBHOOK_ID!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();

  // Get all PayPal headers
  const paypalHeaders: Record<string, string> = {
    'paypal-auth-algo': headersList.get('paypal-auth-algo') || '',
    'paypal-cert-url': headersList.get('paypal-cert-url') || '',
    'paypal-transmission-id': headersList.get('paypal-transmission-id') || '',
    'paypal-transmission-sig': headersList.get('paypal-transmission-sig') || '',
    'paypal-transmission-time': headersList.get('paypal-transmission-time') || '',
  };

  // Verify webhook signature (skip in development if webhook ID not set)
  if (webhookId) {
    const isValid = await verifyPayPalWebhook(webhookId, paypalHeaders, body);
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  try {
    // Idempotency check - skip if we've already processed this event
    const existingEvent = await prisma.processedWebhook.findUnique({
      where: { paypalEventId: event.id },
    });

    if (existingEvent) {
      console.log(`Webhook event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.event_type) {
      // Subscription events
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;

      // Payment events
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        // This is typically handled by the capture flow
        console.log('Order approved:', event.resource);
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    // Record that we processed this event (for idempotency)
    await prisma.processedWebhook.create({
      data: {
        paypalEventId: event.id,
        eventType: event.event_type,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook handler error: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook handler error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(event: PayPalWebhookEvent) {
  const resource = event.resource as {
    id: string;
    custom_id?: string;
    subscriber?: { email_address: string };
    billing_info?: { next_billing_time: string };
  };

  const subscriptionId = resource.id;
  
  // Find membership by subscription ID
  const membership = await prisma.membership.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (membership) {
    const nextBilling = resource.billing_info?.next_billing_time
      ? new Date(resource.billing_info.next_billing_time)
      : null;

    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'ACTIVE',
        paypalCurrentPeriodEnd: nextBilling,
      },
    });
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(event: PayPalWebhookEvent) {
  const resource = event.resource as { id: string };
  const subscriptionId = resource.id;

  const membership = await prisma.membership.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
    include: { user: true },
  });

  if (membership) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'EXPIRED',
        endDate: new Date(),
        cancelledAt: new Date(),
      },
    });

    // Log the membership expiration
    await prisma.auditLog.create({
      data: {
        user_id: membership.userId,
        actorId: membership.userId,
        subjectId: membership.userId,
        action: 'SUBSCRIPTION_CHANGE',
        entityType: 'Membership',
        entityId: membership.id,
        metadata: {
          paypalSubscriptionId: subscriptionId,
          reason: 'subscription_cancelled',
          event: 'expired',
        },
      },
    });
  }
}

/**
 * Handle subscription suspension (payment issues)
 */
async function handleSubscriptionSuspended(event: PayPalWebhookEvent) {
  const resource = event.resource as { id: string };
  const subscriptionId = resource.id;

  const membership = await prisma.membership.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
  });

  if (membership) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: 'SUSPENDED' },
    });
  }
}

/**
 * Handle subscription payment failure
 */
async function handlePaymentFailed(event: PayPalWebhookEvent) {
  const resource = event.resource as { id: string };
  const subscriptionId = resource.id;

  const membership = await prisma.membership.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
    include: { user: true },
  });

  if (membership) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: 'SUSPENDED' },
    });

    // Log the payment failure
    await prisma.auditLog.create({
      data: {
        user_id: membership.userId,
        actorId: membership.userId,
        subjectId: membership.userId,
        action: 'PAYMENT',
        entityType: 'Membership',
        entityId: membership.id,
        metadata: {
          paypalSubscriptionId: subscriptionId,
          event: 'payment_failed',
        },
      },
    });

    // TODO: Send dunning email notification
  }
}

/**
 * Handle successful recurring payment
 */
async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  const resource = event.resource as {
    id: string;
    billing_agreement_id?: string;
    amount: { total: string; currency: string };
  };

  // This is for recurring subscription payments
  const subscriptionId = resource.billing_agreement_id;
  if (!subscriptionId) return;

  const membership = await prisma.membership.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
    include: { user: true },
  });

  if (membership) {
    // Get updated subscription details
    const subscription = await getPayPalSubscription(subscriptionId);
    const nextBilling = subscription.billing_info?.next_billing_time
      ? new Date(subscription.billing_info.next_billing_time)
      : null;

    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'ACTIVE',
        paypalCurrentPeriodEnd: nextBilling,
      },
    });

    // Record the payment
    await prisma.payment.create({
      data: {
        userId: membership.userId,
        type: 'SUBSCRIPTION',
        amount: parseFloat(resource.amount.total),
        currency: resource.amount.currency.toLowerCase(),
        status: 'SUCCEEDED',
        paypalOrderId: resource.id,
        paidAt: new Date(),
        description: `Membership renewal`,
      },
    });
  }
}
