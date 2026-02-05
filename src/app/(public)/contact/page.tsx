/**
 * Contact Page
 * 
 * Contact information and form for reaching SPAC.
 */

import type { Metadata } from 'next';
import { Mail, MapPin, Calendar, Facebook, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the St. Pete Astronomy Club. Find our meeting locations, email contacts, and social media.',
};

const contacts = [
  {
    title: 'General Inquiries',
    email: 'info@stpeteastronomyclub.org',
    description: 'Questions about the club, membership, or events',
  },
  {
    title: 'Membership',
    email: 'membership@stpeteastronomyclub.org',
    description: 'Membership applications and renewals',
  },
  {
    title: 'Newsletter',
    email: 'newsletter@stpeteastronomyclub.org',
    description: 'Newsletter submissions and subscriptions',
  },
  {
    title: 'Outreach',
    email: 'outreach@stpeteastronomyclub.org',
    description: 'School visits and public event requests',
  },
];

export default function ContactPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about SPAC? We&apos;d love to hear from you. Reach out through any of the channels below.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Cards */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Email Contacts</h2>
            {contacts.map((contact) => (
              <div key={contact.email} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground mb-1">{contact.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{contact.description}</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {contact.email}
                </a>
              </div>
            ))}
          </div>

          {/* Meeting Info & Social */}
          <div className="space-y-6">
            {/* Meeting Location */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Meeting Location
              </h2>
              <p className="text-foreground font-medium">Mirror Lake Community Library</p>
              <p className="text-muted-foreground">280 5th Street North</p>
              <p className="text-muted-foreground">St. Petersburg, FL 33701</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Mirror+Lake+Community+Library+St+Petersburg+FL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-3"
              >
                View on Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Meeting Schedule */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Monthly Meetings
              </h2>
              <p className="text-foreground">
                We meet on the <span className="font-semibold">2nd Friday of every month</span> at 7:30 PM.
              </p>
              <p className="text-muted-foreground mt-2">
                Meetings are free and open to the public. No membership required to attend!
              </p>
            </div>

            {/* Social Media */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Connect With Us</h2>
              <div className="space-y-3">
                <a
                  href="https://www.facebook.com/groups/stpeteastronomyclub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span>Facebook Group</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
