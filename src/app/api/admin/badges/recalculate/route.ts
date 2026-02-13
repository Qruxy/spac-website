export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../../utils';
import { recalculateBadges } from '@/lib/badges';

/**
 * POST /api/admin/badges/recalculate
 * Retroactively evaluate all badge criteria against all users with attendance.
 * Awards any badges users qualify for but haven't earned yet.
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  try {
    const result = await recalculateBadges();

    return NextResponse.json({
      success: true,
      totalAwarded: result.totalAwarded,
      usersAffected: result.userAwards.length,
      details: result.userAwards,
    });
  } catch (error) {
    console.error('Badge recalculation error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate badges' },
      { status: 500 }
    );
  }
}
