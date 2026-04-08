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

  // NOTE: preserveExif is intentionally omitted. browser-image-compression v2.0.2
  // has a bug where preserveExif on JPEG files resolves the promise with a
  // Promise<Blob> instead of a File (copyExifWithoutOrientation is not awaited
  // internally), which causes filename/contentType/size to be undefined on upload.
  const [rawFull, rawThumb] = await Promise.all([
    imageCompression(file, {
      maxWidthOrHeight: 2400,
      maxSizeMB: 1.5,
      initialQuality: 0.85,
      useWebWorker: true,
      fileType: 'image/jpeg',
      alwaysKeepResolution: false,
    }),
    imageCompression(file, {
      maxWidthOrHeight: 600,
      maxSizeMB: 0.2,
      initialQuality: 0.80,
      useWebWorker: true,
      fileType: 'image/jpeg',
    }),
  ]);

  // Normalise to a real File — some browser-image-compression paths return a
  // Blob (no .name / .size) rather than a File. Always wrap to be safe.
  const toFile = (blob: Blob, name: string) =>
    blob instanceof File && blob.name ? blob : new File([blob], name, { type: 'image/jpeg' });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const full  = toFile(rawFull  as unknown as Blob, `${baseName}.jpg`);
  const thumb = toFile(rawThumb as unknown as Blob, `thumb_${baseName}.jpg`);

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
