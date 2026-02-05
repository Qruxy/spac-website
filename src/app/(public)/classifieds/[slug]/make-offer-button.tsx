/**
 * Make Offer Button Component
 *
 * Displays a button that opens a modal to submit an offer on a listing.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, DollarSign, Send, Loader2 } from 'lucide-react';

interface MakeOfferButtonProps {
  listingSlug: string;
  listingTitle: string;
  askingPrice: number;
}

export function MakeOfferButton({ listingSlug, listingTitle, askingPrice }: MakeOfferButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/listings/${listingSlug}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit offer');
      }

      // Success - close modal and refresh
      setIsOpen(false);
      setAmount('');
      setMessage('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedOffers = [
    { label: '10% off', value: Math.round(askingPrice * 0.9) },
    { label: '15% off', value: Math.round(askingPrice * 0.85) },
    { label: '20% off', value: Math.round(askingPrice * 0.8) },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <DollarSign className="h-5 w-5" />
        Make an Offer
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Make an Offer</h2>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Item</p>
                <p className="font-medium line-clamp-2">{listingTitle}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                <p className="text-xl font-bold text-primary">
                  ${askingPrice.toLocaleString()}
                </p>
              </div>

              {/* Suggested Offers */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Quick Offers</p>
                <div className="flex gap-2">
                  {suggestedOffers.map((offer) => (
                    <button
                      key={offer.label}
                      type="button"
                      onClick={() => setAmount(offer.value.toString())}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        amount === offer.value.toString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="block font-medium">${offer.value.toLocaleString()}</span>
                      <span className="block text-xs text-muted-foreground">{offer.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label htmlFor="offer-amount" className="block text-sm font-medium mb-1">
                  Your Offer *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="offer-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Math.round(((askingPrice - parseFloat(amount)) / askingPrice) * 100)}% below
                    asking price
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="offer-message" className="block text-sm font-medium mb-1">
                  Message (optional)
                </label>
                <textarea
                  id="offer-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {message.length}/500
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Offer
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Your offer will expire in 7 days if not responded to.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
