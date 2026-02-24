export const dynamic = 'force-dynamic';
/**
 * User Registration API
 *
 * Creates a new account OR claims an existing migrated account.
 * Migrated users (no passwordHash) can claim by verifying first+last name.
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max registration attempts per IP per window

async function checkRateLimit(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const attempts = await prisma.auditLog.count({
    where: {
      action: 'CREATE',
      entityType: 'RegisterAttempt',
      ipAddress: ip,
      createdAt: { gte: since },
    },
  });
  return attempts < RATE_LIMIT_MAX;
}

async function recordAttempt(ip: string) {
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'RegisterAttempt',
      entityId: 'rate-limit',
      ipAddress: ip,
    },
  }).catch(() => { /* non-fatal */ });
}

export async function POST(request: Request) {
  try {
    // IP-based rate limiting (works across Lambda instances via shared DB)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait 15 minutes and try again.' },
        { status: 429 }
      );
    }

    await recordAttempt(ip);

    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // If user already has a password, they're fully registered
      if (existingUser.passwordHash) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }

      // Migrated user without password — verify identity by name match
      const firstMatch = existingUser.firstName.toLowerCase().trim() === firstName.toLowerCase().trim();
      const lastMatch = existingUser.lastName.toLowerCase().trim() === lastName.toLowerCase().trim();

      if (!firstMatch || !lastMatch) {
        return NextResponse.json(
          { error: 'The name you entered does not match our records for this email. Please use the name associated with your SPAC membership.' },
          { status: 403 }
        );
      }

      // Name matches — set their password (claim the account)
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      return NextResponse.json({ user, claimed: true }, { status: 200 });
    }

    // New user — create account (no membership until payment)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        passwordHash,
        role: 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({ user, claimed: false }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
