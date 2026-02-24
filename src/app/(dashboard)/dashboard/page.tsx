/**
 * Member Dashboard
 *
 * Overview page for authenticated members showing real data:
 * - Membership status
 * - Upcoming registered events (from DB)
 * - Active listings (from DB)
 * - Photo submission count (from DB)
 * - Quick actions
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Calendar,
  ShoppingBag,
  Image,
  ArrowRight,
  QrCode,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your SPAC member dashboard',
};

export default async function DashboardPage() {
  const session = await getSession();
  const user = session!.user;

  const firstName = user.name?.split(' ')[0] || 'Member';
  const membershipActive = user.membershipStatus === 'ACTIVE';

  // Real data queries — all scoped to this user
  const now = new Date();

  const [upcomingRegistrations, activeListings, photoCount, userProfile] = await Promise.all([
    // Events the user is registered for that haven't happened yet
    prisma.registration.findMany({
      where: {
        userId: user.id,
        status: { in: ['CONFIRMED', 'PENDING', 'WAITLISTED'] },
        event: { startDate: { gte: now }, status: 'PUBLISHED' },
      },
      include: {
        event: {
          select: { title: true, startDate: true, locationName: true },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
      take: 3,
    }),
    // User's active listings
    prisma.listing.findMany({
      where: { sellerId: user.id, status: 'ACTIVE' },
      select: {
        title: true,
        price: true,
        viewCount: true,
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    // Approved photo submissions
    prisma.media.count({
      where: {
        uploaded_by_id: user.id,
        status: 'APPROVED',
        type: 'IMAGE',
        listingId: null,
      },
    }),
    // Account creation date for "years active"
    prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true },
    }),
  ]);

  // Years as member (based on account creation date)
  const joinYear = new Date(userProfile?.createdAt ?? now).getFullYear();
  const yearsActive = Math.max(1, now.getFullYear() - joinYear);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your SPAC membership.
        </p>
      </div>

      {/* Membership Status Card */}
      <div
        className={`rounded-xl border p-6 mb-8 ${
          membershipActive
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-orange-500/50 bg-orange-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-full p-3 ${
                membershipActive ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}
            >
              {membershipActive ? (
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {user.membershipType || 'Free'} Membership
              </h2>
              <p
                className={`text-sm ${
                  membershipActive ? 'text-green-400' : 'text-orange-400'
                }`}
              >
                {membershipActive ? 'Active' : 'Expired or Pending'}
              </p>
              {membershipActive && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews automatically
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/membership-card"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <QrCode className="h-4 w-4" />
              View Card
            </Link>
            {!membershipActive && (
              <Link
                href="/billing"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Upgrade
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <QuickStatCard
          title="Upcoming Events"
          value={String(upcomingRegistrations.length)}
          icon={Calendar}
          href="/my-events"
          color="text-blue-400"
        />
        <QuickStatCard
          title="Active Listings"
          value={String(activeListings.length)}
          icon={ShoppingBag}
          href="/my-listings"
          color="text-green-400"
        />
        <QuickStatCard
          title="Photos Submitted"
          value={String(photoCount)}
          icon={Image}
          href="/my-photos"
          color="text-purple-400"
        />
        <QuickStatCard
          title="Years Active"
          value={String(yearsActive)}
          icon={Star}
          href="/profile"
          color="text-yellow-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Upcoming Events</h2>
            <Link href="/my-events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {upcomingRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming events.{' '}
                <Link href="/events" className="text-primary hover:underline">
                  Browse events →
                </Link>
              </p>
            ) : (
              upcomingRegistrations.map((reg) => (
                <EventItem
                  key={reg.id}
                  title={reg.event.title}
                  date={new Date(reg.event.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  time={new Date(reg.event.startDate).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  status={reg.status as 'CONFIRMED' | 'PENDING' | 'WAITLISTED'}
                />
              ))
            )}
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Browse more events
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Active Listings */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Active Listings</h2>
            <Link href="/my-listings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {activeListings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active listings.{' '}
                <Link href="/dashboard/listings/new" className="text-primary hover:underline">
                  Post one →
                </Link>
              </p>
            ) : (
              activeListings.map((listing, i) => (
                <ListingItem
                  key={i}
                  title={listing.title}
                  price={Number(listing.price)}
                  views={listing.viewCount}
                  inquiries={listing._count.offers}
                />
              ))
            )}
            <div className="pt-2">
              <Link
                href="/dashboard/listings/new"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Post a new listing
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Register for Event"
            description="Sign up for upcoming star parties and meetings"
            href="/events"
            icon={Calendar}
          />
          <QuickActionCard
            title="Post a Listing"
            description="Sell your astronomy equipment"
            href="/dashboard/listings/new"
            icon={ShoppingBag}
          />
          <QuickActionCard
            title="Submit Photo"
            description="Share your astrophotography"
            href="/dashboard/gallery/submit"
            icon={Image}
          />
          <QuickActionCard
            title="Manage Subscription"
            description="Update payment methods or plan"
            href="/billing"
            icon={Star}
          />
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{title}</p>
    </Link>
  );
}

const statusStyles = {
  CONFIRMED: 'text-green-400 bg-green-500/10',
  PENDING: 'text-yellow-400 bg-yellow-500/10',
  WAITLISTED: 'text-orange-400 bg-orange-500/10',
};

function EventItem({
  title,
  date,
  time,
  status,
}: {
  title: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING' | 'WAITLISTED';
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {date} at {time}
        </p>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[status]}`}>
        {status.toLowerCase()}
      </span>
    </div>
  );
}

function ListingItem({
  title,
  price,
  views,
  inquiries,
}: {
  title: string;
  price: number;
  views: number;
  inquiries: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
          ${price.toLocaleString()} &middot; {views} views &middot; {inquiries} inquiries
        </p>
      </div>
      <span className="text-xs font-medium px-2 py-1 rounded-full text-green-400 bg-green-500/10">
        Active
      </span>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/50 transition-all group"
    >
      <Icon className="h-8 w-8 text-primary mb-3" />
      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
