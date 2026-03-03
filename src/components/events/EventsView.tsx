'use client';

/**
 * EventsView — Redesigned
 *
 * Polished dark cosmic theme. Features:
 * - Featured "next event" hero card
 * - Month-grouped event list with animated cards
 * - Custom filter pills (no Mantine defaults)
 * - Calendar toggle
 * - Framer Motion stagger animations
 */

import { useState } from 'react';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import {
  CalendarIcon,
  MapPin,
  Clock,
  Users,
  Moon,
  Mic2,
  Tent,
  Star,
  ArrowRight,
  Telescope,
  Sparkles,
  ChevronRight,
  DollarSign,
  List,
  BookOpen,
  Globe,
  Zap,
  PartyPopper,
} from 'lucide-react';
import { format, isSameMonth, startOfMonth } from 'date-fns';
import { motion } from 'motion/react';
import type { CalendarEvent } from './EventCalendar';

const EventCalendar = nextDynamic(() => import('./EventCalendar'), {
  loading: () => (
    <div className="h-[600px] rounded-xl bg-white/[0.03] animate-pulse flex items-center justify-center">
      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface EventsViewProps {
  events: CalendarEvent[];
  initialType?: string;
}

const eventTypes = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'star_party', label: 'Star Parties', icon: Moon },
  { id: 'meeting', label: 'Meetings', icon: Mic2 },
  { id: 'obs_session', label: 'OBS', icon: Tent },
  { id: 'workshop', label: 'Workshops', icon: Star },
  { id: 'outreach', label: 'Outreach', icon: Globe },
  { id: 'educational', label: 'Educational', icon: BookOpen },
];

const typeConfig: Record<string, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  STAR_PARTY:   { color: '#60a5fa', bg: '#1e3a5f', label: 'Star Party',     Icon: Moon },
  MEETING:      { color: '#4ade80', bg: '#14532d', label: 'Meeting',         Icon: Mic2 },
  OBS_SESSION:  { color: '#fb923c', bg: '#431407', label: 'OBS Session',     Icon: Tent },
  WORKSHOP:     { color: '#c084fc', bg: '#3b0764', label: 'Workshop',        Icon: Star },
  OUTREACH:     { color: '#f472b6', bg: '#500724', label: 'Outreach',        Icon: Globe },
  SOCIAL:       { color: '#fbbf24', bg: '#422006', label: 'Social',          Icon: PartyPopper },
  SPECIAL:      { color: '#f87171', bg: '#450a0a', label: 'Special',         Icon: Zap },
  EDUCATIONAL:  { color: '#22d3ee', bg: '#082f49', label: 'Educational',     Icon: BookOpen },
};

function getTypeConfig(type: string) {
  const key = type.toUpperCase().replace(/\s+/g, '_');
  return typeConfig[key] || { color: '#818cf8', bg: '#1e1b4b', label: type, Icon: CalendarIcon };
}

function groupEventsByMonth(events: CalendarEvent[]) {
  const groups: { month: Date; events: CalendarEvent[] }[] = [];
  for (const event of events) {
    const d = new Date(event.startDate);
    const monthStart = startOfMonth(d);
    const existing = groups.find((g) => isSameMonth(g.month, monthStart));
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ month: monthStart, events: [event] });
    }
  }
  return groups;
}

