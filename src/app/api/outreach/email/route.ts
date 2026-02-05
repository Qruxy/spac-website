/**
 * Outreach Committee Email API
 * 
 * POST - Send email to selected committee members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

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

    // Get member emails
    const members = await prisma.outreachCommitteeMember.findMany({
      where: {
        id: { in: memberIds },
        isActive: true,
      },
    });

    const userIds = members.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true, firstName: true, lastName: true },
    });

    const emails = users.map((u) => u.email);

    // In production, integrate with email service (SES, SendGrid, etc.)
    // For now, log the email details
    console.log('=== Outreach Committee Email ===');
    console.log('From:', session.user.email);
    console.log('To:', emails.join(', '));
    console.log('Subject:', subject);
    console.log('Body:', emailBody);
    console.log('================================');

    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: emails,
    //   from: process.env.OUTREACH_EMAIL || 'outreach@spac.org',
    //   replyTo: session.user.email,
    //   subject,
    //   text: emailBody,
    // });

    return NextResponse.json({ 
      success: true, 
      message: `Email queued for ${emails.length} recipients`,
      recipients: emails.length,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
