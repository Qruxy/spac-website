/**
 * Donations Page
 *
 * Support the St. Pete Astronomy Club through tax-deductible donations.
 * Features Apple-like design with animated components.
 */

import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { Heart, Star, Award, Sparkles, Quote, Telescope, Users, Calendar } from 'lucide-react';
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

// Note: Icons are mapped in the client component (donation-form.tsx) by name
// to avoid passing functions across the server/client boundary
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">501(c)(3) Tax Deductible</span>
              </div>

              {/* Main Heading - Client component for animation */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Help Us Bring the{' '}
                <GradientText
                  colors={['#a78bfa', '#c084fc', '#f472b6', '#a78bfa']}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold"
                  animationSpeed={6}
                >
                  Universe
                </GradientText>
                {' '}to Everyone
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Your donation supports public outreach programs, telescope maintenance, and our historic mirror lab—keeping astronomy accessible for nearly a century.
              </p>
            </FadeIn>

            {/* Quick stat highlights */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>300+ Members Strong</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>50+ Annual Public Events</span>
              </div>
              <div className="flex items-center gap-2">
                <Telescope className="h-4 w-4 text-primary" />
                <span>12 Telescopes Maintained</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <ImpactStats />

      {/* Donation Form Section */}
      <section id="donate" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <DonationForm tiers={donationTiers} />
          </div>
        </div>
      </section>

      {/* Member Quote Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl text-foreground italic mb-6 leading-relaxed">
                &ldquo;Being part of SPAC has opened up a whole new universe for me—literally.
                The mentorship, the friendships, and the shared wonder of looking up at the stars
                together... it&apos;s transformed how I see our place in the cosmos.&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-border" />
                <p className="text-muted-foreground font-medium">— SPAC Member since 2018</p>
                <div className="h-px w-12 bg-border" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What Your Donation Supports */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Where Your Donation Goes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every dollar directly supports our mission of making astronomy accessible to all.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FadeIn delay={0}>
              <div className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full">
                <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Telescope className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Equipment & Maintenance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Maintain our fleet of telescopes, upgrade equipment, and keep our historic mirror lab operational for hands-on learning.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full">
                <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Public Outreach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bring the wonders of the night sky to schools, scout troops, libraries, and community events throughout Tampa Bay.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full">
                <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Star className="h-7 w-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Special Programs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fund star parties, educational workshops, guest speakers, and our annual Orange Blossom Special event.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Tax Info Section */}
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border border-border bg-card/50 backdrop-blur p-8 md:p-12">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Tax Deductible Donations
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      The St. Petersburg Astronomy Club, Inc. is a 501(c)(3) non-profit organization.
                      Your donation is tax-deductible to the fullest extent allowed by law.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>EIN:</strong> 59-1544461 • You will receive a receipt for your records upon donation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
