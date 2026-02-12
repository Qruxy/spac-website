/**
 * Donation Thank You Page
 *
 * Displayed after a successful donation.
 */

import type { Metadata } from 'next';

export const dynamic = 'force-static';
import Link from 'next/link';
import { Heart, ArrowRight, Star, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thank You for Your Donation',
  description: 'Thank you for supporting the St. Petersburg Astronomy Club!',
};

interface PageProps {
  searchParams: Promise<{ session_id?: string; recurring?: string }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isRecurring = params.recurring === 'true';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="relative inline-flex mb-8">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <Heart className="h-12 w-12 text-primary fill-primary/20" />
            </div>
            <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Your {isRecurring ? 'monthly' : ''} donation has been received.
          </p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You&apos;re helping us bring the wonders of the universe to Tampa Bay.
            A receipt has been sent to your email for tax purposes.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="rounded-xl border border-border bg-card/50 p-6 text-left">
              <Mail className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive a confirmation email with your tax-deductible receipt shortly.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-6 text-left">
              <Star className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {isRecurring ? 'Monthly Support' : 'Your Impact'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRecurring
                  ? 'Your recurring donation provides sustainable support for our programs.'
                  : 'Your generosity helps fund outreach, equipment, and education.'}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Explore Upcoming Events
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Return Home
            </Link>
          </div>

          {/* Social Share (Optional) */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Want to help even more?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Become a member
              </Link>{' '}
              or share your support with friends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
