/** @type {import('next').NextConfig} */

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// For static export (GitHub Pages), remove routes incompatible with static hosting:
// - API routes (need server runtime)
// - Auth-gated sections (dashboard, admin, verify)
// - Dynamic [param] page directories (modules fail to load without server deps)
if (isGitHubPages) {
  const fs = require('fs');
  const path = require('path');

  // Directories to completely remove
  const dirsToRemove = [
    'src/app/api',
    'src/app/(dashboard)',
    'src/app/admin',
    'src/app/verify',
  ];
  for (const dir of dirsToRemove) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`[GitHub Pages] Removed ${dir}/`);
    }
  }

  // Also remove dynamic [param] directories from public routes
  // (they have server-side deps that fail during static collection)
  function removeDynamicDirs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name.startsWith('[')) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`[GitHub Pages] Removed dynamic route: ${fullPath.replace(__dirname + '/', '')}`);
        } else {
          removeDynamicDirs(fullPath);
        }
      }
    }
  }
  removeDynamicDirs(path.join(__dirname, 'src', 'app'));
}

// Security headers for all routes
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' https: data: blob:",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://*.stripe.com https://*.supabase.co wss://*.supabase.co https://*.amazonaws.com",
      "frame-src 'self' https://*.stripe.com",
      "worker-src 'self' blob:",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Inline server env vars at build time for Amplify
  // (Amplify doesn't inject branch env vars into the runtime Lambda)
  ...(!isGitHubPages && {
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      S3_REGION: process.env.S3_REGION,
      S3_BUCKET: process.env.S3_BUCKET,
      CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
    },
  }),
  // GitHub Pages static export settings
  ...(isGitHubPages && {
    output: 'export',
    basePath: '/spac-website',
    assetPrefix: '/spac-website/',
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
  }),
  // Standalone output for server deployments (AWS Amplify)
  ...(!isGitHubPages && { output: 'standalone' }),
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Disable image optimization for static export
    ...(isGitHubPages && { unoptimized: true }),
    // Enable AVIF for better compression (30-50% smaller than WebP)
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        // Unsplash for placeholder images
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Supabase storage
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        // Test/placeholder image services
        protocol: 'https',
        hostname: 'placekitten.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'cataas.com',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'http',
        hostname: 'placekitten.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Enable SWC minification (faster builds)
  swcMinify: true,
  // Optimize production builds
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Performance and security headers (not used in static export)
  ...(isGitHubPages ? {} : {
    async headers() {
      return [
        // Apply security headers to all routes
        {
          source: '/:path*',
          headers: securityHeaders,
        },
        // Cache static assets
        {
          source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    },
  }),
};

module.exports = nextConfig;
