/**
 * Download files discovered by scrape-old-site.ts
 *
 * Downloads PDFs to data/downloads/{category}/ for review before S3 upload.
 *
 * Usage: npx tsx scripts/download-scraped-files.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ScrapedFile {
  url: string;
  filename: string;
  category: 'newsletter' | 'minutes' | 'club_document';
  year?: number;
  month?: number;
}

async function main() {
  const manifestPath = path.join(process.cwd(), 'data', 'scraped-files.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('No scraped-files.json found. Run scrape-old-site.ts first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const files: ScrapedFile[] = manifest.files;

  console.log(`Found ${files.length} files to download`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const yearDir = file.year ? `/${file.year}` : '';
    const dir = path.join(process.cwd(), 'data', 'downloads', file.category + yearDir);
    fs.mkdirSync(dir, { recursive: true });

    const outPath = path.join(dir, file.filename);
    if (fs.existsSync(outPath)) {
      skipped++;
      continue;
    }

    try {
      console.log(`Downloading: ${file.filename}...`);
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outPath, buffer);
      downloaded++;
      console.log(`  OK (${(buffer.length / 1024).toFixed(1)} KB)`);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error(`  FAILED: ${file.filename} - ${err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
}

main().catch(console.error);
