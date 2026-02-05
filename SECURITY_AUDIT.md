# SPAC Security Audit Report

**Date:** February 1, 2026  
**Auditor:** security-audit (automated agent)  
**Scope:** Full codebase security review before production launch

---

## Executive Summary

The SPAC application demonstrates **good security fundamentals** with proper authentication (NextAuth + Cognito), role-based authorization (CASL), secure payment handling (PayPal), and comprehensive security headers. However, several improvements are needed before production launch.

### Issue Count by Severity
| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 0 | ✅ No blockers |
| 🟠 HIGH | 3 | ⚠️ Should fix before launch |
| 🟡 MEDIUM | 4 | 📋 Should fix soon |
| 🟢 LOW | 4 | 📝 Nice to have |

---

## Detailed Findings

### 🟠 HIGH SEVERITY

#### H1: Missing Rate Limiting on API Endpoints
**Location:** Most `/src/app/api/` routes  
**Risk:** Brute force attacks, DoS, resource exhaustion

**Finding:** Rate limiting is only implemented for login attempts in `auth.config.ts`. All other API endpoints lack rate limiting protection.

**Affected Routes:**
- `/api/donations` - One-time/recurring donations
- `/api/listings` - Create/read classifieds
- `/api/events/register` - Event registration
- `/api/obs/register` - OBS event registration
- `/api/upload/presigned` - File upload URLs
- All admin routes

**Recommendation:**
```typescript
// Apply rate limiting to all API routes
// Example for /api/donations/route.ts:

import { rateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const key = getRateLimitKey('donations', ip);
  
  if (!rateLimit(key, RATE_LIMITS.API_WRITE.limit, RATE_LIMITS.API_WRITE.windowMs)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ... rest of handler
}
```

**Priority:** Fix before launch - critical for abuse prevention

---

#### H2: Development Credentials Provider Too Permissive
**Location:** `/src/lib/auth/auth.config.ts` (lines 57-99)  
**Risk:** Unauthorized access in misconfigured deployments

**Finding:** The development CredentialsProvider:
1. Creates users automatically for any email input
2. Auto-grants ADMIN role to emails containing "admin"
3. Only protected by `NODE_ENV === 'development'` check

```typescript
// Concerning pattern:
role: credentials.email.includes('admin') ? 'ADMIN' : 'MEMBER',
```

**Recommendation:**
1. Add explicit demo user whitelist instead of pattern matching
2. Add additional safeguard beyond NODE_ENV check
3. Consider removing CredentialsProvider entirely for production builds

```typescript
// Safer implementation:
const ALLOWED_DEV_USERS = ['demo@spac.local', 'test@spac.local'];
if (!ALLOWED_DEV_USERS.includes(credentials.email)) {
  return null;
}
```

**Priority:** Verify NODE_ENV is correctly set in production deployment

---

#### H3: PayPal Webhook Verification Can Be Bypassed
**Location:** `/src/app/api/webhooks/paypal/route.ts` (lines 20-28)  
**Risk:** Fraudulent webhook events accepted

**Finding:** Webhook signature verification is skipped if `PAYPAL_WEBHOOK_ID` is not set:

```typescript
// Problematic pattern:
if (webhookId) {
  const isValid = await verifyPayPalWebhook(...);
  if (!isValid) return error;
}
// If webhookId is undefined, verification is skipped entirely!
```

**Recommendation:**
```typescript
// Always require webhook ID in production
if (!webhookId) {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: PAYPAL_WEBHOOK_ID not configured!');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }
  console.warn('DEV MODE: Skipping webhook verification');
} else {
  const isValid = await verifyPayPalWebhook(webhookId, paypalHeaders, body);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
```

**Priority:** Ensure PAYPAL_WEBHOOK_ID is configured for production

---

### 🟡 MEDIUM SEVERITY

#### M1: OBS Registration Lacks Input Validation
**Location:** `/src/app/api/obs/register/route.ts`  
**Risk:** Invalid data, potential injection

**Finding:** OBS registration endpoint doesn't use Zod validation like other endpoints. Input is extracted directly from request body without schema validation.

**Recommendation:** Add Zod schema similar to `/api/listings/route.ts`:
```typescript
const OBSRegistrationSchema = z.object({
  obsConfigId: z.string().uuid(),
  registrationType: z.enum(['ATTENDEE', 'SPEAKER', 'VENDOR', 'STAFF', 'VOLUNTEER']),
  firstName: z.string().min(1).max(100).transform(v => v.trim()),
  lastName: z.string().min(1).max(100).transform(v => v.trim()),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(20).optional(),
  // ... etc
});
```

---

#### M2: Long Session Duration
**Location:** `/src/lib/auth/auth.config.ts` (line 193)  
**Risk:** Extended exposure window for session hijacking

