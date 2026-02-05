/**
 * Wallet Buttons Component
 *
 * Client component for adding membership card to Apple/Google Wallet.
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Smartphone, AlertCircle } from 'lucide-react';

interface WalletStatus {
  apple: boolean;
  google: boolean;
}

export function WalletButtons() {
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet availability status on mount
  useEffect(() => {
    fetch('/api/wallet/status')
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({ apple: false, google: false }));
  }, []);

  const handleAppleWallet = async () => {
    setLoading('apple');
    setError(null);

    try {
      const response = await fetch('/api/wallet/apple');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate pass');
      }

      // Download the .pkpass file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spac-membership.pkpass';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to Apple Wallet');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleWallet = async () => {
    setLoading('google');
    setError(null);

    try {
      const response = await fetch('/api/wallet/google');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate pass');
      }

      const data = await response.json();

      if (data.walletLink) {
        // Open Google Wallet link in new tab
        window.open(data.walletLink, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No wallet link received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to Google Wallet');
    } finally {
      setLoading(null);
    }
  };

  // Still loading status
  if (status === null) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white opacity-50"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </button>
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white opacity-50"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </button>
      </div>
    );
  }

  const neitherConfigured = !status.apple && !status.google;

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Apple Wallet Button */}
        <button
          onClick={handleAppleWallet}
          disabled={!status.apple || loading !== null}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            status.apple
              ? 'bg-black text-white hover:bg-black/90'
              : 'bg-black/50 text-white/70 cursor-not-allowed'
          }`}
        >
          {loading === 'apple' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AppleIcon className="h-5 w-5" />
          )}
          {status.apple ? 'Add to Apple Wallet' : 'Apple Wallet (Not Available)'}
        </button>

        {/* Google Wallet Button */}
        <button
          onClick={handleGoogleWallet}
          disabled={!status.google || loading !== null}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            status.google
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600/50 text-white/70 cursor-not-allowed'
          }`}
        >
          {loading === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleWalletIcon className="h-5 w-5" />
          )}
          {status.google ? 'Add to Google Wallet' : 'Google Wallet (Not Available)'}
        </button>
      </div>

      {neitherConfigured && (
        <p className="text-xs text-muted-foreground text-center">
          Digital wallet passes require additional setup. Contact the administrator.
        </p>
      )}
    </div>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleWalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}
