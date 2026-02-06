/**
 * Admin Layout
 *
 * Minimal layout for admin panel - React Admin provides its own UI.
 * Includes GlobalDock for navigation back to public/dashboard areas.
 * In static export (demo mode), uses client-side auth guard.
 * In production, uses server-side auth check.
 */

import { GlobalDock } from '@/components/layout';
import { DemoAuthGuard } from '@/components/demo/DemoAuthGuard';

const isDemoMode = process.env.GITHUB_PAGES === 'true';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check (skipped in demo mode where getSession returns demo user)
  if (!isDemoMode) {
    const { requireAdmin } = await import('@/lib/auth');
    await requireAdmin();
  }

  return (
    <div className="admin-root pb-20">
      {isDemoMode ? (
        <DemoAuthGuard requireAdmin>{children}</DemoAuthGuard>
      ) : (
        children
      )}
      <GlobalDock />
    </div>
  );
}
