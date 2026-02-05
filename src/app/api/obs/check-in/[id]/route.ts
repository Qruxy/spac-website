/**
 * OBS Check-In API
 * 
 * POST - Check in a registration
 * DELETE - Undo check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function POST(
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
    const { checkedInById } = body;

    const registration = await prisma.oBSRegistration.update({
      where: { id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInById: checkedInById || session.user.id,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Check-in failed:', error);
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

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const registration = await prisma.oBSRegistration.update({
      where: { id },
      data: {
        checkedIn: false,
        checkedInAt: null,
        checkedInById: null,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error('Undo check-in failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
