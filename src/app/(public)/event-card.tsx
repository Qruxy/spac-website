/**
 * Event Card Component
 *
 * Displays an event with type badge, date, location, and hover animation.
 * Links to the event detail page.
 */

import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventData {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  type: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress?: string | null;
  memberPrice?: number;
  guestPrice?: number;
  spotsAvailable?: number | null;
  capacity?: number | null;
}

// Event type styling configuration
const eventTypeStyles: Record<string, { bg: string; text: string; border: string }> = {
  STAR_PARTY: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  MEETING: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  OUTREACH: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  SPECIAL: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  WORKSHOP: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  OBS: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
};

// Format event type for display
function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    STAR_PARTY: 'Star Party',
    MEETING: 'Meeting',
    OUTREACH: 'Outreach',
    SPECIAL: 'Special Event',
    WORKSHOP: 'Workshop',
    OBS: 'OBS',
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time for display
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventCard({ event, featured = false }: { event: EventData; featured?: boolean }) {
  const typeStyle = eventTypeStyles[event.type] || eventTypeStyles.MEETING;
  const isFree = !event.memberPrice || event.memberPrice === 0;
  const hasLimitedSpots = event.spotsAvailable !== null && event.spotsAvailable <= 10;

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        'group relative block rounded-xl border bg-card p-6 transition-all duration-300',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
        'hover:-translate-y-1',
        featured && 'md:col-span-2 lg:col-span-1'
      )}
    >
      {/* Type Badge */}
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-4',
          typeStyle.bg,
          typeStyle.text,
          typeStyle.border
        )}
      >
        {formatEventType(event.type)}
      </span>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
        {event.title}
      </h3>

      {/* Description (truncated) */}
      {event.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {event.description}
        </p>
      )}

      {/* Event Details */}
      <div className="space-y-2 text-sm">
        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary/70" />
          <span>{formatDate(event.startDate)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary/70" />
          <span>{formatTime(event.startDate)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary/70" />
          <span className="truncate">{event.locationName}</span>
        </div>

        {/* Spots available (if limited) */}
        {hasLimitedSpots && (
          <div className="flex items-center gap-2 text-amber-400">
            <Users className="h-4 w-4" />
            <span>Only {event.spotsAvailable} spots left!</span>
          </div>
        )}
      </div>

      {/* Price Tag */}
      <div className="absolute top-4 right-4">
        {isFree ? (
          <span className="rounded-full bg-green-500/10 border border-green-500/30 px-2 py-1 text-xs font-medium text-green-400">
            Free
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            ${event.memberPrice}+
          </span>
        )}
      </div>

      {/* Hover Gradient Effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100 pointer-events-none',
          'bg-gradient-to-br from-primary/5 via-transparent to-transparent'
        )}
      />
    </Link>
  );
}

// Empty state component for when there are no events
export function NoEventsCard() {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Events</h3>
      <p className="text-muted-foreground mb-4">
        Check back soon for new events, or view our past events.
      </p>
      <Link
        href="/events/archive"
        className="text-primary hover:underline text-sm"
      >
        View past events →
      </Link>
    </div>
  );
}

// Loading skeleton for event cards
export function EventCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      {/* Badge skeleton */}
      <div className="h-6 w-20 rounded-full bg-muted mb-4" />
      
      {/* Title skeleton */}
      <div className="h-5 w-3/4 rounded bg-muted mb-2" />
      
      {/* Description skeleton */}
      <div className="h-4 w-full rounded bg-muted/50 mb-1" />
      <div className="h-4 w-2/3 rounded bg-muted/50 mb-4" />
      
      {/* Details skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-muted/30" />
        <div className="h-4 w-24 rounded bg-muted/30" />
        <div className="h-4 w-48 rounded bg-muted/30" />
      </div>
    </div>
  );
}

export default EventCard;
