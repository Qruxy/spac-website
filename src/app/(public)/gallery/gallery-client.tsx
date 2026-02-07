'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Search, Camera, User, Calendar, Eye, Star, Telescope } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Masonry, type MasonryItem } from '@/components/animated/masonry';
import { GlareHover } from '@/components/animated/glare-hover';
import { PhotoModal } from './photo-modal';
import type { PhotoCategory } from '@prisma/client';

interface PhotoData {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  alt: string | null;
  category: PhotoCategory | null;
  createdAt: Date;
  description?: string | null;
  equipment?: string | null;
  location?: string | null;
  exposureTime?: string | null;
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

interface GalleryClientProps {
  photos: PhotoData[];
}

// Categories mapping
const categories = [
  { id: 'DEEP_SKY', label: 'Deep Sky' },
  { id: 'PLANETS', label: 'Planets' },
  { id: 'MOON', label: 'Moon' },
  { id: 'SUN', label: 'Sun' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'EQUIPMENT', label: 'Equipment' },
  { id: 'NIGHTSCAPE', label: 'Nightscape' },
  { id: 'OTHER', label: 'Other' },
] as const;

export function GalleryClient({ photos }: GalleryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter photos based on search
  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return photos;
    
    const query = searchQuery.toLowerCase();
    return photos.filter(photo => {
      const photographerName = getPhotographerName(photo).toLowerCase();
      const caption = (photo.caption || '').toLowerCase();
      const equipment = (photo.equipment || '').toLowerCase();
      const location = (photo.location || '').toLowerCase();
      
      return (
        photographerName.includes(query) ||
        caption.includes(query) ||
        equipment.includes(query) ||
        location.includes(query)
      );
    });
  }, [photos, searchQuery]);

  const handlePhotoClick = useCallback((photo: PhotoData) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  }, []);

  const handleNavigate = useCallback((photo: PhotoData) => {
    setSelectedPhoto(photo);
  }, []);

  // Convert photos to masonry items
  const masonryItems: MasonryItem[] = useMemo(() => {
    return filteredPhotos.map((photo, index) => ({
      id: photo.id,
      img: photo.thumbnailUrl || photo.url,
      // Use deterministic heights based on index to avoid hydration issues
      // Heights cycle through 400, 500, 550, 450, 600 for visual variety
      height: [400, 500, 550, 450, 600][index % 5],
      onClick: () => handlePhotoClick(photo),
      children: (
        <PhotoCard photo={photo} onClick={() => handlePhotoClick(photo)} />
      )
    }));
  }, [filteredPhotos, handlePhotoClick]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No photos found
        </h2>
        <p className="text-muted-foreground">
          No photos have been submitted to the gallery yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by photographer, title, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        {searchQuery && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Found {filteredPhotos.length} {filteredPhotos.length === 1 ? 'photo' : 'photos'}
          </p>
        )}
      </div>

      {/* Masonry grid */}
      {filteredPhotos.length > 0 ? (
        <Masonry
          items={masonryItems}
          animateFrom="bottom"
          stagger={0.03}
          scaleOnHover={true}
          hoverScale={0.98}
          blurToFocus={true}
          gap={20}
        />
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No results found
          </h2>
          <p className="text-muted-foreground">
            Try a different search term.
          </p>
        </div>
      )}

      {/* Photo modal */}
      <PhotoModal
        photo={selectedPhoto}
        photos={filteredPhotos}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNavigate={handleNavigate}
      />
    </>
  );
}

interface PhotoCardProps {
  photo: PhotoData;
  onClick: () => void;
}

function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const photographerName = getPhotographerName(photo);
  const categoryLabel = categories.find(c => c.id === photo.category)?.label || 'Photo';

  return (
    <div onClick={onClick} className="cursor-pointer group">
      {/* Image Container */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-border/50 group-hover:border-primary/40 transition-all duration-300">
        {photo.url ? (
          <Image
            src={photo.thumbnailUrl || photo.url}
            alt={photo.alt || photo.caption || 'Gallery photo'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Star className="h-12 w-12 text-slate-700" />
          </div>
        )}

        {/* Category badge */}
        {photo.category && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Always-visible gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />

        {/* View icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Always-visible info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <h3 className="text-base font-semibold text-white line-clamp-1 drop-shadow-lg">
            {photo.caption || 'Untitled'}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-white/80 drop-shadow-md">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex items-center gap-1 truncate">
              {photographerName}
              <VerifiedBadge
                isAdmin={photo.users.role === 'ADMIN'}
                isValidated={photo.users.isValidated}
                size="sm"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPhotographerName(photo: PhotoData): string {
  return photo.users.name ||
    `${photo.users.firstName || ''} ${photo.users.lastName || ''}`.trim() ||
    'Anonymous';
}

export default GalleryClient;
