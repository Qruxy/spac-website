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
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';

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
            <CaretLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <CaretRight className="h-5 w-5" />
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
            <CalendarBlank className="h-4 w-4 text-muted-foreground" />
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
        /* ─── Base ─── */
        .calendar-container .rbc-calendar {
          background: transparent !important;
          color: #e2e8f0 !important;
          font-family: inherit !important;
        }

        /* ─── Month view shell ─── */
        .calendar-container .rbc-month-view {
          background: #0d1117 !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }

        /* ─── Day header row (Mon Tue Wed …) ─── */
        .calendar-container .rbc-header {
          background: #111827 !important;
          color: #64748b !important;
          font-size: 0.7rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          padding: 10px 4px !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          border-right: 1px solid rgba(255,255,255,0.06) !important;
        }
        .calendar-container .rbc-header + .rbc-header {
          border-left: none !important;
        }

        /* ─── Week rows ─── */
        .calendar-container .rbc-month-row {
          border-top: 1px solid rgba(255,255,255,0.05) !important;
        }
        .calendar-container .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(255,255,255,0.05) !important;
        }

        /* ─── Individual day cells ─── */
        .calendar-container .rbc-day-bg {
          background: #0d1117 !important;
          border-right: 1px solid rgba(255,255,255,0.04) !important;
          transition: background 0.15s;
        }
        .calendar-container .rbc-day-bg:hover {
          background: #111827 !important;
        }

        /* Off-range days (prev/next month) */
        .calendar-container .rbc-off-range-bg {
          background: #080c12 !important;
        }
        .calendar-container .rbc-off-range .rbc-date-cell a,
        .calendar-container .rbc-off-range a {
          color: #334155 !important;
        }

        /* Today highlight */
        .calendar-container .rbc-today {
          background: rgba(59, 130, 246, 0.08) !important;
        }

        /* ─── Date numbers ─── */
        .calendar-container .rbc-date-cell {
          padding: 6px 8px 2px !important;
          text-align: right !important;
        }
        .calendar-container .rbc-date-cell a,
        .calendar-container .rbc-date-cell button {
          color: #94a3b8 !important;
          font-size: 0.8rem !important;
          font-weight: 500 !important;
          text-decoration: none !important;
        }
        .calendar-container .rbc-now .rbc-date-cell a,
        .calendar-container .rbc-now a {
          background: #3b82f6 !important;
          color: #fff !important;
          border-radius: 50% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 24px !important;
          height: 24px !important;
          font-size: 0.75rem !important;
        }

        /* ─── Events ─── */
        .calendar-container .rbc-event {
          border-radius: 5px !important;
          border: none !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          padding: 2px 6px !important;
          cursor: pointer !important;
          transition: opacity 0.15s, transform 0.1s !important;
        }
        .calendar-container .rbc-event:hover {
          opacity: 0.85 !important;
          transform: translateY(-1px) !important;
        }
        .calendar-container .rbc-event.rbc-selected {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 1px !important;
        }
        .calendar-container .rbc-event-label {
          font-size: 0.65rem !important;
          opacity: 0.8 !important;
        }

        /* ─── +n more link ─── */
        .calendar-container .rbc-show-more {
          color: #60a5fa !important;
          font-size: 0.7rem !important;
          font-weight: 600 !important;
          background: transparent !important;
          padding: 1px 6px !important;
        }

        /* ─── Popup overlay ─── */
        .calendar-container .rbc-overlay {
          background: #1e293b !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          padding: 8px !important;
        }
        .calendar-container .rbc-overlay-header {
          color: #94a3b8 !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          border-bottom: 1px solid rgba(255,255,255,0.07) !important;
          padding-bottom: 6px !important;
          margin-bottom: 6px !important;
        }

        /* ─── Agenda view ─── */
        .calendar-container .rbc-agenda-view {
          background: #0d1117 !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .calendar-container .rbc-agenda-view table {
          border-collapse: collapse !important;
          width: 100% !important;
          background: transparent !important;
        }
        .calendar-container .rbc-agenda-view table thead th {
          background: #111827 !important;
          color: #64748b !important;
          font-size: 0.7rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          padding: 10px 12px !important;
          border-bottom: 1px solid rgba(255,255,255,0.07) !important;
        }
        .calendar-container .rbc-agenda-view table tbody > tr > td {
          padding: 10px 12px !important;
          border-top: 1px solid rgba(255,255,255,0.05) !important;
          color: #e2e8f0 !important;
          background: transparent !important;
          font-size: 0.85rem !important;
          vertical-align: middle !important;
        }
        .calendar-container .rbc-agenda-view table tbody > tr:hover > td {
          background: rgba(255,255,255,0.03) !important;
        }
        .calendar-container .rbc-agenda-date-cell {
          color: #3b82f6 !important;
          font-weight: 600 !important;
          white-space: nowrap !important;
          min-width: 80px !important;
        }
        .calendar-container .rbc-agenda-time-cell {
          color: #64748b !important;
          white-space: nowrap !important;
          min-width: 80px !important;
        }
        .calendar-container .rbc-agenda-event-cell a {
          color: #e2e8f0 !important;
          text-decoration: none !important;
        }
        .calendar-container .rbc-agenda-empty {
          padding: 40px !important;
          text-align: center !important;
          color: #475569 !important;
          font-size: 0.875rem !important;
        }

        /* ─── Week view ─── */
        .calendar-container .rbc-time-view {
          background: #0d1117 !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .calendar-container .rbc-time-header {
          background: #111827 !important;
          border-bottom: 1px solid rgba(255,255,255,0.07) !important;
        }
        .calendar-container .rbc-time-header-content {
          border-left: 1px solid rgba(255,255,255,0.07) !important;
        }
        .calendar-container .rbc-time-header-cell {
          color: #64748b !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          padding: 8px 4px !important;
        }
        .calendar-container .rbc-time-content {
          background: #0d1117 !important;
          border-top: 1px solid rgba(255,255,255,0.07) !important;
        }
        .calendar-container .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
        }
        .calendar-container .rbc-time-slot {
          color: #334155 !important;
          font-size: 0.7rem !important;
        }
        .calendar-container .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
        }
        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid rgba(255,255,255,0.03) !important;
        }
        .calendar-container .rbc-day-slot .rbc-events-container {
          border-left: 1px solid rgba(255,255,255,0.04) !important;
        }
        .calendar-container .rbc-current-time-indicator {
          background: #3b82f6 !important;
          opacity: 0.8 !important;
          height: 2px !important;
        }
        .calendar-container .rbc-current-time-indicator::before {
          background: #3b82f6 !important;
        }

        /* ─── Scrollbar (webkit) ─── */
        .calendar-container .rbc-time-content::-webkit-scrollbar {
          width: 4px !important;
        }
        .calendar-container .rbc-time-content::-webkit-scrollbar-track {
          background: #0d1117 !important;
        }
        .calendar-container .rbc-time-content::-webkit-scrollbar-thumb {
          background: #1e293b !important;
          border-radius: 2px !important;
        }
      `}</style>
    </div>
  );
}
