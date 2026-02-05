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
