'use client';

/**
 * Global Dock Navigation
 *
 * Universal macOS-style dock navigation available on ALL pages.
 * Context-aware: shows different items based on route and auth state.
 * Desktop: Animated dock with magnification at bottom
 * Mobile: Fixed bottom navigation bar
 */

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  Users,
  Calendar,
  Image,
  ShoppingBag,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  Settings,
  Minus,
} from 'lucide-react';
import Dock, { type DockItemData } from '@/components/Dock';
import { cn } from '@/lib/utils';

// Core public navigation - always visible
const publicNav = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'About', href: '/about', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Gallery', href: '/gallery', icon: Image },
  { name: 'Classifieds', href: '/classifieds', icon: ShoppingBag },
];

// Extended public navigation for more menu
const extendedNav = [
  { name: 'VSA', href: '/vsa', icon: Users },
  { name: 'Donations', href: '/donations', icon: Users },
  { name: 'Newsletter', href: '/newsletter', icon: Calendar },
  { name: 'OBS', href: '/obs', icon: Calendar },
  { name: 'Mirror Lab', href: '/mirror-lab', icon: Users },
  { name: 'History', href: '/history', icon: Calendar },
];

// Dashboard quick access
const dashboardNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface GlobalDockProps {
  variant?: 'full' | 'minimal';
}

export function GlobalDock({ variant = 'full' }: GlobalDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Determine current section
  const isPublicSection = !pathname.startsWith('/dashboard') &&
                          !pathname.startsWith('/admin') &&
                          !pathname.startsWith('/profile') &&
                          !pathname.startsWith('/settings') &&
                          !pathname.startsWith('/my-') &&
                          !pathname.startsWith('/membership-card') &&
                          !pathname.startsWith('/billing');
  const isDashboardSection = pathname.startsWith('/dashboard') ||
                             pathname.startsWith('/profile') ||
                             pathname.startsWith('/settings') ||
                             pathname.startsWith('/my-') ||
                             pathname.startsWith('/membership-card') ||
                             pathname.startsWith('/billing');
  const isAdminSection = pathname.startsWith('/admin');
  const isAuthSection = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Build dock items based on context
  const buildDockItems = (): DockItemData[] => {
    const items: DockItemData[] = [];

    // Home is always first and prominent
    items.push({
      icon: (
        <Home
          className={cn(
            'w-6 h-6',
            pathname === '/' ? 'text-primary' : 'text-white'
          )}
        />
      ),
      label: 'Home',
      onClick: () => router.push('/'),
      className: pathname === '/' ? 'border-primary/50 bg-primary/10' : '',
    });

    // Divider representation (visual spacing handled in component)
    // Public navigation items
    publicNav.slice(1).forEach((item) => {
      items.push({
        icon: (
          <item.icon
            className={cn(
              'w-6 h-6',
              isActive(item.href) ? 'text-primary' : 'text-white'
            )}
          />
        ),
        label: item.name,
        onClick: () => router.push(item.href),
        className: isActive(item.href) ? 'border-primary/50' : '',
      });
    });

    // Authenticated user items
    if (isAuthenticated) {
      // Dashboard access (always show when authenticated)
      items.push({
        icon: (
          <LayoutDashboard
            className={cn(
              'w-6 h-6',
              isDashboardSection ? 'text-primary' : 'text-white'
            )}
          />
        ),
        label: 'Dashboard',
        onClick: () => router.push('/dashboard'),
        className: isDashboardSection ? 'border-primary/50 bg-primary/10' : '',
      });

      // Admin access (only for admins)
      if (isAdmin) {
        items.push({
          icon: (
            <Shield
              className={cn(
                'w-6 h-6',
                isAdminSection ? 'text-amber-400' : 'text-amber-400/70'
              )}
            />
          ),
          label: 'Admin',
          onClick: () => router.push('/admin'),
          className: cn(
            'border-amber-500/30',
            isAdminSection ? 'bg-amber-500/20 border-amber-500/50' : ''
          ),
        });
      }

      // Sign out
      items.push({
        icon: <LogOut className="w-6 h-6 text-neutral-400" />,
        label: 'Sign Out',
        onClick: () => signOut({ callbackUrl: '/' }),
        className: 'hover:border-red-500/50',
      });
    } else {
      // Not authenticated - show login/register
      items.push({
        icon: <LogIn className="w-6 h-6 text-white" />,
        label: 'Sign In',
        onClick: () => router.push('/login'),
        className: isActive('/login') ? 'border-primary/50' : '',
      });

      items.push({
        icon: <UserPlus className="w-6 h-6 text-primary" />,
        label: 'Join SPAC',
        onClick: () => router.push('/register'),
        className: 'bg-primary/20 border-primary/50',
      });
    }

    return items;
  };

  const dockItems = buildDockItems();

  // For auth pages in minimal variant, show simplified dock
  if (variant === 'minimal') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800">
        <div className="flex items-center justify-center gap-4 py-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm">Home</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">About</span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm">Events</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Dock - fixed at bottom */}
      <nav className="hidden md:block fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Dock
            items={dockItems}
            panelHeight={68}
            baseItemSize={50}
            magnification={70}
            className="bg-neutral-900/90 backdrop-blur-md"
          />
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
              pathname === '/' ? 'text-primary' : 'text-neutral-400 active:text-white'
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Events - important public page */}
          <Link
            href="/events"
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
              isActive('/events') ? 'text-primary' : 'text-neutral-400 active:text-white'
            )}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Events</span>
          </Link>

          {/* Gallery */}
          <Link
            href="/gallery"
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
              isActive('/gallery') ? 'text-primary' : 'text-neutral-400 active:text-white'
            )}
          >
            <Image className="w-5 h-5" />
            <span className="text-[10px] font-medium">Gallery</span>
          </Link>

          {/* Classifieds */}
          <Link
            href="/classifieds"
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
              isActive('/classifieds') ? 'text-primary' : 'text-neutral-400 active:text-white'
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium">Market</span>
          </Link>

          {/* Context-aware last slot */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
                isDashboardSection ? 'text-primary' : 'text-neutral-400 active:text-white'
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[50px]',
                isActive('/login') ? 'text-primary' : 'text-neutral-400 active:text-white'
              )}
            >
              <LogIn className="w-5 h-5" />
              <span className="text-[10px] font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

export default GlobalDock;
