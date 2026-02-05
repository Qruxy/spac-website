/**
 * Apple Wallet Pass API Route
 *
 * Generates and downloads an Apple Wallet .pkpass file for the member.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  generateAppleWalletPass,
  isAppleWalletConfigured,
  getApplePassMimeType,
} from '@/lib/wallet/apple';
import type { MemberPassData } from '@/lib/wallet/types';

export async function GET() {
  try {
    // Check configuration
    if (!isAppleWalletConfigured()) {
      return NextResponse.json(
        { error: 'Apple Wallet is not configured' },
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

    // Generate Apple Wallet pass
    const passBuffer = await generateAppleWalletPass(memberPassData);

    // Return as downloadable file
    return new NextResponse(new Uint8Array(passBuffer), {
      headers: {
        'Content-Type': getApplePassMimeType(),
        'Content-Disposition': `attachment; filename="spac-membership-${user.id}.pkpass"`,
        'Content-Length': passBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Apple Wallet generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet pass' },
      { status: 500 }
    );
  }
}
