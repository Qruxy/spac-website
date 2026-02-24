import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import { Providers } from '@/providers';
import './globals.css';

const exo2 = localFont({
  src: [
    { path: '../../public/fonts/Exo2-Thin.otf', weight: '100', style: 'normal' },
    { path: '../../public/fonts/Exo2-ThinItalic.otf', weight: '100', style: 'italic' },
    { path: '../../public/fonts/Exo2-ExtraLight.otf', weight: '200', style: 'normal' },
    { path: '../../public/fonts/Exo2-ExtraLightItalic.otf', weight: '200', style: 'italic' },
    { path: '../../public/fonts/Exo2-Light.otf', weight: '300', style: 'normal' },
    { path: '../../public/fonts/Exo2-LightItalic.otf', weight: '300', style: 'italic' },
    { path: '../../public/fonts/Exo2-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Exo2-Italic.otf', weight: '400', style: 'italic' },
    { path: '../../public/fonts/Exo2-Medium.otf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Exo2-MediumItalic.otf', weight: '500', style: 'italic' },
    { path: '../../public/fonts/Exo2-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/Exo2-SemiBoldItalic.otf', weight: '600', style: 'italic' },
    { path: '../../public/fonts/Exo2-Bold.otf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/Exo2-BoldItalic.otf', weight: '700', style: 'italic' },
    { path: '../../public/fonts/Exo2-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../../public/fonts/Exo2-ExtraBoldItalic.otf', weight: '800', style: 'italic' },
    { path: '../../public/fonts/Exo2-Black.otf', weight: '900', style: 'normal' },
    { path: '../../public/fonts/Exo2-BlackItalic.otf', weight: '900', style: 'italic' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stpeteastronomyclub.org'),
  title: {
    default: 'St. Petersburg Astronomy Club | SPAC',
    template: '%s | SPAC',
  },
  description:
    "Tampa Bay's Home for Family Astronomy. Join the St. Petersburg Astronomy Club, founded in 1927, for star parties, monthly meetings, and community outreach.",
  keywords: [
    'astronomy club',
    'St. Petersburg',
    'Tampa Bay',
    'star party',
    'telescope',
    'stargazing',
    'SPAC',
    'Orange Blossom Special',
  ],
  authors: [{ name: 'St. Petersburg Astronomy Club' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stpeteastronomyclub.org',
    siteName: 'St. Petersburg Astronomy Club',
    title: 'St. Petersburg Astronomy Club | SPAC',
    description: "Tampa Bay's Home for Family Astronomy",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'St. Petersburg Astronomy Club',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'St. Petersburg Astronomy Club | SPAC',
    description: "Tampa Bay's Home for Family Astronomy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Organization JSON-LD as a static string (safe - no user input)
const organizationJsonLd = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "St. Petersburg Astronomy Club",
  "alternateName": "SPAC",
  "url": "https://stpeteastronomyclub.org",
  "logo": "https://stpeteastronomyclub.org/logo.png",
  "foundingDate": "1927",
  "description": "Tampa Bay's Home for Family Astronomy",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "St. Petersburg",
    "addressRegion": "FL",
    "addressCountry": "US"
  }
}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {organizationJsonLd}
        </Script>
      </head>
      <body className={`${exo2.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
