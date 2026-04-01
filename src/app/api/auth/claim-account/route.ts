/**
 * Claim Account API
 *
 * First-time setup flow for imported SPAC members.
 * Sends a "set up your account" email with a one-time link.
 * Reuses the same verification_tokens table as forgot-password,
 * so the /reset-password page handles both flows.
 */

import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (more time for first setup)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, cognitoId: true, passwordHash: true },
    });

    // Always return success — don't reveal whether email is registered
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Cognito-only admins can't claim via this flow
    if (!user.passwordHash && user.cognitoId) {
      await sendEmail({
        to: user.email,
        subject: 'SPAC – Account Setup',
        html: `<p>Hi ${user.firstName},</p><p>Your SPAC admin account is managed separately. Please contact <a href="mailto:admin@stpeteastronomyclub.org">admin@stpeteastronomyclub.org</a> for access.</p>`,
        recipientUserId: user.id,
      }).catch(() => {});
      return NextResponse.json({ success: true });
    }

    // Generate setup token (same mechanism as password reset)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);
    const identifier = `password-reset:${email}`;

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token: tokenHash, expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.stpeteastronomyclub.org';
    const setupUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}&setup=1`;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to SPAC – Set Up Your Account',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#60a5fa;margin:0;font-size:22px;">St. Petersburg Astronomy Club</h1>
            <p style="color:#94a3b8;margin:8px 0 0;">Founded 1927 · Tampa Bay's Home for Family Astronomy</p>
          </div>
          <h2 style="margin-top:0;">Welcome, ${user.firstName}! 👋</h2>
          <p>Your SPAC membership account is ready. Click the button below to set your password and get access to your member dashboard — events, your membership card, and more.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${setupUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Set Up My Account →</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">This link is valid for 24 hours. If you didn't request this, you can ignore this email.</p>
          <p style="color:#94a3b8;font-size:13px;">Or paste this URL into your browser:<br/><a href="${setupUrl}" style="color:#60a5fa;word-break:break-all;">${setupUrl}</a></p>
          <hr style="border:none;border-top:1px solid #334155;margin:32px 0;"/>
          <p style="color:#64748b;font-size:12px;text-align:center;">St. Petersburg Astronomy Club · St. Petersburg, FL · <a href="https://www.stpeteastronomyclub.org" style="color:#64748b;">stpeteastronomyclub.org</a></p>
        </div>
      `,
      text: `Welcome to SPAC, ${user.firstName}!\n\nSet up your account here: ${setupUrl}\n\nThis link is valid for 24 hours.`,
      recipientUserId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[claim-account] error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
