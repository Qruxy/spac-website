/**
 * Image Uploader Component
 *
 * Handles direct S3 uploads via presigned URLs for listing photos.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { ImageIcon, Upload, X, Loader2, AlertCircle } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  folder?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: 'uploading' | 'registering' | 'done' | 'error';
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  folder = 'classifieds',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadedImage | null> => {
    // Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`${file.name}: Only JPEG, PNG, GIF, and WebP images are allowed`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error(`${file.name}: File size exceeds 10MB limit`);
    }

    // Step 1: Get presigned URL
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

    const { uploadUrl, key } = await presignedRes.json();

    // Step 2: Upload directly to S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload to storage');
    }

    // Step 3: Register the upload
    const completeRes = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        folder,
      }),
    });

    if (!completeRes.ok) {
      const data = await completeRes.json();
      throw new Error(data.error || 'Failed to register upload');
    }

    const { media } = await completeRes.json();
    return {
      id: media.id,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
    };
  }, [folder]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) return;

    const filesToUpload = fileArray.slice(0, remainingSlots);

    // Create upload entries with previews
    const newUploading: UploadingFile[] = filesToUpload.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      progress: 'uploading' as const,
    }));

    setUploading((prev) => [...prev, ...newUploading]);

    // Upload files in parallel
    const results = await Promise.allSettled(
      newUploading.map(async (entry) => {
        try {
          setUploading((prev) =>
            prev.map((u) => (u.id === entry.id ? { ...u, progress: 'uploading' as const } : u))
          );

          const result = await uploadFile(entry.file);

          setUploading((prev) =>
            prev.map((u) => (u.id === entry.id ? { ...u, progress: 'done' as const } : u))
          );

          return result;
        } catch (err) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === entry.id
                ? { ...u, progress: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' }
                : u
            )
          );
          return null;
        }
      })
    );

    // Collect successful uploads
    const newImages: UploadedImage[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        newImages.push(result.value);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    // Clean up completed uploads after a brief delay
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.progress === 'uploading' || u.progress === 'registering'));
      // Revoke object URLs
      for (const entry of newUploading) {
        URL.revokeObjectURL(entry.preview);
      }
    }, 1500);
  }, [images, maxImages, onImagesChange, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleRemove = (imageId: string) => {
    onImagesChange(images.filter((img) => img.id !== imageId));
  };

  const handleRemoveUploading = (uploadId: string) => {
    setUploading((prev) => {
      const entry = prev.find((u) => u.id === uploadId);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((u) => u.id !== uploadId);
    });
  };

  const canUpload = images.length + uploading.filter((u) => u.progress !== 'error').length < maxImages;

  return (
    <div className="space-y-4">
      {/* Uploaded images grid */}
      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl || image.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {/* Uploading previews */}
          {uploading.map((entry) => (
            <div key={entry.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt="Uploading"
                className={`w-full h-full object-cover rounded-lg border ${
                  entry.progress === 'error' ? 'border-destructive opacity-50' : 'border-border opacity-60'
                }`}
              />
              {entry.progress === 'uploading' || entry.progress === 'registering' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : entry.progress === 'error' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg p-1">
                  <AlertCircle className="h-5 w-5 text-destructive mb-1" />
                  <p className="text-[10px] text-white text-center line-clamp-2">{entry.error}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveUploading(entry.id)}
                    className="mt-1 text-[10px] text-white underline"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <span className="text-white text-xs font-medium">Done</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          {dragOver ? (
            <>
              <Upload className="h-10 w-10 mx-auto text-primary mb-2" />
              <p className="text-sm text-primary font-medium">Drop photos here</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-medium">
                Click or drag photos here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, GIF, WebP up to 10MB each ({images.length}/{maxImages} photos)
              </p>
            </>
          )}
        </div>
      )}

      {!canUpload && images.length >= maxImages && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum of {maxImages} photos reached
        </p>
      )}
    </div>
  );
}
