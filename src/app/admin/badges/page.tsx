'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Loader2,
  Trophy,
  X,
  Check,
  Gift,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BadgeCategory = 'ATTENDANCE' | 'MILESTONE' | 'SPECIAL' | 'OBS';

type CriteriaType = 'event_count' | 'first_event' | 'obs_event' | 'manual';

interface BadgeCriteria {
  type: 'event_count' | 'first_event' | 'obs_event';
  count?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: BadgeCriteria | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: { userBadges: number };
}

interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteriaType: CriteriaType;
  criteriaCount: number;
  sortOrder: number;
  isActive: boolean;
}

interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMOJI_SUGGESTIONS = [
  '\u{1F52D}', '\u{2B50}', '\u{1F31F}', '\u{1F3C6}', '\u{1F4AF}',
  '\u{1F319}', '\u{1F989}', '\u{2728}', '\u{1F3AF}', '\u{1FA90}',
  '\u{1F30C}', '\u{1F525}',
];

const CATEGORY_OPTIONS: { value: BadgeCategory; label: string }[] = [
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'MILESTONE', label: 'Milestone' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'OBS', label: 'OBS' },
];

const CRITERIA_OPTIONS: { value: CriteriaType; label: string }[] = [
  { value: 'event_count', label: 'Event Count' },
  { value: 'first_event', label: 'First Event' },
  { value: 'obs_event', label: 'OBS Event' },
  { value: 'manual', label: 'Manual Only' },
];

const EMPTY_FORM: BadgeFormData = {
  name: '',
  description: '',
  icon: '\u{1F52D}',
  category: 'ATTENDANCE',
  criteriaType: 'manual',
  criteriaCount: 1,
  sortOrder: 0,
  isActive: true,
};

