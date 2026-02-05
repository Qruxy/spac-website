'use client';

/**
 * EventCalendar Component
 *
 * Interactive calendar view for events using react-big-calendar.
 */

import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string;
  locationName: string;
  memberPrice: number;
  guestPrice: number;
  spotsAvailable: number | null;
  capacity: number | null;
}

interface EventCalendarProps {
  events: CalendarEvent[];
}

// Event type colors
const eventTypeColors: Record<string, { bg: string; border: string }> = {
  MEETING: { bg: '#22c55e20', border: '#22c55e' },
  STAR_PARTY: { bg: '#3b82f620', border: '#3b82f6' },
  OBS_SESSION: { bg: '#f9731620', border: '#f97316' },
  WORKSHOP: { bg: '#a855f720', border: '#a855f7' },
  OUTREACH: { bg: '#ec489920', border: '#ec4899' },
  SOCIAL: { bg: '#eab30820', border: '#eab308' },
  SPECIAL: { bg: '#ef444420', border: '#ef4444' },
  EDUCATIONAL: { bg: '#06b6d420', border: '#06b6d4' },
};

const getEventColor = (type: string) => {
  const upperType = type.toUpperCase().replace(/\s+/g, '_');
  return eventTypeColors[upperType] || { bg: '#6b728020', border: '#6b7280' };
};

export default function EventCalendar({ events }: EventCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  // Transform events to calendar format
  const calendarEvents = useMemo(() =>
    events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      resource: event,
    })),
    [events]
  );

  // Handle event click - navigate to event detail page
  const handleSelectEvent = useCallback(
    (event: { resource: CalendarEvent }) => {
      router.push(`/events/${event.resource.slug}`);
    },
    [router]
  );

  // Custom event styling
  const eventStyleGetter = useCallback(
    (event: { resource: CalendarEvent }) => {
      const colors = getEventColor(event.resource.type);
      return {
        style: {
          backgroundColor: colors.bg,
          borderLeft: `3px solid ${colors.border}`,
          color: '#e5e7eb',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      };
    },
    []
  );

  // Navigation handlers
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const handlePrevious = useCallback(() => {
    if (view === Views.MONTH) {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  }, [view]);

  const handleNext = useCallback(() => {
    if (view === Views.MONTH) {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  }, [view]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Custom toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Today
          </button>
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(Views.MONTH)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === Views.MONTH
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView(Views.WEEK)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === Views.WEEK
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView(Views.AGENDA)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === Views.AGENDA
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4 calendar-container">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          date={currentDate}
          view={view}
          onNavigate={handleNavigate}
          onView={setView}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          popup
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        />
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Click an event for details</span>
          </div>
          <div className="flex flex-wrap gap-3 ml-auto">
            {Object.entries({
              'Star Party': 'STAR_PARTY',
              'Meeting': 'MEETING',
              'OBS Session': 'OBS_SESSION',
              'Workshop': 'WORKSHOP',
            }).map(([label, type]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: eventTypeColors[type]?.border || '#6b7280' }}
                />
                <span className="text-muted-foreground text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom styles for dark theme */}
      <style jsx global>{`
        .calendar-container .rbc-calendar {
          background: transparent;
          color: var(--foreground);
        }

        .calendar-container .rbc-header {
          padding: 8px;
          font-weight: 600;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--border);
        }

        .calendar-container .rbc-month-view,
        .calendar-container .rbc-time-view,
        .calendar-container .rbc-agenda-view {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-container .rbc-month-row,
        .calendar-container .rbc-day-bg {
          border-color: var(--border);
        }

        .calendar-container .rbc-off-range-bg {
          background: var(--muted);
        }

        .calendar-container .rbc-today {
          background: hsl(var(--primary) / 0.1);
        }

        .calendar-container .rbc-date-cell {
          padding: 4px 8px;
          text-align: right;
        }

        .calendar-container .rbc-date-cell > a {
          color: var(--foreground);
        }

        .calendar-container .rbc-off-range {
          color: var(--muted-foreground);
        }

        .calendar-container .rbc-event {
          cursor: pointer;
        }

        .calendar-container .rbc-event:hover {
          opacity: 0.9;
        }

        .calendar-container .rbc-show-more {
          color: var(--primary);
          font-size: 0.75rem;
          padding: 2px 4px;
        }

        .calendar-container .rbc-overlay {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .calendar-container .rbc-overlay-header {
          border-bottom: 1px solid var(--border);
          padding: 8px;
        }

        .calendar-container .rbc-agenda-view table {
          border-collapse: collapse;
        }

        .calendar-container .rbc-agenda-view table tbody > tr > td {
          padding: 8px;
          border-top: 1px solid var(--border);
          color: var(--foreground);
        }

        .calendar-container .rbc-agenda-date-cell,
        .calendar-container .rbc-agenda-time-cell {
          white-space: nowrap;
          color: var(--muted-foreground);
        }

        .calendar-container .rbc-time-slot {
          border-top: 1px solid var(--border);
        }

        .calendar-container .rbc-time-header-content,
        .calendar-container .rbc-time-content {
          border-left: 1px solid var(--border);
        }

        .calendar-container .rbc-timeslot-group {
          border-bottom: 1px solid var(--border);
        }

        .calendar-container .rbc-current-time-indicator {
          background: var(--primary);
        }
      `}</style>
    </div>
  );
}
