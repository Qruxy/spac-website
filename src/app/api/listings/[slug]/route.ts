/**
 * Single Listing API
 *
 * Get, update, delete individual listing.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/listings/[slug] - Get listing detail
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const listing = await prisma.listing.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            _count: {
              select: {
                listings: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
        images: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
            caption: true,
            width: true,
            height: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { offers: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Only show non-active listings to the owner or admin
    const session = await getSession();
    const isOwner = session?.user?.id === listing.sellerId;
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

    if (listing.status !== 'ACTIVE' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Increment view count for non-owners
    if (!isOwner) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[slug] - Update listing
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Get existing listing
    const existingListing = await prisma.listing.findUnique({
      where: { slug },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const isOwner = session.user.id === existingListing.sellerId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      condition,
      askingPrice,
      acceptsOffers,
      minimumOffer,
      brand,
      model,
      yearMade,
      originalPrice,
      location,
      shippingAvailable,
      localPickupOnly,
      status,
      imageIds,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (condition !== undefined) updateData.condition = condition;
    if (askingPrice !== undefined) updateData.askingPrice = parseFloat(askingPrice);
    if (acceptsOffers !== undefined) updateData.acceptsOffers = acceptsOffers;
    if (minimumOffer !== undefined) updateData.minimumOffer = minimumOffer ? parseFloat(minimumOffer) : null;
    if (brand !== undefined) updateData.brand = brand || null;
    if (model !== undefined) updateData.model = model || null;
    if (yearMade !== undefined) updateData.yearMade = yearMade ? parseInt(yearMade) : null;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (location !== undefined) updateData.location = location || null;
    if (shippingAvailable !== undefined) updateData.shippingAvailable = shippingAvailable;
    if (localPickupOnly !== undefined) updateData.localPickupOnly = localPickupOnly;

    // Only admins can directly change status to ACTIVE
    if (status !== undefined) {
      if (status === 'ACTIVE' && !isAdmin) {
        updateData.status = 'PENDING_APPROVAL';
      } else {
        updateData.status = status;
      }
    }

    // Update slug if title changed
    if (title && title !== existingListing.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      let newSlug = baseSlug;
      let counter = 1;

      while (
        await prisma.listing.findFirst({
          where: { slug: newSlug, id: { not: existingListing.id } },
        })
      ) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = newSlug;
    }

    const listing = await prisma.listing.update({
      where: { id: existingListing.id },
      data: updateData,
    });

    // Update images if provided
    if (imageIds !== undefined) {
      // Remove existing image links
      await prisma.media.updateMany({
        where: { listingId: listing.id },
        data: { listingId: null },
      });

      // Link new images
      if (imageIds.length > 0) {
        await prisma.media.updateMany({
          where: {
            id: { in: imageIds },
            uploaderId: session.user.id,
          },
          data: { listingId: listing.id },
        });
      }
    }

    // Log update
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        subjectId: existingListing.sellerId,
        action: 'UPDATE',
        entityType: 'Listing',
        entityId: listing.id,
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[slug] - Delete listing
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const listing = await prisma.listing.findUnique({
      where: { slug },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const isOwner = session.user.id === listing.sellerId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete by changing status to REMOVED
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: 'REMOVED' },
    });

    // Log deletion
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        subjectId: listing.sellerId,
        action: 'DELETE',
        entityType: 'Listing',
        entityId: listing.id,
        metadata: { title: listing.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
