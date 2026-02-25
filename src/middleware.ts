/**
 * Next.js Edge Middleware
 *
 * Provides defence-in-depth route protection at the edge layer.
 * Auth is also checked at the layout/page level — this is an additional safety net.
 *
 * Protected path groups:
 *   /admin/*     — requires active session (ADMIN enforced at layout + API level)
 *   /dashboard   — requires active session
 *   /profile, /settings, /billing, /family, /badges, etc. — dashboard routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/settings',
  '/billing',
  '/family',
  '/badges',
  '/my-events',
  '/my-listings',
  '/my-offers',
  '/my-photos',
  '/membership-card',
  '/notifications',
  '/messages',
  '/leadership',
  '/outreach',
  '/obs-admin',
  // Members-only public content
  '/newsletter',
  '/classifieds',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes additionally require ADMIN role
  if (
    (pathname === '/admin' || pathname.startsWith('/admin/')) &&
    token.role !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - /api/*        (API routes handle their own auth)
     * - public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|fonts/|icons/).*)',
  ],
};
