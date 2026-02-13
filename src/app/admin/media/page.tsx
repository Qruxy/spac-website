'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  User,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react';

interface MediaUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Media {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  caption: string | null;
  alt: string | null;
  status: string;
  category: string | null;
  type: string;
  createdAt: string;
  users: MediaUser;
}

interface ApiResponse {
  data: Media[];
  total: number;
}

interface StatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

const STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const PER_PAGE = 24;

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };

      for (const status of ['ALL', 'PENDING', 'APPROVED', 'REJECTED']) {
        const filter = status === 'ALL' ? {} : { status };
        const params = new URLSearchParams({
          page: '1',
          perPage: '1',
          sortField: 'createdAt',
          sortOrder: 'DESC',
          filter: JSON.stringify(filter),
        });

        const response = await fetch(`/api/admin/media?${params}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data: ApiResponse = await response.json();
          const key = status.toLowerCase() as keyof StatusCounts;
          counts[key] = data.total;
        }
      }

      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (statusFilter !== 'ALL') filter.status = statusFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: PER_PAGE.toString(),
        sortField: 'createdAt',
        sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });

      const response = await fetch(`/api/admin/media?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch media');

      const data: ApiResponse = await response.json();
      setMedia(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching media:', error);
      showToast('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchMedia();
    fetchStatusCounts();
  }, [fetchMedia, fetchStatusCounts]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update media');

      showToast(`Media ${status.toLowerCase()}`, 'success');
      fetchMedia();
      fetchStatusCounts();
    } catch (error) {
      console.error('Error updating media:', error);
      showToast('Failed to update media', 'error');
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) {
      showToast('No items selected', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          data: { status },
        }),
      });

      if (!response.ok) throw new Error('Failed to bulk update media');

      showToast(
        `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} ${status.toLowerCase()}`,
        'success'
      );
      setSelectedIds(new Set());
      setBulkMode(false);
      fetchMedia();
      fetchStatusCounts();
    } catch (error) {
      console.error('Error bulk updating media:', error);
      showToast('Failed to bulk update media', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete media');

      showToast('Media deleted successfully', 'success');
      fetchMedia();
      fetchStatusCounts();
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Failed to delete media', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === media.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(media.map((m) => m.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-500/15 text-amber-400',
      APPROVED: 'bg-emerald-500/15 text-emerald-400',
      REJECTED: 'bg-red-500/15 text-red-400',
    };
    return (
      <span
        className={`${styles[status] || 'bg-slate-500/15 text-slate-400'} px-2 py-1 rounded-md text-xs font-medium uppercase`}
      >
        {status}
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

  const getUserName = (user: MediaUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const startIndex = (page - 1) * PER_PAGE + 1;
  const endIndex = Math.min(page * PER_PAGE, total);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white/90">Media Management</h1>
            <p className="text-white/50 text-sm mt-1">Review and approve user-uploaded media</p>
          </div>
          {statusFilter === 'PENDING' && (
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`${
                bulkMode
                  ? 'bg-blue-500/25 text-blue-400'
                  : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
              } rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors`}
            >
              <CheckSquare className="w-4 h-4" />
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
            </button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {bulkMode && selectedIds.size > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-blue-400 font-medium text-sm">
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkUpdate('APPROVED')}
                className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkUpdate('REJECTED')}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Reject Selected
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setBulkMode(false);
                }}
                className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {STATUSES.map((status) => {
            const count =
              statusCounts[
                (status === 'ALL' ? 'all' : status.toLowerCase()) as keyof StatusCounts
              ];
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`${
                  statusFilter === status
                    ? 'bg-blue-500/25 text-blue-400 border-blue-500/40'
                    : 'bg-white/[0.02] text-white/50 border-white/[0.06] hover:bg-white/[0.04]'
                } border rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2`}
              >
                <span>{status === 'ALL' ? 'All Media' : status}</span>
                <span
                  className={`${
                    statusFilter === status
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/[0.04] text-white/40'
                  } px-2 py-0.5 rounded-full text-xs font-semibold`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="mb-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-white/[0.04]"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-white/[0.04] rounded w-3/4"></div>
                    <div className="h-3 bg-white/[0.04] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.04] mb-4">
                <ImageIcon className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-white/60 font-medium mb-2">No media found</h3>
              <p className="text-white/40 text-sm">Try selecting a different status filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden group relative"
                >
                  {/* Checkbox for bulk mode */}
                  {bulkMode && (
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm rounded-lg p-2 hover:bg-black/80 transition-colors"
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-white/60" />
                      )}
                    </button>
                  )}

                  {/* Image */}
                  <div className="aspect-square bg-white/[0.04] overflow-hidden relative">
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.alt || item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg p-2.5 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg p-2.5 transition-colors"
                            title="Reject"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg p-2.5 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-white/70 text-sm font-medium truncate flex-1">
                        {item.filename}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{getUserName(item.users)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && media.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="text-white/50 text-sm">
              Showing {startIndex}-{endIndex} of {total}
            </div>
            <div className="flex items-center gap-2">
              {bulkMode && (
                <button
                  onClick={toggleSelectAll}
                  className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors mr-4"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectedIds.size === media.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
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
        )}

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
  );
}
