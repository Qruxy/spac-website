'use client';

/**
 * Checkout Flow Component
 *
 * Handles the PayPal subscription creation flow for paid membership tiers.
 * Shows tier details, then redirects to PayPal for payment.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, CreditCard, ArrowLeft,
  Star, Users, GraduationCap, Check, Heart, Gem,
} from 'lucide-react';

const tierInfo: Record<string, {
  name: string;
  price: string;
  period: string;
  apiTier: string;
  icon: typeof Star;
  features: string[];
  description: string;
}> = {
  individual: {
    name: 'Single',
    price: '$30',
    period: '/year',
    apiTier: 'INDIVIDUAL',
    icon: Star,
    description: 'One adult plus any number of minor children',
    features: [
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing privileges',
      'Voting rights in club matters',
      'Member-only events',
      'Classifieds marketplace',
      'Digital membership card',
    ],
  },
  family: {
    name: 'Family',
    price: '$35',
    period: '/year',
    apiTier: 'FAMILY',
    icon: Users,
    description: 'Two adults plus any number of minor children',
    features: [
      'All Single member benefits',
      'Two adult members',
      'Astronomical League membership for all adults',
      'Youth programs access',
    ],
  },
  student: {
    name: 'Student',
    price: 'Free',
    period: '',
    apiTier: 'STUDENT',
    icon: GraduationCap,
    description: 'Full-time students in Pinellas, Pasco, or Hillsborough Counties',
    features: [
      'All member benefits',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
    ],
  },
  patron: {
    name: 'Patron',
    price: '$50',
    period: '/year',
    apiTier: 'PATRON',
    icon: Heart,
    description: 'Please consider Patron membership to help us grow',
    features: [
      'All Single member benefits',
      'Patron recognition in club communications',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
    ],
  },
  benefactor: {
    name: 'Benefactor',
    price: '$100',
    period: '/year',
    apiTier: 'BENEFACTOR',
    icon: Gem,
    description: 'We love our Benefactors — thank you for your generosity',
    features: [
      'All Patron member benefits',
      'Named recognition at OBS star party',
      'Benefactor recognition in club publications',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
    ],
  },
};

export function CheckoutFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = searchParams.get('plan');
  const tier = plan ? tierInfo[plan] : null;

  // Free tiers don't need checkout
  useEffect(() => {
    if (plan === 'free' || plan === 'student') {
      router.replace('/dashboard');
    }
  }, [plan, router]);

  if (!tier || plan === 'free' || plan === 'student') {
    return null;
  }

  if (!tier) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Invalid Plan</h1>
        <p className="text-muted-foreground mb-6">
          The selected membership plan is not available.
        </p>
        <Link
          href="/register"
          className="text-primary hover:underline font-medium"
        >
          Go back to signup
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: tier.apiTier, interval: 'annual' }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to start checkout');
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        setError('No payment URL returned. PayPal may not be configured yet.');
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const TierIcon = tier.icon;

  return (
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <TierIcon className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {tier.name} Membership
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        <p className="mt-2">
          <span className="text-2xl font-bold text-foreground">{tier.price}</span>
          {tier.period && (
            <span className="text-muted-foreground">{tier.period}</span>
          )}
        </p>
      </div>

      {/* Features */}
      <div className="mb-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">
          What you get:
        </h2>
        <ul className="space-y-2">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay with PayPal
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to PayPal to complete your subscription.
        You can cancel anytime from your dashboard.
      </p>

      {/* Skip / Go Back */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back
        </button>
        <span className="text-border">|</span>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </Link>
      </div>
    </>
  );
}
