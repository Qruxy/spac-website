/**
 * Single Conversation API
 *
 * GET - Get messages in a conversation
 * PUT - Update conversation (mark read, mute, archive)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/messages/conversations/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: session.user.id },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, name: true, avatarUrl: true, image: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, name: true, avatarUrl: true, image: true },
            },
          },
        },
        listing: {
          select: { id: true, title: true, slug: true, price: true },
        },
      },
    });

    // Auto-mark as read
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId: id, userId: session.user.id },
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      conversation: {
        id: conversation?.id,
        type: conversation?.type,
        title: conversation?.title,
        listing: conversation?.listing,
        participants: conversation?.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name || `${p.user.firstName} ${p.user.lastName}`,
          avatarUrl: p.user.avatarUrl || p.user.image,
        })),
      },
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[messages.length - 1]?.id : null,
    });
  } catch (error) {
    console.error('Conversation messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// PUT /api/messages/conversations/[id] - Mark read, mute, archive
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: 'read' | 'mute' | 'unmute' | 'archive' | 'unarchive' };

    const data: Record<string, unknown> = {};
    switch (action) {
      case 'read':
        data.lastReadAt = new Date();
        break;
      case 'mute':
        data.isMuted = true;
        break;
      case 'unmute':
        data.isMuted = false;
        break;
      case 'archive':
        data.isArchived = true;
        break;
      case 'unarchive':
        data.isArchived = false;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId: id, userId: session.user.id },
      },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversation update error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
