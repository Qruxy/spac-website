/**
 * Database Cache Utilities
 *
 * Uses Next.js unstable_cache for ISR-compatible database query caching.
 * This provides server-side caching that persists across requests.
 */

import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import type { PhotoCategory } from '@prisma/client';

/**
 * Get a single photo by ID with caching
 * Cached for 60 seconds, revalidated on demand
 */
export const getCachedPhoto = unstable_cache(
  async (id: string) => {
    const photo = await prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        status: true,
        category: true,
        url: true,
        thumbnailUrl: true,
        caption: true,
        alt: true,
        width: true,
        height: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        uploaded_by_id: true,
        users: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    return photo;
  },
  ['photo'],
  {
    revalidate: 60,
    tags: ['photos'],
  }
);

/**
 * Get gallery photos with pagination and filtering
 * Cached for 120 seconds
 */
export const getCachedGalleryPhotos = unstable_cache(
  async (category: string | undefined, page: number) => {
    const pageSize = 12;
    const skip = (page - 1) * pageSize;

    const where = {
      type: 'IMAGE' as const,
      status: 'APPROVED' as const,
      category: category && category !== 'all'
        ? category as PhotoCategory
        : { not: null },
      listingId: null,
    };

    const [photos, total] = await Promise.all([
      prisma.media.findMany({
        where,
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          caption: true,
          alt: true,
          category: true,
          createdAt: true,
          users: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: true,
              isValidated: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      photos,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  },
  ['gallery-photos'],
  {
    revalidate: 120,
    tags: ['photos', 'gallery'],
  }
);

/**
 * Get related photos by category
 * Cached for 120 seconds
 */
export const getCachedRelatedPhotos = unstable_cache(
  async (category: string, excludeId: string) => {
    return prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'APPROVED',
        category: category as PhotoCategory,
        id: { not: excludeId },
        listingId: null,
      },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        caption: true,
        alt: true,
        users: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });
  },
  ['related-photos'],
  {
    revalidate: 120,
    tags: ['photos'],
  }
);

// Categories that belong to each gallery section
const ASTRO_CATEGORIES: PhotoCategory[] = ['DEEP_SKY', 'PLANETS', 'MOON', 'SUN', 'NIGHTSCAPE'];
const COMMUNITY_CATEGORIES: PhotoCategory[] = ['EVENTS', 'EQUIPMENT', 'OTHER'];

// Shared select shape for gallery photo cards
const GALLERY_PHOTO_SELECT = {
  id: true,
  url: true,
  thumbnailUrl: true,
  caption: true,
  alt: true,
  category: true,
  createdAt: true,
  eventId: true,
  users: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      isValidated: true,
    },
  },
} as const;

/**
 * Get photos for a specific gallery section (astro or community)
 * with optional sub-category filter and pagination.
 */
