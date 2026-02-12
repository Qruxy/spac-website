/**
 * Email Service
 *
 * Sends emails via Amazon SES (AWS native). Falls back to SMTP via nodemailer
 * if SES credentials are unavailable but SMTP is configured.
 *
 * Priority: SES > SMTP > Error
 *
 * Environment variables:
 *   SES: SES_REGION (default: us-east-1), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 *   SMTP: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM - sender address (must be SES-verified)
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '@/lib/db';

const SES_REGION = process.env.SES_REGION || process.env.S3_REGION || 'us-east-1';
const EMAIL_FROM = process.env.EMAIL_FROM || 'SPAC <noreply@stpeteastro.org>';

// Resolve credentials — Amplify reserves AWS_* prefix, so we use S3_* fallbacks
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

type EmailProvider = 'ses' | 'smtp' | 'none';

let sesClient: SESClient | null = null;
let smtpTransporter: Transporter | null = null;
let activeProvider: EmailProvider = 'none';

if (accessKeyId && secretAccessKey) {
  sesClient = new SESClient({
    region: SES_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
  activeProvider = 'ses';
  console.log(`[EMAIL] Using Amazon SES (${SES_REGION})`);
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  activeProvider = 'smtp';
  console.log('[EMAIL] Using SMTP transport');
} else {
  console.warn('[EMAIL] No email provider configured. Set AWS credentials for SES or SMTP_* vars.');
}

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

/** Strip HTML tags for plain text fallback */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&bull;/g, '•')
    .replace(/&rsquo;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Send a single email via SES */
async function sendViaSES(to: string, subject: string, html: string, text?: string): Promise<void> {
  if (!sesClient) throw new Error('SES client not initialized');

  // Parse "Name <email>" format for From
  const fromMatch = EMAIL_FROM.match(/^(.+?)\s*<(.+?)>$/);
  const sourceEmail = fromMatch ? EMAIL_FROM : `<${EMAIL_FROM}>`;

  const command = new SendEmailCommand({
    Source: sourceEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: text || htmlToPlainText(html), Charset: 'UTF-8' },
      },
    },
  });

  await sesClient.send(command);
}

/** Send a single email via SMTP */
async function sendViaSMTP(to: string, subject: string, html: string, text?: string): Promise<void> {
  if (!smtpTransporter) throw new Error('SMTP transporter not initialized');

  await smtpTransporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: text || htmlToPlainText(html),
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  useLayout?: boolean;
  preheader?: string;
  templateId?: string;
  recipientUserId?: string;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; logId?: string; error?: string }> {
  const html = opts.useLayout === false ? opts.html : wrapInLayout(opts.html, opts.preheader);

  if (activeProvider === 'none') {
    const errorMsg = 'No email provider configured. Set AWS credentials for SES or SMTP_* environment variables.';
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
    if (activeProvider === 'ses') {
      await sendViaSES(opts.to, opts.subject, html, opts.text);
    } else {
      await sendViaSMTP(opts.to, opts.subject, html, opts.text);
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return { success: true, logId: log.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EMAIL] ${activeProvider.toUpperCase()} send failed:`, message);

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
  html: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

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

    // SES rate limit: 1 email/sec in sandbox, higher in production
    await new Promise((r) => setTimeout(r, activeProvider === 'ses' ? 1100 : 100));
  }

  return { sent, failed, logIds };
}
