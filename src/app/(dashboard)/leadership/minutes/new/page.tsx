/**
 * Create New Meeting Minutes Page
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { ArrowLeft, FileText } from 'lucide-react';
import MinutesForm from '../minutes-form';

export const metadata: Metadata = {
  title: 'New Meeting Minutes | SPAC Leadership',
  description: 'Create new meeting minutes record.',
};

export default async function NewMinutesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/leadership/minutes"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Minutes
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">New Meeting Minutes</h1>
        </div>

        <MinutesForm createdById={session.user.id} />
      </div>
    </div>
  );
}
