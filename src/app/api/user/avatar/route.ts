export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3Bucket, getPublicUrl } from '@/lib/s3';
import {
  validateUpload,
  ALLOWED_IMAGE_TYPES,
  generateUserAvatarKey,
} from '@/lib/s3/presigned';

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

  // Update user's avatar URL in database
  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: publicUrl },
  });

  return NextResponse.json({
    uploadUrl,
    key,
    publicUrl,
  });
}
