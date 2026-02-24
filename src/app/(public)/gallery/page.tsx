/**
 * Gallery Page
 *
 * Member photo gallery with Masonry layout and featured carousel.
 * Enhanced with React Bits animated components.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-static';
import {
  Camera,
  Filter,
  Upload,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getCachedGalleryPhotos } from '@/lib/db/cache';
import type { PhotoCategory } from '@prisma/client';
import { GalleryClient } from './gallery-client';

// Dynamic imports for animated components
const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);

const CircularGallery = nextDynamic(
  () => import('@/components/animated/circular-gallery').then((mod) => mod.CircularGallery),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Astrophotography Gallery',
  description:
    'Browse stunning astrophotography and event photos from SPAC members. Deep sky objects, planets, the Moon, and more.',
};

// ISR with 2-minute revalidation for faster cache updates
export const revalidate = 120;

// Categories for filtering
const categories = [
  { id: 'all', label: 'All Photos' },
  { id: 'DEEP_SKY', label: 'Deep Sky' },
  { id: 'PLANETS', label: 'Planets' },
  { id: 'MOON', label: 'Moon' },
  { id: 'SUN', label: 'Sun' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'EQUIPMENT', label: 'Equipment' },
  { id: 'NIGHTSCAPE', label: 'Nightscape' },
  { id: 'OTHER', label: 'Other' },
] as const;

interface SearchParams {
  category?: string;
  page?: string;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category || 'all';
  const currentPage = parseInt(params.page || '1', 10);

  const session = await getSession();
  const isLoggedIn = !!session?.user;

  let data;
  try {
    // Use cached query for performance
    data = await getCachedGalleryPhotos(categoryFilter, currentPage);
  } catch {
    // Handle database not available during build
    data = {
      photos: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }

  const { photos, total, totalPages } = data;

  // Get featured photos for the circular gallery (top 8 most recent).
  // Route through Next.js image optimization (/_next/image) so images are served
  // same-origin — this bypasses CORS restrictions on the WebGL canvas texture loading.
  const proxyUrl = (src: string) =>
    `/_next/image?url=${encodeURIComponent(src)}&w=800&q=75`;

  const featuredPhotos = photos.slice(0, 8).map(photo => ({
    image: proxyUrl(photo.thumbnailUrl || photo.url),
    text: photo.caption || 'Untitled'
  }));

  return (
    <div className="py-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            Member Photography
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 flex items-center justify-center gap-4 flex-wrap">
            <GradientText
              colors={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']}
              className="text-5xl md:text-6xl font-bold"
              animationSpeed={5}
            >
              Astrophotography
            </GradientText>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stunning astrophotography captured by our talented members. 
            From distant galaxies to our neighboring planets—explore the wonders of the night sky.
          </p>
        </div>

        {/* Submit button */}
        <div className="flex justify-center mb-8">
          {isLoggedIn ? (
            <Link
              href="/dashboard/gallery/submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <Upload className="h-5 w-5" />
              Submit Your Photo
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/dashboard/gallery/submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Submit
            </Link>
          )}
        </div>

        {/* Featured Gallery Carousel */}
        {featuredPhotos.length >= 3 && (
          <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden bg-slate-900/50 border border-border">
            <CircularGallery
              items={featuredPhotos}
              bend={2}
              textColor="#ffffff"
              borderRadius={0.05}
              font="bold 18px system-ui, sans-serif"
              scrollSpeed={1.5}
              scrollEase={0.06}
            />
          </div>
        )}
      </section>

      {/* Category Filters */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {categories.map((category) => (
            <Link
              key={category.id}
              href={
                category.id === 'all'
                  ? '/gallery'
                  : `/gallery?category=${category.id}`
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 mb-8">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'photo' : 'photos'}
          {categoryFilter !== 'all' && ` in ${categories.find(c => c.id === categoryFilter)?.label}`}
        </p>
      </section>

      {/* Photo Grid with Masonry */}
      <section className="container mx-auto px-4">
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No photos found
            </h2>
            <p className="text-muted-foreground mb-4">
              {categoryFilter !== 'all'
                ? 'There are no photos in this category yet.'
                : 'No photos have been submitted to the gallery yet.'}
            </p>
            {categoryFilter !== 'all' && (
              <Link href="/gallery" className="text-primary hover:underline">
                View all photos
              </Link>
            )}
          </div>
        ) : (
          <GalleryClient photos={photos} />
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/gallery?${categoryFilter !== 'all' ? `category=${categoryFilter}&` : ''}page=${currentPage - 1}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/gallery?${categoryFilter !== 'all' ? `category=${categoryFilter}&` : ''}page=${currentPage + 1}`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
