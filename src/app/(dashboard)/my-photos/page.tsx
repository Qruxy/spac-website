/**
 * My Photos Page
 *
 * View and manage photos submitted to the gallery.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Camera,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Heart,
  Calendar,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'My Photos',
  description: 'View and manage your gallery submissions',
};

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-400 bg-yellow-500/10',
    label: 'Pending Review',
  },
  APPROVED: {
    icon: CheckCircle2,
    color: 'text-green-400 bg-green-500/10',
    label: 'Approved',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-400 bg-red-500/10',
    label: 'Rejected',
  },
};

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

export default async function MyPhotosPage() {
  const session = await getSession();

  // Fetch user's gallery submissions
  let photos: Array<{
    id: string;
    url: string;
    thumbnailUrl: string | null;
    caption: string | null;
    category: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    viewCount: number;
    likeCount: number;
    createdAt: Date;
  }> = [];

  try {
    photos = await prisma.media.findMany({
      where: {
        uploaded_by_id: session!.user.id,
        type: 'IMAGE',
        category: { not: null }, // Only gallery photos
        listingId: null, // Exclude listing photos
      },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        caption: true,
        category: true,
        status: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    photos = [];
  }

  const pendingCount = photos.filter((p) => p.status === 'PENDING').length;
  const approvedCount = photos.filter((p) => p.status === 'APPROVED').length;
  const totalViews = photos.reduce((sum, p) => sum + p.viewCount, 0);
  const totalLikes = photos.reduce((sum, p) => sum + p.likeCount, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Photos</h1>
          <p className="text-muted-foreground mt-1">
            Manage your gallery submissions
          </p>
        </div>
        <Link
          href="/dashboard/gallery/submit"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Submit Photo
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <StatCard
          title="Total Photos"
          value={photos.length}
          icon={Camera}
          color="text-primary"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          color="text-yellow-400"
        />
        <StatCard
          title="Total Views"
          value={totalViews}
          icon={Eye}
          color="text-blue-400"
        />
        <StatCard
          title="Total Likes"
          value={totalLikes}
          icon={Heart}
          color="text-pink-400"
        />
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No photos yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Share your astrophotography with the SPAC community
          </p>
          <Link
            href="/dashboard/gallery/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit Your First Photo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof Camera;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{title}</p>
    </div>
  );
}

function PhotoCard({
  photo,
}: {
  photo: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    caption: string | null;
    category: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    viewCount: number;
    likeCount: number;
    createdAt: Date;
  };
}) {
  const status = statusConfig[photo.status];
  const StatusIcon = status.icon;
  const categoryLabel = photo.category ? categoryLabels[photo.category] : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Image */}
      <div className="aspect-[4/3] bg-muted relative">
        {photo.thumbnailUrl || photo.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.caption || 'Photo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">
          {photo.caption || 'Untitled'}
        </h3>

        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(photo.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>

        {categoryLabel && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Stats (only for approved photos) */}
        {photo.status === 'APPROVED' && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {photo.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {photo.likeCount}
            </span>
            <Link
              href={`/gallery/${photo.id}`}
              className="ml-auto text-primary hover:underline text-xs"
            >
              View in Gallery
            </Link>
          </div>
        )}

        {/* Pending message */}
        {photo.status === 'PENDING' && (
          <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            Your photo is being reviewed by a moderator
          </p>
        )}

        {/* Rejected message */}
        {photo.status === 'REJECTED' && (
          <p className="mt-3 pt-3 border-t border-border text-xs text-destructive">
            This photo was not approved. Contact us for more information.
          </p>
        )}
      </div>
    </div>
  );
}
