'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Vote,
  Check,
  AlertCircle
} from 'lucide-react';

interface Motion {
  id?: string;
  motionNumber: string;
  description: string;
  movedBy: string;
  secondedBy: string;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'TABLED' | 'WITHDRAWN';
}

interface Minutes {
  id?: string;
  title: string;
  meetingDate: string;
  meetingType: 'BOARD' | 'GENERAL' | 'SPECIAL' | 'ANNUAL';
  content: string;
  pdfUrl: string | null;
  approved: boolean;
  motions: Motion[];
}

interface Props {
  initialData?: Minutes;
  createdById: string;
}

const defaultMotion: Motion = {
  motionNumber: '',
  description: '',
  movedBy: '',
  secondedBy: '',
  votesFor: 0,
  votesAgainst: 0,
  abstentions: 0,
  status: 'PENDING',
};

export default function MinutesForm({ initialData, createdById }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Minutes>({
    title: initialData?.title || '',
    meetingDate: initialData?.meetingDate 
      ? new Date(initialData.meetingDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    meetingType: initialData?.meetingType || 'BOARD',
    content: initialData?.content || '',
    pdfUrl: initialData?.pdfUrl || null,
    approved: initialData?.approved || false,
    motions: initialData?.motions || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = initialData?.id 
        ? `/api/leadership/minutes/${initialData.id}` 
        : '/api/leadership/minutes';
      
      const res = await fetch(url, {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdById,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save minutes');
      }

      const result = await res.json();
      router.push(`/leadership/minutes/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addMotion = () => {
    const nextNumber = `M${new Date().getFullYear()}-${(formData.motions.length + 1).toString().padStart(2, '0')}`;
    setFormData({
      ...formData,
      motions: [...formData.motions, { ...defaultMotion, motionNumber: nextNumber }],
    });
  };

  const updateMotion = (index: number, updates: Partial<Motion>) => {
    const newMotions = [...formData.motions];
    newMotions[index] = { ...newMotions[index], ...updates };
    setFormData({ ...formData, motions: newMotions });
  };

  const removeMotion = (index: number) => {
    setFormData({
      ...formData,
      motions: formData.motions.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Meeting Details</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Board Meeting - January 2025"
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Meeting Date
            </label>
            <input
              type="date"
              value={formData.meetingDate}
              onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Meeting Type
            </label>
            <select
              value={formData.meetingType}
              onChange={(e) => setFormData({ ...formData, meetingType: e.target.value as Minutes['meetingType'] })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="BOARD">Board Meeting</option>
              <option value="GENERAL">General Meeting</option>
              <option value="SPECIAL">Special Meeting</option>
              <option value="ANNUAL">Annual Meeting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Minutes Content</h2>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter the meeting minutes content..."
          rows={12}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
        />
        <p className="text-xs text-slate-500 mt-2">
          Markdown formatting is supported.
        </p>
      </div>

      {/* Motions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Vote className="w-5 h-5 text-indigo-400" />
            Motions
          </h2>
          <button
            type="button"
            onClick={addMotion}
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="w-4 h-4" />
            Add Motion
          </button>
        </div>

        {formData.motions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No motions recorded</p>
        ) : (
          <div className="space-y-4">
            {formData.motions.map((motion, index) => (
              <div key={index} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="text"
                    value={motion.motionNumber}
                    onChange={(e) => updateMotion(index, { motionNumber: e.target.value })}
                    placeholder="Motion #"
                    className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm w-32 focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMotion(index)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <textarea
                  value={motion.description}
                  onChange={(e) => updateMotion(index, { description: e.target.value })}
                  placeholder="Motion description..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 text-sm mb-3 focus:border-indigo-500 outline-none resize-none"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <input
                    type="text"
                    value={motion.movedBy}
                    onChange={(e) => updateMotion(index, { movedBy: e.target.value })}
                    placeholder="Moved by"
                    className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={motion.secondedBy}
                    onChange={(e) => updateMotion(index, { secondedBy: e.target.value })}
                    placeholder="Seconded by"
                    className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-indigo-500 outline-none"
                  />
                  <select
                    value={motion.status}
                    onChange={(e) => updateMotion(index, { status: e.target.value as Motion['status'] })}
                    className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="TABLED">Tabled</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={motion.votesFor}
                      onChange={(e) => updateMotion(index, { votesFor: parseInt(e.target.value) || 0 })}
                      placeholder="For"
                      min="0"
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-indigo-500 outline-none"
                      title="Votes For"
                    />
                    <input
                      type="number"
                      value={motion.votesAgainst}
                      onChange={(e) => updateMotion(index, { votesAgainst: parseInt(e.target.value) || 0 })}
                      placeholder="Against"
                      min="0"
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:border-indigo-500 outline-none"
                      title="Votes Against"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Status */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.approved}
            onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
            className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
          />
          <div>
            <span className="text-white font-medium">Mark as Approved</span>
            <p className="text-sm text-slate-400">
              Approved minutes are finalized and visible to all officers.
            </p>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Minutes'}
        </button>
      </div>
    </form>
  );
}
