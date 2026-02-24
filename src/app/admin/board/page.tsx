'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit3, Trash2, X, Award, Check, ChevronUp, ChevronDown, Loader2, Upload, ImageIcon } from 'lucide-react';

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

// ---------------------------------------------------------------------------
// ImageUploader — drag-and-drop / click-to-upload, returns final public URL
// ---------------------------------------------------------------------------
function ImageUploader({
  currentUrl,
  onUploaded,
  onRemove,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: 'board-members',
        }),
      });

      if (!presignRes.ok) {
        const e = await presignRes.json();
        throw new Error(e.error || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignRes.json();
      setProgress(30);

      // 2. Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(30 + Math.round((ev.loaded / ev.total) * 60));
          }
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setProgress(100);
      onUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  // Show current image with replace / remove options
  if (currentUrl && !uploading) {
    return (
      <div className="space-y-3">
        <div className="relative w-28 h-28 group">
          <img
            src={currentUrl}
            alt="Board member"
            className="w-28 h-28 rounded-full object-cover border border-white/10"
          />
          <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Replace image"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
        <p className="text-xs text-white/40">Hover to replace or remove</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
    );
  }

  // Upload zone
  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 w-full h-36 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        } ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="text-xs text-white/60">Uploading… {progress}%</span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/60">
                <span className="text-blue-400 font-medium">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-xs text-white/30 mt-1">JPG, PNG, WebP — max 10 MB</p>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
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

  useEffect(() => { fetchMembers(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/board-members?page=1&perPage=100&sortField=sortOrder&sortOrder=ASC');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setMembers(result.data || []);
    } catch {
      showToast('Failed to load board members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const handleCreate = () => {
    const nextOrder = members.length > 0 ? Math.max(...members.map((m) => m.sortOrder)) + 1 : 1;
    setFormData({ name: '', title: '', email: '', imageUrl: '', bio: '', sortOrder: nextOrder, isActive: true });
    setEditingId(null);
    setIsPanelOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/board-members/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const member: BoardMember = await res.json();
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
    } catch {
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
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          title: formData.title.trim(),
          email: formData.email.trim() || null,
          imageUrl: formData.imageUrl || null,
          bio: formData.bio.trim() || null,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Member updated' : 'Member created', 'success');
      setIsPanelOpen(false);
      fetchMembers();
    } catch {
      showToast('Failed to save member', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/board-members/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Member deleted', 'success');
      fetchMembers();
    } catch {
      showToast('Failed to delete member', 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;
    const m1 = members[index];
    const m2 = members[targetIndex];
    try {
      setReordering(m1.id);
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/board-members/${m1.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...m1, sortOrder: m2.sortOrder }),
        }),
        fetch(`/api/admin/board-members/${m2.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...m2, sortOrder: m1.sortOrder }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error('Reorder failed');
      showToast('Order updated', 'success');
      fetchMembers();
    } catch {
      showToast('Failed to reorder members', 'error');
    } finally {
      setReordering(null);
    }
  };

  return (
    <div>
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
                Get started by adding your first board member.
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Name & Title</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
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
                          {member.imageUrl ? (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-white/40">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
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
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-white/5 text-white/40 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorder(index, 'up')}
                              disabled={!!reordering}
                              className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                              title="Move up"
                            >
                              {reordering === member.id ? (
                                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-white/60 hover:text-white" />
                              )}
                            </button>
                          )}
                          {index < members.length - 1 && (
                            <button
                              onClick={() => handleReorder(index, 'down')}
                              disabled={!!reordering}
                              className="p-1.5 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                              title="Move down"
                            >
                              {reordering === member.id ? (
                                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-white/60 hover:text-white" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(member.id)}
                            className="p-1.5 hover:bg-white/5 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-blue-500 hover:text-blue-400" />
                          </button>
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
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => !isSaving && setIsPanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-[#0a0e1a] border-l border-white/[0.06] z-50 overflow-y-auto">
            <div className="p-6">
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

              <div className="space-y-5">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Photo</label>
                  <ImageUploader
                    currentUrl={formData.imageUrl}
                    onUploaded={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                    onRemove={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  />
                </div>

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
                    placeholder="Jane Smith"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Title / Position <span className="text-red-500">*</span>
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
                    placeholder="jane@example.com"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Brief biography…"
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
                    <div className="text-sm font-medium text-white/80">Active</div>
                    <div className="text-xs text-white/60 mt-1">Show on the public board page</div>
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
                  className="flex-1 px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving…' : 'Save Member'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
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
