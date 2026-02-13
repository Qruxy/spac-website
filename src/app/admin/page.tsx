'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CreditCard,
  ShoppingBag,
  Image as ImageIcon,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Activity,
  UserPlus,
  Mail,
  CheckCircle,
  Edit3,
  Trash2,
  Plus,
} from 'lucide-react';
import { MagicBento, BentoTile } from '@/components/animated/magic-bento';
import { GradualBlur } from '@/components/animated/gradual-blur';

interface Stats {
  totalUsers: number;
  upcomingEvents: number;
  activeMemberships: number;
  activeListings: number;
  pendingMedia: number;
  recentRegistrations: number;
  pendingListings: number;
  newUsersThisMonth: number;
  confirmedRegistrations: number;
  membershipsByType: Record<string, number>;
  analytics?: {
    recentActivity: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      user: string;
      createdAt: string;
    }>;
    topEvents: Array<{
      id: string;
      title: string;
      startDate: string;
      registrations: number;
    }>;
    registrationsByStatus: Record<string, number>;
  };
}

const accentMap = {
  blue: {
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  emerald: {
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
  },
  violet: {
    text: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
  },
  amber: {
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
  },
} as const;

function ActionIcon({ action }: { action: string }) {
  const cls =
    action === 'CREATE'
      ? 'bg-emerald-500/15 text-emerald-400'
      : action === 'DELETE'
        ? 'bg-red-500/15 text-red-400'
        : action === 'APPROVAL'
          ? 'bg-green-500/15 text-green-400'
          : 'bg-blue-500/15 text-blue-400';
  const Icon =
    action === 'CREATE'
      ? Plus
      : action === 'DELETE'
        ? Trash2
        : action === 'APPROVAL'
          ? CheckCircle
          : Edit3;
  return (
    <div className={`mt-0.5 p-1.5 rounded-md ${cls}`}>
      <Icon className="h-3 w-3" />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats?detailed=true', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="mb-2">
          <div className="h-10 w-64 rounded-lg bg-white/[0.03] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[132px] rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
        Failed to load dashboard data. Please try refreshing.
      </div>
    );
  }

  const pendingTotal = stats.pendingMedia + stats.pendingListings;

  const statCards = [
    {
      label: 'Total Members',
      value: stats.totalUsers,
      icon: Users,
      href: '/admin/members',
      accent: 'blue' as const,
      sub: `+${stats.newUsersThisMonth} this month`,
    },
    {
      label: 'Active Memberships',
      value: stats.activeMemberships,
      icon: CreditCard,
      href: '/admin/memberships',
      accent: 'emerald' as const,
      sub: `${Object.keys(stats.membershipsByType).length} types`,
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      href: '/admin/events',
      accent: 'violet' as const,
      sub: `${stats.confirmedRegistrations} confirmed RSVPs`,
    },
    {
      label: 'Active Listings',
      value: stats.activeListings,
      icon: ShoppingBag,
      href: '/admin/listings',
      accent: 'amber' as const,
      sub: `${stats.recentRegistrations} registrations (7d)`,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="mb-2">
        <GradualBlur
          text="Mission Control"
          as="h1"
          className="text-3xl font-bold tracking-tight text-white/90"
          delay={0}
          duration={0.6}
        />
        <GradualBlur
          text="Overview of your community at a glance"
          as="p"
          className="text-sm text-white/40 mt-1"
          delay={0.2}
          duration={0.4}
        />
      </div>

      {/* Pending Alert */}
      {pendingTotal > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-200">
              {pendingTotal} item{pendingTotal !== 1 ? 's' : ''} need
              {pendingTotal === 1 ? 's' : ''} your review
            </p>
            <p className="text-xs text-amber-200/50 mt-0.5">
              {stats.pendingMedia > 0 && `${stats.pendingMedia} photos`}
              {stats.pendingMedia > 0 && stats.pendingListings > 0 && ', '}
              {stats.pendingListings > 0 &&
                `${stats.pendingListings} listings`}{' '}
              pending approval
            </p>
          </div>
          <div className="flex gap-2">
            {stats.pendingMedia > 0 && (
              <Link
                href="/admin/media"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
              >
                Review Photos
              </Link>
            )}
            {stats.pendingListings > 0 && (
              <Link
                href="/admin/listings"
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
              >
                Review Listings
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <MagicBento className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const colors = accentMap[card.accent];
          return (
            <BentoTile key={card.label} className="group" spotlight>
              <Link href={card.href} className="block p-6 h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-white/35 uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className={`text-3xl font-bold mt-1.5 ${colors.text}`}>
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-white/25 mt-1.5">{card.sub}</p>
                  </div>
                  <div className={`${colors.iconBg} p-2.5 rounded-lg`}>
                    <card.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                </div>
                <ArrowUpRight className="absolute bottom-3.5 right-3.5 h-4 w-4 text-white/0 group-hover:text-white/20 transition-all duration-200" />
              </Link>
            </BentoTile>
          );
        })}
      </MagicBento>

      {/* Membership Breakdown + Quick Actions */}
      <MagicBento className="grid-cols-1 lg:grid-cols-3">
        {/* Membership Breakdown - wider tile */}
        <BentoTile className="lg:col-span-2" spotlight>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Membership Breakdown
            </h3>
            {Object.keys(stats.membershipsByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.membershipsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const total = stats.activeMemberships || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-white/50 capitalize">
                            {type.toLowerCase()}
                          </span>
                          <span className="text-[13px] font-medium text-white/70">
                            {count}{' '}
                            <span className="text-white/30">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-white/25">No active memberships</p>
            )}
          </div>
        </BentoTile>

        {/* Quick Actions */}
        <BentoTile spotlight>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  label: 'View Members',
                  href: '/admin/members',
                  icon: UserPlus,
                },
                {
                  label: 'Create Event',
                  href: '/admin/events',
                  icon: Calendar,
                },
                {
                  label: 'Send Email',
                  href: '/admin/communications',
                  icon: Mail,
                },
                {
                  label: 'Review Media',
                  href: '/admin/media',
                  icon: ImageIcon,
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[13px] text-white/50 hover:text-white/80 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-150"
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </BentoTile>
      </MagicBento>

      {/* Recent Activity + Top Events */}
      {stats.analytics && (
        <MagicBento className="grid-cols-1 lg:grid-cols-2">
          {/* Recent Activity */}
          <BentoTile spotlight>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-400" />
                Recent Activity
              </h3>
              {stats.analytics.recentActivity.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.analytics.recentActivity.slice(0, 8).map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <ActionIcon action={a.action} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/60 truncate">
                          <span className="text-white/80 font-medium">
                            {a.user}
                          </span>{' '}
                          {a.action.toLowerCase()}{' '}
                          {a.entityType.toLowerCase()}
                        </p>
                        <p className="text-[11px] text-white/25 mt-0.5">
                          {new Date(a.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/25">No recent activity</p>
              )}
            </div>
          </BentoTile>

          {/* Top Upcoming Events */}
          <BentoTile spotlight>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                Top Upcoming Events
              </h3>
              {stats.analytics.topEvents.length > 0 ? (
                <div className="space-y-2">
                  {stats.analytics.topEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white/70 truncate">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-blue-400">
                          {event.registrations}
                        </p>
                        <p className="text-[10px] text-white/25">registered</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/25">No upcoming events</p>
              )}
            </div>
          </BentoTile>
        </MagicBento>
      )}
    </div>
  );
}
