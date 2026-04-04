/**
 * SPAC Calendar Import Script
 *
 * Fetches events from a public Google Calendar (iCal format) and imports
 * them into the SPAC website database as PUBLISHED events.
 *
 * Usage:
 *   ICAL_URL="https://calendar.google.com/calendar/ical/.../basic.ics" \
 *   DATABASE_URL="..." npx tsx scripts/import-calendar.ts
 *
 * Optional env vars:
 *   MONTHS_BACK=12   How many months of past events to import (default: 12)
 *   MONTHS_AHEAD=6   How many months ahead to import (default: 6)
 *   DRY_RUN=1        Print events without writing to DB
 */

import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

// ─── iCal parser (no deps) ────────────────────────────────────────────────────

interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend?: Date;
}

function parseIcalDate(raw: string): Date {
  // Handles: 20250401T190000Z, 20250401T190000, 20250401
  raw = raw.replace(/\r/g, '').split(';')[0]; // strip TZID param
  if (raw.includes('T')) {
    const [date, time] = raw.split('T');
    const y = date.slice(0, 4), mo = date.slice(4, 6), d = date.slice(6, 8);
    const h = time.slice(0, 2), mi = time.slice(2, 4), s = time.slice(4, 6);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${raw.endsWith('Z') ? 'Z' : ''}`);
  }
  return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
}

function parseIcal(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = text.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r\n|\n/);
  let current: Partial<ICalEvent> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT') {
      if (current?.uid && current.summary && current.dtstart) {
        events.push(current as ICalEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    const cleanKey = key.split(';')[0].toUpperCase();

    if (cleanKey === 'UID') current.uid = value;
    else if (cleanKey === 'SUMMARY') current.summary = value.replace(/\\,/g, ',').replace(/\\n/g, '\n');
    else if (cleanKey === 'DESCRIPTION') current.description = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
    else if (cleanKey === 'LOCATION') current.location = value.replace(/\\,/g, ',');
    else if (cleanKey === 'DTSTART') current.dtstart = parseIcalDate(value);
    else if (cleanKey === 'DTEND') current.dtend = parseIcalDate(value);
  }

  return events;
}

// ─── Event type inference ─────────────────────────────────────────────────────

type EventType = 'STAR_PARTY' | 'MEETING' | 'WORKSHOP' | 'OBSERVATION' | 'SOCIAL' | 'OUTREACH' | 'FUNDRAISER' | 'OTHER';

function inferType(title: string): EventType {
  const t = title.toLowerCase();
  if (t.includes('star party') || t.includes('new moon') || t.includes('observ')) return 'STAR_PARTY';
  if (t.includes('meeting') || t.includes('general meeting')) return 'MEETING';
  if (t.includes('workshop') || t.includes('mirror lab') || t.includes('class')) return 'WORKSHOP';
  if (t.includes('outreach') || t.includes('school') || t.includes('scout') || t.includes('public')) return 'OUTREACH';
  if (t.includes('obs') || t.includes('orange blossom')) return 'STAR_PARTY';
  if (t.includes('picnic') || t.includes('social') || t.includes('party') && !t.includes('star')) return 'SOCIAL';
  if (t.includes('fundrais') || t.includes('sale')) return 'FUNDRAISER';
  return 'OTHER';
}

function slugify(title: string, date: Date): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const suffix = date.toISOString().slice(0, 10);
  return `${base}-${suffix}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const icalUrl = process.env.ICAL_URL;
  if (!icalUrl) {
    console.error('ERROR: Set ICAL_URL env var to your Google Calendar iCal URL');
    console.error('  In Google Calendar: Settings > [calendar] > "Secret address in iCal format"');
    process.exit(1);
  }

  const monthsBack = parseInt(process.env.MONTHS_BACK ?? '12');
  const monthsAhead = parseInt(process.env.MONTHS_AHEAD ?? '6');
  const dryRun = process.env.DRY_RUN === '1';

  const cutoffPast = new Date();
  cutoffPast.setMonth(cutoffPast.getMonth() - monthsBack);
  const cutoffFuture = new Date();
  cutoffFuture.setMonth(cutoffFuture.getMonth() + monthsAhead);

  console.log(`Fetching calendar from: ${icalUrl}`);
  const res = await fetch(icalUrl);
  if (!res.ok) throw new Error(`Failed to fetch calendar: ${res.status} ${res.statusText}`);
  const text = await res.text();

  const allEvents = parseIcal(text);
  console.log(`Parsed ${allEvents.length} total events from calendar`);

  const filtered = allEvents.filter(e => e.dtstart >= cutoffPast && e.dtstart <= cutoffFuture);
  console.log(`${filtered.length} events within range (${monthsBack} months back, ${monthsAhead} months ahead)`);

  if (dryRun) {
    console.log('\n--- DRY RUN (not writing to DB) ---\n');
    for (const e of filtered) {
      console.log(`[${inferType(e.summary)}] ${e.dtstart.toISOString().slice(0, 10)} — ${e.summary}`);
    }
    return;
  }

  let created = 0, skipped = 0;

  for (const e of filtered) {
    const type = inferType(e.summary);
    const slug = slugify(e.summary, e.dtstart);

    // Skip if slug already exists
    const existing = await p.event.findFirst({ where: { slug } });
    if (existing) { skipped++; continue; }

    await p.event.create({
      data: {
        title: e.summary,
        slug,
        description: e.description ?? null,
        type,
        status: 'PUBLISHED',
        startDate: e.dtstart,
        endDate: e.dtend ?? undefined,
        locationName: e.location ?? undefined,
      },
    });

    console.log(`  Created: [${type}] ${e.dtstart.toISOString().slice(0, 10)} — ${e.summary}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main().catch(console.error).finally(() => p.$disconnect());
