# Admin CRUD QA Test Report

**Date:** February 1, 2026
**Tester:** Automated QA (OpenClaw Subagent)
**Environment:** Development (localhost:3000)
**Database:** Supabase (PostgreSQL via Prisma)

---

## Executive Summary

⚠️ **CRITICAL ISSUES FOUND** - Multiple blocking bugs discovered during testing that prevent full admin functionality testing.

### Quick Stats
| Category | Tested | Passed | Failed | Blocked |
|----------|--------|--------|--------|---------|
| Events | 4 | 2 | 0 | 2 |
| Listings | 0 | 0 | 0 | All (blocked) |
| Media | 0 | 0 | 0 | All (blocked) |
| Board Members | 0 | 0 | 0 | All (blocked) |
| Documents | 0 | 0 | 0 | All (blocked) |

---

## 🔴 Critical Bugs Found

### BUG-001: Dynamic Routes Return 404 (CRITICAL)
**Severity:** P0 - Blocker
**Component:** Next.js App Router
**Affected Routes:** 
- `/api/admin/events/[id]`
- `/api/admin/listings/[id]`
- `/api/admin/board-members/[id]`
- All other `[id]` dynamic routes

**Description:**
Dynamic route parameters are not being resolved. When calling `GET /api/admin/events/{id}`, the server returns a 404 error:
```
PageNotFoundError: Cannot find module for page: /api/admin/events/[id]/route
```

**Reproduction Steps:**
1. Login as admin user (demo/Sp@C2025!)
2. Call `GET http://localhost:3000/api/admin/events/90cea809-4319-4acf-9de4-d9a42610a8c2`
3. Returns 404 HTML page instead of JSON

**Expected:** JSON response with event details
**Actual:** 404 HTML error page

**Root Cause:** Appears to be a Next.js 14 compilation issue with the `.next/cache` or module resolution. The `[id]` folder exists at `src/app/api/admin/events/[id]/route.ts` but isn't being compiled correctly.

**Impact:** 
- Cannot update individual records
- Cannot delete individual records  
- Cannot fetch individual record details
- Admin panel likely non-functional

**Recommended Fix:**
1. Clear `.next` and `node_modules/.cache` directories
2. Check Next.js version compatibility
3. Verify route file exports are correct
4. Consider rebuilding from scratch with `npm run build`

---

### BUG-002: Module Loading Errors on API Routes
**Severity:** P0 - Blocker
**Component:** Next.js Webpack

**Description:**
The API routes are failing to compile with MODULE_NOT_FOUND errors:
```
Error: Cannot find module './main-0b15ef93ddf5b12a.js'
```

**Impact:** Public API endpoints intermittently fail

---

### BUG-003: Development Server Instability
**Severity:** P1 - Critical
**Component:** Next.js Dev Server

**Description:**
The development server becomes unresponsive after multiple requests, requires restart, and shows compilation hanging issues.

---

## Test Results Detail

### 1. Events CRUD

#### ✅ TC-EVT-001: Create Event (PASS)
**Endpoint:** `POST /api/admin/events`
**Test Data:**
```json
{
  "title": "QA Test Event - Meteor Shower Watch",
  "description": "A test event created by QA automation",
  "type": "STAR_PARTY",
  "status": "PUBLISHED",
  "startDate": "2026-03-15T22:00:00Z",
  "endDate": "2026-03-16T03:00:00Z",
  "locationName": "QA Test Location",
  "capacity": 50,
  "isFreeEvent": true
}
```
**Expected:** Event created with unique slug
**Actual:** Event created successfully
```json
{
  "id": "90cea809-4319-4acf-9de4-d9a42610a8c2",
  "slug": "qa-test-event-meteor-shower-watch",
  "status": "PUBLISHED"
}
```
**Database Verified:** ✅ Event exists in `events` table
**Frontend Verified:** ✅ Event appears on public `/events` page

---

#### ✅ TC-EVT-002: List Events (PASS)
**Endpoint:** `GET /api/admin/events`
**Expected:** Paginated list of events
**Actual:** Returns list with correct data

---

#### ❌ TC-EVT-003: Update Event (BLOCKED)
**Endpoint:** `PUT /api/admin/events/{id}`
**Status:** BLOCKED by BUG-001
**Expected:** Update event fields
**Actual:** 404 error - dynamic route not found

---

#### ❌ TC-EVT-004: Delete Event (BLOCKED)
**Endpoint:** `DELETE /api/admin/events/{id}`
**Status:** BLOCKED by BUG-001

**Workaround Tested:** Bulk delete via `DELETE /api/admin/events` with `{"ids": [...]}`
**Result:** API call failed due to server instability (BUG-003)

---

