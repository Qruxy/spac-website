# Security Hardening - February 5, 2026

## Changes Made

### 1. Rate Limiting Added to Critical Endpoints ✅

**`/api/donations/route.ts`**
- Added rate limiting using existing `RATE_LIMITS.API_WRITE` (20 requests/minute per IP)
- Added Zod validation for all input fields
- Removed redundant manual validation

**`/api/obs/register/route.ts`**
- Added rate limiting (20 requests/minute per IP)
- Added comprehensive Zod schema with:
  - Email normalization (lowercase + trim)
  - Name sanitization
  - T-shirt size validation (enum)
  - Field length limits
  - Proper null handling

### 2. PayPal Webhook Verification Fixed ✅

**`/api/webhooks/paypal/route.ts`**
- **CRITICAL FIX**: Webhook verification is now REQUIRED in production
- If `PAYPAL_WEBHOOK_ID` is not set:
  - In production: Returns 500 error
  - In development: Logs warning and continues (for testing)
- Prevents fraudulent webhook events from being accepted in production

### 3. Dev Credentials Provider Secured ✅

**`/lib/auth/auth.config.ts`**
- **FIXED**: Removed auto-creation of users with admin pattern matching
- Previously: Any email containing "admin" got ADMIN role automatically
- Now: Only existing database users can log in via dev credentials
- Demo user (`demo@spac.local`) with explicit password still works

## What Tyler Needs to Do

### Before Production Launch

1. **Set environment variables in production:**
   ```
   NODE_ENV=production
   PAYPAL_CLIENT_ID=<your-paypal-client-id>
   PAYPAL_CLIENT_SECRET=<your-paypal-secret>
   PAYPAL_WEBHOOK_ID=<your-webhook-id>  # CRITICAL - must be set!
   ```

2. **Create PayPal subscription plans** (see PAYPAL_MIGRATION.md):
   - Individual Monthly ($5/month)
   - Individual Annual ($40/year)
   - Family Monthly ($7/month)
   - Family Annual ($60/year)
   - Student Annual ($20/year)

3. **Run database migration:**
   ```bash
   cd projects/spac-website
   npx prisma db push
   npx ts-node prisma/migrate-legacy.ts
   ```

## PayPal Foundation Status

PayPal is **fully integrated** in the codebase. What you need:

| Item | Status | Notes |
|------|--------|-------|
| PayPal SDK integration | ✅ Done | `src/lib/paypal/` |
| One-time payments | ✅ Done | Donations, events, OBS |
| Subscriptions | ✅ Done | Membership tiers |
| Webhook handler | ✅ Done | `src/app/api/webhooks/paypal/` |
| Payment capture flows | ✅ Done | All endpoints |
| **API credentials** | ❌ Needed | From PayPal Business account |
| **Subscription plan IDs** | ❌ Needed | Create in PayPal Dashboard |
| **Webhook ID** | ❌ Needed | Create webhook in PayPal Dashboard |

## Files Changed

```
src/app/api/donations/route.ts
src/app/api/obs/register/route.ts
src/app/api/webhooks/paypal/route.ts
src/lib/auth/auth.config.ts
prisma/migrate-legacy.ts
```

---
*Hardened by JayGo 🗡️*
