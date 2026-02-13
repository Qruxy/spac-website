'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit3,
  Trash2,
  Filter,
  Tent,
} from 'lucide-react';

type EventType =
  | 'STAR_PARTY'
  | 'MEETING'
  | 'WORKSHOP'
  | 'OBSERVATION'
  | 'SOCIAL'
  | 'OUTREACH'
  | 'FUNDRAISER'
  | 'OTHER';

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string | null;
  locationName: string | null;
  locationAddress: string | null;
  capacity: number | null;
  memberPrice: number | null;
  guest_price: number | null;
  campingAvailable: boolean;
  camping_price: number | null;
  registration_opens: string | null;
  registration_closes: string | null;
  isRecurring: boolean;
  recurrencePattern: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count: {
    registrations: number;
  };
}

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  locationName: string;
  locationAddress: string;
  capacity: string;
  isFreeEvent: boolean;
  memberPrice: string;
  guestPrice: string;
  campingAvailable: boolean;
  campingPrice: string;
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'STAR_PARTY', label: 'Star Party', color: 'bg-violet-500/15 text-violet-400' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-blue-500/15 text-blue-400' },
  { value: 'WORKSHOP', label: 'Workshop', color: 'bg-amber-500/15 text-amber-400' },
  { value: 'OBSERVATION', label: 'Observation', color: 'bg-indigo-500/15 text-indigo-400' },
  { value: 'SOCIAL', label: 'Social', color: 'bg-pink-500/15 text-pink-400' },
  { value: 'OUTREACH', label: 'Outreach', color: 'bg-green-500/15 text-green-400' },
  { value: 'FUNDRAISER', label: 'Fundraiser', color: 'bg-orange-500/15 text-orange-400' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-500/15 text-slate-400' },
];

