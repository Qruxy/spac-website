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

export async function POST(request: Request) {
  try {
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

    // New user — create account with FREE membership
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        passwordHash,
        role: 'MEMBER',
        membership: {
          create: {
            type: 'FREE',
            status: 'ACTIVE',
            startDate: new Date(),
          },
        },
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
