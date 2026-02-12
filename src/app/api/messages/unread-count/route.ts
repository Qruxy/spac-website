/**
 * Unread Messages Count API
 *
 * GET - Get count of conversations with unread messages
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

    // Get all conversations where user is a participant
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id, isArchived: false },
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: { lastMessageAt: true },
        },
      },
    });

    const unreadCount = participants.filter((p) => {
      if (!p.conversation.lastMessageAt) return false;
      if (!p.lastReadAt) return true;
      return p.lastReadAt < p.conversation.lastMessageAt;
    }).length;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
  }
}
