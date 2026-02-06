/**
 * Photo Detail Page
 *
 * Individual photo view with full resolution, metadata, and engagement.
 * Uses unstable_cache for ISR-compatible caching.
 */

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  Heart,
  Share2,
  Tag,
  User,
  ImageIcon,
  Telescope,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getCachedPhoto, getCachedRelatedPhotos, getCachedPhotoIds } from '@/lib/db/cache';

// Enable ISR with 60-second revalidation
export const revalidate = 60;

export async function generateStaticParams() {
  if (process.env.GITHUB_PAGES === 'true') return [];
  const ids = await getCachedPhotoIds();
  return ids.map((id: string) => ({ id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Cached per-request to deduplicate between generateMetadata and page component
const getPhoto = cache(async function getPhoto(id: string) {
  try {
    // Use cached query for performance
    const photo = await getCachedPhoto(id);

    if (!photo || photo.type !== 'IMAGE') {
      return null;
    }

    // Only show approved photos publicly
    if (photo.status !== 'APPROVED') {
      const session = await getSession();
      const isOwner = session?.user?.id === photo.uploaded_by_id;
      const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
      if (!isOwner && !isAdmin) {
        return null;
      }
    }

    return photo;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhoto(id);

  if (!photo) {
    return {
      title: 'Photo Not Found',
    };
  }

  const photographerName = photo.users.name ||
    `${photo.users.firstName || ''} ${photo.users.lastName || ''}`.trim() ||
    'SPAC Member';

  return {
    title: photo.caption || 'Gallery Photo',
    description: photo.alt || `Astrophotography by ${photographerName}`,
    openGraph: {
      images: [photo.url],
    },
  };
}

// Categories with labels
const categoryLabels: Record<string, string> = {
  DEEP_SKY: 'Deep Sky',
  PLANETS: 'Planets',
  MOON: 'Moon',
  SUN: 'Sun',
  EVENTS: 'Events',
  EQUIPMENT: 'Equipment',
  NIGHTSCAPE: 'Nightscape',
  OTHER: 'Other',
};

export default async function PhotoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const photo = await getPhoto(id);

  if (!photo) {
    notFound();
  }

  // Increment view count in background (non-blocking)
  void prisma.media.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const photographerName = photo.users.name ||
    `${photo.users.firstName || ''} ${photo.users.lastName || ''}`.trim() ||
    'Anonymous';

  const categoryLabel = photo.category ? categoryLabels[photo.category] : null;

  // Get related photos using cached query
  let relatedPhotos: Awaited<ReturnType<typeof getCachedRelatedPhotos>> = [];
  if (photo.category) {
    try {
      relatedPhotos = await getCachedRelatedPhotos(photo.category, photo.id);
    } catch {
      relatedPhotos = [];
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/gallery"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Link>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
              <a
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || photo.caption || 'Gallery photo'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Title & Caption */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {photo.caption || 'Untitled Photo'}
              </h1>
              {photo.alt && photo.alt !== photo.caption && (
                <p className="text-muted-foreground">{photo.alt}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-5 w-5" />
                <span className="font-medium">{photo.viewCount}</span>
                <span className="text-sm">views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-5 w-5" />
                <span className="font-medium">{photo.likeCount}</span>
                <span className="text-sm">likes</span>
              </div>
            </div>

            {/* Photographer */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {photo.users.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.users.avatarUrl}
                    alt={photographerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{photographerName}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(photo.users.createdAt).getFullYear()}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 py-4 border-y border-border">
              {categoryLabel && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <Link
                    href={`/gallery?category=${photo.category}`}
                    className="text-primary hover:underline"
                  >
                    {categoryLabel}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="text-foreground">
                  {new Date(photo.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {photo.width && photo.height && (
                <div className="flex items-center gap-3 text-sm">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Resolution:</span>
                  <span className="text-foreground">
                    {photo.width} x {photo.height} px
                  </span>
                </div>
              )}
            </div>

            {/* Equipment (placeholder for future feature) */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Telescope className="h-4 w-4" />
                <span className="text-sm font-medium">Equipment Info</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Equipment and capture details will be available in a future update.
              </p>
            </div>
          </div>
        </div>

        {/* Related Photos */}
        {relatedPhotos.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              More {categoryLabel} Photos
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPhotos.map((related) => (
                <Link
                  key={related.id}
                  href={`/gallery/${related.id}`}
                  className="group"
                >
                  <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={related.thumbnailUrl || related.url}
                        alt={related.alt || related.caption || 'Gallery photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {related.caption || 'Untitled'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
