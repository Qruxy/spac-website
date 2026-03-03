/**
 * Classifieds Page
 *
 * Member marketplace for buying/selling astronomy equipment.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

import {
  ShoppingBag,
  Filter,
  Plus,
  MapPin,
  Calendar,
  Tag,
  ChevronRight,
  Telescope,
  Circle,
  Camera,
  Boxes,
  BookOpen,
  Monitor,
  Rocket,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const StarBorder = nextDynamic(
  () => import('@/components/animated/star-border').then((mod) => mod.StarBorder),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Classifieds',
  description: 'Buy, sell, and trade astronomy equipment with fellow SPAC members.',
};

// Categories
const categories = [
  { id: 'all', label: 'All Items', icon: ShoppingBag },
  { id: 'telescope', label: 'Telescopes', icon: Telescope },
  { id: 'mount', label: 'Mounts', icon: Circle },
  { id: 'eyepiece', label: 'Eyepieces', icon: Circle },
  { id: 'camera', label: 'Cameras', icon: Camera },
  { id: 'accessory', label: 'Accessories', icon: Boxes },
  { id: 'book', label: 'Books', icon: BookOpen },
  { id: 'software', label: 'Software', icon: Monitor },
];

const conditions: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'text-green-400 bg-green-500/10' },
  LIKE_NEW: { label: 'Like New', color: 'text-blue-400 bg-blue-500/10' },
  EXCELLENT: { label: 'Excellent', color: 'text-cyan-400 bg-cyan-500/10' },
  GOOD: { label: 'Good', color: 'text-yellow-400 bg-yellow-500/10' },
  FAIR: { label: 'Fair', color: 'text-orange-400 bg-orange-500/10' },
  FOR_PARTS: { label: 'For Parts', color: 'text-red-400 bg-red-500/10' },
};

async function getListings(category?: string, condition?: string) {
  try {
    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (category && category !== 'all') {
      where.category = category.toUpperCase();
    }
    if (condition) {
      where.condition = condition.toUpperCase();
    }

    return await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        seller: {
          select: { firstName: true, lastName: true },
        },
        images: {
          where: { status: 'APPROVED' },
          select: { url: true, thumbnailUrl: true },
          take: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

interface SearchParams {
  category?: string;
  condition?: string;
}

export default async function ClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/classifieds');
  }

  const params = await searchParams;
  const categoryFilter = params.category || 'all';
  const conditionFilter = params.condition;

  const listings = await getListings(categoryFilter, conditionFilter);

  const isFiltered = categoryFilter !== 'all' || !!conditionFilter;
  const isEmpty = listings.length === 0;

  return (
    <div className="py-12">
      {/* Header */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-2 flex-wrap">
              <span>Equipment</span>
              <GradientText
                colors={['#fbbf24', '#f59e0b', '#d97706', '#fbbf24']}
                className="text-4xl font-bold"
                animationSpeed={5}
              >
                Marketplace
              </GradientText>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Buy, sell, and trade astronomy equipment with fellow SPAC members.
              Members-only marketplace for trusted transactions.
            </p>
          </div>
          <StarBorder as={Link} href="/dashboard/listings/new" color="#fbbf24" speed="5s">
            <span className="flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4" />
              Post Listing
            </span>
          </StarBorder>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Categories */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.id === 'all' ? '/classifieds' : `/classifieds?category=${category.id}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        categoryFilter === category.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <category.icon className="h-4 w-4" />
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Condition Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3">Condition</h3>
                <div className="space-y-1">
                  {Object.entries(conditions).map(([key, { label }]) => (
                    <Link
                      key={key}
                      href={
                        conditionFilter === key.toLowerCase()
                          ? categoryFilter !== 'all'
                            ? `/classifieds?category=${categoryFilter}`
                            : '/classifieds'
                          : categoryFilter !== 'all'
                            ? `/classifieds?category=${categoryFilter}&condition=${key.toLowerCase()}`
                            : `/classifieds?condition=${key.toLowerCase()}`
                      }
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        conditionFilter === key.toLowerCase()
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${conditions[key].color.split(' ')[0].replace('text-', 'bg-')}`} />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {isEmpty ? (
              isFiltered ? (
                /* Filtered empty state — no results for this filter */
                <div className="text-center py-16">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">No listings found</h2>
                  <p className="text-muted-foreground mb-4">
                    Nothing matches those filters right now.
                  </p>
                  <Link href="/classifieds" className="text-primary hover:underline text-sm">
                    Clear filters
                  </Link>
                </div>
              ) : (
                /* Marketplace is truly empty — CTA to post */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl scale-150" />
                    <div className="relative p-5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <Rocket className="h-12 w-12 text-amber-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Looks like we&apos;re fresh out of gear!
                  </h2>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    The marketplace is wide open. Got a telescope collecting dust, an eyepiece
                    you never use, or a mount taking up space? This is the place.
                  </p>
                  <Link
                    href="/dashboard/listings/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-semibold text-black transition-colors shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Post the first listing
                  </Link>
                  <Link
                    href="/classifieds/sold"
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Browse past sales →
                  </Link>
                </div>
              )
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/classifieds/${listing.slug}`}
                    className="group"
                  >
                    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                      {/* Image */}
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0].thumbnailUrl || listing.images[0].url}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-slate-700" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          <span className="text-lg font-bold text-primary whitespace-nowrap">
                            ${Number(listing.price).toLocaleString()}
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
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            {listing.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.location || 'Tampa Bay, FL'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sold Items Archive */}
      <section className="container mx-auto px-4 mt-16">
        <div className="rounded-xl border border-border bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Price History</h2>
              <p className="text-sm text-muted-foreground">
                Browse sold items to research fair market prices
              </p>
            </div>
            <Link
              href="/classifieds/sold"
              className="flex items-center gap-1 text-primary hover:underline text-sm"
            >
              View sold items
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
