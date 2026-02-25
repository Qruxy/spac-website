'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

type PaymentType   = 'SUBSCRIPTION' | 'EVENT_TICKET' | 'OBS_REGISTRATION' | 'CAMPING_FEE' | 'DONATION';
type PaymentStatus = 'SUCCEEDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'FAILED';

interface PaymentRecord {
  id:              string;
  type:            PaymentType;
  amount:          string;
  currency:        string;
  status:          PaymentStatus;
  description:     string | null;
  paypalOrderId:   string | null;
  paypalCaptureId: string | null;
  paidAt:          string | null;
  createdAt:       string;
  user: {
    id:        string;
    firstName: string | null;
    lastName:  string | null;
    name:      string | null;
    email:     string;
  };
  registrations: Array<{
    id:    string;
    event: { title: string; slug: string } | null;
  }>;
}

interface RefundModalState {
  payment:       PaymentRecord;
  amount:        string;
  note:          string;
  loading:       boolean;
  error:         string | null;
}

const TYPE_LABELS: Record<PaymentType, string> = {
  SUBSCRIPTION:      'Membership',
  EVENT_TICKET:      'Event Ticket',
  OBS_REGISTRATION:  'OBS Event',
  CAMPING_FEE:       'Camping Fee',
  DONATION:          'Donation',
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCEEDED:           { label: 'Succeeded',  color: 'text-green-500  bg-green-500/10',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REFUNDED:            { label: 'Refunded',   color: 'text-blue-400   bg-blue-400/10',   icon: <RotateCcw   className="h-3.5 w-3.5" /> },
  PARTIALLY_REFUNDED:  { label: 'Partial Ref',color: 'text-yellow-400 bg-yellow-400/10', icon: <RotateCcw   className="h-3.5 w-3.5" /> },
  PENDING:             { label: 'Pending',    color: 'text-gray-400   bg-gray-400/10',   icon: <Clock       className="h-3.5 w-3.5" /> },
  FAILED:              { label: 'Failed',     color: 'text-red-500    bg-red-500/10',     icon: <XCircle     className="h-3.5 w-3.5" /> },
};

const PAGE_SIZE = 25;

function userName(u: PaymentRecord['user']) {
  if (u.name) return u.name;
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtAmount(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase() || 'USD',
  }).format(Number(amount));
}

export default function AdminPaymentsPage() {
  const [payments,     setPayments]     = useState<PaymentRecord[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalAmount,  setTotalAmount]  = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Filters
  const [search,   setSearch]   = useState('');
  const [type,     setType]     = useState('');
  const [status,   setStatus]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  // Refund modal
  const [refundModal, setRefundModal] = useState<RefundModalState | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search)   p.set('search',   search);
      if (type)     p.set('type',     type);
      if (status)   p.set('status',   status);
      if (dateFrom) p.set('dateFrom', dateFrom);
      if (dateTo)   p.set('dateTo',   dateTo);

      const res = await fetch(`/api/admin/payments?${p}`);
      if (!res.ok) throw new Error('Failed to load payments');
      const data = await res.json();
      setPayments(data.data       ?? []);
      setTotal(data.total         ?? 0);
      setTotalAmount(data.totalAmount ?? 0);
      setTotalPages(data.totalPages   ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search, type, status, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [search, type, status, dateFrom, dateTo]);

  function openRefund(p: PaymentRecord) {
    setRefundModal({ payment: p, amount: p.amount, note: '', loading: false, error: null });
  }

  async function submitRefund() {
    if (!refundModal) return;
    setRefundModal(m => m ? { ...m, loading: true, error: null } : m);

    const refundAmt = parseFloat(refundModal.amount);
    const fullAmt   = parseFloat(refundModal.payment.amount);

    try {
      const res = await fetch(`/api/admin/payments/${refundModal.payment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(refundAmt < fullAmt ? { amount: refundAmt } : {}),
          ...(refundModal.note ? { note: refundModal.note } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund failed');

      setRefundModal(null);
      setRefundSuccess(
        `Refund of ${fmtAmount(String(data.refundAmount), refundModal.payment.currency)} issued successfully (ID: ${data.refundId})`
      );
      setTimeout(() => setRefundSuccess(null), 8000);
      await fetchPayments();
    } catch (e) {
      setRefundModal(m => m ? { ...m, loading: false, error: e instanceof Error ? e.message : 'Refund failed' } : m);
    }
  }

  const refundableStatuses: PaymentStatus[] = ['SUCCEEDED', 'PARTIALLY_REFUNDED'];
  const canRefund = (p: PaymentRecord) =>
    refundableStatuses.includes(p.status) && !!p.paypalCaptureId;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-sm text-muted-foreground">{total} records · {fmtAmount(String(totalAmount), 'USD')} filtered total</p>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Refund success toast */}
      {refundSuccess && (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {refundSuccess}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={type} onChange={e => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partial Refund</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm" title="From date" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm" title="To date" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const sc  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                  const ref = p.registrations[0];
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{userName(p.user)}</p>
                          <p className="text-xs text-muted-foreground">{p.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[p.type] ?? p.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                        {fmtAmount(p.amount, p.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[220px]">
                        {ref?.event ? (
                          <span className="truncate block" title={ref.event.title}>{ref.event.title}</span>
                        ) : (
                          <span className="truncate block" title={p.description ?? ''}>{p.description ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmt(p.paidAt ?? p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.paypalOrderId && (
                            <a
                              href={`https://www.paypal.com/activity/payment/${p.paypalOrderId}`}
                              target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="View in PayPal"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {canRefund(p) && (
                            <button
                              onClick={() => openRefund(p)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-foreground px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-foreground">Issue Refund</h2>
              </div>
              <button onClick={() => setRefundModal(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payment summary */}
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium text-foreground">{userName(refundModal.payment.user)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{TYPE_LABELS[refundModal.payment.type] ?? refundModal.payment.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Amount</span>
                <span className="font-mono font-semibold text-foreground">
                  {fmtAmount(refundModal.payment.amount, refundModal.payment.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-foreground">{fmt(refundModal.payment.paidAt)}</span>
              </div>
            </div>

            {/* Refund amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Refund Amount <span className="text-muted-foreground font-normal">(full refund by default)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundModal.payment.amount}
                  value={refundModal.amount}
                  onChange={e => setRefundModal(m => m ? { ...m, amount: e.target.value } : m)}
                  className="w-full pl-7 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {parseFloat(refundModal.amount) < parseFloat(refundModal.payment.amount) && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Partial refund — difference stays with SPAC
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Note to payer <span className="text-muted-foreground font-normal">(optional, shown by PayPal)</span>
              </label>
              <input
                type="text"
                maxLength={255}
                placeholder="e.g. Event cancelled, full refund issued"
                value={refundModal.note}
                onChange={e => setRefundModal(m => m ? { ...m, note: e.target.value } : m)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Error */}
            {refundModal.error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {refundModal.error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRefundModal(null)}
                disabled={refundModal.loading}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRefund}
                disabled={refundModal.loading || !refundModal.amount || parseFloat(refundModal.amount) <= 0}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {refundModal.loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {refundModal.loading ? 'Processing…' : `Refund ${fmtAmount(refundModal.amount || '0', refundModal.payment.currency)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
