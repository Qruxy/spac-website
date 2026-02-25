'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  X,
  QrCode,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  CreditCard,
  Tent,
  Utensils,
  Badge,
} from 'lucide-react';
import type { OBSConfigSerialized, OBSRegistration, NavSection } from '../types';

interface Props {
  config: OBSConfigSerialized | null;
  eventDayMode: boolean;
  onSetEventDayMode: (v: boolean) => void;
  onNavigate: (section: NavSection) => void;
}

const TYPE_COLORS: Record<string, string> = {
  ATTENDEE: 'bg-blue-500/15 text-blue-400',
  SPEAKER: 'bg-violet-500/15 text-violet-400',
  VENDOR: 'bg-amber-500/15 text-amber-400',
  STAFF: 'bg-emerald-500/15 text-emerald-400',
  VOLUNTEER: 'bg-pink-500/15 text-pink-400',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-500/15 text-emerald-400',
  PENDING: 'bg-amber-500/15 text-amber-400',
  FAILED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-white/10 text-muted-foreground',
  PARTIAL: 'bg-orange-500/15 text-orange-400',
};

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  config,
  registrations,
  loading,
  onUpdate,
  onDelete,
}: {
  config: OBSConfigSerialized;
  registrations: OBSRegistration[];
  loading: boolean;
  onUpdate: (updated: OBSRegistration) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [campingFilter, setCampingFilter] = useState('ANY');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.firstName.toLowerCase().includes(q) &&
          !r.lastName.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q)
        )
          return false;
      }
      if (typeFilter !== 'ALL' && r.registrationType !== typeFilter) return false;
      if (paymentFilter !== 'ALL' && r.paymentStatus !== paymentFilter) return false;
      if (campingFilter === 'YES' && !r.campingRequested) return false;
      if (campingFilter === 'NO' && r.campingRequested) return false;
      return true;
    });
  }, [registrations, search, typeFilter, paymentFilter, campingFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCheckIn = async (reg: OBSRegistration) => {
    setActionLoading(reg.id);
    const method = reg.checkedIn ? 'DELETE' : 'POST';
    const res = await fetch(`/api/obs/check-in/${reg.id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) {
      const data = await res.json() as OBSRegistration & { newBadges?: string[]; revokedBadges?: string[] };
      onUpdate({
        ...reg,
        checkedIn: !reg.checkedIn,
        checkedInAt: data.checkedInAt ?? null,
      });
    }
    setActionLoading(null);
  };

  const handleMarkPaid = async (reg: OBSRegistration) => {
    setActionLoading(reg.id + '-pay');
    const res = await fetch(`/api/admin/obs/registrations/${reg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'PAID' }),
    });
    if (res.ok) {
      const data = await res.json() as OBSRegistration;
      onUpdate({ ...reg, paymentStatus: data.paymentStatus, paymentDate: data.paymentDate ?? null });
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this registration? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/obs/registrations/${id}`, { method: 'DELETE' });
    if (res.ok) onDelete(id);
  };

  const handleBulkMarkPaid = async () => {
    for (const id of Array.from(selected)) {
      const reg = registrations.find((r) => r.id === id);
      if (reg && reg.paymentStatus !== 'PAID') {
        const res = await fetch(`/api/admin/obs/registrations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentStatus: 'PAID' }),
        });
        if (res.ok) {
          const data = await res.json() as OBSRegistration;
          onUpdate({ ...reg, paymentStatus: data.paymentStatus });
        }
      }
    }
    setSelected(new Set());
  };

  const exportCSV = () => {
    const data = registrations;
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Type', 'Payment', 'Amount Paid',
      'Camping', 'Meal', 'T-Shirt', 'Dietary', 'Arrival', 'Departure',
      'Checked In', 'Checked In At', 'Member', 'Registered',
    ];
    const rows = data.map((r) => [
      r.firstName, r.lastName, r.email, r.phone ?? '',
      r.registrationType, r.paymentStatus, r.amountPaid,
      r.campingRequested ? 'Yes' : 'No',
      r.mealRequested ? 'Yes' : 'No',
      r.tShirtSize ?? '', r.dietaryRestrictions ?? '',
      r.arrivalDate ? new Date(r.arrivalDate).toLocaleDateString() : '',
      r.departureDate ? new Date(r.departureDate).toLocaleDateString() : '',
      r.checkedIn ? 'Yes' : 'No',
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : '',
      r.isMember ? 'Yes' : 'No',
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obs-${config.year}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    setComposeSending(true);
    const selectedRegs = registrations.filter((r) => selected.has(r.id));
    const emails = selectedRegs.map((r) => r.email);
    try {
      await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emails, subject: composeSubject, html: composeBody }),
      });
    } catch {
      // Silently fail — communications endpoint may not be implemented
    }
    setComposeSending(false);
    setComposeOpen(false);
    setSelected(new Set());
  };

  const total = registrations.length;
  const capacityPct = config.capacity > 0 ? Math.min(100, Math.round((total / config.capacity) * 100)) : 0;

  const selectClass = 'bg-white/5 border border-border rounded-lg px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-amber-500/50';

  return (
    <div className="space-y-4">
      {/* Capacity bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{total} / {config.capacity} registered</span>
          <span className={`font-medium ${capacityPct >= 90 ? 'text-red-400' : capacityPct >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {capacityPct}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            className="w-full bg-white/5 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500/50"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
          <option value="ALL">All Types</option>
          {['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER'].map((t) => (
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={selectClass}>
          <option value="ALL">All Payments</option>
          {['PAID', 'PENDING', 'FAILED'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={campingFilter} onChange={(e) => setCampingFilter(e.target.value)} className={selectClass}>
          <option value="ANY">Any Camping</option>
          <option value="YES">Camping ✓</option>
          <option value="NO">No Camping</option>
        </select>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:border-blue-500/30 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
          <span className="text-amber-400 font-medium">{selected.size} selected</span>
          <button onClick={() => setComposeOpen(true)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="w-3.5 h-3.5" />
            Send Email
          </button>
          <button onClick={handleBulkMarkPaid} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <CreditCard className="w-3.5 h-3.5" />
            Mark Paid
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading registrations…
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">⛺</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">🍽</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Registered</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No registrations match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg) => (
                    <>
                      <tr key={reg.id} className={`group hover:bg-white/[0.02] transition-colors ${selected.has(reg.id) ? 'bg-amber-500/5' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(reg.id)}
                            onChange={() => toggleSelect(reg.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {reg.firstName} {reg.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{reg.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[reg.registrationType] ?? 'bg-white/5 text-muted-foreground'}`}>
                            {reg.registrationType.charAt(0) + reg.registrationType.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[reg.paymentStatus] ?? 'bg-white/5 text-muted-foreground'}`}>
                            {reg.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {reg.campingRequested ? <Tent className="w-4 h-4 text-emerald-400 inline" /> : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {reg.mealRequested ? <Utensils className="w-4 h-4 text-amber-400 inline" /> : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpanded(expanded === reg.id ? null : reg.id)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              title="Toggle details"
                            >
                              {expanded === reg.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleCheckIn(reg)}
                              disabled={actionLoading === reg.id}
                              className={`p-1.5 transition-colors ${reg.checkedIn ? 'text-emerald-400 hover:text-muted-foreground' : 'text-muted-foreground hover:text-emerald-400'}`}
                              title={reg.checkedIn ? 'Undo check-in' : 'Check in'}
                            >
                              {actionLoading === reg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            {reg.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handleMarkPaid(reg)}
                                disabled={actionLoading === reg.id + '-pay'}
                                className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors"
                                title="Mark paid"
                              >
                                {actionLoading === reg.id + '-pay' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(reg.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                              title="Delete registration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded === reg.id && (
                        <tr key={`${reg.id}-details`} className="bg-white/[0.01]">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground mb-1">Contact</p>
                                <p className="text-foreground">{reg.phone ?? '—'}</p>
                                <p className="text-foreground">{[reg.address, reg.city, reg.state, reg.zip].filter(Boolean).join(', ') || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Preferences</p>
                                <p className="text-foreground">T-Shirt: {reg.tShirtSize ?? '—'}</p>
                                <p className="text-foreground">Dietary: {reg.dietaryRestrictions ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Dates</p>
                                <p className="text-foreground">Arrival: {reg.arrivalDate ? new Date(reg.arrivalDate).toLocaleDateString() : '—'}</p>
                                <p className="text-foreground">Departure: {reg.departureDate ? new Date(reg.departureDate).toLocaleDateString() : '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Check-In</p>
                                <p className={reg.checkedIn ? 'text-emerald-400' : 'text-muted-foreground'}>
                                  {reg.checkedIn ? `✓ ${reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : ''}` : 'Not checked in'}
                                </p>
                                <p className="text-foreground mt-1">Member: {reg.isMember ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Future-proof door token section */}
      <details className="bg-card border border-border rounded-xl overflow-hidden">
        <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-foreground select-none hover:bg-white/5 transition-colors">
          Event Day Access (Admin)
        </summary>
        <div className="px-5 pb-5 pt-3 border-t border-border text-sm text-muted-foreground space-y-2">
          <p>Event Day Mode is currently restricted to Admin/Moderator accounts.</p>
          <button disabled className="px-4 py-2 bg-white/5 border border-border rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
            Generate Door Token (coming soon)
          </button>
          {/* TODO(future): generate time-limited JWT for volunteer door access */}
        </div>
      </details>

      {/* Email compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Send Email to {selected.size} recipient{selected.size !== 1 ? 's' : ''}
              </h3>
              <button onClick={() => setComposeOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Subject</label>
              <input
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500/50"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject…"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Message</label>
              <textarea
                className="w-full h-40 bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500/50 resize-none"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Email body (HTML supported)…"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setComposeOpen(false)} className="flex-1 py-2 bg-white/5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={handleSendEmail} disabled={composeSending} className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {composeSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Event Day Mode ───────────────────────────────────────────────────────────

function EventDayMode({
  config,
  registrations,
  onUpdate,
  onExit,
}: {
  config: OBSConfigSerialized;
  registrations: OBSRegistration[];
  onUpdate: (updated: OBSRegistration) => void;
  onExit: () => void;
}) {
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const checkedInCount = registrations.filter((r) => r.checkedIn).length;
  const total = registrations.length;

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return registrations.filter(
      (r) =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q),
    );
  }, [registrations, search]);

  const handleCheckIn = async (reg: OBSRegistration) => {
    if (reg.checkedIn) return;
    setActionLoading(reg.id);
    const res = await fetch(`/api/obs/check-in/${reg.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) {
      const data = await res.json() as OBSRegistration & { newBadges?: string[] };
      onUpdate({ ...reg, checkedIn: true, checkedInAt: data.checkedInAt ?? new Date().toISOString() });
    }
    setActionLoading(null);
  };

  const handleBadgePrinted = async (reg: OBSRegistration) => {
    const res = await fetch(`/api/admin/obs/registrations/${reg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badgePrinted: !reg.badgePrinted }),
    });
    if (res.ok) {
      const data = await res.json() as OBSRegistration;
      onUpdate({ ...reg, badgePrinted: data.badgePrinted });
    }
  };

  const startQRScan = async () => {
    setScanError('');
    setScanning(true);
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      scannerRef.current = reader;

      if (!videoRef.current) return;

      const result = await reader.decodeFromVideoDevice(undefined, videoRef.current, async (result, _err, controls) => {
        if (result) {
          controls.stop();
          setScanning(false);
          const uuid = result.getText();
          // Attempt OBS-specific QR check-in via by-uuid endpoint
          const res = await fetch(`/api/admin/obs/registrations/by-uuid/${uuid}?obsId=${config.id}`, {
            method: 'POST',
          });
          if (res.ok) {
            const data = await res.json() as OBSRegistration;
            onUpdate(data);
            setSearch(`${data.firstName} ${data.lastName}`);
          } else {
            const err = await res.json() as { error: string };
            setScanError(err.error ?? 'QR check-in failed.');
          }
        }
      });
      void result;
    } catch {
      setScanError('Camera access denied or QR scanner unavailable.');
      setScanning(false);
    }
  };

  const stopQRScan = () => {
    setScanning(false);
    if (scannerRef.current && typeof (scannerRef.current as { reset?: () => void }).reset === 'function') {
      (scannerRef.current as { reset: () => void }).reset();
    }
    scannerRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#060611] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#060611]">
        <div>
          <p className="text-3xl font-bold text-foreground">
            <span className="text-emerald-400">{checkedInCount}</span>
            <span className="text-muted-foreground text-xl"> / {total}</span>
          </p>
          <p className="text-xs text-muted-foreground">checked in</p>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-red-500/30 text-muted-foreground hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Exit Event Day Mode
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-4 text-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="Search by name or scan badge…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={scanning ? stopQRScan : startQRScan}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors ${
              scanning
                ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
            }`}
          >
            <QrCode className="w-5 h-5" />
            {scanning ? 'Stop Scan' : '📷 Scan QR'}
          </button>
        </div>

        {scanning && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64">
            <video ref={videoRef} className="w-full h-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-amber-400 rounded-xl opacity-60" />
            </div>
          </div>
        )}

        {scanError && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            <XCircle className="w-4 h-4 shrink-0" />
            {scanError}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 px-6 pb-6 space-y-3">
        {!search.trim() ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
            Scan a QR code or type a name to find a registration
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No registrations found for &quot;{search}&quot;
          </div>
        ) : (
          results.map((reg) => (
            <div
              key={reg.id}
              className={`bg-card border rounded-xl p-5 space-y-3 ${
                reg.checkedIn ? 'border-emerald-500/30' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {reg.firstName} {reg.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{reg.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[reg.registrationType] ?? 'bg-white/5 text-muted-foreground'}`}>
                      {reg.registrationType.charAt(0) + reg.registrationType.slice(1).toLowerCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[reg.paymentStatus] ?? 'bg-white/5 text-muted-foreground'}`}>
                      {reg.paymentStatus}
                    </span>
                    {reg.campingRequested && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-medium">
                        ⛺ Camping
                      </span>
                    )}
                  </div>
                </div>

                {reg.checkedIn ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold text-sm whitespace-nowrap">
                    <CheckCircle2 className="w-5 h-5" />
                    Already Checked In
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckIn(reg)}
                    disabled={actionLoading === reg.id}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading === reg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    CHECK IN
                  </button>
                )}
              </div>

              {/* Badge printed toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleBadgePrinted(reg)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    reg.badgePrinted
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                      : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Badge className="w-3.5 h-3.5" />
                  Badge Printed
                  {reg.badgePrinted && ' ✓'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OBSRegistrations({ config, eventDayMode, onSetEventDayMode, onNavigate: _onNavigate }: Props) {
  const [registrations, setRegistrations] = useState<OBSRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRegistrations = useCallback(async (obsId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/obs/registrations?obsId=${obsId}`);
      const data = await res.json() as OBSRegistration[] | { error: string };
      if (Array.isArray(data)) setRegistrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config) loadRegistrations(config.id);
  }, [config?.id, loadRegistrations]);

  const handleUpdate = useCallback((updated: OBSRegistration) => {
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="w-16 h-16 text-white/10 mb-4" />
        <p className="text-muted-foreground text-sm">Select an OBS configuration to view registrations.</p>
      </div>
    );
  }

  if (eventDayMode) {
    return (
      <EventDayMode
        config={config}
        registrations={registrations}
        onUpdate={handleUpdate}
        onExit={() => onSetEventDayMode(false)}
      />
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Registrations</h1>
          <p className="text-sm text-muted-foreground">{config.eventName}</p>
        </div>
        <button
          onClick={() => onSetEventDayMode(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          <QrCode className="w-4 h-4" />
          🚪 Event Day Mode
        </button>
      </div>

      <ListView
        config={config}
        registrations={registrations}
        loading={loading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
