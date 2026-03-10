'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Eye,
  ExternalLink,
  ZoomIn,
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

// ─── Image Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: {
  item: Media;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getUserName = (user: MediaUser) => {
    if (user.firstName || user.lastName)
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.email;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1117] border border-white/[0.08] rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center">
          <img
            src={item.url}
            alt={item.alt || item.filename}
            className="max-w-full max-h-[70vh] object-contain"
          />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white/60 hover:text-white rounded-lg p-2 transition-colors"
            title="Open original"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/[0.06]">
          <button
            onClick={onClose}
            className="self-end text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-3">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Filename</p>
              <p className="text-white/80 text-sm break-all">{item.filename}</p>
            </div>
            {item.caption && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Caption</p>
                <p className="text-white/70 text-sm">{item.caption}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Uploaded by</p>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                {getUserName(item.users)}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Date</p>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            {item.category && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Category</p>
                <p className="text-white/70 text-sm">{item.category}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Status</p>
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="mt-auto space-y-2">
            {item.status === 'PENDING' && (
              <>
                <button
                  onClick={() => { onApprove(item.id); onClose(); }}
                  className="w-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => { onReject(item.id); onClose(); }}
                  className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {item.status === 'REJECTED' && (
              <button
                onClick={() => { onApprove(item.id); onClose(); }}
                className="w-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
            )}
            {item.status === 'APPROVED' && (
              <button
                onClick={() => { onReject(item.id); onClose(); }}
                className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            )}
            <button
              onClick={() => { onDelete(item.id); onClose(); }}
              className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400',
    APPROVED: 'bg-emerald-500/15 text-emerald-400',
    REJECTED: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`${styles[status] || 'bg-slate-500/15 text-slate-400'} px-2 py-1 rounded-md text-xs font-medium uppercase`}>
      {status}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [previewItem, setPreviewItem] = useState<Media | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // Escape key to deselect all
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !previewItem && !confirmDelete) {
        setSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewItem, confirmDelete]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
      await Promise.all(
        ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(async (status) => {
          const filter = status === 'ALL' ? {} : { status };
          const params = new URLSearchParams({
            page: '1', perPage: '1',
            sortField: 'createdAt', sortOrder: 'DESC',
            filter: JSON.stringify(filter),
          });
          const res = await fetch(`/api/admin/media?${params}`, { credentials: 'include' });
          if (res.ok) {
            const data: ApiResponse = await res.json();
            counts[(status === 'ALL' ? 'all' : status.toLowerCase()) as keyof StatusCounts] = data.total;
          }
        })
      );
      setStatusCounts(counts);
    } catch {}
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Record<string, string> = {};
      if (statusFilter !== 'ALL') filter.status = statusFilter;
      const params = new URLSearchParams({
        page: page.toString(), perPage: PER_PAGE.toString(),
        sortField: 'createdAt', sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });
      const res = await fetch(`/api/admin/media?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: ApiResponse = await res.json();
      setMedia(data.data);
      setTotal(data.total);
    } catch {
      showToast('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchMedia();
    fetchStatusCounts();
  }, [fetchMedia, fetchStatusCounts]);

  const refresh = () => { fetchMedia(); fetchStatusCounts(); };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast(`Media ${status.toLowerCase()}`, 'success');
      refresh();
    } catch {
      showToast('Failed to update media', 'error');
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (!res.ok) throw new Error();
      showToast(`${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} ${status.toLowerCase()}`, 'success');
      setSelectedIds(new Set());
      refresh();
    } catch {
      showToast('Failed to update media', 'error');
    }
  };

  const executeDelete = async (ids: string[]) => {
    try {
      // Single delete
      if (ids.length === 1) {
        const res = await fetch(`/api/admin/media/${ids[0]}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) throw new Error();
      } else {
        // Bulk delete
        const res = await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) throw new Error();
      }
      showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} deleted`, 'success');
      setSelectedIds(new Set());
      refresh();
    } catch {
      showToast('Failed to delete media', 'error');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({ ids: [id], label: '1 photo' });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDelete({
      ids: Array.from(selectedIds),
      label: `${selectedIds.size} photo${selectedIds.size > 1 ? 's' : ''}`,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === media.length ? new Set() : new Set(media.map((m) => m.id))
    );
  };

  const getUserName = (user: MediaUser) => {
    if (user.firstName || user.lastName)
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.email;
  };

  const startIndex = (page - 1) * PER_PAGE + 1;
  const endIndex = Math.min(page * PER_PAGE, total);
  const totalPages = Math.ceil(total / PER_PAGE);
  const allSelected = media.length > 0 && selectedIds.size === media.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6 pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Media Management</h1>
          <p className="text-white/50 text-sm mt-1">Review and approve user-uploaded media</p>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <span className="text-white/50 text-sm">
              {selectedIds.size} selected
            </span>
          )}
          <button
            onClick={toggleSelectAll}
            className={`${
              allSelected
                ? 'bg-blue-500/25 text-blue-400 border-blue-500/40'
                : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.08]'
            } border rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors`}
            title={allSelected ? 'Deselect all' : 'Select all on page'}
          >
            {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUSES.map((status) => {
          const count = statusCounts[(status === 'ALL' ? 'all' : status.toLowerCase()) as keyof StatusCounts];
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
              <span className={`${
                statusFilter === status ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.04] text-white/40'
              } px-2 py-0.5 rounded-full text-xs font-semibold`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/[0.04]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/[0.04] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {media.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-blue-500/60 ring-2 ring-blue-500/30 bg-blue-500/5'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  {/* ── Checkbox (always visible, top-left) ── */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                    className={`absolute top-2 left-2 z-20 rounded-lg p-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-black/50 text-white/50 opacity-0 group-hover:opacity-100 hover:text-white backdrop-blur-sm'
                    }`}
                    title={isSelected ? 'Deselect' : 'Select'}
                  >
                    {isSelected
                      ? <CheckSquare className="w-4 h-4" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>

                  {/* ── Image ── */}
                  <div
                    className="aspect-square bg-white/[0.04] overflow-hidden relative"
                    onClick={() => setPreviewItem(item)}
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.alt || item.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                          className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 transition-colors"
                          title="Preview"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        {item.status === 'PENDING' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'APPROVED'); }}
                              className="bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-400 rounded-lg p-2 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'REJECTED'); }}
                              className="bg-red-500/20 hover:bg-red-500/35 text-red-400 rounded-lg p-2 transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'REJECTED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'APPROVED'); }}
                            className="bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-400 rounded-lg p-2 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'APPROVED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'REJECTED'); }}
                            className="bg-red-500/20 hover:bg-red-500/35 text-red-400 rounded-lg p-2 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="bg-red-500/20 hover:bg-red-500/35 text-red-400 rounded-lg p-2 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Info ── */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white/70 text-xs font-medium truncate flex-1">{item.filename}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-white/40 text-xs flex items-center gap-1 truncate">
                      <User className="w-3 h-3 flex-shrink-0" />
                      {getUserName(item.users)}
                    </p>
                    <p className="text-white/30 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && media.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="text-white/50 text-sm">
            Showing {startIndex}–{endIndex} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-white/70 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-white/50 text-sm px-3">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-white/70 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Selection Action Bar ── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          someSelected ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-[#0f1117]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 whitespace-nowrap">
          <span className="text-white/70 text-sm font-medium mr-1">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5 bg-white/[0.12]" />
          <button
            onClick={toggleSelectAll}
            className="text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div className="w-px h-5 bg-white/[0.12]" />
          <button
            onClick={() => handleBulkUpdate('APPROVED')}
            className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => handleBulkUpdate('REJECTED')}
            className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-white/30 hover:text-white/60 ml-1 transition-colors"
            title="Clear selection (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-[#0f1117] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white/90 font-semibold text-center mb-2">Delete {confirmDelete.label}?</h3>
            <p className="text-white/50 text-sm text-center mb-6">
              This will permanently remove the {confirmDelete.ids.length > 1 ? 'photos' : 'photo'} and their S3 objects. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { executeDelete(confirmDelete.ids); setConfirmDelete(null); }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onApprove={(id) => handleUpdateStatus(id, 'APPROVED')}
          onReject={(id) => handleUpdateStatus(id, 'REJECTED')}
          onDelete={handleDelete}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4">
          <div className={`${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/15 border-red-500/20 text-red-400'
          } border rounded-lg px-4 py-3 text-sm font-medium shadow-xl`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
