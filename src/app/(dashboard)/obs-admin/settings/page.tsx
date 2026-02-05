/**
 * OBS Settings Page
 *
 * Configure OBS event settings - dates, pricing, etc.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { ArrowLeft, Settings } from 'lucide-react';
import OBSSettingsForm from './settings-form';

export const metadata: Metadata = {
  title: 'OBS Settings | SPAC',
  description: 'Configure Orange Blossom Special event settings.',
};

async function getOBSConfigs() {
  return prisma.oBSConfig.findMany({
    orderBy: { year: 'desc' },
    include: {
      _count: { select: { registrations: true } },
    },
  });
}

export default async function OBSSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/obs-admin');
  }

  const configs = await getOBSConfigs();
  const currentYear = new Date().getFullYear();

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

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Settings className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">OBS Event Settings</h1>
        </div>

        <OBSSettingsForm configs={configs} currentYear={currentYear} />
      </div>
    </div>
  );
}