### 2. Listings CRUD

#### ❌ TC-LST-001 to TC-LST-005: All tests BLOCKED
**Reason:** Server instability prevented testing
**Note:** API routes exist at:
- `POST /api/admin/listings` (Create) - Not tested
- `GET /api/admin/listings` (List) - Not tested
- `PUT /api/admin/listings/{id}` (Update) - Blocked by BUG-001
- `DELETE /api/admin/listings/{id}` (Delete) - Blocked by BUG-001

**Code Review Notes:**
- No POST handler in `/api/admin/listings/route.ts` - only GET and DELETE
- Missing create functionality in admin listings API!

---

### 3. Media CRUD

#### ❌ TC-MED-001 to TC-MED-004: All tests BLOCKED
**Status:** Not tested due to server issues

**Code Review Notes:**
- Upload endpoint exists at `/api/upload/route.ts` (not admin)
- Admin media endpoints only support LIST, BULK UPDATE, BULK DELETE
- Missing single media update/delete via ID
- TODO comment in code: "Also delete from S3" - incomplete S3 cleanup

---

### 4. Board Members CRUD

#### ❌ TC-BRD-001 to TC-BRD-004: All tests BLOCKED

**Code Review Notes:**
- Create (POST) ✅ Implemented
- List (GET) ✅ Implemented
- Update (PUT via [id]) - Route exists but blocked by BUG-001
- Bulk Delete ✅ Implemented

---

### 5. Document Management

#### ❌ TC-DOC-001 to TC-DOC-003: Not tested

**Available Endpoints:**
- `/api/leadership/documents` - Leadership documents
- `/api/leadership/minutes` - Meeting minutes

---

## Authentication Testing

### ✅ TC-AUTH-001: Admin Login (PASS)
**Credentials:** demo / Sp@C2025!
**Result:** Session established with ADMIN role
```json
{
  "user": {
    "id": "0432ac2e-1119-4225-8c36-d7329e5f95b8",
    "email": "demo@spac.local",
    "role": "ADMIN"
  }
}
```

### ✅ TC-AUTH-002: Admin Session Persistence (PASS)
Session token persists across requests via cookies.

---

## Database Verification

### Users Table
```sql
-- Admin user exists
SELECT id, email, role FROM users WHERE role = 'ADMIN';
-- Result: 1 row (demo@spac.local)
```

### Events Table
```sql
-- Test event created successfully
SELECT id, title, status FROM events WHERE slug LIKE 'qa-test%';
-- Result: 1 row (QA Test Event - Meteor Shower Watch)
```

---

## Code Quality Issues Found

### 1. Missing Create Listing API
**File:** `src/app/api/admin/listings/route.ts`
**Issue:** No POST handler to create new listings from admin panel
**Severity:** Medium
**Recommendation:** Add POST handler similar to events API

### 2. Incomplete S3 Cleanup
**File:** `src/app/api/admin/media/route.ts`
**Issue:** `// TODO: Also delete from S3` - deleting media records but not S3 objects
**Severity:** Medium (data integrity issue)
**Recommendation:** Implement S3 deletion before database deletion

### 3. Mixed Field Naming Convention
**Issue:** Some APIs use camelCase (memberPrice), others use snake_case (guest_price)
**Files:** Events route.ts
**Recommendation:** Standardize on one convention

### 4. Missing Audit Logs for Some Actions
**Issue:** Some CRUD operations don't create audit logs
**Recommendation:** Ensure all admin actions are logged

---

## Recommendations

### Immediate Actions (P0)
1. **Fix Dynamic Route Resolution**
   - Clear `.next` cache completely
   - Restart dev server with clean state
   - Verify Next.js 14 app router configuration
   - Check if `params` Promise handling is correct (Next.js 14 change)

2. **Server Stability**
   - Investigate memory/CPU usage during compilation
   - Consider using `next build` + `next start` instead of dev server for testing

### Short-term Actions (P1)
3. Add missing POST handler for listings
4. Implement S3 deletion for media cleanup
5. Add comprehensive input validation

### Long-term Actions (P2)
6. Add integration tests for all admin CRUD operations
7. Implement Playwright E2E tests for admin panel
8. Standardize API response formats

---

## Environment Details

- **Node.js:** v22.16.0
- **Next.js:** 14.2.33
- **Prisma:** (version from package.json)
- **OS:** Linux 5.15.167.4-microsoft-standard-WSL2 (WSL2)
- **Database:** Supabase PostgreSQL

---

## Test Artifacts

### Cookie File Location
`/tmp/cookies.txt` - Session cookies for authenticated requests

### Log Files
`/tmp/next-server.log` - Next.js development server output

---

## Additional Testing (Port 3001)

