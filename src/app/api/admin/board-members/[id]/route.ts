export function generateStaticParams() { return []; }
/**
 * Admin Single Board Member API
 *
 * Get, update, delete individual board member.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '../../utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/board-members/[id] - Get single board member
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const boardMember = await prisma.boardMember.findUnique({
      where: { id },
    });

    if (!boardMember) {
      return NextResponse.json(
        { error: 'Board member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(boardMember);
  } catch (error) {
    console.error('Admin get board member error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board member' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/board-members/[id] - Update board member
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const { name, title, email, imageUrl, bio, sortOrder, isActive } = body;

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

    // Log the change
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'UPDATE',
        entityType: 'BoardMember',
        entityId: id,
        newValues: {
          updatedFields: Object.keys(body),
        },
      },
    });

    return NextResponse.json(boardMember);
  } catch (error) {
    console.error('Admin update board member error:', error);
    return NextResponse.json(
      { error: 'Failed to update board member' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/board-members/[id] - Delete board member
export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { id } = await params;

    const boardMember = await prisma.boardMember.delete({
      where: { id },
    });

    // Log the deletion
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
    return NextResponse.json(
      { error: 'Failed to delete board member' },
      { status: 500 }
    );
  }
}