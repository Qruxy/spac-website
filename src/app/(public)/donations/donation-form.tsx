'use client';

/**
 * Donation Form Component
 *
 * Interactive donation form with tier selection, custom amounts,
 * and one-time vs recurring toggle. Uses PayPal for payment processing.
 */

import { useState } from 'react';
import { Heart, Star, Award, Check, Loader2, Sparkles, type LucideIcon } from 'lucide-react';
// Direct imports to avoid barrel export bundle bloat
import { SpotlightCard } from '@/components/animated/spotlight-card';
import { StarBorder } from '@/components/animated/star-border';
import { GradientText } from '@/components/animated/gradient-text';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  iconName: 'Heart' | 'Star' | 'Award';
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
  description: string;
}

interface DonationFormProps {
  tiers: DonationTier[];
}

// Map icon names to components (icons can't be passed from server to client)
const iconMap: Record<string, LucideIcon> = {
  Heart: Heart,
  Star: Star,
  Award: Award,
};

export function DonationForm({ tiers }: DonationFormProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setSelectedTier(null);
    setError(null);
  };

  const getSelectedAmount = (): number => {
    if (selectedTier) {
      const tier = tiers.find((t) => t.id === selectedTier);
      return tier?.amount || 0;
    }
    return parseInt(customAmount) || 0;
  };

  const getTierFromAmount = (amount: number): string | null => {
    if (amount >= 500) return 'BENEFACTOR';
    if (amount >= 100) return 'PATRON';
    if (amount >= 25) return 'SUPPORTER';
    return null;
  };

  const handleSubmit = async () => {
    const amount = getSelectedAmount();

    if (amount < 5) {
      setError('Minimum donation amount is $5');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          recurring: isRecurring,
          tier: selectedTier?.toUpperCase() || getTierFromAmount(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to PayPal Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const amount = getSelectedAmount();

  return (
    <div className="space-y-10">
      {/* One-time vs Recurring Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-muted/50 p-1 border border-border">
          <button
            onClick={() => setIsRecurring(false)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
              !isRecurring
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            One-time
          </button>
          <button
            onClick={() => setIsRecurring(true)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
              isRecurring
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = iconMap[tier.iconName] || Heart;
          const isSelected = selectedTier === tier.id;

          return (
            <SpotlightCard
              key={tier.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              spotlightColor={
                tier.id === 'supporter'
                  ? 'rgba(244, 63, 94, 0.15)'
                  : tier.id === 'patron'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(139, 92, 246, 0.15)'
              }
            >
              <div
                className="p-6 h-full flex flex-col"
                onClick={() => handleTierSelect(tier.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-xl ${tier.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`h-6 w-6 ${tier.color}`} />
                  </div>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Tier Info */}
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                {/* Amount */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    ${tier.amount}
                  </span>
                  {isRecurring && (
                    <span className="text-muted-foreground text-sm">/month</span>
                  )}
                </div>

                {/* Benefits */}
                <ul className="space-y-2 mt-auto">
                  {tier.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className={`h-4 w-4 ${tier.color} flex-shrink-0 mt-0.5`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Custom Amount */}
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-foreground mb-2 text-center">
          Or enter a custom amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder="Enter amount"
            className={`w-full pl-8 pr-4 py-4 rounded-xl border ${
              customAmount && !selectedTier
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border'
            } bg-card text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
          />
          {isRecurring && customAmount && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              /month
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Minimum donation: $5
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex flex-col items-center gap-4">
        <StarBorder
          as="button"
          onClick={handleSubmit}
          disabled={isLoading || amount < 5}
          className={`text-lg font-semibold ${
            isLoading || amount < 5 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          color="#818cf8"
          speed="4s"
        >
          <span className="flex items-center gap-2 px-4">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {amount >= 5 ? (
                  <>
                    Donate ${amount}
                    {isRecurring && '/month'}
                  </>
                ) : (
                  'Select an amount'
                )}
              </>
            )}
          </span>
        </StarBorder>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          You&apos;ll be redirected to PayPal for secure payment processing.
          All donations are tax-deductible.
        </p>
      </div>
    </div>
  );
}
