'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  CheckCircle, 
  Clock,
  ChevronRight,
  ChevronDown,
  FileText
} from 'lucide-react';

interface Minutes {
  id: string;
  title: string;
  meetingDate: string;
  meetingType: string;
  approved: boolean;
  pdfUrl: string | null;
  _count: { motions: number };
}

interface Props {
  minutesByYear: Record<number, Minutes[]>;
  years: number[];
}

const meetingTypeColors: Record<string, string> = {
  BOARD: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GENERAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SPECIAL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ANNUAL: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function MinutesListClient({ minutesByYear, years }: Props) {
  const [expandedYears, setExpandedYears] = useState<number[]>(years.slice(0, 2));

  const toggleYear = (year: number) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  if (years.length === 0) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">No meeting minutes recorded yet.</p>
        <Link
          href="/leadership/minutes/new"
          className="text-indigo-400 hover:text-indigo-300"
        >
          Create the first entry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleYear(year)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span className="text-xl font-semibold text-white">{year}</span>
              <span className="text-sm text-slate-400">
                ({minutesByYear[year].length} meeting{minutesByYear[year].length !== 1 ? 's' : ''})
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                expandedYears.includes(year) ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedYears.includes(year) && (
            <div className="border-t border-slate-700/50">
              {minutesByYear[year].map((minutes, idx) => (
                <Link
                  key={minutes.id}
                  href={`/leadership/minutes/${minutes.id}`}
                  className={`flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors ${
                    idx !== 0 ? 'border-t border-slate-700/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold text-white">
                        {new Date(minutes.meetingDate).getDate()}
                      </p>
                      <p className="text-xs text-slate-400 uppercase">
                        {new Date(minutes.meetingDate).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{minutes.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded border ${meetingTypeColors[minutes.meetingType] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                          {minutes.meetingType}
                        </span>
                        {minutes._count.motions > 0 && (
                          <span className="text-xs text-slate-500">
                            {minutes._count.motions} motion{minutes._count.motions !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {minutes.approved ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <Clock className="w-4 h-4" />
                        Draft
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
