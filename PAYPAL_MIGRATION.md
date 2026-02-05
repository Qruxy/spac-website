# PayPal Migration Documentation

## Overview

This document details the migration from Stripe to PayPal for all payment processing in the SPAC website.

## Summary of Changes

### 1. Environment Variables

**Removed (from `.env.local` and `.env.example`):**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_INDIVIDUAL_MONTHLY`
- `STRIPE_PRICE_INDIVIDUAL_ANNUAL`
- `STRIPE_PRICE_FAMILY_MONTHLY`
- `STRIPE_PRICE_FAMILY_ANNUAL`
- `STRIPE_PRICE_STUDENT_MONTHLY`
- `STRIPE_PRICE_STUDENT_ANNUAL`

**Added:**
- `PAYPAL_CLIENT_ID` - PayPal REST API client ID
- `PAYPAL_CLIENT_SECRET` - PayPal REST API secret
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - Public client ID for frontend SDK
- `PAYPAL_WEBHOOK_ID` - Webhook ID for signature verification
- `PAYPAL_PLAN_INDIVIDUAL_MONTHLY` - Subscription plan for individual monthly
- `PAYPAL_PLAN_INDIVIDUAL_ANNUAL` - Subscription plan for individual annual
- `PAYPAL_PLAN_FAMILY_MONTHLY` - Subscription plan for family monthly
- `PAYPAL_PLAN_FAMILY_ANNUAL` - Subscription plan for family annual
- `PAYPAL_PLAN_STUDENT_ANNUAL` - Subscription plan for student annual
- `PAYPAL_PLAN_DONATION_MONTHLY` - Subscription plan for recurring donations

### 2. Package Changes

**Removed:**
- `stripe` (server-side SDK)
- `@stripe/stripe-js` (client-side SDK)

**Added:**
- No new packages required - using PayPal REST API directly via `fetch()`

### 3. Library Files

**Removed:**
- `/src/lib/stripe/index.ts`
- `/src/lib/stripe/client.ts`
- `/src/lib/stripe/products.ts`

**Added:**
- `/src/lib/paypal/index.ts` - Server-side PayPal API functions
  - `getPayPalAccessToken()` - OAuth2 token management
  - `createPayPalOrder()` - One-time payments
  - `capturePayPalOrder()` - Capture approved payments
  - `getPayPalOrder()` - Get order details
  - `createPayPalSubscription()` - Recurring payments
  - `getPayPalSubscription()` - Get subscription details
  - `cancelPayPalSubscription()` - Cancel subscriptions
  - `verifyPayPalWebhook()` - Webhook signature verification

- `/src/lib/paypal/client.ts` - Client-side utilities
  - `loadPayPalScript()` - Load PayPal JavaScript SDK
  - `getPayPal()` - Get SDK namespace
  - `createPaymentButtonConfig()` - Button config for one-time payments
  - `createSubscriptionButtonConfig()` - Button config for subscriptions

- `/src/lib/paypal/products.ts` - Membership tier configuration
  - Same structure as before, but using `planId` instead of `priceId`

### 4. API Routes Updated

**Donations (`/src/app/api/donations/route.ts`):**
- POST: Creates PayPal order for one-time donations or subscription for recurring
- GET: Handles PayPal redirect to capture the payment

**Event Checkout (`/src/app/api/checkout/event/route.ts`):**
- Creates PayPal order for event registration payments
- New capture endpoint: `/src/app/api/checkout/event/capture/route.ts`

**Membership Checkout (`/src/app/api/checkout/membership/route.ts`):**
- Creates PayPal subscription for membership
- New activation endpoint: `/src/app/api/checkout/membership/activate/route.ts`

**OBS Registration (`/src/app/api/obs/register/route.ts`):**
- Creates PayPal order for OBS registration payments
- New capture endpoint: `/src/app/api/obs/capture/route.ts`

**Billing Portal (`/src/app/api/billing/portal/route.ts`):**
- GET: Returns subscription details
- POST: Returns PayPal subscription management URL
- DELETE: Cancels subscription

**Webhooks:**
- Removed: `/src/app/api/webhooks/stripe/route.ts`
- Added: `/src/app/api/webhooks/paypal/route.ts`
  - Handles subscription and payment events

### 5. Frontend Components Updated

**Donation Form (`/src/app/(public)/donations/donation-form.tsx`):**
- Changed redirect text from "Stripe" to "PayPal"
- Same user flow maintained

**Event Registration Button (`/src/app/(public)/events/[slug]/registration-button.tsx`):**
- No visible changes - still uses the same API

**OBS Registration Form (`/src/app/(public)/obs/obs-registration-form.tsx`):**
- No visible changes - still uses the same API

**Billing Actions (`/src/app/(dashboard)/billing/billing-actions.tsx`):**
- Added "Manage on PayPal" button (external link)
- Added cancel subscription confirmation dialog

**Billing Page (`/src/app/(dashboard)/billing/page.tsx`):**
- Updated to use PayPal subscription fields
- Updated payment method description

### 6. Prisma Schema Changes

**User Model:**
- Added: `paypalSubscriberId` (new column: `paypal_subscriber_id`)
- Kept: `stripeCustomerId` for backward compatibility

**Membership Model:**
- Added: `paypalSubscriptionId` (new column: `paypal_subscription_id`)
- Added: `paypalPlanId` (new column: `paypal_plan_id`)
- Added: `paypalCurrentPeriodEnd` (new column: `paypal_current_period_end`)
- Kept: Stripe fields for backward compatibility

**Payment Model:**
- Added: `paypalOrderId` (new column: `paypal_order_id`)
- Added: `paypalCaptureId` (new column: `paypal_capture_id`)
- Kept: Stripe fields for backward compatibility

**Donation Model:**
- Added: `paypalOrderId` (new column: `paypal_order_id`)
- Added: `paypalSubscriptionId` (new column: `paypal_subscription_id`)
- Kept: `stripeId` for backward compatibility

**ProcessedWebhook Model:**
- Added: `paypalEventId` (new column: `paypal_event_id`)
- Made `stripeEventId` optional for PayPal compatibility

**OBSRegistration Model:**
- Added: `paypalOrderId` (new column: `paypal_order_id`)

## PayPal Setup Instructions

### 1. Create PayPal Developer Account
1. Go to https://developer.paypal.com
2. Log in or create a PayPal Business account
3. Go to Dashboard > My Apps & Credentials

### 2. Create REST API App
1. Click "Create App" under REST API apps
2. Name: "SPAC Website"
3. For sandbox, use sandbox credentials
4. For production, create a live app

### 3. Get Credentials
Copy the Client ID and Secret to your `.env.local`:
```
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-client-id
```

### 4. Create Subscription Plans
Go to https://developer.paypal.com/dashboard/subscriptions/plans and create:

1. **Individual Monthly** ($5/month)
   - Product: "SPAC Individual Membership"
   - Plan: Monthly billing, $5.00 USD
   - Copy Plan ID to `PAYPAL_PLAN_INDIVIDUAL_MONTHLY`

2. **Individual Annual** ($40/year)
   - Same product, annual billing, $40.00 USD
   - Copy Plan ID to `PAYPAL_PLAN_INDIVIDUAL_ANNUAL`

3. **Family Monthly** ($7/month)
   - Product: "SPAC Family Membership"
   - Plan: Monthly billing, $7.00 USD
   - Copy Plan ID to `PAYPAL_PLAN_FAMILY_MONTHLY`

4. **Family Annual** ($60/year)
   - Same product, annual billing, $60.00 USD
   - Copy Plan ID to `PAYPAL_PLAN_FAMILY_ANNUAL`

5. **Student Annual** ($20/year)
   - Product: "SPAC Student Membership"
   - Plan: Annual billing, $20.00 USD
   - Copy Plan ID to `PAYPAL_PLAN_STUDENT_ANNUAL`

### 5. Set Up Webhooks
1. Go to Dashboard > Webhooks
2. Create a new webhook
3. URL: `https://your-domain.com/api/webhooks/paypal`
4. Select events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `PAYMENT.SALE.COMPLETED`
   - `CHECKOUT.ORDER.APPROVED`
