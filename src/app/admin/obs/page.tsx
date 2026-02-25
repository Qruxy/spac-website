import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db/prisma';
import { OBSCommandCenter } from './obs-command-center';
import type { OBSConfigSerialized } from './types';

export const metadata: Metadata = {
  title: 'OBS Command Center | Admin | SPAC',
  description: 'Unified Orange Blossom Special event administration.',
};

export const dynamic = 'force-dynamic';

async function getAllConfigs() {
  return prisma.oBSConfig.findMany({
    orderBy: { year: 'desc' },
    include: {
      _count: { select: { registrations: true } },
    },
  });
}

export default async function OBSCommandCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/admin');
  }

  const configs = await getAllConfigs();

  // Serialize Decimal fields for client — cast JSON fields to typed shapes
  const serialized = configs.map((c) => ({
    ...c,
    memberPrice: c.memberPrice.toNumber(),
    nonMemberPrice: c.nonMemberPrice.toNumber(),
    earlyBirdDiscount: c.earlyBirdDiscount.toNumber(),
    campingPrice: c.campingPrice.toNumber(),
    mealPrice: c.mealPrice.toNumber(),
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    registrationOpens: c.registrationOpens.toISOString(),
    registrationCloses: c.registrationCloses.toISOString(),
    earlyBirdDeadline: c.earlyBirdDeadline?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    // Cast JSON fields — Prisma returns JsonValue; client expects typed shapes
    scheduleData: c.scheduleData as OBSConfigSerialized['scheduleData'],
    whatToBring: c.whatToBring as OBSConfigSerialized['whatToBring'],
    locationInfo: c.locationInfo as OBSConfigSerialized['locationInfo'],
    statsData: c.statsData as OBSConfigSerialized['statsData'],
  })) satisfies OBSConfigSerialized[];

  return <OBSCommandCenter initialConfigs={serialized} userRole={session.user.role} />;
}
