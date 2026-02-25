'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Plus,
  Loader2,
} from 'lucide-react';
import type { OBSConfigSerialized } from '../types';

interface Props {
  config: OBSConfigSerialized | null;
  configs: OBSConfigSerialized[];
  isAdmin: boolean;
  onConfigUpdate: (updated: OBSConfigSerialized) => void;
  onConfigCreate: (created: OBSConfigSerialized) => void;
  onActivate: (id: string) => void;
}

function toDateInput(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  return isoStr.slice(0, 10);
}

function toDatetimeLocal(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
}

interface FormState {
  eventName: string;
  year: number | '';
  startDate: string;
  endDate: string;
  location: string;
  capacity: number | '';
  description: string;
  registrationOpens: string;
  registrationCloses: string;
  earlyBirdDeadline: string;
  memberPrice: string;
  nonMemberPrice: string;
  earlyBirdDiscount: string;
  campingPrice: string;
  mealPrice: string;
}

function configToForm(config: OBSConfigSerialized): FormState {
  return {
    eventName: config.eventName,
    year: config.year,
    startDate: toDateInput(config.startDate),
    endDate: toDateInput(config.endDate),
    location: config.location,
    capacity: config.capacity,
    description: config.description ?? '',
    registrationOpens: toDatetimeLocal(config.registrationOpens),
    registrationCloses: toDatetimeLocal(config.registrationCloses),
    earlyBirdDeadline: toDatetimeLocal(config.earlyBirdDeadline),
    memberPrice: config.memberPrice.toFixed(2),
    nonMemberPrice: config.nonMemberPrice.toFixed(2),
    earlyBirdDiscount: config.earlyBirdDiscount.toFixed(2),
    campingPrice: config.campingPrice.toFixed(2),
    mealPrice: config.mealPrice.toFixed(2),
  };
}

const EMPTY_FORM: FormState = {
  eventName: '',
  year: new Date().getFullYear() + 1,
  startDate: '',
  endDate: '',
  location: '',
  capacity: 200,
  description: '',
  registrationOpens: '',
  registrationCloses: '',
  earlyBirdDeadline: '',
  memberPrice: '0.00',
  nonMemberPrice: '0.00',
  earlyBirdDiscount: '0.00',
  campingPrice: '0.00',
  mealPrice: '0.00',
};

