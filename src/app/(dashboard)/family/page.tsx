'use client';

/**
 * Family Member Management Page
 *
 * Allows FAMILY plan subscribers to manage up to 4 additional family members
 * (5 total including themselves). Features:
 * - View family member cards with roles
 * - Add new members (Spouse, Child, Other)
 * - Delete non-primary members with confirmation
 * - Generate and download QR codes for each member
 * - Print member cards
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Users,
  UserPlus,
  QrCode,
  Trash2,
  Edit2,
  Download,
  Printer,
  Shield,
  Loader2,
  X,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  familyRole: 'PRIMARY' | 'SPOUSE' | 'CHILD' | 'OTHER';
  qrUuid: string;
  createdAt: string;
}

interface FamilyData {
  family: { id: string; name: string } | null;
  members: FamilyMember[];
  maxMembers: number;
}

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  PRIMARY: 'Primary',
  SPOUSE: 'Spouse',
  CHILD: 'Child',
  OTHER: 'Other',
};

const ROLE_COLORS: Record<string, string> = {
  PRIMARY: 'bg-primary/20 text-primary',
  SPOUSE: 'bg-purple-500/20 text-purple-400',
  CHILD: 'bg-blue-500/20 text-blue-400',
  OTHER: 'bg-amber-500/20 text-amber-400',
};

let toastCounter = 0;

/**
 * Opens a new window with a printable member card.
 * Uses DOM manipulation instead of document.write for security.
 */
