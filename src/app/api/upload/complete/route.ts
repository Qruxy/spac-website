/**
 * Upload Completion API
 *
 * Records a completed S3 upload in the database.
 * Auto-approves media for Admins and Validated users.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPublicUrl } from '@/lib/s3';

// Zod schema for upload completion
const UploadCompleteSchema = z.object({
  key: z.string().min(1, 'S3 key is required').max(500),
  originalName: z.string().min(1, 'Original filename is required').max(255),
  mimeType: z.string().min(1, 'MIME type is required').regex(/^[\w-]+\/[\w-+.]+$/, 'Invalid MIME type format'),
  size: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: z.string().max(500).transform(val => val.trim()).optional(),
  altText: z.string().max(200).transform(val => val.trim()).optional(),
  eventId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  category: z.enum(['DEEP_SKY', 'PLANETS', 'MOON', 'SUN', 'EVENTS', 'EQUIPMENT', 'NIGHTSCAPE', 'OTHER']).optional(),
  folder: z.string().max(100).optional(),
});

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
    
    // Validate input with Zod
    const result = UploadCompleteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const {
      key,
      originalName,
      mimeType,
      size,
      width,
      height,
      caption,
      altText,
      eventId,
      listingId,
      category,
      folder,
    } = result.data;

    // Determine media type from mime type
    const type = mimeType.startsWith('video/')
      ? 'VIDEO'
      : mimeType.startsWith('image/')
        ? 'IMAGE'
        : 'DOCUMENT';

    // Check if user is trusted (Admin or Validated) for auto-approval
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isValidated: true },
    });

    const isTrustedUser = user?.role === 'ADMIN' || user?.isValidated === true;
    const mediaStatus = isTrustedUser ? 'APPROVED' : 'PENDING';

    const url = getPublicUrl(key);
    // Note: thumbnailUrl not stored - Next.js Image handles optimization

    // Create media record with correct Prisma schema field names
    const media = await prisma.media.create({
      data: {
        uploaded_by_id: session.user.id,
        type,
        status: mediaStatus, // Auto-approved for trusted users
        filename: originalName,
        mimeType,
        size,
        url,
        width,
        height,
        caption,
        alt: altText,
        eventId,
        listingId,
        category,
        folder,
      },
    });

    // Log the upload
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'CREATE',
        entityType: 'Media',
        entityId: media.id,
        newValues: {
          filename: originalName,
          mimeType,
          size,
          eventId,
          listingId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        status: media.status,
      },
    });
  } catch (error) {
    console.error('Upload completion error:', error);
    return NextResponse.json(
      { error: 'Failed to record upload' },
      { status: 500 }
    );
  }
}
