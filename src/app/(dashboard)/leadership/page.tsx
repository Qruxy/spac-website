/**
 * Leadership Dashboard
 *
 * Main hub for officers/admins to access:
 * - Membership summary
 * - Meeting minutes
 * - Motions
 * - Club documents
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { 
  Users, 
  FileText, 
  Vote, 
  FolderOpen, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  UserCheck,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leadership Dashboard | SPAC',
  description: 'SPAC Leadership area for officers and administrators.',
};

async function getMembershipStats() {
  const [total, active, pending, expired] = await Promise.all([
    prisma.membership.count(),
    prisma.membership.count({ where: { status: 'ACTIVE' } }),
    prisma.membership.count({ where: { status: 'PENDING' } }),
    prisma.membership.count({ where: { status: 'EXPIRED' } }),
  ]);

  const byType = await prisma.membership.groupBy({
    by: ['type'],
    _count: true,
    where: { status: 'ACTIVE' },
  });

  return { total, active, pending, expired, byType };
}

async function getRecentMinutes() {
  return prisma.meetingMinutes.findMany({
    orderBy: { meetingDate: 'desc' },
    take: 5,
    include: {
      _count: { select: { motions: true } },
    },
  });
}

async function getPendingMotions() {
  return prisma.motion.count({
    where: { status: 'PENDING' },
  });
}

export default async function LeadershipPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only officers can access
  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const [stats, recentMinutes, pendingMotions] = await Promise.all([
    getMembershipStats(),
    getRecentMinutes(),
    getPendingMotions(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leadership Dashboard</h1>
          <p className="text-slate-400">
            Welcome back, {session.user.name}. Here&apos;s an overview of club operations.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Members"
            value={stats.total}
            icon={Users}
            color="indigo"
            href="/admin#/users"
          />
          <StatCard
            title="Active Memberships"
            value={stats.active}
            icon={UserCheck}
            color="green"
            href="/admin#/memberships"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={Clock}
            color="amber"
            href="/admin#/memberships?filter=%7B%22status%22%3A%22PENDING%22%7D"
          />
          <StatCard
            title="Pending Motions"
            value={pendingMotions}
            icon={Vote}
            color="purple"
            href="/leadership/minutes"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Meeting Minutes"
            description="View and manage business meeting minutes and records"
            icon={FileText}
            href="/leadership/minutes"
            items={recentMinutes.length}
            label="meeting records"
          />
          <QuickActionCard
            title="Club Documents"
            description="Manage bylaws, policies, newsletters, and other documents"
            icon={FolderOpen}
            href="/leadership/documents"
          />
          <QuickActionCard
            title="Admin Panel"
            description="Full administrative access to all site data"
            icon={TrendingUp}
            href="/admin"
          />
        </div>

        {/* Membership Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Active Memberships by Type
            </h2>
            <div className="space-y-3">
              {stats.byType.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-slate-300">{item.type}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(item._count / stats.active) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-10 text-right">{item._count}</span>
                  </div>
                </div>
              ))}
              {stats.byType.length === 0 && (
                <p className="text-slate-500">No active memberships</p>
              )}
            </div>
          </div>

          {/* Recent Minutes */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Recent Meeting Minutes
              </h2>
              <Link
                href="/leadership/minutes"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentMinutes.map((minutes) => (
                <Link
                  key={minutes.id}
                  href={`/leadership/minutes/${minutes.id}`}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{minutes.title}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(minutes.meetingDate).toLocaleDateString()} • {minutes.meetingType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {minutes._count.motions > 0 && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                        {minutes._count.motions} motion{minutes._count.motions !== 1 ? 's' : ''}
                      </span>
                    )}
                    {minutes.approved ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {recentMinutes.length === 0 && (
                <p className="text-slate-500 text-center py-4">No meeting minutes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'indigo' | 'green' | 'amber' | 'purple';
  href: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <Link
      href={href}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  items,
  label,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  items?: number;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-indigo-500/30 transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
          {items !== undefined && label && (
            <p className="text-xs text-slate-500 mt-2">
              {items} {label}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
      </div>
    </Link>
  );
}
