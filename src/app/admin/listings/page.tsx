'use client';

import { useState, useEffect } from 'react';
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
  ExternalLink,
  Eye,
  ShoppingBag,
} from 'lucide-react';

const STATUSES = ['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED', 'REJECTED'];
const CATEGORIES = ['TELESCOPE', 'EYEPIECE', 'MOUNT', 'CAMERA', 'FILTER', 'ACCESSORY', 'BOOK', 'SOFTWARE', 'OTHER'];
const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];

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
  _count: { images: number };
}

interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const perPage = 25;

  const fetchListings = async () => {
    setLoading(true);
    try {
      const filter: any = {};
      if (searchQuery) filter.q = searchQuery;
      if (statusFilter !== 'ALL') filter.status = statusFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sortField: 'createdAt',
        sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });

      const response = await fetch(`/api/admin/listings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch listings');

      const data: ListingsResponse = await response.json();
      setListings(data.listings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, searchQuery, statusFilter]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateListing = async (id: string, updates: Partial<Listing>) => {
    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update listing');

      showToast('Listing updated successfully', 'success');
      setEditingListing(null);
      fetchListings();
    } catch (error) {
      showToast('Failed to update listing', 'error');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete listing');

      showToast('Listing deleted successfully', 'success');
      fetchListings();
    } catch (error) {
      showToast('Failed to delete listing', 'error');
    }
  };

  const handleApprove = (id: string) => {
    handleUpdateListing(id, { status: 'ACTIVE' });
  };

  const handleReject = (id: string) => {
    handleUpdateListing(id, { status: 'REJECTED' });
  };

  const getSellerName = (seller: Seller) => {
    if (seller.firstName || seller.lastName) {
      return `${seller.firstName || ''} ${seller.lastName || ''}`.trim();
    }
    return seller.name || seller.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'SOLD':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'EXPIRED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TELESCOPE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      EYEPIECE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      MOUNT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      CAMERA: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      FILTER: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      ACCESSORY: 'bg-green-500/10 text-green-400 border-green-500/20',
      BOOK: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      SOFTWARE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      OTHER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[category] || colors.OTHER;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <ShoppingBag className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Listings Management</h1>
            <p className="text-sm text-gray-400">{total} total listings</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="bg-[#1a1a2e]">
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Listing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Images</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Loading listings...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No listings found
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setPreviewListing(listing)}
                          className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors text-left flex items-center gap-2 group"
                        >
                          {listing.title}
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          {getSellerName(listing.seller)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(listing.category)}`}>
                        <Tag className="w-3 h-3" />
                        {listing.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        {formatPrice(listing.askingPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                        {listing.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-300">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        {listing._count.images}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(listing.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {listing.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(listing.id)}
                              className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded text-green-400 transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(listing.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditingListing(listing)}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Edit Listing</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateListing(editingListing.id, {
                  title: formData.get('title') as string,
                  category: formData.get('category') as string,
                  condition: formData.get('condition') as string,
                  askingPrice: parseFloat(formData.get('askingPrice') as string),
                  status: formData.get('status') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingListing.title}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
                <select
                  name="category"
                  defaultValue={editingListing.category}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1a1a2e]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Condition</label>
                <select
                  name="condition"
                  defaultValue={editingListing.condition}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond} className="bg-[#1a1a2e]">
                      {cond.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Asking Price</label>
                <input
                  type="number"
                  name="askingPrice"
                  step="0.01"
                  min="0"
                  defaultValue={editingListing.askingPrice}
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                <select
                  name="status"
                  defaultValue={editingListing.status}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {STATUSES.filter((s) => s !== 'ALL').map((status) => (
                    <option key={status} value={status} className="bg-[#1a1a2e]">
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewListing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{previewListing.title}</h2>
              <button
                onClick={() => setPreviewListing(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Category */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(previewListing.status)}`}>
                  {previewListing.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getCategoryColor(previewListing.category)}`}>
                  <Tag className="w-3.5 h-3.5" />
                  {previewListing.category}
                </span>
                <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium border bg-gray-500/10 text-gray-300 border-gray-500/20">
                  {previewListing.condition.replace('_', ' ')}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-3xl font-bold text-white">{formatPrice(previewListing.askingPrice)}</span>
              </div>

              {/* Description */}
              {previewListing.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{previewListing.description}</p>
                </div>
              )}

              {/* Seller Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Seller</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  {getSellerName(previewListing.seller)}
                  <span className="text-xs text-gray-500">({previewListing.seller.email})</span>
                </div>
              </div>

              {/* Images Count */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Images</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <ImageIcon className="w-4 h-4" />
                  {previewListing._count.images} image{previewListing._count.images !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Date */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Created</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(previewListing.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                {previewListing.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(previewListing.id);
                        setPreviewListing(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-sm font-medium text-green-400 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(previewListing.id);
                        setPreviewListing(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <a
                  href={`/classifieds/${previewListing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-sm font-medium text-purple-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open on Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-lg border shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
