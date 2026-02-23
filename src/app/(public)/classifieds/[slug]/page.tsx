/**
 * Listing Detail Page
 *
 * Shows full details of a classified listing.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  Share2,
  Heart,
  Truck,
  Package,
  Check,
  User,
  Clock,
  Tag,
} from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MakeOfferButton } from './make-offer-button';
import { ImageGallery } from './image-gallery';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      price: true,
      images: {
        where: { status: 'APPROVED' },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  const price = Number(listing.price);

  return {
    title: `${listing.title} - $${price.toLocaleString()}`,
    description: listing.description?.slice(0, 160) || `Buy ${listing.title} from SPAC classifieds`,
    openGraph: {
      title: `${listing.title} - $${price.toLocaleString()}`,
      description: listing.description?.slice(0, 160),
      images: listing.images[0]?.url ? [listing.images[0].url] : undefined,
    },
  };
}

// Condition badge styles
const conditionStyles: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  LIKE_NEW: { label: 'Like New', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  EXCELLENT: { label: 'Excellent', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  GOOD: { label: 'Good', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  FAIR: { label: 'Fair', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  FOR_PARTS: { label: 'For Parts', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// Category labels
const categoryLabels: Record<string, string> = {
  TELESCOPE: 'Telescope',
  MOUNT: 'Mount',
  EYEPIECE: 'Eyepiece',
  CAMERA: 'Camera',
  FINDER: 'Finder',
  FOCUSER: 'Focuser',
  ACCESSORY: 'Accessory',
  BINOCULAR: 'Binocular',
  SOLAR: 'Solar Equipment',
  BOOK: 'Book',
  SOFTWARE: 'Software',
  OTHER: 'Other',
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();

  // Members-only
  if (!session?.user) {
    redirect(`/login?callbackUrl=/classifieds/${slug}`);
  }

  // Fetch listing with related data
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          role: true,
          isValidated: true,
          _count: {
            select: {
              listings: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
      },
      images: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          alt: true,
          caption: true,
          width: true,
          height: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { offers: true },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Check access for non-active listings
  const isOwner = session?.user?.id === listing.sellerId;
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  if (listing.status !== 'ACTIVE' && !isOwner && !isAdmin) {
    notFound();
  }

  // Increment view count (server-side, non-blocking)
  if (!isOwner) {
    prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
  }

  const condition = conditionStyles[listing.condition] || {
    label: listing.condition,
    className: 'bg-muted text-muted-foreground',
  };

  const sellerName = listing.seller.name ||
    `${listing.seller.firstName} ${listing.seller.lastName}`.trim() ||
    'Anonymous';

  const memberSince = new Date(listing.seller.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const postedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const relativeDate = getRelativeTime(listing.createdAt);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/classifieds"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classifieds
        </Link>

        {/* Status Banner for non-active listings */}
        {listing.status !== 'ACTIVE' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            listing.status === 'SOLD'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : listing.status === 'PENDING_APPROVAL'
              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
              : 'bg-muted border-border text-muted-foreground'
          }`}>
            {listing.status === 'SOLD' && (
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                This item has been sold
                {listing.soldPrice && ` for $${Number(listing.soldPrice).toLocaleString()}`}
              </span>
            )}
            {listing.status === 'PENDING_APPROVAL' && (
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                This listing is pending approval
              </span>
            )}
            {listing.status === 'EXPIRED' && (
              <span>This listing has expired</span>
            )}
            {listing.status === 'DRAFT' && (
              <span>This listing is a draft</span>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Specifications */}
            {(listing.brand || listing.model || listing.yearMade) && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Specifications</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {listing.brand && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Brand</dt>
                      <dd className="font-medium text-foreground">{listing.brand}</dd>
                    </div>
                  )}
                  {listing.model && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Model</dt>
                      <dd className="font-medium text-foreground">{listing.model}</dd>
                    </div>
                  )}
                  {listing.yearMade && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Year</dt>
                      <dd className="font-medium text-foreground">{listing.yearMade}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Shipping & Pickup */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Options</h2>
              <div className="space-y-3">
                {listing.localPickupOnly && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Local pickup available</span>
                    {listing.location && (
                      <span className="text-muted-foreground">
                        ({listing.location})
                      </span>
                    )}
                  </div>
                )}
                {listing.shippingAvailable && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Truck className="h-5 w-5 text-primary" />
                    <span>Shipping available (buyer pays shipping)</span>
                  </div>
                )}
                {!listing.localPickupOnly && !listing.shippingAvailable && (
                  <p className="text-muted-foreground">
                    Contact seller for delivery options
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="rounded-xl border border-border bg-card p-6 sticky top-20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${condition.className}`}>
                    {condition.label}
                  </span>
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {categoryLabels[listing.category] || listing.category}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                {listing.title}
              </h1>

              <div className="text-3xl font-bold text-primary mb-4">
                ${Number(listing.price).toLocaleString()}
                {listing.is_negotiable && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    or best offer
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {listing.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {listing._count.offers} offers
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {relativeDate}
                </span>
              </div>

              {/* Action Buttons */}
              {listing.status === 'ACTIVE' && (
                <div className="space-y-3">
                  {!isOwner && session?.user ? (
                    <>
                      {listing.is_negotiable && (
                        <MakeOfferButton
                          listingSlug={listing.slug}
                          listingTitle={listing.title}
                          askingPrice={Number(listing.price)}
                        />
                      )}
                      <button
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Contact Seller
                      </button>
                    </>
                  ) : !isOwner ? (
                    <Link
                      href={`/login?callbackUrl=/classifieds/${listing.slug}`}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Sign in to make an offer
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/listings/${listing.id}/edit`}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Edit Listing
                    </Link>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {listing.seller.avatarUrl ? (
                    <Image
                      src={listing.seller.avatarUrl}
                      alt={sellerName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    {sellerName}
                    <VerifiedBadge
                      isAdmin={listing.seller.role === 'ADMIN'}
                      isValidated={listing.seller.isValidated}
                      size="sm"
                    />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Member since {memberSince}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active listings</span>
                  <span className="font-medium text-foreground">
                    {listing.seller._count.listings}
                  </span>
                </div>
              </div>
              <Link
                href={`/classifieds?sellerId=${listing.seller.id}`}
                className="mt-4 block text-center text-sm text-primary hover:underline"
              >
                View all listings from this seller
              </Link>
            </div>

            {/* Location */}
            {listing.location && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Location</h3>
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  {listing.location}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
