/**
 * Public Listings API
 *
 * Browse and search classifieds listings.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * Zod schema for creating a listing
 */
const CreateListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .transform((val) => val.trim()),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .transform((val) => val.trim()),
  category: z.enum([
    'TELESCOPE',
    'MOUNT',
    'EYEPIECE',
    'CAMERA',
    'FINDER',
    'FOCUSER',
    'ACCESSORY',
    'BINOCULAR',
    'SOLAR',
    'BOOK',
    'SOFTWARE',
    'OTHER',
  ]),
  condition: z.enum(['NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS']),
  askingPrice: z
    .union([z.string(), z.number()])
    .transform((val) => parseFloat(String(val)))
    .pipe(z.number().min(0, 'Price must be non-negative').max(1000000, 'Price exceeds maximum')),
  acceptsOffers: z.boolean().optional().default(true),
  minimumOffer: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  yearMade: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((val) => (val ? parseInt(String(val)) : null))
    .pipe(z.number().min(1900).max(new Date().getFullYear() + 1).nullable().optional()),
  originalPrice: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((val) => (val ? parseFloat(String(val)) : null)),
  location: z.string().max(200).optional().nullable(),
  shippingAvailable: z.boolean().optional().default(false),
  localPickupOnly: z.boolean().optional().default(true),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE']).optional(),
  imageIds: z.array(z.string().uuid()).max(10).optional(),
});

// GET /api/listings - List active listings with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const sellerId = searchParams.get('sellerId');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE', // Only show active listings publicly
    };

    if (category) {
      where.category = category as Prisma.EnumListingCategoryFilter;
    }

    if (condition) {
      where.condition = condition as Prisma.EnumListingConditionFilter;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Build orderBy
    const validSortFields = ['createdAt', 'price', 'viewCount', 'title'];
    let orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    // Handle legacy 'askingPrice' sort param
    if (sortBy === 'askingPrice') orderByField = 'price';
    const orderBy = { [orderByField]: sortOrder === 'asc' ? 'asc' : 'desc' };

    // Fetch listings and count
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
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
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              alt: true,
            },
            take: 4,
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { offers: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body with Zod
    const body = await request.json();
    console.log('Listing create payload:', JSON.stringify(body));
    const parseResult = CreateListingSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      console.error('Listing validation errors:', JSON.stringify(errors));
      // Build human-readable error message including field details
      const fieldMessages = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      return NextResponse.json(
        { error: `Validation failed: ${fieldMessages}`, details: errors },
        { status: 400 }
      );
    }

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
    } = parseResult.data;

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.listing.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Check if user is trusted (Admin or Validated) for auto-approval
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isValidated: true },
    });

    const isTrustedUser = user?.role === 'ADMIN' || user?.isValidated === true;

    // Determine status - trusted users get auto-approved, others need approval
    const listingStatus = status === 'DRAFT'
      ? 'DRAFT'
      : isTrustedUser
        ? 'ACTIVE'
        : 'PENDING_APPROVAL';

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title,
        slug,
        description,
        category,
        condition,
        price: askingPrice,
        is_negotiable: acceptsOffers ?? true,
        minimumOffer: minimumOffer ?? null,
        brand: brand || null,
        model: model || null,
        yearMade: yearMade ?? null,
        originalPrice: originalPrice ?? null,
        location: location || null,
        shippingAvailable: shippingAvailable ?? false,
        localPickupOnly: localPickupOnly ?? true,
        status: listingStatus,
      },
    });

    // Link images to listing if provided
    if (imageIds && imageIds.length > 0) {
      await prisma.media.updateMany({
        where: {
          id: { in: imageIds },
          uploaded_by_id: session.user.id,
        },
        data: {
          listingId: listing.id,
        },
      });
    }

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        actorId: session.user.id,
        subjectId: session.user.id,
        action: 'CREATE',
        entityType: 'Listing',
        entityId: listing.id,
        metadata: { title, category, price: askingPrice },
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
