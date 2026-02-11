/**
 * OBS Config API
 * 
 * GET - List all OBS configs
 * POST - Create new OBS config
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

    const configs = await prisma.oBSConfig.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Failed to fetch OBS configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can create OBS configs' }, { status: 403 });
    }

    const body = await request.json();
    const {
      year,
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
      description,
      scheduleData,
      whatToBring,
      locationInfo,
      statsData,
    } = body;

    // Check if year already exists
    const existing = await prisma.oBSConfig.findUnique({
      where: { year },
    });

    if (existing) {
      return NextResponse.json({ error: 'An event for this year already exists' }, { status: 400 });
    }

    const config = await prisma.oBSConfig.create({
      data: {
        year,
        eventName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationOpens: new Date(registrationOpens),
        registrationCloses: new Date(registrationCloses),
        earlyBirdDeadline: earlyBirdDeadline ? new Date(earlyBirdDeadline) : null,
        location,
        memberPrice: parseFloat(memberPrice) || 0,
        nonMemberPrice: parseFloat(nonMemberPrice) || 0,
        earlyBirdDiscount: parseFloat(earlyBirdDiscount) || 0,
        campingPrice: parseFloat(campingPrice) || 0,
        mealPrice: parseFloat(mealPrice) || 0,
        capacity: capacity || 200,
        isActive: false,
        description: description || null,
        scheduleData: scheduleData || null,
        whatToBring: whatToBring || null,
        locationInfo: locationInfo || null,
        statsData: statsData || null,
      },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Failed to create OBS config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
