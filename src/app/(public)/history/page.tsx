/**
 * History/Timeline Page
 *
 * Celebrating 97 years of stargazing at SPAC.
 * Interactive timeline with key milestones.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, History, Star, Users } from 'lucide-react';
import {
  HistoryHero,
  Timeline,
  NotableMembersSection,
  HistoricalPhotos,
} from './HistoryClient';

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
      'SPAC embraced the digital age by launching its first website, making club information and event schedules accessible to a wider audience. Email newsletters began supplementing print communications.',
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
      'The club launched the Very Small Array (VSA) smart telescope program, making deep-sky imaging accessible to members of all experience levels through automated telescope systems.',
    image: 'https://picsum.photos/seed/history2010/600/400',
    highlight: true,
  },
  {
    year: '2020s',
    title: 'Modern Era',
    description:
      'SPAC continues to thrive with over 300 active members, a modern website, active social media presence, and a blend of traditional observing and cutting-edge technology. The future is bright!',
    image: 'https://picsum.photos/seed/history2020/600/400',
  },
];

const notableMembers = [
  {
    name: 'Charter Members',
    role: 'Founders (1927)',
    description:
      'The visionary amateur astronomers who gathered to form SPAC in 1927, establishing a legacy that continues today.',
    image: 'https://picsum.photos/seed/founder/400/400',
  },
  {
    name: 'Mirror Lab Masters',
    role: 'ATM Instructors',
    description:
      'Generations of skilled telescope makers who have passed down the art of mirror grinding to hundreds of members.',
    image: 'https://picsum.photos/seed/atmmaster/400/400',
  },
  {
    name: 'Outreach Champions',
    role: 'Education Team',
    description:
      'Dedicated volunteers who have brought the wonder of astronomy to thousands of students and community members.',
    image: 'https://picsum.photos/seed/outreach/400/400',
  },
  {
    name: 'OBS Organizers',
    role: 'Event Coordinators',
    description:
      'The tireless volunteers who have made the Orange Blossom Special a beloved annual tradition for over 50 years.',
    image: 'https://picsum.photos/seed/obs/400/400',
  },
];

const historicalPhotos = [
  {
    src: 'https://picsum.photos/seed/vintage1/800/600',
    caption: 'Early club meeting, circa 1930s',
    era: 'Then',
  },
  {
    src: 'https://picsum.photos/seed/modern1/800/600',
    caption: 'Modern general meeting',
    era: 'Now',
  },
  {
    src: 'https://picsum.photos/seed/vintage2/800/600',
    caption: 'Original mirror grinding workshop',
    era: 'Then',
  },
  {
    src: 'https://picsum.photos/seed/modern2/800/600',
    caption: 'Current Mirror Lab facility',
    era: 'Now',
  },
  {
    src: 'https://picsum.photos/seed/vintage3/800/600',
    caption: 'Early OBS star party',
    era: 'Then',
  },
  {
    src: 'https://picsum.photos/seed/modern3/800/600',
    caption: 'Recent OBS gathering',
    era: 'Now',
  },
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HistoryHero />

      {/* Brief Intro */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <History className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Our Story
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            A Legacy Written in Starlight
          </h2>
          <p className="text-xl text-muted-foreground">
            From a small group of stargazers in 1927 to one of Florida&apos;s largest
            and most active astronomy clubs, SPAC has been connecting people with
            the cosmos for nearly a century. Our history is a testament to the
            enduring human fascination with the night sky.
          </p>
        </div>
      </section>

      {/* Interactive Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Journey Through Time
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Key moments that shaped the St. Petersburg Astronomy Club.
            </p>
          </div>

          <Timeline milestones={milestones} />
        </div>
      </section>

      {/* Notable Members Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Honoring Our Legacy
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Those Who Made Us Great
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Celebrating the members who have shaped SPAC through the decades.
            </p>
          </div>

          <NotableMembersSection members={notableMembers} />
        </div>
      </section>

      {/* Photo Archive - Then vs Now */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Photo Archive
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Then & Now
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how SPAC has evolved while staying true to our mission.
            </p>
          </div>

          <HistoricalPhotos photos={historicalPhotos} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">1927</div>
              <div className="text-muted-foreground">Year Founded</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">97+</div>
              <div className="text-muted-foreground">Years of Stargazing</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">300+</div>
              <div className="text-muted-foreground">Active Members</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">OBS Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Be Part of Our Next Chapter
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the next generation of SPAC members and help us continue our
            mission of bringing astronomy to everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
            >
              Join SPAC Today
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-8 py-4 text-lg font-semibold text-foreground transition-all hover:bg-muted"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
