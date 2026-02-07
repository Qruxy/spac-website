/**
 * Newsletter Import from Google Drive
 *
 * Lists files in the shared Google Drive folder, downloads PDFs,
 * uploads them to S3, and creates ClubDocument records.
 *
 * Usage: GOOGLE_API_KEY=xxx npx tsx scripts/import-newsletters.ts
 *
 * If no API key, uses direct Google Drive download links.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Bucket, getPublicUrl } from '../src/lib/s3';

// Load .env.local for S3 credentials
const dotenvPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx);
        const value = trimmed.substring(eqIdx + 1).replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const prisma = new PrismaClient({ log: ['error'] });
const GOOGLE_DRIVE_FOLDER_ID = '0B9dsr9BUsMaYSnkxZ0E1SFBHbTQ';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9, sept: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

async function listDriveFiles(): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY) {
    console.log('No GOOGLE_API_KEY set. Trying public access...');
  }

  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime)',
      pageSize: '100',
    });
    if (GOOGLE_API_KEY) params.set('key', GOOGLE_API_KEY);
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Drive API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    allFiles.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

function parseNewsletterFilename(filename: string): { year?: number; month?: number; title: string } {
  const nameWithoutExt = filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');

  let year: number | undefined;
  let month: number | undefined;

  // Match 4-digit year
  const yearMatch = nameWithoutExt.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }

  // Match month name
  const monthNames = Object.keys(MONTH_MAP);
  const monthNameRegex = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'i');
  const monthMatch = nameWithoutExt.toLowerCase().match(monthNameRegex);

  if (monthMatch) {
    month = MONTH_MAP[monthMatch[1].toLowerCase()];
  } else {
    // Try numeric month (01-12) near the year
    const monthNumMatch = nameWithoutExt.match(/\b(0[1-9]|1[0-2])\b/);
    if (monthNumMatch && year) {
      month = parseInt(monthNumMatch[1]);
    }
  }

  // Generate title
  let title = 'SPAC Examiner';
  if (month && year) {
    const monthName = new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' });
    title = `SPAC Examiner - ${monthName} ${year}`;
  } else if (year) {
    title = `SPAC Examiner - ${year}`;
  } else {
    title = nameWithoutExt.trim() || filename;
  }

  return { year, month, title };
}

async function downloadDriveFile(fileId: string): Promise<Buffer> {
  // For public files, use this URL pattern
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const response = await fetch(downloadUrl, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  // Check if we got a virus scan warning page (large files)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    // Try confirm download URL
    const html = await response.text();
    const confirmMatch = html.match(/confirm=([^&"]+)/);
    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}`;
      const confirmResponse = await fetch(confirmUrl, { redirect: 'follow' });
      return Buffer.from(await confirmResponse.arrayBuffer());
    }
    throw new Error('Got HTML instead of PDF - file may require authentication');
  }

  return Buffer.from(await response.arrayBuffer());
}

async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  const s3 = getS3Client();
  const bucket = getS3Bucket();

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    ContentDisposition: 'inline',
  }));

  return getPublicUrl(key);
}

async function main() {
  console.log('========================================');
  console.log('SPAC Newsletter Import from Google Drive');
  console.log('========================================\n');

  // Get admin user for uploadedById
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!adminUser) {
    console.error('No admin user found in database. Run the member migration first.');
    process.exit(1);
  }

  // List Google Drive files
  console.log('Listing files in Google Drive folder...');
  let driveFiles: DriveFile[];

  try {
    driveFiles = await listDriveFiles();
  } catch (err) {
    console.error('Google Drive API failed:', err);
    console.error('\nTo use this script, set GOOGLE_API_KEY environment variable.');
    console.error('Get an API key at: https://console.cloud.google.com/apis/credentials');
    console.error('Enable the Google Drive API for your project.');
    process.exit(1);
  }

  console.log(`Found ${driveFiles.length} total files\n`);

  // Filter to PDFs
  const pdfFiles = driveFiles.filter(f =>
    f.mimeType === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  );
  console.log(`${pdfFiles.length} PDF files to process\n`);

  // Check existing newsletters
  const existing = await prisma.clubDocument.findMany({
    where: { category: 'NEWSLETTER' },
    select: { filename: true },
  });
  const existingFilenames = new Set(existing.map(e => e.filename));

  const results = { imported: 0, skipped: 0, failed: 0 };

  for (const file of pdfFiles) {
    if (existingFilenames.has(file.name)) {
      console.log(`  SKIP (exists): ${file.name}`);
      results.skipped++;
      continue;
    }

    try {
      const parsed = parseNewsletterFilename(file.name);

      // Download
      console.log(`  Downloading: ${file.name}...`);
      const buffer = await downloadDriveFile(file.id);

      if (buffer.length < 100) {
        console.log(`  SKIP (too small, likely error page): ${file.name}`);
        results.failed++;
        continue;
      }

      // Upload to S3
      const yearStr = parsed.year || 'unknown';
      const s3Key = `newsletters/${yearStr}/${file.name}`;
      console.log(`  Uploading to S3: ${s3Key}...`);
      const fileUrl = await uploadToS3(buffer, s3Key);

      // Create DB record
      await prisma.clubDocument.create({
        data: {
          title: parsed.title,
          description: 'Newsletter imported from SPAC Google Drive archive',
          category: 'NEWSLETTER',
          fileUrl,
          filename: file.name,
          mimeType: 'application/pdf',
          size: buffer.length,
          year: parsed.year || null,
          month: parsed.month || null,
          isPublic: true,
          uploadedById: adminUser.id,
        },
      });

      console.log(`  OK: ${parsed.title}`);
      results.imported++;

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`  FAIL: ${file.name} - ${err}`);
      results.failed++;
    }
  }

  console.log('\n========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');
  console.log(`  Imported: ${results.imported}`);
  console.log(`  Skipped:  ${results.skipped}`);
  console.log(`  Failed:   ${results.failed}`);

  await prisma.$disconnect();
}

main().catch(console.error);
