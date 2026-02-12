/**
 * Email Service
 *
 * Sends emails via SMTP (nodemailer). Defaults to console logging
 * when SMTP is not configured. Switch to SES/Route53 when DNS is ready.
 *
 * Environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM - sender address (default: noreply@stpeteastronomyclub.org)
 */

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

const EMAIL_FROM = process.env.EMAIL_FROM || 'SPAC <noreply@stpeteastronomyclub.org>';

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function createTransport() {
  if (SMTP_CONFIGURED) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  // No SMTP configured — emails will be rejected with a clear error
  console.warn('[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
  return null;
}

const transporter = createTransport();

/** Replace {{variable}} placeholders in a template string */
export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/** Wrap content in the SPAC HTML email layout */
function wrapInLayout(bodyHtml: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SPAC</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding-bottom: 32px; border-bottom: 1px solid #334155; }
    .header h1 { color: #60a5fa; margin: 0; font-size: 24px; }
    .content { padding: 32px 0; line-height: 1.6; }
    .content a { color: #60a5fa; }
    .footer { padding-top: 32px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #94a3b8; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; }
    ${preheader ? '.preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; }' : ''}
  </style>
</head>
<body>
  ${preheader ? `<span class="preheader">${preheader}</span>` : ''}
  <div class="container">
    <div class="header">
      <h1>St. Petersburg Astronomy Club</h1>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>St. Petersburg Astronomy Club, Inc. &bull; Est. 1927</p>
      <p>Tampa Bay&rsquo;s Home for Family Astronomy</p>
    </div>
  </div>
</body>
</html>`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Plain text fallback */
  text?: string;
  /** Wrap in SPAC branded layout (default true) */
  useLayout?: boolean;
  /** Preheader text for email clients */
  preheader?: string;
  /** Optional template ID for logging */
  templateId?: string;
  /** Optional recipient user ID for logging */
  recipientUserId?: string;
  /** Arbitrary metadata for the email log */
  metadata?: Record<string, unknown>;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; logId?: string; error?: string }> {
  const html = opts.useLayout === false ? opts.html : wrapInLayout(opts.html, opts.preheader);

  // If SMTP is not configured, fail immediately with a clear error
  if (!transporter) {
    const errorMsg = 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables on Amplify.';
    console.error('[EMAIL]', errorMsg);

    const log = await prisma.emailLog.create({
      data: {
        templateId: opts.templateId || null,
        recipientEmail: opts.to,
        recipientUserId: opts.recipientUserId || null,
        subject: opts.subject,
        body: html,
        status: 'FAILED',
        errorMessage: errorMsg,
        metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
      },
    });

    return { success: false, logId: log.id, error: errorMsg };
  }

  // Create email log record
  const log = await prisma.emailLog.create({
    data: {
      templateId: opts.templateId || null,
      recipientEmail: opts.to,
      recipientUserId: opts.recipientUserId || null,
      subject: opts.subject,
      body: html,
      status: 'SENDING',
      metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    },
  });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html,
      text: opts.text,
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EMAIL] Send failed:', message);

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', errorMessage: message },
    });

    return { success: false, logId: log.id, error: message };
  }
}

export interface BulkSendOptions {
  recipients: Array<{ email: string; userId?: string; variables?: Record<string, string> }>;
  subject: string;
  /** HTML body with optional {{variable}} placeholders */
  html: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

/** Send emails to multiple recipients with per-recipient variable substitution */
export async function sendBulkEmail(opts: BulkSendOptions): Promise<{ sent: number; failed: number; logIds: string[] }> {
  let sent = 0;
  let failed = 0;
  const logIds: string[] = [];

  for (const recipient of opts.recipients) {
    const personalizedHtml = recipient.variables
      ? renderTemplate(opts.html, recipient.variables)
      : opts.html;

    const personalizedSubject = recipient.variables
      ? renderTemplate(opts.subject, recipient.variables)
      : opts.subject;

    const result = await sendEmail({
      to: recipient.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      templateId: opts.templateId,
      recipientUserId: recipient.userId,
      metadata: opts.metadata,
    });

    if (result.success) sent++;
    else failed++;
    if (result.logId) logIds.push(result.logId);

    // Rate limiting: 100ms between sends to avoid overwhelming SMTP
    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent, failed, logIds };
}
