/**
 * Forgot Password API
 *
 * Generates a secure password reset token, stores it in verification_tokens,
 * and sends a reset link via email.
 *
 * Always returns 200 to avoid leaking whether an email is registered.
 * Only works for accounts using bcrypt auth (passwordHash set).
 * Cognito-only accounts (admins who never set a local password) are told to contact support.
 */

import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const attempts = await prisma.auditLog.count({
    where: {
      action: 'CREATE',
      entityType: 'ForgotPasswordAttempt',
      ipAddress: ip,
      createdAt: { gte: since },
    },
  });
  return attempts < RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 15 minutes and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Log attempt (for rate limiting) — do this before looking up user
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ForgotPasswordAttempt',
        entityId: email,
        ipAddress: ip,
      },
    }).catch(() => {});

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, passwordHash: true, cognitoId: true },
    });

    // Always return success to avoid leaking user existence
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Cognito-only users (no local password) can't use this flow
    if (!user.passwordHash && user.cognitoId) {
      // Still send a generic email explaining they should contact support
      await sendEmail({
        to: user.email,
        subject: 'SPAC – Password Reset Request',
        html: `
          <p>Hi ${user.firstName},</p>
          <p>We received a password reset request for your SPAC account.</p>
          <p>Your account uses a different sign-in method that cannot be reset here. Please contact <a href="mailto:info@stpeteastronomyclub.org">info@stpeteastronomyclub.org</a> for assistance.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
        recipientUserId: user.id,
      }).catch(() => {});
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);
    const identifier = `password-reset:${email}`;

    // Upsert token (one reset token per email at a time)
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token: tokenHash, expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://main.dw31ke605du7u.amplifyapp.com';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: user.email,
      subject: 'SPAC – Reset Your Password',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#60a5fa;margin:0;font-size:22px;">St. Petersburg Astronomy Club</h1>
          </div>
          <h2 style="margin-top:0;">Reset Your Password</h2>
          <p>Hi ${user.firstName},</p>
          <p>We received a request to reset the password for your SPAC account. Click the button below to choose a new password.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
          <p style="color:#94a3b8;font-size:13px;">Or copy this URL into your browser:<br/><a href="${resetUrl}" style="color:#60a5fa;word-break:break-all;">${resetUrl}</a></p>
          <hr style="border:none;border-top:1px solid #334155;margin:32px 0;"/>
          <p style="color:#64748b;font-size:12px;text-align:center;">St. Petersburg Astronomy Club · St. Petersburg, FL</p>
        </div>
      `,
      text: `Reset your SPAC password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      recipientUserId: user.id,
    }).catch((e) => console.error('[forgot-password] email send failed:', e));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[forgot-password] error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
