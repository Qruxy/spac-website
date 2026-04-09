export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/memberships/remind
 * Send renewal reminder emails to a group of members.
 * body: { group: 'upcoming30' | 'thisMonth' | 'expired30', customMessage?: string }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM ?? 'SPAC <noreply@stpeteastronomyclub.org>';

function dateRange(group: string) {
  const now    = new Date();
  const DAY    = 24 * 60 * 60 * 1000;
  if (group === 'upcoming30') {
    // Expiring in next 30 days — still active
    return {
      status: 'ACTIVE' as const,
      paypalCurrentPeriodEnd: { gte: now, lte: new Date(now.getTime() + 30 * DAY) },
    };
  }
  if (group === 'thisMonth') {
    // Expiring this calendar month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      status: 'ACTIVE' as const,
      paypalCurrentPeriodEnd: { gte: start, lte: end },
    };
  }
  if (group === 'expired30') {
    // Expired in last 30 days
    return {
      status: 'EXPIRED' as const,
      paypalCurrentPeriodEnd: { gte: new Date(now.getTime() - 30 * DAY), lte: now },
    };
  }
  return null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { group, customMessage } = (await request.json()) as {
    group: string;
    customMessage?: string;
  };

  const where = dateRange(group);
  if (!where) return NextResponse.json({ error: 'Invalid group' }, { status: 400 });

  try {
    const memberships = await prisma.membership.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No members in this group' });
    }

    const RENEWAL_URL = 'https://www.stpeteastronomyclub.org/membership';

    const groupLabels: Record<string, string> = {
      upcoming30: 'Your SPAC membership expires soon',
      thisMonth:  'Your SPAC membership expires this month',
      expired30:  'Your SPAC membership has expired',
    };

    const subject = groupLabels[group] ?? 'SPAC Membership Renewal Reminder';

    let sent = 0;
    const errors: string[] = [];

    for (const m of memberships) {
      const firstName = m.user.firstName || m.user.lastName || 'Member';
      const expires   = m.paypalCurrentPeriodEnd
        ? new Date(m.paypalCurrentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'soon';

      const body = customMessage
        ? `<p>${customMessage.replace(/\n/g, '<br>')}</p>`
        : group === 'expired30'
          ? `<p>Your SPAC membership expired on <strong>${expires}</strong>. We'd love to have you back!</p>
             <p>Renewing your membership ensures you continue to enjoy member benefits, event access, and our community.</p>`
          : `<p>Your SPAC membership expires on <strong>${expires}</strong>.</p>
             <p>Renew now to maintain uninterrupted access to member benefits, events, and our community.</p>`;

      try {
        await resend.emails.send({
          from: FROM,
          to:   m.user.email,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1a1a2e;padding:24px 32px;text-align:center">
                <h2 style="color:#a78bfa;margin:0">St. Petersburg Astronomy Club</h2>
              </div>
              <div style="padding:32px">
                <p>Dear ${firstName},</p>
                ${body}
                <a href="${RENEWAL_URL}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                  Renew My Membership
                </a>
                <p style="color:#666;font-size:14px">Questions? Reply to this email or visit <a href="https://www.stpeteastronomyclub.org">stpeteastronomyclub.org</a></p>
              </div>
              <div style="background:#f5f5f5;padding:16px 32px;text-align:center">
                <p style="color:#888;font-size:12px;margin:0">St. Petersburg Astronomy Club · St. Petersburg, FL</p>
              </div>
            </div>
          `,
        });
        sent++;
      } catch (e) {
        errors.push(`${m.user.email}: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    return NextResponse.json({
      sent,
      total:  memberships.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    console.error('Remind error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
