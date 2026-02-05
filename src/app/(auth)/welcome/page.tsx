/**
 * Welcome Page
 *
 * Shown to new users after account creation.
 * Guides them through membership selection.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { Rocket, ArrowRight, Star, Users, GraduationCap, Crown } from 'lucide-react';

const membershipOptions = [
  {
    name: 'Free Member',
    slug: 'free',
    price: '$0',
    period: 'forever',
    description: 'Basic access to public events and community',
    icon: Star,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
  {
    name: 'Individual',
    slug: 'individual',
    price: '$40',
    period: '/year',
    description: 'Full access to all club benefits',
    icon: Star,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    recommended: true,
  },
  {
    name: 'Family',
    slug: 'family',
    price: '$60',
    period: '/year',
    description: 'For you and up to 4 family members',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    name: 'Student',
    slug: 'student',
    price: '$20',
    period: '/year',
    description: 'Discounted rate for enrolled students',
    icon: GraduationCap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
];

export default async function WelcomePage() {
  const session = await getSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const firstName = session.user.name?.split(' ')[0] || 'New Member';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to SPAC, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Your account has been created. Choose a membership to get started.
        </p>
      </div>

      {/* Membership Options */}
      <div className="space-y-3 mb-6">
        {membershipOptions.map((option) => (
          <Link
            key={option.slug}
            href={option.slug === 'free' ? '/dashboard' : `/checkout?plan=${option.slug}`}
            className={`relative block rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md ${
              option.recommended
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            {option.recommended && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Recommended
              </span>
            )}
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 rounded-full p-2 ${option.bgColor}`}>
                <option.icon className={`h-5 w-5 ${option.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{option.name}</h3>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">
                      {option.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.period}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Skip for now */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now, I&apos;ll decide later
        </Link>
      </div>
    </div>
  );
}
