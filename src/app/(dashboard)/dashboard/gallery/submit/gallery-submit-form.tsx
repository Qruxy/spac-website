/**
 * Gallery Submit Form Component
 *
 * Client component for uploading photos to the gallery.
 * Supports event tagging to link photos to a specific event album.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  CalendarDays,
  Telescope,
} from 'lucide-react';

// ─── Category definitions ─────────────────────────────────────────────────────

const ASTRO_CATEGORIES = [
  { id: 'DEEP_SKY', label: 'Deep Sky', description: 'Nebulae, galaxies, star clusters' },
  { id: 'PLANETS', label: 'Planets', description: 'Planets and their moons' },
  { id: 'MOON', label: 'Moon', description: 'Lunar photography' },
  { id: 'SUN', label: 'Sun', description: 'Solar photography' },
  { id: 'NIGHTSCAPE', label: 'Nightscape', description: 'Milky Way, star trails, landscapes' },
] as const;

const COMMUNITY_CATEGORIES = [
  { id: 'EVENTS', label: 'Event/Meeting', description: 'Club events, meetings, star parties' },
  { id: 'EQUIPMENT', label: 'Equipment', description: 'Telescopes, mounts, accessories' },
  { id: 'OTHER', label: 'Other', description: 'Other astronomy-related photos' },
] as const;

const ALL_CATEGORIES = [...ASTRO_CATEGORIES, ...COMMUNITY_CATEGORIES];
type CategoryId = (typeof ALL_CATEGORIES)[number]['id'];

const ASTRO_ID_LIST = ASTRO_CATEGORIES.map((c) => c.id) as string[];

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface Event {
  id: string;
  title: string;
  startDate: string;
  type: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GallerySubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form fields
  const [category, setCategory] = useState<CategoryId | ''>('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    searchParams.get('eventId') ?? ''
  );

  // Events list for the event-tag picker
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const isAstro = !!category && ASTRO_ID_LIST.includes(category);

  const maxSize = 50; // MB
  const accept = 'image/jpeg,image/png,image/webp';

  // Fetch events on mount (past + upcoming)
  useEffect(() => {
    setEventsLoading(true);
    fetch('/api/events')
      .then((r) => r.json())
      .then((data: Event[] | { error?: string }) => {
        if (Array.isArray(data)) {
          // Sort most recent first so it's easier to find the right event
          const sorted = [...data].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          setEvents(sorted);
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }
    if (!accept.split(',').includes(file.type)) {
      setError(`File type ${file.type} is not allowed`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a photo to upload');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!caption.trim()) {
      setError('Please add a caption for your photo');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Step 1: Compress image + generate thumbnail client-side (free, no server cost)
      setProgress(5);
      const { compressForUpload, isCompressibleImage } = await import('@/lib/media/compress');

      let fullFile = selectedFile;
      let thumbFile: File | null = null;

      if (isCompressibleImage(selectedFile)) {
        const { full, thumb } = await compressForUpload(selectedFile);
        fullFile = full;
        thumbFile = new File([thumb], `thumb_${selectedFile.name}`, { type: 'image/jpeg' });
      }
      setProgress(20);

      // Step 2: Get presigned URLs for full + thumbnail concurrently
      const getPresigned = async (file: File) => {
        const res = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            folder: 'gallery',
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(d.error || 'Failed to get upload URL');
        }
        return res.json() as Promise<{ uploadUrl: string; key: string; publicUrl: string }>;
      };

      const [fullPresign, thumbPresign] = await Promise.all([
        getPresigned(fullFile),
        thumbFile ? getPresigned(thumbFile) : Promise.resolve(null),
      ]);
      setProgress(35);

      // Step 3: Upload full + thumbnail to S3 concurrently
      const s3Put = async (url: string, file: File) => {
        const res = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!res.ok) throw new Error('Failed to upload to storage');
      };

      await Promise.all([
        s3Put(fullPresign.uploadUrl, fullFile),
        thumbPresign ? s3Put(thumbPresign.uploadUrl, thumbFile!) : Promise.resolve(),
      ]);
      setProgress(75);

      // Step 4: Record in DB
      const altTextRaw = [
        description.trim(),
        equipment.trim() ? `Equipment: ${equipment.trim()}` : '',
      ].filter(Boolean).join(' | ') || caption.trim();
      const altText = altTextRaw.slice(0, 200);

      const body: Record<string, unknown> = {
        key: fullPresign.key,
        originalName: selectedFile.name,
        mimeType: fullFile.type,
        size: fullFile.size,
        category,
        caption: caption.trim(),
        altText,
        folder: 'gallery',
      };

      if (selectedEventId) body.eventId = selectedEventId;
      if (thumbPresign) body.thumbnailKey = thumbPresign.key;

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || 'Failed to record upload');
      }

      const completeData = await completeRes.json();
      const mediaId = completeData?.media?.id ?? null;
      setUploadedMediaId(mediaId);
      setProgress(100);
      setStatus('success');

      setTimeout(() => {
        router.push(mediaId ? `/gallery/${mediaId}` : '/gallery');
        router.refresh();
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Photo Submitted!</h2>
        <p className="text-muted-foreground mb-4">
          Your photo has been added to the gallery.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to your photo…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* ── Photo Upload ── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Photo <span className="text-destructive">*</span>
        </label>

        {!selectedFile ? (
          <label
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP (max {maxSize}MB)</p>
            </div>
            <input type="file" className="hidden" accept={accept} onChange={handleInputChange} />
          </label>
        ) : (
          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            {preview && (
              <div className="aspect-[16/9] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Category ── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Category <span className="text-destructive">*</span>
        </label>

        {/* Astrophotography */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Telescope className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Astrophotography</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ASTRO_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  category === cat.id
                    ? 'border-cyan-400/60 bg-cyan-400/5'
                    : 'border-border hover:border-cyan-400/30'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={category === cat.id}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Community */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Community</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  category === cat.id
                    ? 'border-emerald-400/60 bg-emerald-400/5'
                    : 'border-border hover:border-emerald-400/30'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={category === cat.id}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Caption ── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Caption / Title <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={
            isAstro
              ? 'e.g., Orion Nebula — December 2024'
              : 'e.g., Star party setup at SPAC dark site'
          }
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={200}
        />
        <p className="mt-1 text-xs text-muted-foreground">{caption.length}/200 characters</p>
      </div>

      {/* ── Description ── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what&apos;s in the photo, imaging details, or the moment captured…"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground">{description.length}/500 characters</p>
      </div>

      {/* ── Equipment (astrophotography only) ── */}
      {isAstro && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Equipment (optional)
          </label>
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="e.g., Celestron C11, ZWO ASI294MC, 120 min total exposure"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            maxLength={200}
          />
        </div>
      )}

      {/* ── Event Tag ── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-400" />
            Tag to an Event (optional)
          </span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Tag this photo to a SPAC event to include it in that event&apos;s album. Perfect for
          photos taken at star parties, meetings, or outreach events.
        </p>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          disabled={eventsLoading}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        >
          <option value="">— No event —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
            </option>
          ))}
        </select>
        {eventsLoading && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading events…
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === 'uploading'}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {progress < 20 ? 'Optimizing…' : progress < 75 ? `Uploading… ${progress}%` : 'Saving…'}
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Submit Photo
            </>
          )}
        </button>
      </div>

      {status === 'uploading' && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </form>
  );
}
