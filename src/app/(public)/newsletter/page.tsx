/**
 * Newsletter Archive Page
 *
 * Members-only page for browsing "The Eyepiece" newsletter archive.
 * Server Component that fetches initial data, with client component for interactivity.
 */

import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ExternalLink, LogIn } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NewsletterClient } from './newsletter-client';

const FadeIn = nextDynamic(
  () => import('@/components/animated/fade-in').then((mod) => mod.FadeIn),
  { ssr: false }
);
const CountUp = nextDynamic(
  () => import('@/components/animated/count-up').then((mod) => mod.CountUp),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'SPACE Newsletter Archive | SPAC',
  description:
    'Browse the complete archive of SPACE (St. Petersburg Astronomy Club Examiner), the official newsletter of the St. Petersburg Astronomy Club.',
};

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 12;

async function getNewsletters() {
  try {
    const session = await getSession();
    const isAuthenticated = !!session?.user;

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
      fileUrl: isAuthenticated ? newsletter.fileUrl : null,
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
  const session = await getSession();
  // Newsletter is now public — login only required to download PDFs directly

  const [{ newsletters, total, totalPages, years }, contentRows] = await Promise.all([
    getNewsletters(),
    prisma.siteContent.findMany({ where: { pageKey: 'newsletter' } }),
  ]);
  const content: Record<string, string> = {};
  for (const r of contentRows) content[r.fieldKey] = r.value;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-32 lg:py-44">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground mb-4">Official Newsletter of SPAC</p>

              {/* SPACE title — white SPAC, red E — matching newsletter cover */}
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none select-none">
                <span className="text-white">SPAC</span><span style={{ color: '#e53e3e' }}>E</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mt-3">
                St. Petersburg Astronomy Club{' '}
                <span style={{ color: '#e53e3e' }} className="font-semibold">Examiner</span>
              </p>

              <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {content['hero_subtitle'] || 'Explore our archive of monthly newsletters featuring club news, observing reports, member articles, and celestial event previews.'}
              </p>

              {/* Member download note */}
              {!session?.user && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
                  <LogIn className="h-4 w-4" />
                  <Link href="/login?callbackUrl=/newsletter" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                  &nbsp;to download PDFs directly
                </div>
              )}

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

      {/* Latest Issue Cover — links to Google Drive */}
      {(content['cover_photo_url'] || content['cover_drive_url']) && (
        <section className="container mx-auto px-4 pb-8">
          <FadeIn delay={0.1}>
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
                Current Issue
              </p>
              <Link
                href={content['cover_drive_url'] || 'https://drive.google.com/drive/folders/0B9dsr9BUsMaYSnkxZ0E1SFBHbTQ?usp=sharing'}
                target="_blank"
                rel="noopener noreferrer"
                className="group block mx-auto max-w-sm rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10"
              >
                {content['cover_photo_url'] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content['cover_photo_url']}
                    alt="Current SPACE Newsletter Cover"
                    className="w-full object-cover"
                  />
                ) : (
                  <div className="bg-card/50 p-8 flex flex-col items-center gap-3">
                    <div className="text-4xl font-black">
                      <span className="text-white">SPAC</span><span style={{ color: '#e53e3e' }}>E</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Click to view on Google Drive</p>
                  </div>
                )}
                <div className="bg-card/80 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {content['cover_issue_label'] || 'Latest Issue'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Open on Google Drive
                  </span>
                </div>
              </Link>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Google Drive Archive Banner */}
      <section className="container mx-auto px-4 pb-8">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Complete Archive on Google Drive</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              The complete SPACE newsletter archive is available on Google Drive. Issues are
              published monthly by Editor Guy Earle.
            </p>
            {!session?.user && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Members can download PDFs directly from this page —{' '}
                <Link href="/login?callbackUrl=/newsletter" className="text-primary hover:underline">
                  sign in
                </Link>{' '}
                to access downloads.
              </p>
            )}
          </div>
          <Link
            href="https://drive.google.com/drive/folders/0B9dsr9BUsMaYSnkxZ0E1SFBHbTQ?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open Google Drive
          </Link>
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
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
                Never miss an issue
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Join SPAC to receive S.P.A.C.E. directly in your inbox each month,
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
