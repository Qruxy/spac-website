'use client';

/**
 * Check-In Section (Client Component)
 *
 * Displays today's event registrations for a member.
 * Admins/moderators see a "Check In" button next to each registration.
 * Regular users and anonymous visitors see read-only status.
 */

import { useState } from 'react';
import { CheckCircle2, Loader2, Calendar, Award } from 'lucide-react';

interface Registration {
  id: string;
  eventTitle: string;
  checkedInAt: string | null;
}

interface CheckInSectionProps {
  uuid: string;
  registrations: Registration[];
  isAdmin: boolean;
}

interface CheckInResult {
  registrationId: string;
  success: boolean;
  message: string;
  newBadges: string[];
}

export function CheckInSection({ uuid, registrations, isAdmin }: CheckInSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CheckInResult>>({});
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(
    new Set(registrations.filter((r) => r.checkedInAt).map((r) => r.id))
  );

  async function handleCheckIn(registrationId: string) {
    setLoadingId(registrationId);
    try {
      const res = await fetch(`/api/check-in/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        setCheckedInIds((prev) => {
          const next = new Set(Array.from(prev));
          next.add(registrationId);
          return next;
        });
        setResults((prev) => ({
          ...prev,
          [registrationId]: {
            registrationId,
            success: true,
            message: `${data.user?.name || 'Member'} checked in to ${data.event?.title || 'event'}`,
            newBadges: data.newBadges || [],
          },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [registrationId]: {
            registrationId,
            success: false,
            message: data.error || 'Check-in failed',
            newBadges: [],
          },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [registrationId]: {
          registrationId,
          success: false,
          message: 'Network error. Please try again.',
          newBadges: [],
        },
      }));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-[#060611] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">
          Today&apos;s Events
        </h2>
      </div>

      <div className="space-y-3">
        {registrations.map((reg) => {
          const isCheckedIn = checkedInIds.has(reg.id);
          const result = results[reg.id];
          const isLoading = loadingId === reg.id;

          return (
            <div
              key={reg.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">
                    {reg.eventTitle}
                  </p>
                  {isCheckedIn && !result && (
                    <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Already checked in
                    </p>
                  )}
                </div>

                {isAdmin && !isCheckedIn && (
                  <button
                    onClick={() => handleCheckIn(reg.id)}
                    disabled={isLoading}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Check In
                      </>
                    )}
                  </button>
                )}

                {isAdmin && isCheckedIn && !result && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-green-600/20 border border-green-500/30 px-3 py-2 text-sm font-medium text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </span>
                )}

                {!isAdmin && !isCheckedIn && (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    Registered
                  </span>
                )}

                {!isAdmin && isCheckedIn && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Attended
                  </span>
                )}
              </div>

              {/* Result feedback */}
              {result && (
                <div
                  className={`mt-3 rounded-lg p-3 text-sm ${
                    result.success
                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                      : 'bg-red-500/10 border border-red-500/20 text-red-300'
                  }`}
                >
                  <p>{result.message}</p>

                  {result.newBadges.length > 0 && (
                    <div className="mt-2 flex items-start gap-2">
                      <Award className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-yellow-300 font-medium">
                          New badge{result.newBadges.length > 1 ? 's' : ''} earned!
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {result.newBadges.map((badge) => (
                            <li key={badge} className="text-yellow-200">
                              {badge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
