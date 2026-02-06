'use client';

/**
 * Dock Navigation
 *
 * macOS-style dock navigation that floats at the bottom of the page.
 * Uses reactbits Dock for desktop, mobile-friendly bar for mobile.
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
} from 'lucide-react';
import Dock, { type DockItemData } from '@/components/Dock';
import { cn } from '@/lib/utils';
import spacLogo from '../../../public/images/spac-logo.png';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'About', href: '/about', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Gallery', href: '/gallery', icon: Image },
  { name: 'Classifieds', href: '/classifieds', icon: ShoppingBag },
];

export function DockNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Build dock items for desktop
  const dockItems: DockItemData[] = [
    // Navigation items
    ...navigation.map((item) => ({
      icon: (
        <item.icon
          className={cn(
            'w-6 h-6',
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              ? 'text-primary'
              : 'text-white'
          )}
        />
      ),
      label: item.name,
      onClick: () => router.push(item.href),
      className: cn(
        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          ? 'border-primary/50'
          : ''
      ),
    })),
    // Auth items
    ...(isAuthenticated
      ? [
          {
            icon: <LayoutDashboard className="w-6 h-6 text-white" />,
            label: 'Dashboard',
            onClick: () => router.push('/dashboard'),
          },
          {
            icon: <LogOut className="w-6 h-6 text-white" />,
            label: 'Sign Out',
            onClick: () => signOut({ callbackUrl: '/' }),
          },
        ]
      : [
          {
            icon: <LogIn className="w-6 h-6 text-white" />,
            label: 'Sign In',
            onClick: () => router.push('/login'),
          },
          {
            icon: <UserPlus className="w-6 h-6 text-primary" />,
            label: 'Join SPAC',
            onClick: () => router.push('/register'),
            className: 'bg-primary/20 border-primary/50',
          },
        ]),
  ];

  return (
    <>
      {/* Minimal Top Bar with Logo only */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <NextImage
              src={spacLogo}
              alt="SPAC"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="text-lg font-bold">SPAC</span>
          </Link>
          {/* Show user initial on desktop when authenticated */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>
      </header>

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

      {/* Mobile Bottom Nav - simpler fixed bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
                  isActive
                    ? 'text-primary'
                    : 'text-neutral-400 active:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          {/* Auth button on mobile */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
                pathname.startsWith('/dashboard')
                  ? 'text-primary'
                  : 'text-neutral-400 active:text-white'
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-neutral-400 active:text-white"
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

export default DockNav;
