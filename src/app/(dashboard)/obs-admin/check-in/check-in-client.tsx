'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle, 
  XCircle,
  User,
  BadgeCheck,
  Printer,
  Tent,
  UtensilsCrossed,
  Clock
} from 'lucide-react';

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  registrationType: string;
  campingRequested: boolean;
  mealRequested: boolean;
  paymentStatus: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  badgePrinted: boolean;
  isMember: boolean;
  tShirtSize: string | null;
}

interface Props {
  registrations: Registration[];
  obsId: string;
  checkedInById: string;
}

export default function CheckInClient({ registrations: initialRegistrations, obsId, checkedInById }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [search, setSearch] = useState('');
  const [showCheckedIn, setShowCheckedIn] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const filteredRegistrations = useMemo(() => {
    let result = [...registrations];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.firstName.toLowerCase().includes(searchLower) ||
          r.lastName.toLowerCase().includes(searchLower) ||
          r.email.toLowerCase().includes(searchLower)
      );
    }

    // Show/hide checked in
    if (!showCheckedIn) {
      result = result.filter((r) => !r.checkedIn);
    }

    return result;
  }, [registrations, search, showCheckedIn]);

  const handleCheckIn = async (regId: string) => {
    setLoading(regId);
    
    try {
      const res = await fetch(`/api/obs/check-in/${regId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedInById }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, checkedIn: true, checkedInAt: updated.checkedInAt } : r))
        );
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleUndoCheckIn = async (regId: string) => {
    setLoading(regId);
    
    try {
      const res = await fetch(`/api/obs/check-in/${regId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, checkedIn: false, checkedInAt: null } : r))
        );
      }
    } catch (error) {
      console.error('Undo check-in failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handlePrintBadge = async (regId: string) => {
    // In production, this would trigger badge printing
    // For now, just open a print-friendly badge view
    window.open(`/obs-admin/badges/${regId}`, '_blank');
  };

  const checkedInCount = registrations.filter((r) => r.checkedIn).length;
  const totalCount = registrations.length;
  const progressPercent = totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0;

  return (
    <div>
      {/* Progress Bar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300">Check-In Progress</span>
          <span className="text-white font-semibold">{checkedInCount} / {totalCount}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">{progressPercent.toFixed(1)}% complete</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-lg"
            autoFocus
          />
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCheckedIn}
            onChange={(e) => setShowCheckedIn(e.target.checked)}
            className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-green-500 focus:ring-green-500 focus:ring-offset-slate-800"
          />
          <span className="text-slate-300">Show checked in</span>
        </label>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filteredRegistrations.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            {search ? (
              <>
                <User className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No attendees found matching &quot;{search}&quot;</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg font-semibold">All attendees checked in!</p>
                <p className="text-slate-400 mt-1">Great job! Everyone has arrived.</p>
              </>
            )}
          </div>
        ) : (
          filteredRegistrations.map((reg) => (
            <div
              key={reg.id}
              className={`bg-slate-800/50 border rounded-xl p-4 flex items-center gap-4 transition-all ${
                reg.checkedIn 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Avatar */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold ${
                reg.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-white'
              }`}>
                {reg.checkedIn ? (
                  <CheckCircle className="w-7 h-7" />
                ) : (
                  `${reg.firstName[0]}${reg.lastName[0]}`
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-lg">
                    {reg.firstName} {reg.lastName}
                  </h3>
                  {reg.isMember && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                      Member
                    </span>
                  )}
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    {reg.registrationType}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                  <span>{reg.email}</span>
                  {reg.campingRequested && (
                    <span className="flex items-center gap-1 text-green-400">
                      <Tent className="w-3 h-3" /> Camping
                    </span>
                  )}
                  {reg.mealRequested && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <UtensilsCrossed className="w-3 h-3" /> Meals
                    </span>
                  )}
                </div>
                {reg.checkedIn && reg.checkedInAt && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Checked in at {new Date(reg.checkedInAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Payment Status */}
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                reg.paymentStatus === 'PAID'
                  ? 'bg-green-500/20 text-green-400'
                  : reg.paymentStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {reg.paymentStatus}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {reg.checkedIn ? (
                  <>
                    <button
                      onClick={() => handlePrintBadge(reg.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Badge
                    </button>
                    <button
                      onClick={() => handleUndoCheckIn(reg.id)}
                      disabled={loading === reg.id}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Undo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleCheckIn(reg.id)}
                    disabled={loading === reg.id}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    {loading === reg.id ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <BadgeCheck className="w-5 h-5" />
                    )}
                    Check In
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
