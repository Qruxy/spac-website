'use client';

/**
 * Login Form Component
 *
 * Contains the actual login form logic with useSearchParams.
 * Separated from page.tsx to allow proper Suspense wrapping.
 * Supports demo mode for static GitHub Pages deployment.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { demoLogin } from '@/lib/demo-auth';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isDemoMode) {
      const success = demoLogin(email, password);
      if (success) {
        router.push(callbackUrl);
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
      return;
    }

    // Production: use NextAuth
    const { signIn } = await import('next-auth/react');
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setIsLoading(false);
    } else {
      router.push(callbackUrl);
    }
  };

  const handleCognitoLogin = async () => {
    if (isDemoMode) return;
    setIsLoading(true);
    setError('');
    const { signIn } = await import('next-auth/react');
    await signIn('cognito', { callbackUrl });
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to your SPAC account
        </p>
      </div>

      {/* Error Display */}
      {(error || urlError) && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            {error || (urlError === 'OAuthSignin' ? 'Could not connect to authentication service' : 'Authentication failed')}
          </span>
        </div>
      )}

      {/* Cognito Login Button - hidden in demo mode */}
      {!isDemoMode && (
        <button
          onClick={handleCognitoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          Sign in with SPAC Account
        </button>
      )}

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-4 rounded-md bg-primary/10 border border-primary/20 p-3 text-sm text-primary">
          <p className="font-medium">Demo Mode</p>
          <p className="text-muted-foreground mt-1">
            Username: <code className="text-primary">demo</code> &middot; Password: <code className="text-primary">Sp@C2025!</code>
          </p>
        </div>
      )}

      {/* Credentials Form */}
      <>
        {!isDemoMode && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign in with credentials
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              isDemoMode
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </>

      {/* Sign Up Link */}
      {!isDemoMode && (
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            Join SPAC
          </Link>
        </div>
      )}
    </>
  );
}
