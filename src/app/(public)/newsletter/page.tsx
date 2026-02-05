/**
 * Newsletter Archive Page
 *
 * Public page for browsing the "Celestial Observer" newsletter archive.
 * Server Component that fetches initial data, with client component for interactivity.
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Mail, Star, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/db';
import { NewsletterClient } from './newsletter-client';

// Dynamic import for animated gradient text
const GradientText = dynamic(
  () => import('@/components/animated/gradient-text').then((mod) => mod.GradientText),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Celestial Observer Newsletter Archive | SPAC',
  description:
    'Browse the complete archive of the Celestial Observer, the official newsletter of the St. Petersburg Astronomy Club.',
};

// ISR with 5-minute revalidation
export const revalidate = 300;

const ITEMS_PER_PAGE = 12;

async function getNewsletters() {
  try {
    // Run all queries in parallel using $transaction for performance
    const [newsletters, total, yearsResult] = await prisma.$transaction([
      // Get newsletters
      prisma.clubDocument.findMany({
        where: {
          category: 'NEWSLETTER',
          isPublic: true,
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' },
        ],
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
      // Get total count
      prisma.clubDocument.count({
        where: {
          category: 'NEWSLETTER',
          isPublic: true,
        },
      }),
      // Get distinct years
      prisma.clubDocument.findMany({
        where: {
          category: 'NEWSLETTER',
          isPublic: true,
          year: { not: null },
        },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ]);

    const years = yearsResult
      .map((r) => r.year)
      .filter((y): y is number => y !== null);

    // Transform newsletters with month names
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
    return {
      newsletters: [],
      total: 0,
      totalPages: 0,
      years: [],
    };
  }
}

export default async function NewsletterPage() {
  const { newsletters, total, totalPages, years } = await getNewsletters();

  return (
    <div className="py-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          {/* Newsletter Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <Mail className="h-12 w-12 text-indigo-400" />
              </div>
              {/* Decorative stars */}
              <Star className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
              <Sparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-purple-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3 flex-wrap">
            <span>The</span>
            <GradientText
              colors={['#818cf8', '#c084fc', '#f472b6', '#818cf8']}
              className="text-4xl md:text-5xl font-bold"
              animationSpeed={6}
            >
              Celestial Observer
            </GradientText>
          </h1>

          <p className="text-xl text-muted-foreground mb-2">
            Official Newsletter of the St. Petersburg Astronomy Club
          </p>
          <p className="text-muted-foreground">
            Explore our archive of monthly newsletters featuring club news, observing reports,
            member articles, and celestial event previews.
          </p>

          {/* Stats */}
          {total > 0 && (
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{total}</p>
                <p className="text-sm text-muted-foreground">Issues</p>
              </div>
              {years.length > 0 && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {years[years.length - 1]}–{years[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">Archive Span</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Archive */}
      <section className="container mx-auto px-4">
        <NewsletterClient
          initialNewsletters={newsletters}
          initialYears={years}
          initialTotal={total}
          initialTotalPages={totalPages}
        />
      </section>

      {/* Subscribe CTA (for logged-in users or email signup) */}
      <section className="container mx-auto px-4 mt-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 md:p-12 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400">
              <circle cx="50" cy="50" r="2" fill="white" />
              <circle cx="150" cy="80" r="1.5" fill="white" />
              <circle cx="300" cy="40" r="1" fill="white" />
              <circle cx="350" cy="100" r="2" fill="white" />
              <circle cx="80" cy="200" r="1.5" fill="white" />
              <circle cx="250" cy="180" r="1" fill="white" />
              <circle cx="380" cy="220" r="1.5" fill="white" />
              <circle cx="100" cy="350" r="2" fill="white" />
              <circle cx="200" cy="320" r="1" fill="white" />
              <circle cx="320" cy="360" r="1.5" fill="white" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Never Miss an Issue
            </h2>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Join SPAC to receive the Celestial Observer directly in your inbox each month,
              plus get access to member-exclusive content and events.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Become a Member
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