After restarting the server (which started on port 3001 due to port conflict):

### ✅ TC-BRD-LIST: List Board Members (PASS)
**Endpoint:** `GET /api/board-members`
**Result:** Returns 6 board members correctly
```json
[
  {"name": "John Smith", "title": "Club President"},
  {"name": "Sarah Johnson", "title": "Vice President"},
  {"name": "Mike Williams", "title": "Secretary"},
  {"name": "Emily Davis", "title": "Treasurer"},
  {"name": "Peter McLean", "title": "Membership Chair"},
  {"name": "Guy Earle", "title": "Newsletter Editor"}
]
```

### Server Stability Note
The Next.js development server continues to exhibit instability:
- Internal Server Errors (500) occurring intermittently
- Server process being killed unexpectedly
- Port conflicts (3000 → 3001)
- Compilation hanging on certain routes

---

## Sign-off

**Tested By:** OpenClaw QA Subagent
**Date:** 2026-02-01 01:53 EST
**Status:** INCOMPLETE - Blocked by critical bugs

**Summary of Issues:**
1. 🔴 **BUG-001**: Dynamic routes (`[id]`) return 404 - CRITICAL
2. 🔴 **BUG-002**: Module loading errors - CRITICAL
3. 🟡 **BUG-003**: Dev server instability - HIGH
4. 🟡 Missing POST handler for admin listings - MEDIUM
5. 🟡 Incomplete S3 cleanup for media deletion - MEDIUM

**Tested Successfully:**
- ✅ Admin login/authentication
- ✅ Event creation (POST /api/admin/events)
- ✅ Event listing (GET /api/admin/events)
- ✅ Board members listing (GET /api/board-members)
- ✅ Public events API
- ✅ Database persistence verified

**Not Tested (Blocked):**
- ❌ Event update (blocked by BUG-001)
- ❌ Event delete (blocked by BUG-001)
- ❌ Listings CRUD (blocked by server instability)
- ❌ Media upload/delete
- ❌ Document management
- ❌ Event registration flow

**Next Steps:**
1. Development team must fix BUG-001 (dynamic routes)
2. Investigate and fix server stability issues
3. Re-run full test suite after fixes
4. Complete remaining test cases

---

## Appendix: Code Review Findings

### Events API (`/api/admin/events/route.ts`)
**Positives:**
- Proper admin authentication check
- Unique slug generation with collision handling
- Audit logging on create
- Cache revalidation (`revalidatePath`) for immediate frontend updates
- Supports pagination, sorting, and filtering

**Issues:**
- `isFreeEvent` flag is UI-specific, should normalize pricing in frontend
- Mixed pricing field names (memberPrice vs guest_price)

### Events [id] API (`/api/admin/events/[id]/route.ts`)
**Positives:**
- Comprehensive update handler with partial updates
- Audit logging for updates and deletes
- Proper cache revalidation

**Issues:**
- Route not resolving (see BUG-001)
- `params` is now a Promise in Next.js 14+ (correctly handled in code)

### Listings API (`/api/admin/listings/route.ts`)
**Critical Issues:**
- ❌ **Missing POST handler** - Cannot create listings from admin
- Only has GET (list) and DELETE (bulk)

### Board Members API
**Complete Implementation:**
- GET (list)
- POST (create)
- Bulk DELETE

### Media API
**Implementation Notes:**
- No single-item operations, only bulk
- Missing POST for upload (uses separate `/api/upload` endpoint)
- TODO comment for S3 cleanup not implemented

---

## Appendix A: API Endpoints Inventory

### Admin APIs
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | /api/admin/events | ✅ Works |
| POST | /api/admin/events | ✅ Works |
| DELETE | /api/admin/events | ⚠️ Bulk only |
| GET | /api/admin/events/[id] | ❌ 404 Bug |
| PUT | /api/admin/events/[id] | ❌ 404 Bug |
| DELETE | /api/admin/events/[id] | ❌ 404 Bug |
| GET | /api/admin/listings | Not tested |
| DELETE | /api/admin/listings | Not tested |
| GET | /api/admin/board-members | Not tested |
| POST | /api/admin/board-members | Not tested |
| GET | /api/admin/media | Not tested |
| PUT | /api/admin/media | Not tested |
| DELETE | /api/admin/media | Not tested |
| GET | /api/admin/stats | Not tested |
| GET | /api/admin/users | Not tested |
| GET | /api/admin/memberships | Not tested |
| GET | /api/admin/registrations | Not tested |

### Public APIs
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | /api/events | ✅ Works |
| GET | /api/board-members | ✅ Works |
| GET | /api/listings | Not tested |
| POST | /api/events/register | Not tested |
