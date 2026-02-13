export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const targetId = params.id;

  // Get the requesting user's family info
  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true, family_role: true },
  });

  if (!requestingUser?.familyId) {
    return NextResponse.json(
      { error: 'You do not belong to a family' },
      { status: 403 }
    );
  }

  // Get the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, familyId: true, family_role: true },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Member not found' },
      { status: 404 }
    );
  }

  // Verify the target belongs to the same family
  if (targetUser.familyId !== requestingUser.familyId) {
    return NextResponse.json(
      { error: 'Member does not belong to your family' },
      { status: 403 }
    );
  }

  // Cannot remove the primary member
  if (targetUser.family_role === 'PRIMARY') {
    return NextResponse.json(
      { error: 'Cannot remove the primary family member' },
      { status: 400 }
    );
  }

  // Delete the target's membership first (foreign key constraint), then the user
  await prisma.membership.deleteMany({
    where: { userId: targetId },
  });

  await prisma.user.delete({
    where: { id: targetId },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const targetId = params.id;

  // Get the requesting user's family info
  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });

  if (!requestingUser?.familyId) {
    return NextResponse.json(
      { error: 'You do not belong to a family' },
      { status: 403 }
    );
  }

  // Get the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, familyId: true },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Member not found' },
      { status: 404 }
    );
  }

  // Verify the target belongs to the same family
  if (targetUser.familyId !== requestingUser.familyId) {
    return NextResponse.json(
      { error: 'Member does not belong to your family' },
      { status: 403 }
    );
  }

  // Parse and validate the request body
  let body: { firstName?: string; lastName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { firstName, lastName } = body;

  if (!firstName && !lastName) {
    return NextResponse.json(
      { error: 'At least one of firstName or lastName is required' },
      { status: 400 }
    );
  }

  const data: Record<string, string> = {};
  if (firstName) data.firstName = firstName.trim();
  if (lastName) data.lastName = lastName.trim();

  // Update the concatenated name field as well
  if (firstName || lastName) {
    const current = await prisma.user.findUnique({
      where: { id: targetId },
      select: { firstName: true, lastName: true },
    });
    const newFirst = data.firstName ?? current?.firstName ?? '';
    const newLast = data.lastName ?? current?.lastName ?? '';
    data.name = `${newFirst} ${newLast}`.trim();
  }

  const updatedMember = await prisma.user.update({
    where: { id: targetId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      family_role: true,
      qrUuid: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    member: {
      id: updatedMember.id,
      firstName: updatedMember.firstName,
      lastName: updatedMember.lastName,
      familyRole: updatedMember.family_role,
      qrUuid: updatedMember.qrUuid,
      createdAt: updatedMember.createdAt,
    },
  });
}