const EVENT_STATUSES: { value: EventStatus; label: string; color: string }[] = [
  { value: 'PUBLISHED', label: 'Published', color: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-500/15 text-slate-400' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/15 text-red-400' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-blue-500/15 text-blue-400' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const perPage = 25;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        sortField: 'startDate',
        sortOrder: 'DESC',
      });

      const filter: any = {};
      if (searchQuery) filter.q = searchQuery;
      if (statusFilter !== 'ALL') filter.status = statusFilter;
      if (Object.keys(filter).length > 0) {
        params.append('filter', JSON.stringify(filter));
      }

      const res = await fetch(`/api/admin/events?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();
      setEvents(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchEvents, 300);
    return () => clearTimeout(debounce);
  }, [fetchEvents]);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (deletingId === id) {
      try {
        const res = await fetch(`/api/admin/events/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to delete event');

        showToast('Event deleted successfully', 'success');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleFormSubmit = async (formData: EventFormData) => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        locationName: formData.locationName || null,
        locationAddress: formData.locationAddress || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        isFreeEvent: formData.isFreeEvent,
        memberPrice: formData.isFreeEvent ? null : (formData.memberPrice ? parseFloat(formData.memberPrice) : null),
        guestPrice: formData.isFreeEvent ? null : (formData.guestPrice ? parseFloat(formData.guestPrice) : null),
        campingAvailable: formData.campingAvailable,
        campingPrice: formData.campingAvailable ? (formData.campingPrice ? parseFloat(formData.campingPrice) : null) : null,
      };

      const url = editingEvent
        ? `/api/admin/events/${editingEvent.id}`
        : '/api/admin/events';

      const res = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save event');
      }

      showToast(
        editingEvent ? 'Event updated successfully' : 'Event created successfully',
        'success'
      );
      setIsFormOpen(false);
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      showToast(error.message || 'Failed to save event', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium ${
      type === 'success'
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'bg-red-500/15 text-red-400 border border-red-500/30'
    } z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = formatDate(start);
    if (!end) return startDate;
    const endDate = formatDate(end);
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeColor = (type: EventType) => {
    return EVENT_TYPES.find((t) => t.value === type)?.color || 'bg-slate-500/15 text-slate-400';
  };

  const getStatusColor = (status: EventStatus) => {
    return EVENT_STATUSES.find((s) => s.value === status)?.color || 'bg-slate-500/15 text-slate-400';
  };

  const startIndex = (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, total);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white/80">Events</h1>
          <p className="text-sm text-white/50 mt-1">Manage club events and activities</p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as EventStatus | 'ALL');
                setPage(1);
              }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
            >
              <option value="ALL">All Status</option>
              {EVENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-2">No events found</h3>
            <p className="text-sm text-white/40">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first event'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[13px] font-medium text-white/80">
                          {event.title}
                        </div>
                        {event.locationName && (
                          <div className="flex items-center gap-1 text-[11px] text-white/40">
                            <MapPin className="w-3 h-3" />
                            {event.locationName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-white/70">
                        <Calendar className="w-3.5 h-3.5 text-white/30" />
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium ${getTypeColor(
                          event.type
                        )}`}
                      >
                        {EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {EVENT_STATUSES.find((s) => s.value === event.status)?.label || event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-white/70">
                        <Users className="w-3.5 h-3.5 text-white/30" />
                        {event._count.registrations}
                        {event.capacity && (
                          <span className="text-white/40">/ {event.capacity}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                            deletingId === event.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          {deletingId === event.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <div className="text-sm text-white/50">
                Showing {startIndex}-{endIndex} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-white/50">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Slide-over */}
      {isFormOpen && (
        <EventFormPanel
          event={editingEvent}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

interface EventFormPanelProps {
  event: Event | null;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void;
}

function EventFormPanel({ event, onClose, onSubmit }: EventFormPanelProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'MEETING',
    status: event?.status || 'DRAFT',
    startDate: event?.startDate ? event.startDate.slice(0, 16) : '',
    endDate: event?.endDate ? event.endDate.slice(0, 16) : '',
    locationName: event?.locationName || '',
    locationAddress: event?.locationAddress || '',
    capacity: event?.capacity?.toString() || '',
    isFreeEvent: event ? (event.memberPrice === null && event.guest_price === null) : false,
    memberPrice: event?.memberPrice?.toString() || '',
    guestPrice: event?.guest_price?.toString() || '',
    campingAvailable: event?.campingAvailable || false,
    campingPrice: event?.camping_price?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0a0a0a] border-l border-white/[0.06] z-50 overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              placeholder="e.g., February Star Party"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              placeholder="Event details and description..."
            />
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Location Name
            </label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              placeholder="e.g., Dark Sky Observatory"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Location Address
            </label>
            <input
              type="text"
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              placeholder="Full address or coordinates"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Capacity
            </label>
            <input
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
              placeholder="Maximum attendees"
            />
          </div>

          {/* Free Event Toggle */}
          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <input
              type="checkbox"
              id="isFreeEvent"
              checked={formData.isFreeEvent}
              onChange={(e) => setFormData({ ...formData, isFreeEvent: e.target.checked })}
              className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-blue-500 focus:ring-blue-500/40"
            />
            <label htmlFor="isFreeEvent" className="text-sm font-medium text-white/70 cursor-pointer">
              Free Event (No registration fee)
            </label>
          </div>

          {/* Pricing */}
          {!formData.isFreeEvent && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Member Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.memberPrice}
                    onChange={(e) => setFormData({ ...formData, memberPrice: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Guest Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.guestPrice}
                    onChange={(e) => setFormData({ ...formData, guestPrice: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Camping Available Toggle */}
          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <input
              type="checkbox"
              id="campingAvailable"
              checked={formData.campingAvailable}
              onChange={(e) => setFormData({ ...formData, campingAvailable: e.target.checked })}
              className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-blue-500 focus:ring-blue-500/40"
            />
            <div className="flex items-center gap-2">
              <Tent className="w-4 h-4 text-white/40" />
              <label htmlFor="campingAvailable" className="text-sm font-medium text-white/70 cursor-pointer">
                Camping Available
              </label>
            </div>
          </div>

          {/* Camping Price */}
          {formData.campingAvailable && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Camping Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.campingPrice}
                  onChange={(e) => setFormData({ ...formData, campingPrice: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/25 text-sm pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500/40"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {event ? 'Update Event' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
