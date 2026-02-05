/**
 * Outreach Committee Page
 *
 * Officers can view committee members
 * Outreach Chair can manage committee (add/remove members)
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import OutreachCommitteeClient from './outreach-client';

export const metadata: Metadata = {
  title: 'Outreach Committee | SPAC',
  description: 'Manage SPAC Outreach Committee members and communications.',
};

async function getCommitteeMembers() {
  const members = await prisma.outreachCommitteeMember.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
  });

  // Get user details for each member
  const userIds = members.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
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

  return members.map((m) => ({
    ...m,
    user: userMap.get(m.userId) || null,
  }));
}

async function isOutreachChair(userId: string) {
  const membership = await prisma.outreachCommitteeMember.findUnique({
    where: { userId },
  });
  return membership?.role === 'CHAIR';
}

export default async function OutreachPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only officers (ADMIN, MODERATOR) and committee members can view
  const isOfficer = ['ADMIN', 'MODERATOR'].includes(session.user.role);
  const isCommitteeMember = await prisma.outreachCommitteeMember.findUnique({
    where: { userId: session.user.id },
  });

  if (!isOfficer && !isCommitteeMember) {
    redirect('/dashboard');
  }

  const members = await getCommitteeMembers();
  const canManage = session.user.role === 'ADMIN' || await isOutreachChair(session.user.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <OutreachCommitteeClient
          initialMembers={members}
          canManage={canManage}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
