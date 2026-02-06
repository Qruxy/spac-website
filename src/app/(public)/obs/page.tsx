/**
 * OBS Public Registration Page
 *
 * Public-facing page for Orange Blossom Special event information and registration.
 * Server component that fetches active OBS config and renders client components.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Sun, ArrowRight, Calendar, MapPin, Clock } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Dynamic imports for client components
const CountdownTimer = dynamic(() => import('./countdown-timer'), { ssr: false });
const OBSInfoSections = dynamic(() => import('./obs-info'), { ssr: false });
const OBSRegistrationForm = dynamic(() => import('./obs-registration-form'), { ssr: false });

// Dynamic import for Galaxy background
const Galaxy = dynamic(
  () => import('@/components/animated/galaxy').then((mod) => mod.default),
  { ssr: false }
);
const GradientText = dynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const StarBorder = dynamic(
  () => import('@/components/animated/star-border').then((mod) => mod.StarBorder),
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

export default async function OBSPage() {
  const session = await getSession();
  const activeOBS = await getActiveOBS();
  const { isMember, userInfo } = await checkUserMembership(session?.user?.id);

  if (!activeOBS) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <Sun className="w-20 h-20 text-amber-400 mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            <GradientText
              colors={['#fbbf24', '#fb923c', '#f59e0b', '#fbbf24']}
              className="text-4xl font-bold"
              animationSpeed={5}
            >
              Orange Blossom Special
            </GradientText>
          </h1>
          <p className="text-xl text-slate-400 mb-8 text-center max-w-md">
            No active OBS event at this time. Check back soon for our next star party!
          </p>
          <Link
            href="/events"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors"
          >
            View All Events
            <ArrowRight className="w-5 h-5" />
          </Link>
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
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Galaxy Background */}
        <div className="absolute inset-0">
          <Galaxy
            mouseRepulsion={true}
            mouseInteraction={true}
            density={1.2}
            glowIntensity={0.4}
            saturation={0.6}
            hueShift={30} // Warm orange hue
            transparent={false}
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />

        <div className="relative z-10 text-center px-4 py-16">
          {/* Event Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
            <Sun className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium">SPAC&apos;s Premier Star Party</span>
          </div>

          {/* Event Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
            <GradientText
              colors={['#fbbf24', '#fb923c', '#f59e0b', '#fbbf24']}
              className="text-5xl sm:text-6xl md:text-7xl font-bold"
              animationSpeed={5}
            >
              Orange Blossom
            </GradientText>
            <br />
            <span className="text-white">Special {activeOBS.year}</span>
          </h1>

          {/* Event Details */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 text-slate-300">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              {activeOBS.location}
            </span>
          </div>

          {/* Countdown Timer */}
          <div className="mb-10">
            <CountdownTimer 
              targetDate={startDate}
              label={now < startDate ? 'Event Starts In' : 'Event In Progress'}
            />
          </div>

          {/* Registration Status & CTA */}
          <div className="flex flex-col items-center gap-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              registrationStatus === 'open'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : registrationStatus === 'opens-soon'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <Clock className="w-4 h-4" />
              {registrationStatus === 'open' && 'Registration Open'}
              {registrationStatus === 'opens-soon' && `Registration Opens ${registrationOpens.toLocaleDateString()}`}
              {registrationStatus === 'closed' && 'Registration Closed'}
            </div>

            {isRegistrationOpen && (
              <StarBorder
                as="a"
                href="#register"
                color="#f59e0b"
                speed="4s"
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
              >
                Register Now
                <ArrowRight className="w-5 h-5" />
              </StarBorder>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="h-8 w-8 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Info Sections */}
      <OBSInfoSections
        location={activeOBS.location}
        startDate={startDate}
        endDate={endDate}
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
        <p className="text-slate-400 mb-4">
          Questions about OBS? Contact us at{' '}
          <a href="mailto:obs@stpeteastro.org" className="text-amber-400 hover:underline">
            obs@stpeteastro.org
          </a>
        </p>
      </section>
    </div>
  );
}
