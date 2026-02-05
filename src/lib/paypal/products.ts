/**
 * PayPal Products Configuration
 *
 * Defines membership tiers and their associated PayPal plan IDs.
 * These IDs should be configured in your PayPal Dashboard.
 */

export type MembershipTier = 'FREE' | 'INDIVIDUAL' | 'FAMILY' | 'STUDENT';

export interface MembershipProduct {
  tier: MembershipTier;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly?: {
      planId: string;
      amount: number;
    };
    annual: {
      planId: string;
      amount: number;
    };
  };
}

/**
 * Membership products configuration
 *
 * Note: Plan IDs should be set in environment variables or
 * created in PayPal Dashboard. These are placeholders.
 */
export const membershipProducts: Record<MembershipTier, MembershipProduct> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    description: 'Perfect for curious beginners',
    features: [
      'Access to public events',
      'Monthly newsletter',
      'Online community access',
    ],
    prices: {
      annual: {
        planId: '', // Free tier doesn't need PayPal
        amount: 0,
      },
    },
  },
  INDIVIDUAL: {
    tier: 'INDIVIDUAL',
    name: 'Individual',
    description: 'Full club benefits for one person',
    features: [
      'All free benefits',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member-only events',
      'Classifieds marketplace',
    ],
    prices: {
      monthly: {
        planId: process.env.PAYPAL_PLAN_INDIVIDUAL_MONTHLY || 'plan_individual_monthly',
        amount: 500, // $5.00/month
      },
      annual: {
        planId: process.env.PAYPAL_PLAN_INDIVIDUAL_ANNUAL || 'plan_individual_annual',
        amount: 4000, // $40.00/year
      },
    },
  },
  FAMILY: {
    tier: 'FAMILY',
    name: 'Family',
    description: 'For the whole household',
    features: [
      'All individual benefits',
      'Up to 5 family members',
      'Family discount on events',
      'Youth programs access',
    ],
    prices: {
      monthly: {
        planId: process.env.PAYPAL_PLAN_FAMILY_MONTHLY || 'plan_family_monthly',
        amount: 700, // $7.00/month
      },
      annual: {
        planId: process.env.PAYPAL_PLAN_FAMILY_ANNUAL || 'plan_family_annual',
        amount: 6000, // $60.00/year
      },
    },
  },
  STUDENT: {
    tier: 'STUDENT',
    name: 'Student',
    description: 'For enrolled students',
    features: [
      'All individual benefits',
      'Valid student ID required',
      'Special student events',
    ],
    prices: {
      annual: {
        planId: process.env.PAYPAL_PLAN_STUDENT_ANNUAL || 'plan_student_annual',
        amount: 2000, // $20.00/year
      },
    },
  },
};

/**
 * Get membership product by tier
 */
export function getMembershipProduct(tier: MembershipTier): MembershipProduct {
  return membershipProducts[tier];
}

/**
 * Get PayPal plan ID for a membership tier and billing interval
 */
export function getMembershipPlanId(
  tier: MembershipTier,
  interval: 'monthly' | 'annual'
): string | null {
  const product = membershipProducts[tier];
  if (interval === 'monthly' && product.prices.monthly) {
    return product.prices.monthly.planId;
  }
  return product.prices.annual.planId || null;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Event pricing types
 */
export interface EventPricing {
  memberPrice: number;
  nonMemberPrice: number;
  familyDiscount?: number;
}

/**
 * Calculate event registration price
 */
export function calculateEventPrice({
  basePricing,
  isMember,
  isFamilyMember,
  quantity = 1,
}: {
  basePricing: EventPricing;
  isMember: boolean;
  isFamilyMember?: boolean;
  quantity?: number;
}): number {
  let unitPrice = isMember ? basePricing.memberPrice : basePricing.nonMemberPrice;

  if (isFamilyMember && basePricing.familyDiscount) {
    unitPrice = Math.round(unitPrice * (1 - basePricing.familyDiscount / 100));
  }

  return unitPrice * quantity;
}
