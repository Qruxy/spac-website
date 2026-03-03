export const dynamic = 'force-dynamic';
/**
 * Admin Listings API
 *
 * CRUD operations for classifieds management.
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

// GET /api/admin/listings - List listings
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters, ['title', 'description']);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { [field]: order },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { images: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Map Prisma `price` to frontend `askingPrice` for React Admin compatibility
    const data = listings.map((listing) => ({
      ...listing,
      askingPrice: listing.price,
    }));

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin listings list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/listings - Bulk status update
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids, status } = body as { ids: string[]; status: string };

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json(
        { error: 'Missing ids array or status' },
        { status: 400 }
      );
    }

    await prisma.listing.updateMany({
      where: { id: { in: ids } },
      data: { status: status as any },
    });

    return NextResponse.json({ ids, status });
  } catch (error) {
    console.error('Admin listings bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update listings' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/listings - Bulk delete listings
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

    await prisma.listing.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin listings bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listings' },
      { status: 500 }
    );
  }
}
