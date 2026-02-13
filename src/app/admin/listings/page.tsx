'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Tag,
  User,
} from 'lucide-react';

interface Seller {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price: number | null;
  askingPrice: number;
  status: string;
  createdAt: string;
  seller: Seller;
  _count: {
    images: number;
  };
}

interface ApiResponse {
  data: Listing[];
  total: number;
}

const STATUSES = ['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED', 'REJECTED'];
const CATEGORIES = [
  'TELESCOPE',
  'EYEPIECE',
  'MOUNT',
  'CAMERA',
  'FILTER',
  'ACCESSORY',
  'BOOK',
  'SOFTWARE',
  'OTHER',
];
const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];

const PER_PAGE = 25;

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (searchQuery) filter.q = searchQuery;
      if (statusFilter !== 'ALL') filter.status = statusFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: PER_PAGE.toString(),
        sortField: 'createdAt',
        sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });

      const response = await fetch(`/api/admin/listings?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch listings');

      const data: ApiResponse = await response.json();
      setListings(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching listings:', error);
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update listing');

      showToast(`Listing ${status.toLowerCase()}`, 'success');
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast('Failed to update listing', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete listing');

      showToast('Listing deleted successfully', 'success');
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('Failed to delete listing', 'error');
    }
  };

  const handleEdit = (listing: Listing) => {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      category: listing.category,
      condition: listing.condition,
      askingPrice: listing.askingPrice,
      status: listing.status,
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update listing');

      showToast('Listing updated successfully', 'success');
      setEditingId(null);
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast('Failed to update listing', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/15 text-emerald-400',
      PENDING_APPROVAL: 'bg-amber-500/15 text-amber-400',
      REJECTED: 'bg-red-500/15 text-red-400',
      SOLD: 'bg-blue-500/15 text-blue-400',
      EXPIRED: 'bg-red-500/15 text-red-400',
    };
    return (
      <span
        className={`${styles[status] || 'bg-slate-500/15 text-slate-400'} px-2 py-1 rounded-md text-[11px] font-medium uppercase`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="bg-blue-500/15 text-blue-400 px-2 py-1 rounded-md text-[11px] font-medium uppercase">
        {category}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSellerName = (seller: Seller) => {
    if (seller.name) return seller.name;
    if (seller.firstName || seller.lastName) {
      return `${seller.firstName || ''} ${seller.lastName || ''}`.trim();
    }
    return seller.email;
  };

  const startIndex = (page - 1) * PER_PAGE + 1;
  const endIndex = Math.min(page * PER_PAGE, total);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white/80 mb-2">Listings Management</h1>
          <p className="text-white/50 text-sm">Review, approve, and manage marketplace listings</p>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search listings by title..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/40"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Statuses' : status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          ) : listings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.04] mb-4">
                <Tag className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-white/60 font-medium mb-2">No listings found</h3>
              <p className="text-white/40 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Listing
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Images
                      </th>
                      <th className="text-left px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right px-6 py-4 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr
                        key={listing.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-white/80 font-medium text-[13px]">
                              {listing.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                              <User className="w-3 h-3" />
                              <span>{getSellerName(listing.seller)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getCategoryBadge(listing.category)}</td>
                        <td className="px-6 py-4">
                          <span className="text-white/70 font-medium text-[13px]">
                            {formatPrice(listing.askingPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(listing.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-white/50 text-[13px]">
                            <ImageIcon className="w-4 h-4" />
                            <span>{listing._count.images}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-white/50 text-[13px]">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(listing.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {listing.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(listing.id, 'ACTIVE')}
                                  className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(listing.id, 'REJECTED')}
                                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(listing)}
                              className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(listing.id)}
                              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0f0f14] border border-white/[0.08] rounded-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-white/80 mb-6">Edit Listing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Asking Price</label>
                  <input
                    type="number"
                    value={editForm.askingPrice}
                    onChange={(e) =>
                      setEditForm({ ...editForm, askingPrice: parseFloat(e.target.value) })
                    }
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  >
                    {STATUSES.filter((s) => s !== 'ALL').map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => handleSaveEdit(editingId)}
                  className="flex-1 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
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
    </div>
  );
}
