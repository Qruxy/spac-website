/**
 * Dashboard Layout
 *
 * Authenticated member area with sidebar + top bar navigation.
 * Requires authentication - redirects to login if not authenticated.
 * Mobile bottom nav replaces the desktop sidebar on small screens.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import {
  LayoutDashboard,
  User,
  Calendar,
  ShoppingBag,
  Image,
  CreditCard,
  Settings,
  LogOut,
  QrCode,
  Telescope,
  Shield,
  Home,
  Mail,
  MessageSquare,
  Bell,
} from 'lucide-react';
import type { ReactNode } from 'react';
import NotificationBell from '@/components/notifications/notification-bell';

const sidebarLinks = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    name: 'Membership Card',
    href: '/membership-card',
    icon: QrCode,
  },
  {
    name: 'My Events',
    href: '/my-events',
    icon: Calendar,
  },
  {
    name: 'My Listings',
    href: '/my-listings',
    icon: ShoppingBag,
  },
  {
    name: 'My Photos',
    href: '/my-photos',
    icon: Image,
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

const adminLinks = [
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
  },
  {
    name: 'Communications',
    href: '/communications',
    icon: Mail,
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Telescope className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold hidden sm:inline">SPAC</span>
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.membershipType?.toLowerCase() || 'Free'} Member
              </p>
            </div>
            <NotificationBell />
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            ))}

            {/* Admin Links - Only visible for ADMIN and MODERATOR roles */}
            {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <>
                <div className="pt-4 pb-2">
                  <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                {adminLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - visible only on small screens */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-around h-16">
          {(user.role === 'ADMIN' || user.role === 'MODERATOR') ? (
            <Link href="/admin" className="flex flex-col items-center gap-0.5 px-2 py-1 text-primary">
              <Shield className="h-5 w-5" />
              <span className="text-[10px]">Admin</span>
            </Link>
          ) : (
            <Link href="/" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
              <Home className="h-5 w-5" />
              <span className="text-[10px]">Home</span>
            </Link>
          )}
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Dashboard</span>
          </Link>
          <Link href="/my-listings" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[10px]">Listings</span>
          </Link>
          <Link href="/my-events" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span className="text-[10px]">Events</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
