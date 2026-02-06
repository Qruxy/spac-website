'use client';

/**
 * Demo Auth Guard
 *
 * Client-side authentication gate for the static export demo.
 * Checks sessionStorage for demo login state and redirects
 * to /login if not authenticated.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoSession } from '@/lib/demo-auth';
import { Loader2 } from 'lucide-react';

export function DemoAuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getDemoSession();
    if (!session) {
      router.replace('/login?callbackUrl=/dashboard');
      return;
    }
    if (requireAdmin && session.role !== 'ADMIN') {
      router.replace('/dashboard?error=unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router, requireAdmin]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
