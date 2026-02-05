/**
 * Image Upload Component
 *
 * Handles direct S3 uploads with presigned URLs.
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadedImage {
  id?: string;
  url: string;
  key: string;
  name: string;
}

interface ImageUploadProps {
  onUploadComplete?: (image: UploadedImage) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  maxSize?: number; // MB
  accept?: string;
  className?: string;
  eventId?: string;
  listingId?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  folder = 'uploads',
  maxSize = 10,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  className = '',
  eventId,
  listingId,
}: ImageUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        const err = `File size exceeds ${maxSize}MB limit`;
        setError(err);
        setStatus('error');
        onUploadError?.(err);
        return;
      }

      // Validate file type
      if (!accept.split(',').includes(file.type)) {
        const err = `File type ${file.type} is not allowed`;
        setError(err);
        setStatus('error');
        onUploadError?.(err);
        return;
      }

      // Set preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

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
            filename: file.name,
            contentType: file.type,
            size: file.size,
            folder,
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
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload to storage');
        }

        setProgress(70);

        // Step 3: Record upload in database
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            eventId,
            listingId,
          }),
        });

        if (!completeRes.ok) {
          const data = await completeRes.json();
          throw new Error(data.error || 'Failed to record upload');
        }

        const { media } = await completeRes.json();
        setProgress(100);
        setStatus('success');

        onUploadComplete?.({
          id: media.id,
          url: publicUrl,
          key,
          name: file.name,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        setStatus('error');
        onUploadError?.(errorMsg);
      }
    },
    [folder, maxSize, accept, eventId, listingId, onUploadComplete, onUploadError]
  );

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

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setPreview(null);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Upload Area */}
      {status === 'idle' && (
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF or WebP (max {maxSize}MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
          />
        </label>
      )}

      {/* Uploading State */}
      {status === 'uploading' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl border-primary/50 bg-primary/5">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg mb-3 opacity-50"
            />
          )}
          <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Uploading... {progress}%
          </p>
          <div className="w-48 h-2 mt-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 rounded-xl border-green-500/50 bg-green-500/5">
          {preview && (
            <img
              src={preview}
              alt="Uploaded"
              className="w-20 h-20 object-cover rounded-lg mb-3"
            />
          )}
          <CheckCircle2 className="w-8 h-8 mb-2 text-green-500" />
          <p className="text-sm text-green-500">Upload successful!</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Upload another
          </button>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 rounded-xl border-red-500/50 bg-red-500/5">
          <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
