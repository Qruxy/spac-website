'use client';

/**
 * Login Page
 *
 * Handles user authentication via Cognito or development credentials.
 * Uses Suspense boundary for useSearchParams as required by Next.js 14.
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginForm } from './login-form';

function LoginSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-2">Loading...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
