/**
 * Admin Communications API
 *
 * POST - Send email to members (supports filters, templates, bulk send)
 * GET  - Get email send history
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendBulkEmail, renderTemplate } from '@/lib/email';
import { notifyAdminAnnouncement } from '@/lib/notifications';

// GET /api/admin/communications - Get email history
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: { select: { name: true } },
          recipientUser: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Communications history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST /api/admin/communications - Send email to members
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, html, templateId, recipientFilter, sendNotification } = body as {
      subject: string;
      html: string;
      templateId?: string;
      recipientFilter?: {
        roles?: string[];
        membershipTypes?: string[];
        membershipStatuses?: string[];
        all?: boolean;
      };
      sendNotification?: boolean;
    };

    if (!subject || !html) {
      return NextResponse.json({ error: 'Subject and HTML body are required' }, { status: 400 });
    }

    // Build recipient query
    const userWhere: Record<string, unknown> = {};

    if (recipientFilter && !recipientFilter.all) {
      if (recipientFilter.roles?.length) {
        userWhere.role = { in: recipientFilter.roles };
      }
      if (recipientFilter.membershipTypes?.length || recipientFilter.membershipStatuses?.length) {
        const membershipFilter: Record<string, unknown> = {};
        if (recipientFilter.membershipTypes?.length) {
          membershipFilter.type = { in: recipientFilter.membershipTypes };
        }
        if (recipientFilter.membershipStatuses?.length) {
          membershipFilter.status = { in: recipientFilter.membershipStatuses };
        }
        userWhere.membership = membershipFilter;
      }
    }

    // Fetch recipients
    const recipients = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients match the filter' }, { status: 400 });
    }

    // If using a template, fetch it
    let finalHtml = html;
    let finalSubject = subject;

    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalHtml = template.body;
        finalSubject = template.subject;
      }
    }

    // Send bulk email
    const result = await sendBulkEmail({
      recipients: recipients.map((r) => ({
        email: r.email,
        userId: r.id,
        variables: {
          firstName: r.firstName,
          lastName: r.lastName,
          name: r.name || `${r.firstName} ${r.lastName}`,
          email: r.email,
        },
      })),
      subject: finalSubject,
      html: finalHtml,
      templateId,
    });

    // Also create in-app notifications if requested
    if (sendNotification) {
      await notifyAdminAnnouncement(
        recipients.map((r) => r.id),
        finalSubject,
        finalHtml.replace(/<[^>]+>/g, '').slice(0, 200),
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    console.error('Send communication error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
