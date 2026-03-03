/**
 * Reset Password API
 *
 * Validates the reset token and updates the user's passwordHash.
 * Token is stored as a SHA-256 hash; raw token comes from the URL.
 */

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, password } = body as {
      token?: string;
      email?: string;
      password?: string;
    };

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const identifier = `password-reset:${normalizedEmail}`;

    // Look up token
    const record = await prisma.verificationToken.findFirst({
      where: { identifier, token: tokenHash },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true, cognitoId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (!user.passwordHash && user.cognitoId) {
      return NextResponse.json(
        { error: 'This account cannot be reset here. Please contact support.' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete used token (and any extras for this identifier)
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[reset-password] error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
