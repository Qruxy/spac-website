/**
 * Unread Notifications Count API
 *
 * GET - Get count of unread notifications
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
  }
}
