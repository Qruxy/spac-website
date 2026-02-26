export const dynamic = 'force-dynamic';

/**
 * Cron: Cleanup Stale PENDING Registrations
 *
 * Cancels PENDING event and OBS registrations that have been abandoned
 * (i.e. created more than 30 minutes ago without a completed payment).
 *
 * This frees up event capacity that was consumed by incomplete checkouts.
 *
 * Security: Accepts either a CRON_SECRET header or admin session.
 * Schedule: Run every 15–30 minutes via Amplify/external cron.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const PENDING_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: Request) {
  // Auth: check cron secret OR admin session
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    // Cron-authenticated
  } else {
    const session = await getSession();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - PENDING_TTL_MS);

  try {
    // Cancel stale event registrations
    const { count: eventCount } = await prisma.registration.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      data: { status: 'CANCELLED' },
    });

    // Delete stale OBS PENDING registrations.
    // OBS PaymentStatus has no CANCELLED state, so abandoned checkouts are deleted
    // to free up capacity slots. These records have no associated payment.
    const { count: obsCount } = await prisma.oBSRegistration.deleteMany({
      where: {
        paymentStatus: 'PENDING',
        createdAt: { lt: cutoff },
      },
    });

    const total = eventCount + obsCount;
    if (total > 0) {
      console.log(`[cleanup-pending] Cancelled ${eventCount} event + ${obsCount} OBS stale PENDING registrations`);
    }

    return NextResponse.json({
      success: true,
      cancelled: { event: eventCount, obs: obsCount },
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error('[cleanup-pending] Error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

// Allow manual trigger by admins via GET
export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - PENDING_TTL_MS);
  const [eventPending, obsPending] = await Promise.all([
    prisma.registration.count({
      where: { status: 'PENDING', createdAt: { lt: cutoff } },
    }),
    prisma.oBSRegistration.count({
      where: { paymentStatus: 'PENDING', createdAt: { lt: cutoff } },
    }),
  ]);

  return NextResponse.json({
    stale: { event: eventPending, obs: obsPending },
    cutoff: cutoff.toISOString(),
    message: 'POST to this endpoint to cancel stale registrations',
  });
}
