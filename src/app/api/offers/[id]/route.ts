export const dynamic = 'force-dynamic';
/**
 * Single Offer API
 *
 * Get, respond to, or withdraw an offer.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Zod schema for offer actions
const OfferActionSchema = z.object({
  action: z.enum(['accept', 'reject', 'counter', 'withdraw'], {
    errorMap: () => ({ message: 'Invalid action. Must be: accept, reject, counter, or withdraw' }),
  }),
  counterAmount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .pipe(z.number().positive().max(1000000))
    .optional(),
  message: z
    .string()
    .max(1000, 'Message must be 1000 characters or less')
    .transform((val) => val.trim())
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/offers/[id] - Get offer detail
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            images: {
              where: { status: 'APPROVED' },
              take: 1,
              select: { url: true, thumbnailUrl: true },
            },
          },
        },
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
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Only buyer, seller, or admin can view
    const isBuyer = session.user.id === offer.buyerId;
    const isSeller = session.user.id === offer.listing.sellerId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Get offer error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

// PATCH /api/offers/[id] - Respond to offer
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    const isBuyer = session.user.id === offer.buyerId;
    const isSeller = session.user.id === offer.listing.sellerId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input with Zod
    const result = OfferActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { action, counterAmount, message } = result.data;

    // Check if offer is still actionable
    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return NextResponse.json(
        { error: 'This offer can no longer be modified' },
        { status: 400 }
      );
    }

    // Check expiration
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      await prisma.offer.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'This offer has expired' },
        { status: 400 }
      );
    }

    let updatedOffer;

    switch (action) {
      case 'accept':
        // Only seller can accept
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can accept offers' },
            { status: 403 }
          );
        }

        // Accept offer and mark listing as sold
        updatedOffer = await prisma.offer.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            updatedAt: new Date(),
          },
        });

        // Update listing status
        await prisma.listing.update({
          where: { id: offer.listingId },
          data: {
            status: 'SOLD',
            soldPrice: offer.counterAmount || offer.amount,
            soldAt: new Date(),
          },
        });

        // Reject all other pending offers
        await prisma.offer.updateMany({
          where: {
            listingId: offer.listingId,
            id: { not: id },
            status: { in: ['PENDING', 'COUNTERED'] },
          },
          data: { status: 'REJECTED' },
        });
        break;

      case 'reject':
        // Only seller can reject
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can reject offers' },
            { status: 403 }
          );
        }

        updatedOffer = await prisma.offer.update({
          where: { id },
          data: {
            status: 'REJECTED',
            updatedAt: new Date(),
            responseMessage: message || null,
          },
        });
        break;

      case 'counter':
        // Only seller can counter
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can make counter offers' },
            { status: 403 }
          );
        }

        if (!counterAmount || counterAmount <= 0) {
          return NextResponse.json(
            { error: 'Invalid counter amount' },
            { status: 400 }
          );
        }

        updatedOffer = await prisma.offer.update({
          where: { id },
          data: {
            status: 'COUNTERED',
            counterAmount: counterAmount, // Already a number from Zod validation
            updatedAt: new Date(),
            responseMessage: message || null,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days to respond
          },
        });
        break;

      case 'withdraw':
        // Only buyer can withdraw
        if (!isBuyer) {
          return NextResponse.json(
            { error: 'Only the buyer can withdraw offers' },
            { status: 403 }
          );
        }

        updatedOffer = await prisma.offer.update({
          where: { id },
          data: { status: 'WITHDRAWN' },
        });
        break;
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        subjectId: isSeller ? offer.buyerId : offer.listing.sellerId,
        action: 'UPDATE',
        entityType: 'Offer',
        entityId: id,
        metadata: { action, counterAmount, listingTitle: offer.listing.title },
      },
    });

    // TODO: Send notification to the other party

    return NextResponse.json({ offer: updatedOffer });
  } catch (error) {
    console.error('Respond to offer error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to offer' },
      { status: 500 }
    );
  }
}