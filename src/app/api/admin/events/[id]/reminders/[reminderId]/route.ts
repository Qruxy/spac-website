export const dynamic = 'force-dynamic';

/**
 * Single Event Reminder API
 *
 * Update or delete an individual reminder.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../../../utils';

interface RouteParams {
  params: Promise<{ id: string; reminderId: string }>;
}

// PUT /api/admin/events/[id]/reminders/[reminderId] - Update reminder
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id, reminderId } = await params;
    const body = await request.json();

    const existing = await prisma.eventReminder.findFirst({
      where: { id: reminderId, eventId: id },
      include: { event: { select: { startDate: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    if (existing.status === 'SENT' || existing.status === 'PARTIALLY_SENT') {
      return NextResponse.json(
        { error: 'Cannot edit a reminder that has already been sent' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.emailSubject !== undefined) updateData.emailSubject = body.emailSubject || null;
    if (body.emailBody !== undefined) updateData.emailBody = body.emailBody || null;
    if (body.useGenericTemplate !== undefined) updateData.useGenericTemplate = body.useGenericTemplate;

    if (body.daysBefore !== undefined && body.daysBefore !== existing.daysBefore) {
      updateData.daysBefore = body.daysBefore;
      const scheduledFor = new Date(existing.event.startDate);
      scheduledFor.setDate(scheduledFor.getDate() - body.daysBefore);
      scheduledFor.setUTCHours(14, 0, 0, 0);
      updateData.scheduledFor = scheduledFor;
    }

    if (body.status === 'CANCELLED') {
      updateData.status = 'CANCELLED';
    }

    const updated = await prisma.eventReminder.update({
      where: { id: reminderId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id]/reminders/[reminderId] - Delete reminder
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id, reminderId } = await params;

    const existing = await prisma.eventReminder.findFirst({
      where: { id: reminderId, eventId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    if (existing.status === 'SENT' || existing.status === 'PARTIALLY_SENT') {
      return NextResponse.json(
        { error: 'Cannot delete a reminder that has already been sent' },
        { status: 400 }
      );
    }

    await prisma.eventReminder.delete({
      where: { id: reminderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}
