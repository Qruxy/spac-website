/**
 * Single Email Template API
 *
 * GET    - Get template by ID
 * PUT    - Update template
 * DELETE - Delete template
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/communications/templates/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/admin/communications/templates/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, subject, bodyHtml, description, category, variables, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (subject !== undefined) data.subject = subject;
    if (bodyHtml !== undefined) data.body = bodyHtml;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (variables !== undefined) data.variables = variables;
    if (isActive !== undefined) data.isActive = isActive;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/admin/communications/templates/[id]
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.emailTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template delete error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
