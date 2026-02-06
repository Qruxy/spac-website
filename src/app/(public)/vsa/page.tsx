/**
 * VSA (Very Small Array) Page
 *
 * Displays information about SPAC's smart telescope program,
 * current targets, and links to the Facebook group.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { prisma } from '@/lib/db/prisma';
import { ArrowRight, Facebook, ExternalLink, Star, Calendar } from 'lucide-react';

const GradientText = nextDynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);
const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);
const RotatingText = nextDynamic(
  () => import('@/components/animated/rotating-text').then((mod) => mod.RotatingText),
  { ssr: false }
);
const CountUp = nextDynamic(
  () => import('@/components/animated/count-up').then((mod) => mod.CountUp),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'VSA - Very Small Array | SPAC',
  description: 'Learn about SPAC\'s Very Small Array smart telescope program, current observation targets, and how to get involved.',
};

async function getCurrentTargets() {
  const targets = await prisma.vSATarget.findMany({
    where: { isCurrentTarget: true },
    orderBy: { startDate: 'desc' },
  });
  return targets;
}

async function getEquipment() {
  const equipment = await prisma.vSAEquipment.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return equipment;
}

export default async function VSAPage() {
  const [targets, equipment] = await Promise.all([
    getCurrentTargets(),
    getEquipment(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-foreground">
                <GradientText
                  colors={['#818cf8', '#a78bfa', '#818cf8']}
                  className="text-6xl md:text-8xl lg:text-9xl font-bold"
                  animationSpeed={8}
                >
                  VSA
                </GradientText>
              </h1>
              <p className="mt-4 text-2xl md:text-3xl text-muted-foreground font-light">
                Very Small Array
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Smart telescopes that make deep-sky imaging accessible to everyone.
                Point. Capture. Discover.
              </p>
            </FadeIn>
            <FadeIn delay={0.35}>
              <div className="mt-10 flex items-center justify-center">
                <RotatingText
                  texts={['Observe', 'Image', 'Discover', 'Learn', 'Share']}
                  mainClassName="text-3xl md:text-4xl font-bold text-primary overflow-hidden h-[1.2em]"
                  staggerFrom="last"
                  staggerDuration={0.025}
                  rotationInterval={2500}
                  splitBy="characters"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Current Targets */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Current Targets
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                What our telescopes are pointed at right now.
              </p>
            </div>
          </FadeIn>

          {targets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {targets.map((target, index) => (
                <FadeIn key={target.id} delay={index * 0.1}>
                  <div className="group rounded-2xl bg-card/50 overflow-hidden hover:bg-card transition-all duration-300">
                    {target.imageUrl && (
                      <div className="relative h-52 overflow-hidden">
                        <Image
                          src={target.imageUrl}
                          alt={target.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {target.name}
                        </h3>
                        {target.magnitude && (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            mag {target.magnitude.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-primary/80 mb-1">{target.objectType}</p>
                      {target.constellation && (
                        <p className="text-sm text-muted-foreground mb-3">in {target.constellation}</p>
                      )}
                      {target.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{target.description}</p>
                      )}
                      {(target.startDate || target.endDate) && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/70">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {target.startDate && new Date(target.startDate).toLocaleDateString()}
                            {target.endDate && ` \u2013 ${new Date(target.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          ) : (
            <FadeIn>
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">
                  No current targets. New observation targets are added regularly\u2014check back soon.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Equipment */}
      {equipment.length > 0 && (
        <section className="py-24 lg:py-32 bg-muted/20">
          <div className="container mx-auto px-4">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                  Our Equipment
                </h2>
                <p className="mt-6 text-lg text-muted-foreground">
                  The instruments behind the images.
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {equipment.map((item, index) => (
                <FadeIn key={item.id} delay={index * 0.1}>
                  <div className="rounded-2xl bg-card/50 p-6 hover:bg-card transition-colors duration-300">
                    {item.imageUrl && (
                      <div className="relative h-44 mb-5 rounded-xl overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-primary/80 mt-1">{item.type}</p>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About & Community */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            <FadeIn>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
                  What is the VSA?
                </h2>
                <div className="space-y-5 text-muted-foreground leading-relaxed">
                  <p>
                    The Very Small Array is SPAC&apos;s innovative program that brings the power of
                    smart telescopes to our members. Using automated imaging systems, we capture detailed
                    images of deep-sky objects, planets, and other celestial wonders.
                  </p>
                  <p>
                    Whether you&apos;re a seasoned astronomer or just starting your journey, the VSA provides
                    an accessible way to explore the cosmos. Our smart telescopes handle the complex tracking
                    and imaging, allowing you to focus on learning and discovery.
                  </p>
                  <p>
                    Members can participate in observing sessions, learn image processing techniques,
                    and contribute to our growing collection of astronomical images.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
                  Join the Community
                </h2>
                <div className="space-y-5 text-muted-foreground leading-relaxed mb-8">
                  <p>
                    Connect with fellow VSA enthusiasts on our Facebook group. Share your observations,
                    ask questions, and stay updated on upcoming sessions and targets.
                  </p>
                  <p>
                    Our active community includes experienced astrophotographers who are always happy
                    to help newcomers get started with smart telescope imaging.
                  </p>
                </div>
                <a
                  href="https://www.facebook.com/groups/spacvsa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-6 py-3 font-medium hover:bg-[#1877F2]/90 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  Join VSA Facebook Group
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
              Ready to explore the universe?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join SPAC and get access to our VSA program, star parties, educational workshops, and more.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Become a Member
              <ArrowRight className="h-5 w-5" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
