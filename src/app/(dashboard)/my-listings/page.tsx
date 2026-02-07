/**
 * My Listings Page
 *
 * Manage user's classified listings.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Package,
  Eye,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Listings',
  description: 'Manage your classified listings',
};

export default async function MyListingsPage() {
  const session = await getSession();

  const listings = await prisma.listing.findMany({
    where: { sellerId: session!.user.id },
    include: {
      _count: {
        select: { offers: true },
      },
      images: {
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeListings = listings.filter(
    (l) => l.status === 'ACTIVE' || l.status === 'PENDING_APPROVAL' || l.status === 'DRAFT'
  );
  const soldListings = listings.filter((l) => l.status === 'SOLD');
  const expiredListings = listings.filter(
    (l) => l.status === 'EXPIRED' || l.status === 'REMOVED'
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classified ads
          </p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          title="Active Listings"
          value={activeListings.length}
          icon={Package}
          color="text-green-400"
        />
        <StatCard
          title="Items Sold"
          value={soldListings.length}
          icon={CheckCircle2}
          color="text-blue-400"
        />
        <StatCard
          title="Total Views"
          value={listings.reduce((sum, l) => sum + (l.viewCount || 0), 0)}
          icon={Eye}
          color="text-purple-400"
        />
      </div>

      {/* Active Listings */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Active Listings ({activeListings.length})
        </h2>

        {activeListings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No active listings
            </h3>
            <p className="text-muted-foreground mb-4">
              Start selling your astronomy equipment!
            </p>
            <Link
              href="/dashboard/listings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Sold Listings */}
      {soldListings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Sold ({soldListings.length})
          </h2>
          <div className="space-y-4 opacity-75">
            {soldListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isSold />
            ))}
          </div>
        </section>
      )}

      {/* Expired/Removed Listings */}
      {expiredListings.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Expired/Removed ({expiredListings.length})
          </h2>
          <div className="space-y-4 opacity-50">
            {expiredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isExpired />
            ))}
          </div>
        </section>
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
  icon: typeof Package;
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

function ListingCard({
  listing,
  isSold,
  isExpired,
}: {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: { toNumber: () => number } | number;
    status: string;
    viewCount: number;
    createdAt: Date;
    images: { url: string }[];
    _count: { offers: number };
  };
  isSold?: boolean;
  isExpired?: boolean;
}) {
  const statusConfig: Record<
    string,
    { icon: typeof CheckCircle2; color: string; label: string }
  > = {
    ACTIVE: {
      icon: CheckCircle2,
      color: 'text-green-400 bg-green-500/10',
      label: 'Active',
    },
    DRAFT: {
      icon: Clock,
      color: 'text-gray-400 bg-gray-500/10',
      label: 'Draft',
    },
    PENDING_APPROVAL: {
      icon: Clock,
      color: 'text-yellow-400 bg-yellow-500/10',
      label: 'Pending Review',
    },
    SOLD: {
      icon: DollarSign,
      color: 'text-blue-400 bg-blue-500/10',
      label: 'Sold',
    },
    EXPIRED: {
      icon: Clock,
      color: 'text-orange-400 bg-orange-500/10',
      label: 'Expired',
    },
    REMOVED: {
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10',
      label: 'Removed',
    },
  };

  const status = statusConfig[listing.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-48 h-32 sm:h-auto bg-muted flex-shrink-0">
          {listing.images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.images[0].url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{listing.title}</h3>
              <p className="text-xl font-bold text-primary mt-1">
                ${Number(listing.price).toLocaleString()}
              </p>
            </div>

            {!isSold && !isExpired && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/listings/${listing.id}/edit`}
                  className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewCount || 0} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {listing._count.offers} offers
            </span>
            <span>
              Posted {new Date(listing.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
