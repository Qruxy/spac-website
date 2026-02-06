export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) + '...',
    DIRECT_URL_SET: !!process.env.DIRECT_URL,
  };

  try {
    const userCount = await prisma.user.count();
    results.userCount = userCount;
    results.userQueryOk = true;
  } catch (e: unknown) {
    results.userQueryOk = false;
    results.userError = e instanceof Error ? e.message : String(e);
    results.userStack = e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined;
  }

  try {
    const eventCount = await prisma.event.count();
    results.eventCount = eventCount;
    results.eventQueryOk = true;
  } catch (e: unknown) {
    results.eventQueryOk = false;
    results.eventError = e instanceof Error ? e.message : String(e);
    results.eventStack = e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined;
  }

  return NextResponse.json(results);
}
