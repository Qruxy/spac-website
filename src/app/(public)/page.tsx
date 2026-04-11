/**
 * Homepage
 *
 * Main landing page for SPAC website.
 * Uses ISR with 1-hour revalidation for upcoming events.
 *
 * PERF FIXES:
 * - Client-only sections (FeaturesSection, StatsSection) loaded with
 *   dynamic({ssr:false}) — removes them from the critical bundle, defers animation JS
 *   until after hydration so they don't compete with hero paint.
 * - Server components (MemberMediaSection) wrapped in Suspense for streaming.
 * - Events section wrapped in Suspense with skeleton so slow DB revalidation doesn't
 *   block the rest of the page.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { ArrowRight, ExternalLink, GraduationCap, Star, Users, Gem, Heart } from 'lucide-react';
import { prisma } from '@/lib/db';
import { HeroSection, HomeCtaButton } from './hero-section';
import { MemberMediaSection } from './member-media-section';
import { APODSection } from './apod-section';
import { EventCard, PastEventCard, NoEventsCard, type EventData } from './event-card';

// Client-only animation-heavy sections — deferred so they don't block hero paint
const FeaturesSection = nextDynamic(
  () => import('./features-section').then((m) => m.FeaturesSection),
  { ssr: false, loading: () => <div className="py-24" aria-hidden="true" /> }
);

const StatsSection = nextDynamic(
  () => import('./stats-section').then((m) => m.StatsSection),
  { ssr: false, loading: () => <div className="py-24" aria-hidden="true" /> }
);

export const dynamic = 'force-dynamic';

const features = [
  {
    title: 'Monthly Star Parties',
    description:
      'Join us at our dark sky site at Withlacoochee River Park for new moon observing sessions.',
    iconName: 'Moon',
    href: '/events?type=STAR_PARTY',
  },
  {
    title: 'General Meetings',
    description:
      'Learn from expert speakers and fellow astronomers at our monthly meetings.',
    iconName: 'Mic2',
    href: '/general-meetings',
  },
  {
    title: 'Orange Blossom Special',
    description:
      'Our annual multi-day star party featuring camping, observing, and community.',
    iconName: 'Star',
    href: '/obs',
  },
  {
    title: 'Mirror Lab',
    description:
      'Learn to grind your own telescope mirror with hands-on instruction from experts.',
    iconName: 'Telescope',
    href: '/mirror-lab',
  },
  {
    title: 'Public Outreach',
    description:
      'We bring the stars to schools, scout troops, and community organizations.',
    iconName: 'School',
    href: '/star-party-request',
  },
  {
    title: 'Equipment Classifieds',
    description:
      'Buy, sell, and trade astronomy equipment with fellow club members.',
    iconName: 'ShoppingBag',
    href: '/classifieds',
  },
];

const SPAC_YEARS = new Date().getFullYear() - 1927;

const stats = [
  { value: 1927, label: 'Founded', suffix: '' },
  { value: 300, label: 'Members', suffix: '+' },
  { value: 12, label: 'Events/Year', suffix: '' },
  { value: SPAC_YEARS, label: 'Years Strong', suffix: '' },
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

async function getPastEvents(): Promise<EventData[]> {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { lt: new Date(), gte: sixMonthsAgo },
      },
      orderBy: { startDate: 'desc' },
      take: 6,
      select: {
        id: true, slug: true, title: true, description: true, type: true,
        startDate: true, endDate: true, locationName: true, locationAddress: true,
        capacity: true, memberPrice: true, guest_price: true,
        _count: { select: { registrations: true } },
      },
    });
    return events.map((event) => ({
      id: event.id, slug: event.slug, title: event.title,
      description: event.description, type: event.type,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() ?? event.startDate.toISOString(),
      locationName: event.locationName, locationAddress: event.locationAddress,
      memberPrice: Number(event.memberPrice), guestPrice: Number(event.guest_price),
      spotsAvailable: null, capacity: event.capacity,
    }));
  } catch {
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

async function PastEventsSection() {
  const pastEvents = await getPastEvents();
  if (pastEvents.length === 0) return null;
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Recent Past Events</h2>
            <p className="text-sm text-muted-foreground mt-1">Hover to see details</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Full archive
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastEvents.map((event) => <PastEventCard key={event.id} event={event} />)}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  // Fetch page builder content — editable via Admin > Page Builder
  const contentRows = await prisma.siteContent.findMany({ where: { pageKey: 'home' } });
  const content: Record<string, string> = {};
  for (const row of contentRows) content[row.fieldKey] = row.value;

  // Merge DB feature descriptions into the features array (titles/icons stay fixed)
  const featureKeys = ['star_parties', 'general_meetings', 'obs', 'mirror_lab', 'outreach', 'classifieds'];
  const mergedFeatures = features.map((f, i) => ({
    ...f,
    description: content[`feature_${featureKeys[i]}_desc`] || f.description,
    title: content[`feature_${featureKeys[i]}_title`] || f.title,
  }));

  // Stats — DB overrides if set
  const mergedStats = [
    { value: parseInt(content['stat_founded'] || '1927'), label: content['stat_founded_label'] || 'Founded', suffix: '' },
    { value: parseInt(content['stat_members'] || '300'), label: content['stat_members_label'] || 'Members', suffix: content['stat_members_suffix'] !== undefined ? content['stat_members_suffix'] : '+' },
    { value: parseInt(content['stat_events_per_year'] || '12'), label: content['stat_events_label'] || 'Events/Year', suffix: '' },
    { value: parseInt(content['stat_years_strong'] || String(SPAC_YEARS)), label: content['stat_years_label'] || 'Years Strong', suffix: '' },
  ];

  // CTA text
  const ctaHeading = content['cta_heading'] || 'Ready to Explore the Universe?';
  const ctaBody = content['cta_body'] || "Whether you're a seasoned astronomer or just starting out, there's a place for you at SPAC. Join our community of stargazers today.";

  return (
    <>
      {/* Hero — above the fold, renders immediately */}
      <HeroSection />

      {/* Dark Sky Forecast — Clear Sky Chart for Withlacoochee River Park */}
      <div aria-hidden="true" className="gradient-sep" />
      <section className="bg-gradient-to-b from-transparent via-slate-950/60 to-transparent py-14 section-fade-in">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Dark Sky Forecast — Withlacoochee River Park
          </p>
          <a
            href="https://cleardarksky.com/c/WthccRPFLkey.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity w-full max-w-3xl"
            title="Withlacoochee River Park Clear Sky Chart"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.cleardarksky.com/c/WthccRPFLcsk.gif"
              alt="Withlacoochee River Park Clear Sky Chart — cloud cover, transparency, seeing, darkness forecast"
              className="rounded-lg w-full"
              width={900}
              height={108}
            />
          </a>
          <p className="text-[11px] text-muted-foreground mt-2">
            Click chart for full forecast ·{' '}
            <a
              href="https://cleardarksky.com/c/WthccRPFLkey.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              cleardarksky.com
            </a>
          </p>
        </div>
      </section>

      {/* Below-fold client components — deferred bundle, don't block hero */}
      <FeaturesSection features={mergedFeatures} />

      {/* Newsletter Cover — latest issue, links to Google Drive (right above gallery) */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Official Newsletter
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              <span className="text-white">SPAC</span><span style={{ color: '#e53e3e' }}>E</span>
              <span className="text-muted-foreground text-xl font-normal ml-3">
                St. Petersburg Astronomy Club{' '}
                <span style={{ color: '#e53e3e' }}>Examiner</span>
              </span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {content['newsletter_tagline'] || 'Our monthly newsletter — club news, observing reports, and celestial previews.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Cover photo / drive link */}
              <Link
                href={content['newsletter_drive_url'] || 'https://drive.google.com/drive/folders/0B9dsr9BUsMaYSnkxZ0E1SFBHbTQ?usp=sharing'}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 max-w-xs w-full"
              >
                {content['newsletter_cover_url'] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content['newsletter_cover_url']}
                    alt="Latest SPACE Newsletter"
                    className="w-full object-cover"
                  />
                ) : (
                  <div className="bg-card/60 border border-border/20 rounded-xl p-8 flex flex-col items-center gap-2">
                    <div className="text-5xl font-black leading-none">
                      <span className="text-white">SPAC</span><span style={{ color: '#e53e3e' }}>E</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Latest Issue on Google Drive</p>
                  </div>
                )}
                <div className="bg-card/80 px-4 py-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {content['newsletter_issue_label'] || 'Current Issue'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <ExternalLink className="h-3 w-3" />
                    Google Drive
                  </span>
                </div>
              </Link>

              <div className="text-left space-y-3 max-w-xs">
                <Link
                  href="/newsletter"
                  className="flex items-center gap-2 text-primary hover:underline font-medium text-sm"
                >
                  Browse full archive
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Published monthly by Editor Guy Earle. Members receive it directly in their inbox.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 text-sm font-medium transition-colors"
                >
                  Join to get it in your inbox
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Server component — Suspense streams it, won't block above-fold content */}
      <Suspense fallback={<div className="py-24" aria-hidden="true" />}>
        <MemberMediaSection />
      </Suspense>

      {/* NASA Astronomy Picture of the Day — 24h ISR revalidation */}
      <Suspense fallback={<div className="py-20" aria-hidden="true" />}>
        <APODSection />
      </Suspense>

      {/* Events — Suspense so slow DB revalidation shows skeleton instead of blocking */}
      <div aria-hidden="true" className="gradient-sep" />
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="section-glow">
              <h2 className="text-3xl font-bold text-foreground relative z-10">
                {content['events_heading'] || 'Upcoming Events'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {content['events_subheading'] || 'Join us for star parties, meetings, and special events'}
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

      {/* Membership Tiers — quick links below events */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Become a Member</h2>
              <p className="text-sm text-muted-foreground mt-1">Annual memberships — join today and start exploring</p>
            </div>
            <Link href="/membership" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
              See all plans
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: 'Student', price: 'Free', icon: GraduationCap, accent: 'text-emerald-400', border: 'border-emerald-500/30', tier: 'STUDENT', note: 'Valid student ID' },
              { name: 'Individual', price: '$30/yr', icon: Star, accent: 'text-blue-400', border: 'border-blue-500/30', tier: 'INDIVIDUAL', note: '1 adult + minors' },
              { name: 'Family', price: '$35/yr', icon: Users, accent: 'text-violet-400', border: 'border-violet-500/30', tier: 'FAMILY', note: '2 adults + minors' },
              { name: 'Patron', price: '$50/yr', icon: Heart, accent: 'text-rose-400', border: 'border-rose-500/30', tier: 'PATRON', note: 'All privileges' },
              { name: 'Benefactor', price: '$100/yr', icon: Gem, accent: 'text-amber-400', border: 'border-amber-500/30', tier: 'BENEFACTOR', note: 'All privileges' },
            ].map((tier) => (
              <Link
                key={tier.tier}
                href={`/register?tier=${tier.tier}`}
                className={`group flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border ${tier.border} hover:bg-card hover:scale-[1.03] transition-all duration-200 text-center`}
              >
                <tier.icon className={`h-6 w-6 ${tier.accent}`} />
                <div>
                  <p className="font-semibold text-foreground text-sm">{tier.name}</p>
                  <p className={`text-xs font-bold ${tier.accent}`}>{tier.price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.note}</p>
                </div>
                <span className={`text-xs ${tier.accent} group-hover:underline`}>Join →</span>
              </Link>
            ))}
          </div>

          <div className="sm:hidden mt-4 text-center">
            <Link href="/membership" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
              View all membership plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Past Events — greyed out, hover to reveal */}
      <Suspense fallback={null}>
        <PastEventsSection />
      </Suspense>

      <StatsSection stats={mergedStats} />

      {/* CTA */}
      <div aria-hidden="true" className="gradient-sep" />
      <section className="bg-gradient-to-b from-transparent via-primary/8 to-transparent py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            {ctaHeading}
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            {ctaBody}
          </p>
          <HomeCtaButton />
        </div>
      </section>
    </>
  );
}
