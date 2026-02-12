/**
 * Sitemap Page
 * 
 * Human-readable sitemap of all pages on the site.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, Users, Calendar, Image, ShoppingBag, Mail, FileText, Telescope, Star, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Complete sitemap of the St. Petersburg Astronomy Club website.',
};

const siteStructure = [
  {
    title: 'Main Pages',
    icon: Home,
    links: [
      { name: 'Home', href: '/' },
      { name: 'About Us', href: '/about' },
      { name: 'Our History', href: '/history' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Events',
    icon: Calendar,
    links: [
      { name: 'Event Calendar', href: '/events' },
      { name: 'Star Parties', href: '/events?type=star_party' },
      { name: 'Monthly Meetings', href: '/events?type=meeting' },
      { name: 'Orange Blossom Special', href: '/obs' },
    ],
  },
  {
    title: 'Membership',
    icon: Users,
    links: [
      { name: 'Join SPAC', href: '/register' },
      { name: 'Member Benefits', href: '/membership' },
      { name: 'Sign In', href: '/login' },
    ],
  },
  {
    title: 'Community',
    icon: Star,
    links: [
      { name: 'Photo Gallery', href: '/gallery' },
      { name: 'Equipment Classifieds', href: '/classifieds' },
      { name: 'Newsletter Archive', href: '/newsletter' },
    ],
  },
  {
    title: 'Programs',
    icon: Telescope,
    links: [
      { name: 'VSA Program', href: '/vsa' },
      { name: 'Mirror Lab', href: '/mirror-lab' },
      { name: 'Donations', href: '/donations' },
    ],
  },
  {
    title: 'Legal',
    icon: FileText,
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-foreground mb-4">Sitemap</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Find your way around the SPAC website.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {siteStructure.map((section) => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card/50 p-6 text-center">
          <p className="text-muted-foreground">
            Looking for something specific?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
            {' '}and we&apos;ll help you find it.
          </p>
        </div>
      </div>
    </div>
  );
}
