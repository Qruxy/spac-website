/**
 * Event Detail Page
 *
 * Displays full event information and registration options.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowLeft,
  Moon,
  Tent,
  Info,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatPrice } from '@/lib/paypal/products';
import { EventRegistrationButton } from './registration-button';

// ISR with 2-minute revalidation for event updates
export const revalidate = 120;

export async function generateStaticParams() {
  return [];
}

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: event.title,
    description: event.description,
  };
}

// Generate static params for known events
export async function generateStaticParams() {
  // Skip during build if no database connection
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
      take: 20,
    });

    return events.map((event) => ({
      slug: event.slug,
    }));
  } catch {
    // Return empty array if database not available during build
    return [];
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const session = await getSession();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          registrations: {
            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
          },
        },
      },
    },
  });

  if (!event || event.status !== 'PUBLISHED') {
    notFound();
  }

  // Check if user is already registered
  let userRegistration = null;
  if (session?.user) {
    userRegistration = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        userId: session.user.id,
        status: { not: 'CANCELLED' },
      },
    });
  }

  const isMember = session?.user?.membershipStatus === 'ACTIVE';
  const registrationCount = event._count.registrations;
  const spotsLeft = event.maxAttendees ? event.maxAttendees - registrationCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isOBS = event.type === 'OBS_SESSION';

  // Determine the price to show
  const displayPrice = isMember && event.memberPrice
    ? Number(event.memberPrice)
    : event.nonMemberPrice ? Number(event.nonMemberPrice) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isOBS && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                  <Moon className="h-3 w-3" />
                  OBS Star Party
                </span>
              )}
              {event.type === 'MEETING' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
                  Meeting
                </span>
              )}
              {event.type === 'WORKSHOP' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Workshop
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {event.title}
            </h1>
          </div>

          {/* Event Image - placeholder for now */}

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              About This Event
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* OBS-specific info */}
          {isOBS && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tent className="h-5 w-5 text-purple-400" />
                OBS Star Party Information
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Orange Blossom Special (OBS) star parties are held at our dark
                  sky site and offer excellent viewing conditions away from city
                  lights.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gates open at 4:00 PM for camping setup</li>
                  <li>Observing typically begins at astronomical twilight</li>
                  <li>Bring red flashlights to preserve night vision</li>
                  <li>Camping is available with registration</li>
                  <li>Restroom facilities on site</li>
                </ul>
              </div>
            </div>
          )}

          {/* What to bring */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              What to Bring
            </h3>
            <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Telescope or binoculars (optional)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Red flashlight
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Warm clothing / layers
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lawn chair or blanket
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Snacks and water
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Bug spray (seasonal)
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar - Registration */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {event.endDate && event.endDate !== event.startDate && (
                    <p className="text-sm text-muted-foreground">
                      to{' '}
                      {new Date(event.endDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-foreground">
                  {new Date(event.startDate).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {event.endDate && (
                    <>
                      {' - '}
                      {new Date(event.endDate).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                </p>
              </div>

              {event.locationName && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-foreground">{event.locationName}</p>
                </div>
              )}
            </div>

            {/* Capacity */}
            {event.maxAttendees && (
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Capacity</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {registrationCount} / {event.maxAttendees}
                  </p>
                  {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
                    <p className="text-xs text-orange-400">
                      Only {spotsLeft} spots left!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="py-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Price</span>
                </div>
                <div className="text-right">
                  {displayPrice && displayPrice > 0 ? (
                    <>
                      <p className="font-bold text-xl text-foreground">
                        {formatPrice(displayPrice)}
                      </p>
                      {isMember && event.memberPrice && event.nonMemberPrice && Number(event.memberPrice) < Number(event.nonMemberPrice) && (
                        <p className="text-xs text-green-400">
                          Member discount applied!
                        </p>
                      )}
                      {!isMember && event.memberPrice && (
                        <p className="text-xs text-muted-foreground">
                          Members pay {formatPrice(Number(event.memberPrice))}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-bold text-xl text-green-400">Free</p>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Button */}
            <EventRegistrationButton
              eventId={event.id}
              eventSlug={event.slug}
              isFree={!displayPrice || displayPrice === 0}
              isFull={isFull}
              isRegistered={!!userRegistration}
              registrationStatus={userRegistration?.status}
              isLoggedIn={!!session?.user}
            />

            {/* Additional Info */}
            {!session?.user && (
              <p className="text-xs text-center text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{' '}
                or{' '}
                <Link href="/register" className="text-primary hover:underline">
                  create an account
                </Link>{' '}
                to register for events
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
