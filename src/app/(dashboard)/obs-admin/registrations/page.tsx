/**
 * OBS Registrations Page
 *
 * View and manage all OBS registrations.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { ArrowLeft, Users } from 'lucide-react';
import RegistrationsClient from './registrations-client';

export const metadata: Metadata = {
  title: 'OBS Registrations | SPAC',
  description: 'Manage Orange Blossom Special registrations.',
};

async function getActiveOBS() {
  return prisma.oBSConfig.findFirst({
    where: { isActive: true },
  });
}

async function getRegistrations(obsId: string) {
  return prisma.oBSRegistration.findMany({
    where: { obsConfigId: obsId },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function OBSRegistrationsPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link
          href="/obs-admin"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to OBS Admin
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Registrations</h1>
        </div>
        <p className="text-slate-400 mb-8">
          {registrations.length} registration{registrations.length !== 1 ? 's' : ''} for {activeOBS.eventName}
        </p>

        <RegistrationsClient registrations={registrations} obsId={activeOBS.id} />
      </div>
    </div>
  );
}
