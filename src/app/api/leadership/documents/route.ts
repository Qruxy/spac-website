/**
 * Club Documents API
 * 
 * GET - List all documents
 * POST - Upload new document
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const year = parseInt(formData.get('year') as string) || null;
    const month = parseInt(formData.get('month') as string) || null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file || !title || !category) {
      return NextResponse.json({ error: 'File, title, and category are required' }, { status: 400 });
    }

    // In production, upload to S3
    // For now, create a mock URL
    const fileUrl = `/documents/${Date.now()}-${file.name}`;
    
    // TODO: Implement actual file upload to S3
    // const { url } = await uploadToS3(file, 'documents');

    const document = await prisma.clubDocument.create({
      data: {
        title,
        description: description || null,
        category: category as 'NEWSLETTER' | 'MEETING_MINUTES' | 'BYLAWS' | 'POLICY' | 'FORM' | 'FINANCIAL' | 'OTHER',
        fileUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        year,
        month,
        isPublic,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
