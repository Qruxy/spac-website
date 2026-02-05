# SPAC Website - Comprehensive Development Plan

**Generated:** 2026-01-31  
**Status:** ACTIVE DEVELOPMENT  

---

## 📋 Requirements Summary

### Current Site Features (from PDF)
| Feature | Access Level | Status |
|---------|-------------|--------|
| Landing Page | Public | ✅ Built |
| Member Sign-In | Public | ✅ Built |
| Calendar View | Public | 🔄 Needs integration |
| General Meeting Info | Public | ✅ Built |
| Monthly Viewing (Star Parties) | Public | 🔄 Partial |
| OBS Star Party | Public/OBS Chair | 🔄 Needs work |
| Member Profile Edit | Members | ✅ Built |
| Club Documents | Members | 🔄 Needs work |
| Membership Renewal | Members | ✅ Built (Stripe) |
| Membership Card | Members | ✅ Built (Apple/Google Wallet) |
| Outreach Committee | Officers | ❌ Not built |
| Leadership Area | Officers | 🔄 Partial |
| Club Admin | Officers | ✅ Built (React-Admin) |
| OBS Admin | OBS Chair | 🔄 Needs work |

### Wish List Features
| Priority | Feature | Status |
|----------|---------|--------|
| P2 | Apple/Google Wallet Cards | ✅ DONE |
| P1 | Family Memberships (unlimited members) | ✅ Schema ready, UI needs work |
| P1 | Unified OBS table (year as field) | ❌ Not built |
| - | Astrophoto Storage (S3) | ✅ Built |
| - | Email/SMS Messaging | 🔄 Needs integration |
| - | OBS Signup Automation | 🔄 Partial |
| - | Social Media Integration | ❌ Not built |
| - | YouTube/Live Streams | ❌ Not built |
| - | Classifieds Page | ✅ Built |
| - | Donations Page | ❌ Not built |

---

## 🧪 Testing Workstreams

### 1. Security Hardening
- [ ] Auth flow testing (login, register, password reset)
- [ ] Role-based access control verification
- [ ] Admin panel authorization checks
- [ ] API endpoint protection
- [ ] CSRF/XSS protection audit
- [ ] Rate limiting on sensitive endpoints
- [ ] Stripe webhook signature verification
- [ ] S3 presigned URL security
- [ ] Session management

### 2. Frontend Testing
- [ ] All public pages render correctly
- [ ] Dashboard pages protected properly
- [ ] Form validation (client + server)
- [ ] Responsive design verification
- [ ] React component error boundaries
- [ ] Loading states and error handling
- [ ] Navigation and routing

### 3. Admin Panel Testing
- [ ] Users CRUD operations
- [ ] Events CRUD + recurring events
- [ ] Memberships management
- [ ] Media approval workflow
- [ ] Listings moderation
- [ ] Board members management
- [ ] Stats dashboard accuracy
- [ ] Bulk operations

### 4. API Testing
- [ ] All admin routes authenticated
- [ ] Public routes work correctly
- [ ] Stripe checkout flows
- [ ] Upload presigned URLs
- [ ] Event registration
- [ ] Listing offers

### 5. Feature Gaps
- [ ] Outreach Committee module
- [ ] OBS Admin improvements
- [ ] VSA (Very Small Array) page
- [ ] Document management
- [ ] Email templates/notifications
- [ ] Newsletter archive integration
- [ ] Google Calendar integration

---

## 🎨 React Bits Components to Integrate

### Backgrounds
- `Galaxy` - Perfect for hero sections (astronomy theme!)
- `Aurora` - Header ambient effects
- `Hyperspeed` - Transitions/loading
- `Beams` - Section dividers

### Text Animations
- `BlurText` - Hero headlines
- `GlitchText` - Error states
- `ShinyText` - CTAs
- `CountUp` - Stats section
- `ScrollReveal` - Content sections

### Components
- `Dock` - Navigation
- `BounceCards` - Member photos
- `AnimatedList` - Events/announcements
- `Carousel` - Image galleries
- `Counter` - Stats
- `CircularGallery` - Astrophotos

---

## 🏗️ Architecture Notes

**Stack:**
- Next.js 14 (App Router)
- Prisma + PostgreSQL (Supabase)
- NextAuth v4
- React-Admin (admin panel)
- Stripe (payments)
- AWS S3 (media storage)
- CASL (permissions)

**Key Directories:**
```
/mnt/c/spac/
├── src/
│   ├── app/           # Next.js routes
│   ├── components/    # React components
│   ├── lib/           # Utilities (auth, db, stripe, s3)
│   └── actions/       # Server actions
├── prisma/            # Database schema
└── react-bits/        # Component library (cloned)
```

---

## 🚀 Execution Order

1. **Phase 1: Foundation** (Tonight)
   - Security audit and fixes
   - Dev environment verification
   - Core functionality testing

2. **Phase 2: Gaps** (Automated)
   - Missing features from requirements
   - OBS admin module
   - Outreach module

3. **Phase 3: Polish** (Automated)
   - React Bits component integration
   - UI/UX improvements
   - Performance optimization

4. **Phase 4: Testing** (Continuous)
   - E2E tests with Playwright
   - API integration tests
   - Manual QA verification
