/**
 * Outreach Committee Members API
 * 
 * GET - List all committee members
 * POST - Add a new committee member (Chair only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

async function canManageCommittee(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  
  // Admins can always manage
  if (session.user.role === 'ADMIN') return true;
  
  // Check if user is Outreach Chair
  const membership = await prisma.outreachCommitteeMember.findUnique({
    where: { userId },
  });
  
  return membership?.role === 'CHAIR';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only officers and committee members can view
    const isOfficer = ['ADMIN', 'MODERATOR'].includes(session.user.role);
    const isCommitteeMember = await prisma.outreachCommitteeMember.findUnique({
      where: { userId: session.user.id },
    });

    if (!isOfficer && !isCommitteeMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.outreachCommitteeMember.findMany({
      where: { isActive: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    // Get user details
    const userIds = members.map((m) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = members.map((m) => ({
      ...m,
      user: userMap.get(m.userId) || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch committee members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await canManageCommittee(session.user.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Only Outreach Chair can add members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'VOLUNTEER', notes } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found. They must be a registered SPAC member.' }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.outreachCommitteeMember.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ error: 'User is already a committee member' }, { status: 400 });
      }
      // Reactivate if previously removed
      const updated = await prisma.outreachCommitteeMember.update({
        where: { id: existing.id },
        data: { isActive: true, role, notes },
      });
      return NextResponse.json({
        ...updated,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
      });
    }

    // Create new member
    const member = await prisma.outreachCommitteeMember.create({
      data: {
        userId: user.id,
        role,
        notes,
      },
    });

    return NextResponse.json({
      ...member,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to add committee member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