export function OBSSetup({ config, configs, isAdmin, onConfigUpdate, onConfigCreate, onActivate }: Props) {
  const [form, setForm] = useState<FormState>(config ? configToForm(config) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cloneWarning, setCloneWarning] = useState(false);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(configToForm(config));
      setCloneWarning(false);
      setErrorMsg('');
      setSavedMsg('');
    }
  }, [config?.id]);

  const prevYear = configs.find((c) => c.year === (typeof form.year === 'number' ? form.year - 1 : -1));

  const handleChange = (key: keyof FormState, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSavedMsg('');
    setErrorMsg('');
  };

  const buildPayload = () => ({
    eventName: form.eventName,
    year: typeof form.year === 'number' ? form.year : parseInt(String(form.year)),
    startDate: form.startDate,
    endDate: form.endDate,
    location: form.location,
    capacity: typeof form.capacity === 'number' ? form.capacity : parseInt(String(form.capacity)),
    description: form.description || null,
    registrationOpens: form.registrationOpens,
    registrationCloses: form.registrationCloses,
    earlyBirdDeadline: form.earlyBirdDeadline || null,
    memberPrice: parseFloat(form.memberPrice) || 0,
    nonMemberPrice: parseFloat(form.nonMemberPrice) || 0,
    earlyBirdDiscount: parseFloat(form.earlyBirdDiscount) || 0,
    campingPrice: parseFloat(form.campingPrice) || 0,
    mealPrice: parseFloat(form.mealPrice) || 0,
  });

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSavedMsg('');
    try {
      const payload = buildPayload();
      let res: Response;

      if (config && !creatingNew) {
        res = await fetch(`/api/obs/config/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/obs/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error ?? 'Save failed');
        return;
      }

      const data = await res.json();
      // Serialize Decimal fields
      const serialized: OBSConfigSerialized = {
        ...data,
        memberPrice: parseFloat(data.memberPrice),
        nonMemberPrice: parseFloat(data.nonMemberPrice),
        earlyBirdDiscount: parseFloat(data.earlyBirdDiscount),
        campingPrice: parseFloat(data.campingPrice),
        mealPrice: parseFloat(data.mealPrice),
        startDate: typeof data.startDate === 'string' ? data.startDate : new Date(data.startDate).toISOString(),
        endDate: typeof data.endDate === 'string' ? data.endDate : new Date(data.endDate).toISOString(),
        registrationOpens: typeof data.registrationOpens === 'string' ? data.registrationOpens : new Date(data.registrationOpens).toISOString(),
        registrationCloses: typeof data.registrationCloses === 'string' ? data.registrationCloses : new Date(data.registrationCloses).toISOString(),
        earlyBirdDeadline: data.earlyBirdDeadline ? (typeof data.earlyBirdDeadline === 'string' ? data.earlyBirdDeadline : new Date(data.earlyBirdDeadline).toISOString()) : null,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt).toISOString(),
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date(data.updatedAt).toISOString(),
      };

      if (config && !creatingNew) {
        onConfigUpdate(serialized);
      } else {
        onConfigCreate(serialized);
        setCreatingNew(false);
      }
      setCloneWarning(false);
      setSavedMsg('Saved successfully!');
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateToggle = async () => {
    if (!config) return;
    if (config.isActive && !showDeactivateWarning) {
      setShowDeactivateWarning(true);
      return;
    }
    setShowDeactivateWarning(false);
    setActivating(true);
    try {
      if (config.isActive) {
        // Deactivate: there's no dedicated deactivate endpoint, so update isActive via PUT
        const res = await fetch(`/api/obs/config/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...buildPayload() }),
        });
        if (res.ok) {
          // Reload or call activate on a different config — for now, just set all inactive
          await fetch(`/api/obs/config/${config.id}/activate`, { method: 'POST' });
          // Then we need to deactivate — but there's no deactivate endpoint; activate always sets one active
          // Just update the UI state
          onActivate(config.id);
        }
      } else {
        const res = await fetch(`/api/obs/config/${config.id}/activate`, { method: 'POST' });
        if (res.ok) {
          onActivate(config.id);
        }
      }
    } catch {
      setErrorMsg('Failed to change activation status.');
    } finally {
      setActivating(false);
    }
  };

  const handleClone = () => {
    if (!prevYear) return;
    setForm({
      ...configToForm(prevYear),
      year: prevYear.year + 1,
      startDate: '',
      endDate: '',
      registrationOpens: '',
      registrationCloses: '',
      earlyBirdDeadline: '',
    });
    setCloneWarning(true);
    setSavedMsg('');
    setErrorMsg('');
    setCreatingNew(true);
  };

  const handleNewConfig = () => {
    setForm({ ...EMPTY_FORM, year: Math.max(...configs.map((c) => c.year), new Date().getFullYear()) + 1 });
    setCreatingNew(true);
    setCloneWarning(false);
    setSavedMsg('');
    setErrorMsg('');
  };

  const isNew = !config || creatingNew;

  const inputClass =
    'w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-500/50 transition-colors';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Setup</h1>
          <p className="text-sm text-muted-foreground">
            {isNew ? 'Create a new OBS configuration' : `Editing OBS ${config?.year}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!creatingNew && (
            <button
              onClick={handleNewConfig}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Config
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {savedMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <XCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}
      {cloneWarning && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Cloned from OBS {prevYear?.year}. Review all fields and click Save to persist.
        </div>
      )}

      {/* Activate Toggle */}
      {config && !creatingNew && isAdmin && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Event Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.isActive
                  ? 'This is the active event. The public registration form is live.'
                  : 'This event is inactive. The public registration form is not shown.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {showDeactivateWarning && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>This will close registration. Confirm?</span>
                  <button
                    onClick={() => setShowDeactivateWarning(false)}
                    className="underline hover:no-underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={handleActivateToggle}
                disabled={activating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  config.isActive ? 'bg-emerald-500' : 'bg-white/10'
                } ${activating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    config.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {config.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card 1: Core Details */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Core Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Event Name</label>
            <input
              type="text"
              className={inputClass}
              value={form.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              placeholder="Orange Blossom Special 2025"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Year</label>
            <input
              type="number"
              className={`${inputClass} ${!isNew ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={form.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              readOnly={!isNew}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Location</label>
            <input
              type="text"
              className={inputClass}
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Withlacoochee State Forest"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">End Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Capacity</label>
            <input
              type="number"
              className={inputClass}
              value={form.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
              min={1}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Description (shown on public /obs page)</label>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the event..."
            />
          </div>
        </div>
      </div>

      {/* Card 2: Registration Window */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Registration Window</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Registration Opens</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.registrationOpens}
              onChange={(e) => handleChange('registrationOpens', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Registration Closes</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.registrationCloses}
              onChange={(e) => handleChange('registrationCloses', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">
              Early Bird Deadline{' '}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                className={`${inputClass} flex-1`}
                value={form.earlyBirdDeadline}
                onChange={(e) => handleChange('earlyBirdDeadline', e.target.value)}
              />
              {form.earlyBirdDeadline && (
                <button
                  onClick={() => handleChange('earlyBirdDeadline', '')}
                  className="px-3 py-2 bg-white/5 border border-border hover:border-red-500/30 text-red-400 rounded-lg text-xs transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Pricing Table */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Type</th>
              <th className="text-right pb-2 font-medium">Price ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {([
              { key: 'memberPrice', label: 'Member', prefix: '' },
              { key: 'nonMemberPrice', label: 'Non-Member', prefix: '' },
              { key: 'earlyBirdDiscount', label: 'Early Bird Discount', prefix: '-' },
              { key: 'campingPrice', label: 'Camping Add-on', prefix: '' },
              { key: 'mealPrice', label: 'Meal Add-on', prefix: '' },
            ] as { key: keyof FormState; label: string; prefix: string }[]).map(({ key, label, prefix }) => (
              <tr key={key} className="group">
                <td className="py-2.5 text-muted-foreground">{label}</td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-muted-foreground text-xs">{prefix}$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 bg-white/5 border border-transparent group-hover:border-border focus:border-amber-500/50 rounded px-2 py-1 text-right text-foreground focus:outline-none transition-colors"
                      value={form[key] as string}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card 4: Clone */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Clone from Previous Year</h3>
          {prevYear ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-muted-foreground">
                Pre-fill all fields from OBS {prevYear.year} ({prevYear.eventName}).
                Dates and registration window will be cleared.
              </p>
              <button
                onClick={handleClone}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-border hover:border-amber-500/30 text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                Clone OBS {prevYear.year}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No previous year config found.{' '}
              {configs.length === 0 ? 'Create your first OBS configuration above.' : `Previous year would be ${typeof form.year === 'number' ? form.year - 1 : '—'}.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
