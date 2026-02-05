/**
 * Gallery Submit Form Component
 *
 * Client component for uploading photos to the gallery.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

const categories = [
  { id: 'DEEP_SKY', label: 'Deep Sky', description: 'Nebulae, galaxies, star clusters' },
  { id: 'PLANETS', label: 'Planets', description: 'Planets and their moons' },
  { id: 'MOON', label: 'Moon', description: 'Lunar photography' },
  { id: 'SUN', label: 'Sun', description: 'Solar photography' },
  { id: 'NIGHTSCAPE', label: 'Nightscape', description: 'Milky Way, star trails, landscapes' },
  { id: 'EVENTS', label: 'Events', description: 'Club events and meetups' },
  { id: 'EQUIPMENT', label: 'Equipment', description: 'Telescopes, mounts, accessories' },
  { id: 'OTHER', label: 'Other', description: 'Other astronomy-related photos' },
] as const;

type CategoryId = typeof categories[number]['id'];

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function GallerySubmitForm() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [category, setCategory] = useState<CategoryId | ''>('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');

  const maxSize = 10; // MB
  const accept = 'image/jpeg,image/png,image/webp';

  const handleFileSelect = useCallback((file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type
    if (!accept.split(',').includes(file.type)) {
      setError(`File type ${file.type} is not allowed`);
      return;
    }

    // Set preview
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
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
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
      // Step 1: Get presigned URL
      setProgress(10);
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          folder: 'gallery',
        }),
      });

      if (!presignedRes.ok) {
        const data = await presignedRes.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = await presignedRes.json();
      setProgress(30);

      // Step 2: Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload to storage');
      }

      setProgress(70);

      // Step 3: Record upload in database with gallery metadata
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          originalName: selectedFile.name,
          mimeType: selectedFile.type,
          size: selectedFile.size,
          category,
          caption: caption.trim(),
          altText: altText.trim() || caption.trim(),
        }),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data.error || 'Failed to record upload');
      }

      setProgress(100);
      setStatus('success');

      // Redirect after success
      setTimeout(() => {
        router.push('/gallery');
        router.refresh();
      }, 2000);
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
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Photo Submitted!
        </h2>
        <p className="text-muted-foreground mb-4">
          Your photo has been submitted for review. It will appear in the gallery
          once approved by a moderator.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to gallery...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Photo Upload */}
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
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP (max {maxSize}MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleInputChange}
            />
          </label>
        ) : (
          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            {preview && (
              <div className="aspect-[16/9] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {selectedFile.name}
                  </p>
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

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Category <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                category === cat.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
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

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Caption <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g., Orion Nebula captured on a cold December night"
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={200}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {caption.length}/200 characters
        </p>
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description (optional)
        </label>
        <textarea
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe what's in the photo for accessibility..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {altText.length}/500 characters - helps with accessibility
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={status === 'uploading'}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading... {progress}%
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Submit Photo
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
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
