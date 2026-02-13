export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Verify user has a FAMILY membership
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership || membership.type !== 'FAMILY') {
    return NextResponse.json(
      { error: 'Family membership required' },
      { status: 403 }
    );
  }

  // Get the user to check their familyId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });

  if (!user?.familyId) {
    // User has FAMILY membership but hasn't created a family yet
    return NextResponse.json({
      family: null,
      members: [],
      maxMembers: 5,
    });
  }

  // Fetch the family and all its members
  const family = await prisma.family.findUnique({
    where: { id: user.familyId },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          family_role: true,
          qrUuid: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!family) {
    return NextResponse.json({
      family: null,
      members: [],
      maxMembers: 5,
    });
  }

  return NextResponse.json({
    family: { id: family.id, name: family.name },
    members: family.members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      familyRole: m.family_role,
      qrUuid: m.qrUuid,
      createdAt: m.createdAt,
    })),
    maxMembers: 5,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Verify user has a FAMILY membership
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership || membership.type !== 'FAMILY') {
    return NextResponse.json(
      { error: 'Family membership required' },
      { status: 403 }
    );
  }

  // Get the current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      lastName: true,
      familyId: true,
      family_role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // If user already has a family, verify they are the PRIMARY member
  if (user.familyId && user.family_role !== 'PRIMARY') {
    return NextResponse.json(
      { error: 'Only the primary family member can add members' },
      { status: 403 }
    );
  }

  // Parse and validate the request body
  let body: { firstName?: string; lastName?: string; familyRole?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { firstName, lastName, familyRole } = body;

  if (!firstName || !lastName || !familyRole) {
    return NextResponse.json(
      { error: 'firstName, lastName, and familyRole are required' },
      { status: 400 }
    );
  }

  const validRoles = ['SPOUSE', 'CHILD', 'OTHER'] as const;
  if (!validRoles.includes(familyRole as (typeof validRoles)[number])) {
    return NextResponse.json(
      { error: 'familyRole must be SPOUSE, CHILD, or OTHER' },
      { status: 400 }
    );
  }

  let familyId = user.familyId;

  // If no family exists yet, create one and assign the primary user
  if (!familyId) {
    const family = await prisma.family.create({
      data: {
        name: `${user.lastName} Family`,
      },
    });

    familyId = family.id;

    // Update the primary user to belong to this family
    await prisma.user.update({
      where: { id: userId },
      data: {
        familyId: family.id,
        family_role: 'PRIMARY',
      },
    });
  }

  // Check current member count (including primary)
  const currentMemberCount = await prisma.user.count({
    where: { familyId },
  });

  if (currentMemberCount >= 5) {
    return NextResponse.json(
      { error: 'Family member limit reached (maximum 5 members including primary)' },
      { status: 400 }
    );
  }

  // Create a placeholder email for the family member
  const placeholderEmail = `family-${crypto.randomUUID().slice(0, 8)}@internal.spac`;

  // Create the new family member user record
  const newMember = await prisma.user.create({
    data: {
      email: placeholderEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      role: 'MEMBER',
      isValidated: true,
      isPrimaryMember: false,
      familyId,
      family_role: familyRole as 'SPOUSE' | 'CHILD' | 'OTHER',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      family_role: true,
      qrUuid: true,
      createdAt: true,
    },
  });

  // Create a membership record mirroring the primary's
  await prisma.membership.create({
    data: {
      userId: newMember.id,
      type: 'FAMILY',
      status: membership.status,
      interval: membership.interval,
      startDate: membership.startDate,
      endDate: membership.endDate,
    },
  });

  return NextResponse.json(
    {
      member: {
        id: newMember.id,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        familyRole: newMember.family_role,
        qrUuid: newMember.qrUuid,
        createdAt: newMember.createdAt,
      },
    },
    { status: 201 }
  );
}
