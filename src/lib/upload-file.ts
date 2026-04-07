/**
 * Upload a file directly to S3 via presigned URL.
 * Avoids routing binary data through Lambda (no 413 errors).
 * Images are automatically compressed client-side before upload.
 *
 * Usage (page builder / single image):
 *   const url = await uploadFile(file, 'page-builder', 'hero_image');
 *
 * Usage (gallery — returns full + thumbnail URL):
 *   const { url, thumbnailUrl } = await uploadImageWithThumb(file, 'gallery', 'photo');
 */

import { compressImage, compressForUpload, isCompressibleImage } from '@/lib/media/compress';

/** Internal: request a presigned PUT URL, then upload a file to S3 */
async function presignAndUpload(
  file: File,
  pageKey: string,
  fieldKey: string,
): Promise<string> {
  const presignRes = await fetch('/api/admin/page-builder/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageKey,
      fieldKey,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || 'Failed to get upload URL');
  }

  const { uploadUrl, publicUrl } = await presignRes.json() as {
    uploadUrl: string;
    publicUrl: string;
  };

  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);

  return publicUrl;
}

/**
 * Upload a single image (page builder, event covers, etc.)
 * Automatically compresses to max 2400px / 1.5 MB before upload.
 */
export async function uploadFile(
  file: File,
  pageKey: string,
  fieldKey: string,
): Promise<string> {
  // Compress images before upload (skip non-image files like PDFs)
  const toUpload = isCompressibleImage(file) ? await compressImage(file) : file;
  return presignAndUpload(toUpload, pageKey, fieldKey);
}

/**
 * Upload a gallery image — compresses full version + generates 600px thumbnail.
 * Both are uploaded to S3 concurrently.
 * Returns { url, thumbnailUrl } for DB storage.
 */
export async function uploadImageWithThumb(
  file: File,
  pageKey: string,
  fieldKey: string,
): Promise<{ url: string; thumbnailUrl: string }> {
  const { full, thumb } = await compressForUpload(file);

  // Rename thumb file so it gets a distinct S3 key
  const thumbFile = new File([thumb], `thumb_${file.name}`, { type: 'image/jpeg' });

  const [url, thumbnailUrl] = await Promise.all([
    presignAndUpload(full, pageKey, fieldKey),
    presignAndUpload(thumbFile, pageKey, `${fieldKey}_thumb`),
  ]);

  return { url, thumbnailUrl };
}