const CATEGORY_COLORS: Record<BadgeCategory, string> = {
  ATTENDANCE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MILESTONE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  SPECIAL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  OBS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function criteriaToForm(criteria: BadgeCriteria | null): {
  criteriaType: CriteriaType;
  criteriaCount: number;
} {
  if (!criteria) return { criteriaType: 'manual', criteriaCount: 1 };
  return {
    criteriaType: criteria.type,
    criteriaCount: criteria.count ?? 1,
  };
}

function formToCriteria(
  criteriaType: CriteriaType,
  criteriaCount: number
): BadgeCriteria | null {
  if (criteriaType === 'manual') return null;
  if (criteriaType === 'event_count') {
    return { type: 'event_count', count: criteriaCount };
  }
  return { type: criteriaType } as BadgeCriteria;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminBadgesPage() {
  // Badge list state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Award modal state
  const [awardBadgeId, setAwardBadgeId] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [awarding, setAwarding] = useState(false);

  // Seed state
  const [seeding, setSeeding] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // ---------- Toast ----------

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // ---------- Fetch badges ----------

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/badges');
      if (!res.ok) throw new Error('Failed to fetch badges');
      const data = await res.json();
      setBadges(data.badges ?? data ?? []);
    } catch {
      showToast('Failed to load badges', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // ---------- Create / Update badge ----------

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (badge: Badge) => {
    const { criteriaType, criteriaCount } = criteriaToForm(badge.criteria);
    setEditingId(badge.id);
    setForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      criteriaType,
      criteriaCount,
      sortOrder: badge.sortOrder,
      isActive: badge.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      showToast('Name and description are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        category: form.category,
        criteria: formToCriteria(form.criteriaType, form.criteriaCount),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/badges/${editingId}`
        : '/api/admin/badges';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save badge');
      }

      showToast(
        editingId ? 'Badge updated successfully' : 'Badge created successfully',
        'success'
      );
      setShowForm(false);
      fetchBadges();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save badge';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete badge ----------

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/badges/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete badge');
      showToast('Badge deleted', 'success');
      setDeleteConfirm(null);
      fetchBadges();
    } catch {
      showToast('Failed to delete badge', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Toggle active ----------

  const toggleActive = async (badge: Badge) => {
    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !badge.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update badge');
      fetchBadges();
    } catch {
      showToast('Failed to toggle badge status', 'error');
    }
  };

  // ---------- Award badge to user ----------

  const openAwardModal = (badgeId: string) => {
    setAwardBadgeId(badgeId);
    setUserQuery('');
    setUserResults([]);
  };

  // Debounced user search
  useEffect(() => {
    if (!awardBadgeId) return;
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/messages/user-search?q=${encodeURIComponent(userQuery.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setUserResults(data.users ?? []);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setUserResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [userQuery, awardBadgeId]);

  const awardToUser = async (userId: string) => {
    if (!awardBadgeId) return;
    setAwarding(true);
    try {
      const res = await fetch(`/api/admin/badges/${awardBadgeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to award badge');
      }

      showToast('Badge awarded successfully', 'success');
      setAwardBadgeId(null);
      fetchBadges();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to award badge';
      showToast(message, 'error');
    } finally {
      setAwarding(false);
    }
  };

  // ---------- Seed defaults ----------

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/badges/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed badges');
      showToast('Default badges created', 'success');
      fetchBadges();
    } catch {
      showToast('Failed to seed default badges', 'error');
    } finally {
      setSeeding(false);
    }
  };

  // ---------- Render ----------

  return (
    <div className="text-gray-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold">Badge Management</h1>
          </div>
          <p className="text-sm text-gray-400">
            Create, edit, and award badges to members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Award className="w-4 h-4 text-amber-400" />
            )}
            Seed Defaults
          </button>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm font-medium text-white"
          >
            <Plus className="w-4 h-4" />
            Create Badge
          </button>
        </div>
      </div>

      {/* Badge Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : badges.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No badges yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first badge or seed the default set to get started.
          </p>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm font-medium text-white"
          >
            <Award className="w-4 h-4" />
            Seed Default Badges
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white/5 backdrop-blur-xl border rounded-xl p-5 transition-all hover:bg-white/[0.07] ${
                badge.isActive
                  ? 'border-white/10'
                  : 'border-white/5 opacity-60'
              }`}
            >
              {/* Badge header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl leading-none flex-shrink-0">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white truncate">
                      {badge.name}
                    </h3>
                    {!badge.isActive && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    CATEGORY_COLORS[badge.category]
                  }`}
                >
                  {badge.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {badge._count.userBadges} earned
                </span>
                {badge.criteria && (
                  <span className="text-xs text-gray-500">
                    {badge.criteria.type === 'event_count'
                      ? `${badge.criteria.count} events`
                      : badge.criteria.type === 'first_event'
                      ? 'First event'
                      : 'OBS event'}
                  </span>
                )}
                {!badge.criteria && (
                  <span className="text-xs text-gray-500 italic">
                    Manual only
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => openAwardModal(badge.id)}
                  title="Award to user"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-lg transition-colors text-xs font-medium"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Award
                </button>
                <button
                  onClick={() => openEditForm(badge)}
                  title="Edit badge"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(badge)}
                  title={badge.isActive ? 'Deactivate' : 'Activate'}
                  className={`p-1.5 rounded-lg transition-colors text-xs ${
                    badge.isActive
                      ? 'hover:bg-orange-500/10 text-gray-400 hover:text-orange-400'
                      : 'hover:bg-green-500/10 text-gray-400 hover:text-green-400'
                  }`}
                >
                  {badge.isActive ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(badge.id)}
                  title="Delete badge"
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/* Create / Edit Modal                                                */}
      {/* ================================================================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-[#0a0a14] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="sticky top-0 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {editingId ? 'Edit Badge' : 'Create Badge'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Badge name..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What this badge is for..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) =>
                      setForm({ ...form, icon: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_SUGGESTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm({ ...form, icon: emoji })}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${
                          form.icon === emoji
                            ? 'bg-blue-500/20 border border-blue-500/40 ring-1 ring-blue-500/30'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as BadgeCategory,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Criteria Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Criteria
                  </label>
                  <select
                    value={form.criteriaType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        criteriaType: e.target.value as CriteriaType,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {CRITERIA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Event count input */}
                  {form.criteriaType === 'event_count' && (
                    <div className="mt-3">
                      <label className="text-xs text-gray-500 block mb-1">
                        Number of events required
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.criteriaCount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            criteriaCount:
                              parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  )}
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sortOrder: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Active Toggle */}
                <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, isActive: !form.isActive })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      form.isActive ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        form.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving
                    ? 'Saving...'
                    : editingId
                    ? 'Update Badge'
                    : 'Create Badge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Award Badge Modal                                                  */}
      {/* ================================================================== */}
      {awardBadgeId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAwardBadgeId(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-[#0a0a14] border border-white/10 rounded-xl shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  Award Badge
                </h2>
                <button
                  onClick={() => setAwardBadgeId(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Show which badge */}
                {(() => {
                  const badge = badges.find((b) => b.id === awardBadgeId);
                  if (!badge) return null;
                  return (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{badge.name}</div>
                        <div className="text-xs text-gray-400">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Search user */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Search User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      autoFocus
                    />
                    {searchingUsers && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Results */}
                {userResults.length > 0 && (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {userResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => awardToUser(user.id)}
                        disabled={awarding}
                        className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {user.name || user.email}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        {awarding ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                        ) : (
                          <Gift className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {userQuery.trim().length >= 2 &&
                  !searchingUsers &&
                  userResults.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No users found
                    </p>
                  )}

                {userQuery.trim().length < 2 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Delete Confirmation                                                */}
      {/* ================================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-[#0a0a14] border border-red-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Badge
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete this badge? Users who have already
              earned it will lose it. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Badge
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

      {/* ================================================================== */}
      {/* Toast                                                              */}
      {/* ================================================================== */}
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
