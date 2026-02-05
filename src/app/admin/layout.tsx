/**
 * Admin Layout
 *
 * Minimal layout for admin panel - React Admin provides its own UI.
 * Includes GlobalDock for navigation back to public/dashboard areas.
 * Server-side auth check ensures only admins can access.
 */

import { requireAdmin } from '@/lib/auth';
import { GlobalDock } from '@/components/layout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - redirects non-admins
  await requireAdmin();
  
  return (
    <div className="admin-root pb-20">
      {children}
      <GlobalDock />
    </div>
  );
}
