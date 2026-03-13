'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, CalendarDays, ImageIcon, ChevronRight } from 'lucide-react';

interface AlbumPreviewPhoto {
  id: string;
  url: string;
  thumbnailUrl: string | null;
}

interface EventAlbum {
  id: string;
  title: string;
  slug: string;
  startDate: Date;
  type: string;
  photoCount: number;
  coverPhoto: AlbumPreviewPhoto | null;
  previewPhotos: AlbumPreviewPhoto[];
}

interface EventAlbumsClientProps {
  albums: EventAlbum[];
}

function formatEventDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EventAlbumsClient({ albums }: EventAlbumsClientProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return albums;
    const q = query.toLowerCase();
    return albums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        formatEventDate(a.startDate).toLowerCase().includes(q)
    );
  }, [albums, query]);

  // Group albums by year for KAS-style sectionized browsing
  const grouped = useMemo(() => {
    const map = new Map<number, EventAlbum[]>();
    for (const album of filtered) {
      const year = new Date(album.startDate).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(album);
    }
    // Sort years descending
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by event name, type, or year…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No albums match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(([year, yearAlbums]) => (
            <div key={year}>
              {/* Year heading — KAS-style section divider */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl font-bold text-foreground">{year}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">{yearAlbums.length} album{yearAlbums.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {yearAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album }: { album: EventAlbum }) {
  const previewAll = [album.coverPhoto, ...album.previewPhotos].filter(Boolean) as AlbumPreviewPhoto[];

  return (
    <Link
      href={`/gallery/event/${album.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Cover + preview strip */}
      <div className="relative h-44 bg-slate-900 overflow-hidden">
        {album.coverPhoto ? (
          <Image
            src={album.coverPhoto.thumbnailUrl || album.coverPhoto.url}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-14 w-14 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Preview strip (up to 3 thumbnails) */}
        {previewAll.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {previewAll.slice(1, 4).map((p) => (
              <div key={p.id} className="relative w-10 h-10 rounded overflow-hidden border border-white/20 bg-slate-800">
                <Image
                  src={p.thumbnailUrl || p.url}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Photo count badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
            <ImageIcon className="h-3 w-3" />
            {album.photoCount}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
          {album.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
          <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{formatEventDate(album.startDate)}</span>
          <span className="mx-1">·</span>
          <span>{formatEventType(album.type)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          View album <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
