'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  BadgeCheck,
  DollarSign,
  Sun,
  CalendarClock,
  Download,
  QrCode,
} from 'lucide-react';
import type { OBSConfigSerialized, OBSRegistration, NavSection } from '../types';

interface Props {
  config: OBSConfigSerialized | null;
  onNavigate: (section: NavSection) => void;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function CountdownBanner({ config }: { config: OBSConfigSerialized }) {
  const now = new Date();
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);

  let text = '';
  let colorClass = 'text-amber-400';

  if (now > end) {
    text = `OBS ${config.year} has ended.`;
    colorClass = 'text-muted-foreground';
  } else if (now >= start && now <= end) {
    text = '🌸 OBS is live!';
    colorClass = 'text-emerald-400';
  } else {
    const days = daysUntil(config.startDate);
    text = `${days} day${days !== 1 ? 's' : ''} until OBS ${config.year}`;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4">
      <p className={`text-lg font-semibold ${colorClass}`}>{text}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {new Date(config.startDate).toLocaleDateString()} – {new Date(config.endDate).toLocaleDateString()} · {config.location}
      </p>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  ATTENDEE: 'bg-blue-500',
  SPEAKER: 'bg-violet-500',
  VENDOR: 'bg-amber-500',
  STAFF: 'bg-emerald-500',
  VOLUNTEER: 'bg-pink-500',
};

const TYPE_ORDER = ['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER'];

export function OBSOverview({ config, onNavigate }: Props) {
  const [registrations, setRegistrations] = useState<OBSRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    fetch(`/api/admin/obs/registrations?obsId=${config.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRegistrations(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [config?.id]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Sun className="w-16 h-16 text-white/10 mb-4" />
        <h2 className="text-lg font-semibold text-muted-foreground">No OBS Event Selected</h2>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Select or create an OBS configuration to get started.
        </p>
      </div>
    );
  }

  const total = registrations.length;
  const checkedIn = registrations.filter((r) => r.checkedIn).length;
  const paid = registrations.filter((r) => r.paymentStatus === 'PAID').length;
  const revenue = registrations
    .filter((r) => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + parseFloat(r.amountPaid), 0);
  const capacityPct = config.capacity > 0 ? Math.min(100, Math.round((total / config.capacity) * 100)) : 0;

  const byType = TYPE_ORDER.map((type) => ({
    type,
    count: registrations.filter((r) => r.registrationType === type).length,
  }));
  const maxByType = Math.max(...byType.map((b) => b.count), 1);

  const recent = [...registrations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const exportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Type', 'Payment', 'Camping', 'Meal', 'Checked In', 'Registered'];
    const rows = registrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.registrationType,
      r.paymentStatus,
      r.campingRequested ? 'Yes' : 'No',
      r.mealRequested ? 'Yes' : 'No',
      r.checkedIn ? 'Yes' : 'No',
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obs-${config.year}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">{config.eventName}</p>
        </div>
      </div>

      <CountdownBanner config={config} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total Registrations</p>
            <div className="p-1.5 bg-blue-500/15 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? '…' : total}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Capacity</span>
              <span>{total} / {config.capacity} ({capacityPct}%)</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Checked In</p>
            <div className="p-1.5 bg-emerald-500/15 rounded-lg">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? '…' : checkedIn}</p>
          <p className="text-[10px] text-muted-foreground">
            {total > 0 ? `${Math.round((checkedIn / total) * 100)}% of registered` : '—'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Paid</p>
            <div className="p-1.5 bg-amber-500/15 rounded-lg">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{loading ? '…' : paid}</p>
          <p className="text-[10px] text-muted-foreground">
            {total > 0 ? `${Math.round((paid / total) * 100)}% of registered` : '—'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Net Revenue</p>
            <div className="p-1.5 bg-violet-500/15 rounded-lg">
              <DollarSign className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {loading ? '…' : `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-[10px] text-muted-foreground">from paid registrations</p>
        </div>
      </div>

      {/* Registration Breakdown */}
      {!loading && registrations.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Registration Breakdown</h3>
          <div className="space-y-3">
            {byType.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${TYPE_COLORS[type] ?? 'bg-blue-500'}`}
                    style={{ width: `${(count / maxByType) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Registrations */}
      {!loading && recent.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Registrations</h3>
          <div className="divide-y divide-border">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                    {r.registrationType.charAt(0) + r.registrationType.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      r.paymentStatus === 'PAID'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {r.paymentStatus}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNavigate('registrations')}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-amber-500/40 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          <Users className="w-4 h-4 text-amber-400" />
          View All Registrations
        </button>
        <button
          onClick={() => onNavigate('registrations')}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-emerald-500/40 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          Check-In Mode
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-blue-500/40 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4 text-blue-400" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
