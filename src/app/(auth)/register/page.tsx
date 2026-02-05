'use client';

/**
 * Registration Page
 *
 * Redirects to Cognito sign-up flow or displays membership options.
 */

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { UserPlus, Star, Users, GraduationCap, Check } from 'lucide-react';

const membershipTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for curious beginners',
    features: [
      'Access to public events',
      'Monthly newsletter',
      'Online community access',
    ],
    icon: Star,
    popular: false,
  },
  {
    name: 'Individual',
    price: '$40',
    period: '/year',
    description: 'Full club benefits for one person',
    features: [
      'All free benefits',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member-only events',
    ],
    icon: Star,
    popular: true,
  },
  {
    name: 'Family',
    price: '$60',
    period: '/year',
    description: 'For the whole household',
    features: [
      'All individual benefits',
      'Up to 5 family members',
      'Family discount on events',
      'Youth programs access',
    ],
    icon: Users,
    popular: false,
  },
  {
    name: 'Student',
    price: '$20',
    period: '/year',
    description: 'For enrolled students',
    features: [
      'All individual benefits',
      'Valid student ID required',
      'Special student events',
    ],
    icon: GraduationCap,
    popular: false,
  },
];

export default function RegisterPage() {
  const handleSignUp = async () => {
    // Redirect to Cognito sign-up
    await signIn('cognito', {
      callbackUrl: '/welcome',
    });
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Join SPAC</h1>
        <p className="text-muted-foreground mt-2">
          Explore the cosmos with Tampa Bay&apos;s oldest astronomy club
        </p>
      </div>

      {/* Membership Tiers Preview */}
      <div className="mb-6 space-y-3">
        {membershipTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-lg border p-4 ${
              tier.popular
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <tier.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{tier.name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier.description}
            </p>
          </div>
        ))}
      </div>

      {/* Sign Up Button */}
      <button
        onClick={handleSignUp}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="h-5 w-5" />
        Create Account
      </button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        You&apos;ll choose your membership level after creating your account
      </p>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already a member? </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>

      {/* Benefits Summary */}
      <div className="mt-6 pt-6 border-t border-border">
        <h2 className="text-sm font-medium text-foreground mb-3">
          Member Benefits Include:
        </h2>
        <ul className="space-y-2">
          {[
            'Access to Orange Blossom Special star parties',
            'Use of club telescopes and equipment',
            'Monthly meetings with expert speakers',
            'Hands-on astronomy workshops',
            'Member classifieds marketplace',
          ].map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
