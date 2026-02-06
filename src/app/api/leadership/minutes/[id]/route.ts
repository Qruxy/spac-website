export const dynamic = 'force-dynamic';
/**
 * Single Meeting Minutes API
 * 
 * GET - Get minutes by ID
 * PUT - Update minutes
 * DELETE - Delete minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const minutes = await prisma.meetingMinutes.findUnique({
      where: { id },
      include: { motions: true },
    });

    if (!minutes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(minutes);
  } catch (error) {
    console.error('Failed to fetch minutes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, meetingDate, meetingType, content, pdfUrl, approved, motions = [] } = body;

    // Check if minutes exist
    const existing = await prisma.meetingMinutes.findUnique({
      where: { id },
      include: { motions: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update minutes and manage motions
    const minutes = await prisma.$transaction(async (tx) => {
      // Delete existing motions
      await tx.motion.deleteMany({
        where: { meetingId: id },
      });

      // Update minutes and create new motions
      return tx.meetingMinutes.update({
        where: { id },
        data: {
          title,
          meetingDate: meetingDate ? new Date(meetingDate) : undefined,
          meetingType,
          content,
          pdfUrl,
          approved,
          approvedAt: approved && !existing.approved ? new Date() : existing.approvedAt,
          motions: {
            create: motions.map((m: {
              motionNumber: string;
              description: string;
              movedBy?: string;
              secondedBy?: string;
              votesFor?: number;
              votesAgainst?: number;
              abstentions?: number;
              status?: string;
            }) => ({
              motionNumber: m.motionNumber,
              description: m.description,
              movedBy: m.movedBy,
              secondedBy: m.secondedBy,
              votesFor: m.votesFor || 0,
              votesAgainst: m.votesAgainst || 0,
              abstentions: m.abstentions || 0,
              status: m.status || 'PENDING',
            })),
          },
        },
        include: { motions: true },
      });
    });

    return NextResponse.json(minutes);
  } catch (error) {
    console.error('Failed to update minutes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete minutes' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.meetingMinutes.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete minutes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}