/**
 * Admin Panel Page
 *
 * Uses React Admin for admin interface.
 * Catch-all route to handle React Admin's internal routing.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AdminWrapper } from '@/components/admin/AdminWrapper';

export const metadata: Metadata = {
  title: 'Admin Panel | SPAC',
  description: 'SPAC Administration Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();

  // Check if user is authenticated and has admin access
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <div className="h-screen">
      <AdminWrapper />
    </div>
  );
}
