/**
 * Donations Page
 *
 * Support the St. Pete Astronomy Club through tax-deductible donations.
 * Clean, Apple-inspired design with emotional appeal.
 */

import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { Telescope, Users, Star, Award, ArrowRight } from 'lucide-react';
import { DonationForm } from './donation-form';
import { ImpactStats } from './impact-stats';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Support Us | Donate',
  description:
    'Support the St. Pete Astronomy Club with a tax-deductible donation. Your contribution helps fund public outreach, telescope maintenance, and our mirror lab.',
};

const donationTiers = [
  {
    id: 'supporter',
    name: 'Supporter',
    amount: 25,
    iconName: 'Heart' as const,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    benefits: ['Recognition in our monthly newsletter'],
    description: 'Help us keep the stars accessible',
  },
  {
    id: 'patron',
    name: 'Patron',
    amount: 100,
    iconName: 'Star' as const,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    benefits: [
      'Recognition in our monthly newsletter',
      'Name displayed on website donor wall',
    ],
    description: 'Illuminate our mission',
  },
  {
    id: 'benefactor',
    name: 'Benefactor',
    amount: 500,
    iconName: 'Award' as const,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    benefits: [
      'Recognition in our monthly newsletter',
      'Name displayed on website donor wall',
      'Invitations to special member events',
      'Personal thank you from the Board',
    ],
    description: 'Champion our celestial journey',
  },
];

export default function DonationsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[0.95]">
                Help us bring the{' '}
                <GradientText
                  colors={['#a78bfa', '#c084fc', '#a78bfa']}
                  className="text-5xl md:text-7xl lg:text-8xl font-bold"
                  animationSpeed={8}
                >
                  universe
                </GradientText>
                {' '}to everyone
              </h1>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Your tax-deductible donation supports public outreach, telescope maintenance, and our
                historic mirror lab\u2014keeping astronomy accessible for nearly a century.
              </p>
            </FadeIn>
            <FadeIn delay={0.25}>
              <p className="mt-4 text-sm text-muted-foreground/70">
                501(c)(3) Non-Profit &middot; EIN: 59-1544461
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <ImpactStats />

      {/* Donation Form */}
      <section id="donate" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <DonationForm tiers={donationTiers} />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="text-2xl md:text-3xl text-foreground font-light italic leading-relaxed">
                &ldquo;Being part of SPAC has opened up a whole new universe for me\u2014literally.
                The mentorship, the friendships, and the shared wonder of looking up at the stars
                together... it&apos;s transformed how I see our place in the cosmos.&rdquo;
              </blockquote>
              <p className="mt-8 text-muted-foreground">
                \u2014 SPAC Member since 2018
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Where Your Donation Goes */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Where your donation goes
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Every dollar directly supports our mission of making astronomy accessible to all.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FadeIn delay={0}>
              <div className="rounded-2xl bg-card/50 p-8 hover:bg-card transition-colors duration-300 h-full">
                <Telescope className="h-8 w-8 text-primary mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Equipment &amp; Maintenance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Maintain our fleet of telescopes, upgrade equipment, and keep our historic mirror lab
                  operational for hands-on learning.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-2xl bg-card/50 p-8 hover:bg-card transition-colors duration-300 h-full">
                <Users className="h-8 w-8 text-primary mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Public Outreach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bring the wonders of the night sky to schools, scout troops, libraries, and community
                  events throughout Tampa Bay.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl bg-card/50 p-8 hover:bg-card transition-colors duration-300 h-full">
                <Star className="h-8 w-8 text-primary mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Special Programs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fund star parties, educational workshops, guest speakers, and our annual Orange Blossom
                  Special event.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Tax Info */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start gap-6">
                <Award className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Tax-Deductible Donations
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    The St. Petersburg Astronomy Club, Inc. is a 501(c)(3) non-profit organization.
                    Your donation is tax-deductible to the fullest extent allowed by law.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    EIN: 59-1544461 &middot; You will receive a receipt for your records upon donation.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
