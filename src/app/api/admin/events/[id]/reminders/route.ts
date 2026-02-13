export const dynamic = 'force-dynamic';

/**
 * Event Reminders API
 *
 * CRUD for email reminders tied to a specific event.
 * Admins can set up reminders that fire N days before the event start date.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/events/[id]/reminders - List reminders for an event
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, startDate: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const reminders = await prisma.eventReminder.findMany({
      where: { eventId: id },
      orderBy: { daysBefore: 'desc' },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ event, reminders });
  } catch (error) {
    console.error('Fetch reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// POST /api/admin/events/[id]/reminders - Create reminder(s)
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, startDate: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Support both single reminder and batch (presets)
    const items: Array<{
      daysBefore: number;
      emailSubject?: string;
      emailBody?: string;
      useGenericTemplate?: boolean;
    }> = Array.isArray(body.reminders) ? body.reminders : [body];

    const created = [];

    for (const item of items) {
      const { daysBefore, emailSubject, emailBody, useGenericTemplate } = item;

      if (daysBefore === undefined || daysBefore < 0) {
        continue;
      }

      // Calculate scheduled send time: event start minus N days, at 9:00 AM ET
      const scheduledFor = new Date(event.startDate);
      scheduledFor.setDate(scheduledFor.getDate() - daysBefore);
      // Set to 9:00 AM in the event's timezone (approx — ET is UTC-5)
      scheduledFor.setUTCHours(14, 0, 0, 0); // 9 AM ET = 14:00 UTC

      // Skip if scheduled time is in the past
      if (scheduledFor <= new Date()) {
        continue;
      }

      // Check for duplicate (same event + same daysBefore)
      const existing = await prisma.eventReminder.findFirst({
        where: {
          eventId: id,
          daysBefore,
          status: { not: 'CANCELLED' },
        },
      });

      if (existing) {
        continue; // Skip duplicates silently
      }

      const reminder = await prisma.eventReminder.create({
        data: {
          eventId: id,
          daysBefore,
          scheduledFor,
          emailSubject: emailSubject || null,
          emailBody: emailBody || null,
          useGenericTemplate: useGenericTemplate ?? !emailSubject,
          createdById: auth.userId!,
        },
      });

      created.push(reminder);
    }

    return NextResponse.json({
      created: created.length,
      reminders: created,
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id]/reminders - Delete or cancel reminders
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { reminderIds } = body as { reminderIds: string[] };

    if (!reminderIds || !Array.isArray(reminderIds)) {
      return NextResponse.json(
        { error: 'Missing reminderIds array' },
        { status: 400 }
      );
    }

    // Only allow deleting reminders that belong to this event and aren't already sent
    const deleted = await prisma.eventReminder.deleteMany({
      where: {
        id: { in: reminderIds },
        eventId: id,
        status: { in: ['PENDING', 'CANCELLED'] },
      },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error('Delete reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminders' },
      { status: 500 }
    );
  }
}
