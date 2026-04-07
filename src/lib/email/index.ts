/**
 * Email Service
 *
 * Priority: Resend > SES > SMTP > Error
 *
 * Environment variables:
 *   RESEND_API_KEY   — Resend API key (preferred)
 *   RESEND_FROM      — From address for Resend (must be verified domain OR resend.dev)
 *   SES: SES_REGION (default: us-east-1), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 *   SMTP: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM       — sender address (SES/SMTP fallback)
 */

import { Resend } from 'resend';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { prisma } from '@/lib/db';

const SES_REGION = process.env.SES_REGION || process.env.S3_REGION || 'us-east-1';
const EMAIL_FROM = process.env.EMAIL_FROM || 'SPAC <noreply@stpeteastronomyclub.org>';

type EmailProvider = 'resend' | 'ses' | 'smtp' | 'none';

let resendClient: Resend | null = null;
let sesClient: SESClient | null = null;
let smtpTransporter: Transporter | null = null;
let activeProvider: EmailProvider = 'none';

// Resend takes highest priority
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  activeProvider = 'resend';
  console.log('[EMAIL] Using Resend');
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
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    sesClient = new SESClient({
      region: SES_REGION,
      credentials: { accessKeyId, secretAccessKey },
    });
    activeProvider = 'ses';
    console.log(`[EMAIL] Using Amazon SES (${SES_REGION})`);
  } else {
    console.warn('[EMAIL] No email provider configured.');
  }
}

// The FROM address used by Resend — falls back to EMAIL_FROM
const resendFrom = process.env.RESEND_FROM || EMAIL_FROM;

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

export interface EmailAttachment {
  filename: string;
  /** Public URL — fetched once before bulk send and cached as a buffer */
  url?: string;
  /** Pre-fetched content (base64 or Buffer) */
  content?: string | Buffer;
}

async function resolveAttachments(
  attachments?: EmailAttachment[],
): Promise<Array<{ filename: string; content: Buffer }>> {
  if (!attachments?.length) return [];
  return Promise.all(
    attachments.map(async (a) => {
      if (a.content) {
        const buf = typeof a.content === 'string' ? Buffer.from(a.content, 'base64') : a.content;
        return { filename: a.filename, content: buf };
      }
      if (a.url) {
        const res = await fetch(a.url);
        if (!res.ok) throw new Error(`Failed to fetch attachment ${a.filename}: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        return { filename: a.filename, content: buf };
      }
      throw new Error(`Attachment ${a.filename} has no url or content`);
    }),
  );
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: Array<{ filename: string; content: Buffer }>,
): Promise<void> {
  if (!resendClient) throw new Error('Resend client not initialized');
  const { error } = await resendClient.emails.send({
    from: resendFrom,
    to,
    subject,
    html,
    text: text || htmlToPlainText(html),
    attachments: attachments?.length
      ? attachments.map((a) => ({ filename: a.filename, content: a.content }))
      : undefined,
  });
  if (error) throw new Error(error.message);
}

async function sendViaSES(to: string, subject: string, html: string, text?: string): Promise<void> {
  if (!sesClient) throw new Error('SES client not initialized');
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
  /** Pre-resolved attachments (buffers already fetched) */
  resolvedAttachments?: Array<{ filename: string; content: Buffer }>;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; logId?: string; error?: string }> {
  const html = opts.useLayout === false ? opts.html : wrapInLayout(opts.html, opts.preheader);

  if (activeProvider === 'none') {
    const errorMsg = 'No email provider configured. Set RESEND_API_KEY or AWS credentials.';
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
    if (activeProvider === 'resend') {
      await sendViaResend(opts.to, opts.subject, html, opts.text, opts.resolvedAttachments);
    } else if (activeProvider === 'ses') {
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
  /** Attachment URLs to fetch once and include in every email */
  attachments?: EmailAttachment[];
}

export async function sendBulkEmail(opts: BulkSendOptions): Promise<{ sent: number; failed: number; logIds: string[] }> {
  let sent = 0;
  let failed = 0;
  const logIds: string[] = [];

  // Resolve attachments once for the whole batch (avoid re-fetching per recipient)
  const resolvedAttachments = await resolveAttachments(opts.attachments);

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
      resolvedAttachments: resolvedAttachments.length > 0 ? resolvedAttachments : undefined,
    });

    if (result.success) sent++;
    else failed++;
    if (result.logId) logIds.push(result.logId);

    // Rate limit: Resend free tier = 2 req/s
    await new Promise((r) => setTimeout(r, activeProvider === 'resend' ? 500 : 100));
  }

  return { sent, failed, logIds };
}
