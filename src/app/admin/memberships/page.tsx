'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Mail,
  AlertCircle,
} from 'lucide-react';

interface MembershipUser {
  id: string;
  name: string | null;
  email: string;
}

interface Membership {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  user: MembershipUser;
}

interface ApiResponse {
  data: Membership[];
  total: number;
}

const TYPES = ['ALL', 'INDIVIDUAL', 'FAMILY', 'STUDENT', 'LIFETIME'];
const STATUSES = ['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'];
const PER_PAGE = 25;

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (searchQuery) filter.q = searchQuery;
      if (typeFilter !== 'ALL') filter.type = typeFilter;
      if (statusFilter !== 'ALL') filter.status = statusFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: PER_PAGE.toString(),
        sortField: 'createdAt',
        sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });

      const response = await fetch(`/api/admin/memberships?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch memberships');

      const data: ApiResponse = await response.json();
      setMemberships(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      showToast('Failed to load memberships', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/15 text-emerald-400',
      PENDING: 'bg-amber-500/15 text-amber-400',
      EXPIRED: 'bg-red-500/15 text-red-400',
      CANCELLED: 'bg-slate-500/15 text-slate-400',
    };
    return (
      <span
        className={`${styles[status] || 'bg-slate-500/15 text-slate-400'} px-2 py-1 rounded-md text-[11px] font-medium uppercase`}
      >
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      INDIVIDUAL: 'bg-blue-500/15 text-blue-400',
      FAMILY: 'bg-violet-500/15 text-violet-400',
      STUDENT: 'bg-cyan-500/15 text-cyan-400',
      LIFETIME: 'bg-amber-500/15 text-amber-400',
    };
    return (
      <span
        className={`${styles[type] || 'bg-slate-500/15 text-slate-400'} px-2 py-1 rounded-md text-[11px] font-medium uppercase`}
      >
        {type}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getUserName = (user: MembershipUser) => {
    return user.name || user.email;
  };

  const startIndex = (page - 1) * PER_PAGE + 1;
  const endIndex = Math.min(page * PER_PAGE, total);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white/80 mb-2">Membership Management</h1>
          <p className="text-white/50 text-sm">
            View and manage member subscriptions and renewals
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by member name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/40"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={typeFilter}
                onChange={(e) => handleTypeFilter(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Members',
              value: total,
              color: 'text-blue-400',
              bg: 'bg-blue-500/15',
            },
            {
              label: 'Active',
              value: memberships.filter((m) => m.status === 'ACTIVE').length,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/15',
            },
            {
              label: 'Pending',
              value: memberships.filter((m) => m.status === 'PENDING').length,
              color: 'text-amber-400',
              bg: 'bg-amber-500/15',
            },
            {
              label: 'Expired',
              value: memberships.filter((m) => m.status === 'EXPIRED').length,
              color: 'text-red-400',
              bg: 'bg-red-500/15',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
            >
              <div className="text-white/50 text-xs font-medium mb-1 uppercase tracking-wide">
                {stat.label}
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex gap-4 mb-4 animate-pulse">
                  <div className="h-12 bg-white/[0.04] rounded flex-1"></div>
                </div>
              ))}
            </div>
          ) : memberships.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.04] mb-4">
                <User className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-white/60 font-medium mb-2">No memberships found</h3>
              <p className="text-white/40 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map((membership) => {
                      const expired = isExpired(membership.endDate);
                      return (
                        <tr
                          key={membership.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-white/40" />
                                <span className="text-white/80 font-medium text-[13px]">
                                  {getUserName(membership.user)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/40 text-[11px] ml-6">
                                <Mail className="w-3 h-3" />
                                <span>{membership.user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getTypeBadge(membership.type)}</td>
                          <td className="px-6 py-4">{getStatusBadge(membership.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-white/70 text-[13px]">
                              <Calendar className="w-4 h-4 text-white/40" />
                              <span>{formatDate(membership.startDate)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar
                                className={`w-4 h-4 ${expired ? 'text-red-400' : 'text-white/40'}`}
                              />
                              <span
                                className={`text-[13px] font-medium ${
                                  expired ? 'text-red-400' : 'text-white/70'
                                }`}
                              >
                                {formatDate(membership.endDate)}
                              </span>
                              {expired && membership.status === 'ACTIVE' && (
                                <AlertCircle className="w-4 h-4 text-red-400 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-white/50 text-sm">
                  Showing {startIndex}-{endIndex} of {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-white/70 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="text-white/50 text-sm px-3">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-white/70 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
            <div
              className={`${
                toast.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/15 border-red-500/20 text-red-400'
              } border rounded-lg px-4 py-3 text-sm font-medium shadow-xl`}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
