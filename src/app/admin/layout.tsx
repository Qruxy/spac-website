import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <AdminShell
      user={{ name: session.user.name || null, role: session.user.role }}
    >
      {children}
    </AdminShell>
  );
}
