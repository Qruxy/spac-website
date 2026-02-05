/**
 * Multi Image Upload Component
 *
 * Handles multiple image uploads for listings and galleries.
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface UploadedImage {
  id?: string;
  url: string;
  key: string;
  name: string;
}

interface MultiImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  folder?: string;
  maxSize?: number; // MB
  eventId?: string;
  listingId?: string;
  className?: string;
}

export function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  folder = 'uploads',
  maxSize = 10,
  eventId,
  listingId,
  className = '',
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setUploading((prev) => [...prev, tempId]);

      try {
        // Get presigned URL
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

        // Upload to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload to storage');
        }

        // Record in database
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

        return {
          id: media.id,
          url: publicUrl,
          key,
          name: file.name,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setErrors((prev) => ({ ...prev, [tempId]: errorMsg }));
        return null;
      } finally {
        setUploading((prev) => prev.filter((id) => id !== tempId));
      }
    },
    [folder, eventId, listingId]
  );

  const handleFilesSelect = useCallback(
    async (files: FileList) => {
      const validFiles: File[] = [];

      // Validate files
      for (const file of Array.from(files)) {
        if (images.length + validFiles.length >= maxImages) break;

        if (file.size > maxSize * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            [file.name]: `File exceeds ${maxSize}MB limit`,
          }));
          continue;
        }

        if (!file.type.startsWith('image/')) {
          setErrors((prev) => ({
            ...prev,
            [file.name]: 'File must be an image',
          }));
          continue;
        }

        validFiles.push(file);
      }

      // Upload all valid files
      const results = await Promise.all(validFiles.map(uploadFile));
      const successful = results.filter(Boolean) as UploadedImage[];

      if (successful.length > 0) {
        onImagesChange([...images, ...successful]);
      }
    },
    [images, maxImages, maxSize, uploadFile, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFilesSelect(e.dataTransfer.files);
    },
    [handleFilesSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFilesSelect(e.target.files);
      }
    },
    [handleFilesSelect]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className={className}>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Existing Images */}
        {images.map((image, index) => (
          <div
            key={image.key || index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Uploading Placeholders */}
        {uploading.map((id) => (
          <div
            key={id}
            className="aspect-square rounded-lg bg-muted flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ))}

        {/* Upload Button */}
        {canAddMore && uploading.length === 0 && (
          <label
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-colors cursor-pointer flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">Add Image</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleInputChange}
            />
          </label>
        )}
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 space-y-1">
          {Object.entries(errors).map(([key, error]) => (
            <p key={key} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Count */}
      <p className="mt-2 text-xs text-muted-foreground">
        {images.length} of {maxImages} images
      </p>
    </div>
  );
}
