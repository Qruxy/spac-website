/**
 * Admin Single Listing API
 *
 * Get, update, delete individual classifieds listings.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/listings/[id] - Get single listing
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Map Prisma `price` to frontend `askingPrice` for React Admin compatibility
    return NextResponse.json({
      ...listing,
      askingPrice: listing.price,
    });
  } catch (error) {
    console.error('Admin get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/listings/[id] - Update listing (approve/reject/modify)
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      category,
      condition,
      askingPrice,
      status,
    } = body;

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(condition !== undefined && { condition }),
        // Map frontend `askingPrice` to Prisma `price` field
        ...(askingPrice !== undefined && { price: parseFloat(askingPrice) }),
        ...(status !== undefined && { status }),
      },
    });

    // Log the change
    const action = status === 'ACTIVE' ? 'APPROVAL' : status === 'REJECTED' ? 'REJECTION' : 'UPDATE';
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action,
        entityType: 'Listing',
        entityId: id,
        newValues: {
          status,
          title: listing.title,
        },
      },
    });

    // Map Prisma `price` to frontend `askingPrice` for React Admin compatibility
    return NextResponse.json({
      ...listing,
      askingPrice: listing.price,
    });
  } catch (error) {
    console.error('Admin update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/listings/[id] - Delete listing
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Delete associated media first
    await prisma.media.deleteMany({
      where: { listingId: id },
    });

    // Delete the listing
    await prisma.listing.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'Listing',
        entityId: id,
        oldValues: {
          title: listing.title,
          status: listing.status,
        },
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
