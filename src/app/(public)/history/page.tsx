/**
 * History/Timeline Page
 *
 * Celebrating 97 years of stargazing at SPAC.
 * Clean Apple-like design with interactive timeline.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import {
  HistoryHero,
  Timeline,
  NotableMembersSection,
  HistoricalPhotos,
} from './HistoryClient';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);
const CountUp = nextDynamic(
  () => import('@/components/animated/count-up').then((mod) => mod.CountUp),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Our History | SPAC',
  description:
    'Discover the 97-year history of the St. Petersburg Astronomy Club, founded in 1927. Explore our milestones, notable members, and astronomical achievements.',
};

const milestones = [
  {
    year: '1927',
    title: 'Club Founded',
    description:
      'The St. Petersburg Astronomy Club was founded by a small group of astronomy enthusiasts in St. Petersburg, Florida. From the beginning, the club focused on public education and amateur observation.',
    image: 'https://picsum.photos/seed/history1927/600/400',
    highlight: true,
  },
  {
    year: '1930s',
    title: 'First Telescope Projects',
    description:
      'Members began building their own telescopes, establishing a tradition of hands-on astronomy that continues to this day. The club acquired its first shared equipment.',
  },
  {
    year: '1950s',
    title: 'First Public Star Parties',
    description:
      'SPAC began hosting regular public observing sessions, sharing the wonders of the night sky with the St. Petersburg community. These events would become a cornerstone of club activity.',
    image: 'https://picsum.photos/seed/history1950/600/400',
  },
  {
    year: '1960s',
    title: 'Mirror Lab Established',
    description:
      'The club opened its telescope mirror grinding workshop, allowing members to craft their own precision optics. This program has produced hundreds of handmade mirrors over the decades.',
    image: 'https://picsum.photos/seed/history1960/600/400',
    highlight: true,
  },
  {
    year: '1970s',
    title: 'OBS Star Party Begins',
    description:
      'The Orange Blossom Special (OBS) multi-day star party was launched, bringing together amateur astronomers from across Florida for a weekend of observing, camping, and camaraderie.',
    image: 'https://picsum.photos/seed/history1970/600/400',
  },
  {
    year: '1980s',
    title: 'Outreach Program Expansion',
    description:
      'SPAC dramatically expanded its educational outreach, visiting schools, scout troops, and community organizations to share astronomy with thousands of students annually.',
  },
  {
    year: '1990s',
    title: 'Website Launched',
    description:
      'SPAC embraced the digital age by launching its first website, making club information and event schedules accessible to a wider audience.',
    image: 'https://picsum.photos/seed/history1990/600/400',
  },
  {
    year: '2000s',
    title: 'Digital Astrophotography Boom',
    description:
      'The revolution in digital imaging transformed member astrophotography. SPAC established programs to help members learn CCD and DSLR imaging techniques.',
  },
  {
    year: '2010s',
    title: 'VSA Smart Telescope Program',
    description:
      'The club launched the Very Small Array (VSA) smart telescope program, making deep-sky imaging accessible to members of all experience levels.',
    image: 'https://picsum.photos/seed/history2010/600/400',
    highlight: true,
  },
  {
    year: '2020s',
    title: 'Modern Era',
    description:
      'SPAC continues to thrive with over 300 active members, a modern website, active social media presence, and a blend of traditional observing and cutting-edge technology.',
    image: 'https://picsum.photos/seed/history2020/600/400',
  },
];

const notableMembers = [
  {
    name: 'Charter Members',
    role: 'Founders (1927)',
    description: 'The visionary amateur astronomers who gathered to form SPAC in 1927.',
    image: 'https://picsum.photos/seed/founder/400/400',
  },
  {
    name: 'Mirror Lab Masters',
    role: 'ATM Instructors',
    description: 'Generations of skilled telescope makers who passed down the art of mirror grinding.',
    image: 'https://picsum.photos/seed/atmmaster/400/400',
  },
  {
    name: 'Outreach Champions',
    role: 'Education Team',
    description: 'Dedicated volunteers who brought astronomy to thousands of students.',
    image: 'https://picsum.photos/seed/outreach/400/400',
  },
  {
    name: 'OBS Organizers',
    role: 'Event Coordinators',
    description: 'Tireless volunteers who made the Orange Blossom Special an annual tradition.',
    image: 'https://picsum.photos/seed/obs/400/400',
  },
];

const historicalPhotos = [
  { src: 'https://picsum.photos/seed/vintage1/800/600', caption: 'Early club meeting, circa 1930s', era: 'Then' as const },
  { src: 'https://picsum.photos/seed/modern1/800/600', caption: 'Modern general meeting', era: 'Now' as const },
  { src: 'https://picsum.photos/seed/vintage2/800/600', caption: 'Original mirror grinding workshop', era: 'Then' as const },
  { src: 'https://picsum.photos/seed/modern2/800/600', caption: 'Current Mirror Lab facility', era: 'Now' as const },
  { src: 'https://picsum.photos/seed/vintage3/800/600', caption: 'Early OBS star party', era: 'Then' as const },
  { src: 'https://picsum.photos/seed/modern3/800/600', caption: 'Recent OBS gathering', era: 'Now' as const },
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HistoryHero />

      {/* Intro */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-8">
              A legacy written in{' '}
              <GradientText
                colors={['#fcd34d', '#f59e0b', '#fcd34d']}
                className="text-3xl md:text-5xl font-bold"
                animationSpeed={8}
              >
                starlight
              </GradientText>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              From a small group of stargazers in 1927 to one of Florida&apos;s largest
              and most active astronomy clubs, SPAC has been connecting people with
              the cosmos for nearly a century.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Our journey through time
              </h2>
            </div>
          </FadeIn>
          <Timeline milestones={milestones} />
        </div>
      </section>

      {/* Notable Members */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Those who made us great
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Celebrating the members who shaped SPAC through the decades.
              </p>
            </div>
          </FadeIn>
          <NotableMembersSection members={notableMembers} />
        </div>
      </section>

      {/* Photo Archive */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Then &amp; now
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                See how SPAC has evolved while staying true to our mission.
              </p>
            </div>
          </FadeIn>
          <HistoricalPhotos photos={historicalPhotos} />
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <FadeIn>
              <div className="text-5xl font-bold text-foreground mb-2 tabular-nums">
                <CountUp to={1927} duration={2.5} separator="," />
              </div>
              <div className="text-muted-foreground">Year Founded</div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="text-5xl font-bold text-foreground mb-2 tabular-nums">
                <CountUp to={97} duration={2} /><span className="text-primary">+</span>
              </div>
              <div className="text-muted-foreground">Years of Stargazing</div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="text-5xl font-bold text-foreground mb-2 tabular-nums">
                <CountUp to={300} duration={2} /><span className="text-primary">+</span>
              </div>
              <div className="text-muted-foreground">Active Members</div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="text-5xl font-bold text-foreground mb-2 tabular-nums">
                <CountUp to={50} duration={2} /><span className="text-primary">+</span>
              </div>
              <div className="text-muted-foreground">OBS Events</div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Be part of our next chapter
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join the next generation of SPAC members and help us continue our
              mission of bringing astronomy to everyone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Join SPAC Today
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-lg font-medium text-foreground hover:bg-muted transition-colors"
              >
                Learn More About Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
