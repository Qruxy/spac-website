/**
 * Upload a file directly to S3 via presigned URL.
 * Avoids routing binary data through Lambda (no 413 errors).
 *
 * Usage:
 *   const url = await uploadFile(file, 'page-builder', 'hero_image');
 */
export async function uploadFile(
  file: File,
  pageKey: string,
  fieldKey: string,
): Promise<string> {
  // 1. Request a presigned PUT URL from the server
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

  // 2. PUT the file directly to S3 (bypasses Lambda entirely)
  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!s3Res.ok) {
    throw new Error(`S3 upload failed: ${s3Res.status}`);
  }

  return publicUrl;
}
