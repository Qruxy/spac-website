'use client';

/**
 * Site Footer
 *
 * Enhanced footer with newsletter signup, quick links, and social media.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Telescope,
  Facebook,
  Mail,
  MapPin,
  ExternalLink,
  Send,
  Loader2,
  Check,
  Youtube,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const footerLinks = {
  club: [
    { name: 'About Us', href: '/about' },
    { name: 'Our History', href: '/history' },
    { name: 'Board Members', href: '/about#board' },
    { name: 'Contact', href: '/contact' },
  ],
  events: [
    { name: 'Event Calendar', href: '/events' },
    { name: 'Star Parties', href: '/events?type=star_party' },
    { name: 'OBS Star Party', href: '/obs' },
    { name: 'Monthly Meetings', href: '/events?type=meeting' },
  ],
  members: [
    { name: 'Join SPAC', href: '/register' },
    { name: 'Member Benefits', href: '/membership' },
    { name: 'Classifieds', href: '/classifieds' },
    { name: 'Photo Gallery', href: '/gallery' },
  ],
  resources: [
    { name: 'VSA Program', href: '/vsa' },
    { name: 'Mirror Lab', href: '/mirror-lab' },
    { name: 'Newsletter Archive', href: '/newsletter' },
    { name: 'Donations', href: '/donations' },
  ],
};

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/groups/stpeteastronomyclub',
    icon: Facebook,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@stpeteastronomyclub',
    icon: Youtube,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/stpeteastronomy',
    icon: Twitter,
  },
  {
    name: 'Email',
    href: 'mailto:info@stpeteastronomyclub.org',
    icon: Mail,
  },
];

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      const res = await fetch('/api/newsletters/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <p className="text-sm text-muted-foreground mb-3">
        Stay updated with the latest astronomy events and news.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 min-w-0 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={status === 'loading' || status === 'success'}
        />
        <motion.button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
            status === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-2 text-xs',
            status === 'success' ? 'text-green-500' : 'text-red-500'
          )}
        >
          {message}
        </motion.p>
      )}
    </form>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <Telescope className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">SPAC</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Tampa Bay&apos;s Home for Family Astronomy since 1927. Join us for
              star parties, monthly meetings, and community outreach.
            </p>

            {/* Social Links */}
            <div className="mt-4 flex items-center gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>

            {/* Location */}
            <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                St. Petersburg, Florida
                <br />
                Serving Tampa Bay since 1927
              </span>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Club</h3>
            <ul className="space-y-2">
              {footerLinks.club.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Events</h3>
            <ul className="space-y-2">
              {footerLinks.events.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Members</h3>
            <ul className="space-y-2">
              {footerLinks.members.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Subscribe to Our Newsletter
              </h3>
              <NewsletterForm />
            </div>

            {/* Affiliations */}
            <div className="text-center md:text-right">
              <p className="text-xs text-muted-foreground">
                Proud member of the{' '}
                <a
                  href="https://www.astrosociety.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Astronomical Society of the Pacific
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supporter of the{' '}
                <a
                  href="https://www.darksky.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  International Dark-Sky Association
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} St. Pete Astronomy Club, Inc. All rights reserved.
            <br />
            <span className="text-xs opacity-70">501(c)(3) Non-Profit Organization</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="hover:text-foreground transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
