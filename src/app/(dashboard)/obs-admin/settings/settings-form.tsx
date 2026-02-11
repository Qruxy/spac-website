'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Save,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  FileText,
  Clock,
  BarChart3,
  Backpack,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface ScheduleEvent {
  time: string;
  title: string;
  icon: string;
}

interface ScheduleDay {
  label: string;
  events: ScheduleEvent[];
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

interface WhatToBringCategory {
  category: string;
  items: string[];
}

interface LocationInfoData {
  byCar: string;
  camping: string;
}

interface OBSConfig {
  id: string;
  year: number;
  eventName: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  earlyBirdDeadline: string | null;
  location: string;
  memberPrice: string;
  nonMemberPrice: string;
  earlyBirdDiscount: string;
  campingPrice: string;
  mealPrice: string;
  capacity: number;
  isActive: boolean;
  _count: { registrations: number };
  description?: string | null;
  scheduleData?: ScheduleDay[] | null;
  whatToBring?: WhatToBringCategory[] | null;
  locationInfo?: LocationInfoData | null;
  statsData?: StatItem[] | null;
}

const ICON_OPTIONS = [
  { value: 'Users', label: 'People' },
  { value: 'Star', label: 'Star' },
  { value: 'Utensils', label: 'Food' },
  { value: 'Telescope', label: 'Telescope' },
  { value: 'Moon', label: 'Moon' },
  { value: 'Camera', label: 'Camera' },
  { value: 'Music', label: 'Music' },
  { value: 'Coffee', label: 'Coffee' },
];

interface Props {
  configs: OBSConfig[];
  currentYear: number;
}

export default function OBSSettingsForm({ configs: initialConfigs, currentYear }: Props) {
  const router = useRouter();
  const [configs, setConfigs] = useState(initialConfigs);
  const [selectedConfig, setSelectedConfig] = useState<OBSConfig | null>(
    configs.find((c) => c.isActive) || configs[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateNew = () => {
    const nextYear = configs.length > 0 
      ? Math.max(...configs.map((c) => c.year)) + 1 
      : currentYear + 1;
    
    const newConfig: OBSConfig = {
      id: '',
      year: nextYear,
      eventName: `Orange Blossom Special ${nextYear}`,
      startDate: `${nextYear}-02-01`,
      endDate: `${nextYear}-02-03`,
      registrationOpens: `${nextYear - 1}-11-01`,
      registrationCloses: `${nextYear}-01-25`,
      earlyBirdDeadline: `${nextYear - 1}-12-31`,
      location: 'Withlacoochee River Park',
      memberPrice: '45.00',
      nonMemberPrice: '55.00',
      earlyBirdDiscount: '10.00',
      campingPrice: '20.00',
      mealPrice: '15.00',
      capacity: 200,
      isActive: false,
      _count: { registrations: 0 },
    };
    
    setSelectedConfig(newConfig);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const url = selectedConfig.id 
        ? `/api/obs/config/${selectedConfig.id}` 
        : '/api/obs/config';
      
      const res = await fetch(url, {
        method: selectedConfig.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedConfig),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const saved = await res.json();
      
      if (selectedConfig.id) {
        setConfigs(configs.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        setConfigs([saved, ...configs]);
      }
      
      setSelectedConfig(saved);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (configId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/obs/config/${configId}/activate`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to activate');
      }

      // Update local state
      setConfigs(configs.map((c) => ({ ...c, isActive: c.id === configId })));
      if (selectedConfig) {
        setSelectedConfig({ ...selectedConfig, isActive: selectedConfig.id === configId });
      }
      setSuccess('Event activated');
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof OBSConfig, value: unknown) => {
    if (!selectedConfig) return;
    setSelectedConfig({ ...selectedConfig, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Year Selection */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">OBS Events</h2>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
          >
            <Plus className="w-4 h-4" />
            Create New Year
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {configs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedConfig(config)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedConfig?.id === config.id
                  ? 'bg-amber-500 text-white'
                  : config.isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {config.year}
              {config.isActive && <span className="ml-2 text-xs">(Active)</span>}
            </button>
          ))}
          {configs.length === 0 && (
            <p className="text-slate-500">No events configured. Create your first OBS event.</p>
          )}
        </div>
      </div>

      {selectedConfig && (
        <>
          {/* Event Info */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Event Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Name</label>
                <input
                  type="text"
                  value={selectedConfig.eventName}
                  onChange={(e) => updateField('eventName', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={selectedConfig.startDate.split('T')[0]}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={selectedConfig.endDate.split('T')[0]}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={selectedConfig.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Opens</label>
                <input
                  type="date"
                  value={selectedConfig.registrationOpens.split('T')[0]}
                  onChange={(e) => updateField('registrationOpens', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Closes</label>
                <input
                  type="date"
                  value={selectedConfig.registrationCloses.split('T')[0]}
                  onChange={(e) => updateField('registrationCloses', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Early Bird Deadline (optional)</label>
                <input
                  type="date"
                  value={selectedConfig.earlyBirdDeadline?.split('T')[0] || ''}
                  onChange={(e) => updateField('earlyBirdDeadline', e.target.value || null)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Capacity</label>
                <input
                  type="number"
                  value={selectedConfig.capacity}
                  onChange={(e) => updateField('capacity', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Pricing
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Member Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={selectedConfig.memberPrice}
                    onChange={(e) => updateField('memberPrice', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Non-Member Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={selectedConfig.nonMemberPrice}
                    onChange={(e) => updateField('nonMemberPrice', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Early Bird Discount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={selectedConfig.earlyBirdDiscount}
                    onChange={(e) => updateField('earlyBirdDiscount', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Camping Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={selectedConfig.campingPrice}
                    onChange={(e) => updateField('campingPrice', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meal Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={selectedConfig.mealPrice}
                    onChange={(e) => updateField('mealPrice', e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Page Content CMS */}
          <PageContentEditor
            config={selectedConfig}
            updateField={updateField}
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              {selectedConfig.id && !selectedConfig.isActive && (
                <button
                  onClick={() => handleSetActive(selectedConfig.id)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Set as Active Event
                </button>
              )}
              {selectedConfig.isActive && (
                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  This is the active event
                </span>
              )}
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────── Page Content Editor ───────────────── */

interface PageContentEditorProps {
  config: OBSConfig;
  updateField: (field: keyof OBSConfig, value: unknown) => void;
}

function PageContentEditor({ config, updateField }: PageContentEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          Page Content
        </h2>
        {config.id && (
          <Link
            href="/obs"
            target="_blank"
            className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
          >
            Preview Page
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Customize the public OBS page content. Leave fields empty to use defaults.
      </p>

      {/* About / Description */}
      <CollapsibleSection
        title="About Section"
        icon={<FileText className="w-4 h-4 text-amber-400" />}
        isOpen={expandedSection === 'about'}
        onToggle={() => toggle('about')}
      >
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          rows={4}
          value={config.description || ''}
          onChange={(e) => updateField('description', e.target.value || null)}
          placeholder="The Orange Blossom Special (OBS) is SPAC's premier annual star party..."
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:border-amber-500 outline-none resize-y"
        />
      </CollapsibleSection>

      {/* Schedule */}
      <CollapsibleSection
        title="Event Schedule"
        icon={<Clock className="w-4 h-4 text-amber-400" />}
        isOpen={expandedSection === 'schedule'}
        onToggle={() => toggle('schedule')}
      >
        <ScheduleEditor
          schedule={config.scheduleData || null}
          onChange={(data) => updateField('scheduleData', data)}
        />
      </CollapsibleSection>

      {/* Stats */}
      <CollapsibleSection
        title="Stats / Numbers"
        icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
        isOpen={expandedSection === 'stats'}
        onToggle={() => toggle('stats')}
      >
        <StatsEditor
          stats={config.statsData || null}
          onChange={(data) => updateField('statsData', data)}
        />
      </CollapsibleSection>

      {/* What to Bring */}
      <CollapsibleSection
        title="What to Bring"
        icon={<Backpack className="w-4 h-4 text-amber-400" />}
        isOpen={expandedSection === 'bring'}
        onToggle={() => toggle('bring')}
      >
        <WhatToBringEditor
          categories={config.whatToBring || null}
          onChange={(data) => updateField('whatToBring', data)}
        />
      </CollapsibleSection>

      {/* Location Info */}
      <CollapsibleSection
        title="Location Details"
        icon={<MapPin className="w-4 h-4 text-amber-400" />}
        isOpen={expandedSection === 'location'}
        onToggle={() => toggle('location')}
      >
        <LocationEditor
          info={config.locationInfo || null}
          onChange={(data) => updateField('locationInfo', data)}
        />
      </CollapsibleSection>
    </div>
  );
}

/* ─── Collapsible Section ─── */

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-700/50 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
          {icon}
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

/* ─── Schedule Editor ─── */

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: ScheduleDay[] | null;
  onChange: (data: ScheduleDay[] | null) => void;
}) {
  const days = schedule || [];

  const addDay = () => {
    onChange([...days, { label: `Day ${days.length + 1}`, events: [] }]);
  };

  const removeDay = (idx: number) => {
    const updated = days.filter((_, i) => i !== idx);
    onChange(updated.length > 0 ? updated : null);
  };

  const updateDay = (idx: number, field: string, value: string) => {
    const updated = [...days];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const addEvent = (dayIdx: number) => {
    const updated = [...days];
    updated[dayIdx] = {
      ...updated[dayIdx],
      events: [...updated[dayIdx].events, { time: '12:00 PM', title: '', icon: 'Star' }],
    };
    onChange(updated);
  };

  const removeEvent = (dayIdx: number, evIdx: number) => {
    const updated = [...days];
    updated[dayIdx] = {
      ...updated[dayIdx],
      events: updated[dayIdx].events.filter((_, i) => i !== evIdx),
    };
    onChange(updated);
  };

  const updateEvent = (dayIdx: number, evIdx: number, field: string, value: string) => {
    const updated = [...days];
    const events = [...updated[dayIdx].events];
    events[evIdx] = { ...events[evIdx], [field]: value };
    updated[dayIdx] = { ...updated[dayIdx], events };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {days.map((day, dayIdx) => (
        <div key={dayIdx} className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={day.label}
              onChange={(e) => updateDay(dayIdx, 'label', e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
              placeholder="Day 1"
            />
            <button
              type="button"
              onClick={() => removeDay(dayIdx)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {day.events.map((event, evIdx) => (
              <div key={evIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={event.time}
                  onChange={(e) => updateEvent(dayIdx, evIdx, 'time', e.target.value)}
                  className="w-24 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="3:00 PM"
                />
                <input
                  type="text"
                  value={event.title}
                  onChange={(e) => updateEvent(dayIdx, evIdx, 'title', e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="Event title"
                />
                <select
                  value={event.icon}
                  onChange={(e) => updateEvent(dayIdx, evIdx, 'icon', e.target.value)}
                  className="w-28 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeEvent(dayIdx, evIdx)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addEvent(dayIdx)}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Event
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addDay}
        className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add Day
      </button>
    </div>
  );
}

/* ─── Stats Editor ─── */

function StatsEditor({
  stats,
  onChange,
}: {
  stats: StatItem[] | null;
  onChange: (data: StatItem[] | null) => void;
}) {
  const items = stats || [];

  const addStat = () => {
    onChange([...items, { value: 0, suffix: '', label: '' }]);
  };

  const removeStat = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    onChange(updated.length > 0 ? updated : null);
  };

  const updateStat = (idx: number, field: keyof StatItem, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {items.map((stat, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="number"
            value={stat.value}
            onChange={(e) => updateStat(idx, 'value', parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-amber-500 outline-none"
            placeholder="25"
          />
          <input
            type="text"
            value={stat.suffix}
            onChange={(e) => updateStat(idx, 'suffix', e.target.value)}
            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-amber-500 outline-none"
            placeholder="+"
          />
          <input
            type="text"
            value={stat.label}
            onChange={(e) => updateStat(idx, 'label', e.target.value)}
            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-amber-500 outline-none"
            placeholder="Years Running"
          />
          <button
            type="button"
            onClick={() => removeStat(idx)}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {items.length < 6 && (
        <button
          type="button"
          onClick={addStat}
          className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Stat
        </button>
      )}
    </div>
  );
}

/* ─── What to Bring Editor ─── */

function WhatToBringEditor({
  categories,
  onChange,
}: {
  categories: WhatToBringCategory[] | null;
  onChange: (data: WhatToBringCategory[] | null) => void;
}) {
  const cats = categories || [];

  const addCategory = () => {
    onChange([...cats, { category: '', items: [''] }]);
  };

  const removeCategory = (idx: number) => {
    const updated = cats.filter((_, i) => i !== idx);
    onChange(updated.length > 0 ? updated : null);
  };

  const updateCategoryName = (idx: number, name: string) => {
    const updated = [...cats];
    updated[idx] = { ...updated[idx], category: name };
    onChange(updated);
  };

  const addItem = (catIdx: number) => {
    const updated = [...cats];
    updated[catIdx] = { ...updated[catIdx], items: [...updated[catIdx].items, ''] };
    onChange(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const updated = [...cats];
    updated[catIdx] = {
      ...updated[catIdx],
      items: updated[catIdx].items.filter((_, i) => i !== itemIdx),
    };
    onChange(updated);
  };

  const updateItem = (catIdx: number, itemIdx: number, value: string) => {
    const updated = [...cats];
    const items = [...updated[catIdx].items];
    items[itemIdx] = value;
    updated[catIdx] = { ...updated[catIdx], items };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {cats.map((cat, catIdx) => (
        <div key={catIdx} className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={cat.category}
              onChange={(e) => updateCategoryName(catIdx, e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
              placeholder="Category name (e.g. Essential)"
            />
            <button
              type="button"
              onClick={() => removeCategory(catIdx)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(catIdx, itemIdx, e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="Item name"
                />
                <button
                  type="button"
                  onClick={() => removeItem(catIdx, itemIdx)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addItem(catIdx)}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addCategory}
        className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add Category
      </button>
    </div>
  );
}

/* ─── Location Editor ─── */

function LocationEditor({
  info,
  onChange,
}: {
  info: LocationInfoData | null;
  onChange: (data: LocationInfoData | null) => void;
}) {
  const data = info || { byCar: '', camping: '' };

  const update = (field: keyof LocationInfoData, value: string) => {
    const updated = { ...data, [field]: value };
    const isEmpty = !updated.byCar && !updated.camping;
    onChange(isEmpty ? null : updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">By Car</label>
        <textarea
          rows={3}
          value={data.byCar}
          onChange={(e) => update('byCar', e.target.value)}
          placeholder="Located approximately 1 hour north of Tampa..."
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:border-amber-500 outline-none resize-y"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Camping</label>
        <textarea
          rows={3}
          value={data.camping}
          onChange={(e) => update('camping', e.target.value)}
          placeholder="Both tent and RV camping available..."
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:border-amber-500 outline-none resize-y"
        />
      </div>
    </div>
  );
}
