export const dynamic = 'force-dynamic';

/**
 * OBS Sponsors API
 *
 * GET  /api/admin/obs/sponsors?obsId=X  — list sponsors for a config
 * POST /api/admin/obs/sponsors           — create a sponsor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const obsId = request.nextUrl.searchParams.get('obsId');
    if (!obsId) return NextResponse.json({ error: 'obsId required' }, { status: 400 });

    const sponsors = await prisma.oBSSponsor.findMany({
      where: { obsConfigId: obsId },
      orderBy: [{ sponsorLevel: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(sponsors);
  } catch (error) {
    console.error('Failed to fetch OBS sponsors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { obsConfigId, name, website, logoUrl, sponsorLevel, sortOrder } = body as {
      obsConfigId: string;
      name: string;
      website?: string;
      logoUrl?: string;
      sponsorLevel?: string;
      sortOrder?: number;
    };

    if (!obsConfigId || !name) {
      return NextResponse.json({ error: 'obsConfigId and name are required' }, { status: 400 });
    }

    const sponsor = await prisma.oBSSponsor.create({
      data: {
        obsConfigId,
        name,
        website: website || null,
        logoUrl: logoUrl || null,
        sponsorLevel: sponsorLevel || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error('Failed to create OBS sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
