'use client';

/**
 * Registration Page
 *
 * Signup form with membership tier selection.
 * Creates account via /api/auth/register, auto-signs in,
 * then redirects to dashboard (free) or checkout (paid).
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus, Star, Users, GraduationCap, Check,
  Loader2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

const membershipTiers = [
  {
    id: 'INDIVIDUAL',
    name: 'Individual',
    price: '$40',
    period: '/year',
    description: 'Full club benefits for one person',
    icon: Star,
    popular: true,
  },
  {
    id: 'FAMILY',
    name: 'Family',
    price: '$60',
    period: '/year',
    description: 'For the whole household',
    icon: Users,
    popular: false,
  },
  {
    id: 'STUDENT',
    name: 'Student',
    price: '$20',
    period: '/year',
    description: 'For enrolled students',
    icon: GraduationCap,
    popular: false,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'tier' | 'form'>('tier');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Create account (or claim existing migrated account)
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // 2. Auto sign-in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Account created but sign-in failed. Please go to login.');
        setIsLoading(false);
        return;
      }

      // 3. Redirect — claimed accounts go to dashboard, new accounts go to checkout
      if (registerData.claimed) {
        router.push('/dashboard');
      } else if (selectedTier) {
        router.push(`/checkout?plan=${selectedTier.toLowerCase()}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  // Step 1: Tier Selection
  if (step === 'tier') {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Join SPAC</h1>
          <p className="text-muted-foreground mt-2">
            Choose your membership to get started
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {membershipTiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => handleTierSelect(tier.id)}
              className={`relative w-full text-left rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md ${
                tier.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-muted/50'
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
                  <span className="text-lg font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
            </button>
          ))}
        </div>

        {/* Existing member notice */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
          <p className="text-sm text-foreground font-medium mb-1">
            Already a SPAC member?
          </p>
          <p className="text-xs text-muted-foreground">
            If you&apos;re an existing member, select any tier above to set up your
            login password. Your existing membership will be preserved.
          </p>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Have an account already? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h2 className="text-sm font-medium text-foreground mb-3">
            All Members Get:
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

  // Step 2: Account Creation Form
  const tier = membershipTiers.find((t) => t.id === selectedTier);

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        <p className="text-muted-foreground mt-2">
          {tier ? (
            <>
              <span className="text-primary font-medium">{tier.name}</span>
              {' membership \u2014 '}
              <button
                onClick={() => setStep('tier')}
                className="text-primary hover:underline"
              >
                change
              </button>
            </>
          ) : (
            'Fill in your details to get started'
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Create Account & Continue to Payment
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already a member? </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </>
  );
}
