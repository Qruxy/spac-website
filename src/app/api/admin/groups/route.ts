/**
 * Admin Groups API
 *
 * GET  - List all member groups
 * POST - Create a new member group
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const groups = await prisma.memberGroup.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { members: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('List groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, description, memberIds } = (await request.json()) as {
      name: string;
      description?: string;
      memberIds?: string[];
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const group = await prisma.memberGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: session.user.id,
        members: memberIds?.length
          ? { createMany: { data: memberIds.map((userId) => ({ userId })) } }
          : undefined,
      },
      include: {
        _count: { select: { members: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A group with that name already exists' }, { status: 409 });
    }
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
