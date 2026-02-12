/**
 * Conversations API
 *
 * GET  - List current user's conversations
 * POST - Create a new conversation (DM or classified offer)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/messages/conversations
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            isArchived: false,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, name: true, image: true, avatarUrl: true },
            },
          },
        },
        listing: {
          select: { id: true, title: true, slug: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Calculate unread counts per conversation
    const result = conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === session.user.id);
      const lastMessage = conv.messages[0] || null;
      const otherParticipants = conv.participants.filter((p) => p.userId !== session.user.id);

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        listing: conv.listing,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
              createdAt: lastMessage.createdAt,
            }
          : null,
        otherParticipants: otherParticipants.map((p) => ({
          id: p.user.id,
          name: p.user.name || `${p.user.firstName} ${p.user.lastName}`,
          avatarUrl: p.user.avatarUrl || p.user.image,
        })),
        hasUnread: lastMessage && myParticipant
          ? !myParticipant.lastReadAt || myParticipant.lastReadAt < lastMessage.createdAt
          : false,
        lastMessageAt: conv.lastMessageAt,
        isMuted: myParticipant?.isMuted || false,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error('Conversations list error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/messages/conversations
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, listingId, message, type } = body as {
      recipientId: string;
      listingId?: string;
      message: string;
      type?: string;
    };

    if (!recipientId || !message) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 });
    }

    if (recipientId === session.user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if conversation already exists between these users (for this listing if specified)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        ...(listingId ? { listingId, type: 'CLASSIFIED_OFFER' } : { type: 'DIRECT' }),
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
    });

    if (existingConversation) {
      // Add message to existing conversation
      const newMessage = await prisma.message.create({
        data: {
          conversationId: existingConversation.id,
          senderId: session.user.id,
          content: message,
          type: 'TEXT',
        },
      });

      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { lastMessageAt: newMessage.createdAt },
      });

      return NextResponse.json({
        conversationId: existingConversation.id,
        messageId: newMessage.id,
        isNew: false,
      });
    }

    // Create new conversation with participants and first message
    const conversationType = listingId ? 'CLASSIFIED_OFFER' : (type === 'GROUP' ? 'GROUP' : 'DIRECT');

    const conversation = await prisma.conversation.create({
      data: {
        type: conversationType as 'DIRECT' | 'GROUP' | 'CLASSIFIED_OFFER' | 'ADMIN_BROADCAST',
        listingId: listingId || null,
        createdById: session.user.id,
        lastMessageAt: new Date(),
        participants: {
          create: [
            { userId: session.user.id, lastReadAt: new Date() },
            { userId: recipientId },
          ],
        },
        messages: {
          create: {
            senderId: session.user.id,
            content: message,
            type: 'TEXT',
          },
        },
      },
    });

    // Notify the recipient
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });

    if (sender) {
      const { notifyNewMessage } = await import('@/lib/notifications');
      await notifyNewMessage(
        recipientId,
        `${sender.firstName} ${sender.lastName}`,
        conversation.id,
        message,
      );
    }

    return NextResponse.json({
      conversationId: conversation.id,
      isNew: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
