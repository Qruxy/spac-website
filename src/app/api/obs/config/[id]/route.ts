/**
 * Single OBS Config API
 * 
 * PUT - Update OBS config
 * DELETE - Delete OBS config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update OBS configs' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      eventName,
      startDate,
      endDate,
      registrationOpens,
      registrationCloses,
      earlyBirdDeadline,
      location,
      memberPrice,
      nonMemberPrice,
      earlyBirdDiscount,
      campingPrice,
      mealPrice,
      capacity,
    } = body;

    const config = await prisma.oBSConfig.update({
      where: { id },
      data: {
        eventName,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        registrationOpens: registrationOpens ? new Date(registrationOpens) : undefined,
        registrationCloses: registrationCloses ? new Date(registrationCloses) : undefined,
        earlyBirdDeadline: earlyBirdDeadline ? new Date(earlyBirdDeadline) : null,
        location,
        memberPrice: memberPrice !== undefined ? parseFloat(memberPrice) : undefined,
        nonMemberPrice: nonMemberPrice !== undefined ? parseFloat(nonMemberPrice) : undefined,
        earlyBirdDiscount: earlyBirdDiscount !== undefined ? parseFloat(earlyBirdDiscount) : undefined,
        campingPrice: campingPrice !== undefined ? parseFloat(campingPrice) : undefined,
        mealPrice: mealPrice !== undefined ? parseFloat(mealPrice) : undefined,
        capacity: capacity !== undefined ? capacity : undefined,
      },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to update OBS config:', error);
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
      return NextResponse.json({ error: 'Only admins can delete OBS configs' }, { status: 403 });
    }

    const { id } = await params;

    // Check if there are registrations
    const config = await prisma.oBSConfig.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (config._count.registrations > 0) {
      return NextResponse.json({ error: 'Cannot delete config with registrations' }, { status: 400 });
    }

    await prisma.oBSConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete OBS config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
