import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Bucket, getPublicUrl } from '@/lib/s3';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_ATTACH_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * POST /api/admin/page-builder/upload
 *
 * Accepts JSON: { pageKey, fieldKey, filename, contentType, size }
 * Returns:      { uploadUrl, publicUrl }
 *
 * The client then PUT-s the file directly to S3 using `uploadUrl` (presigned, 5-min TTL).
 * This avoids routing the binary payload through Lambda (avoids 413 / 6 MB limit).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    pageKey?: string;
    fieldKey?: string;
    filename?: string;
    contentType?: string;
    size?: number;
  };

  const { pageKey = 'page-builder', fieldKey = 'upload', filename, contentType, size } = body;

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
  }

  const isAttachment = pageKey === 'email-attachments';
  const allowed = isAttachment ? ALLOWED_ATTACH_TYPES : ALLOWED_IMAGE_TYPES;
  const maxSize = isAttachment ? 15 * 1024 * 1024 : 20 * 1024 * 1024;

  if (!allowed.includes(contentType)) {
    return NextResponse.json({
      error: isAttachment
        ? 'File type not allowed. Use PDF, JPG, PNG, or DOCX.'
        : 'File type not allowed. Use JPG, PNG, WEBP, or GIF.',
    }, { status: 400 });
  }
  if (size && size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB.` }, { status: 400 });
  }

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `page-builder/${pageKey}/${fieldKey}/${Date.now()}-${safe}`;

  const s3 = getS3Client();
  const bucket = getS3Bucket();

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }, // 5 minutes
  );

  return NextResponse.json({ uploadUrl, publicUrl: getPublicUrl(key) });
}
