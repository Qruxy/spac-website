'use client';

/**
 * Checkout Page
 *
 * Initiates PayPal subscription for paid membership tiers.
 * Reads ?plan= query param, calls checkout API, redirects to PayPal.
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CheckoutFlow } from './checkout-flow';

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-3">Preparing checkout...</p>
        </div>
      }
    >
      <CheckoutFlow />
    </Suspense>
  );
}
