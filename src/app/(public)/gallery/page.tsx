/**
 * Gallery Page — Section-based hub inspired by KAS gallery structure.
 *
 * Hub (no section param): Shows section cards + recent highlights.
 * ?section=astro        : Astrophotography with sub-category filters.
 * ?section=community    : Community photos with sub-category filters.
 * ?section=events       : Event albums grid.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { ArrowLeft, Camera, Upload, LogIn, Sparkles, CalendarDays, Users, Telescope, ChevronRight, ImageIcon } from 'lucide-react';
import type { PhotoCategory } from '@prisma/client';
import { getSession } from '@/lib/auth';
import {
  getCachedGalleryStats,
  getCachedGallerySectionPhotos,
  getCachedEventAlbums,
  getCachedGalleryHighlights,
} from '@/lib/db/cache';
import { GalleryClient } from './gallery-client';
import { EventAlbumsClient } from './event-albums-client';

export const dynamic = 'force-dynamic';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description:
    'Browse astrophotography and event photos from SPAC members. Explore organized albums by event, formal astrophotos, and community snapshots.',
};

// Sub-category filters per section
const ASTRO_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'DEEP_SKY', label: 'Deep Sky' },
  { id: 'PLANETS', label: 'Planets' },
  { id: 'MOON', label: 'Moon' },
  { id: 'SUN', label: 'Sun' },
  { id: 'NIGHTSCAPE', label: 'Nightscape' },
] as const;

const COMMUNITY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'EQUIPMENT', label: 'Equipment' },
  { id: 'OTHER', label: 'Other' },
] as const;

interface SearchParams {
  section?: string;
  category?: string;
  page?: string;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const section = params.section || 'hub';
  const category = params.category || 'all';
  const page = parseInt(params.page || '1', 10);

  const session = await getSession();
  const isLoggedIn = !!session?.user;

  // ─── Hub ──────────────────────────────────────────────────────────────────
  if (section === 'hub') {
    const [stats, highlights] = await Promise.all([
      getCachedGalleryStats().catch(() => ({
        astroCount: 0,
        communityCount: 0,
        eventAlbumCount: 0,
        recentAstro: null,
        recentCommunity: null,
      })),
      getCachedGalleryHighlights().catch(() => []),
    ]);

    return (
      <div className="py-12">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            Member Photography
          </div>
          <h1 className="block text-center font-bold text-foreground mb-4 overflow-visible">
            <GradientText
              colors={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']}
              className="text-3xl sm:text-5xl md:text-6xl font-bold"
              animationSpeed={5}
            >
              Photo Gallery
            </GradientText>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Explore stunning astrophotography, event albums, and snapshots from the SPAC community.
          </p>
          <div className="flex justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard/gallery/submit"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                <Upload className="h-5 w-5" />
                Submit a Photo
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
        </section>

        {/* Section Cards */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Astrophotography */}
            <SectionCard
              href="/gallery?section=astro"
              icon={<Telescope className="h-6 w-6" />}
              title="Astrophotography"
              description="Deep sky objects, planets, the Moon, the Sun, and Milky Way landscapes captured by our members."
              count={stats.astroCount}
              countLabel="photos"
              coverUrl={stats.recentAstro?.thumbnailUrl || stats.recentAstro?.url}
              accentColor="from-cyan-500/20 to-blue-600/20"
              iconColor="text-cyan-400"
            />

            {/* Event Albums */}
            <SectionCard
              href="/gallery?section=events"
              icon={<CalendarDays className="h-6 w-6" />}
              title="Event Albums"
              description="Photos organized by event — general meetings, observing sessions, star parties, outreach, and more."
              count={stats.eventAlbumCount}
              countLabel="albums"
              accentColor="from-violet-500/20 to-purple-600/20"
              iconColor="text-violet-400"
            />

            {/* Community Photos */}
            <SectionCard
              href="/gallery?section=community"
              icon={<Users className="h-6 w-6" />}
              title="Community Photos"
              description="Casual snapshots, equipment photos, and member-uploaded moments from club life."
              count={stats.communityCount}
              countLabel="photos"
              coverUrl={stats.recentCommunity?.thumbnailUrl || stats.recentCommunity?.url}
              accentColor="from-emerald-500/20 to-teal-600/20"
              iconColor="text-emerald-400"
            />
          </div>
        </section>

        {/* Recent Highlights */}
        {highlights.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Highlights</h2>
              <Link href="/gallery?section=astro" className="flex items-center gap-1 text-sm text-primary hover:underline">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {highlights.slice(0, 8).map((photo) => (
                <Link
                  key={photo.id}
                  href={`/gallery/${photo.id}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-slate-900"
                >
                  {photo.url && (
                    <Image
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.caption || 'Gallery photo'}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white font-medium line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ─── Astrophotography Section ──────────────────────────────────────────────
  if (section === 'astro') {
    const data = await getCachedGallerySectionPhotos('astro', category, page).catch(() => ({
      photos: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    }));

    return (
      <SectionLayout
        title="Astrophotography"
        icon={<Telescope className="h-5 w-5" />}
        description="Formal astrophotography by SPAC members — deep sky objects, planets, the Moon, the Sun, and nightscapes."
        filters={ASTRO_FILTERS}
        activeCategory={category}
        sectionParam="astro"
        isLoggedIn={isLoggedIn}
        photos={data.photos}
        total={data.total}
        totalPages={data.totalPages}
        currentPage={data.currentPage}
      />
    );
  }

  // ─── Community Section ─────────────────────────────────────────────────────
  if (section === 'community') {
    const data = await getCachedGallerySectionPhotos('community', category, page).catch(() => ({
      photos: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    }));

    return (
      <SectionLayout
        title="Community Photos"
        icon={<Users className="h-5 w-5" />}
        description="Snapshots from club events, equipment setups, and moments from our astronomy community."
        filters={COMMUNITY_FILTERS}
        activeCategory={category}
        sectionParam="community"
        isLoggedIn={isLoggedIn}
        photos={data.photos}
        total={data.total}
        totalPages={data.totalPages}
        currentPage={data.currentPage}
      />
    );
  }

  // ─── Event Albums Section ──────────────────────────────────────────────────
  if (section === 'events') {
    const albums = await getCachedEventAlbums().catch(() => []);

    return (
      <div className="py-12">
        <section className="container mx-auto px-4 mb-10">
          {/* Back */}
          <Link href="/gallery" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-400 mb-3">
                <CalendarDays className="h-4 w-4" />
                Event Albums
              </div>
              <h1 className="text-3xl font-bold text-foreground">Event Albums</h1>
              <p className="text-muted-foreground mt-1">
                Photos organized by event. Search for a past or upcoming event to view its album.
              </p>
            </div>
            {isLoggedIn && (
              <Link
                href="/dashboard/gallery/submit"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-sm shrink-0"
              >
                <Upload className="h-4 w-4" />
                Add Photos to an Event
              </Link>
            )}
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-20">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No event albums yet</h2>
              <p className="text-muted-foreground">
                Photos tagged to events will appear here as albums.
              </p>
            </div>
          ) : (
            <EventAlbumsClient albums={albums} />
          )}
        </section>
      </div>
    );
  }

  // Fallback → redirect to hub
  return (
    <div className="py-12 container mx-auto px-4 text-center">
      <Link href="/gallery" className="text-primary hover:underline">Back to gallery</Link>
    </div>
  );
}

// ─── Section Layout (shared between astro + community) ────────────────────────

interface PhotoData {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  alt: string | null;
  category: PhotoCategory | null;
  createdAt: Date;
  eventId?: string | null;
  users: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    role: string;
    isValidated: boolean;
  };
}

interface FilterItem {
  readonly id: string;
  readonly label: string;
}

interface SectionLayoutProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  filters: readonly FilterItem[];
  activeCategory: string;
  sectionParam: string;
  isLoggedIn: boolean;
  photos: PhotoData[];
  total: number;
  totalPages: number;
  currentPage: number;
}

function SectionLayout({
  title,
  icon,
  description,
  filters,
  activeCategory,
  sectionParam,
  isLoggedIn,
  photos,
  total,
  totalPages,
  currentPage,
}: SectionLayoutProps) {
  return (
    <div className="py-12">
      <section className="container mx-auto px-4 mb-8">
        {/* Back */}
        <Link href="/gallery" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary mb-3">
              {icon}
              {title}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-1 max-w-xl">{description}</p>
          </div>
          {isLoggedIn && (
            <Link
              href="/dashboard/gallery/submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-sm shrink-0"
            >
              <Upload className="h-4 w-4" />
              Submit Photo
            </Link>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <Link
              key={f.id}
              href={
                f.id === 'all'
                  ? `/gallery?section=${sectionParam}`
                  : `/gallery?section=${sectionParam}&category=${f.id}`
              }
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === f.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-8">
          {total} {total === 1 ? 'photo' : 'photos'}
          {activeCategory !== 'all' && ` — ${filters.find((f) => f.id === activeCategory)?.label}`}
        </p>

        {/* Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No photos yet</h2>
            <p className="text-muted-foreground">
              {activeCategory !== 'all'
                ? 'No photos in this sub-category yet.'
                : 'No photos have been submitted here yet.'}
            </p>
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
                href={`/gallery?section=${sectionParam}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}&page=${currentPage - 1}`}
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
                href={`/gallery?section=${sectionParam}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}&page=${currentPage + 1}`}
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

// ─── Section Card (hub page) ───────────────────────────────────────────────────

interface SectionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  coverUrl?: string | null;
  accentColor: string;
  iconColor: string;
}

function SectionCard({
  href,
  icon,
  title,
  description,
  count,
  countLabel,
  coverUrl,
  accentColor,
  iconColor,
}: SectionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Cover image or gradient placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${accentColor} overflow-hidden`}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className={`h-16 w-16 ${iconColor} opacity-30`} />
          </div>
        )}
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Count badge */}
        <div className="absolute bottom-4 left-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-sm font-semibold text-white">
            {count > 0 ? count.toLocaleString() : '0'} {countLabel}
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1 p-6">
        <div className={`flex items-center gap-2 text-sm font-semibold ${iconColor} mb-2`}>
          {icon}
          {title}
        </div>
        <p className="text-sm text-muted-foreground flex-1">{description}</p>
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          Browse {title} <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
