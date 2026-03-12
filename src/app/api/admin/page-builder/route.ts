import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const records = await prisma.siteContent.findMany();
  const map: Record<string, Record<string, string>> = {};
  for (const r of records) {
    if (!map[r.pageKey]) map[r.pageKey] = {};
    map[r.pageKey][r.fieldKey] = r.value;
  }
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageKey, fieldKey, value } = await req.json();
  if (!pageKey || !fieldKey || value === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const record = await prisma.siteContent.upsert({
    where: { pageKey_fieldKey: { pageKey, fieldKey } },
    update: { value },
    create: { pageKey, fieldKey, value },
  });
  return NextResponse.json(record);
}
