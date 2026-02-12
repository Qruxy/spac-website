/**
 * OBS Public Registration Page
 *
 * Public-facing page for Orange Blossom Special event information and registration.
 * Server component that fetches active OBS config and renders client components.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { ArrowRight, Calendar, MapPin, Clock } from 'lucide-react';
import obsLogo from '../../../../public/images/obs-logo.png';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CountdownTimer = nextDynamic(() => import('./countdown-timer'), { ssr: false });
const OBSInfoSections = nextDynamic(() => import('./obs-info'), { ssr: false });
const OBSRegistrationForm = nextDynamic(() => import('./obs-registration-form'), { ssr: false });

const Galaxy = nextDynamic(
  () => import('@/components/animated/galaxy').then((mod) => mod.default),
  { ssr: false }
);
const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Orange Blossom Special | SPAC',
  description: 'Join SPAC for the annual Orange Blossom Special - Florida\'s premier multi-day star party with dark skies, expert speakers, and fellow astronomers.',
  openGraph: {
    title: 'Orange Blossom Special - SPAC Star Party',
    description: 'Florida\'s premier multi-day star party. Dark skies, expert speakers, and celestial wonders await.',
    type: 'website',
  },
};

async function getActiveOBS() {
  return prisma.oBSConfig.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });
}

async function checkUserMembership(userId: string | undefined) {
  if (!userId) return { isMember: false, userInfo: undefined };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!user) return { isMember: false, userInfo: undefined };

  const isMember = user.membership?.status === 'ACTIVE';

  return {
    isMember,
    userInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || undefined,
    },
  };
}

function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    // "February 14–16, 2025"
    const month = start.toLocaleDateString('en-US', { month: 'long' });
    return `${month} ${start.getDate()}\u2013${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    // "February 14 – March 2, 2025"
    const startStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `${startStr} \u2013 ${endStr}, ${end.getFullYear()}`;
  }
  // "December 30, 2025 – January 2, 2026"
  const startStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${startStr} \u2013 ${endStr}`;
}

export default async function OBSPage() {
  const session = await getSession();
  const activeOBS = await getActiveOBS();
  const { isMember, userInfo } = await checkUserMembership(session?.user?.id);

  if (!activeOBS) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <FadeIn>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground text-center mb-6 tracking-tight">
              <GradientText
                colors={['#fbbf24', '#fb923c', '#fbbf24']}
                className="text-5xl md:text-7xl font-bold"
                animationSpeed={6}
              >
                Orange Blossom Special
              </GradientText>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 text-center max-w-md">
              No active OBS event at this time. Check back soon for our next star party.
            </p>
            <div className="text-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View All Events
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  const startDate = new Date(activeOBS.startDate);
  const endDate = new Date(activeOBS.endDate);
  const registrationOpens = new Date(activeOBS.registrationOpens);
  const registrationCloses = new Date(activeOBS.registrationCloses);
  const now = new Date();

  const isRegistrationOpen = now >= registrationOpens && now <= registrationCloses;
  const registrationStatus = now < registrationOpens
    ? 'opens-soon'
    : now > registrationCloses
    ? 'closed'
    : 'open';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Galaxy
            mouseRepulsion={true}
            mouseInteraction={true}
            density={1.2}
            glowIntensity={0.4}
            saturation={0.6}
            hueShift={30}
            transparent={false}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />

        <div className="relative z-10 text-center px-4 py-16 max-w-4xl mx-auto">
          <FadeIn>
            <div className="mb-6 flex justify-center">
              <Image
                src={obsLogo}
                alt="Orange Blossom Special"
                width={220}
                height={220}
                className="drop-shadow-2xl"
                priority
              />
            </div>
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight">
              <GradientText
                colors={['#fbbf24', '#fb923c', '#fbbf24']}
                className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold"
                animationSpeed={6}
              >
                Orange Blossom
              </GradientText>
              <br />
              <span className="text-white">Special {activeOBS.year}</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-slate-300">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                {formatDateRange(startDate, endDate)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                {activeOBS.location}
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="mt-10">
              <CountdownTimer
                targetDate={startDate}
                label={now < startDate ? 'Event Starts In' : 'Event In Progress'}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="flex flex-col items-center gap-4 mt-10">
              <p className="text-sm text-slate-400">
                {registrationStatus === 'open' && 'Registration Open'}
                {registrationStatus === 'opens-soon' && `Registration opens ${registrationOpens.toLocaleDateString()}`}
                {registrationStatus === 'closed' && 'Registration Closed'}
              </p>

              {isRegistrationOpen && (
                <a
                  href="#register"
                  className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 rounded-full px-8 py-4 text-lg font-semibold hover:bg-amber-400 transition-colors"
                >
                  Register Now
                  <ArrowRight className="w-5 h-5" />
                </a>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Info Sections */}
      <OBSInfoSections
        location={activeOBS.location}
        startDate={startDate}
        endDate={endDate}
        description={activeOBS.description}
        scheduleData={activeOBS.scheduleData as Record<string, unknown>[] | null}
        whatToBring={activeOBS.whatToBring as Record<string, unknown>[] | null}
        locationInfo={activeOBS.locationInfo as Record<string, string> | null}
        statsData={activeOBS.statsData as Record<string, unknown>[] | null}
      />

      {/* Registration Form */}
      <OBSRegistrationForm
        config={{
          id: activeOBS.id,
          year: activeOBS.year,
          eventName: activeOBS.eventName,
          startDate: activeOBS.startDate.toISOString(),
          endDate: activeOBS.endDate.toISOString(),
          registrationOpens: activeOBS.registrationOpens.toISOString(),
          registrationCloses: activeOBS.registrationCloses.toISOString(),
          earlyBirdDeadline: activeOBS.earlyBirdDeadline?.toISOString() || null,
          location: activeOBS.location,
          memberPrice: Number(activeOBS.memberPrice),
          nonMemberPrice: Number(activeOBS.nonMemberPrice),
          earlyBirdDiscount: Number(activeOBS.earlyBirdDiscount),
          campingPrice: Number(activeOBS.campingPrice),
          mealPrice: Number(activeOBS.mealPrice),
          capacity: activeOBS.capacity,
        }}
        isMember={isMember}
        isLoggedIn={!!session}
        userInfo={userInfo}
        registrationCount={activeOBS._count.registrations}
      />

      {/* Footer CTA */}
      <section className="py-16 px-4 text-center">
        <p className="text-slate-400">
          Questions about OBS? Contact us at{' '}
          <a href="mailto:obs@stpeteastro.org" className="text-amber-400 hover:underline">
            obs@stpeteastro.org
          </a>
        </p>
      </section>
    </div>
  );
}
