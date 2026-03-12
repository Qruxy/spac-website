import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page');
  if (!page) return NextResponse.json({});
  const records = await prisma.siteContent.findMany({ where: { pageKey: page } });
  const map: Record<string, string> = {};
  for (const r of records) map[r.fieldKey] = r.value;
  return NextResponse.json(map);
}
