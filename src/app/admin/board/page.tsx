'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Award, Check, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

interface BoardMember {
  id: string;
  name: string;
  title: string;
  email: string | null;
  imageUrl: string | null;
  bio: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  name: string;
  title: string;
  email: string;
  imageUrl: string;
  bio: string;
  sortOrder: number;
  isActive: boolean;
}

export default function BoardMembersPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    email: '',
    imageUrl: '',
    bio: '',
    sortOrder: 0,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/board-members?page=1&perPage=100&sortField=sortOrder&sortOrder=ASC');
      if (!response.ok) throw new Error('Failed to fetch members');
      const result = await response.json();
      setMembers(result.data || []);
    } catch (error) {
      showToast('Failed to load board members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleCreate = () => {
    const nextSortOrder = members.length > 0 ? Math.max(...members.map(m => m.sortOrder)) + 1 : 1;
    setFormData({
      name: '',
      title: '',
      email: '',
      imageUrl: '',
      bio: '',
      sortOrder: nextSortOrder,
      isActive: true,
    });
    setEditingId(null);
    setIsPanelOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/board-members/${id}`);
      if (!response.ok) throw new Error('Failed to fetch member');
      const member: BoardMember = await response.json();
      setFormData({
        name: member.name,
        title: member.title,
        email: member.email || '',
        imageUrl: member.imageUrl || '',
        bio: member.bio || '',
        sortOrder: member.sortOrder,
        isActive: member.isActive,
      });
      setEditingId(id);
      setIsPanelOpen(true);
    } catch (error) {
      showToast('Failed to load member details', 'error');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      showToast('Name and Title are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const url = editingId ? `/api/admin/board-members/${editingId}` : '/api/admin/board-members';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          title: formData.title.trim(),
          email: formData.email.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          bio: formData.bio.trim() || null,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to save member');

      showToast(editingId ? 'Member updated successfully' : 'Member created successfully', 'success');
      setIsPanelOpen(false);
      fetchMembers();
    } catch (error) {
      showToast('Failed to save member', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/board-members/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete member');

      showToast('Member deleted successfully', 'success');
      fetchMembers();
    } catch (error) {
      showToast('Failed to delete member', 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const member1 = members[index];
    const member2 = members[targetIndex];

    try {
      setReordering(member1.id);

      // Swap sortOrder values
      const order1 = member1.sortOrder;
      const order2 = member2.sortOrder;

      // Update both members
      const [response1, response2] = await Promise.all([
        fetch(`/api/admin/board-members/${member1.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: member1.name,
            title: member1.title,
            email: member1.email,
            imageUrl: member1.imageUrl,
            bio: member1.bio,
            sortOrder: order2,
            isActive: member1.isActive,
          }),
        }),
        fetch(`/api/admin/board-members/${member2.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: member2.name,
            title: member2.title,
            email: member2.email,
            imageUrl: member2.imageUrl,
            bio: member2.bio,
            sortOrder: order1,
            isActive: member2.isActive,
          }),
        }),
      ]);

      if (!response1.ok || !response2.ok) throw new Error('Failed to reorder');

      showToast('Order updated successfully', 'success');
      fetchMembers();
    } catch (error) {
      showToast('Failed to reorder members', 'error');
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Board Members</h1>
            <p className="text-sm text-white/60">Manage organization board members and their display order</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Board Members Yet</h3>
              <p className="text-sm text-white/60 mb-6 text-center max-w-md">
                Get started by adding your first board member to showcase your organization's leadership.
              </p>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Name & Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {members.map((member, index) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white/80">{member.sortOrder}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.imageUrl && (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-white/10"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">{member.name}</div>
                            <div className="text-xs text-white/60">{member.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white/80">{member.email || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-white/5 text-white/40 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Up Arrow */}
                          {index > 0 && (
                            <button
                              onClick={() => handleReorder(index, 'up')}
                              disabled={reordering === member.id}
                              className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              {reordering === member.id ? (
                                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-white/60 hover:text-white" />
                              )}
                            </button>
                          )}
                          {/* Down Arrow */}
                          {index < members.length - 1 && (
                            <button
                              onClick={() => handleReorder(index, 'down')}
                              disabled={reordering === member.id}
                              className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              {reordering === member.id ? (
                                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-white/60 hover:text-white" />
                              )}
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(member.id)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-blue-500 hover:text-blue-400" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Panel */}
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => !isSaving && setIsPanelOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-[#0a0e1a] border-l border-white/[0.06] z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Member' : 'Add Member'}
                </h2>
                <button
                  onClick={() => !isSaving && setIsPanelOpen(false)}
                  disabled={isSaving}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Title/Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="President"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border border-white/10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Brief biography..."
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white/80">Active Status</div>
                    <div className="text-xs text-white/60 mt-1">Show this member on the public board page</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-blue-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsPanelOpen(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
