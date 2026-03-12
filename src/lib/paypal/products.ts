/**
 * PayPal Products Configuration
 *
 * Membership tiers match the current SPAC site 1:1:
 *   Student   — Free (full-time students in Pinellas/Pasco/Hillsborough)
 *   Single    — $30/yr  (1 adult + minor children)
 *   Family    — $35/yr  (2 adults + minor children)
 *   Patron    — $50/yr
 *   Benefactor — $100/yr
 */

export type MembershipTier = 'FREE' | 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'PATRON' | 'BENEFACTOR';

export interface MembershipProduct {
  tier: MembershipTier;
  /** Display name shown in the UI */
  displayName: string;
  description: string;
  features: string[];
  /** Annual price in USD cents. 0 = free. */
  annualAmountCents: number;
  paypalPlanId: string | null;
}

export const membershipProducts: Record<MembershipTier, MembershipProduct> = {
  FREE: {
    tier: 'FREE',
    displayName: 'Free',
    description: 'Browse public events and newsletters',
    features: [
      'Access to public events',
      'Monthly newsletter',
      'SPAC community access',
    ],
    annualAmountCents: 0,
    paypalPlanId: null,
  },
  STUDENT: {
    tier: 'STUDENT',
    displayName: 'Student',
    description: 'Full-time students in Pinellas, Pasco, or Hillsborough Counties — free!',
    features: [
      'All member benefits',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
      'Valid through expected graduation date',
    ],
    annualAmountCents: 0,
    paypalPlanId: null, // Free — no PayPal required
  },
  INDIVIDUAL: {
    tier: 'INDIVIDUAL',
    displayName: 'Single',
    description: 'One adult plus any number of minor children',
    features: [
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member-only events',
      'Member classifieds marketplace',
      'Digital membership card',
    ],
    annualAmountCents: 3000, // $30/yr
    paypalPlanId: process.env.PAYPAL_PLAN_INDIVIDUAL_ANNUAL || null,
  },
  FAMILY: {
    tier: 'FAMILY',
    displayName: 'Family',
    description: 'Two adults plus any number of minor children',
    features: [
      'All Single member benefits',
      'Two adult members',
      'Astronomical League membership for all adults',
      'Youth programs access',
    ],
    annualAmountCents: 3500, // $35/yr
    paypalPlanId: process.env.PAYPAL_PLAN_FAMILY_ANNUAL || null,
  },
  PATRON: {
    tier: 'PATRON',
    displayName: 'Patron',
    description: 'Help us grow — please consider Patron membership',
    features: [
      'All Single member benefits',
      'Patron recognition in club communications',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
    ],
    annualAmountCents: 5000, // $50/yr
    paypalPlanId: process.env.PAYPAL_PLAN_PATRON_ANNUAL || null,
  },
  BENEFACTOR: {
    tier: 'BENEFACTOR',
    displayName: 'Benefactor',
    description: 'We love our Benefactors — thank you for your generosity',
    features: [
      'All Patron member benefits',
      'Benefactor recognition in club publications',
      'Named recognition at OBS star party',
      'Astronomical League membership',
      'OBS star party access',
      'Equipment borrowing',
      'Voting rights',
      'Member classifieds',
    ],
    annualAmountCents: 10000, // $100/yr
    paypalPlanId: process.env.PAYPAL_PLAN_BENEFACTOR_ANNUAL || null,
  },
};

/** Tiers shown on the registration/join page, in display order */
export const PUBLIC_TIERS: MembershipTier[] = [
  'STUDENT',
  'INDIVIDUAL',
  'FAMILY',
  'PATRON',
  'BENEFACTOR',
];

export function getMembershipProduct(tier: MembershipTier): MembershipProduct {
  return membershipProducts[tier];
}

export function getMembershipPlanId(tier: MembershipTier): string | null {
  return membershipProducts[tier]?.paypalPlanId ?? null;
}

export function formatPrice(amountCents: number): string {
  if (amountCents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

/**
 * Returns true if this tier requires PayPal payment.
 */
export function tierRequiresPayment(tier: MembershipTier): boolean {
  return membershipProducts[tier].annualAmountCents > 0;
}

/**
 * Event pricing types
 */
export interface EventPricing {
  memberPrice: number;
  nonMemberPrice: number;
  familyDiscount?: number;
}

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
