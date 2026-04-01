'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle, Stars } from 'lucide-react';

export default function ClaimAccountPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/claim-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-5">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Inbox</h1>
        <p className="text-muted-foreground text-sm mb-1">
          We sent a setup link to
        </p>
        <p className="font-semibold text-foreground mb-4">{email}</p>
        <p className="text-muted-foreground text-sm mb-8">
          Click the link in the email to set your password and get instant access to your member dashboard. Link expires in 24 hours.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Didn&apos;t get it? Check your spam folder or{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-primary hover:underline font-medium"
          >
            try again
          </button>.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Stars className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, SPAC Member</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Your account is already here — you just need to set a password.
          Enter your email and we&apos;ll send you a secure link instantly.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending link…
            </>
          ) : (
            'Send Setup Link'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground tracking-wider">Already set up?</span>
        </div>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/forgot-password"
          className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Not a member yet?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Join SPAC
        </Link>
      </p>
    </>
  );
}
