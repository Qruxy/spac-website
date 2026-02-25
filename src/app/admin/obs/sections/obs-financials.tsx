'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { OBSConfigSerialized, OBSFinancialItem } from '../types';

interface Props {
  config: OBSConfigSerialized | null;
}

interface FinancialData {
  items: OBSFinancialItem[];
  registrationRevenue: number;
}

const CATEGORY_SUGGESTIONS = [
  'Equipment', 'Site Fee', 'Printing', 'Food', 'Misc Income', 'Misc Expense',
  'Marketing', 'Supplies', 'Transportation', 'Awards',
];

function toDateInput(isoStr: string): string {
  if (!isoStr) return new Date().toISOString().slice(0, 10);
  return new Date(isoStr).toISOString().slice(0, 10);
}

interface RowState {
  localId: string;
  id?: string;
  category: string;
  description: string;
  amount: string;
  isIncome: boolean;
  date: string;
  saving: boolean;
  isNew: boolean;
}

export function OBSFinancials({ config }: Props) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RowState[]>([]);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const loadData = useCallback(async (obsId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/obs/financials?obsId=${obsId}`);
      const json = await res.json() as FinancialData;
      setData(json);
      setRows(
        json.items.map((item) => ({
          localId: item.id,
          id: item.id,
          category: item.category,
          description: item.description,
          amount: parseFloat(item.amount).toFixed(2),
          isIncome: item.isIncome,
          date: toDateInput(item.date),
          saving: false,
          isNew: false,
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config) loadData(config.id);
  }, [config?.id, loadData]);

  const updateRow = (localId: string, changes: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...changes } : r)));
  };

  const scheduleSave = (row: RowState) => {
    if (row.isNew) return; // New rows save on blur differently
    const existing = saveTimers.current.get(row.localId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      void saveRow(row);
    }, 600);
    saveTimers.current.set(row.localId, timer);
  };

  const saveRow = async (row: RowState) => {
    if (!config) return;
    if (!row.id) {
      // Create
      updateRow(row.localId, { saving: true });
      const res = await fetch('/api/admin/obs/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obsConfigId: config.id,
          category: row.category || 'Misc',
          description: row.description || '—',
          amount: parseFloat(row.amount) || 0,
          isIncome: row.isIncome,
          date: row.date || new Date().toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        const created = await res.json() as OBSFinancialItem;
        updateRow(row.localId, { id: created.id, saving: false, isNew: false });
      } else {
        updateRow(row.localId, { saving: false });
      }
    } else {
      // Update
      updateRow(row.localId, { saving: true });
      await fetch(`/api/admin/obs/financials/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: row.category,
          description: row.description,
          amount: parseFloat(row.amount) || 0,
          isIncome: row.isIncome,
          date: row.date,
        }),
      });
      updateRow(row.localId, { saving: false });
    }
  };

  const handleBlur = (row: RowState) => {
    void saveRow(row);
  };

  const handleChange = (localId: string, field: keyof RowState, value: string | boolean) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.localId === localId ? { ...r, [field]: value } : r,
      );
      const row = updated.find((r) => r.localId === localId);
      if (row && !row.isNew) scheduleSave(row);
      return updated;
    });
  };

  const addRow = (isIncome: boolean) => {
    const localId = `new-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        localId,
        category: '',
        description: '',
        amount: '0.00',
        isIncome,
        date: new Date().toISOString().slice(0, 10),
        saving: false,
        isNew: true,
      },
    ]);
  };

  const deleteRow = async (row: RowState) => {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.localId !== row.localId));
      return;
    }
    const res = await fetch(`/api/admin/obs/financials/${row.id}`, { method: 'DELETE' });
    if (res.ok) setRows((prev) => prev.filter((r) => r.localId !== row.localId));
  };

  const exportCSV = () => {
    if (!config || !data) return;
    const headers = ['Category', 'Description', 'Amount', 'Type', 'Date'];
    const regRow = ['Registration Revenue', 'Auto-calculated from paid registrations', data.registrationRevenue.toFixed(2), 'Income', ''];
    const itemRows = rows.map((r) => [
      r.category, r.description, r.amount, r.isIncome ? 'Income' : 'Expense', r.date,
    ]);
    const csv = [headers, regRow, ...itemRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obs-${config.year}-pl.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <DollarSign className="w-16 h-16 text-white/10 mb-4" />
        <p className="text-muted-foreground text-sm">Select an OBS configuration to view financials.</p>
      </div>
    );
  }

  const incomeItems = rows.filter((r) => r.isIncome);
  const expenseItems = rows.filter((r) => !r.isIncome);
  const manualIncome = incomeItems.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalIncome = (data?.registrationRevenue ?? 0) + manualIncome;
  const totalExpenses = expenseItems.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const net = totalIncome - totalExpenses;

  const inputClass = 'bg-transparent border border-transparent hover:border-border focus:border-amber-500/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none transition-colors w-full';

  const renderRows = (items: RowState[]) =>
    items.map((row) => (
      <tr key={row.localId} className="group border-b border-border last:border-0">
        <td className="px-3 py-2">
          <div className="relative">
            <input
              className={inputClass}
              value={row.category}
              list="category-suggestions"
              onChange={(e) => handleChange(row.localId, 'category', e.target.value)}
              onBlur={() => handleBlur(row)}
              placeholder="Category…"
            />
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            className={inputClass}
            value={row.description}
            onChange={(e) => handleChange(row.localId, 'description', e.target.value)}
            onBlur={() => handleBlur(row)}
            placeholder="Description…"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">{row.isIncome ? '+$' : '-$'}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass} text-right`}
              value={row.amount}
              onChange={(e) => handleChange(row.localId, 'amount', e.target.value)}
              onBlur={() => handleBlur(row)}
            />
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            type="date"
            className={inputClass}
            value={row.date}
            onChange={(e) => handleChange(row.localId, 'date', e.target.value)}
            onBlur={() => handleBlur(row)}
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-between gap-1">
            <select
              className="bg-transparent text-xs text-muted-foreground focus:outline-none"
              value={row.isIncome ? 'income' : 'expense'}
              onChange={(e) => {
                const isIncome = e.target.value === 'income';
                handleChange(row.localId, 'isIncome', isIncome);
              }}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div className="flex items-center gap-1">
              {row.saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              <button
                onClick={() => deleteRow(row)}
                className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </td>
      </tr>
    ));

  return (
    <div className="space-y-6 max-w-5xl">
      <datalist id="category-suggestions">
        {CATEGORY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
      </datalist>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Financials</h1>
          <p className="text-sm text-muted-foreground">{config.eventName} — P&amp;L</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border hover:border-blue-500/30 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export P&amp;L (CSV)
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Income Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Income</h3>
              </div>
              <button
                onClick={() => addRow(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {/* Auto income row */}
                <tr className="border-b border-border bg-emerald-500/[0.03]">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground italic">Auto</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">Registration Revenue (paid registrations)</td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium text-emerald-400">
                    +${(data?.registrationRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">—</td>
                  <td className="px-3 py-2.5" />
                </tr>
                {renderRows(incomeItems)}
                {incomeItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-xs text-muted-foreground text-center">
                      No manual income items. Click &quot;Add&quot; to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expenses Section */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-red-500/5">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-foreground">Expenses</h3>
              </div>
              <button
                onClick={() => addRow(false)}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Category</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {renderRows(expenseItems)}
                {expenseItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-xs text-muted-foreground text-center">
                      No expense items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                <p className="text-xl font-bold text-emerald-400">
                  ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-red-400">
                  ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Net</p>
                <p className={`text-xl font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {net >= 0 ? '+' : ''}${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
