'use client';

/**
 * Billing Actions Component
 *
 * Client component for billing-related actions like
 * upgrading membership and managing subscription via PayPal.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Settings, ExternalLink, XCircle } from 'lucide-react';

interface BillingActionsProps {
  hasSubscription: boolean;
  isActive: boolean;
  currentTier: string;
  showManageOnly?: boolean;
}

export function BillingActions({
  hasSubscription,
  isActive,
  currentTier,
  showManageOnly,
}: BillingActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get portal URL');
      }

      const { url, message } = await response.json();
      if (url) {
        // Open PayPal subscription management in new tab
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      router.refresh();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancel error:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setSelectedTier(tier);
    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: 'annual' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  if (showManageOnly && hasSubscription) {
    return (
      <button
        onClick={handleManageSubscription}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ExternalLink className="h-4 w-4" />
            Manage on PayPal
          </>
        )}
      </button>
    );
  }

  // Cancel confirmation modal
  if (showCancelConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Cancel Subscription?
          </h3>
          <p className="text-muted-foreground mb-4">
            Your membership will remain active until the end of your current billing period.
            You can resubscribe at any time.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Yes, Cancel'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {hasSubscription && (
        <>
          <button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isLoading && !selectedTier ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Manage on PayPal
              </>
            )}
          </button>
          {isActive && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}
        </>
      )}

      {(!isActive || currentTier === 'FREE') && (
        <div className="flex gap-2">
          {currentTier !== 'INDIVIDUAL' && (
            <button
              onClick={() => handleUpgrade('INDIVIDUAL')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading && selectedTier === 'INDIVIDUAL' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Upgrade to Individual
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
