export const dynamic = 'force-dynamic';
/**
 * Admin Registrations API
 *
 * List and manage event registrations.
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

// GET /api/admin/registrations - List registrations
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters);

    const [data, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take,
        orderBy: { [field]: order },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin registrations list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/registrations - Bulk update registrations
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids, data: updateData } = body as { ids: string[]; data: Record<string, unknown> };

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing ids array' },
        { status: 400 }
      );
    }

    // Handle bulk check-in
    const prismaData: Record<string, unknown> = {};
    if (updateData.status) prismaData.status = updateData.status;
    if (updateData.checkedInAt === true) {
      prismaData.checkedInAt = new Date();
      prismaData.checkedInById = auth.userId!;
    }

    await prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: prismaData,
    });

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'Registration',
        entityId: ids.join(','),
        newValues: {
          bulkAction: true,
          count: ids.length,
          changes: updateData as Record<string, string | number | boolean>,
        },
      },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin registrations bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update registrations' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/registrations - Bulk delete registrations
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

    await prisma.registration.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin registrations bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registrations' },
      { status: 500 }
    );
  }
}
