/**
 * Events Page
 *
 * Lists upcoming events with filtering and calendar view.
 * Uses ISR for static generation with 1-hour revalidation.
 * Enhanced with React Bits animated components.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import EventsView from '@/components/events/EventsView';

// Dynamic import for animated component
const RotatingText = nextDynamic(
  () => import('@/components/animated/rotating-text').then((mod) => mod.RotatingText),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Join SPAC for star parties, monthly meetings, workshops, and special astronomy events in Tampa Bay.',
};

export const revalidate = 3600; // Revalidate every hour

interface SearchParams {
  type?: string;
}

async function getPublishedEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Include events from today
        },
      },
      orderBy: { startDate: 'asc' },
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
        campingAvailable: true,
        camping_price: true,
        _count: {
          select: { registrations: true },
        },
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
      memberPrice: Number(event.memberPrice),
      guestPrice: Number(event.guest_price),
      spotsAvailable: event.capacity
        ? event.capacity - event._count.registrations
        : null,
      capacity: event.capacity,
    }));
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const events = await getPublishedEvents();
  const typeFilter = searchParams.type || 'all';

  return (
    <div className="py-12">
      {/* Header */}
      <section className="container mx-auto px-4 mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3 flex-wrap">
          <span>Upcoming</span>
          <RotatingText
            texts={['Star Parties', 'Meetings', 'Workshops', 'Outreach', 'Events']}
            mainClassName="text-primary overflow-hidden h-[1.2em]"
            staggerFrom="last"
            staggerDuration={0.025}
            rotationInterval={3000}
          />
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          From monthly star parties to our annual Orange Blossom Special, find
          upcoming events and register to join us under the stars.
        </p>
      </section>

      {/* Events View (Client Component with List/Calendar toggle) */}
      <EventsView events={events} initialType={typeFilter} />

      {/* Past Events Link */}
      <section className="container mx-auto px-4 mt-12 text-center">
        <Link
          href="/events/archive"
          className="text-primary hover:underline"
        >
          View past events archive
        </Link>
      </section>
    </div>
  );
}
