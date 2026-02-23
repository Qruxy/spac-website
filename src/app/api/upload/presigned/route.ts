/**
 * Presigned URL API
 *
 * Generates presigned URLs for direct S3 uploads.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createPresignedUploadUrl,
  validateUpload,
  ALLOWED_IMAGE_TYPES,
} from '@/lib/s3/presigned';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { filename, contentType, size, folder } = body as {
      filename: string;
      contentType: string;
      size: number;
      folder?: string;
    };

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, size' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateUpload(contentType, size, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Restrict folder to an explicit allowlist — prevents writes to arbitrary S3 paths
    const ALLOWED_FOLDERS = ['uploads', 'gallery', 'events', 'equipment', 'avatars', 'media', 'vsa'];
    const uploadFolder = (folder && ALLOWED_FOLDERS.includes(folder)) ? folder : 'uploads';

    // Generate presigned URL
    const result = await createPresignedUploadUrl({
      filename,
      contentType,
      folder: uploadFolder,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
