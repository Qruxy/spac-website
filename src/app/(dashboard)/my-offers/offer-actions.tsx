/**
 * Offer Actions Component
 *
 * Client component for responding to offers.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowRightLeft, Trash2, Loader2 } from 'lucide-react';

interface OfferActionsProps {
  offerId: string;
  userRole: 'buyer' | 'seller';
  status: string;
  currentAmount: number;
}

export function OfferActions({
  offerId,
  userRole,
  status,
  currentAmount,
}: OfferActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const handleAction = async (action: 'accept' | 'reject' | 'counter' | 'withdraw') => {
    setError(null);
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = { action };

      if (action === 'counter') {
        if (!counterAmount || parseFloat(counterAmount) <= 0) {
          setError('Please enter a valid counter amount');
          setIsLoading(false);
          return;
        }
        body.counterAmount = parseFloat(counterAmount);
        body.message = counterMessage || undefined;
      }

      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to offer');
      }

      router.refresh();
      setShowCounter(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Seller actions on PENDING offers
  if (userRole === 'seller' && status === 'PENDING') {
    return (
      <div className="space-y-3">
        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {showCounter ? (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Counter Amount ($)</label>
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder={`Current: $${currentAmount.toLocaleString()}`}
                min={1}
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message (optional)</label>
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Add a message with your counter offer..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('counter')}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    Send Counter
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCounter(false)}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction('accept')}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Accept
                </>
              )}
            </button>
            <button
              onClick={() => setShowCounter(true)}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Counter
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    );
  }

  // Seller actions on COUNTERED offers (waiting for buyer response)
  if (userRole === 'seller' && status === 'COUNTERED') {
    return (
      <p className="text-sm text-muted-foreground">
        Waiting for buyer to respond to your counter offer...
      </p>
    );
  }

  // Buyer actions on PENDING offers
  if (userRole === 'buyer' && status === 'PENDING') {
    return (
      <div className="space-y-2">
        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Waiting for seller response...</p>
          <button
            onClick={() => handleAction('withdraw')}
            disabled={isLoading}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Withdraw
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Buyer actions on COUNTERED offers
  if (userRole === 'buyer' && status === 'COUNTERED') {
    return (
      <div className="space-y-3">
        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        <p className="text-sm font-medium text-blue-400">
          The seller has countered your offer. Accept or withdraw?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction('accept')}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                Accept Counter
              </>
            )}
          </button>
          <button
            onClick={() => handleAction('withdraw')}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Withdraw
          </button>
        </div>
      </div>
    );
  }

  return null;
}
