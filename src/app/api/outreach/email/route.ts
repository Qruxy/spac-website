/**
 * Outreach Committee Email API
 *
 * POST - Send email to selected outreach committee members via SES
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only officers and committee members can send emails
    const isOfficer = ['ADMIN', 'MODERATOR'].includes(session.user.role);
    const isCommitteeMember = await prisma.outreachCommitteeMember.findUnique({
      where: { userId: session.user.id },
    });

    if (!isOfficer && !isCommitteeMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { memberIds, subject, body: emailBody } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 });
    }
    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Resolve committee member emails
    const members = await prisma.outreachCommitteeMember.findMany({
      where: { id: { in: memberIds }, isActive: true },
    });

    const userIds = members.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Send individually (preserves reply-to and per-recipient personalisation)
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      const html = emailBody
        .replace(/{{firstName}}/g, user.firstName)
        .replace(/{{lastName}}/g, user.lastName)
        .replace(/{{email}}/g, user.email);

      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        recipientUserId: user.id,
        metadata: { source: 'outreach-committee', sentBy: session.user.email },
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error) errors.push(result.error);
      }

      // Avoid SES rate limit
      await new Promise((r) => setTimeout(r, 120));
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: users.length,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('Outreach email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