5. Copy Webhook ID to `PAYPAL_WEBHOOK_ID`

### 6. Run Database Migration
```bash
npx prisma migrate dev --name add_paypal_fields
npx prisma generate
```

## Payment Flow Changes

### One-Time Payments (Donations, Events, OBS)
**Before (Stripe):**
1. User clicks pay
2. Server creates Stripe Checkout Session
3. User redirected to Stripe-hosted page
4. After payment, webhook confirms payment
5. User redirected to success page

**After (PayPal):**
1. User clicks pay
2. Server creates PayPal Order
3. User redirected to PayPal approval page
4. After approval, user redirected back with order token
5. Server captures payment via `/api/.../capture` endpoint
6. User redirected to success page

### Subscriptions (Memberships)
**Before (Stripe):**
1. User selects membership tier
2. Server creates Stripe Checkout Session with subscription
3. User redirected to Stripe-hosted page
4. After setup, webhooks manage subscription lifecycle

**After (PayPal):**
1. User selects membership tier
2. Server creates PayPal Subscription with pre-created plan
3. User redirected to PayPal approval page
4. After approval, user redirected to activation endpoint
5. Server verifies subscription and activates membership
6. Webhooks handle renewals and cancellations

## Testing

### Sandbox Testing
1. Use sandbox credentials in `.env.local`
2. PayPal provides test buyer accounts at:
   https://developer.paypal.com/dashboard/accounts
3. Test with sandbox buyer email/password

### Test Cards (Sandbox)
PayPal sandbox accepts any card details for testing.

## Rollback Plan

If issues arise, the migration can be rolled back:
1. Restore Stripe environment variables
2. Restore `/src/lib/stripe/` directory from git
3. Restore `/src/app/api/webhooks/stripe/` from git
4. Revert API route changes
5. Update imports in frontend components

The Stripe database fields are preserved for backward compatibility.

## Files Changed Summary

### New Files
- `/src/lib/paypal/index.ts`
- `/src/lib/paypal/client.ts`
- `/src/lib/paypal/products.ts`
- `/src/app/api/checkout/event/capture/route.ts`
- `/src/app/api/checkout/membership/activate/route.ts`
- `/src/app/api/obs/capture/route.ts`
- `/src/app/api/webhooks/paypal/route.ts`
- `/.env.example`
- `/PAYPAL_MIGRATION.md`

### Modified Files
- `/src/app/api/donations/route.ts`
- `/src/app/api/checkout/event/route.ts`
- `/src/app/api/checkout/membership/route.ts`
- `/src/app/api/obs/register/route.ts`
- `/src/app/api/billing/portal/route.ts`
- `/src/app/(public)/donations/donation-form.tsx`
- `/src/app/(public)/events/[slug]/registration-button.tsx`
- `/src/app/(public)/obs/obs-registration-form.tsx`
- `/src/app/(dashboard)/billing/page.tsx`
- `/src/app/(dashboard)/billing/billing-actions.tsx`
- `/prisma/schema.prisma`
- `/package.json`
- `/.env.local`

### Deleted Files
- `/src/lib/stripe/index.ts`
- `/src/lib/stripe/client.ts`
- `/src/lib/stripe/products.ts`
- `/src/app/api/webhooks/stripe/route.ts`