export const getCachedGallerySectionPhotos = unstable_cache(
  async (section: 'astro' | 'community', category: string, page: number) => {
    const pageSize = 12;
    const skip = (page - 1) * pageSize;
    const sectionCategories = section === 'astro' ? ASTRO_CATEGORIES : COMMUNITY_CATEGORIES;

    const where = {
      type: 'IMAGE' as const,
      status: 'APPROVED' as const,
      listingId: null as null,
      category:
        category && category !== 'all'
          ? (category as PhotoCategory)
          : { in: sectionCategories },
    };

    const [photos, total] = await Promise.all([
      prisma.media.findMany({
        where,
        select: GALLERY_PHOTO_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      photos,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  },
  ['gallery-section-photos'],
  { revalidate: 120, tags: ['photos', 'gallery'] }
);

/**
 * Get aggregate stats for the gallery hub (photo counts per section).
 */
export const getCachedGalleryStats = unstable_cache(
  async () => {
    const [astroCount, communityCount, eventAlbumCount, recentAstro, recentCommunity] =
      await Promise.all([
        prisma.media.count({
          where: {
            type: 'IMAGE',
            status: 'APPROVED',
            listingId: null,
            category: { in: ASTRO_CATEGORIES },
          },
        }),
        prisma.media.count({
          where: {
            type: 'IMAGE',
            status: 'APPROVED',
            listingId: null,
            category: { in: COMMUNITY_CATEGORIES },
          },
        }),
        prisma.event.count({
          where: {
            media: {
              some: { type: 'IMAGE', status: 'APPROVED', listingId: null },
            },
          },
        }),
        // Cover photo for astrophotography section card
        prisma.media.findFirst({
          where: {
            type: 'IMAGE',
            status: 'APPROVED',
            listingId: null,
            category: { in: ASTRO_CATEGORIES },
          },
          select: { url: true, thumbnailUrl: true, caption: true },
          orderBy: { createdAt: 'desc' },
        }),
        // Cover photo for community section card
        prisma.media.findFirst({
          where: {
            type: 'IMAGE',
            status: 'APPROVED',
            listingId: null,
            category: { in: COMMUNITY_CATEGORIES },
          },
          select: { url: true, thumbnailUrl: true, caption: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return { astroCount, communityCount, eventAlbumCount, recentAstro, recentCommunity };
  },
  ['gallery-stats'],
  { revalidate: 120, tags: ['photos', 'gallery'] }
);

/**
 * Get events that have at least one approved gallery photo (event albums).
 */
export const getCachedEventAlbums = unstable_cache(
  async () => {
    // Events with photos
    const events = await prisma.event.findMany({
      where: {
        media: {
          some: { type: 'IMAGE', status: 'APPROVED', listingId: null },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        type: true,
        // Grab up to 4 preview photos
        media: {
          where: { type: 'IMAGE', status: 'APPROVED', listingId: null },
          select: { id: true, url: true, thumbnailUrl: true },
          orderBy: { createdAt: 'asc' },
          take: 4,
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Get true counts (media array is capped at 4 above)
    const eventIds = events.map((e) => e.id);
    const countRows = await prisma.media.groupBy({
      by: ['eventId'],
      where: {
        type: 'IMAGE',
        status: 'APPROVED',
        listingId: null,
        eventId: { in: eventIds },
      },
      _count: { id: true },
    });
    const countMap = new Map(countRows.map((r) => [r.eventId, r._count.id]));

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      startDate: e.startDate,
      type: e.type,
      photoCount: countMap.get(e.id) ?? e.media.length,
      coverPhoto: e.media[0] ?? null,
      previewPhotos: e.media.slice(1, 4),
    }));
  },
  ['event-albums'],
  { revalidate: 120, tags: ['photos', 'gallery'] }
);

/**
 * Get all photos for a specific event album.
 */
export const getCachedEventPhotos = unstable_cache(
  async (eventId: string) => {
    const [event, photos] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          description: true,
          type: true,
          locationName: true,
        },
      }),
      prisma.media.findMany({
        where: {
          type: 'IMAGE',
          status: 'APPROVED',
          eventId,
          listingId: null,
        },
        select: GALLERY_PHOTO_SELECT,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { event, photos };
  },
  ['event-photos'],
  { revalidate: 120, tags: ['photos', 'gallery'] }
);

/**
 * Get recent highlight photos across all sections (for the hub page).
 */
export const getCachedGalleryHighlights = unstable_cache(
  async () => {
    return prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'APPROVED',
        listingId: null,
        category: { not: null },
      },
      select: GALLERY_PHOTO_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  },
  ['gallery-highlights'],
  { revalidate: 120, tags: ['photos', 'gallery'] }
);

/**
 * Get all photo IDs for static generation
 * Cached for 300 seconds (5 minutes)
 */
export const getCachedPhotoIds = unstable_cache(
  async () => {
    const photos = await prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'APPROVED',
        listingId: null,
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 100, // Pre-generate top 100 most recent photos
    });

    return photos.map(p => p.id);
  },
  ['photo-ids'],
  {
    revalidate: 300,
    tags: ['photos'],
  }
);
