/**
 * Mirror Lab Page
 *
 * Information about SPAC's telescope mirror grinding workshop.
 * Apple-like clean design with creative animations.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { MirrorLabHero, MirrorLabGallery, ProcessStep } from './MirrorLabClient';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Mirror Lab | SPAC',
  description:
    'Learn to grind, polish, and figure your own telescope mirror at SPAC\'s Mirror Lab workshop. Build your telescope from scratch!',
};

const learningTopics = [
  {
    title: 'Rough Grinding',
    description: 'Shape raw glass into a parabolic curve using progressively finer abrasives.',
  },
  {
    title: 'Fine Grinding & Polishing',
    description: 'Achieve optical-quality smoothness with cerium oxide and pitch laps.',
  },
  {
    title: 'Figuring & Testing',
    description: 'Perfect your mirror using Foucault and Ronchi tests to achieve precision.',
  },
  {
    title: 'Mirror Cell Design',
    description: 'Learn to build proper mirror supports for optimal performance.',
  },
  {
    title: 'Telescope Construction',
    description: 'Assemble your completed mirror into a working telescope.',
  },
];

const processSteps = [
  {
    step: 1,
    title: 'Start with Raw Glass',
    description:
      'Begin with a glass blank\u2014typically Pyrex for thermal stability. Common sizes range from 6" to 12" diameter.',
  },
  {
    step: 2,
    title: 'Rough Grind the Curve',
    description:
      'Using silicon carbide grits, create the parabolic curve. This is satisfyingly physical work as you shape the glass.',
  },
  {
    step: 3,
    title: 'Fine Grinding',
    description:
      'Progress through finer and finer grits (120, 220, 320, 500) to smooth out the surface while maintaining the curve.',
  },
  {
    step: 4,
    title: 'Polishing',
    description:
      'Switch to a pitch lap with cerium oxide. The surface becomes optically smooth\u2014you can see your reflection.',
  },
  {
    step: 5,
    title: 'Figuring',
    description:
      'The most delicate phase. Fine-tune the parabola using controlled polishing strokes guided by optical testing.',
  },
  {
    step: 6,
    title: 'Coating',
    description:
      'Once figured, your mirror is sent out for professional aluminum coating\u2014then it\'s ready for first light.',
  },
];

const galleryImages = [
  { src: 'https://picsum.photos/seed/mirror1/600/400', alt: 'Mirror grinding in progress', caption: 'Rough grinding a 10" mirror blank' },
  { src: 'https://picsum.photos/seed/mirror2/600/400', alt: 'Foucault test setup', caption: 'Foucault knife-edge test in action' },
  { src: 'https://picsum.photos/seed/mirror3/600/400', alt: 'Completed mirror', caption: 'A freshly coated 8" primary mirror' },
  { src: 'https://picsum.photos/seed/mirror4/600/400', alt: 'Workshop environment', caption: 'Our well-equipped mirror grinding workshop' },
  { src: 'https://picsum.photos/seed/mirror5/600/400', alt: 'Completed telescope', caption: 'Member-built Dobsonian telescope' },
  { src: 'https://picsum.photos/seed/mirror6/600/400', alt: 'Polishing session', caption: 'Fine polishing with pitch lap' },
];

export default function MirrorLabPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <MirrorLabHero />

      {/* What is Mirror Grinding */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <FadeIn>
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-8">
                  What is{' '}
                  <GradientText
                    colors={['#818cf8', '#a78bfa', '#818cf8']}
                    className="text-3xl md:text-5xl font-bold"
                    animationSpeed={8}
                  >
                    mirror grinding?
                  </GradientText>
                </h2>
                <div className="space-y-5 text-muted-foreground leading-relaxed">
                  <p className="text-lg">
                    Mirror grinding is the art of transforming a flat disk of glass into a
                    precision optical surface capable of revealing the wonders of the universe.
                    It&apos;s a tradition dating back to the 1920s.
                  </p>
                  <p>
                    Using nothing more than two pieces of glass, water, and abrasive compounds,
                    you can create a parabolic mirror accurate to within a fraction of a wavelength
                    of light. The process is meditative, rewarding, and connects you to a proud
                    tradition of amateur telescope making.
                  </p>
                  <p>
                    A hand-made mirror isn&apos;t just functional\u2014it&apos;s a work of art. There&apos;s
                    something profoundly satisfying about observing the cosmos through optics
                    you crafted with your own hands.
                  </p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://picsum.photos/seed/mirrorhero/800/800"
                  alt="Mirror grinding process"
                  fill
                  className="object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                From glass to{' '}
                <GradientText
                  colors={['#fcd34d', '#f59e0b', '#fcd34d']}
                  className="text-3xl md:text-5xl font-bold"
                  animationSpeed={8}
                >
                  starlight
                </GradientText>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                The journey from a blank piece of glass to your first view through your
                own telescope is unforgettable.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={step.step}
                step={step.step}
                title={step.title}
                description={step.description}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                What you&apos;ll learn
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Master the complete process with guidance from experienced mentors.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {learningTopics.map((topic, index) => (
              <FadeIn key={topic.title} delay={index * 0.08}>
                <div className="rounded-2xl bg-card/50 p-8 hover:bg-card transition-colors duration-300 h-full">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {topic.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{topic.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Info */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Workshop details
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FadeIn delay={0}>
              <div className="rounded-2xl bg-card/50 p-8 h-full">
                <h3 className="text-lg font-semibold text-foreground mb-3">Location</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Mirror Lab Building, St. Petersburg, FL.
                  Address provided to registered members.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.08}>
              <div className="rounded-2xl bg-card/50 p-8 h-full">
                <h3 className="text-lg font-semibold text-foreground mb-3">Schedule</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Saturdays, 9:00 AM \u2013 1:00 PM.
                  Additional sessions may be scheduled for active projects.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.16}>
              <div className="rounded-2xl bg-card/50 p-8 h-full">
                <h3 className="text-lg font-semibold text-foreground mb-3">What to Bring</h3>
                <ul className="text-muted-foreground space-y-1 leading-relaxed">
                  <li>Comfortable clothes (you will get wet)</li>
                  <li>Closed-toe shoes</li>
                  <li>Enthusiasm and patience</li>
                  <li>Notebook for notes</li>
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.24}>
              <div className="rounded-2xl bg-card/50 p-8 h-full">
                <h3 className="text-lg font-semibold text-foreground mb-3">Cost</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Instruction is free for SPAC members.
                  Materials run ~$50\u2013200 depending on mirror size.
                  Glass blanks, abrasives, and pitch included.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                From the workshop
              </h2>
            </div>
          </FadeIn>
          <MirrorLabGallery images={galleryImages} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Ready to build your own telescope?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join SPAC and start your mirror-making journey. Our experienced mentors
              are ready to guide you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Join the Club
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/about#board"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-lg font-medium text-foreground hover:bg-muted transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
