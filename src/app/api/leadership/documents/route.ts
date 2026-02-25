export const dynamic = 'force-dynamic';
/**
 * Club Documents API
 *
 * GET  - List all documents (admin/moderator)
 * POST - Create a document record after client-side S3 upload via presigned URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documents = await prisma.clubDocument.findMany({
      orderBy: [{ category: 'asc' }, { year: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Accept JSON body — file was already uploaded to S3 via presigned URL on the client
    const body = await request.json();
    const { fileUrl, filename, mimeType, size, title, description, category, year, month, isPublic } = body;

    if (!fileUrl || !title || !category || !filename) {
      return NextResponse.json(
        { error: 'fileUrl, title, category, and filename are required' },
        { status: 400 }
      );
    }

    const document = await prisma.clubDocument.create({
      data: {
        title,
        description: description || null,
        category: category as 'NEWSLETTER' | 'MEETING_MINUTES' | 'BYLAWS' | 'POLICY' | 'FORM' | 'FINANCIAL' | 'OTHER',
        fileUrl,
        filename,
        mimeType: mimeType || 'application/octet-stream',
        size: size || 0,
        year: year || null,
        month: month || null,
        isPublic: isPublic ?? false,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Failed to create document record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
