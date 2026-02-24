export const dynamic = 'force-dynamic';
/**
 * Admin Single Board Member API
 *
 * Get, update, delete individual board member.
 * S3 cleanup: old images are deleted from S3 when replaced or when the member is deleted.
 */

import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db';
import { getS3Client, getS3Bucket } from '@/lib/s3';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Extract S3 key from a CloudFront or S3 public URL, or null if not an S3 URL. */
function extractS3Key(url: string | null): string | null {
  if (!url) return null;
  const cfDomain = process.env.CLOUDFRONT_DOMAIN;
  if (cfDomain && url.includes(cfDomain)) {
    return url.split(`${cfDomain}/`)[1] ?? null;
  }
  // Direct S3 URL fallback
  const s3Match = url.match(/amazonaws\.com\/(.+)$/);
  return s3Match?.[1] ?? null;
}

async function deleteS3Image(url: string | null): Promise<void> {
  const key = extractS3Key(url);
  if (!key) return;
  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: key })
    );
  } catch (err) {
    console.error('[board-members] S3 delete failed for key:', key, err);
  }
}

// GET /api/admin/board-members/[id]
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const boardMember = await prisma.boardMember.findUnique({ where: { id } });

    if (!boardMember) {
      return NextResponse.json({ error: 'Board member not found' }, { status: 404 });
    }

    return NextResponse.json(boardMember);
  } catch (error) {
    console.error('Admin get board member error:', error);
    return NextResponse.json({ error: 'Failed to fetch board member' }, { status: 500 });
  }
}

// PUT /api/admin/board-members/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, title, email, imageUrl, bio, sortOrder, isActive } = body;

    // If imageUrl changed and old one was an S3 upload, delete the old image
    if (imageUrl !== undefined) {
      const existing = await prisma.boardMember.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
        await deleteS3Image(existing.imageUrl);
      }
    }

    const boardMember = await prisma.boardMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(email !== undefined && { email }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(bio !== undefined && { bio }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'BoardMember',
        entityId: id,
        newValues: { updatedFields: Object.keys(body) },
      },
    });

    return NextResponse.json(boardMember);
  } catch (error) {
    console.error('Admin update board member error:', error);
    return NextResponse.json({ error: 'Failed to update board member' }, { status: 500 });
  }
}

// DELETE /api/admin/board-members/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const boardMember = await prisma.boardMember.delete({ where: { id } });

    // Clean up S3 image if it was an upload (not an external URL)
    await deleteS3Image(boardMember.imageUrl);

    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'BoardMember',
        entityId: id,
      },
    });

    return NextResponse.json(boardMember);
  } catch (error) {
    console.error('Admin delete board member error:', error);
    return NextResponse.json({ error: 'Failed to delete board member' }, { status: 500 });
  }
}
