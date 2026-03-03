/**
 * Classifieds Sold History Page
 *
 * Browse sold items to research fair market prices.
 * Members-only. Shows SOLD listings in reverse chronological order.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Search,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sold Listings — Price History',
  description: 'Browse past sales to research fair market prices for astronomy equipment.',
};

const conditions: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'text-green-400 bg-green-500/10' },
  LIKE_NEW: { label: 'Like New', color: 'text-blue-400 bg-blue-500/10' },
  EXCELLENT: { label: 'Excellent', color: 'text-cyan-400 bg-cyan-500/10' },
  GOOD: { label: 'Good', color: 'text-yellow-400 bg-yellow-500/10' },
  FAIR: { label: 'Fair', color: 'text-orange-400 bg-orange-500/10' },
  FOR_PARTS: { label: 'For Parts', color: 'text-red-400 bg-red-500/10' },
};

interface SearchParams {
  q?: string;
  page?: string;
}

async function getSoldListings(query?: string, page = 1) {
  const limit = 24;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'SOLD' };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
      include: {
        images: {
          where: { status: 'APPROVED' },
          select: { url: true, thumbnailUrl: true },
          take: 1,
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, pages: Math.ceil(total / limit) };
}

export default async function SoldListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/classifieds/sold');
  }

  const params = await searchParams;
  const query = params.q;
  const page = parseInt(params.page || '1');

  const { listings, total, pages } = await getSoldListings(query, page);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/classifieds"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingDown className="h-7 w-7 text-primary" />
                Price History
              </h1>
              <p className="text-muted-foreground mt-1">
                {total} sold item{total !== 1 ? 's' : ''} — use this to research fair market prices
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <form method="GET" className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search sold listings…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        {/* Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {query ? 'No sold listings match that search' : 'No sold listings yet'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {query ? (
                <Link href="/classifieds/sold" className="text-primary hover:underline">Clear search</Link>
              ) : (
                'Completed sales will appear here once members start selling.'
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-xl border border-border bg-card overflow-hidden opacity-90"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {listing.images?.[0] ? (
                      <Image
                        src={listing.images[0].thumbnailUrl || listing.images[0].url}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover grayscale-[20%]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <ShoppingBag className="h-10 w-10 text-slate-700" />
                      </div>
                    )}
                    {/* Sold badge */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow">
                        <CheckCircle2 className="h-3 w-3" />
                        Sold
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {listing.title}
                      </h3>
                      <span className="text-lg font-bold text-foreground whitespace-nowrap">
                        ${Number(listing.askingPrice).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        conditions[listing.condition]?.color || 'text-muted-foreground bg-muted'
                      }`}>
                        {conditions[listing.condition]?.label || listing.condition}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {listing.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      {listing.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Calendar className="h-3 w-3" />
                        Sold {formatDistanceToNow(new Date(listing.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/classifieds/sold?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {pages}
                </span>
                {page < pages && (
                  <Link
                    href={`/classifieds/sold?${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page + 1}`}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
