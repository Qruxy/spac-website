import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test DB connection
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = 'connected';
  } catch (error: unknown) {
    const err = error as Error;
    checks.database = `error: ${err.message}`;
  }

  // Test events query (same as events API)
  try {
    const { prisma } = await import('@/lib/db');
    const count = await prisma.event.count();
    checks.events = `${count} events`;
  } catch (error: unknown) {
    const err = error as Error;
    checks.events = `error: ${err.message}`;
  }

  // Test NextAuth config
  try {
    const { authOptions } = await import('@/lib/auth/auth.config');
    checks.auth = {
      providers: authOptions.providers.map(p => p.name),
      secret: authOptions.secret ? 'SET' : 'NOT SET',
      sessionStrategy: authOptions.session?.strategy,
    };
  } catch (error: unknown) {
    const err = error as Error;
    checks.auth = `error: ${err.message}`;
  }

  return NextResponse.json(checks);
}
