'use client';

/**
 * Logout Page
 *
 * Handles both:
 * - Post-signout landing (NextAuth redirects here after signOut())
 * - Direct navigation to /logout (triggers signOut then shows confirmation)
 */

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, Home, Telescope } from 'lucide-react';

export default function LogoutPage() {
  const { status } = useSession();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // Direct navigation to /logout — sign them out
      signOut({ redirect: false }).then(() => setDone(true));
    } else {
      // Already signed out (normal post-logout landing)
      setDone(true);
    }
  }, [status]);

  if (!done || status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Telescope className="h-8 w-8 text-primary animate-pulse" />
        <p className="text-muted-foreground text-sm">Signing you out…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
        <Telescope className="h-8 w-8 text-primary" />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">See you under the stars</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You&apos;ve been signed out of your SPAC account.
          <br />
          The universe will be here when you get back.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/login"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Sign back in
        </Link>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
