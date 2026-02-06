export const dynamic = 'force-dynamic';
/**
 * Activate OBS Config API
 * 
 * POST - Set this config as the active event
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can activate OBS configs' }, { status: 403 });
    }

    const { id } = await params;

    // Deactivate all configs and activate this one
    await prisma.$transaction([
      prisma.oBSConfig.updateMany({
        data: { isActive: false },
      }),
      prisma.oBSConfig.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to activate OBS config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}