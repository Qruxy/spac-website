export const dynamic = 'force-dynamic';
/**
 * Admin Payment Refund API
 *
 * POST /api/admin/payments/[id]/refund
 *
 * Issues a full or partial PayPal refund for a captured payment.
 * ADMIN-only (not MODERATOR) — refunds are irreversible financial operations.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { refundPayPalCapture } from '@/lib/paypal';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RefundSchema = z.object({
  amount: z.number().positive().optional(), // omit for full refund
  note:   z.string().max(255).optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  // ADMIN-only — refunds are irreversible
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Refunds require ADMIN role' }, { status: 403 });
  }

  const { id } = await params;

  // Validate body
  let body: { amount?: number; note?: string };
  try {
    const raw = await request.json();
    const parsed = RefundSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    body = {};
  }

  try {
    // Fetch the payment
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Payment already refunded' }, { status: 409 });
    }

    if (payment.status !== 'SUCCEEDED') {
      return NextResponse.json({ error: 'Only succeeded payments can be refunded' }, { status: 409 });
    }

    if (!payment.paypalCaptureId) {
      return NextResponse.json(
        { error: 'No PayPal capture ID on this payment — cannot issue refund' },
        { status: 422 }
      );
    }

    const paymentAmount = Number(payment.amount);
    const refundAmount  = body.amount ?? paymentAmount; // full refund if not specified

    if (refundAmount > paymentAmount) {
      return NextResponse.json(
        { error: `Refund amount ($${refundAmount}) exceeds payment amount ($${paymentAmount})` },
        { status: 400 }
      );
    }

    // Issue the refund via PayPal
    const refundResult = await refundPayPalCapture(payment.paypalCaptureId, {
      amount:   body.amount, // undefined = full refund
      currency: payment.currency.toUpperCase(),
      note:     body.note,
    });

    const isFullRefund = refundAmount >= paymentAmount;

    // Update payment status
    await prisma.payment.update({
      where: { id },
      data: { status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id:    session.user.id,
        actorId:    session.user.id,
        subjectId:  payment.userId,
        action:     'REFUND',
        entityType: 'Payment',
        entityId:   id,
        metadata: {
          paypalCaptureId: payment.paypalCaptureId,
          paypalRefundId:  refundResult.id,
          refundStatus:    refundResult.status,
          refundAmount,
          originalAmount:  paymentAmount,
          isFullRefund,
          note: body.note || null,
        },
      },
    });

    return NextResponse.json({
      success:      true,
      refundId:     refundResult.id,
      refundStatus: refundResult.status,
      refundAmount,
      isFullRefund,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Refund error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
