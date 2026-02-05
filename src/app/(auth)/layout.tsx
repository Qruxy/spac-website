/**
 * Auth Layout
 *
 * Minimal layout for authentication pages (login, register, etc.)
 * Centered card design with dark background.
 * Includes GlobalDock (minimal) for navigation.
 */

import Link from 'next/link';
import { Telescope } from 'lucide-react';
import { GlobalDock } from '@/components/layout';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 pb-24">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-foreground hover:text-primary transition-colors"
      >
        <Telescope className="h-8 w-8" />
        <span className="text-xl font-bold">SPAC</span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
          {children}
        </div>
      </div>

      {/* Global Navigation Dock */}
      <GlobalDock variant="minimal" />
    </div>
  );
}
