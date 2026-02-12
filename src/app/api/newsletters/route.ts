/**
 * Public Newsletters API
 *
 * Returns public newsletters (ClubDocument with category="NEWSLETTER") for the archive page.
 * Supports year filter, search, and pagination.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ITEMS_PER_PAGE = 12;

// GET /api/newsletters - Get public newsletters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const search = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Build where clause
    const where: Record<string, unknown> = {
      category: 'NEWSLETTER',
      isPublic: true,
    };

    // Filter by year if provided
    if (year && year !== 'all') {
      where.year = parseInt(year, 10);
    }

    // Search by title or description if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.clubDocument.count({ where });
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    // Get newsletters with pagination
    const newsletters = await prisma.clubDocument.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        filename: true,
        mimeType: true,
        size: true,
        year: true,
        month: true,
        createdAt: true,
      },
    });

    // Get distinct years for the filter dropdown
    const yearsResult = await prisma.clubDocument.findMany({
      where: {
        category: 'NEWSLETTER',
        isPublic: true,
        year: { not: null },
      },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    const years = yearsResult
      .map((r) => r.year)
      .filter((y): y is number => y !== null);

    // Only include file URLs for authenticated members
    const session = await getSession();
    const isAuthenticated = !!session?.user;

    // Transform newsletters
    const transformedNewsletters = newsletters.map((newsletter) => ({
      id: newsletter.id,
      title: newsletter.title,
      description: newsletter.description,
      fileUrl: isAuthenticated ? newsletter.fileUrl : null,
      filename: newsletter.filename,
      mimeType: newsletter.mimeType,
      size: newsletter.size,
      year: newsletter.year,
      month: newsletter.month,
      createdAt: newsletter.createdAt.toISOString(),
      monthName: newsletter.month
        ? new Date(2000, newsletter.month - 1).toLocaleString('en-US', { month: 'long' })
        : null,
    }));

    return NextResponse.json({
      newsletters: transformedNewsletters,
      total,
      totalPages,
      currentPage: page,
      years,
    });
  } catch (error) {
    console.error('Newsletters fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}
