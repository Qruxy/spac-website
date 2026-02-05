'use client';

/**
 * Event Registration Button Component
 *
 * Handles event registration logic and PayPal checkout redirect.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface EventRegistrationButtonProps {
  eventId: string;
  eventSlug: string;
  isFree: boolean;
  isFull: boolean;
  isRegistered: boolean;
  registrationStatus?: string | null;
  isLoggedIn: boolean;
}

export function EventRegistrationButton({
  eventId,
  eventSlug,
  isFree,
  isFull,
  isRegistered,
  registrationStatus,
  isLoggedIn,
}: EventRegistrationButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/events/${eventSlug}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isFree) {
        // Free event - direct registration
        const response = await fetch('/api/events/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Registration failed');
        }

        router.push(`/my-events?registered=${eventId}`);
        router.refresh();
      } else {
        // Paid event - redirect to PayPal checkout
        const response = await fetch('/api/checkout/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  // Already registered
  if (isRegistered) {
    return (
      <div className="space-y-3">
        <div
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium ${
            registrationStatus === 'CONFIRMED'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {registrationStatus === 'CONFIRMED' ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              You&apos;re Registered!
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              Registration Pending
            </>
          )}
        </div>
        <button
          onClick={() => router.push('/my-events')}
          className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          View My Events
        </button>
      </div>
    );
  }

  // Event is full
  if (isFull) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 font-medium text-muted-foreground cursor-not-allowed"
        >
          <AlertCircle className="h-5 w-5" />
          Event Full
        </button>
        <p className="text-xs text-center text-muted-foreground">
          This event has reached capacity.
          <br />
          Check back later for cancellations.
        </p>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <button
        onClick={handleRegister}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Sign in to Register
      </button>
    );
  }

  // Ready to register
  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : isFree ? (
          'Register Now'
        ) : (
          'Register & Pay'
        )}
      </button>
    </div>
  );
}
