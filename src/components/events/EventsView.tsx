'use client';

/**
 * EventsView Component
 *
 * Client component that handles view toggling between list and calendar.
 * Uses Mantine Card components for event cards and GooeyNav for filtering.
 */

import { useState } from 'react';
import nextDynamic from 'next/dynamic';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, Badge, Group, Text } from '@mantine/core';
import { GooeyNav } from '@/components/animated/gooey-nav';
import type { CalendarEvent } from './EventCalendar';

// Dynamically import EventCalendar to reduce initial bundle size (~60KB savings)
const EventCalendar = nextDynamic(() => import('./EventCalendar'), {
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

// Color mapping for event type accent bars and badges (hex colors)
const eventTypeAccentColors: Record<string, string> = {
  STAR_PARTY: '#3b82f6',
  MEETING: '#22c55e',
  OBS_SESSION: '#f97316',
  WORKSHOP: '#a855f7',
  OUTREACH: '#ec4899',
  SOCIAL: '#eab308',
  SPECIAL: '#ef4444',
  EDUCATIONAL: '#06b6d4',
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

const getAccentColor = (type: string) => {
  const upperType = type.toUpperCase().replace(/\s+/g, '_');
  return eventTypeAccentColors[upperType] || '#6b7280';
};

const getTypeLabel = (type: string) => {
  const upperType = type.toUpperCase().replace(/\s+/g, '_');
  return eventTypeLabels[upperType] || type;
};

export default function EventsView({ events, initialType = 'all' }: EventsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [typeFilter, setTypeFilter] = useState(initialType);

  // Map typeFilter to activeIndex for GooeyNav
  const activeFilterIndex = eventTypes.findIndex((t) => t.id === typeFilter);

  // Build GooeyNav items from eventTypes
  const gooeyNavItems = eventTypes.map((type) => ({
    label: type.label,
    icon: <type.icon className="h-4 w-4" />,
  }));

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
          {/* GooeyNav Filter */}
          <div className="overflow-x-auto pb-2 sm:pb-0">
            <GooeyNav
              items={gooeyNavItems}
              activeIndex={activeFilterIndex >= 0 ? activeFilterIndex : 0}
              accentColor="#3b82f6"
              onItemClick={(index) => {
                setTypeFilter(eventTypes[index].id);
              }}
            />
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
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map((event) => {
                  const startDate = new Date(event.startDate);
                  const accentColor = getAccentColor(event.type);

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="block group"
                      style={{ textDecoration: 'none' }}
                    >
                      <Card
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                        styles={{
                          root: {
                            backgroundColor: 'var(--mantine-color-dark-7, #1a1b1e)',
                            borderColor: 'var(--mantine-color-dark-4, #373A40)',
                            '&:hover': {
                              borderColor: accentColor,
                            },
                          },
                        }}
                        style={{
                          cursor: 'pointer',
                        }}
                      >
                        {/* Colored accent bar at top */}
                        <Card.Section>
                          <div
                            style={{
                              height: 4,
                              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
                            }}
                          />
                        </Card.Section>

                        {/* Date + Type badge row */}
                        <Group justify="space-between" mt="md" mb="xs">
                          <Group gap="xs">
                            {/* Compact date badge */}
                            <div
                              className="flex flex-col items-center justify-center rounded-lg px-3 py-2"
                              style={{ backgroundColor: `${accentColor}18` }}
                            >
                              <span
                                className="text-[10px] font-semibold uppercase leading-tight"
                                style={{ color: accentColor }}
                              >
                                {format(startDate, 'MMM')}
                              </span>
                              <span className="text-lg font-bold leading-tight text-white">
                                {format(startDate, 'd')}
                              </span>
                            </div>

                            <Badge
                              variant="light"
                              size="sm"
                              styles={{
                                root: {
                                  backgroundColor: `${accentColor}20`,
                                  color: accentColor,
                                  borderColor: `${accentColor}40`,
                                  border: `1px solid ${accentColor}40`,
                                },
                              }}
                            >
                              {getTypeLabel(event.type)}
                            </Badge>
                          </Group>

                          {/* Price badge */}
                          {event.memberPrice === 0 && event.guestPrice === 0 && (
                            <Badge
                              variant="light"
                              color="green"
                              size="sm"
                              styles={{
                                root: {
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                },
                              }}
                            >
                              Free
                            </Badge>
                          )}
                          {(event.memberPrice > 0 || event.guestPrice > 0) && (
                            <Badge
                              variant="light"
                              color="yellow"
                              size="sm"
                              styles={{
                                root: {
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontWeight: 700,
                                },
                              }}
                            >
                              ${event.memberPrice}{event.guestPrice > 0 ? ` / $${event.guestPrice}` : ''}
                            </Badge>
                          )}
                        </Group>

                        {/* Title */}
                        <Text
                          fw={600}
                          size="lg"
                          className="group-hover:text-blue-400 transition-colors"
                          lineClamp={2}
                          mt={4}
                          c="white"
                        >
                          {event.title}
                        </Text>

                        {/* Description */}
                        {event.description && (
                          <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                            {event.description.replace(/<[^>]*>/g, '')}
                          </Text>
                        )}

                        {/* Metadata row */}
                        <Group gap="lg" mt="md">
                          <Group gap={4}>
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <Text size="xs" c="dimmed">
                              {format(startDate, 'h:mm a')}
                            </Text>
                          </Group>

                          <Group gap={4}>
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <Text size="xs" c="dimmed" lineClamp={1} maw={140}>
                              {event.locationName}
                            </Text>
                          </Group>

                          {event.capacity && (
                            <Group gap={4}>
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <Text size="xs" c="dimmed">
                                {event.capacity}
                              </Text>
                            </Group>
                          )}
                        </Group>

                        {/* Spots availability bar */}
                        {event.spotsAvailable !== null && event.capacity !== null && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06]">
                            <Group justify="space-between" mb={4}>
                              <Text size="xs" c="dimmed">
                                Availability
                              </Text>
                              <Text
                                size="xs"
                                fw={600}
                                style={{
                                  color: event.spotsAvailable < 10 ? '#fb923c' : '#4ade80',
                                }}
                              >
                                {event.spotsAvailable} spots left
                              </Text>
                            </Group>
                            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${((event.capacity - event.spotsAvailable) / event.capacity) * 100}%`,
                                  backgroundColor: event.spotsAvailable < 10 ? '#fb923c' : '#4ade80',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
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
