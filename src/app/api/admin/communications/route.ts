/**
 * Admin Communications API
 *
 * POST - Send email to members (supports filters, templates, bulk send)
 * GET  - Get email send history
 */

import { NextResponse } from 'next/server';
import { prisma, NOT_COMPANION } from '@/lib/db';
import { requireAdmin } from '../utils';
import { sendBulkEmail, renderTemplate } from '@/lib/email';
import { notifyAdminAnnouncement } from '@/lib/notifications';

// GET /api/admin/communications - Get email history
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

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
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

    const body = await request.json();
    const { subject, html, templateId, recipientFilter, sendNotification, manualEmails } = body as {
      subject: string;
      html: string;
      templateId?: string;
      recipientFilter?: {
        roles?: string[];
        membershipTypes?: string[];
        membershipStatuses?: string[];
        groupIds?: string[];
        all?: boolean;
      };
      sendNotification?: boolean;
      manualEmails?: string[];
    };

    if (!subject || !html) {
      return NextResponse.json({ error: 'Subject and HTML body are required' }, { status: 400 });
    }

    // Collect recipients from filters
    type Recipient = { id?: string; email: string; firstName: string; lastName: string; name: string | null };
    const allRecipients: Recipient[] = [];
    const seenEmails = new Set<string>();

    // Manual email addresses
    if (manualEmails?.length) {
      for (const email of manualEmails) {
        const trimmed = email.trim().toLowerCase();
        if (trimmed && !seenEmails.has(trimmed)) {
          seenEmails.add(trimmed);
          allRecipients.push({ email: trimmed, firstName: '', lastName: '', name: trimmed });
        }
      }
    }

    // Group members
    if (recipientFilter?.groupIds?.length) {
      const groupMembers = await prisma.memberGroupMembership.findMany({
        where: { groupId: { in: recipientFilter.groupIds } },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, name: true } },
        },
      });
      for (const gm of groupMembers) {
        if (gm.user.email.includes('+companion@')) continue;
        if (!seenEmails.has(gm.user.email.toLowerCase())) {
          seenEmails.add(gm.user.email.toLowerCase());
          allRecipients.push(gm.user);
        }
      }
    }

    // Role/membership filters or all
    const hasRoleOrMembershipFilter = recipientFilter &&
      (recipientFilter.all || recipientFilter.roles?.length || recipientFilter.membershipTypes?.length || recipientFilter.membershipStatuses?.length);

    if (hasRoleOrMembershipFilter) {
      const userWhere: Record<string, unknown> = {};

      if (!recipientFilter!.all) {
        if (recipientFilter!.roles?.length) {
          userWhere.role = { in: recipientFilter!.roles };
        }
        if (recipientFilter!.membershipTypes?.length || recipientFilter!.membershipStatuses?.length) {
          const membershipFilter: Record<string, unknown> = {};
          if (recipientFilter!.membershipTypes?.length) {
            membershipFilter.type = { in: recipientFilter!.membershipTypes };
          }
          if (recipientFilter!.membershipStatuses?.length) {
            membershipFilter.status = { in: recipientFilter!.membershipStatuses };
          }
          userWhere.membership = membershipFilter;
        }
      }

      const users = await prisma.user.findMany({
        where: { ...NOT_COMPANION, ...userWhere },
        select: { id: true, email: true, firstName: true, lastName: true, name: true },
      });

      for (const u of users) {
        if (!seenEmails.has(u.email.toLowerCase())) {
          seenEmails.add(u.email.toLowerCase());
          allRecipients.push(u);
        }
      }
    }

    if (allRecipients.length === 0) {
      return NextResponse.json({ error: 'No recipients match the filter' }, { status: 400 });
    }

    const recipients = allRecipients;

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
        recipients.map((r) => r.id).filter((id): id is string => !!id),
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
