export const dynamic = 'force-dynamic';
/**
 * Single Document API
 *
 * DELETE - Delete a document and its S3 object (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db/prisma';
import { getS3Client, getS3Bucket } from '@/lib/s3';

function extractS3Key(url: string | null): string | null {
  if (!url) return null;
  const cfDomain = process.env.CLOUDFRONT_DOMAIN;
  if (cfDomain && url.includes(cfDomain)) return url.split(`${cfDomain}/`)[1] ?? null;
  const s3Match = url.match(/amazonaws\.com\/(.+)$/);
  return s3Match?.[1] ?? null;
}

async function deleteS3Object(url: string | null): Promise<void> {
  const key = extractS3Key(url);
  if (!key) return;
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: key }));
  } catch (err) {
    console.error('[documents] S3 delete failed for key:', key, err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete documents' }, { status: 403 });
    }

    const { id } = await params;
    const document = await prisma.clubDocument.findUnique({ where: { id } });
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Delete from S3 first, then DB
    await deleteS3Object(document.fileUrl);
    await prisma.clubDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
