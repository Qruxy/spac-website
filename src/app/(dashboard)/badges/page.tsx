'use client';

import { useState, useEffect } from 'react';
import { Award, Trophy, Lock, Star, Loader2, Calendar } from 'lucide-react';

/**
 * Badge Collection Page
 *
 * Displays user's earned digital badges alongside locked badges they can still earn.
 * Fetches from /api/user/badges which returns earned badges, all available badges, and stats.
 */

interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
  eventTitle?: string;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface BadgeStats {
  totalEventsAttended: number;
  totalBadges: number;
  earnedCount: number;
}

interface BadgesResponse {
  badges: EarnedBadge[];
  allBadges: BadgeDefinition[];
  stats: BadgeStats;
}

export default function BadgesPage() {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/badges');

        if (!response.ok) {
          throw new Error('Failed to load badges');
        }

        const result: BadgesResponse = await response.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch badges:', err);
        setError('Unable to load your badges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            My Badges
          </h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your badge collection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            My Badges
          </h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Could not load badges
          </h3>
          <p className="text-muted-foreground">
            {error || 'Something went wrong. Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  const { badges: earned, allBadges, stats } = data;
  const earnedIds = new Set(earned.map((b) => b.id));
  const lockedBadges = allBadges.filter((b) => !earnedIds.has(b.id));
  const completionPercent =
    stats.totalBadges > 0
      ? Math.round((stats.earnedCount / stats.totalBadges) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          My Badges
        </h1>
        <p className="text-muted-foreground mt-1">
          Your collection of achievements and milestones
        </p>
      </div>

      {/* Stats Bar */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Badge count */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2.5">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
              <p className="text-lg font-bold text-foreground">
                {stats.earnedCount} of {stats.totalBadges}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-border" />

          {/* Events attended */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-2.5">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Events Attended</p>
              <p className="text-lg font-bold text-foreground">
                {stats.totalEventsAttended}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-border" />

          {/* Progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-sm font-semibold text-foreground">
                {completionPercent}%
              </p>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-700 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      {earned.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Earned Badges ({earned.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earned.map((badge) => (
              <EarnedBadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12">
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No badges earned yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Attend SPAC events and check in to start earning badges. Your first
              event will unlock the &quot;First Light&quot; badge!
            </p>
          </div>
        </section>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Badges to Earn ({lockedBadges.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => (
              <LockedBadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}

      {/* CSS for glow and shine effects */}
      <style jsx global>{`
        @keyframes badge-shine {
          0% {
            transform: translateX(-100%) rotate(25deg);
          }
          100% {
            transform: translateX(200%) rotate(25deg);
          }
        }

        .badge-card-earned {
          position: relative;
          overflow: hidden;
        }

        .badge-card-earned::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.04),
            transparent
          );
          transform: rotate(25deg);
          animation: badge-shine 4s ease-in-out infinite;
          pointer-events: none;
        }

        .badge-card-earned:hover::after {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          );
        }
      `}</style>
    </div>
  );
}

function EarnedBadgeCard({ badge }: { badge: EarnedBadge }) {
  const earnedDate = new Date(badge.earnedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="badge-card-earned group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Badge icon */}
      <div className="text-center mb-3">
        <span
          className="text-5xl block drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          role="img"
          aria-label={badge.name}
        >
          {badge.icon}
        </span>
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className="font-bold text-foreground text-sm leading-tight mb-1">
          {badge.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-snug mb-2">
          {badge.description}
        </p>

        {/* Earned date */}
        <div className="pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground/70">
            Earned on {earnedDate}
          </p>
          {badge.eventTitle && (
            <p className="text-[11px] text-primary/70 truncate mt-0.5">
              {badge.eventTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedBadgeCard({ badge }: { badge: BadgeDefinition }) {
  return (
    <div className="relative rounded-xl border border-border bg-card/50 p-5 opacity-60 transition-all duration-300 hover:opacity-80">
      {/* Lock overlay */}
      <div className="absolute top-3 right-3">
        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>

      {/* Badge icon - grayscale */}
      <div className="text-center mb-3">
        <span
          className="text-5xl block grayscale transition-all duration-300"
          role="img"
          aria-label={badge.name}
          style={{ filter: 'grayscale(100%) brightness(0.7)' }}
        >
          {badge.icon}
        </span>
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className="font-bold text-muted-foreground text-sm leading-tight mb-1">
          {badge.name}
        </h3>
        <p className="text-xs text-muted-foreground/70 leading-snug">
          {badge.description}
        </p>
      </div>
    </div>
  );
}
