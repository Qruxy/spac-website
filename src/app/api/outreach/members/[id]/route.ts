export function generateStaticParams() { return []; }
/**
 * Single Outreach Committee Member API
 * 
 * DELETE - Remove a committee member (Chair only)
 * PATCH - Update member role/notes (Chair only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

async function canManageCommittee(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  
  if (session.user.role === 'ADMIN') return true;
  
  const membership = await prisma.outreachCommitteeMember.findUnique({
    where: { userId },
  });
  
  return membership?.role === 'CHAIR';
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await canManageCommittee(session.user.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Only Outreach Chair can remove members' }, { status: 403 });
    }

    const { id } = await params;

    // Find the member
    const member = await prisma.outreachCommitteeMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove the Chair
    if (member.role === 'CHAIR') {
      return NextResponse.json({ error: 'Cannot remove the Outreach Chair' }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    await prisma.outreachCommitteeMember.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove committee member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await canManageCommittee(session.user.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Only Outreach Chair can update members' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, notes } = body;

    const member = await prisma.outreachCommitteeMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change Chair role
    if (member.role === 'CHAIR' && role && role !== 'CHAIR') {
      return NextResponse.json({ error: 'Cannot change the Chair role. Transfer chair duties first.' }, { status: 400 });
    }

    const updated = await prisma.outreachCommitteeMember.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update committee member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}