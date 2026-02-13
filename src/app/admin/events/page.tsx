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
  Bell,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Upload,
  ImageIcon,
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
  imageUrl: string;
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
  const [reminderEventId, setReminderEventId] = useState<string | null>(null);
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
        imageUrl: formData.imageUrl || null,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Events</h1>
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
                        <div className="text-sm font-medium text-white/80">
                          {event.title}
                        </div>
                        {event.locationName && (
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="w-3 h-3" />
                            {event.locationName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Calendar className="w-3.5 h-3.5 text-white/30" />
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                          event.type
                        )}`}
                      >
                        {EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {EVENT_STATUSES.find((s) => s.value === event.status)?.label || event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
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
                          onClick={() => setReminderEventId(event.id)}
                          className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Manage reminders"
                        >
                          <Bell className="w-3 h-3" />
                          Reminders
                        </button>
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

      {/* Reminders Slide-over */}
      {reminderEventId && (
        <ReminderPanel
          eventId={reminderEventId}
          onClose={() => setReminderEventId(null)}
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
    imageUrl: event?.imageUrl || '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: 'events',
        }),
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignedRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');

      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

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

          {/* Event Image */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-white/40" />
                Cover Image
              </span>
            </label>

            {formData.imageUrl ? (
              <div className="relative group">
                <img
                  src={formData.imageUrl}
                  alt="Event cover"
                  className="w-full h-48 object-cover rounded-lg border border-white/[0.08]"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Replace
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/[0.1] rounded-lg cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.02] transition-colors"
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageUpload(file);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-sm text-white/50">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-white/25" />
                    <span className="text-sm text-white/50">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-white/30">
                      JPG, PNG, GIF or WebP (max 10MB)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            )}

            {uploadError && (
              <p className="text-xs text-red-400 mt-2">{uploadError}</p>
            )}
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

          {/* Social Media Sharing */}
          <div className="bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border border-blue-500/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-white/70">Share to Social Media</p>
            <p className="text-xs text-white/40">Post this event to your connected social media accounts when published.</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-white/[0.04] rounded-lg px-3 py-2">
                <input type="checkbox" className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-blue-500 focus:ring-blue-500/40" />
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="text-xs font-medium text-white/60">Facebook</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-white/[0.04] rounded-lg px-3 py-2">
                <input type="checkbox" className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-pink-500 focus:ring-pink-500/40" />
                <svg className="w-4 h-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span className="text-xs font-medium text-white/60">Instagram</span>
              </label>
            </div>
          </div>

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

// ─── Reminder Panel ──────────────────────────────────────────────────────────

interface Reminder {
  id: string;
  daysBefore: number;
  scheduledFor: string;
  emailSubject: string | null;
  emailBody: string | null;
  useGenericTemplate: boolean;
  status: 'PENDING' | 'SENT' | 'PARTIALLY_SENT' | 'FAILED' | 'CANCELLED';
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  createdBy: { name: string | null };
}

interface ReminderPanelProps {
  eventId: string;
  onClose: () => void;
}

const PRESET_REMINDERS = [
  { label: '1 week before', daysBefore: 7, icon: '📅' },
  { label: '3 days before', daysBefore: 3, icon: '⏰' },
  { label: '2 days before', daysBefore: 2, icon: '⏰' },
  { label: '1 day before', daysBefore: 1, icon: '🔔' },
  { label: 'Day of event', daysBefore: 0, icon: '🎯' },
];

function ReminderPanel({ eventId, onClose }: ReminderPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [eventInfo, setEventInfo] = useState<{ title: string; startDate: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [useGeneric, setUseGeneric] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reminders`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReminders(data.reminders || []);
      setEventInfo(data.event || null);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (daysBefore: number, subject?: string, body?: string, generic?: boolean) => {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          daysBefore,
          emailSubject: subject || undefined,
          emailBody: body || undefined,
          useGenericTemplate: generic ?? !subject,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const data = await res.json();
      if (data.created === 0) {
        showToast('Reminder already exists or scheduled time is in the past', 'error');
      } else {
        showToast('Reminder added', 'success');
      }
      fetchReminders();
    } catch {
      showToast('Failed to add reminder', 'error');
    } finally {
      setAdding(false);
    }
  };

  const addPresetBatch = async () => {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reminders: [
            { daysBefore: 7, useGenericTemplate: true },
            { daysBefore: 2, useGenericTemplate: true },
            { daysBefore: 1, useGenericTemplate: true },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const data = await res.json();
      showToast(`${data.created} reminder(s) added`, 'success');
      fetchReminders();
    } catch {
      showToast('Failed to add reminders', 'error');
    } finally {
      setAdding(false);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reminders/${reminderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete');
      showToast('Reminder removed', 'success');
      fetchReminders();
    } catch {
      showToast('Failed to delete reminder', 'error');
    }
  };

  const updateReminder = async (reminderId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update');
      showToast('Reminder updated', 'success');
      setEditingId(null);
      fetchReminders();
    } catch {
      showToast('Failed to update reminder', 'error');
    }
  };

  const processNow = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/cron/send-reminders', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      showToast(
        `Processed ${data.processed} reminder(s): ${data.totalEmailsSent} sent, ${data.totalEmailsFailed} failed`,
        data.totalEmailsFailed > 0 ? 'error' : 'success'
      );
      fetchReminders();
    } catch {
      showToast('Failed to process reminders', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCustomSubmit = () => {
    const days = parseInt(customDays);
    if (isNaN(days) || days < 0) {
      showToast('Enter a valid number of days', 'error');
      return;
    }
    addReminder(days, useGeneric ? undefined : customSubject, useGeneric ? undefined : customBody, useGeneric);
    setShowCustom(false);
    setCustomDays('');
    setCustomSubject('');
    setCustomBody('');
    setUseGeneric(true);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium ${
      type === 'success'
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'bg-red-500/15 text-red-400 border border-red-500/30'
    } z-[60]`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Sent
          </span>
        );
      case 'PARTIALLY_SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-400">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const formatScheduledDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const dayLabel = (days: number) => {
    if (days === 0) return 'Day of event';
    if (days === 1) return '1 day before';
    return `${days} days before`;
  };

  const existingDays = new Set(reminders.filter((r) => r.status !== 'CANCELLED').map((r) => r.daysBefore));

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0a0a0a] border-l border-white/[0.06] z-50 overflow-y-auto">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Event Reminders
            </h2>
            {eventInfo && (
              <p className="text-xs text-white/40 mt-1">{eventInfo.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">Quick Add</h3>
              <button
                onClick={addPresetBatch}
                disabled={adding}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add recommended set (7d, 2d, 1d)'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_REMINDERS.map((preset) => (
                <button
                  key={preset.daysBefore}
                  onClick={() => addReminder(preset.daysBefore)}
                  disabled={adding || existingDays.has(preset.daysBefore)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    existingDays.has(preset.daysBefore)
                      ? 'bg-white/[0.02] text-white/20 cursor-not-allowed'
                      : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                  }`}
                >
                  <span>{preset.icon}</span>
                  {preset.label}
                  {existingDays.has(preset.daysBefore) && (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reminder */}
          <div className="space-y-3">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Custom Reminder
            </button>

            {showCustom && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Days before event
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                    placeholder="e.g., 14 for two weeks before"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <input
                    type="checkbox"
                    id="useGenericReminder"
                    checked={useGeneric}
                    onChange={(e) => setUseGeneric(e.target.checked)}
                    className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-blue-500"
                  />
                  <label htmlFor="useGenericReminder" className="text-xs font-medium text-white/60 cursor-pointer">
                    Use generic template (auto-generates email with event details)
                  </label>
                </div>

                {!useGeneric && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40"
                        placeholder="e.g., Don't forget about {{eventTitle}}!"
                      />
                      <p className="text-[10px] text-white/30 mt-1">
                        Variables: {'{{firstName}}'}, {'{{name}}'}, {'{{eventTitle}}'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Email Body (HTML)
                      </label>
                      <textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        rows={6}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-blue-500/40 font-mono text-xs"
                        placeholder="<p>Hi {{firstName}},</p>&#10;<p>Just a reminder about...</p>"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCustomSubmit}
                    disabled={adding || !customDays}
                    className="flex-1 bg-amber-500 text-white hover:bg-amber-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Add Reminder
                  </button>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Reminders List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">
                Scheduled Reminders ({reminders.length})
              </h3>
              {reminders.some((r) => r.status === 'PENDING') && (
                <button
                  onClick={processNow}
                  disabled={processing}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {processing ? 'Processing...' : 'Send due reminders now'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-white/[0.02] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40">No reminders configured yet</p>
                <p className="text-xs text-white/25 mt-1">
                  Add reminders above to automatically email registered attendees
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`bg-white/[0.02] border rounded-xl p-4 ${
                      reminder.status === 'SENT'
                        ? 'border-emerald-500/20'
                        : reminder.status === 'FAILED'
                          ? 'border-red-500/20'
                          : reminder.status === 'CANCELLED'
                            ? 'border-white/[0.04]'
                            : 'border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white/80">
                            {dayLabel(reminder.daysBefore)}
                          </span>
                          {getStatusBadge(reminder.status)}
                        </div>
                        <p className="text-xs text-white/40">
                          Scheduled: {formatScheduledDate(reminder.scheduledFor)}
                        </p>
                        {reminder.useGenericTemplate ? (
                          <p className="text-xs text-white/30 mt-1 italic">
                            Using auto-generated template
                          </p>
                        ) : (
                          <p className="text-xs text-white/30 mt-1">
                            Subject: {reminder.emailSubject || '(no subject)'}
                          </p>
                        )}
                        {(reminder.status === 'SENT' || reminder.status === 'PARTIALLY_SENT') && (
                          <p className="text-xs text-white/40 mt-1">
                            Sent {reminder.sentCount} email(s)
                            {reminder.failedCount > 0 && (
                              <span className="text-red-400"> ({reminder.failedCount} failed)</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {reminder.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingId === reminder.id ? (
                            <button
                              onClick={() => {
                                updateReminder(reminder.id, {
                                  emailSubject: editSubject || null,
                                  emailBody: editBody || null,
                                  useGenericTemplate: !editSubject && !editBody,
                                });
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(reminder.id);
                                setEditSubject(reminder.emailSubject || '');
                                setEditBody(reminder.emailBody || '');
                              }}
                              className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit Form */}
                    {editingId === reminder.id && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Custom Subject (leave blank for auto)
                          </label>
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-blue-500/40"
                            placeholder="Auto-generated if blank"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/50 mb-1">
                            Custom Body HTML (leave blank for auto)
                          </label>
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={4}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-blue-500/40 font-mono text-xs"
                            placeholder="Auto-generated if blank"
                          />
                        </div>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-white/40 hover:text-white/60"
                        >
                          Cancel edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Process Info */}
          <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-400/80 font-medium mb-1">How reminders work</p>
            <ul className="text-xs text-white/40 space-y-1">
              <li>Reminders send at 9:00 AM ET on the scheduled day</li>
              <li>Only registered/confirmed attendees receive the email</li>
              <li>Each reminder also creates an in-app notification</li>
              <li>Use &quot;Send due reminders now&quot; to manually trigger processing</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
