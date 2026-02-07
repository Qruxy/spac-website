export const dynamic = 'force-dynamic';
/**
 * Listing Offers API
 *
 * Create and list offers for a listing.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/listings/[slug]/offers - List offers for a listing
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { slug },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Only seller or offer makers can see offers
    const isSeller = session.user.id === listing.sellerId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';

    // Build where clause based on user role
    const where = isSeller || isAdmin
      ? { listingId: listing.id }
      : { listingId: listing.id, buyerId: session.user.id };

    const offers = await prisma.offer.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('List offers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST /api/listings/[slug]/offers - Create an offer
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { slug },
      include: {
        seller: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Can't make offer on own listing
    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot make offer on your own listing' },
        { status: 400 }
      );
    }

    // Check if listing accepts offers
    if (!listing.is_negotiable) {
      return NextResponse.json(
        { error: 'This listing does not accept offers' },
        { status: 400 }
      );
    }

    // Check if listing is active
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This listing is no longer active' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, message } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid offer amount' },
        { status: 400 }
      );
    }

    // Check for existing pending offer from this buyer
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId: listing.id,
        buyerId: session.user.id,
        status: { in: ['PENDING', 'COUNTERED'] },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You already have a pending offer on this listing' },
        { status: 400 }
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        amount: parseFloat(amount),
        message: message || null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log the offer
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        subjectId: listing.sellerId,
        action: 'CREATE',
        entityType: 'Offer',
        entityId: offer.id,
        metadata: {
          listingId: listing.id,
          listingTitle: listing.title,
          amount,
        },
      },
    });

    // TODO: Send notification to seller

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}