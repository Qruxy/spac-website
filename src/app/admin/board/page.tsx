'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Award, GripVertical, Check } from 'lucide-react';

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
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    email: '',
    imageUrl: '',
    bio: '',
    sortOrder: 0,
    isActive: true,
  });

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
      const res = await fetch('/api/admin/board-members?page=1&perPage=100&sortField=sortOrder&sortOrder=ASC', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setMembers(json.data || []);
    } catch (error) {
      showToast('Failed to load board members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const openCreatePanel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      title: '',
      email: '',
      imageUrl: '',
      bio: '',
      sortOrder: members.length > 0 ? Math.max(...members.map(m => m.sortOrder)) + 1 : 0,
      isActive: true,
    });
    setShowPanel(true);
  };

  const openEditPanel = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/board-members/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch member');
      const member = await res.json();

      setEditingId(id);
      setFormData({
        name: member.name || '',
        title: member.title || '',
        email: member.email || '',
        imageUrl: member.imageUrl || '',
        bio: member.bio || '',
        sortOrder: member.sortOrder || 0,
        isActive: member.isActive ?? true,
      });
      setShowPanel(true);
    } catch (error) {
      showToast('Failed to load member details', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      showToast('Name and title are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/admin/board-members/${editingId}`
        : '/api/admin/board-members';

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      showToast(
        editingId ? 'Board member updated successfully' : 'Board member created successfully',
        'success'
      );
      setShowPanel(false);
      fetchMembers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save board member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/board-members/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete');

      showToast('Board member deleted successfully', 'success');
      setDeletingId(null);
      fetchMembers();
    } catch (error) {
      showToast('Failed to delete board member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-white/[0.04] rounded animate-pulse" />
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.04] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/15 rounded-lg">
            <Award className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white/80">Board Members</h1>
        </div>
        <button
          onClick={openCreatePanel}
          className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-2">No board members yet</h3>
            <p className="text-sm text-white/40 mb-6">Get started by adding your first board member</p>
            <button
              onClick={openCreatePanel}
              className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider w-20">
                  #
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider w-32">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-white/20" />
                      <span className="text-[13px] text-white/50 font-mono">{member.sortOrder}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-white/80">{member.name}</span>
                      <span className="text-[13px] text-white/50">{member.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[13px] text-white/60">{member.email || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                        member.isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <Check className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {deletingId === member.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-white/50 hover:text-white/70"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditPanel(member.id)}
                          className="p-1.5 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(member.id)}
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over Panel */}
      {showPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
            onClick={() => !submitting && setShowPanel(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.06] z-50 animate-in slide-in-from-right">
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white/80">
                  {editingId ? 'Edit Board Member' : 'Add Board Member'}
                </h2>
                <button
                  onClick={() => !submitting && setShowPanel(false)}
                  className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors"
                  disabled={submitting}
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Title/Position <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="President"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40 resize-none"
                    placeholder="Brief biography..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    min="0"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-blue-500' : 'bg-white/[0.08]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium text-white/70">Active</label>
                </div>
              </div>

              {/* Panel Footer */}
              <div className="p-6 border-t border-white/[0.06] flex gap-3">
                <button
                  onClick={() => setShowPanel(false)}
                  className="flex-1 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-white/70 rounded-lg text-sm font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
