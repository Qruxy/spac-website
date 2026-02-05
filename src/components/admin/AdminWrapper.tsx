/**
 * Admin Wrapper Component
 *
 * Dynamically imports React Admin to avoid SSR compatibility issues.
 * React Admin uses react-router which is not compatible with Next.js server rendering.
 */

'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AdminApp = dynamic(
  () => import('./AdminApp').then((mod) => mod.AdminApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    ),
  }
);

export function AdminWrapper() {
  return <AdminApp />;
}
