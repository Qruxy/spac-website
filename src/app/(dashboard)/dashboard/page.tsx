/**
 * Member Dashboard
 *
 * Overview page for authenticated members showing:
 * - Membership status
 * - Upcoming registered events
 * - Active listings
 * - Quick actions
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
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
          value="2"
          icon={Calendar}
          href="/my-events"
          color="text-blue-400"
        />
        <QuickStatCard
          title="Active Listings"
          value="1"
          icon={ShoppingBag}
          href="/my-listings"
          color="text-green-400"
        />
        <QuickStatCard
          title="Photos Submitted"
          value="5"
          icon={Image}
          href="/my-photos"
          color="text-purple-400"
        />
        <QuickStatCard
          title="Years Member"
          value="3"
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
            <Link
              href="/my-events"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="p-4 space-y-4">
            <EventItem
              title="New Moon Star Party"
              date="December 7, 2024"
              time="6:00 PM"
              status="confirmed"
            />
            <EventItem
              title="December General Meeting"
              date="December 13, 2024"
              time="7:30 PM"
              status="confirmed"
            />
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
            <Link
              href="/my-listings"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="p-4 space-y-4">
            <ListingItem
              title="Celestron NexStar 6SE"
              price={950}
              views={23}
              inquiries={3}
            />
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
            title="Upload Photo"
            description="Share your astrophotography"
            href="/dashboard/upload"
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

function EventItem({
  title,
  date,
  time,
  status,
}: {
  title: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'waitlisted';
}) {
  const statusStyles = {
    confirmed: 'text-green-400 bg-green-500/10',
    pending: 'text-yellow-400 bg-yellow-500/10',
    waitlisted: 'text-orange-400 bg-orange-500/10',
  };

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {date} at {time}
        </p>
      </div>
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[status]}`}
      >
        {status}
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
          ${price.toLocaleString()} &middot; {views} views &middot; {inquiries}{' '}
          inquiries
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
