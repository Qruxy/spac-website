export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      membership: {
        select: {
          type: true,
          status: true,
          endDate: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, phone, avatarUrl } = body as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  };

  const data: Record<string, string | null> = {};
  if (firstName !== undefined) data.firstName = firstName.trim();
  if (lastName !== undefined) data.lastName = lastName.trim();
  if (phone !== undefined) data.phone = phone.trim() || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Also update the concatenated name field if firstName/lastName changed
  if (firstName !== undefined || lastName !== undefined) {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const newFirst = (data.firstName as string) ?? current?.firstName ?? '';
    const newLast = (data.lastName as string) ?? current?.lastName ?? '';
    data.name = `${newFirst} ${newLast}`.trim();
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
