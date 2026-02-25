'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon,
  Users,
  Star,
  Utensils,
  Telescope,
  Moon,
  Calendar,
  Car,
  Tent,
  CheckCircle,
  Camera,
  Music,
  Coffee,
  Binoculars,
  Sunrise,
  Sunset,
  Flag,
  Globe,
  Edit2,
} from 'lucide-react';
import type {
  OBSConfigSerialized,
  ScheduleDay,
  ScheduleEvent,
  WhatToBringCategory,
  StatItem,
  OBSSponsor,
} from '../types';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

type PageBuilderTab = 'schedule' | 'sponsors' | 'what-to-bring' | 'venue' | 'stats';

interface Props {
  config: OBSConfigSerialized | null;
  onConfigUpdate: (updated: OBSConfigSerialized) => void;
}

// ─── Icon registry ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Star,
  Utensils,
  Telescope,
  Moon,
  Calendar,
  Car,
  Tent,
  CheckCircle,
  Camera,
  Music,
  Coffee,
  Binoculars,
  Sunrise,
  Sunset,
  Flag,
};

const ICON_KEYS = Object.keys(ICON_MAP);

function IconDisplay({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Star;
  return <Icon className={className ?? 'w-4 h-4'} />;
}

// ─── Save helper ─────────────────────────────────────────────────────────────

async function saveField(
  configId: string,
  field: string,
  value: unknown,
): Promise<OBSConfigSerialized | null> {
  const res = await fetch(`/api/obs/config/${configId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
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
}

// ─── Feedback banner ─────────────────────────────────────────────────────────

function Feedback({ msg, isError }: { msg: string; isError?: boolean }) {
  if (!msg) return null;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
        isError
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      }`}
    >
      {isError ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3a. Schedule Builder
// ══════════════════════════════════════════════════════════════════════════════

function ScheduleBuilder({
  config,
  onConfigUpdate,
}: {
  config: OBSConfigSerialized;
  onConfigUpdate: (u: OBSConfigSerialized) => void;
}) {
  const [days, setDays] = useState<ScheduleDay[]>((config.scheduleData as ScheduleDay[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState<{ day: number; event: number } | null>(null);

  const setFb = (msg: string, err = false) => {
    setFeedback(msg);
    setFeedbackErr(err);
  };

  const addDay = () =>
    setDays((d) => [...d, { label: `Day ${d.length + 1}`, events: [] }]);

  const removeDay = (di: number) => {
    if (!confirm(`Remove "${days[di].label}"? This cannot be undone.`)) return;
    setDays((d) => d.filter((_, i) => i !== di));
  };

  const moveDay = (di: number, dir: -1 | 1) => {
    const next = [...days];
    const ni = di + dir;
    if (ni < 0 || ni >= next.length) return;
    [next[di], next[ni]] = [next[ni], next[di]];
    setDays(next);
  };

  const updateDayLabel = (di: number, label: string) =>
    setDays((d) => d.map((day, i) => (i === di ? { ...day, label } : day)));

  const addEvent = (di: number) =>
    setDays((d) =>
      d.map((day, i) =>
        i === di ? { ...day, events: [...day.events, { time: '', title: '', icon: 'Star' }] } : day,
      ),
    );

  const removeEvent = (di: number, ei: number) =>
    setDays((d) =>
      d.map((day, i) =>
        i === di ? { ...day, events: day.events.filter((_, j) => j !== ei) } : day,
      ),
    );

  const moveEvent = (di: number, ei: number, dir: -1 | 1) => {
    const next = [...days];
    const events = [...next[di].events];
    const ni = ei + dir;
    if (ni < 0 || ni >= events.length) return;
    [events[ei], events[ni]] = [events[ni], events[ei]];
    next[di] = { ...next[di], events };
    setDays(next);
  };

  const updateEvent = (di: number, ei: number, field: keyof ScheduleEvent, value: string) =>
    setDays((d) =>
      d.map((day, i) =>
        i === di
          ? {
              ...day,
              events: day.events.map((ev, j) =>
                j === ei ? { ...ev, [field]: value } : ev,
              ),
            }
          : day,
      ),
    );

  const handleSave = async () => {
    setSaving(true);
    setFb('');
    const result = await saveField(config.id, 'scheduleData', days);
    if (result) {
      onConfigUpdate(result);
      setFb('Schedule saved!');
    } else {
      setFb('Failed to save schedule.', true);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Schedule Builder</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={addDay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:border-amber-500/30 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Day
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Schedule
          </button>
        </div>
      </div>

      <Feedback msg={feedback} isError={feedbackErr} />

      {days.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
          No days yet. Click &quot;Add Day&quot; to start building the schedule.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {days.map((day, di) => (
            <div key={di} className="bg-card border border-border rounded-xl p-4 space-y-3">
              {/* Day header */}
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-transparent border-b border-border focus:border-amber-500/50 text-sm font-semibold text-foreground focus:outline-none pb-1"
                  value={day.label}
                  onChange={(e) => updateDayLabel(di, e.target.value)}
                />
                <button onClick={() => moveDay(di, -1)} className="text-muted-foreground hover:text-foreground p-0.5">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveDay(di, 1)} className="text-muted-foreground hover:text-foreground p-0.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeDay(di)} className="text-muted-foreground hover:text-red-400 p-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Events */}
              <div className="space-y-2">
                {day.events.map((ev, ei) => (
                  <div key={ei} className="flex items-center gap-1.5 relative">
                    <input
                      type="time"
                      className="w-20 bg-white/5 border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-amber-500/50"
                      value={ev.time}
                      onChange={(e) => updateEvent(di, ei, 'time', e.target.value)}
                    />
                    <input
                      className="flex-1 bg-white/5 border border-border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:border-amber-500/50 min-w-0"
                      placeholder="Event title"
                      value={ev.title}
                      onChange={(e) => updateEvent(di, ei, 'title', e.target.value)}
                    />
                    {/* Icon picker */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIconPickerOpen(
                            iconPickerOpen?.day === di && iconPickerOpen.event === ei
                              ? null
                              : { day: di, event: ei },
                          )
                        }
                        className="p-1 bg-white/5 border border-border rounded hover:border-amber-500/30 text-muted-foreground hover:text-amber-400 transition-colors"
                        title="Pick icon"
                      >
                        <IconDisplay name={ev.icon} className="w-3.5 h-3.5" />
                      </button>
                      {iconPickerOpen?.day === di && iconPickerOpen.event === ei && (
                        <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-xl p-2 grid grid-cols-4 gap-1 z-50 shadow-xl w-40">
                          {ICON_KEYS.map((ik) => (
                            <button
                              key={ik}
                              title={ik}
                              onClick={() => {
                                updateEvent(di, ei, 'icon', ik);
                                setIconPickerOpen(null);
                              }}
                              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                                ev.icon === ik ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground'
                              }`}
                            >
                              <IconDisplay name={ik} className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveEvent(di, ei, -1)} className="text-muted-foreground hover:text-foreground">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveEvent(di, ei, 1)} className="text-muted-foreground hover:text-foreground">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeEvent(di, ei)} className="text-muted-foreground hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addEvent(di)}
                className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-border hover:border-amber-500/30 rounded-lg text-xs text-muted-foreground hover:text-amber-400 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Time Slot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3b. Sponsors
// ══════════════════════════════════════════════════════════════════════════════

const SPONSOR_LEVELS = ['Gold', 'Silver', 'Bronze', 'Partner'];

function SponsorsBuilder({
  config,
}: {
  config: OBSConfigSerialized;
}) {
  const [sponsors, setSponsors] = useState<OBSSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState(false);

  // New sponsor form
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newLevel, setNewLevel] = useState('Gold');
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setFb = (msg: string, err = false) => { setFeedback(msg); setFeedbackErr(err); };

  useEffect(() => {
    fetch(`/api/admin/obs/sponsors?obsId=${config.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSponsors(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [config.id]);

  const uploadLogo = async (file: File): Promise<string | null> => {
    const presignRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, folder: 'sponsors' }),
    });
    if (!presignRes.ok) return null;
    const { uploadUrl, publicUrl } = await presignRes.json() as { uploadUrl: string; publicUrl: string };
    const upRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    if (!upRes.ok) return null;
    return publicUrl;
  };

  const handleCreate = async () => {
    if (!newName) { setFb('Name is required.', true); return; }
    setUploading(true);
    let logoUrl: string | null = null;
    if (newLogoFile) {
      logoUrl = await uploadLogo(newLogoFile);
      if (!logoUrl) { setFb('Logo upload failed.', true); setUploading(false); return; }
    }
    const res = await fetch('/api/admin/obs/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obsConfigId: config.id, name: newName, website: newWebsite || null, logoUrl, sponsorLevel: newLevel, sortOrder: sponsors.length }),
    });
    if (res.ok) {
      const created = await res.json() as OBSSponsor;
      setSponsors((s) => [...s, created]);
      setNewName(''); setNewWebsite(''); setNewLevel('Gold'); setNewLogoFile(null);
      setModalOpen(false);
      setFb('Sponsor added!');
    } else {
      setFb('Failed to add sponsor.', true);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sponsor?')) return;
    const res = await fetch(`/api/admin/obs/sponsors/${id}`, { method: 'DELETE' });
    if (res.ok) setSponsors((s) => s.filter((sp) => sp.id !== id));
    else setFb('Delete failed.', true);
  };

  const handleUpdate = async (id: string, changes: Partial<OBSSponsor>) => {
    const res = await fetch(`/api/admin/obs/sponsors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (res.ok) {
      const updated = await res.json() as OBSSponsor;
      setSponsors((s) => s.map((sp) => (sp.id === id ? updated : sp)));
    } else {
      setFb('Update failed.', true);
    }
  };

  const handleMoveSort = async (id: string, dir: -1 | 1) => {
    const idx = sponsors.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const ni = idx + dir;
    if (ni < 0 || ni >= sponsors.length) return;
    const next = [...sponsors];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    setSponsors(next);
    await handleUpdate(id, { sortOrder: ni });
    await handleUpdate(next[idx].id, { sortOrder: idx });
  };

  const grouped = SPONSOR_LEVELS.map((level) => ({
    level,
    items: sponsors.filter((s) => s.sponsorLevel === level),
  })).filter((g) => g.items.length > 0);

  const inputClass = 'bg-white/5 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-amber-500/50';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sponsors</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Sponsor
        </button>
      </div>

      <Feedback msg={feedback} isError={feedbackErr} />

      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading sponsors…</div>
      ) : sponsors.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
          No sponsors yet. Click &quot;Add Sponsor&quot; to add your first sponsor.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ level, items }) => (
            <div key={level}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{level}</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((sp) => (
                  <div key={sp.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden">
                      {sp.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sp.logoUrl} alt={sp.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    {/* Name */}
                    <input
                      className={`${inputClass} w-full`}
                      value={sp.name}
                      onChange={(e) => setSponsors((s) => s.map((x) => x.id === sp.id ? { ...x, name: e.target.value } : x))}
                      onBlur={(e) => handleUpdate(sp.id, { name: e.target.value })}
                    />
                    {/* Website */}
                    <div className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        className={`${inputClass} flex-1 text-xs`}
                        value={sp.website ?? ''}
                        placeholder="https://..."
                        onChange={(e) => setSponsors((s) => s.map((x) => x.id === sp.id ? { ...x, website: e.target.value } : x))}
                        onBlur={(e) => handleUpdate(sp.id, { website: e.target.value || null })}
                      />
                    </div>
                    {/* Level */}
                    <select
                      className={`${inputClass} w-full`}
                      value={sp.sponsorLevel ?? ''}
                      onChange={(e) => handleUpdate(sp.id, { sponsorLevel: e.target.value })}
                    >
                      {SPONSOR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button onClick={() => handleMoveSort(sp.id, -1)} className="p-1 text-muted-foreground hover:text-foreground">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleMoveSort(sp.id, 1)} className="p-1 text-muted-foreground hover:text-foreground">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => handleDelete(sp.id)} className="p-1 text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Sponsor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Add Sponsor</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Name *</label>
                <input className={`${inputClass} w-full`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Sponsor name" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Website</label>
                <input className={`${inputClass} w-full`} value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Level</label>
                <select className={`${inputClass} w-full`} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                  {SPONSOR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Logo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setNewLogoFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-border hover:border-amber-500/30 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="w-4 h-4" />
                  {newLogoFile ? newLogoFile.name : 'Choose image…'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-white/5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={uploading} className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Sponsor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3c. What to Bring
// ══════════════════════════════════════════════════════════════════════════════

function WhatToBringBuilder({
  config,
  onConfigUpdate,
}: {
  config: OBSConfigSerialized;
  onConfigUpdate: (u: OBSConfigSerialized) => void;
}) {
  const [categories, setCategories] = useState<WhatToBringCategory[]>(
    (config.whatToBring as WhatToBringCategory[]) ?? [],
  );
  const [expanded, setExpanded] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState(false);
  const [newItemInputs, setNewItemInputs] = useState<Record<number, string>>({});

  const setFb = (msg: string, err = false) => { setFeedback(msg); setFeedbackErr(err); };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveField(config.id, 'whatToBring', categories);
    if (result) { onConfigUpdate(result); setFb('Saved!'); }
    else setFb('Save failed.', true);
    setSaving(false);
  };

  const addCategory = () => {
    setCategories((c) => [...c, { category: 'New Category', items: [] }]);
    setExpanded(categories.length);
  };

  const removeCategory = (ci: number) => {
    if (!confirm(`Remove "${categories[ci].category}"?`)) return;
    setCategories((c) => c.filter((_, i) => i !== ci));
  };

  const moveCategory = (ci: number, dir: -1 | 1) => {
    const next = [...categories];
    const ni = ci + dir;
    if (ni < 0 || ni >= next.length) return;
    [next[ci], next[ni]] = [next[ni], next[ci]];
    setCategories(next);
  };

  const updateCategoryName = (ci: number, name: string) =>
    setCategories((c) => c.map((cat, i) => (i === ci ? { ...cat, category: name } : cat)));

  const addItem = (ci: number) => {
    const val = newItemInputs[ci]?.trim();
    if (!val) return;
    setCategories((c) =>
      c.map((cat, i) => (i === ci ? { ...cat, items: [...cat.items, val] } : cat)),
    );
    setNewItemInputs((n) => ({ ...n, [ci]: '' }));
  };

  const removeItem = (ci: number, ii: number) =>
    setCategories((c) =>
      c.map((cat, i) => (i === ci ? { ...cat, items: cat.items.filter((_, j) => j !== ii) } : cat)),
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">What to Bring</h3>
        <div className="flex gap-2">
          <button onClick={addCategory} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:border-amber-500/30 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      <Feedback msg={feedback} isError={feedbackErr} />

      {categories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
          No categories yet.
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, ci) => (
            <div key={ci} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === ci ? null : ci)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-sm font-medium text-foreground">{cat.category}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{cat.items.length} items</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === ci ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded === ci && (
                <div className="border-t border-border px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2 pt-3">
                    <input
                      className="flex-1 bg-white/5 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-amber-500/50"
                      value={cat.category}
                      onChange={(e) => updateCategoryName(ci, e.target.value)}
                      placeholder="Category name"
                    />
                    <button onClick={() => moveCategory(ci, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveCategory(ci, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeCategory(ci)} className="p-1 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item, ii) => (
                      <span key={ii} className="flex items-center gap-1.5 bg-white/5 border border-border rounded-full px-3 py-1 text-xs text-foreground">
                        {item}
                        <button onClick={() => removeItem(ci, ii)} className="text-muted-foreground hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-white/5 border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-amber-500/50"
                      placeholder="Add item (press Enter)…"
                      value={newItemInputs[ci] ?? ''}
                      onChange={(e) => setNewItemInputs((n) => ({ ...n, [ci]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(ci); } }}
                    />
                    <button onClick={() => addItem(ci)} className="px-3 py-1 bg-white/5 border border-border rounded hover:border-amber-500/30 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3d. Venue Info
// ══════════════════════════════════════════════════════════════════════════════

function VenueBuilder({
  config,
  onConfigUpdate,
}: {
  config: OBSConfigSerialized;
  onConfigUpdate: (u: OBSConfigSerialized) => void;
}) {
  const loc = config.locationInfo ?? { byCar: '', camping: '' };
  const [byCar, setByCar] = useState(loc.byCar ?? '');
  const [camping, setCamping] = useState(loc.camping ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveField(config.id, 'locationInfo', { byCar, camping });
    if (result) { onConfigUpdate(result); setFeedback('Saved!'); setFeedbackErr(false); }
    else { setFeedback('Save failed.'); setFeedbackErr(true); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Venue Info</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Venue
        </button>
      </div>

      <Feedback msg={feedback} isError={feedbackErr} />

      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <label className="block text-sm font-medium text-foreground">By Car / Directions</label>
        <RichTextEditor value={byCar} onChange={setByCar} placeholder="Driving directions to the venue…" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <label className="block text-sm font-medium text-foreground">Camping Info</label>
        <RichTextEditor value={camping} onChange={setCamping} placeholder="Camping information, rules, and tips…" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3e. Stats Bar
// ══════════════════════════════════════════════════════════════════════════════

function StatsBarBuilder({
  config,
  onConfigUpdate,
}: {
  config: OBSConfigSerialized;
  onConfigUpdate: (u: OBSConfigSerialized) => void;
}) {
  const [stats, setStats] = useState<StatItem[]>((config.statsData as StatItem[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackErr, setFeedbackErr] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveField(config.id, 'statsData', stats);
    if (result) { onConfigUpdate(result); setFeedback('Saved!'); setFeedbackErr(false); }
    else { setFeedback('Save failed.'); setFeedbackErr(true); }
    setSaving(false);
  };

  const addRow = () => setStats((s) => [...s, { value: 0, suffix: '+', label: '' }]);
  const removeRow = (i: number) => setStats((s) => s.filter((_, j) => j !== i));
  const update = (i: number, field: keyof StatItem, value: string | number) =>
    setStats((s) => s.map((st, j) => (j === i ? { ...st, [field]: value } : st)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Stats Bar</h3>
        <div className="flex gap-2">
          <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:border-amber-500/30 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Stat
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Stats
          </button>
        </div>
      </div>

      <Feedback msg={feedback} isError={feedbackErr} />

      {stats.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
          No stats yet. These display as animated count-up numbers on the public page.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Value</th>
                <th className="text-left px-4 py-2 font-medium">Suffix</th>
                <th className="text-left px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((st, i) => (
                <tr key={i} className="group">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-24 bg-white/5 border border-transparent group-hover:border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-amber-500/50"
                      value={st.value}
                      onChange={(e) => update(i, 'value', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-16 bg-white/5 border border-transparent group-hover:border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-amber-500/50"
                      value={st.suffix}
                      placeholder="+"
                      onChange={(e) => update(i, 'suffix', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full bg-white/5 border border-transparent group-hover:border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-amber-500/50"
                      value={st.label}
                      placeholder="Years Running"
                      onChange={(e) => update(i, 'label', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page Builder
// ══════════════════════════════════════════════════════════════════════════════

const TABS: { id: PageBuilderTab; label: string }[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'what-to-bring', label: 'What to Bring' },
  { id: 'venue', label: 'Venue' },
  { id: 'stats', label: 'Stats Bar' },
];

export function OBSPageBuilder({ config, onConfigUpdate }: Props) {
  const [tab, setTab] = useState<PageBuilderTab>('schedule');

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Edit2 className="w-16 h-16 text-white/10 mb-4" />
        <p className="text-muted-foreground text-sm">Select an OBS configuration to edit the page content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Page Builder</h1>
        <p className="text-sm text-muted-foreground">Edit the public /obs page content for {config.eventName}</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'schedule' && <ScheduleBuilder config={config} onConfigUpdate={onConfigUpdate} />}
      {tab === 'sponsors' && <SponsorsBuilder config={config} />}
      {tab === 'what-to-bring' && <WhatToBringBuilder config={config} onConfigUpdate={onConfigUpdate} />}
      {tab === 'venue' && <VenueBuilder config={config} onConfigUpdate={onConfigUpdate} />}
      {tab === 'stats' && <StatsBarBuilder config={config} onConfigUpdate={onConfigUpdate} />}
    </div>
  );
}
