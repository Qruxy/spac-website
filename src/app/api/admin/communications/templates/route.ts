/**
 * Email Templates API
 *
 * GET  - List all templates
 * POST - Create a new template
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

// GET /api/admin/communications/templates
export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { emailLogs: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates list error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/admin/communications/templates
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) return auth.error!;

    const body = await request.json();
    const { name, subject, bodyHtml, description, category, variables } = body as {
      name: string;
      subject: string;
      bodyHtml: string;
      description?: string;
      category?: string;
      variables?: string[];
    };

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: bodyHtml,
        description,
        category: (category as 'GENERAL' | 'WELCOME' | 'MEMBERSHIP' | 'EVENT' | 'NEWSLETTER' | 'ADMIN' | 'SYSTEM') || 'GENERAL',
        variables: variables || [],
        createdById: auth.userId,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Template create error:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
