'use client';

/**
 * EventsView Component
 *
 * Client component that handles view toggling between list and calendar.
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  Users,
  Moon,
  Mic2,
  Tent,
  Star,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import type { CalendarEvent } from './EventCalendar';

// Dynamically import EventCalendar to reduce initial bundle size (~60KB savings)
const EventCalendar = dynamic(() => import('./EventCalendar'), {
  loading: () => (
    <div className="h-[600px] rounded-xl bg-muted/20 animate-pulse flex items-center justify-center">
      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface EventsViewProps {
  events: CalendarEvent[];
  initialType?: string;
}

// Event types for filtering
const eventTypes = [
  { id: 'all', label: 'All Events', icon: CalendarIcon },
  { id: 'star_party', label: 'Star Parties', icon: Moon },
  { id: 'meeting', label: 'Meetings', icon: Mic2 },
  { id: 'obs_session', label: 'OBS', icon: Tent },
  { id: 'workshop', label: 'Workshops', icon: Star },
];

const eventTypeStyles: Record<string, { bg: string; text: string }> = {
  STAR_PARTY: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  MEETING: { bg: 'bg-green-500/10', text: 'text-green-400' },
  OBS_SESSION: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  WORKSHOP: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  OUTREACH: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  SOCIAL: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  SPECIAL: { bg: 'bg-red-500/10', text: 'text-red-400' },
  EDUCATIONAL: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
};

const eventTypeLabels: Record<string, string> = {
  STAR_PARTY: 'Star Party',
  MEETING: 'Meeting',
  OBS_SESSION: 'OBS Session',
  WORKSHOP: 'Workshop',
  OUTREACH: 'Outreach',
  SOCIAL: 'Social',
  SPECIAL: 'Special Event',
  EDUCATIONAL: 'Educational',
};

const getTypeStyle = (type: string) => {
  const upperType = type.toUpperCase().replace(/\s+/g, '_');
  return eventTypeStyles[upperType] || { bg: 'bg-muted', text: 'text-muted-foreground' };
};

const getTypeLabel = (type: string) => {
  const upperType = type.toUpperCase().replace(/\s+/g, '_');
  return eventTypeLabels[upperType] || type;
};

export default function EventsView({ events, initialType = 'all' }: EventsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [typeFilter, setTypeFilter] = useState(initialType);

  // Filter events by type
  const filteredEvents =
    typeFilter === 'all'
      ? events
      : events.filter((e) =>
          e.type.toUpperCase().replace(/\s+/g, '_') === typeFilter.toUpperCase().replace(/\s+/g, '_')
        );

  return (
    <>
      {/* View Toggle and Filters */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {eventTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4">
        {viewMode === 'calendar' ? (
          <EventCalendar events={filteredEvents} />
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No events found
                </h2>
                <p className="text-muted-foreground mb-4">
                  There are no upcoming events matching your filter.
                </p>
                <button
                  onClick={() => setTypeFilter('all')}
                  className="text-primary hover:underline"
                >
                  View all events
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredEvents.map((event) => {
                  const startDate = new Date(event.startDate);
                  const typeStyle = getTypeStyle(event.type);

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="block group"
                    >
                      <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Date Badge */}
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="rounded-lg bg-primary/10 p-3">
                              <div className="text-xs text-primary font-medium">
                                {format(startDate, 'MMM')}
                              </div>
                              <div className="text-2xl font-bold text-foreground">
                                {format(startDate, 'd')}
                              </div>
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 ${typeStyle.bg} ${typeStyle.text}`}
                                >
                                  {getTypeLabel(event.type)}
                                </span>
                                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {event.title}
                                </h2>
                              </div>

                              {/* Availability Badge */}
                              {event.spotsAvailable !== null && event.capacity !== null && (
                                <div className="text-right flex-shrink-0">
                                  <div
                                    className={`text-sm font-medium ${
                                      event.spotsAvailable < 10
                                        ? 'text-orange-400'
                                        : 'text-green-400'
                                    }`}
                                  >
                                    {event.spotsAvailable} spots left
                                  </div>
                                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden mt-1">
                                    <div
                                      className={`h-full rounded-full ${
                                        event.spotsAvailable < 10
                                          ? 'bg-orange-400'
                                          : 'bg-green-400'
                                      }`}
                                      style={{
                                        width: `${
                                          ((event.capacity - event.spotsAvailable) /
                                            event.capacity) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {event.description && (
                              <p className="text-muted-foreground mt-2 line-clamp-2">
                                {event.description.replace(/<[^>]*>/g, '')}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(startDate, 'h:mm a')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.locationName}
                              </span>
                              {event.capacity && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {event.capacity} capacity
                                </span>
                              )}
                              {event.memberPrice === 0 && event.guestPrice === 0 && (
                                <span className="text-green-400 font-medium">
                                  Free Event
                                </span>
                              )}
                              {(event.memberPrice > 0 || event.guestPrice > 0) && (
                                <span className="text-primary font-medium">
                                  ${event.memberPrice} members
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
