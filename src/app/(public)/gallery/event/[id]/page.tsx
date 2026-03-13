/**
 * Event Album Page
 *
 * Shows all approved photos linked to a specific event.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, ImageIcon, Camera } from 'lucide-react';
import { getCachedEventPhotos } from '@/lib/db/cache';
import { GalleryClient } from '../../gallery-client';

export const dynamic = 'force-dynamic';

interface Params {
  id: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { event } = await getCachedEventPhotos(id);
    if (!event) return { title: 'Event Album' };
    return {
      title: `${event.title} — Photo Album`,
      description: `Browse photos from ${event.title}.`,
    };
  } catch {
    return { title: 'Event Album' };
  }
}

export default async function EventAlbumPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getCachedEventPhotos>>;
  try {
    data = await getCachedEventPhotos(id);
  } catch {
    notFound();
  }

  const { event, photos } = data;
  if (!event) notFound();

  const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const eventType = event.type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="py-12">
      <section className="container mx-auto px-4 mb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link>
          <span>/</span>
          <Link href="/gallery?section=events" className="hover:text-foreground transition-colors">Event Albums</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{event.title}</span>
        </div>

        {/* Back link */}
        <Link
          href="/gallery?section=events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Event Albums
        </Link>

        {/* Event header */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-400 mb-4">
            <CalendarDays className="h-4 w-4" />
            {eventType}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{event.title}</h1>

          {event.description && (
            <p className="text-muted-foreground mb-4 max-w-2xl leading-relaxed">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              {eventDate}
            </div>
            {event.locationName && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {event.locationName}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 flex-shrink-0" />
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </div>
          </div>
        </div>

        {/* Photos */}
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No photos yet</h2>
            <p className="text-muted-foreground">
              No approved photos have been linked to this event.
            </p>
          </div>
        ) : (
          <GalleryClient photos={photos} />
        )}
      </section>
    </div>
  );
}
