export const dynamic = 'force-dynamic';

/**
 * Cron: Send Event Reminders
 *
 * Processes all due event reminders and sends emails to registered attendees.
 * Called by a cron job or manually by admins for testing.
 *
 * Security: Accepts either a CRON_SECRET header or admin session.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processReminders } from '@/lib/reminders';

export async function POST(request: Request) {
  // Auth: check cron secret OR admin session
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    // Cron-authenticated
  } else {
    // Fall back to session-based admin auth
    const session = await getSession();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await processReminders();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Process reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for easy browser testing by admins
export async function GET() {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReminders();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Process reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
