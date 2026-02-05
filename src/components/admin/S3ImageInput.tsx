'use client';

/**
 * S3 Image Upload Input for React Admin
 *
 * Custom image input that uploads to S3 using presigned URLs.
 */

import { useState, useCallback } from 'react';
import { useInput, useNotify, useRecordContext } from 'react-admin';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
}

interface S3ImageInputProps {
  source: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  folder?: string;
  eventId?: string;
}

export default function S3ImageInput({
  source,
  label = 'Images',
  accept = 'image/*',
  multiple = true,
  folder = 'events',
}: S3ImageInputProps) {
  const notify = useNotify();
  const record = useRecordContext();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    field: { value = [], onChange },
  } = useInput({ source });

  // Get existing images from the record's media relation
  const existingImages: UploadedImage[] = record?.media || [];
  const [images, setImages] = useState<UploadedImage[]>(existingImages);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      const uploadedImages: UploadedImage[] = [];
      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of Array.from(files)) {
        try {
          // 1. Get presigned URL
          const presignedResponse = await fetch('/api/upload/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              size: file.size,
              folder,
            }),
          });

          if (!presignedResponse.ok) {
            const error = await presignedResponse.json();
            throw new Error(error.error || 'Failed to get upload URL');
          }

          const { uploadUrl, key, publicUrl } = await presignedResponse.json();

          // 2. Upload directly to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload to S3');
          }

          // 3. Get image dimensions
          const dimensions = await getImageDimensions(file);

          // 4. Record upload in database
          const completeResponse = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
              width: dimensions.width,
              height: dimensions.height,
              eventId: record?.id,
              category: 'EVENTS',
            }),
          });

          if (!completeResponse.ok) {
            const error = await completeResponse.json();
            throw new Error(error.error || 'Failed to record upload');
          }

          const { media } = await completeResponse.json();

          uploadedImages.push({
            id: media.id,
            url: media.url || publicUrl,
            thumbnailUrl: media.thumbnailUrl,
            filename: file.name,
          });

          completedFiles++;
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
        } catch (error) {
          console.error('Upload error:', error);
          notify(`Failed to upload ${file.name}`, { type: 'error' });
        }
      }

      if (uploadedImages.length > 0) {
        const newImages = [...images, ...uploadedImages];
        setImages(newImages);
        onChange(newImages.map((img) => img.id));
        notify(`${uploadedImages.length} image(s) uploaded successfully`, {
          type: 'success',
        });
      }

      setUploading(false);
      setUploadProgress(0);

      // Reset file input
      event.target.value = '';
    },
    [folder, images, notify, onChange, record?.id]
  );

  const handleRemove = useCallback(
    async (imageId: string) => {
      try {
        // Remove from local state
        const newImages = images.filter((img) => img.id !== imageId);
        setImages(newImages);
        onChange(newImages.map((img) => img.id));

        // Optionally delete from server/S3
        // await fetch(`/api/admin/media/${imageId}`, { method: 'DELETE' });

        notify('Image removed', { type: 'info' });
      } catch (error) {
        console.error('Remove error:', error);
        notify('Failed to remove image', { type: 'error' });
      }
    },
    [images, notify, onChange]
  );

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* Upload button */}
      <Box sx={{ mb: 2 }}>
        <input
          accept={accept}
          id={`s3-image-input-${source}`}
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        <label htmlFor={`s3-image-input-${source}`}>
          <Button
            variant="outlined"
            component="span"
            disabled={uploading}
            startIcon={
              uploading ? (
                <CircularProgress size={20} />
              ) : (
                <UploadIcon />
              )
            }
          >
            {uploading
              ? `Uploading... ${uploadProgress}%`
              : 'Upload Images'}
          </Button>
        </label>
      </Box>

      {/* Image gallery */}
      {images.length > 0 ? (
        <ImageList cols={4} gap={8} sx={{ width: '100%' }}>
          {images.map((image) => (
            <ImageListItem key={image.id}>
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.filename}
                loading="lazy"
                style={{
                  objectFit: 'cover',
                  aspectRatio: '1',
                  borderRadius: '8px',
                }}
              />
              <ImageListItemBar
                position="top"
                actionIcon={
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(image.id)}
                    sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', m: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                actionPosition="right"
                sx={{ background: 'transparent' }}
              />
            </ImageListItem>
          ))}

          {/* Add more button */}
          <ImageListItem>
            <label htmlFor={`s3-image-input-${source}`}>
              <Box
                sx={{
                  aspectRatio: '1',
                  border: '2px dashed',
                  borderColor: 'grey.500',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <AddIcon sx={{ fontSize: 40, color: 'grey.500' }} />
              </Box>
            </label>
          </ImageListItem>
        </ImageList>
      ) : (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'grey.500',
            borderRadius: '8px',
            p: 4,
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          <label
            htmlFor={`s3-image-input-${source}`}
            style={{ cursor: 'inherit' }}
          >
            <UploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
            <Typography color="textSecondary">
              {uploading
                ? `Uploading... ${uploadProgress}%`
                : 'Click or drag images here to upload'}
            </Typography>
          </label>
        </Box>
      )}
    </Box>
  );
}

// Helper to get image dimensions
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
