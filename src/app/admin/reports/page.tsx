'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Mail, RefreshCw, AlertCircle, CheckCircle,
  Clock, XCircle, CreditCard, ExternalLink, ChevronDown, ChevronRight,
  Download, Send,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RenewalMember {
  id: string;
  status: string;
  type: string;
  endDate: string | null;
  paypalCurrentPeriodEnd: string | null;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; phone: string | null };
}

interface PPTx {
  id: string;
  status: string;
  date: string;
  amount: string;
  currency: string;
  fee: string;
  type: string;
  email: string;
  name: string;
  description: string;
  paypalRefId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtAmt(a: string | undefined, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(parseFloat(a || '0'));
}
function memberName(u: RenewalMember['user']) {
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
}

// ─── Renewal Group ────────────────────────────────────────────────────────────
function RenewalGroup({
  title, subtitle, icon, group, accentColor, badgeColor,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  group: 'upcoming30' | 'thisMonth' | 'expired30'; accentColor: string; badgeColor: string;
}) {
  const [members,       setMembers]       = useState<RenewalMember[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState(false);
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState<string | null>(null);
  const [customMsg,     setCustomMsg]     = useState('');
  const [showCustom,    setShowCustom]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ renewalDays: group === 'upcoming30' ? '30' : group === 'thisMonth' ? '31' : '0', status: group === 'expired30' ? 'EXPIRED' : 'ACTIVE', limit: '200' });
      // Use the memberships API with appropriate filter
      // renewalDays param filters on endDate (with paypalCurrentPeriodEnd fallback for PayPal members)
      let url = `/api/admin/memberships?limit=200&sort=endDate&order=asc`;
      if (group === 'upcoming30') url += '&renewalDays=30';
      if (group === 'thisMonth')  url += '&renewalDays=31';
      if (group === 'expired30')  url += '&status=EXPIRED';
      const res = await fetch(url);
      const data = await res.json();
      setMembers(data.data ?? []);
    } finally { setLoading(false); }
  }, [group]);

  useEffect(() => { load(); }, [load]);

  async function sendReminders() {
    setSending(true); setResult(null);
    try {
      const res = await fetch('/api/admin/memberships/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, customMessage: customMsg || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setResult(`Error: ${data.error}`);
      else setResult(`✅ Sent ${data.sent} of ${data.total} reminder emails`);
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
    } finally { setSending(false); }
  }

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${accentColor}`}>
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
              {members.length} members
            </span>
          )}
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {/* Send action */}
          <div className="p-4 bg-muted/20 flex flex-col gap-3">
            {showCustom && (
              <textarea
                placeholder="Custom message (optional — default reminder text used if blank)"
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={sendReminders}
                disabled={sending || members.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : `Send Reminder to ${members.length} Members`}
              </button>
              <button
                onClick={() => setShowCustom(v => !v)}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                {showCustom ? 'Use Default Message' : 'Custom Message'}
              </button>
            </div>
            {result && (
              <p className={`text-sm ${result.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{result}</p>
            )}
          </div>

          {/* Member list */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No members in this group</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Renewal Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium text-foreground">{memberName(m.user)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{m.user.email}</td>
                      <td className="px-4 py-2 text-muted-foreground capitalize">{m.type.toLowerCase()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmt(m.paypalCurrentPeriodEnd ?? m.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PayPal Transactions Tab ──────────────────────────────────────────────────
function PayPalTransactions() {
  const [txs,     setTxs]     = useState<PPTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [days,    setDays]    = useState(90);
  const [gross,   setGross]   = useState('0.00');
  const [fees,    setFees]    = useState('0.00');
  const [net,     setNet]     = useState('0.00');
  const [loaded,  setLoaded]  = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/paypal-transactions?days=${days}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTxs(data.transactions ?? []);
      setGross(data.grossTotal ?? '0.00');
      setFees(data.feeTotal   ?? '0.00');
      setNet(data.netTotal    ?? '0.00');
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PayPal transactions');
    } finally { setLoading(false); }
  }

  const STATUS_COLORS: Record<string, string> = {
    S: 'text-green-500 bg-green-500/10',
    P: 'text-yellow-500 bg-yellow-500/10',
    V: 'text-red-500 bg-red-500/10',
    D: 'text-blue-500 bg-blue-500/10',
  };
  const STATUS_LABELS: Record<string, string> = {
    S: 'Completed', P: 'Pending', V: 'Reversed', D: 'Denied',
  };

  function exportCsv() {
    const rows = [
      ['Date','Name','Email','Description','Amount','Fee','Status','PayPal Ref'].join(','),
      ...txs.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.name, t.email, t.description,
        t.amount, t.fee,
        STATUS_LABELS[t.status] ?? t.status,
        t.paypalRefId,
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `paypal-transactions-${days}d.csv` });
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last 12 months</option>
        </select>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loaded ? 'Refresh' : 'Load from PayPal'}
        </button>
        {loaded && txs.length > 0 && (
          <button onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Totals */}
      {loaded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Gross Revenue', value: fmtAmt(gross), color: 'text-green-500' },
            { label: 'PayPal Fees',   value: fmtAmt(fees),  color: 'text-red-400'   },
            { label: 'Net Revenue',   value: fmtAmt(net),   color: 'text-primary'    },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loaded && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto -mx-0">

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Fee</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {txs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No transactions found</td></tr>
                ) : txs.map(t => {
                  const sc = STATUS_COLORS[t.status] ?? 'text-gray-400 bg-gray-400/10';
                  const sl = STATUS_LABELS[t.status] ?? t.status;
                  return (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{t.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={t.description}>
                        {t.description || t.type || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc}`}>
                          {sl}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {fmtAmt(t.amount, t.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-400 text-xs">
                        {t.fee && t.fee !== '0.00' ? fmtAmt(t.fee, t.currency) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.id && (
                          <a href={`https://www.paypal.com/activity/payment/${t.id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loaded && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Click "Load from PayPal" to fetch real-time transaction data</p>
          <p className="text-xs mt-1">Pulls directly from PayPal's Transaction Search API</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [tab, setTab] = useState<'renewal' | 'paypal'>('renewal');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Renewal reminders · PayPal transactions</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none">
        {([
          { id: 'renewal', label: 'Renewal Email Groups', icon: <Mail className="h-4 w-4" /> },
          { id: 'paypal',  label: 'PayPal Transactions',  icon: <CreditCard className="h-4 w-4" /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Renewal Groups */}
      {tab === 'renewal' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send targeted renewal reminder emails to members grouped by their renewal status.
            Click a group to expand the member list, then send reminders to all of them.
          </p>

          <RenewalGroup
            title="Expiring in Next 30 Days"
            subtitle="Active members whose membership expires within 30 days"
            icon={<Clock className="h-5 w-5 text-yellow-400" />}
            group="upcoming30"
            accentColor="border-yellow-500/30"
            badgeColor="text-yellow-400 bg-yellow-400/10"
          />
          <RenewalGroup
            title="Expiring This Month"
            subtitle="Active members whose membership expires this calendar month"
            icon={<AlertCircle className="h-5 w-5 text-orange-400" />}
            group="thisMonth"
            accentColor="border-orange-500/30"
            badgeColor="text-orange-400 bg-orange-400/10"
          />
          <RenewalGroup
            title="Recently Expired (Last 30 Days)"
            subtitle="Members whose membership expired in the last 30 days"
            icon={<XCircle className="h-5 w-5 text-red-400" />}
            group="expired30"
            accentColor="border-red-500/30"
            badgeColor="text-red-400 bg-red-400/10"
          />
        </div>
      )}

      {/* PayPal Transactions */}
      {tab === 'paypal' && <PayPalTransactions />}
    </div>
  );
}
