export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../utils';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  return NextResponse.json({
    facebook: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN),
    instagram: !!(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.FACEBOOK_ACCESS_TOKEN),
  });
}
