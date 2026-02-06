/**
 * NextAuth.js API Route Handler
 */

export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

// Ensure secret is set at request time (not build time)
const getHandler = () => {
  const options = {
    ...authOptions,
    secret: process.env.NEXTAUTH_SECRET,
  };
  return NextAuth(options);
};

export async function GET(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const handler = getHandler();
  return (handler as (req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>)(req, ctx);
}

export async function POST(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const handler = getHandler();
  return (handler as (req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>)(req, ctx);
}
