'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Calendar,
  User,
  Camera,
  Telescope,
  MapPin,
  Clock
} from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
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

interface PhotoModalProps {
  photo: PhotoData | null;
  photos: PhotoData[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (photo: PhotoData) => void;
}

export function PhotoModal({ photo, photos, isOpen, onClose, onNavigate }: PhotoModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  const currentIndex = photo ? photos.findIndex(p => p.id === photo.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      onNavigate(photos[currentIndex - 1]);
      setIsLoading(true);
    }
  }, [currentIndex, hasPrevious, photos, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(photos[currentIndex + 1]);
      setIsLoading(true);
    }
  }, [currentIndex, hasNext, photos, onNavigate]);

  const handleShare = async () => {
    if (!photo) return;
    const shareUrl = `${window.location.origin}/gallery/${photo.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.caption || 'SPAC Astrophotography',
          text: `Check out this amazing astrophoto by ${getPhotographerName(photo)}`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownload = async () => {
    if (!photo) return;
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${photo.caption || 'astrophoto'}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !photo) return null;

  const photographerName = getPhotographerName(photo);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation buttons */}
      {hasPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Main content */}
      <div 
        className="flex flex-col lg:flex-row h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image container */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="relative w-full h-[50vh] lg:h-[85vh] max-w-5xl">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={photo.url}
              alt={photo.alt || photo.caption || 'Astrophoto'}
              fill
              className={`object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              sizes="(max-width: 1024px) 100vw, 70vw"
              onLoad={() => setIsLoading(false)}
              priority
            />
          </div>
        </div>

        {/* Details panel */}
        <div className="lg:w-96 bg-card/80 backdrop-blur-md p-6 overflow-y-auto border-t lg:border-t-0 lg:border-l border-border">
          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {photo.caption || 'Untitled'}
          </h2>

          {/* Photographer */}
          <div className="flex items-center gap-3 mb-6">
            {photo.users.avatarUrl ? (
              <Image
                src={photo.users.avatarUrl}
                alt={photographerName}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                {photographerName}
                <VerifiedBadge
                  isAdmin={photo.users.role === 'ADMIN'}
                  isValidated={photo.users.isValidated}
                  size="sm"
                />
              </div>
              <p className="text-sm text-muted-foreground">Photographer</p>
            </div>
          </div>

          {/* Description */}
          {photo.description && (
            <div className="mb-6">
              <p className="text-muted-foreground">{photo.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {new Date(photo.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {photo.category && (
              <div className="flex items-center gap-3 text-sm">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground capitalize">
                  {photo.category.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            )}

            {photo.equipment && (
              <div className="flex items-center gap-3 text-sm">
                <Telescope className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{photo.equipment}</span>
              </div>
            )}

            {photo.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{photo.location}</span>
              </div>
            )}

            {photo.exposureTime && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{photo.exposureTime}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          {/* Counter */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {currentIndex + 1} of {photos.length}
          </p>
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

export default PhotoModal;
