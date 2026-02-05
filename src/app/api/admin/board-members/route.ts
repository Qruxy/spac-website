/**
 * Admin Board Members API
 *
 * CRUD operations for board member management.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAdmin,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildWhereClause,
} from '../utils';

// GET /api/admin/board-members - List board members
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take } = parsePaginationParams(searchParams);
    const { field, order } = parseSortParams(searchParams);
    const filters = parseFilterParams(searchParams);

    const where = buildWhereClause(filters, ['name', 'title']);

    const [data, total] = await Promise.all([
      prisma.boardMember.findMany({
        where,
        skip,
        take,
        orderBy: { [field === 'createdAt' ? 'sortOrder' : field]: order },
      }),
      prisma.boardMember.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Admin board members list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board members' },
      { status: 500 }
    );
  }
}

// POST /api/admin/board-members - Create board member
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { name, title, email, imageUrl, bio, sortOrder, isActive } = body;

    if (!name || !title) {
      return NextResponse.json(
        { error: 'Name and title are required' },
        { status: 400 }
      );
    }

    const boardMember = await prisma.boardMember.create({
      data: {
        name,
        title,
        email: email || null,
        imageUrl: imageUrl || null,
        bio: bio || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'CREATE',
        entityType: 'BoardMember',
        entityId: boardMember.id,
        newValues: { name, title },
      },
    });

    return NextResponse.json(boardMember, { status: 201 });
  } catch (error) {
    console.error('Admin create board member error:', error);
    return NextResponse.json(
      { error: 'Failed to create board member' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/board-members - Bulk delete board members
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing ids array' },
        { status: 400 }
      );
    }

    await prisma.boardMember.deleteMany({
      where: { id: { in: ids } },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: auth.userId!,
        action: 'DELETE',
        entityType: 'BoardMember',
        entityId: ids.join(','),
      },
    });

    return NextResponse.json({ ids });
  } catch (error) {
    console.error('Admin board members bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete board members' },
      { status: 500 }
    );
  }
}
