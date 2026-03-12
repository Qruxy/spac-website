/**
 * Membership Page — rebuilt with correct pricing and full dark cosmic theme
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Check, Star, Users, GraduationCap, Telescope, Calendar,
  Camera, BookOpen, Wrench, Heart, Gem, ArrowRight, Zap,
  ChevronDown, Shield, Trophy,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Membership | SPAC',
  description: 'Join the St. Petersburg Astronomy Club. Choose from Student, Individual, Family, Patron, or Benefactor membership.',
};

const tiers = [
  {
    name: 'Student',
    price: 'Free',
    period: '',
    annualLabel: null,
    apiTier: 'STUDENT',
    description: 'Full-time students in Pinellas, Pasco, or Hillsborough Counties',
    icon: GraduationCap,
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
    accentColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    popular: false,
    features: [
      'All member benefits',
      'Astronomical League membership',
      'Monthly newsletter',
      'OBS star party access',
      'Equipment lending library',
      'Valid student ID required',
    ],
  },
  {
    name: 'Individual',
    price: '$30',
    period: '/year',
    annualLabel: '$30/yr',
    apiTier: 'INDIVIDUAL',
    description: 'One adult plus any number of minor children',
    icon: Star,
    color: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/40',
    accentColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    popular: true,
    features: [
      'Monthly meetings & newsletter',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment lending library',
      'Vote on club matters',
      'Member-only events',
      'Post in classifieds',
      'Photo gallery access',
    ],
  },
  {
    name: 'Family',
    price: '$35',
    period: '/year',
    annualLabel: '$35/yr',
    apiTier: 'FAMILY',
    description: 'Two adults plus any number of minor children',
    icon: Users,
    color: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30',
    accentColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    popular: false,
    features: [
      'All Individual benefits',
      'Two adult members',
      'All minor children included',
      'Family discount on events',
      'Priority workshop registration',
    ],
  },
  {
    name: 'Patron',
    price: '$50',
    period: '/year',
    annualLabel: '$50/yr',
    apiTier: 'PATRON',
    description: 'Supporting members who help the club grow',
    icon: Heart,
    color: 'from-rose-500/20 to-pink-500/20',
    borderColor: 'border-rose-500/30',
    accentColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300',
    popular: false,
    features: [
      'All Individual benefits',
      'Patron recognition in newsletter',
      'Recognition at club events',
      'Priority access to special programs',
    ],
  },
  {
    name: 'Benefactor',
    price: '$100',
    period: '/year',
    annualLabel: '$100/yr',
    apiTier: 'BENEFACTOR',
    description: 'Our most generous supporters — thank you',
    icon: Gem,
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
    accentColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    popular: false,
    features: [
      'All Patron benefits',
      'Named recognition at OBS star party',
      'Named recognition on website',
      'Invitation to annual appreciation event',
      'Personal thank-you from club president',
    ],
  },
];

const benefits = [
  {
    icon: Telescope,
    title: 'Equipment Library',
    description: 'Borrow telescopes, eyepieces, and accessories from our extensive lending library.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Calendar,
    title: 'Star Parties',
    description: 'Join member-only star parties at dark sky sites including the annual OBS event.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Camera,
    title: 'Photo Gallery',
    description: 'Submit your astrophotography and get featured in our member gallery.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Wrench,
    title: 'Mirror Lab',
    description: 'Grind your own telescope mirror with hands-on expert guidance from club members.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description: 'Access our astronomy library, charts, and educational materials.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with 300+ fellow astronomy enthusiasts across the Tampa Bay area.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Shield,
    title: 'Astronomical League',
    description: 'Automatic membership in the Astronomical League — access to observing programs.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Trophy,
    title: 'Classifieds',
    description: 'Buy and sell astronomy equipment with trusted fellow club members.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
];

const faqs = [
  {
    q: 'How do I pay for membership?',
    a: 'After creating your account, you can pay online via PayPal. We also accept cash or check at monthly meetings.',
  },
  {
    q: 'When does my membership expire?',
    a: "Memberships run for one year from the date of payment. You'll receive a reminder email before your renewal is due.",
  },
  {
    q: 'What is the Astronomical League?',
    a: 'The Astronomical League is a national federation of astronomy clubs. Membership gives you access to their observing programs, awards, and resources.',
  },
  {
    q: 'Can I upgrade my membership tier?',
    a: 'Yes — contact us or visit your account dashboard to upgrade at any time.',
  },
  {
    q: 'Is there a monthly payment option?',
    a: 'Currently memberships are billed annually. Monthly billing is coming soon.',
  },
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative py-32 lg:py-44 overflow-hidden">
        {/* Subtle starfield BG */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08)_0%,_transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400 mb-8">
              <Zap className="h-3.5 w-3.5" />
              Tampa Bay&apos;s Oldest Astronomy Club — Est. 1927
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              Join{' '}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                SPAC
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Start exploring the universe with 300+ fellow stargazers. All skill levels welcome — from first-time telescope owners to seasoned observers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 text-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Become a Member
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border hover:border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground font-semibold px-8 py-4 text-lg transition-colors"
              >
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Tiers ── */}
      <section className="container mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Choose Your Membership</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">All tiers billed annually. Student membership is free with valid student ID.</p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl border bg-gradient-to-b ${tier.color} ${tier.borderColor} p-6 flex flex-col transition-transform hover:-translate-y-1 duration-200 ${
                  tier.popular ? 'ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/10' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 w-fit mb-5 ${tier.badgeColor}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{tier.name}</span>
                </div>

                <div className="mb-3">
                  <span className={`text-4xl font-bold ${tier.accentColor}`}>{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>}
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{tier.description}</p>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${tier.accentColor}`} />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 border border-border text-foreground'
                  }`}
                >
                  {tier.price === 'Free' ? 'Apply Free' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Benefits Grid ── */}
      <section className="border-t border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Everything That Comes With Membership</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From equipment to community, your SPAC membership is packed with value.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6 hover:border-border transition-colors"
                >
                  <div className={`inline-flex p-2.5 rounded-xl mb-4 ${b.bg}`}>
                    <Icon className={`h-5 w-5 ${b.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-indigo-950/40 to-violet-950/60 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to explore the universe?</h2>
              <p className="text-blue-200/70 text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of Tampa Bay stargazers. Your first star party could be this weekend.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white text-blue-950 font-bold px-10 py-4 text-lg hover:bg-blue-50 transition-colors shadow-xl shadow-black/30"
              >
                Join SPAC Today
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">FAQ</h2>
            <div className="space-y-4">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border/60 bg-card/60 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none text-foreground font-medium hover:bg-muted/20 transition-colors list-none">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border/40 pt-4">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
