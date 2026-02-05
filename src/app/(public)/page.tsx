/**
 * Homepage
 *
 * Main landing page for SPAC website.
 * Uses ISR with 1-hour revalidation for upcoming events.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { HeroSection } from './hero-section';
import { StatsSection } from './stats-section';
import { FeaturesSection } from './features-section';
import { MemberMediaSection } from './member-media-section';
import { TestimonialsSection } from './testimonials-section';
import { EventCard, NoEventsCard, type EventData } from './event-card';

export const revalidate = 3600; // Revalidate every hour

// Features data - iconName must match keys in FeaturesSection iconMap
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

// Fetch upcoming events from the database
async function getUpcomingEvents(): Promise<EventData[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          gte: new Date(), // Only future events
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6, // Limit to next 6 events
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
      locationAddress: event.locationAddress,
      memberPrice: Number(event.memberPrice),
      guestPrice: Number(event.guest_price),
      spotsAvailable: event.capacity
        ? event.capacity - event._count.registrations
        : null,
      capacity: event.capacity,
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    return [];
  }
}

export default async function HomePage() {
  const upcomingEvents = await getUpcomingEvents();

  return (
    <>
      {/* Hero Section with Star Field */}
      <HeroSection />

      {/* Features Section with Animations */}
      <FeaturesSection features={features} />

      {/* Member Media Section with BounceCards */}
      <MemberMediaSection />

      {/* Upcoming Events Preview */}
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

          {/* Event Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <NoEventsCard />
            )}
          </div>

          {/* Mobile View All Link */}
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Stats Section with Animated Counters */}
      <StatsSection stats={stats} />

      {/* CTA Section */}
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
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Become a Member
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
