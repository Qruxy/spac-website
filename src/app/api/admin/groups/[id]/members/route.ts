/**
 * Admin Group Members API
 *
 * POST   - Add members to a group
 * DELETE - Remove a member from a group
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../../utils';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

    const { userIds } = (await request.json()) as { userIds: string[] };

    if (!userIds?.length) {
      return NextResponse.json({ error: 'At least one user ID is required' }, { status: 400 });
    }

    // Verify group exists
    const group = await prisma.memberGroup.findUnique({ where: { id: params.id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Use skipDuplicates to handle already-existing members gracefully
    await prisma.memberGroupMembership.createMany({
      data: userIds.map((userId) => ({ groupId: params.id, userId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add group members error:', error);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

    const { userId } = (await request.json()) as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.memberGroupMembership.delete({
      where: { groupId_userId: { groupId: params.id, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove group member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
