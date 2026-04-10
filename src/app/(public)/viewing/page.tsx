/**
 * Monthly Viewing — New Moon Weekends Page
 *
 * Information about SPAC monthly viewing sessions at Withlacoochee River Park.
 * Static content with ISR revalidation.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Moon,
  AlertCircle,
  DollarSign,
  Navigation,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Monthly Viewing — New Moon Weekends | SPAC',
  description:
    'Join SPAC members at Withlacoochee River Park during New Moon weekends for dark sky observing. Open to all — camping available.',
};

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);

const rules = [
  'Arrive prior to dusk — the gates lock and headlights will interrupt those already set up.',
  'Display your Friends-of-the-Park Pass on your dashboard.',
  'Park facing northeast if you plan to leave during the night.',
  'Pay the designated representative prior to setting up if you did not pay online.',
  'No white lights.',
  'Campfires are not allowed on the activity field.',
];

export default function ViewingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Moon className="h-4 w-4" />
                New Moon Weekends
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-6">
                Monthly{' '}
                <GradientText
                  colors={['#818cf8', '#a78bfa', '#818cf8']}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold"
                  animationSpeed={8}
                >
                  Viewing
                </GradientText>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                New Moon Weekends at Withlacoochee River Park
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-4xl space-y-10">

          {/* Intro */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">About New Moon Weekends</h2>
              <p className="text-muted-foreground leading-relaxed">
                A number of our club members and guests meet regularly at Withlacoochee River Park
                during New Moon weekends. Except for the February New Moon weekend, everyone
                interested in viewing the night sky is welcome to these events. The schedule is
                displayed on our{' '}
                <Link href="/events" className="text-primary hover:underline">
                  Club Calendar
                </Link>
                .
              </p>

              {/* February note */}
              <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  <span className="font-semibold">February Note:</span> The February New Moon week
                  is set aside for our annual{' '}
                  <Link href="/obs" className="text-amber-300 hover:underline font-semibold">
                    Orange Blossom Special
                  </Link>{' '}
                  star party. You must be registered to attend.
                </p>
              </div>

              {/* Staying info */}
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Staying Overnight</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You may join us for just an evening, stay overnight, or camp for the weekend.
                    There is plenty of room for RVs and tents with 30-Amp and 20-Amp outlets, and
                    water. An RV dump station is located at the entry/exit of the field.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Gate &amp; Departure</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The park closes at dusk, so you must arrive before then. We will have the gate
                    code so you may depart whenever you are ready. However, we cannot give out the
                    gate code to anyone who is not already inside the park.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Reservations</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The activity field is reserved for astronomy viewing on New Moon Weekends and
                    other club sponsored events. Personal reservations are not necessary except for
                    the February New Moon weekend.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Friends-of-the-Park Pass</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You must display a Friends-of-the-Park Pass on your dashboard to be on the
                    activity field.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Restrooms</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Restrooms with showers are located approximately 300 yards from the activity
                    field. The code for the restrooms is the same as the gate code and is only
                    given out to folks on the activity field and RV campground.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Donations</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We accept donations to help our club meet its educational goals. SPAC is an IRS
                    501(c)(3) not-for-profit organization.{' '}
                    <Link href="/donations" className="text-primary hover:underline">
                      Donate online →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Activity Field Fees */}
          <FadeIn delay={0.15}>
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Activity Field Fees</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                    Non-Member Camping
                  </p>
                  <p className="text-foreground text-sm">$25/night — with electric</p>
                  <p className="text-foreground text-sm">$10/night — without electric</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                    Member Camping
                  </p>
                  <p className="text-foreground text-sm">$15/night — with electric</p>
                  <p className="text-foreground text-sm">$10/night — without electric</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                    Day / Evening Visit (no overnight)
                  </p>
                  <p className="text-foreground text-sm">Free — $5 donation appreciated</p>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                    Bunkhouse
                  </p>
                  <p className="text-sm">
                    <s className="text-muted-foreground">$15/night</s>{' '}
                    <span className="text-red-400 font-medium">
                      — Unavailable due to hurricane damage
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">Important:</span> Only pay through
                  SPAC if you are camping on a New Moon Weekend. All other times contact the park
                  directly.
                </p>
                <p className="text-sm text-muted-foreground">
                  Camping fees must be paid in advance online or upon arrival.{' '}
                  <span className="text-foreground font-semibold">NO EXCEPTIONS.</span>
                </p>

                {/* Quick-pay buttons */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Pay online — select your option:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/donations?amount=15&note=Member+camping+%E2%80%94+with+electric+%2415%2Fnight"
                      className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors text-sm font-medium text-foreground"
                    >
                      <span>Member — with electric</span>
                      <span className="text-primary font-bold">$15/night</span>
                    </Link>
                    <Link
                      href="/donations?amount=10&note=Member+camping+%E2%80%94+without+electric+%2410%2Fnight"
                      className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors text-sm font-medium text-foreground"
                    >
                      <span>Member — without electric</span>
                      <span className="text-primary font-bold">$10/night</span>
                    </Link>
                    <Link
                      href="/donations?amount=25&note=Non-member+camping+%E2%80%94+with+electric+%2425%2Fnight"
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors text-sm font-medium text-foreground"
                    >
                      <span>Non-member — with electric</span>
                      <span className="text-foreground font-bold">$25/night</span>
                    </Link>
                    <Link
                      href="/donations?amount=10&note=Non-member+camping+%E2%80%94+without+electric+%2410%2Fnight"
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors text-sm font-medium text-foreground"
                    >
                      <span>Non-member — without electric</span>
                      <span className="text-foreground font-bold">$10/night</span>
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    You&apos;ll be redirected to our secure PayPal checkout.
                    Pay for multiple nights by adjusting the amount on the next page.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* New Moon Weekend Rules */}
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                New Moon Weekend Rules
              </h2>
              <ol className="space-y-3">
                {rules.map((rule, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rule}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground border-t border-border pt-4">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Questions?</span>
                <a
                  href="mailto:Info@StPeteAstronomyClub.org"
                  className="text-primary hover:underline"
                >
                  Info@StPeteAstronomyClub.org
                </a>
              </div>
            </div>
          </FadeIn>

          {/* Withlacoochee River Park */}
          <FadeIn delay={0.25}>
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Withlacoochee River Park</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Address</p>
                      <p className="text-muted-foreground text-sm">
                        12449 Withlacoochee Blvd<br />
                        Dade City, FL 33525
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Phone</p>
                      <a
                        href="tel:3525670264"
                        className="text-muted-foreground text-sm hover:text-primary transition-colors"
                      >
                        (352) 567-0264
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <a
                    href="https://goo.gl/maps/nt6E99kmYCS2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions (Google Maps)
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://www.swfwmd.state.fl.us/recreation/withlacoochee-river-park"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official Park Website
                  </a>
                </div>
              </div>

              {/* Directions */}
              <div className="border-t border-border pt-6">
                <h3 className="text-base font-semibold text-foreground mb-3">
                  Directions from Tampa
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Take I-75 North to SR-52. Take SR-52 East all the way through Dade City until it
                  dead-ends at the railroad station on the 301 Bypass. Note: SR-52 will make 2
                  right-hand turns at traffic lights along the way — one after St. Leo and one when
                  entering Dade City. Go all the way to the dead end at the old railroad station.
                  Do not turn on US-301; go all the way to the dead end. Turn left on US-301 Bypass
                  and go about ¾ mile, then turn right on River Road, across the railroad tracks.
                  You will see a sign saying &ldquo;County Park 4.7 Miles.&rdquo; It&rsquo;s a
                  very winding, paved road — take your time. At the fork in the road, take the road
                  to the right (Auton Rd.) — there&rsquo;s a sign saying &ldquo;County Park&rdquo;
                  directing you to the right.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
