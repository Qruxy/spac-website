export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Bucket, getPublicUrl } from '@/lib/s3';
import {
  validateUpload,
  ALLOWED_IMAGE_TYPES,
  generateUserAvatarKey,
} from '@/lib/s3/presigned';

/**
 * POST /api/user/avatar
 *
 * Returns a presigned S3 URL for the client to upload to directly.
 * Does NOT update the DB — the client must call PATCH after a successful upload.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { filename, contentType, size } = body as {
    filename: string;
    contentType: string;
    size: number;
  };

  if (!filename || !contentType || !size) {
    return NextResponse.json(
      { error: 'Missing required fields: filename, contentType, size' },
      { status: 400 }
    );
  }

  const validation = validateUpload(contentType, size, ALLOWED_IMAGE_TYPES);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // User-scoped avatar path: users/{userId}/avatar.{ext}
  const key = generateUserAvatarKey(session.user.id, filename);

  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
  const publicUrl = getPublicUrl(key);

  // Return the presigned URL and the key for the client to use in PATCH after upload.
  // Do NOT update avatarUrl here — the file may not exist yet.
  return NextResponse.json({
    uploadUrl,
    key,
    publicUrl,
  });
}

/**
 * PATCH /api/user/avatar
 *
 * Called by the client after a successful S3 upload to confirm the file exists
 * and update the user's avatarUrl in the database.
 */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key } = body as { key?: string };

  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  // Validate the key belongs to this user (must start with users/{userId}/)
  const expectedPrefix = `users/${session.user.id}/`;
  if (!key.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  // Verify the object actually exists in S3 before updating the DB
  try {
    await getS3Client().send(
      new HeadObjectCommand({ Bucket: getS3Bucket(), Key: key })
    );
  } catch {
    return NextResponse.json(
      { error: 'File not found in storage — upload may have failed' },
      { status: 400 }
    );
  }

  const publicUrl = getPublicUrl(key);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: publicUrl },
  });

  return NextResponse.json({ avatarUrl: publicUrl });
}
