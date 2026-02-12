/**
 * Admin Single Group API
 *
 * GET    - Get group details with members
 * PUT    - Update group name/description
 * DELETE - Delete a group
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const group = await prisma.memberGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
          },
          orderBy: { user: { lastName: 'asc' } },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, description } = (await request.json()) as {
      name?: string;
      description?: string;
    };

    const group = await prisma.memberGroup.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() || null }),
      },
      include: {
        _count: { select: { members: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(group);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A group with that name already exists' }, { status: 409 });
    }
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.memberGroup.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
