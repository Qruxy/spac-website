'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  ExternalLink,
  Calendar,
} from 'lucide-react';

type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
type MembershipType = 'INDIVIDUAL' | 'FAMILY' | 'STUDENT';
type MembershipInterval = 'MONTHLY' | 'ANNUAL';

interface MembershipRecord {
  id: string;
  status: MembershipStatus;
  type: MembershipType;
  interval: MembershipInterval;
  startDate: string | null;
  paypalCurrentPeriodEnd: string | null;
  paypalSubscriptionId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Active', color: 'text-green-500 bg-green-500/10', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  EXPIRED: { label: 'Expired', color: 'text-yellow-500 bg-yellow-500/10', icon: <Clock className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-500 bg-red-500/10', icon: <XCircle className="h-3.5 w-3.5" /> },
  PENDING: { label: 'Pending', color: 'text-blue-500 bg-blue-500/10', icon: <Clock className="h-3.5 w-3.5" /> },
};

const PAGE_SIZE = 25;

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<MembershipType | 'ALL'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: 'createdAt',
        order: 'desc',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/memberships?${params}`);
      if (!res.ok) throw new Error('Failed to fetch memberships');
      const data = await res.json();
      setMemberships(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

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

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function memberName(m: MembershipRecord) {
    if (m.user.name) return m.user.name;
    return `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email;
  }

  const counts = {
    active: memberships.filter(m => m.status === 'ACTIVE').length,
    expired: memberships.filter(m => m.status === 'EXPIRED').length,
    cancelled: memberships.filter(m => m.status === 'CANCELLED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Memberships</h1>
            <p className="text-sm text-muted-foreground">{total} total records</p>
          </div>
        </div>
        <button
          onClick={fetchMemberships}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: counts.active, color: 'text-green-500' },
          { label: 'Expired', value: counts.expired, color: 'text-yellow-500' },
          { label: 'Cancelled', value: counts.cancelled, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as MembershipStatus | 'ALL')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as MembershipType | 'ALL')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="FAMILY">Family</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Billing</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Renews</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subscription</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No memberships found
                  </td>
                </tr>
              ) : (
                memberships.map(m => {
                  const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.EXPIRED;
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{memberName(m)}</p>
                          <p className="text-xs text-muted-foreground">{m.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground">
                        {m.type.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.interval === 'MONTHLY' ? 'Monthly' : 'Annual'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(m.paypalCurrentPeriodEnd)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.paypalSubscriptionId ? (
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] inline-block">
                            {m.paypalSubscriptionId.slice(0, 16)}…
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/admin/members?userId=${m.user.id}`}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="View member"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {m.status !== 'ACTIVE' && (
                            <button
                              onClick={() => updateStatus(m.id, 'ACTIVE')}
                              disabled={updatingId === m.id}
                              className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                          {m.status === 'ACTIVE' && (
                            <button
                              onClick={() => updateStatus(m.id, 'CANCELLED')}
                              disabled={updatingId === m.id}
                              className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
