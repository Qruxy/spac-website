/**
 * Newsletter Archive Page
 *
 * Public page for browsing "The Eyepiece" newsletter archive.
 * Server Component that fetches initial data, with client component for interactivity.
 */

import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { NewsletterClient } from './newsletter-client';

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
  title: 'The Eyepiece Newsletter Archive | SPAC',
  description:
    'Browse the complete archive of The Eyepiece, the official newsletter of the St. Petersburg Astronomy Club.',
};

export const revalidate = 300;

const ITEMS_PER_PAGE = 12;

async function getNewsletters() {
  try {
    const [newsletters, total, yearsResult] = await prisma.$transaction([
      prisma.clubDocument.findMany({
        where: { category: 'NEWSLETTER', isPublic: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        take: ITEMS_PER_PAGE,
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          filename: true,
          mimeType: true,
          size: true,
          year: true,
          month: true,
          createdAt: true,
        },
      }),
      prisma.clubDocument.count({
        where: { category: 'NEWSLETTER', isPublic: true },
      }),
      prisma.clubDocument.findMany({
        where: { category: 'NEWSLETTER', isPublic: true, year: { not: null } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ]);

    const years = yearsResult
      .map((r) => r.year)
      .filter((y): y is number => y !== null);

    const transformedNewsletters = newsletters.map((newsletter) => ({
      id: newsletter.id,
      title: newsletter.title,
      description: newsletter.description,
      fileUrl: newsletter.fileUrl,
      filename: newsletter.filename,
      mimeType: newsletter.mimeType,
      size: newsletter.size,
      year: newsletter.year,
      month: newsletter.month,
      createdAt: newsletter.createdAt.toISOString(),
      monthName: newsletter.month
        ? new Date(2000, newsletter.month - 1).toLocaleString('en-US', { month: 'long' })
        : null,
    }));

    return {
      newsletters: transformedNewsletters,
      total,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      years,
    };
  } catch (error) {
    console.error('Failed to fetch newsletters:', error);
    return { newsletters: [], total: 0, totalPages: 0, years: [] };
  }
}

export default async function NewsletterPage() {
  const { newsletters, total, totalPages, years } = await getNewsletters();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-44">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground mb-4">Official Newsletter of SPAC</p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight">
                The{' '}
                <GradientText
                  colors={['#818cf8', '#a78bfa', '#818cf8']}
                  className="text-5xl md:text-7xl lg:text-8xl font-bold"
                  animationSpeed={8}
                >
                  Eyepiece
                </GradientText>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Explore our archive of monthly newsletters featuring club news, observing reports,
                member articles, and celestial event previews.
              </p>

              {total > 0 && (
                <div className="flex items-center justify-center gap-8 mt-12">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      <CountUp to={total} duration={2} />
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Issues</p>
                  </div>
                  {years.length > 0 && (
                    <>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground tabular-nums">
                          {years.length === 1 ? years[0] : `${years[years.length - 1]}\u2013${years[0]}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Years Covered</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter Archive */}
      <FadeIn delay={0.1}>
        <section className="container mx-auto px-4 pb-16">
          <NewsletterClient
            initialNewsletters={newsletters}
            initialYears={years}
            initialTotal={total}
            initialTotalPages={totalPages}
          />
        </section>
      </FadeIn>

      {/* Subscribe CTA */}
      <section className="py-24 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
                Never miss an issue
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Join SPAC to receive The Eyepiece directly in your inbox each month,
                plus get access to member-exclusive content and events.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Become a Member
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