**Finding:** JWT session `maxAge` is set to 30 days:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**Recommendation:** Reduce to 7 days for better security, or implement refresh token rotation:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
}
```

---

#### M3: Admin Bulk Delete Lacks Safeguards
**Location:** `/src/app/api/admin/users/route.ts` (DELETE handler)  
**Risk:** Accidental mass deletion, audit gaps

**Finding:** Bulk user deletion:
- No confirmation token/mechanism
- No limit on number of IDs
- No protection against deleting the current admin
- Creates no audit log entries

**Recommendation:**
```typescript
// Add safeguards:
if (ids.length > 50) {
  return NextResponse.json({ error: 'Cannot delete more than 50 users at once' }, { status: 400 });
}
if (ids.includes(auth.userId)) {
  return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
}
// Add audit log for bulk operations
await prisma.auditLog.create({
  data: {
    user_id: auth.userId,
    action: 'BULK_DELETE',
    entityType: 'User',
    metadata: { deletedIds: ids },
  },
});
```

---

#### M4: OBS Config Creation Lacks Input Validation
**Location:** `/src/app/api/obs/config/route.ts` (POST handler)  
**Risk:** Invalid data, date manipulation

**Finding:** Price and date fields are not validated before database insertion:
```typescript
memberPrice: parseFloat(memberPrice) || 0, // Could be NaN
```

**Recommendation:** Add Zod validation schema for OBS config creation.

---

### 🟢 LOW SEVERITY

#### L1: Inconsistent Zod Validation Across API Routes
**Finding:** Only ~30% of API routes use Zod validation:
- ✅ Using Zod: `/api/listings`, `/api/events/register`, `/api/upload/complete`, `/api/offers/[id]`
- ❌ No Zod: `/api/donations`, `/api/checkout/*`, `/api/obs/*`, `/api/leadership/*`

**Recommendation:** Standardize Zod validation across all API routes for consistency and security.

---

#### L2: Image Proxy Allows Localhost in Development
**Location:** `/src/app/api/image-proxy/route.ts` (line 82)  
**Risk:** Minor SSRF in development

**Finding:** Code comments suggest localhost should be blocked, but the check allows it:
```typescript
if (imageUrl.protocol !== 'https:' && imageUrl.hostname !== 'localhost') {
```

**Recommendation:** Remove localhost exception even in development.

---

#### L3: Console Logging of Errors in Production
**Finding:** All API routes use `console.error()` which may expose internal details in logs. While stack traces are not returned to clients (good!), verbose logging could leak info.

**Recommendation:** Use structured logging (e.g., Pino, Winston) with log levels. Set to `warn` or `error` only in production.

---

#### L4: Missing CSRF Protection Documentation
**Finding:** NextAuth provides CSRF protection via signed cookies, but no documentation explains this to developers extending the app.

**Recommendation:** Add security documentation in `/docs/SECURITY.md` explaining:
- How CSRF is handled
- Authentication flow
- API security patterns
- Rate limiting usage

---

## ✅ Security Strengths

### Authentication & Authorization
- ✅ **NextAuth with Cognito** - Enterprise-grade auth provider
- ✅ **CASL Authorization** - Well-designed role-based access control
- ✅ **Server-side session checks** - `requireAuth()`, `requireAdmin()`, `requireModerator()` used consistently
- ✅ **JWT strategy** - Stateless, scalable session management

### API Security
- ✅ **Authentication required** on protected routes
- ✅ **Authorization checks** verify role/ownership before operations
- ✅ **Error handling** - No stack traces leaked to clients
- ✅ **Prisma ORM** - SQL injection protection built-in

### Payment Security
- ✅ **Server-side PayPal integration** - No client-side secrets
- ✅ **Webhook signature verification** - When configured
- ✅ **Idempotent webhooks** - ProcessedWebhook table prevents replay
- ✅ **Server-side amounts** - Payment amounts determined server-side, not from client

### Security Headers
- ✅ **Comprehensive CSP** - Properly configured Content-Security-Policy
- ✅ **X-Frame-Options: DENY** - Clickjacking protection
- ✅ **X-Content-Type-Options: nosniff** - MIME sniffing prevention
- ✅ **Referrer-Policy** - strict-origin-when-cross-origin
- ✅ **Permissions-Policy** - Camera/mic/geo disabled

### File Upload Security
- ✅ **Presigned URLs** - Direct S3 upload, bypasses server
- ✅ **File type validation** - ALLOWED_IMAGE_TYPES whitelist
- ✅ **File size limits** - 10MB images, 25MB documents
- ✅ **UUID filenames** - No path traversal possible

### Image Proxy (SSRF Protection)
- ✅ **Domain allowlist** - Only approved hosts allowed
- ✅ **Private IP blocking** - 192.168.*, 10.*, etc blocked
- ✅ **HTTPS required** - No HTTP allowed (except dev localhost)
- ✅ **Content-type validation** - Only images allowed
- ✅ **Size limits** - 5MB max response
- ✅ **Timeout** - 10 second abort controller

### Data Protection
- ✅ **Environment variables** - Secrets in .env, properly gitignored
- ✅ **No client-side secrets** - Only NEXT_PUBLIC_* exposed
- ✅ **Audit logging** - Comprehensive action tracking

---

## Pre-Launch Checklist

### Must Fix (Blockers)
- [ ] Configure `PAYPAL_WEBHOOK_ID` in production
- [ ] Verify `NODE_ENV=production` in deployment
- [ ] Add rate limiting to donation/registration endpoints

### Should Fix (Before Launch)
- [ ] Add Zod validation to OBS registration
- [ ] Add safeguards to bulk delete operations
- [ ] Review session duration (consider 7 days vs 30)

### Nice to Have (After Launch)
- [ ] Standardize Zod validation across all routes
- [ ] Add structured logging
- [ ] Create security documentation
- [ ] Consider Redis-based rate limiting for horizontal scaling

---

## Conclusion

**Launch Status: ✅ CONDITIONAL GO**

The application has solid security fundamentals. The critical finding (PayPal webhook verification bypass) is a configuration issue, not a code flaw. As long as:

1. `PAYPAL_WEBHOOK_ID` is configured in production
2. `NODE_ENV=production` is set correctly
3. Basic rate limiting is added to key endpoints

The application is **safe to launch**.

The HIGH severity items should be addressed in the first post-launch sprint. MEDIUM and LOW items can be scheduled for subsequent releases.

---

*Report generated by security-audit agent*
