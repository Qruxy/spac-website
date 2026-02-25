import { prisma } from './db';
import { sendEmail, renderTemplate } from './email';
import { AUTOMATION_DEFAULTS } from './automation-email-defaults';

type AutomationType =
  | 'WELCOME_REGISTRATION'
  | 'MEMBERSHIP_ACTIVATED'
  | 'EVENT_REGISTRATION'
  | 'OBS_REGISTRATION'
  | 'MEMBERSHIP_RENEWAL_REMINDER';

export async function triggerAutomationEmail(
  type: AutomationType,
  recipientEmail: string,
  variables: Record<string, string>,
  recipientUserId?: string,
): Promise<void> {
  let config = await prisma.emailAutomationConfig.findUnique({
    where: { type },
  });

  if (!config) {
    const def = AUTOMATION_DEFAULTS[type];
    if (!def) return;
    config = await prisma.emailAutomationConfig.upsert({
      where: { type },
      update: {},
      create: { type, enabled: true, subject: def.subject, bodyHtml: def.bodyHtml },
    });
  }

  if (!config.enabled) return;

  const subject = renderTemplate(config.subject, variables);
  const bodyHtml = renderTemplate(config.bodyHtml, variables);

  await sendEmail({
    to: recipientEmail,
    subject,
    html: bodyHtml,
    recipientUserId,
    metadata: { automationType: type },
  });
}
