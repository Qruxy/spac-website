'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, CreditCard, Users,
  CheckCircle, XCircle, Clock, RefreshCw, Filter,
  Download, Calendar, AlertCircle, ExternalLink,
} from 'lucide-react';

type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
type MembershipType = 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'PATRON' | 'BENEFACTOR' | 'FREE' | 'LIFETIME';

interface MembershipRecord {
  id: string;
  status: MembershipStatus;
  type: MembershipType;
  interval: string | null;
  startDate: string | null;
  endDate: string | null;
  paypalCurrentPeriodEnd: string | null;
  paypalSubscriptionId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

interface Stats {
  active: number;
  expired: number;
  cancelled: number;
  pending: number;
}

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: 'Active',    color: 'text-green-500  bg-green-500/10',  icon: <CheckCircle className="h-3 w-3" /> },
  EXPIRED:   { label: 'Expired',   color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock       className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-500    bg-red-500/10',    icon: <XCircle     className="h-3 w-3" /> },
  PENDING:   { label: 'Pending',   color: 'text-blue-500   bg-blue-500/10',   icon: <Clock       className="h-3 w-3" /> },
};

const TYPE_LABELS: Record<MembershipType, string> = {
  INDIVIDUAL: 'Individual',
  FAMILY:     'Family',
  STUDENT:    'Student',
  PATRON:     'Patron',
  BENEFACTOR: 'Benefactor',
  FREE:       'Free',
  LIFETIME:   'Lifetime',
};

const PAGE_SIZE = 25;

function memberName(m: MembershipRecord) {
  if (m.user.name) return m.user.name;
  return `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type RenewalFilter = 'all' | '30' | '60' | '90';

export default function AdminMembershipsPage() {
  const [memberships,  setMemberships]  = useState<MembershipRecord[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<Stats>({ active: 0, expired: 0, cancelled: 0, pending: 0 });
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'ALL'>('ALL');
  const [typeFilter,   setTypeFilter]   = useState<MembershipType | 'ALL'>('ALL');
  const [renewalFilter, setRenewalFilter] = useState<RenewalFilter>('all');
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [exporting,    setExporting]    = useState(false);

  const buildParams = useCallback((overrides?: Record<string, string>) => {
    const p = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: 'createdAt',
      order: 'desc',
    });
    if (statusFilter !== 'ALL') p.set('status', statusFilter);
    if (typeFilter !== 'ALL')   p.set('type',   typeFilter);
    if (search.trim())          p.set('search', search.trim());
    if (renewalFilter !== 'all') p.set('renewalDays', renewalFilter);
    if (overrides) Object.entries(overrides).forEach(([k, v]) => p.set(k, v));
    return p;
  }, [page, statusFilter, typeFilter, search, renewalFilter]);

  const fetchMemberships = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/memberships?${buildParams()}`);
      if (!res.ok) throw new Error('Failed to fetch memberships');
      const data = await res.json();
      setMemberships(data.data   ?? []);
      setTotal(data.total        ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, renewalFilter]);

  async function updateStatus(id: string, status: MembershipStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/memberships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      await fetchMemberships();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const p = buildParams({ export: 'csv', limit: '10000', page: '1' });
      const res = await fetch(`/api/admin/memberships?${p}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spac-memberships-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Memberships</h1>
            <p className="text-sm text-muted-foreground">{total} matching · {stats.active} active total</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMemberships}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportCsv} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-sm font-medium transition-colors disabled:opacity-50">
            <Download className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active',    value: stats.active,    color: 'text-green-500',  status: 'ACTIVE'    },
          { label: 'Expired',   value: stats.expired,   color: 'text-yellow-500', status: 'EXPIRED'   },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-500',    status: 'CANCELLED' },
          { label: 'Pending',   value: stats.pending,   color: 'text-blue-500',   status: 'PENDING'   },
        ].map(s => (
          <button key={s.label}
            onClick={() => setStatusFilter(prev => prev === s.status ? 'ALL' : s.status as MembershipStatus)}
            className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${
              statusFilter === s.status ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as MembershipStatus | 'ALL')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as MembershipType | 'ALL')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="ALL">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="FAMILY">Family</option>
            <option value="STUDENT">Student</option>
            <option value="PATRON">Patron</option>
            <option value="BENEFACTOR">Benefactor</option>
            <option value="FREE">Free</option>
            <option value="LIFETIME">Lifetime</option>
          </select>
          {/* Renewal due filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-orange-400" />
            <select value={renewalFilter} onChange={e => setRenewalFilter(e.target.value as RenewalFilter)}
              className={`rounded-lg border px-3 py-2 text-sm ${renewalFilter !== 'all' ? 'border-orange-400/40 bg-orange-400/5 text-orange-300' : 'border-border bg-background'}`}>
              <option value="all">All Members</option>
              <option value="30">Renewal Due ≤ 30 days</option>
              <option value="60">Renewal Due ≤ 60 days</option>
              <option value="90">Renewal Due ≤ 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member Since</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Renewal / Expires</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No memberships found
                  </td>
                </tr>
              ) : (
                memberships.map(m => {
                  const sc = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.EXPIRED;
                  // Use paypalCurrentPeriodEnd for live PayPal subscribers, endDate for imported members
                  const effectiveRenewalDate = m.paypalCurrentPeriodEnd ?? m.endDate;
                  const days = daysUntil(effectiveRenewalDate);
                  const renewalUrgent = days !== null && days <= 30 && m.status === 'ACTIVE';
                  const renewalSoon   = days !== null && days <= 60 && m.status === 'ACTIVE';
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">

                      {/* Member */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{memberName(m)}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                        {m.user.phone && (
                          <p className="text-xs text-muted-foreground/70">{m.user.phone}</p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 text-foreground">
                        {TYPE_LABELS[m.type] ?? m.type}
                        <p className="text-xs text-muted-foreground">Annual</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>

                      {/* Member Since */}
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {fmt(m.startDate)}
                      </td>

                      {/* Renewal */}
                      <td className="px-4 py-3">
                        {effectiveRenewalDate ? (
                          <div>
                            <p className={`text-sm font-medium ${renewalUrgent ? 'text-orange-400' : renewalSoon ? 'text-yellow-400' : 'text-foreground'}`}>
                              {fmt(effectiveRenewalDate)}
                            </p>
                            {days !== null && m.status === 'ACTIVE' && (
                              <p className={`text-xs ${renewalUrgent ? 'text-orange-400' : renewalSoon ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                                {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/admin/members?userId=${m.user.id}`}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="View member profile">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {m.status !== 'ACTIVE' && (
                            <button onClick={() => updateStatus(m.id, 'ACTIVE')}
                              disabled={updatingId === m.id}
                              className="px-2.5 py-1 rounded text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50">
                              Activate
                            </button>
                          )}
                          {m.status === 'ACTIVE' && (
                            <button onClick={() => updateStatus(m.id, 'CANCELLED')}
                              disabled={updatingId === m.id}
                              className="px-2.5 py-1 rounded text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