function openPrintCard(
  member: FamilyMember,
  qrDataUrl: string | null
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const doc = printWindow.document;

  // Build the page via DOM APIs
  const style = doc.createElement('style');
  style.textContent = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #fff;
    }
    .card {
      border: 2px solid #333;
      border-radius: 12px;
      padding: 32px;
      max-width: 350px;
      text-align: center;
    }
    .card h1 { font-size: 20px; margin: 0 0 4px; }
    .card h2 { font-size: 14px; color: #666; margin: 0 0 16px; font-weight: normal; }
    .card img { display: block; margin: 0 auto 16px; }
    .card .role {
      display: inline-block; background: #eee; padding: 4px 12px;
      border-radius: 999px; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .card .org { margin-top: 16px; font-size: 12px; color: #999; }
    @media print { body { background: #fff; } }
  `;
  doc.head.appendChild(style);

  doc.title = `SPAC Family Member Card - ${member.firstName} ${member.lastName}`;

  const card = doc.createElement('div');
  card.className = 'card';

  const h1 = doc.createElement('h1');
  h1.textContent = `${member.firstName} ${member.lastName}`;
  card.appendChild(h1);

  const h2 = doc.createElement('h2');
  h2.textContent = 'SPAC Family Member';
  card.appendChild(h2);

  if (qrDataUrl) {
    const img = doc.createElement('img');
    img.src = qrDataUrl;
    img.width = 200;
    img.height = 200;
    img.alt = 'QR Code';
    card.appendChild(img);
  }

  const role = doc.createElement('div');
  role.className = 'role';
  role.textContent = ROLE_LABELS[member.familyRole] || member.familyRole;
  card.appendChild(role);

  const org = doc.createElement('div');
  org.className = 'org';
  org.textContent = 'St. Petersburg Astronomy Club';
  card.appendChild(org);

  doc.body.appendChild(card);

  // Trigger print after the content is painted
  printWindow.addEventListener('load', () => printWindow.print());
  // Fallback for browsers that fire load before our listener
  setTimeout(() => printWindow.print(), 500);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyPage() {
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noFamilyPlan, setNoFamilyPlan] = useState(false);

  // Add member form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addRole, setAddRole] = useState<'SPOUSE' | 'CHILD' | 'OTHER'>('SPOUSE');
  const [addLoading, setAddLoading] = useState(false);

  // Edit member
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // QR modal
  const [qrMember, setQrMember] = useState<FamilyMember | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchFamily = useCallback(async () => {
    try {
      const res = await fetch('/api/user/family');
      if (res.status === 403) {
        setNoFamilyPlan(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load family data');
      }
      const data: FamilyData = await res.json();
      setFamilyData(data);
      setNoFamilyPlan(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  // -----------------------------------------------------------------------
  // Add member
  // -----------------------------------------------------------------------

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim()) return;

    setAddLoading(true);
    try {
      const res = await fetch('/api/user/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addFirstName.trim(),
          lastName: addLastName.trim(),
          familyRole: addRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }

      showToast(`${addFirstName.trim()} has been added to your family.`, 'success');
      setAddFirstName('');
      setAddLastName('');
      setAddRole('SPOUSE');
      setShowAddForm(false);
      await fetchFamily();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add member', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Edit member
  // -----------------------------------------------------------------------

  const startEditing = (member: FamilyMember) => {
    setEditingId(member.id);
    setEditFirstName(member.firstName);
    setEditLastName(member.lastName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFirstName('');
    setEditLastName('');
  };

  const handleEditMember = async (memberId: string) => {
    if (!editFirstName.trim() || !editLastName.trim()) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/user/family/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update member');
      }

      showToast('Member updated successfully.', 'success');
      cancelEditing();
      await fetchFamily();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update member', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Delete member
  // -----------------------------------------------------------------------

  const handleDeleteMember = async (memberId: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/user/family/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      showToast('Family member removed.', 'success');
      setDeletingId(null);
      await fetchFamily();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove member', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // QR Code
  // -----------------------------------------------------------------------

  const openQrModal = async (member: FamilyMember) => {
    setQrMember(member);
    setQrDataUrl(null);
    setQrLoading(true);

    try {
      const verifyUrl = `${window.location.origin}/verify/${member.qrUuid}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } catch {
      showToast('Failed to generate QR code', 'error');
      setQrMember(null);
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setQrMember(null);
    setQrDataUrl(null);
  };

  const downloadQr = () => {
    if (!qrDataUrl || !qrMember) return;
    const link = document.createElement('a');
    link.download = `${qrMember.firstName}-${qrMember.lastName}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const printCard = () => {
    if (!qrMember) return;
    openPrintCard(qrMember, qrDataUrl);
  };

  // -----------------------------------------------------------------------
  // Render: Loading state
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Error state
  // -----------------------------------------------------------------------

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl border border-red-500/50 bg-red-500/5 p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchFamily();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: No family plan
  // -----------------------------------------------------------------------

  if (noFamilyPlan) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">My Family</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Family Plan Required
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upgrade to a Family membership to add up to 4 additional family members.
            Each member gets their own QR code for event check-in and full membership
            benefits.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upgrade to Family Plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Family management
  // -----------------------------------------------------------------------

  const members = familyData?.members ?? [];
  const maxMembers = familyData?.maxMembers ?? 5;
  const canAddMore = members.length < maxMembers;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-right ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Family</h1>
            {familyData?.family?.name && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {familyData.family.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {members.length} of {maxMembers} family members
          </span>
          {canAddMore && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add Family Member
            </button>
          )}
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/30 bg-card mb-8">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Family Member
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddMember} className="p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="add-first-name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="add-first-name"
                  type="text"
                  required
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="add-last-name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="add-last-name"
                  type="text"
                  required
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="add-role"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Role
                </label>
                <select
                  id="add-role"
                  value={addRole}
                  onChange={(e) =>
                    setAddRole(e.target.value as 'SPOUSE' | 'CHILD' | 'OTHER')
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                >
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {members.length} of {maxMembers} spots used
                {canAddMore
                  ? ` -- ${maxMembers - members.length} remaining`
                  : ' -- no spots remaining'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addFirstName.trim() || !addLastName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Member
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No family members yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start building your family group by adding your first member.
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add Your First Member
            </button>
          )}
        </div>
      )}

      {/* Family Members Grid */}
      {members.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const isEditing = editingId === member.id;
            const isDeleting = deletingId === member.id;
            const isPrimary = member.familyRole === 'PRIMARY';

            return (
              <div
                key={member.id}
                className={`rounded-xl border bg-card transition-all ${
                  isPrimary
                    ? 'border-primary/40'
                    : isDeleting
                    ? 'border-red-500/50'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="p-5">
                  {/* Member header */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ROLE_COLORS[member.familyRole] || ROLE_COLORS.OTHER
                      }`}
                    >
                      {isPrimary && <Shield className="h-3 w-3" />}
                      {ROLE_LABELS[member.familyRole] || member.familyRole}
                    </span>

                    {!isPrimary && !isEditing && !isDeleting && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(member)}
                          title="Edit name"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(member.id)}
                          title="Remove member"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name display or edit form */}
                  {isEditing ? (
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditMember(member.id)}
                          disabled={
                            editLoading ||
                            !editFirstName.trim() ||
                            !editLastName.trim()
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {editLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {member.firstName} {member.lastName}
                    </h3>
                  )}

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 mb-3">
                      <p className="text-sm text-foreground mb-2">
                        Remove{' '}
                        <span className="font-medium">
                          {member.firstName} {member.lastName}
                        </span>{' '}
                        from your family?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={deleteLoading}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Remove
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Added date */}
                  {!isEditing && !isDeleting && (
                    <p className="text-xs text-muted-foreground mb-4">
                      {isPrimary
                        ? 'Account holder'
                        : `Added ${new Date(member.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`}
                    </p>
                  )}

                  {/* QR button */}
                  {!isEditing && !isDeleting && (
                    <button
                      onClick={() => openQrModal(member)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
                    >
                      <QrCode className="h-4 w-4 text-primary" />
                      View QR Code
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add member placeholder card */}
          {canAddMore && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-xl border border-dashed border-border bg-card/50 p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all min-h-[180px]"
            >
              <UserPlus className="h-8 w-8" />
              <span className="text-sm font-medium">Add Family Member</span>
              <span className="text-xs">
                {maxMembers - members.length} spot
                {maxMembers - members.length !== 1 ? 's' : ''} remaining
              </span>
            </button>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {qrMember && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQrModal();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Member QR Code</h3>
              <button
                onClick={closeQrModal}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 flex flex-col items-center">
              <h4 className="text-lg font-semibold text-foreground mb-1">
                {qrMember.firstName} {qrMember.lastName}
              </h4>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium mb-4 ${
                  ROLE_COLORS[qrMember.familyRole] || ROLE_COLORS.OTHER
                }`}
              >
                {qrMember.familyRole === 'PRIMARY' && (
                  <Shield className="h-3 w-3" />
                )}
                {ROLE_LABELS[qrMember.familyRole] || qrMember.familyRole}
              </span>

              {qrLoading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : qrDataUrl ? (
                <div className="bg-white rounded-xl p-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${qrMember.firstName} ${qrMember.lastName}`}
                    width={280}
                    height={280}
                    className="rounded-lg"
                  />
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground mb-4 text-center">
                Present this QR code at SPAC events for check-in
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={downloadQr}
                  disabled={!qrDataUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Download QR
                </button>
                <button
                  onClick={printCard}
                  disabled={!qrDataUrl}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  Print Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
