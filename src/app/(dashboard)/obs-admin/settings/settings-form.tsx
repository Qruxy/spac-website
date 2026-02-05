'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Save, 
  Trash2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';

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
}

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

  const updateField = (field: keyof OBSConfig, value: string | number | boolean) => {
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
