/**
 * Send Message API
 *
 * POST - Send a message in a conversation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notifyNewMessage } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/messages/conversations/[id]/messages
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, type } = body as { content: string; type?: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: session.user.id },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim(),
        type: (type as 'TEXT' | 'SYSTEM' | 'OFFER') || 'TEXT',
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, name: true, avatarUrl: true, image: true },
        },
      },
    });

    // Update conversation lastMessageAt and sender's lastReadAt
    await Promise.all([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId: session.user.id },
        },
        data: { lastReadAt: message.createdAt },
      }),
    ]);

    // Notify other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: session.user.id },
        isMuted: false,
      },
    });

    const senderName = message.sender.name || `${message.sender.firstName} ${message.sender.lastName}`;

    for (const p of otherParticipants) {
      await notifyNewMessage(p.userId, senderName, conversationId, content);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
