/**
 * Wallet Status API Route
 *
 * Returns which wallet services are configured and available.
 */

import { NextResponse } from 'next/server';
import { isAppleWalletConfigured } from '@/lib/wallet/apple';
import { isGoogleWalletConfigured } from '@/lib/wallet/google';

export async function GET() {
  return NextResponse.json({
    apple: isAppleWalletConfigured(),
    google: isGoogleWalletConfigured(),
  });
}
