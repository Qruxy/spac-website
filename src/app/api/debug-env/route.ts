export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  // Read every auth-related env var
  const envSnapshot: Record<string, string | undefined> = {};
  const keys = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'NODE_ENV',
  ];

  for (const key of keys) {
    const val = process.env[key];
    envSnapshot[key] = val ? `${val.substring(0, 10)}... (len=${val.length})` : 'UNDEFINED';
  }

  // Count total env vars
  envSnapshot._totalEnvVars = String(Object.keys(process.env).length);

  // Check if NEXTAUTH_SECRET is in process.env keys
  envSnapshot._hasNextAuthSecretKey = String(Object.keys(process.env).includes('NEXTAUTH_SECRET'));

  // Try importing NextAuth and authOptions
  let authTest: string;
  try {
    const mod = await import('@/lib/auth/auth.config');
    authTest = `secret=${mod.authOptions.secret ? 'truthy' : 'falsy'}, providers=${mod.authOptions.providers.length}`;
  } catch (e: unknown) {
    authTest = `import error: ${(e as Error).message}`;
  }

  return NextResponse.json({
    env: envSnapshot,
    authTest,
    timestamp: new Date().toISOString(),
  });
}
