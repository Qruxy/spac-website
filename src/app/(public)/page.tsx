/**
 * Homepage
 *
 * Main landing page for SPAC website.
 * Uses ISR with 1-hour revalidation for upcoming events.
 *
 * PERF FIXES:
 * - Client-only sections (FeaturesSection, TestimonialsSection, StatsSection) loaded with
 *   dynamic({ssr:false}) — removes them from the critical bundle, defers animation JS
 *   until after hydration so they don't compete with hero paint.
 * - Server components (MemberMediaSection) wrapped in Suspense for streaming.
 * - Events section wrapped in Suspense with skeleton so slow DB revalidation doesn't
 *   block the rest of the page.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { HeroSection, HomeCtaButton } from './hero-section';
import { MemberMediaSection } from './member-media-section';
import { EventCard, NoEventsCard, type EventData } from './event-card';

// Client-only animation-heavy sections — deferred so they don't block hero paint
const FeaturesSection = dynamic(
  () => import('./features-section').then((m) => m.FeaturesSection),
  { ssr: false, loading: () => <div className="py-24" aria-hidden="true" /> }
);

const TestimonialsSection = dynamic(
  () => import('./testimonials-section').then((m) => m.TestimonialsSection),
  { ssr: false, loading: () => <div className="py-16" aria-hidden="true" /> }
);

const StatsSection = dynamic(
  () => import('./stats-section').then((m) => m.StatsSection),
  { ssr: false, loading: () => <div className="py-24" aria-hidden="true" /> }
);

export const revalidate = 3600;

const features = [
  {
    title: 'Monthly Star Parties',
    description:
      'Join us at our dark sky site at Withlacoochee River Park for new moon observing sessions.',
    iconName: 'Moon',
  },
  {
    title: 'General Meetings',
    description:
      'Learn from expert speakers and fellow astronomers at our monthly meetings.',
    iconName: 'Mic2',
  },
  {
    title: 'Orange Blossom Special',
    description:
      'Our annual multi-day star party featuring camping, observing, and community.',
    iconName: 'Star',
  },
  {
    title: 'Mirror Lab',
    description:
      'Learn to grind your own telescope mirror with hands-on instruction from experts.',
    iconName: 'Telescope',
  },
  {
    title: 'Public Outreach',
    description:
      'We bring the stars to schools, scout troops, and community organizations.',
    iconName: 'School',
  },
  {
    title: 'Equipment Classifieds',
    description:
      'Buy, sell, and trade astronomy equipment with fellow club members.',
    iconName: 'ShoppingBag',
  },
];

const stats = [
  { value: 1927, label: 'Founded', suffix: '' },
  { value: 300, label: 'Members', suffix: '+' },
  { value: 12, label: 'Events/Year', suffix: '' },
  { value: 97, label: 'Years Strong', suffix: '' },
];

async function getUpcomingEvents(): Promise<EventData[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        startDate: true,
        endDate: true,
        locationName: true,
        locationAddress: true,
        capacity: true,
        memberPrice: true,
        guest_price: true,
        _count: { select: { registrations: true } },
      },
    });

    return events.map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      locationName: event.locationName,
      locationAddress: event.locationAddress,
      memberPrice: Number(event.memberPrice),
      guestPrice: Number(event.guest_price),
      spotsAvailable: event.capacity ? event.capacity - event._count.registrations : null,
      capacity: event.capacity,
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    return [];
  }
}

function EventsSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-3" />
          <div className="h-6 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-full mb-4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </>
  );
}

async function UpcomingEvents() {
  const upcomingEvents = await getUpcomingEvents();
  return (
    <>
      {upcomingEvents.length > 0
        ? upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
        : <NoEventsCard />
      }
    </>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero — above the fold, renders immediately */}
      <HeroSection />

      {/* Below-fold client components — deferred bundle, don't block hero */}
      <FeaturesSection features={features} />

      {/* Server component — Suspense streams it, won't block above-fold content */}
      <Suspense fallback={<div className="py-24" aria-hidden="true" />}>
        <MemberMediaSection />
      </Suspense>

      {/* Events — Suspense so slow DB revalidation shows skeleton instead of blocking */}
      <section className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Upcoming Events</h2>
              <p className="text-muted-foreground mt-2">
                Join us for star parties, meetings, and special events
              </p>
            </div>
            <Link
              href="/events"
              className="hidden sm:flex items-center gap-1 text-primary hover:underline font-medium"
            >
              View all events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={<EventsSkeleton />}>
              <UpcomingEvents />
            </Suspense>
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              View all events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <StatsSection stats={stats} />

      {/* CTA */}
      <section className="bg-primary/5 py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Ready to Explore the Universe?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Whether you&apos;re a seasoned astronomer or just starting out,
            there&apos;s a place for you at SPAC. Join our community of stargazers
            today.
          </p>
          <HomeCtaButton />
        </div>
      </section>
    </>
  );
}
