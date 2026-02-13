'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Ban,
  Check,
  Edit3,
  Trash2,
  Users,
  Filter,
  Mail,
  ImageIcon as Image,
  ShoppingBag,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';

type UserRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';
type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | null;

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  isValidated: boolean;
  isBanned: boolean;
  bannedFromClassifieds: boolean;
  bannedFromMedia: boolean;
  adminNotes: string | null;
  createdAt: string;
  membershipType: string | null;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
}

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  status: string;
  createdAt: string;
}

interface ListingItem {
  id: string;
  title: string;
  status: string;
  askingPrice: number | null;
  createdAt: string;
}

interface ActivityData {
  media: MediaItem[];
  listings: ListingItem[];
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [membershipFilter, setMembershipFilter] = useState<MembershipStatus | 'ALL'>('ALL');
  const [sortField] = useState('createdAt');
  const [sortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Record<string, string> = {};
      if (debouncedSearch) filter.q = debouncedSearch;
      if (roleFilter !== 'ALL') filter.role = roleFilter;
      if (membershipFilter !== 'ALL' && membershipFilter) filter.membershipStatus = membershipFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sortField,
        sortOrder,
        filter: JSON.stringify(filter),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, roleFilter, membershipFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch activity for selected user
  const fetchActivity = useCallback(async (userId: string) => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`);
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      setActivity(data);
    } catch (error) {
      showToast('Failed to load activity', 'error');
      setActivity({ media: [], listings: [] });
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchActivity(selectedUser.id);
    } else {
      setActivity(null);
    }
  }, [selectedUser, fetchActivity]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedUser.role,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          phone: selectedUser.phone,
          adminNotes: selectedUser.adminNotes,
          isValidated: selectedUser.isValidated,
          isBanned: selectedUser.isBanned,
          bannedFromClassifieds: selectedUser.bannedFromClassifieds,
          bannedFromMedia: selectedUser.bannedFromMedia,
          membershipStatus: selectedUser.membershipStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to save user');
      showToast('User updated successfully', 'success');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      showToast('Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      showToast('User deleted successfully', 'success');
      setDeleteConfirm(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  const getInitials = (user: User) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'MODERATOR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getMembershipBadgeColor = (status: MembershipStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'EXPIRED':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const startIndex = (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, totalCount);

  return (
    <div className="min-h-screen bg-[#060611] text-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Members & Memberships</h1>
        </div>
        <p className="text-sm text-gray-400">
          Manage user accounts, roles, memberships, and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row gap-4 lg:flex ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as UserRole | 'ALL');
                  setPage(1);
                }}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[140px]"
              >
                <option value="ALL">All Roles</option>
                <option value="MEMBER">Member</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>

              <select
                value={membershipFilter || 'ALL'}
                onChange={(e) => {
                  setMembershipFilter(e.target.value === 'ALL' ? 'ALL' : e.target.value as MembershipStatus);
                  setPage(1);
                }}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[140px]"
              >
                <option value="ALL">All Memberships</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="null">None</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Membership
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading members...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No members found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </div>
                          <div className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {user.membershipType ? (
                          <>
                            <div className="font-medium text-gray-200">{user.membershipType}</div>
                            {user.membershipEndDate && (
                              <div className="text-xs text-gray-400">
                                Ends {formatDate(user.membershipEndDate)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 text-xs">No membership</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {user.membershipStatus && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${getMembershipBadgeColor(
                              user.membershipStatus
                            )}`}
                          >
                            <CreditCard className="w-3 h-3" />
                            {user.membershipStatus}
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/20 text-red-300 border-red-500/30 w-fit">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        )}
                        {!user.isValidated && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 w-fit">
                            <Clock className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-4 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing <span className="font-medium text-gray-200">{startIndex}</span> to{' '}
              <span className="font-medium text-gray-200">{endIndex}</span> of{' '}
              <span className="font-medium text-gray-200">{totalCount}</span> members
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#0a0a14] border-l border-white/10 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                    {getInitials(selectedUser)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : 'Unnamed User'}
                    </h2>
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Joined {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Membership Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Membership
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Type</label>
                    <div className="text-sm font-medium">
                      {selectedUser.membershipType || 'No membership'}
                    </div>
                  </div>
                  {selectedUser.membershipEndDate && (
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">End Date</label>
                      <div className="text-sm font-medium">
                        {formatDate(selectedUser.membershipEndDate)}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['ACTIVE', 'EXPIRED', 'CANCELLED'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setSelectedUser({ ...selectedUser, membershipStatus: status })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedUser.membershipStatus === status
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setSelectedUser({ ...selectedUser, membershipStatus: null })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedUser.membershipStatus === null
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        None
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Management */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Role Management
                </h3>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Account Controls */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-green-400" />
                  Account Controls
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'isValidated', label: 'Email Validated', icon: Check },
                    { key: 'isBanned', label: 'Banned from Site', icon: Ban },
                    { key: 'bannedFromClassifieds', label: 'Banned from Classifieds', icon: ShoppingBag },
                    { key: 'bannedFromMedia', label: 'Banned from Media', icon: Image },
                  ].map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className="text-sm flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUser({
                            ...selectedUser,
                            [key]: !selectedUser[key as keyof User],
                          })
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          selectedUser[key as keyof User]
                            ? 'bg-blue-500'
                            : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            selectedUser[key as keyof User]
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-yellow-400" />
                  Admin Notes
                </h3>
                <textarea
                  value={selectedUser.adminNotes || ''}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, adminNotes: e.target.value })
                  }
                  placeholder="Add internal notes about this user..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              {/* Activity Trail */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Recent Activity
                </h3>
                {loadingActivity ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading activity...</p>
                ) : activity ? (
                  <div className="space-y-4">
                    {/* Recent Media */}
                    {activity.media.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
                          <Image className="w-3.5 h-3.5" />
                          Recent Media ({activity.media.length})
                        </h4>
                        <div className="space-y-2">
                          {activity.media.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                {item.thumbnailUrl ? (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.filename}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.filename}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(item.createdAt)}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      item.status === 'APPROVED'
                                        ? 'bg-green-500/20 text-green-300'
                                        : item.status === 'REJECTED'
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-yellow-500/20 text-yellow-300'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Listings */}
                    {activity.listings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Recent Classifieds ({activity.listings.length})
                        </h4>
                        <div className="space-y-2">
                          {activity.listings.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(item.createdAt)}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      item.status === 'ACTIVE'
                                        ? 'bg-green-500/20 text-green-300'
                                        : item.status === 'SOLD'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-gray-500/20 text-gray-300'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                              {item.askingPrice !== null && (
                                <div className="text-xs font-medium text-green-400">
                                  ${item.askingPrice.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activity.media.length === 0 && activity.listings.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(selectedUser.id)}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-[#0a0a14] border border-red-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete User
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Delete User
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
