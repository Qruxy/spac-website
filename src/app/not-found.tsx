/**
 * Custom 404 Page
 * 
 * Branded not-found page matching the site design.
 */

import Link from 'next/link';
import { Telescope, Home } from 'lucide-react';
import { GoBackButton } from '@/components/ui/go-back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
            <Telescope className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-8xl font-bold text-foreground mb-2">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Lost in Space?
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for seems to have drifted into a black hole. 
          Don&apos;t worry—even the best astronomers get lost sometimes!
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <GoBackButton />
        </div>

        {/* Fun Fact */}
        <div className="mt-12 p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Fun Fact:</span> There are more stars in the universe than grains of sand on all of Earth&apos;s beaches—about 10 sextillion (10²²) stars!
          </p>
        </div>
      </div>
    </div>
  );
}
