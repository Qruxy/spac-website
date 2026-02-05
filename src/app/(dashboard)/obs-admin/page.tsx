/**
 * OBS Admin Dashboard
 *
 * Main hub for Orange Blossom Special event management.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { 
  Sun, 
  Users, 
  UserCheck, 
  BadgeCheck, 
  DollarSign, 
  Settings,
  ChevronRight,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'OBS Admin | SPAC',
  description: 'Orange Blossom Special event administration.',
};

async function getActiveOBS() {
  return prisma.oBSConfig.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });
}

async function getOBSStats(obsId: string) {
  const [total, checkedIn, paid, byType] = await Promise.all([
    prisma.oBSRegistration.count({ where: { obsConfigId: obsId } }),
    prisma.oBSRegistration.count({ where: { obsConfigId: obsId, checkedIn: true } }),
    prisma.oBSRegistration.count({ where: { obsConfigId: obsId, paymentStatus: 'PAID' } }),
    prisma.oBSRegistration.groupBy({
      by: ['registrationType'],
      where: { obsConfigId: obsId },
      _count: true,
    }),
  ]);

  return { total, checkedIn, paid, byType };
}

async function getFinancialSummary(obsId: string) {
  const [income, expenses] = await Promise.all([
    prisma.oBSFinancial.aggregate({
      where: { obsConfigId: obsId, isIncome: true },
      _sum: { amount: true },
    }),
    prisma.oBSFinancial.aggregate({
      where: { obsConfigId: obsId, isIncome: false },
      _sum: { amount: true },
    }),
  ]);

  const registrationRevenue = await prisma.oBSRegistration.aggregate({
    where: { obsConfigId: obsId, paymentStatus: 'PAID' },
    _sum: { amountPaid: true },
  });

  return {
    totalIncome: (income._sum.amount?.toNumber() || 0) + (registrationRevenue._sum.amountPaid?.toNumber() || 0),
    totalExpenses: expenses._sum.amount?.toNumber() || 0,
  };
}

export default async function OBSAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const activeOBS = await getActiveOBS();
  
  let stats = null;
  let financials = null;
  
  if (activeOBS) {
    [stats, financials] = await Promise.all([
      getOBSStats(activeOBS.id),
      getFinancialSummary(activeOBS.id),
    ]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Sun className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">OBS Admin</h1>
              <p className="text-slate-400">Orange Blossom Special Event Management</p>
            </div>
          </div>
          
          <Link
            href="/obs-admin/settings"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Event Settings
          </Link>
        </div>

        {/* Active Event Info */}
        {activeOBS ? (
          <>
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{activeOBS.eventName}</h2>
                  <div className="flex flex-wrap gap-4 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      {new Date(activeOBS.startDate).toLocaleDateString()} - {new Date(activeOBS.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {activeOBS.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    new Date() < new Date(activeOBS.registrationOpens)
                      ? 'bg-slate-500/20 text-slate-400'
                      : new Date() < new Date(activeOBS.registrationCloses)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date() < new Date(activeOBS.registrationOpens)
                      ? 'Registration Opens Soon'
                      : new Date() < new Date(activeOBS.registrationCloses)
                      ? 'Registration Open'
                      : 'Registration Closed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Total Registrations"
                  value={stats.total}
                  icon={Users}
                  color="indigo"
                  href="/obs-admin/registrations"
                />
                <StatCard
                  title="Checked In"
                  value={stats.checkedIn}
                  subtitle={stats.total > 0 ? `${Math.round((stats.checkedIn / stats.total) * 100)}%` : '0%'}
                  icon={UserCheck}
                  color="green"
                  href="/obs-admin/check-in"
                />
                <StatCard
                  title="Paid"
                  value={stats.paid}
                  subtitle={stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : '0%'}
                  icon={BadgeCheck}
                  color="amber"
                  href="/obs-admin/registrations?filter=paid"
                />
                {financials && (
                  <StatCard
                    title="Net Revenue"
                    value={`$${(financials.totalIncome - financials.totalExpenses).toLocaleString()}`}
                    subtitle={`Income: $${financials.totalIncome.toLocaleString()}`}
                    icon={DollarSign}
                    color="emerald"
                    href="/obs-admin/financials"
                  />
                )}
              </div>
            )}

            {/* Registration Breakdown */}
            {stats && stats.byType.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Registration Breakdown</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER'].map((type) => {
                    const count = stats.byType.find((t) => t.registrationType === type)?._count || 0;
                    return (
                      <div key={type} className="bg-slate-700/30 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-white">{count}</p>
                        <p className="text-sm text-slate-400">{type.charAt(0) + type.slice(1).toLowerCase()}s</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                title="Registrations"
                description="View and manage all OBS registrations"
                icon={Users}
                href="/obs-admin/registrations"
                count={stats?.total}
              />
              <QuickActionCard
                title="Check-In"
                description="Check in attendees and print badges"
                icon={UserCheck}
                href="/obs-admin/check-in"
              />
              <QuickActionCard
                title="Name Badges"
                description="Generate and print name badges"
                icon={BadgeCheck}
                href="/obs-admin/badges"
              />
            </div>
          </>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <Sun className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Active OBS Event</h2>
            <p className="text-slate-400 mb-6">
              Configure an Orange Blossom Special event to start managing registrations.
            </p>
            <Link
              href="/obs-admin/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              Configure OBS Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'indigo' | 'green' | 'amber' | 'emerald';
  href: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <Link
      href={href}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-amber-500/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
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
  count,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-amber-500/30 transition-colors group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400 group-hover:bg-amber-500/30 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
              {title}
            </h3>
            {count !== undefined && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
      </div>
    </Link>
  );
}
