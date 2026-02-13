/**
 * Member Verification Page
 *
 * Verifies membership status when QR code is scanned.
 * Used by event staff to check in members.
 *
 * - Shows membership verification card for all visitors
 * - For admins/moderators: shows today's event registrations with check-in buttons
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Star,
  Users,
  GraduationCap,
} from 'lucide-react';
import { CheckInSection } from './check-in-section';

interface VerifyPageProps {
  params: Promise<{ uuid: string }>;
}

export const metadata: Metadata = {
  title: 'Verify Member',
  description: 'Verify SPAC membership status',
};

export async function generateStaticParams() {
  return [];
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { uuid } = await params;

  // Find user by QR UUID
  const user = await prisma.user.findFirst({
    where: { qrUuid: uuid },
    include: {
      membership: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isActive = user.membership?.status === 'ACTIVE';
  const membershipType = user.membership?.type || 'NONE';

  const tierIcons: Record<string, typeof Star> = {
    INDIVIDUAL: Star,
    FAMILY: Users,
    STUDENT: GraduationCap,
    LIFETIME: Star,
  };
  const TierIcon = tierIcons[membershipType as keyof typeof tierIcons] || Star;

  // Get current session (may be null for anonymous visitors)
  const session = await getSession();
  const isAdmin =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Fetch today's event registrations for this user
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const todayRegistrations = await prisma.registration.findMany({
    where: {
      userId: user.id,
      status: { in: ['CONFIRMED', 'PENDING', 'ATTENDED'] },
      event: {
        status: 'PUBLISHED',
        startDate: { lte: endOfToday },
        endDate: { gte: startOfToday },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      },
    },
    orderBy: {
      event: { startDate: 'asc' },
    },
  });

  const registrations = todayRegistrations.map((reg) => ({
    id: reg.id,
    eventTitle: reg.event.title,
    checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Status Card */}
        <div
          className={`rounded-2xl border-2 p-8 text-center ${
            isActive
              ? 'border-green-500 bg-green-500/5'
              : 'border-red-500 bg-red-500/5'
          }`}
        >
          {/* Status Icon */}
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              isActive ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          >
            {isActive ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>

          {/* Status Text */}
          <h1
            className={`text-2xl font-bold mb-2 ${
              isActive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isActive ? 'Valid Member' : 'Invalid Membership'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isActive
              ? 'This member has an active SPAC membership'
              : 'This membership is not currently active'}
          </p>

          {/* Member Details */}
          <div className="border-t border-border pt-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TierIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Membership Type</p>
                <p className="font-medium text-foreground capitalize">
                  {membershipType.toLowerCase()}
                </p>
              </div>
            </div>

            {(user.membership?.paypalCurrentPeriodEnd || user.membership?.stripeCurrentPeriodEnd) && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? 'Valid Until' : 'Expired On'}
                  </p>
                  <p className="font-medium text-foreground">
                    {new Date(user.membership.paypalCurrentPeriodEnd || user.membership.stripeCurrentPeriodEnd!).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today's Events & Check-In Section */}
        {registrations.length > 0 && (
          <CheckInSection
            uuid={uuid}
            registrations={registrations}
            isAdmin={isAdmin}
          />
        )}

        {/* SPAC Branding */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-2xl">🔭</span>
            <div>
              <p className="font-bold">SPAC</p>
              <p className="text-xs">St. Petersburg Astronomy Club</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
