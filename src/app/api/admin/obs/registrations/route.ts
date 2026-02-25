export const dynamic = 'force-dynamic';

/**
 * OBS Registrations Admin API
 *
 * GET /api/admin/obs/registrations?obsId=X  — list all registrations for a config
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

    const registrations = await prisma.oBSRegistration.findMany({
      where: { obsConfigId: obsId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Failed to fetch OBS registrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
