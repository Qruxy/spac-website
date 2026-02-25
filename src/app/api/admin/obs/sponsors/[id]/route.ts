export const dynamic = 'force-dynamic';

/**
 * OBS Sponsor CRUD — single record
 *
 * PUT    /api/admin/obs/sponsors/[id]  — update
 * DELETE /api/admin/obs/sponsors/[id]  — delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, website, logoUrl, sponsorLevel, sortOrder, isActive } = body as {
      name?: string;
      website?: string | null;
      logoUrl?: string | null;
      sponsorLevel?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    };

    const sponsor = await prisma.oBSSponsor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(website !== undefined && { website }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(sponsorLevel !== undefined && { sponsorLevel }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('Failed to update OBS sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    await prisma.oBSSponsor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete OBS sponsor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
