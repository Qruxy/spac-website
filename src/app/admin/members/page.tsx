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
} from 'lucide-react';

// Types
interface User {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  phone: string | null;
  emailVerified: Date | null;
  isValidated: boolean;
  isBanned: boolean;
  bannedFromClassifieds: boolean;
  bannedFromMedia: boolean;
  adminNotes: string | null;
  createdAt: Date | string;
  membershipStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | null;
  membershipType: string | null;
  membershipEndDate: Date | string | null;
}

interface UsersResponse {
  data: User[];
  total: number;
}

type RoleFilter = 'ALL' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
type MembershipFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

// Helper Components
const RoleBadge = ({ role }: { role: string }) => {
  const styles = {
    ADMIN: 'bg-red-500/15 text-red-400',
    MODERATOR: 'bg-amber-500/15 text-amber-400',
    MEMBER: 'bg-blue-500/15 text-blue-400',
  };

  return (
    <span className={`${styles[role as keyof typeof styles] || styles.MEMBER} px-2 py-1 rounded text-[11px] font-medium uppercase tracking-wide`}>
      {role}
    </span>
  );
};

const MembershipBadge = ({ status }: { status: string | null }) => {
  if (!status) {
    return <span className="text-white/30 text-[11px]">None</span>;
  }

  const styles = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-400',
    EXPIRED: 'bg-red-500/15 text-red-400',
    CANCELLED: 'bg-slate-500/15 text-slate-400',
    PENDING: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <span className={`${styles[status as keyof typeof styles] || styles.PENDING} px-2 py-1 rounded text-[11px] font-medium uppercase tracking-wide`}>
      {status}
    </span>
  );
};

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 ${type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'} border rounded-lg px-4 py-3 shadow-lg z-50 flex items-center gap-2 max-w-md`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white/80 font-semibold mb-2">Confirm Action</h3>
        <p className="text-white/50 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] rounded-lg px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function MembersPage() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const perPage = 25;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filter: Record<string, string> = {};
      if (debouncedSearch) {
        filter.q = debouncedSearch;
      }
      if (roleFilter !== 'ALL') {
        filter.role = roleFilter;
      }
      if (membershipFilter !== 'ALL') {
        filter.membershipStatus = membershipFilter;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sortField: 'createdAt',
        sortOrder: 'DESC',
        filter: JSON.stringify(filter),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading users:', error);
      setToast({ message: 'Failed to load members', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, membershipFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      adminNotes: user.adminNotes,
      isValidated: user.isValidated,
      isBanned: user.isBanned,
      bannedFromClassifieds: user.bannedFromClassifieds,
      bannedFromMedia: user.bannedFromMedia,
    });
  };

  const handleClosePanel = () => {
    setSelectedUser(null);
    setEditedUser({});
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setToast({ message: 'Member updated successfully', type: 'success' });
      handleClosePanel();
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      setToast({ message: 'Failed to update member', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setToast({ message: 'Member deleted successfully', type: 'success' });
      setConfirmDelete(false);
      handleClosePanel();
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setToast({ message: 'Failed to delete member', type: 'error' });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalPages = Math.ceil(total / perPage);
  const startIndex = (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white/80 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Members Management
        </h1>
        <p className="text-white/50 text-sm mt-1">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500/40"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setPage(1);
              }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm pl-10 pr-8 py-2 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>

          {/* Membership Filter */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <select
              value={membershipFilter}
              onChange={(e) => {
                setMembershipFilter(e.target.value as MembershipFilter);
                setPage(1);
              }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm pl-10 pr-8 py-2 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">All Memberships</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-white/50 font-medium text-[11px] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium text-[11px] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium text-[11px] uppercase tracking-wider">Membership</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium text-[11px] uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-white/50 font-medium text-[11px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-white/[0.04] rounded animate-pulse w-32 mb-1" />
                      <div className="h-3 bg-white/[0.04] rounded animate-pulse w-48" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 bg-white/[0.04] rounded animate-pulse w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-white/[0.04] rounded animate-pulse w-24 mb-1" />
                      <div className="h-6 bg-white/[0.04] rounded animate-pulse w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-white/[0.04] rounded animate-pulse w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-white/[0.04] rounded animate-pulse w-16" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm font-medium">No members found</p>
                    <p className="text-white/30 text-xs mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                // Data rows
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white/80 text-[13px] font-medium">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'Unnamed User'}
                      </div>
                      <div className="text-white/40 text-[11px] mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/60 text-[11px] mb-1">
                        {user.membershipType || 'No membership'}
                      </div>
                      <MembershipBadge status={user.membershipStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/60 text-[13px]">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.isValidated && (
                          <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="border-t border-white/[0.06] px-4 py-3 flex items-center justify-between bg-white/[0.02]">
            <div className="text-white/50 text-sm">
              Showing {startIndex}-{endIndex} of {total} members
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedUser && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={handleClosePanel}
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#0a0a0a] border-l border-white/[0.06] z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white/80">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.name || 'Unnamed User'}
                  </h2>
                  <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedUser.email}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    Joined {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <button
                  onClick={handleClosePanel}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="block text-white/50 text-[11px] font-medium mb-1.5 uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    value={editedUser.role || selectedUser.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as User['role'] })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-white/50 text-[11px] font-medium mb-1.5 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editedUser.firstName ?? selectedUser.firstName ?? ''}
                    onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-white/50 text-[11px] font-medium mb-1.5 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editedUser.lastName ?? selectedUser.lastName ?? ''}
                    onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white/50 text-[11px] font-medium mb-1.5 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editedUser.phone ?? selectedUser.phone ?? ''}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Toggle Switches */}
                <div className="space-y-3 pt-2">
                  {/* Validated */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/60 text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Validated
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedUser.isValidated ?? selectedUser.isValidated}
                        onChange={(e) => setEditedUser({ ...editedUser, isValidated: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500/40 peer-checked:after:bg-blue-400"></div>
                    </div>
                  </label>

                  {/* Banned */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/60 text-sm flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Banned
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedUser.isBanned ?? selectedUser.isBanned}
                        onChange={(e) => setEditedUser({ ...editedUser, isBanned: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500/40 peer-checked:after:bg-red-400"></div>
                    </div>
                  </label>

                  {/* Banned from Classifieds */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/60 text-sm">Banned from Classifieds</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedUser.bannedFromClassifieds ?? selectedUser.bannedFromClassifieds}
                        onChange={(e) => setEditedUser({ ...editedUser, bannedFromClassifieds: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/40 peer-checked:after:bg-amber-400"></div>
                    </div>
                  </label>

                  {/* Banned from Media */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/60 text-sm">Banned from Media</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedUser.bannedFromMedia ?? selectedUser.bannedFromMedia}
                        onChange={(e) => setEditedUser({ ...editedUser, bannedFromMedia: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/40 peer-checked:after:bg-amber-400"></div>
                    </div>
                  </label>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-white/50 text-[11px] font-medium mb-1.5 uppercase tracking-wider">
                    Admin Notes
                  </label>
                  <textarea
                    value={editedUser.adminNotes ?? selectedUser.adminNotes ?? ''}
                    onChange={(e) => setEditedUser({ ...editedUser, adminNotes: e.target.value })}
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40 resize-none"
                    placeholder="Internal notes about this member..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Member
                </button>
              </div>

              {/* Membership Info */}
              {selectedUser.membershipType && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
                  <h3 className="text-white/60 text-[11px] font-medium uppercase tracking-wider">Membership Info</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Type:</span>
                      <span className="text-white/70 text-xs font-medium">{selectedUser.membershipType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Status:</span>
                      <MembershipBadge status={selectedUser.membershipStatus} />
                    </div>
                    {selectedUser.membershipEndDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">End Date:</span>
                        <span className="text-white/70 text-xs font-medium">{formatDate(selectedUser.membershipEndDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this member? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
