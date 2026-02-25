export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../utils';
import { prisma } from '@/lib/db';
import { AUTOMATION_DEFAULTS } from '@/lib/automation-email-defaults';
import { EmailAutomationType } from '@prisma/client';

const ALL_TYPES: EmailAutomationType[] = [
  'WELCOME_REGISTRATION',
  'MEMBERSHIP_ACTIVATED',
  'EVENT_REGISTRATION',
  'OBS_REGISTRATION',
  'MEMBERSHIP_RENEWAL_REMINDER',
];

// GET: return all configs, upsert defaults for any missing
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  const configs = await Promise.all(
    ALL_TYPES.map(async (type) => {
      const def = AUTOMATION_DEFAULTS[type];
      const config = await prisma.emailAutomationConfig.upsert({
        where: { type },
        update: {},
        create: {
          type,
          enabled: true,
          subject: def.subject,
          bodyHtml: def.bodyHtml,
        },
      });
      return config;
    }),
  );

  return NextResponse.json(configs);
}

// PUT: update a single config
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  const body = await request.json() as {
    type: EmailAutomationType;
    enabled?: boolean;
    subject?: string;
    bodyHtml?: string;
  };

  if (!body.type || !ALL_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Invalid automation type' }, { status: 400 });
  }

  const data: {
    enabled?: boolean;
    subject?: string;
    bodyHtml?: string;
    updatedById?: string;
  } = { updatedById: auth.userId };

  if (body.enabled !== undefined) data.enabled = body.enabled;
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.bodyHtml !== undefined) data.bodyHtml = body.bodyHtml;

  const config = await prisma.emailAutomationConfig.upsert({
    where: { type: body.type },
    update: data,
    create: {
      type: body.type,
      enabled: body.enabled ?? true,
      subject: body.subject ?? AUTOMATION_DEFAULTS[body.type].subject,
      bodyHtml: body.bodyHtml ?? AUTOMATION_DEFAULTS[body.type].bodyHtml,
      updatedById: auth.userId,
    },
  });

  return NextResponse.json(config);
}
