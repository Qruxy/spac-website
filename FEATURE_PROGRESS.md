# SPAC Website Feature Progress

## Overview
This document tracks the implementation of missing features for the SPAC website.

**Last Updated:** 2026-01-31

---

## ✅ Completed Features

### 1. VSA (Very Small Array) Page
**Route:** `/vsa`

**Features Implemented:**
- Public-facing page showcasing SPAC's smart telescope program
- Current observation targets display with images and details
- Equipment showcase section
- About VSA information section
- Link to Facebook community group
- Call-to-action for membership

**Database Models Added:**
- `VSATarget` - Stores observation targets with coordinates, magnitude, etc.
- `VSAEquipment` - Stores smart telescope equipment info

**Files Created:**
- `/src/app/(public)/vsa/page.tsx`

---

### 2. Outreach Committee Module
**Route:** `/outreach` (Dashboard)

**Features Implemented:**
- View committee members (Officers and committee members only)
- Add/remove committee members (Outreach Chair and Admins only)
- Role-based access (Chair, Vice Chair, Volunteer)
- Email committee members functionality
- Contact information display (email, phone)

**Database Models Added:**
- `OutreachCommitteeMember` - Links users to committee with roles

**Enums Added:**
- `OutreachRole` - CHAIR, VICE_CHAIR, VOLUNTEER

**Files Created:**
- `/src/app/(dashboard)/outreach/page.tsx`
- `/src/app/(dashboard)/outreach/outreach-client.tsx`
- `/src/app/api/outreach/members/route.ts`
- `/src/app/api/outreach/members/[id]/route.ts`
- `/src/app/api/outreach/email/route.ts`

---

### 3. Leadership Area
**Route:** `/leadership` (Dashboard)

**Features Implemented:**
- Leadership dashboard with membership stats
- Quick access to all leadership tools
- Active membership breakdown by type
- Recent meeting minutes list

**Files Created:**
- `/src/app/(dashboard)/leadership/page.tsx`

---

### 4. Meeting Minutes Management
**Route:** `/leadership/minutes` (Dashboard)

**Features Implemented:**
- View all meeting minutes organized by year
- Create new meeting minutes
- Edit existing minutes
- Record motions with:
  - Motion number
  - Description
  - Moved by / Seconded by
  - Vote counts (for, against, abstentions)
  - Status (Pending, Passed, Failed, Tabled, Withdrawn)
- Mark minutes as approved
- PDF attachment support (placeholder)

**Database Models Added:**
- `MeetingMinutes` - Stores meeting records
- `Motion` - Stores motions associated with meetings

**Enums Added:**
- `MeetingType` - BOARD, GENERAL, SPECIAL, ANNUAL
- `MotionStatus` - PENDING, PASSED, FAILED, TABLED, WITHDRAWN

**Files Created:**
- `/src/app/(dashboard)/leadership/minutes/page.tsx`
- `/src/app/(dashboard)/leadership/minutes/minutes-list-client.tsx`
- `/src/app/(dashboard)/leadership/minutes/new/page.tsx`
- `/src/app/(dashboard)/leadership/minutes/minutes-form.tsx`
- `/src/app/api/leadership/minutes/route.ts`
- `/src/app/api/leadership/minutes/[id]/route.ts`

---

### 5. Club Documents Management
**Route:** `/leadership/documents` (Dashboard)

**Features Implemented:**
- Document library organized by category
- Categories: Newsletter, Meeting Minutes, Bylaws, Policy, Form, Financial, Other
- Upload documents with metadata
- Year/month organization
- Download and view documents
- Delete documents (Admin only)
- Public/private visibility toggle

**Database Models Added:**
- `ClubDocument` - Stores document metadata and file references

**Enums Added:**
- `DocumentCategory` - NEWSLETTER, MEETING_MINUTES, BYLAWS, POLICY, FORM, FINANCIAL, OTHER

**Files Created:**
- `/src/app/(dashboard)/leadership/documents/page.tsx`
- `/src/app/(dashboard)/leadership/documents/documents-client.tsx`
- `/src/app/api/leadership/documents/route.ts`
- `/src/app/api/leadership/documents/[id]/route.ts`

---

### 6. OBS (Orange Blossom Special) Admin
**Route:** `/obs-admin` (Dashboard)

**Features Implemented:**

#### Dashboard (`/obs-admin`)
- Active event overview with stats
- Registration counts by type (Attendee, Speaker, Vendor, Staff, Volunteer)
- Check-in progress
- Financial summary
- Quick action links

#### Registrations (`/obs-admin/registrations`)
- Full registration table with sorting
- Search by name/email
- Filter by type and payment status
- Export to CSV
- View camping, meal, t-shirt requests

#### Check-In (`/obs-admin/check-in`)
- Real-time check-in interface
- Progress bar
- Quick search for attendees
- One-click check-in
- Undo check-in capability
- Badge printing trigger

#### Settings (`/obs-admin/settings`)
- Create new OBS years
- Configure event details (name, dates, location)
- Set registration window
- Configure pricing (member, non-member, early bird, camping, meals)
- Set capacity
- Activate/deactivate events

