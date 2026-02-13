export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../utils';
import { seedDefaultBadges } from '@/lib/badges';

// POST /api/admin/badges/seed - Seed default badges
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    await seedDefaultBadges();
    return NextResponse.json({ success: true, message: 'Default badges seeded' });
  } catch (error) {
    console.error('Badge seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed badges' },
      { status: 500 }
    );
  }
}
