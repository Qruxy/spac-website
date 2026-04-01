'use client';

/**
 * Reset Password / Account Setup Page
 *
 * Handles two flows:
 * 1. Password reset  — ?token=...&email=...
 * 2. First-time setup — ?token=...&email=...&setup=1 (from claim-account flow)
 *
 * After success, auto-logs the user in instead of redirecting to /login.
 */

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Telescope } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const isSetup = searchParams.get('setup') === '1';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const isValidLink = token && email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Password set — auto sign in
      setSuccess(true);
      setSigningIn(true);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        // Sign-in failed for some reason — fall back to login page
        setSigningIn(false);
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isSetup ? 'Welcome to SPAC! 🎉' : 'Password Updated!'}
        </h1>
        <p className="text-muted-foreground mb-2">
          {isSetup
            ? 'Your account is all set. Signing you in now…'
            : 'Your password has been updated. Signing you in…'}
        </p>
        {signingIn && (
          <div className="flex justify-center mt-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {!signingIn && (
          <Link href="/login" className="text-sm text-primary hover:underline mt-4 inline-block">
            Sign in manually
          </Link>
        )}
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
        <p className="text-muted-foreground mb-6">
          This link is missing required information or has already been used. Request a new one below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/claim-account"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            First time setup
          </Link>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Forgot password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        {isSetup && (
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Telescope className="h-7 w-7 text-primary" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground">
          {isSetup ? 'Set Up Your Account' : 'Set New Password'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isSetup
            ? 'Choose a password for your SPAC membership account.'
            : <>Resetting password for <span className="text-foreground font-medium">{email}</span></>}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            {isSetup ? 'Create Password' : 'New Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isSetup ? 'Setting up…' : 'Updating…'}
            </>
          ) : (
            isSetup ? 'Set Password & Sign In' : 'Update Password'
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
