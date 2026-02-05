/**
 * Public Layout
 *
 * Layout for public-facing pages with top navigation header.
 * Uses Header component for full navigation with text labels.
 */

import type { ReactNode } from 'react';
import { Header, Footer } from '@/components/layout';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Full navigation header */}
      <Header />

      {/* Top padding for fixed header */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
