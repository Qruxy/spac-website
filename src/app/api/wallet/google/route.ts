/**
 * Google Wallet Pass API Route
 *
 * Generates a "Save to Google Wallet" link for the member's pass.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  generateGoogleWalletLink,
  isGoogleWalletConfigured,
} from '@/lib/wallet/google';
import type { MemberPassData } from '@/lib/wallet/types';

export async function GET() {
  try {
    // Check configuration
    if (!isGoogleWalletConfigured()) {
      return NextResponse.json(
        { error: 'Google Wallet is not configured' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user and membership data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        membership: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const membership = user.membership;
    if (!membership || !['ACTIVE', 'SUSPENDED'].includes(membership.status)) {
      return NextResponse.json(
        { error: 'No active membership found' },
        { status: 400 }
      );
    }

    // Build member pass data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spac.org';
    const memberPassData: MemberPassData = {
      memberId: user.id,
      memberName: user.name || user.email?.split('@')[0] || 'Member',
      memberType: membership.type as 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'FREE',
      memberSince: membership.startDate || new Date(),
      expirationDate: membership.endDate || undefined,
      qrCodeUrl: `${baseUrl}/verify/${user.qrUuid}`,
      qrUuid: user.qrUuid || user.id,
      isActive: membership.status === 'ACTIVE',
    };

    // Generate Google Wallet link
    const walletLink = await generateGoogleWalletLink(memberPassData);

    return NextResponse.json({
      success: true,
      walletLink,
    });
  } catch (error) {
    console.error('Google Wallet generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet pass' },
      { status: 500 }
    );
  }
}
