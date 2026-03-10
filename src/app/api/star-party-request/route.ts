/**
 * Star Party Request API
 *
 * Accepts form submissions for SPAC star party requests and sends an email
 * notification to the club via Amazon SES.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { sendEmail } from '@/lib/email';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

interface StarPartyRequestBody {
  eventDate: string;
  startTime: string;
  expectedAttendees: string;
  organization: string;
  locationStreet: string;
  locationCity: string;
  locationZip: string;
  yourName: string;
  mobilePhone: string;
  emailAddress: string;
}

const REQUIRED_FIELDS: (keyof StarPartyRequestBody)[] = [
  'eventDate',
  'startTime',
  'expectedAttendees',
  'organization',
  'locationStreet',
  'locationCity',
  'locationZip',
  'yourName',
  'mobilePhone',
  'emailAddress',
];

export async function POST(request: Request) {
  try {
    // Rate limit: 3 requests per 10 minutes per IP
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = getRateLimitKey('star-party-request', ip);

    if (!rateLimit(key, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: StarPartyRequestBody = await request.json();

    // Validate all required fields
    for (const field of REQUIRED_FIELDS) {
      const value = body[field];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.emailAddress.trim())) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // Format start time for display
    let displayTime = body.startTime;
    try {
      const [h, m] = body.startTime.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      displayTime = `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
      // use raw value if parse fails
    }

    const bodyHtml = `
      <h2 style="color:#60a5fa;margin-top:0">New Star Party Request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8;width:160px"><strong>Organization</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(body.organization)}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Event Date</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(body.eventDate)}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Start Time</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(displayTime)}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Expected Attendees</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(body.expectedAttendees)}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Event Location</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">
            ${escapeHtml(body.locationStreet)}<br/>
            ${escapeHtml(body.locationCity)}, FL ${escapeHtml(body.locationZip)}
          </td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Contact Name</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(body.yourName)}</td>
        </tr>
        <tr style="border-bottom:1px solid #334155">
          <td style="padding:10px 0;color:#94a3b8"><strong>Mobile Phone</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">${escapeHtml(body.mobilePhone)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#94a3b8"><strong>Email Address</strong></td>
          <td style="padding:10px 0;color:#e2e8f0">
            <a href="mailto:${escapeHtml(body.emailAddress)}" style="color:#60a5fa">${escapeHtml(body.emailAddress)}</a>
          </td>
        </tr>
      </table>
      <p style="margin-top:24px;color:#94a3b8;font-size:13px">
        This request was submitted via the SPAC website star party request form.
      </p>
    `;

    const result = await sendEmail({
      to: 'Info@StPeteAstronomyClub.org',
      subject: `Star Party Request: ${body.organization} on ${body.eventDate}`,
      html: bodyHtml,
      preheader: `Star party request from ${body.yourName} at ${body.organization}`,
      metadata: {
        type: 'star_party_request',
        organization: body.organization,
        eventDate: body.eventDate,
        submitterEmail: body.emailAddress,
      },
    });

    if (!result.success) {
      console.error('[star-party-request] Email send failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send request. Please try again or email us directly.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[star-party-request] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
