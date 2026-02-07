/**
 * Meeting Minutes List Page
 *
 * View all meeting minutes with ability to create new ones.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import MinutesListClient from './minutes-list-client';

export const metadata: Metadata = {
  title: 'Meeting Minutes | SPAC Leadership',
  description: 'View and manage SPAC business meeting minutes.',
};

async function getAllMinutes() {
  return prisma.meetingMinutes.findMany({
    orderBy: { meetingDate: 'desc' },
    include: {
      _count: { select: { motions: true } },
    },
  });
}

export default async function MinutesListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const minutes = await getAllMinutes();

  // Group by year
  const minutesByYear = minutes.reduce((acc, m) => {
    const year = new Date(m.meetingDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {} as Record<number, typeof minutes>);

  const years = Object.keys(minutesByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/leadership"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Leadership
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-400" />
              Meeting Minutes
            </h1>
            <p className="text-slate-400 mt-1">
              {minutes.length} meeting record{minutes.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Link
            href="/leadership/minutes/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Minutes
          </Link>
        </div>

        {/* Minutes List by Year */}
        <MinutesListClient minutesByYear={JSON.parse(JSON.stringify(minutesByYear))} years={years} />
      </div>
    </div>
  );
}
