/**
 * Admin Single Media API
 *
 * Get, update, delete individual media.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';
import { deleteS3Object } from '@/lib/s3/presigned';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/media/[id] - Get single media
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Admin get media error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/media/[id] - Update media (approve/reject)
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const { status, caption, alt, category } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(caption !== undefined && { caption }),
        ...(alt !== undefined && { alt }),
        ...(category !== undefined && { category }),
      },
    });

    // Log the change
    const action = status === 'APPROVED' ? 'APPROVAL' : status === 'REJECTED' ? 'REJECTION' : 'UPDATE';
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action,
        entityType: 'Media',
        entityId: id,
        newValues: {
          status,
          filename: media.filename,
        },
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Admin update media error:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media/[id] - Delete media
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await deleteS3Object(media.url);
    } catch (s3Error) {
      console.error('Failed to delete from S3:', s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'Media',
        entityId: id,
        oldValues: {
          filename: media.filename,
          url: media.url,
        },
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Admin delete media error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
