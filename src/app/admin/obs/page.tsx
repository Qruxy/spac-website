import type { Metadata } from 'next';
import Link from 'next/link';
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
  Clock,
  ClipboardList,
  QrCode,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'OBS Event | Admin | SPAC',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/15 rounded-xl">
            <Sun className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white/90">OBS Event Management</h1>
            <p className="text-sm text-white/50">Orange Blossom Special</p>
          </div>
        </div>

        <Link
          href="/obs-admin/settings"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 rounded-lg text-sm font-medium transition-colors"
        >
          <Settings className="w-4 h-4" />
          Event Settings
        </Link>
      </div>

      {activeOBS ? (
        <>
          {/* Active Event Card */}
          <div className="bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.05] border border-amber-500/20 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white/90 mb-1">{activeOBS.eventName}</h2>
                <div className="flex flex-wrap gap-4 text-white/60 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    {new Date(activeOBS.startDate).toLocaleDateString()} – {new Date(activeOBS.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    {activeOBS.location}
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                new Date() < new Date(activeOBS.registrationOpens)
                  ? 'bg-white/[0.06] text-white/50'
                  : new Date() < new Date(activeOBS.registrationCloses)
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}>
                <Clock className="w-3 h-3" />
                {new Date() < new Date(activeOBS.registrationOpens)
                  ? 'Registration Opens Soon'
                  : new Date() < new Date(activeOBS.registrationCloses)
                  ? 'Registration Open'
                  : 'Registration Closed'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Registrations"
                value={stats.total}
                icon={Users}
                color="blue"
                href="/obs-admin/registrations"
              />
              <StatCard
                title="Checked In"
                value={stats.checkedIn}
                subtitle={stats.total > 0 ? `${Math.round((stats.checkedIn / stats.total) * 100)}%` : '0%'}
                icon={UserCheck}
                color="emerald"
                href="/obs-admin/check-in"
              />
              <StatCard
                title="Paid"
                value={stats.paid}
                subtitle={stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : '0%'}
                icon={BadgeCheck}
                color="amber"
              />
              {financials && (
                <StatCard
                  title="Net Revenue"
                  value={`$${(financials.totalIncome - financials.totalExpenses).toLocaleString()}`}
                  subtitle={`Income: $${financials.totalIncome.toLocaleString()}`}
                  icon={DollarSign}
                  color="violet"
                />
              )}
            </div>
          )}

          {/* Registration Breakdown */}
          {stats && stats.byType.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white/80 mb-4">Registration Breakdown</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
                {['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER'].map((type) => {
                  const count = stats.byType.find((t) => t.registrationType === type)?._count || 0;
                  return (
                    <div key={type} className="bg-white/[0.03] rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-white/80">{count}</p>
                      <p className="text-xs text-white/40 mt-1">{type.charAt(0) + type.slice(1).toLowerCase()}s</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <QuickAction
              title="Registrations"
              description="View and manage all OBS registrations"
              icon={ClipboardList}
              href="/obs-admin/registrations"
              count={stats?.total}
            />
            <QuickAction
              title="Check-In"
              description="Check in attendees and scan badges"
              icon={QrCode}
              href="/obs-admin/check-in"
            />
            <QuickAction
              title="Event Settings"
              description="Configure dates, pricing, and details"
              icon={Settings}
              href="/obs-admin/settings"
            />
          </div>
        </>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-12 text-center">
          <Sun className="w-14 h-14 text-white/15 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white/70 mb-2">No Active OBS Event</h2>
          <p className="text-sm text-white/40 mb-6">
            Configure an Orange Blossom Special event to start managing registrations.
          </p>
          <Link
            href="/obs-admin/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 font-medium rounded-lg text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure OBS Event
          </Link>
        </div>
      )}
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
  color: 'blue' | 'emerald' | 'amber' | 'violet';
  href?: string;
}) {
  const colorMap = {
    blue: 'bg-blue-500/15 text-blue-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    violet: 'bg-violet-500/15 text-violet-400',
  };

  const card = (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40">{title}</p>
          <p className="text-2xl font-bold text-white/80 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function QuickAction({
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
      className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-amber-500/20 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-500/15 rounded-lg text-amber-400 group-hover:bg-amber-500/25 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/80 group-hover:text-amber-400 transition-colors">
              {title}
            </h3>
            {count !== undefined && (
              <span className="text-xs bg-white/[0.06] text-white/50 px-2 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors mt-1" />
      </div>
    </Link>
  );
}
