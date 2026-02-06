'use client';

/**
 * Demo Logout Button
 *
 * Client-side logout for the static export demo.
 * Clears sessionStorage and redirects to login.
 */

import { useRouter } from 'next/navigation';
import { demoLogout } from '@/lib/demo-auth';
import { LogOut } from 'lucide-react';

export function DemoLogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    demoLogout();
    router.replace('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
    >
      <LogOut className="h-5 w-5" />
      Sign Out
    </button>
  );
}
