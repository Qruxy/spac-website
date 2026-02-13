/**
 * Digital Membership Card Page
 *
 * Displays a digital membership card with 3D lanyard that flips to show QR code.
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Star, Users, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { WalletButtons } from './wallet-buttons';
import { MembershipLanyard } from './membership-lanyard';

export const metadata: Metadata = {
  title: 'Membership Card',
  description: 'Your digital SPAC membership card',
};

export default async function MembershipCardPage() {
  const session = await getSession();
  const user = session!.user;

  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
  });

  const isActive = membership?.status === 'ACTIVE';
  const memberSince = membership?.startDate
    ? new Date(membership.startDate)
    : new Date();

  const tierIcons: Record<string, typeof Star> = {
    INDIVIDUAL: Star,
    FAMILY: Users,
    STUDENT: GraduationCap,
    LIFETIME: Star,
  };
  const membershipType = membership?.type || 'NONE';
  const TierIcon = tierIcons[membershipType as keyof typeof tierIcons] || Star;

  // QR code verification URL
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://spac.org'}/verify/${user.qrUuid}`;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
        Membership Card
      </h1>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            isActive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Active Member
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              Inactive Membership
            </>
          )}
        </div>
      </div>

      {/* Member Info */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <TierIcon className="h-4 w-4" />
          <span className="capitalize">{membershipType.toLowerCase()} Member</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Since {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 3D Lanyard with Flip to QR Code */}
      <div className="mb-6">
        <p className="text-center text-sm text-muted-foreground mb-3">
          Your QR code is ready! Click below to view your interactive 3D card.
        </p>
        <MembershipLanyard
          verificationUrl={verificationUrl}
          memberName={user.name || 'Member'}
          memberId={user.qrUuid?.slice(0, 8)}
        />
      </div>

      {/* Wallet Buttons - directly under lanyard */}
      <div className="mb-8">
        <WalletButtons />
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-3">How to use</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
              1
            </span>
            Your QR code is shown by default — ready for scanning
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
              2
            </span>
            Present the QR code at SPAC events for quick check-in
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
              3
            </span>
            Add to your digital wallet for easy access anytime
          </li>
        </ul>
      </div>
    </div>
  );
}
