/**
 * Membership Benefits Page
 * 
 * Detailed information about SPAC membership tiers and benefits.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Star, Users, GraduationCap, Telescope, Calendar, Camera, BookOpen, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Membership Benefits',
  description: 'Explore SPAC membership tiers and benefits. Join Tampa Bay\'s oldest astronomy club.',
};

const membershipTiers = [
  {
    name: 'Individual',
    price: '$40',
    period: '/year',
    description: 'Full club benefits for one person',
    icon: Star,
    features: [
      'Monthly meetings & newsletter',
      'OBS star party access',
      'Borrow club equipment',
      'Vote on club matters',
      'Member-only events',
      'Discounts on merchandise',
      'Post in classifieds',
    ],
    popular: true,
  },
  {
    name: 'Family',
    price: '$60',
    period: '/year',
    description: 'For the whole household (up to 5 members)',
    icon: Users,
    features: [
      'All individual member benefits',
      'Up to 5 family members included',
      'Youth programs access',
      'Family discount on events',
      'Priority registration for workshops',
    ],
    popular: false,
  },
  {
    name: 'Student',
    price: '$20',
    period: '/year',
    description: 'Discounted rate for enrolled students',
    icon: GraduationCap,
    features: [
      'All individual member benefits',
      'Valid student ID required',
      'Special student events',
      'Mentorship opportunities',
    ],
    popular: false,
  },
];

const benefits = [
  {
    icon: Telescope,
    title: 'Equipment Access',
    description: 'Borrow telescopes, eyepieces, and accessories from our extensive lending library.',
  },
  {
    icon: Calendar,
    title: 'Exclusive Events',
    description: 'Access to member-only star parties at our dark sky sites including OBS.',
  },
  {
    icon: Camera,
    title: 'Photo Gallery',
    description: 'Submit your astrophotography to our member gallery and get featured.',
  },
  {
    icon: Wrench,
    title: 'Mirror Lab Access',
    description: 'Learn to grind your own telescope mirrors with expert guidance.',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description: 'Access our library of astronomy books, charts, and educational materials.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with 300+ fellow astronomy enthusiasts in Tampa Bay.',
  },
];

export default function MembershipPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Membership Benefits</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join Tampa Bay&apos;s oldest and largest astronomy club. Choose the membership level that&apos;s right for you.
          </p>
        </div>

        {/* Membership Tiers */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {membershipTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-6 ${
                tier.popular
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-4">
                <tier.icon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Join SPAC Today
          </Link>
        </div>

        {/* Benefits Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">What You Get</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-border bg-card p-6">
                <benefit.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">How do I pay for membership?</h3>
              <p className="text-muted-foreground">
                After creating your account, you can pay online via credit card or PayPal. We also accept cash or check at monthly meetings.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">When does my membership expire?</h3>
              <p className="text-muted-foreground">
                Memberships run for one year from the date of payment. You&apos;ll receive a reminder email before renewal is due.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">Can I upgrade my membership?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade at any time from your account dashboard. The difference will be prorated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
