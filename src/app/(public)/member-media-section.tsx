/**
 * Member Media Section
 *
 * Showcases recent photos from members using animated BounceCards.
 * Dynamically fetches the latest approved gallery photos.
 */

import Link from 'next/link';
import { ArrowRight, Camera, Image, LogIn } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MemberMediaClient } from './member-media-client';

// Default placeholder images for when no photos exist (space-themed from Unsplash)
const placeholderImages = [
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop', // Nebula
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop', // Earth from space
  'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&h=400&fit=crop', // Milky Way
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop', // Galaxy
  'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400&h=400&fit=crop', // Saturn
];

async function getLatestPhotos(limit: number = 5) {
  try {
    const photos = await prisma.media.findMany({
      where: {
        type: 'IMAGE',
        status: 'APPROVED',
        category: { not: null },
        listingId: null, // Exclude listing photos
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        caption: true,
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return photos.map((photo) => ({
      id: photo.id,
      url: photo.thumbnailUrl || photo.url,
      caption: photo.caption,
      photographer:
        `${photo.users.firstName || ''} ${photo.users.lastName || ''}`.trim() ||
        'Anonymous',
    }));
  } catch {
    // Database not available during build or error
    return [];
  }
}

export async function MemberMediaSection() {
  const [photos, session] = await Promise.all([
    getLatestPhotos(5),
    getSession(),
  ]);
  const isLoggedIn = !!session?.user;

  // Use actual photos or placeholders
  const imageUrls =
    photos.length >= 5
      ? photos.map((p) => p.url)
      : photos.length > 0
        ? [...photos.map((p) => p.url), ...placeholderImages.slice(photos.length)]
        : placeholderImages;

  return (
    <section className="py-24 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Camera className="h-4 w-4" />
            Member Photography
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Captured by Our Members
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stunning astrophotography and event moments shared by our talented SPAC community.
          </p>
        </div>

        {/* BounceCards Display */}
        <div className="flex justify-center mb-12">
          <MemberMediaClient images={imageUrls} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25"
          >
            <Image className="h-5 w-5" />
            Browse Gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
          {isLoggedIn ? (
            <Link
              href="/dashboard/gallery/submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 backdrop-blur-sm px-6 py-3 font-semibold text-foreground transition-all hover:bg-card hover:border-primary/50 hover:scale-105"
            >
              <Camera className="h-5 w-5" />
              Submit Your Photos
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/dashboard/gallery/submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 backdrop-blur-sm px-6 py-3 font-semibold text-foreground transition-all hover:bg-card hover:border-primary/50 hover:scale-105"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Submit Photos
            </Link>
          )}
        </div>

        {/* Photo count indicator */}
        {photos.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Showing {photos.length} of our latest member submissions
          </p>
        )}
      </div>
    </section>
  );
}