function FeaturedEventCard({ event }: { event: CalendarEvent }) {
  const cfg = getTypeConfig(event.type);
  const start = new Date(event.startDate);
  const isFree = event.memberPrice === 0 && event.guestPrice === 0;

  return (
    <Link href={`/events/${event.slug}`} className="block group mb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 hover:border-white/20 transition-all duration-300"
        style={{ boxShadow: `0 0 60px 0 ${cfg.color}18` }}
      >
        {/* Background gradient orb */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: cfg.color, transform: 'translate(30%, -30%)' }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          {/* Date block */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl p-4 w-20 h-20"
            style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
              {format(start, 'MMM')}
            </span>
            <span className="text-4xl font-black text-white leading-none mt-0.5">
              {format(start, 'd')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
              >
                <cfg.Icon className="h-3 w-3" />
                {cfg.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={isFree ? { backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
                  : { backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                {isFree ? 'Free' : `$${event.memberPrice} members`}
              </span>
              <span className="text-xs text-blue-400 font-medium px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                Next Up
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
              {event.title}
            </h2>

            {event.description && (
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                {event.description.replace(/<[^>]*>/g, '')}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {format(start, 'EEEE, MMMM d')} at {format(start, 'h:mm a')}
              </span>
              {event.locationName && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.locationName}
                </span>
              )}
              {event.spotsAvailable !== null && (
                <span className="flex items-center gap-1.5"
                  style={{ color: event.spotsAvailable < 10 ? '#fb923c' : '#4ade80' }}>
                  <Users className="h-3.5 w-3.5" />
                  {event.spotsAvailable} spots left
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex flex-shrink-0 items-center self-center">
            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>

        {/* Capacity bar */}
        {event.spotsAvailable !== null && event.capacity !== null && (
          <div className="px-6 sm:px-8 pb-6">
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
              <span>{event.capacity - event.spotsAvailable} registered</span>
              <span>{event.capacity} capacity</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((event.capacity - event.spotsAvailable) / event.capacity) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: event.spotsAvailable < 10 ? '#fb923c' : cfg.color }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

function EventCard({ event, index }: { event: CalendarEvent; index: number }) {
  const cfg = getTypeConfig(event.type);
  const start = new Date(event.startDate);
  const isFree = event.memberPrice === 0 && event.guestPrice === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.3) }}
    >
      <Link href={`/events/${event.slug}`} className="group block">
        <div
          className="relative rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 overflow-hidden"
        >
          {/* Left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ backgroundColor: cfg.color }} />

          <div className="pl-4 pr-4 py-4 flex gap-4 items-start">
            {/* Date block */}
            <div
              className="flex-shrink-0 flex flex-col items-center rounded-lg px-3 py-2 text-center"
              style={{ backgroundColor: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                {format(start, 'MMM')}
              </span>
              <span className="text-xl font-black text-white leading-tight">{format(start, 'd')}</span>
              <span className="text-[9px] text-slate-500">{format(start, 'EEE')}</span>
            </div>

            {/* Main */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                >
                  <cfg.Icon className="h-2.5 w-2.5" />
                  {cfg.label}
                </span>
                {isFree ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Free</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    ${event.memberPrice}+
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors leading-snug line-clamp-1 mb-1">
                {event.title}
              </h3>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(start, 'h:mm a')}
                </span>
                {event.locationName && (
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {event.locationName}
                  </span>
                )}
                {event.spotsAvailable !== null && (
                  <span className="flex items-center gap-1"
                    style={{ color: event.spotsAvailable < 10 ? '#fb923c' : '#4ade80' }}>
                    <Users className="h-3 w-3" />
                    {event.spotsAvailable} spots
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="flex-shrink-0 h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-150 self-center" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsView({ events, initialType = 'all' }: EventsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [typeFilter, setTypeFilter] = useState(initialType);

  const filteredEvents =
    typeFilter === 'all'
      ? events
      : events.filter((e) =>
          e.type.toUpperCase().replace(/\s+/g, '_') ===
          typeFilter.toUpperCase().replace(/\s+/g, '_')
        );

  const featuredEvent = filteredEvents[0];
  const remainingEvents = filteredEvents.slice(1);
  const monthGroups = groupEventsByMonth(remainingEvents);

  return (
    <>
      {/* Filter + Toggle Bar */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1 scrollbar-none">
            {eventTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`relative flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  typeFilter === t.id
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.07] hover:text-white hover:border-white/[0.14]'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'list'
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'calendar'
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <Telescope className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Nothing on the schedule yet</h2>
            <p className="text-sm text-muted-foreground mb-4">No upcoming events match this filter.</p>
            <button
              onClick={() => setTypeFilter('all')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Show all events
            </button>
          </motion.div>
        ) : (
          <div>
            {/* Featured: next upcoming event */}
            {featuredEvent && <FeaturedEventCard event={featuredEvent} />}

            {/* Remaining events grouped by month */}
            {monthGroups.map((group) => (
              <div key={group.month.toISOString()} className="mb-8">
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                    {format(group.month, 'MMMM yyyy')}
                  </h3>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs text-slate-600">{group.events.length} event{group.events.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Cards */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
