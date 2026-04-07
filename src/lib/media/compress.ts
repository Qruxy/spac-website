/**
 * Client-side image compression and thumbnail generation.
 *
 * Uses browser-image-compression (Canvas API under the hood).
 * Zero server cost — runs entirely in the browser before upload.
 *
 * Typical results:
 *   8MB phone photo → ~700KB compressed full (2400px)
 *   8MB phone photo → ~60KB thumbnail (600px)
 */

export interface CompressResult {
  /** Compressed full-size file (max 2400px, ≤1.5 MB, JPEG) */
  full: File;
  /** Compressed thumbnail (max 600px, ≤200 KB, JPEG) */
  thumb: File;
}

/**
 * Compress an image for upload.
 * Returns both a compressed full version and a small thumbnail.
 * Safe to call only in browser context (client components / event handlers).
 */
export async function compressForUpload(file: File): Promise<CompressResult> {
  // Dynamically import to avoid SSR issues (canvas is browser-only)
  const imageCompression = (await import('browser-image-compression')).default;

  const [full, thumb] = await Promise.all([
    imageCompression(file, {
      maxWidthOrHeight: 2400,
      maxSizeMB: 1.5,
      initialQuality: 0.85,
      useWebWorker: true,
      fileType: 'image/jpeg',
      alwaysKeepResolution: false,
      preserveExif: true, // keep EXIF for astronomy metadata
    }),
    imageCompression(file, {
      maxWidthOrHeight: 600,
      maxSizeMB: 0.2,
      initialQuality: 0.80,
      useWebWorker: true,
      fileType: 'image/jpeg',
    }),
  ]);

  return { full, thumb };
}

/**
 * Compress a single image without generating a thumbnail.
 * Use for non-gallery images (event covers, page builder, etc.)
 */
export async function compressImage(
  file: File,
  opts: { maxPx?: number; maxMB?: number; quality?: number } = {}
): Promise<File> {
  const imageCompression = (await import('browser-image-compression')).default;
  return imageCompression(file, {
    maxWidthOrHeight: opts.maxPx ?? 2400,
    maxSizeMB: opts.maxMB ?? 1.5,
    initialQuality: opts.quality ?? 0.85,
    useWebWorker: true,
    fileType: 'image/jpeg',
    alwaysKeepResolution: false,
  });
}

/** Returns true if the file is an image (safe to compress) */
export function isCompressibleImage(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    && !file.name.toLowerCase().endsWith('.gif'); // skip animated GIFs
}
