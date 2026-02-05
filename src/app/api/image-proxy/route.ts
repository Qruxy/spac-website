/**
 * Image Proxy API Route
 *
 * Fetches external images server-side to bypass CORS restrictions.
 * Used by the Lanyard component to load member photos onto canvas.
 *
 * SECURITY: Only allows proxying from approved domains to prevent SSRF attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Allowed domains for image proxying.
 * Add trusted image hosting domains here.
 */
const ALLOWED_DOMAINS = [
  // S3/CloudFront domains (adjust to match your bucket)
  'spac-media.s3.amazonaws.com',
  'spac-media.s3.us-east-1.amazonaws.com',
  'd1234567890.cloudfront.net', // Update with actual CloudFront domain
  // Common image CDNs
  'images.unsplash.com',
  'cdn.discordapp.com',
  'avatars.githubusercontent.com',
  // Gravatar
  'www.gravatar.com',
  'gravatar.com',
  // Your own domain
  'spac.org',
  'www.spac.org',
  'stpeteastronomyclub.org',
  'www.stpeteastronomyclub.org',
  // Common test/placeholder image services
  'placekitten.com',
  'placehold.co',
  'picsum.photos',
  'i.imgur.com',
  'imgur.com',
  'cataas.com',
  'loremflickr.com',
  'via.placeholder.com',
  // Supabase storage
  'kewstemxoxilubeafbut.supabase.co',
];

/**
 * Allowed image content types
 */
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Maximum allowed response size (5MB)
 */
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

/**
 * Check if a hostname is in the allowed list
 */
function isAllowedDomain(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return ALLOWED_DOMAINS.some((domain) => {
    const normalizedDomain = domain.toLowerCase();
    // Exact match or subdomain match
    return normalizedHost === normalizedDomain ||
           normalizedHost.endsWith('.' + normalizedDomain);
  });
}

export async function GET(request: NextRequest) {
  // Require authentication to prevent abuse
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Parse and validate URL
    const imageUrl = new URL(url);

    // SECURITY: Only allow HTTPS (except localhost for dev)
    if (imageUrl.protocol !== 'https:' && imageUrl.hostname !== 'localhost') {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // SECURITY: Check against allowlist to prevent SSRF
    if (!isAllowedDomain(imageUrl.hostname)) {
      console.warn(`[Image Proxy] Blocked request to non-allowed domain: ${imageUrl.hostname}`);
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    // SECURITY: Block private IP ranges
    const hostname = imageUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.') ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) {
      return NextResponse.json(
        { error: 'Private addresses not allowed' },
        { status: 403 }
      );
    }

    // Fetch the image server-side with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(imageUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SPAC-Website/1.0)',
        'Accept': 'image/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // SECURITY: Validate content type
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || '';
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // SECURITY: Check content length before reading
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      );
    }

    const buffer = await response.arrayBuffer();

    // SECURITY: Double-check size after reading
    if (buffer.byteLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      );
    }

    // Return the image with proper headers for canvas usage
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    console.error('[Image Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
