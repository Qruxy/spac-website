export const dynamic = 'force-dynamic';
/**
 * Admin Media API
 *
 * CRUD operations for media management.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAdmin,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildWhereClause,
} from '../utils';

// GET /api/admin/media - List media
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters, ['filename', 'caption']);

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { [field]: order },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin media list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/media - Bulk update media (approve/reject)
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids, data: updateData } = body as { ids: string[]; data: { status?: string; category?: string } };

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing ids array' },
        { status: 400 }
      );
    }

    const prismaData: Record<string, unknown> = {};
    if (updateData.status) prismaData.status = updateData.status;
    if (updateData.category) prismaData.category = updateData.category;

    await prisma.media.updateMany({
      where: { id: { in: ids } },
      data: prismaData,
    });

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: updateData.status === 'APPROVED' ? 'APPROVAL' : 'UPDATE',
        entityType: 'Media',
        entityId: ids.join(','),
        newValues: {
          bulkAction: true,
          count: ids.length,
          status: updateData.status,
        },
      },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin media bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media - Bulk delete media
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing ids array' },
        { status: 400 }
      );
    }

    // TODO: Also delete from S3

    await prisma.media.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin media bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