**Database Models Added:**
- `OBSConfig` - Event configuration by year
- `OBSRegistration` - Attendee registrations
- `OBSDocument` - OBS-specific documents
- `OBSFinancial` - Financial records (income/expenses)

**Enums Added:**
- `OBSRegistrationType` - ATTENDEE, SPEAKER, VENDOR, STAFF, VOLUNTEER
- `OBSDocumentCategory` - SCHEDULE, MAP, SPEAKER_BIO, VENDOR_INFO, VOLUNTEER_GUIDE, OTHER
- `PaymentStatus` - PENDING, PAID, REFUNDED, PARTIAL

**Files Created:**
- `/src/app/(dashboard)/obs-admin/page.tsx`
- `/src/app/(dashboard)/obs-admin/registrations/page.tsx`
- `/src/app/(dashboard)/obs-admin/registrations/registrations-client.tsx`
- `/src/app/(dashboard)/obs-admin/check-in/page.tsx`
- `/src/app/(dashboard)/obs-admin/check-in/check-in-client.tsx`
- `/src/app/(dashboard)/obs-admin/settings/page.tsx`
- `/src/app/(dashboard)/obs-admin/settings/settings-form.tsx`
- `/src/app/api/obs/config/route.ts`
- `/src/app/api/obs/config/[id]/route.ts`
- `/src/app/api/obs/config/[id]/activate/route.ts`
- `/src/app/api/obs/check-in/[id]/route.ts`

---

## 🔄 Partially Implemented / TODOs

### Document Management
- [ ] Actual S3 file upload integration (currently placeholder URLs)
- [ ] PDF viewer integration

### OBS Admin
- [ ] Name badge generation/printing UI
- [ ] Financial reports page
- [ ] OBS document management page
- [ ] Public OBS registration form
- [ ] Historical contact table (all registrants since 2018)

### Leadership
- [ ] Leadership team management UI
- [ ] Individual minutes detail view with editing

### Outreach
- [ ] Actual email sending integration (currently logs to console)

---

## 📊 Database Schema Updates

The following models were added to `/prisma/schema.prisma`:

```prisma
// Outreach Committee
model OutreachCommitteeMember
enum OutreachRole

// Meeting Minutes & Motions
model MeetingMinutes
model Motion
enum MeetingType
enum MotionStatus

// Club Documents
model ClubDocument
enum DocumentCategory

// OBS (Orange Blossom Special)
model OBSConfig
model OBSRegistration
model OBSDocument
model OBSFinancial
enum OBSRegistrationType
enum OBSDocumentCategory
enum PaymentStatus

// VSA (Very Small Array)
model VSATarget
model VSAEquipment
```

**Schema was pushed to database:** ✅ `npx prisma db push` completed successfully

---

## 🔧 Technical Notes

### Authentication & Authorization
- All new routes use existing NextAuth.js session handling
- Role-based access control using `session.user.role`
- Officer-only routes check for ADMIN or MODERATOR roles
- Outreach Chair permissions check against OutreachCommitteeMember table

### UI/UX
- Consistent dark theme matching existing site design
- Responsive layouts for mobile/desktop
- Loading states and error handling
- Toast-style success/error messages

### API Design
- RESTful API endpoints
- Consistent error response format
- Input validation
- Transaction support where needed

---

## 📁 File Structure Summary

```
/src/app/
├── (public)/
│   └── vsa/
│       └── page.tsx                    # VSA public page
├── (dashboard)/
│   ├── outreach/
│   │   ├── page.tsx                    # Outreach committee page
│   │   └── outreach-client.tsx         # Client component
│   ├── leadership/
│   │   ├── page.tsx                    # Leadership dashboard
│   │   ├── minutes/
│   │   │   ├── page.tsx                # Minutes list
│   │   │   ├── minutes-list-client.tsx
│   │   │   ├── minutes-form.tsx
│   │   │   └── new/
│   │   │       └── page.tsx            # Create minutes
│   │   └── documents/
│   │       ├── page.tsx                # Documents list
│   │       └── documents-client.tsx
│   └── obs-admin/
│       ├── page.tsx                    # OBS dashboard
│       ├── registrations/
│       │   ├── page.tsx
│       │   └── registrations-client.tsx
│       ├── check-in/
│       │   ├── page.tsx
│       │   └── check-in-client.tsx
│       └── settings/
│           ├── page.tsx
│           └── settings-form.tsx
└── api/
    ├── outreach/
    │   ├── members/
    │   │   ├── route.ts
    │   │   └── [id]/route.ts
    │   └── email/route.ts
    ├── leadership/
    │   ├── minutes/
    │   │   ├── route.ts
    │   │   └── [id]/route.ts
    │   └── documents/
    │       ├── route.ts
    │       └── [id]/route.ts
    └── obs/
        ├── config/
        │   ├── route.ts
        │   └── [id]/
        │       ├── route.ts
        │       └── activate/route.ts
        └── check-in/
            └── [id]/route.ts
```

---

## 🚀 Next Steps

1. Integrate actual file upload to S3 for documents
2. Implement email sending service (SES, SendGrid, etc.)
3. Create name badge PDF generation
4. Build public OBS registration form
5. Add OBS financials tracking page
6. Implement minutes detail/edit page
7. Add navigation links to main site header/sidebar
