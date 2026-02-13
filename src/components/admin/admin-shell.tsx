'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingBag,
  Image as ImageIcon,
  Award,
  Mail,
  Menu,
  X,
  Home,
  LogOut,
  ChevronRight,
  User,
  Star,
  Trophy,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Members', href: '/admin/members', icon: Users, exact: false },
  { name: 'Events', href: '/admin/events', icon: Calendar, exact: false },
  { name: 'Listings', href: '/admin/listings', icon: ShoppingBag, exact: false },
  { name: 'Media', href: '/admin/media', icon: ImageIcon, exact: false },
  { name: 'Board', href: '/admin/board', icon: Award, exact: false },
  { name: 'Badges', href: '/admin/badges', icon: Trophy, exact: false },
  { name: 'Email', href: '/admin/communications', icon: Mail, exact: false },
  { name: 'OBS Event', href: '/admin/obs', icon: Star, exact: false },
] as const;

interface AdminShellProps {
  user: { name: string | null; role: string };
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const currentPage =
    navItems.find((item) => isActive(item.href, item.exact))?.name || 'Admin';

  return (
    <div className="min-h-screen bg-[#060611]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0a0a1a]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06]">
          <img src="/images/spac-logo.png" alt="SPAC" className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-white tracking-wide">SPAC</p>
            <p className="text-[10px] text-blue-400/70 uppercase tracking-[0.15em]">
              Admin Panel
            </p>
          </div>
          <button
            className="ml-auto md:hidden text-white/40 hover:text-white p-1"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em]">
            Manage
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-blue-500/[0.12] text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                }`}
              >
                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    active ? 'text-blue-400' : ''
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {active && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
          >
            <User className="h-[18px] w-[18px]" />
            My Profile
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all"
          >
            <Home className="h-[18px] w-[18px]" />
            Back to Site
          </Link>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/30 hover:text-red-400/70 hover:bg-red-500/[0.05] transition-all"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-[#060611]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-white/50 hover:text-white p-1 -ml-1"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-white/90">
              {currentPage}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white/80">{user.name}</p>
              <p className="text-[10px] text-blue-400/60 uppercase tracking-wider">
                {user.role}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/25 to-blue-600/15 ring-1 ring-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
