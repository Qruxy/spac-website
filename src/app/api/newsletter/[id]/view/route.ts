/**
 * Newsletter PDF View Endpoint
 *
 * Generates a short-lived presigned S3 URL for viewing a newsletter PDF
 * in-browser. Requires authentication (members only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPresignedDownloadUrl } from '@/lib/s3/presigned';

// Extract S3 key from a public URL (CloudFront or S3 direct)
function extractS3Key(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    // Remove leading slash from pathname
    const key = url.pathname.replace(/^\//, '');
    return key || null;
  } catch {
    // If it's already just a key (no protocol), return as-is
    if (!fileUrl.startsWith('http') && fileUrl.length > 0) return fileUrl;
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const doc = await prisma.clubDocument.findUnique({
    where: { id: params.id },
    select: { id: true, fileUrl: true, mimeType: true, isPublic: true, category: true },
  });

  if (!doc || doc.category !== 'NEWSLETTER') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!doc.fileUrl) {
    return NextResponse.json({ error: 'No file available' }, { status: 404 });
  }

  // If fileUrl is a Google Drive, Dropbox, or other external (non-S3/CF) URL, redirect directly
  if (
    doc.fileUrl.includes('drive.google.com') ||
    doc.fileUrl.includes('dropbox.com') ||
    (doc.fileUrl.startsWith('http') &&
      !doc.fileUrl.includes('amazonaws.com') &&
      !doc.fileUrl.includes('cloudfront.net'))
  ) {
    return NextResponse.redirect(doc.fileUrl);
  }

  // Extract S3 key and generate presigned URL
  const key = extractS3Key(doc.fileUrl);
  if (!key) {
    return NextResponse.redirect(doc.fileUrl);
  }

  try {
    const presignedUrl = await createPresignedDownloadUrl(key, 1800); // 30 min
    return NextResponse.redirect(presignedUrl);
  } catch (err) {
    console.error('[Newsletter view] Failed to generate presigned URL:', err);
    // Fall back to direct URL
    return NextResponse.redirect(doc.fileUrl);
  }
}
