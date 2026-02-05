/**
 * Terms of Service Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'SPAC terms of service for website usage and membership.',
};

export default function TermsOfServicePage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the St. Pete Astronomy Club website and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Membership</h2>
            <p className="text-muted-foreground mb-4">
              Membership in SPAC is open to anyone interested in astronomy. By becoming a member, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Abide by club bylaws and code of conduct</li>
              <li>Pay membership dues in a timely manner</li>
              <li>Treat fellow members with respect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">User Content</h2>
            <p className="text-muted-foreground mb-4">
              When you submit content to our website (including photos, comments, and classifieds listings), you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Grant SPAC a non-exclusive license to use, display, and share your content</li>
              <li>Confirm that you own or have rights to the content</li>
              <li>Agree not to post content that is illegal, offensive, or violates others&apos; rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Classifieds Marketplace</h2>
            <p className="text-muted-foreground">
              The classifieds section is provided as a convenience for members. SPAC is not a party to any transactions and does not guarantee the quality, safety, or legality of items listed. Users are responsible for their own transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Equipment Lending</h2>
            <p className="text-muted-foreground">
              Members who borrow club equipment agree to use it responsibly, return it in good condition, and report any damage immediately. Members may be held liable for damage or loss of borrowed equipment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Events and Safety</h2>
            <p className="text-muted-foreground">
              Participation in SPAC events is at your own risk. We recommend appropriate clothing, footwear, and safety precautions for outdoor observing sessions. Parents are responsible for supervising their children at all events.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              SPAC and its officers, directors, and volunteers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or participation in club activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to our services at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify members of significant changes via email or website announcement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              Questions about these Terms should be directed to{' '}
              <a href="mailto:info@stpeteastronomyclub.org" className="text-primary hover:underline">
                info@stpeteastronomyclub.org
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
