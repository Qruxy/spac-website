'use client';

/**
 * Site Header
 *
 * Main navigation header with responsive mobile menu.
 * Enhanced with Framer Motion animations and complete page links.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Calendar,
  Image,
  ShoppingBag,
  Users,
  ChevronDown,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Heart,
  Newspaper,
  Star,
  FlaskConical,
  History,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import spacLogo from '../../../public/images/spac-logo-hires.png';

// Primary navigation - shown in header
// membersOnly: true = only rendered when authenticated
const navigation = [
  { name: 'About', href: '/about', icon: Users, membersOnly: false },
  { name: 'Events', href: '/events', icon: Calendar, membersOnly: false },
  { name: 'Gallery', href: '/gallery', icon: Image, membersOnly: false },
  { name: 'Classifieds', href: '/classifieds', icon: ShoppingBag, membersOnly: true },
];

// Additional pages for expanded navigation (mobile menu & dropdown)
const moreLinks = [
  { name: 'VSA', href: '/vsa', icon: GraduationCap, membersOnly: false },
  { name: 'Newsletter', href: '/newsletter', icon: Newspaper, membersOnly: true },
  { name: 'Donations', href: '/donations', icon: Heart, membersOnly: false },
  { name: 'OBS Star Party', href: '/obs', icon: Star, membersOnly: false },
  { name: 'Mirror Lab', href: '/mirror-lab', icon: FlaskConical, membersOnly: false },
  { name: 'History', href: '/history', icon: History, membersOnly: false },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isAuthenticated = status === 'authenticated';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <NextImage
              src={spacLogo}
              alt="SPAC"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold hidden sm:inline">SPAC</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navigation.filter(item => !item.membersOnly || isAuthenticated).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors',
                  pathname.startsWith(item.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={cn(
                  'flex items-center gap-1 text-sm font-medium transition-colors',
                  moreLinks.filter(link => !link.membersOnly || isAuthenticated).some(link => pathname.startsWith(link.href))
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                More
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  moreMenuOpen && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMoreMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card/95 backdrop-blur-lg shadow-lg z-20 overflow-hidden"
                    >
                      <div className="py-2">
                        {moreLinks.filter(link => !link.membersOnly || isAuthenticated).map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                              pathname.startsWith(link.href)
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <link.icon className="h-4 w-4" />
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex md:items-center md:gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">
                      {session.user.name?.split(' ')[0] || 'Member'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card shadow-lg z-20">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Join SPAC
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden rounded-md p-2 text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation with Framer Motion */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 top-16 bg-background/80 backdrop-blur-md z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="md:hidden absolute left-0 right-0 top-16 bg-background/95 backdrop-blur-lg border-b border-border shadow-xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <div className="container mx-auto px-4 py-4">
                  {/* Auth Section — First for easy access */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0 }}
                    className="pb-4 mb-4 border-b border-border space-y-2"
                  >
                    {isAuthenticated ? (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                          <LogIn className="h-5 w-5" />
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-center text-base font-medium min-h-[48px] text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-colors"
                        >
                          Join SPAC
                        </Link>
                      </>
                    )}
                  </motion.div>

                  {/* Primary Navigation */}
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] transition-colors',
                        pathname === '/'
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted active:bg-muted/80'
                      )}
                    >
                      <span className="text-lg">🏠</span>
                      Home
                    </Link>
                    {navigation.filter(item => !item.membersOnly || isAuthenticated).map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] transition-colors',
                            pathname.startsWith(item.href)
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted active:bg-muted/80'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Additional Links */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 pt-4 border-t border-border/50 space-y-1"
                  >
                    <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      More
                    </p>
                    {moreLinks.filter(link => !link.membersOnly || isAuthenticated).map((link, index) => (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium min-h-[48px] transition-colors',
                            pathname.startsWith(link.href)
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted active:bg-muted/80'
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
