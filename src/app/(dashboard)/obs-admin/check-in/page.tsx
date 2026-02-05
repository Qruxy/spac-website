/**
 * OBS Check-In Page
 *
 * Quick check-in interface for OBS event.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { ArrowLeft, UserCheck } from 'lucide-react';
import CheckInClient from './check-in-client';

export const metadata: Metadata = {
  title: 'OBS Check-In | SPAC',
  description: 'Check in attendees for Orange Blossom Special.',
};

async function getActiveOBS() {
  return prisma.oBSConfig.findFirst({
    where: { isActive: true },
  });
}

async function getRegistrations(obsId: string) {
  return prisma.oBSRegistration.findMany({
    where: { obsConfigId: obsId },
    orderBy: [
      { checkedIn: 'asc' },
      { lastName: 'asc' },
      { firstName: 'asc' },
    ],
  });
}

export default async function OBSCheckInPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const activeOBS = await getActiveOBS();

  if (!activeOBS) {
    redirect('/obs-admin');
  }

  const registrations = await getRegistrations(activeOBS.id);
  const checkedInCount = registrations.filter((r) => r.checkedIn).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/obs-admin"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to OBS Admin
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <UserCheck className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Check-In</h1>
        </div>
        <p className="text-slate-400 mb-8">
          {checkedInCount} of {registrations.length} attendees checked in
        </p>

        <CheckInClient 
          registrations={registrations} 
          obsId={activeOBS.id}
          checkedInById={session.user.id}
        />
      </div>
    </div>
  );
}
