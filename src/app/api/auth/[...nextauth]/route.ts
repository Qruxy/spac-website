/**
 * NextAuth.js API Route Handler
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

let handler: ReturnType<typeof NextAuth>;
try {
  handler = NextAuth(authOptions);
} catch (e: unknown) {
  const err = e as Error;
  console.error('[NextAuth init error]', err);
  const errHandler = () => NextResponse.json({ initError: err.message, stack: err.stack?.split('\n').slice(0, 5) }, { status: 500 });
  handler = errHandler as unknown as ReturnType<typeof NextAuth>;
}

async function wrappedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  try {
    return await (handler as (req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>)(req, ctx);
  } catch (e: unknown) {
    const err = e as Error;
    console.error('[NextAuth runtime error]', err);
    return NextResponse.json({
      runtimeError: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
