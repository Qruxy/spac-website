/**
 * Event Reminder Processing Engine
 *
 * Finds due reminders (scheduledFor <= now, status = PENDING) and sends
 * personalized emails to all registered attendees for each event.
 */

import { prisma, NOT_COMPANION } from '@/lib/db';
import { sendBulkEmail, renderTemplate } from '@/lib/email';

/** Default email template for event reminders */
function buildGenericReminderEmail(event: {
  title: string;
  startDate: Date;
  endDate: Date;
  locationName: string;
  locationAddress: string | null;
  campingAvailable: boolean;
}, daysBefore: number): { subject: string; html: string } {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/New_York',
  });

  const startDateStr = dateFormatter.format(event.startDate);
  const startTimeStr = timeFormatter.format(event.startDate);

  const urgencyWord = daysBefore === 0
    ? 'Today'
    : daysBefore === 1
      ? 'Tomorrow'
      : `in ${daysBefore} day${daysBefore > 1 ? 's' : ''}`;

  const subject = daysBefore === 0
    ? `Happening Today: ${event.title}`
    : daysBefore === 1
      ? `Reminder: ${event.title} is Tomorrow!`
      : `Reminder: ${event.title} is ${urgencyWord}`;

  const html = `
    <h2 style="color: #60a5fa; margin-bottom: 16px;">Event Reminder</h2>
    <p>Hi {{firstName}},</p>
    <p>This is a friendly reminder that <strong>${event.title}</strong> is ${urgencyWord}!</p>

    <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">📅 Date</td>
          <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right;">${startDateStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">🕐 Time</td>
          <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right;">${startTimeStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">📍 Location</td>
          <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right;">${event.locationName}</td>
        </tr>
        ${event.locationAddress ? `
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">🗺️ Address</td>
          <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right;">${event.locationAddress}</td>
        </tr>` : ''}
        ${event.campingAvailable ? `
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">⛺ Camping</td>
          <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right;">Available</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="color: #94a3b8; font-size: 13px;">
      We look forward to seeing you there! If you can no longer attend, please
      update your registration on the SPAC website.
    </p>

    <p style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXTAUTH_URL || 'https://stpeteastro.org'}/my-events"
         class="btn" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View My Events
      </a>
    </p>
  `;

  return { subject, html };
}

export interface ProcessResult {
  processed: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  details: Array<{
    reminderId: string;
    eventTitle: string;
    daysBefore: number;
    sent: number;
    failed: number;
  }>;
}

/**
 * Process all due reminders. Call this from a cron endpoint or scheduled task.
 */
export async function processReminders(): Promise<ProcessResult> {
  const now = new Date();

  // Find all pending reminders that are due
  const dueReminders = await prisma.eventReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          locationName: true,
          locationAddress: true,
          campingAvailable: true,
          status: true,
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });

  const result: ProcessResult = {
    processed: 0,
    totalEmailsSent: 0,
    totalEmailsFailed: 0,
    details: [],
  };

  for (const reminder of dueReminders) {
    // Skip if event is cancelled or completed
    if (reminder.event.status === 'CANCELLED' || reminder.event.status === 'COMPLETED') {
      await prisma.eventReminder.update({
        where: { id: reminder.id },
        data: { status: 'CANCELLED' },
      });
      continue;
    }

    // Get registered attendees (PENDING or CONFIRMED, not cancelled/no-show)
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: reminder.eventId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        user: NOT_COMPANION,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            name: true,
          },
        },
      },
    });

    if (registrations.length === 0) {
      await prisma.eventReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: now,
          sentCount: 0,
          failedCount: 0,
        },
      });
      result.processed++;
      result.details.push({
        reminderId: reminder.id,
        eventTitle: reminder.event.title,
        daysBefore: reminder.daysBefore,
        sent: 0,
        failed: 0,
      });
      continue;
    }

    // Determine email content
    let subject: string;
    let html: string;

    if (reminder.useGenericTemplate || (!reminder.emailSubject && !reminder.emailBody)) {
      const generic = buildGenericReminderEmail(reminder.event, reminder.daysBefore);
      subject = generic.subject;
      html = generic.html;
    } else {
      subject = reminder.emailSubject || `Reminder: ${reminder.event.title}`;
      html = reminder.emailBody || '';
    }

    // Build recipient list with personalization variables
    const recipients = registrations.map((reg) => ({
      email: reg.user.email,
      userId: reg.user.id,
      variables: {
        firstName: reg.user.firstName || reg.user.name?.split(' ')[0] || 'Member',
        name: reg.user.name || reg.user.firstName || 'Member',
        eventTitle: reminder.event.title,
      },
    }));

    // Send bulk email
    const sendResult = await sendBulkEmail({
      recipients,
      subject,
      html,
      metadata: {
        type: 'event_reminder',
        reminderId: reminder.id,
        eventId: reminder.eventId,
        daysBefore: reminder.daysBefore,
      },
    });

    // Update reminder status
    const finalStatus =
      sendResult.failed === 0
        ? 'SENT'
        : sendResult.sent === 0
          ? 'FAILED'
          : 'PARTIALLY_SENT';

    await prisma.eventReminder.update({
      where: { id: reminder.id },
      data: {
        status: finalStatus as 'SENT' | 'FAILED' | 'PARTIALLY_SENT',
        sentAt: now,
        sentCount: sendResult.sent,
        failedCount: sendResult.failed,
      },
    });

    // Create in-app notifications for attendees
    const notificationData = registrations.map((reg) => ({
      userId: reg.user.id,
      type: 'EVENT_REMINDER' as const,
      title: `Event Reminder: ${reminder.event.title}`,
      body: reminder.daysBefore === 0
        ? `${reminder.event.title} is happening today!`
        : reminder.daysBefore === 1
          ? `${reminder.event.title} is tomorrow!`
          : `${reminder.event.title} is in ${reminder.daysBefore} days`,
      link: '/my-events',
    }));

    await prisma.notification.createMany({ data: notificationData });

    result.processed++;
    result.totalEmailsSent += sendResult.sent;
    result.totalEmailsFailed += sendResult.failed;
    result.details.push({
      reminderId: reminder.id,
      eventTitle: reminder.event.title,
      daysBefore: reminder.daysBefore,
      sent: sendResult.sent,
      failed: sendResult.failed,
    });
  }

  return result;
}
