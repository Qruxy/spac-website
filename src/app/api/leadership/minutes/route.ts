/**
 * Meeting Minutes API
 * 
 * GET - List all minutes
 * POST - Create new minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const minutes = await prisma.meetingMinutes.findMany({
      orderBy: { meetingDate: 'desc' },
      include: {
        motions: true,
        _count: { select: { motions: true } },
      },
    });

    return NextResponse.json(minutes);
  } catch (error) {
    console.error('Failed to fetch minutes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      meetingDate, 
      meetingType, 
      content, 
      pdfUrl, 
      approved, 
      motions = [],
      createdById 
    } = body;

    if (!title || !meetingDate || !meetingType) {
      return NextResponse.json({ error: 'Title, date, and type are required' }, { status: 400 });
    }

    const minutes = await prisma.meetingMinutes.create({
      data: {
        title,
        meetingDate: new Date(meetingDate),
        meetingType,
        content,
        pdfUrl,
        approved,
        approvedAt: approved ? new Date() : null,
        createdById: createdById || session.user.id,
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
      include: {
        motions: true,
      },
    });

    return NextResponse.json(minutes, { status: 201 });
  } catch (error) {
    console.error('Failed to create minutes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
