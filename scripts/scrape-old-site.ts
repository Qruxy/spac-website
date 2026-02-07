/**
 * Old SPAC Website Scraper
 *
 * Logs into the old PHP site, discovers PDF files (newsletters, minutes, documents),
 * and saves a manifest for later download.
 *
 * Usage: npx tsx scripts/scrape-old-site.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://www.stpeteastronomyclub.org';
const SPAC_BASE = `${BASE_URL}/SPAC`;

interface ScrapedFile {
  url: string;
  filename: string;
  category: 'newsletter' | 'minutes' | 'club_document';
  year?: number;
  month?: number;
  discoveredFrom: string;
}

interface ScrapeResult {
  files: ScrapedFile[];
  adminPages: { url: string; title: string; snippet: string }[];
  errors: string[];
  timestamp: string;
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

async function login(): Promise<string> {
  console.log('Logging into old SPAC site...');
  const loginUrl = `${SPAC_BASE}/Sign_In.php`;
  const formData = new URLSearchParams({
    pEmail: 'strashni2002@yahoo.com',
    passwd: 'Kra$ni68',
  });

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
    redirect: 'manual',
  });

  // Extract session cookie from Set-Cookie headers
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  const sessionCookie = setCookieHeaders.find(c => c.includes('PHPSESSID'));
  if (!sessionCookie) {
    const allHeaders = [...response.headers.entries()];
    console.log('Response status:', response.status);
    console.log('Headers:', allHeaders);
    throw new Error('Failed to get session cookie from login');
  }
  const cookie = sessionCookie.split(';')[0];
  console.log('Login successful');
  return cookie;
}

async function fetchPage(url: string, cookie: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Cookie: cookie },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function extractPdfLinks(html: string, sourceUrl: string): ScrapedFile[] {
  const files: ScrapedFile[] = [];
  const linkRegex = /href=["']([^"']*\.pdf[^"']*)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const fullUrl = href.startsWith('http') ? href : new URL(href, sourceUrl).href;
    const filename = decodeURIComponent(path.basename(fullUrl).split('?')[0]);

    let category: ScrapedFile['category'] = 'club_document';
    const lowerUrl = fullUrl.toLowerCase();
    if (lowerUrl.includes('newsletter')) category = 'newsletter';
    else if (lowerUrl.includes('minute')) category = 'minutes';

    const yearMatch = fullUrl.match(/\/(\d{4})\//);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    const monthMatch = filename.toLowerCase().match(new RegExp(`(${MONTH_NAMES.join('|')})`));
    const month = monthMatch ? MONTH_NAMES.indexOf(monthMatch[1]) + 1 : undefined;

    files.push({ url: fullUrl, filename, category, year, month, discoveredFrom: sourceUrl });
  }

  return files;
}

async function tryDirectoryListing(dirUrl: string, cookie: string): Promise<string[]> {
  try {
    const html = await fetchPage(dirUrl, cookie);
    const linkRegex = /href="([^"]+\.pdf)"/gi;
    const files: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const fullUrl = new URL(match[1], dirUrl).href;
      files.push(fullUrl);
    }
    return files;
  } catch {
    return [];
  }
}

async function main() {
  const result: ScrapeResult = {
    files: [],
    adminPages: [],
    errors: [],
    timestamp: new Date().toISOString(),
  };

  let cookie: string;
  try {
    cookie = await login();
  } catch (err) {
    console.error('Login failed:', err);
    console.log('\nAttempting unauthenticated file discovery...');
    cookie = '';
  }

  // Scrape admin pages for PDF links
  const adminPages = [
    `${SPAC_BASE}/leadershipAdmin.php`,
    `${SPAC_BASE}/manageDocs.php`,
    `${SPAC_BASE}/leadership.php`,
    `${SPAC_BASE}/news.php`,
    `${SPAC_BASE}/index.php`,
  ];

  for (const url of adminPages) {
    try {
      console.log(`Fetching: ${url}`);
      const html = await fetchPage(url, cookie);
      const files = extractPdfLinks(html, url);
      result.files.push(...files);
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      result.adminPages.push({
        url,
        title: titleMatch?.[1] || 'Unknown',
        snippet: html.substring(0, 300).replace(/\s+/g, ' '),
      });
      console.log(`  Found ${files.length} PDF links`);
    } catch (err) {
      const msg = `Failed to fetch ${url}: ${err}`;
      console.error(`  ${msg}`);
      result.errors.push(msg);
    }
  }

  // Try direct directory listings for newsletters and minutes
  console.log('\nScanning directory listings...');
  for (let year = 2010; year <= 2026; year++) {
    const nlUrls = await tryDirectoryListing(`${BASE_URL}/Newsletters/${year}/`, cookie);
    for (const url of nlUrls) {
      result.files.push({
        url,
        filename: decodeURIComponent(path.basename(url)),
        category: 'newsletter',
        year,
        discoveredFrom: `${BASE_URL}/Newsletters/${year}/`,
      });
    }
    if (nlUrls.length > 0) console.log(`  Newsletters ${year}: ${nlUrls.length} files`);

    const minUrls = await tryDirectoryListing(`${SPAC_BASE}/Minutes/${year}/`, cookie);
    for (const url of minUrls) {
      result.files.push({
        url,
        filename: decodeURIComponent(path.basename(url)),
        category: 'minutes',
        year,
        discoveredFrom: `${SPAC_BASE}/Minutes/${year}/`,
      });
    }
    if (minUrls.length > 0) console.log(`  Minutes ${year}: ${minUrls.length} files`);
  }

  // Club documents directory
  const clubDocs = await tryDirectoryListing(`${SPAC_BASE}/Club_Documents/`, cookie);
  for (const url of clubDocs) {
    result.files.push({
      url,
      filename: decodeURIComponent(path.basename(url)),
      category: 'club_document',
      discoveredFrom: `${SPAC_BASE}/Club_Documents/`,
    });
  }
  if (clubDocs.length > 0) console.log(`  Club Documents: ${clubDocs.length} files`);

  // Deduplicate by URL
  const seen = new Set<string>();
  result.files = result.files.filter(f => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });

  // Write results
  const outputDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'scraped-files.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Discovered ${result.files.length} unique files:`);
  console.log(`  Newsletters: ${result.files.filter(f => f.category === 'newsletter').length}`);
  console.log(`  Minutes: ${result.files.filter(f => f.category === 'minutes').length}`);
  console.log(`  Club Documents: ${result.files.filter(f => f.category === 'club_document').length}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`Saved to: ${outputPath}`);
}

main().catch(console.error);
