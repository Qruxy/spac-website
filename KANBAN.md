# SPAC Website - Master Kanban Board

**Last Updated:** February 1, 2026  
**Goal:** Production-ready "Apple-like, immersive astronomy club experience"

---

## 🔴 BLOCKED

| ID | Task | Blocker | Owner |
|----|------|---------|-------|
| - | None currently | - | - |

---

## 🟠 TO DO - CRITICAL (Launch Blockers)

| ID | Task | Category | Priority | Est. Hours | Notes |
|----|------|----------|----------|------------|-------|
| C-001 | **Configure PayPal Production Credentials** | Payments | P0 | 1 | Get from PayPal Business account |
| C-002 | **Create PayPal Subscription Plans** | Payments | P0 | 2 | 5 plans needed (see PAYPAL_MIGRATION.md) |
| C-003 | **Set PAYPAL_WEBHOOK_ID in Production** | Payments | P0 | 0.5 | Webhook verification fails without this |
| C-004 | **Set NODE_ENV=production in Deployment** | Deployment | P0 | 0.5 | Security: dev credentials bypass without this |
| C-005 | **Push Prisma Schema to Production DB** | Database | P0 | 0.5 | `npx prisma db push` |
| C-006 | **Run Legacy Data Migration** | Database | P0 | 1 | 224 members, 61 apps, 17 officers |
| C-007 | **Add Rate Limiting to /api/donations** | Security | P0 | 1 | Currently no protection against abuse |
| C-008 | **Add Rate Limiting to /api/obs/register** | Security | P0 | 1 | Currently no protection against abuse |
| C-009 | **Deploy to AWS Amplify** | Deployment | P0 | 3 | See AWS_DEPLOYMENT.md |
| C-010 | **Configure Custom Domain (stpeteastro.org)** | Deployment | P0 | 1 | DNS + SSL setup |

---

## 🟡 TO DO - HIGH PRIORITY (Should fix before launch)

| ID | Task | Category | Priority | Est. Hours | Notes |
|----|------|----------|----------|------------|-------|
| H-001 | **Add Zod Validation to OBS Registration** | Security | P1 | 2 | Input validation missing |
| H-002 | **Add Zod Validation to /api/donations** | Security | P1 | 1 | Input validation missing |
| H-003 | **Add Zod Validation to /api/checkout/** | Security | P1 | 2 | Input validation missing |
| H-004 | **Add Safeguards to Bulk Delete Operations** | Security | P1 | 2 | No limit, no self-delete check, no audit |
| H-005 | **Fix Dev Credentials Provider** | Security | P1 | 1 | Too permissive pattern matching |
| H-006 | **Reduce Session Duration to 7 Days** | Security | P1 | 0.5 | Currently 30 days |
| H-007 | **Seed Gallery with Photos** | Content | P1 | 2 | 0 photos currently - need astrophotography |
| H-008 | **Seed Classifieds with Listings** | Content | P1 | 1 | 0 listings (hardcoded fallback removed) |
| H-009 | **Seed Newsletter Archive** | Content | P1 | 2 | 0 newsletters - need historical PDFs |
| H-010 | **Seed Events (Star Parties, Meetings)** | Content | P1 | 1 | Only 3 test events |
| H-011 | **Add OBS Config for 2026** | Content | P1 | 1 | OBS registration needs active config |
| H-012 | **Verify All Payment Flows End-to-End** | Testing | P1 | 4 | Donations, memberships, events, OBS |
| H-013 | **Test Webhook Handling** | Testing | P1 | 2 | PayPal webhook signature verification |
| H-014 | **Mobile Responsiveness Audit** | UI/UX | P1 | 2 | Full device testing |
| H-015 | **Set Up S3 Bucket for Media** | Deployment | P1 | 1 | AWS S3 + IAM |
| H-016 | **Configure CloudFront CDN** | Deployment | P1 | 1 | For media delivery |

---

## 🔵 TO DO - MEDIUM PRIORITY (Fix soon after launch)

| ID | Task | Category | Priority | Est. Hours | Notes |
|----|------|----------|----------|------------|-------|
| M-001 | **Standardize Zod Validation Across All APIs** | Security | P2 | 4 | Only ~30% use Zod |
| M-002 | **Implement S3 Cleanup on Media Delete** | Database | P2 | 2 | TODO in code - media deleted but S3 objects remain |
| M-003 | **Add POST Handler for Admin Listings** | Admin | P2 | 2 | Can't create listings from admin panel |
| M-004 | **Standardize Field Naming (camelCase)** | Code Quality | P2 | 3 | Mixed camelCase/snake_case |
| M-005 | **Add Structured Logging (Pino/Winston)** | Monitoring | P2 | 3 | Currently console.error everywhere |
| M-006 | **Replace alert() with Toast Notifications** | UI/UX | P2 | 1 | Share button uses native alert |
| M-007 | **Add Skip Links for Accessibility** | A11y | P2 | 1 | "Skip to main content" |
| M-008 | **Audit Focus States** | A11y | P2 | 2 | Some elements need better focus indicators |
| M-009 | **Add Loading Skeletons to All Pages** | Performance | P2 | 3 | Some pages flash "0" before loading |
| M-010 | **Homepage Counter Animation Fix** | UI/UX | P2 | 1 | Shows "0" initially before animating |
| M-011 | **Add Touch Gestures (Swipe)** | UI/UX | P2 | 2 | Testimonials/gallery swipe on mobile |
| M-012 | **Create Security Documentation** | Docs | P2 | 2 | /docs/SECURITY.md |
| M-013 | **Add Audit Logs for All Admin Actions** | Monitoring | P2 | 2 | Some actions not logged |
| M-014 | **Image Proxy Localhost Exception** | Security | P2 | 0.5 | Remove localhost even in dev |
| M-015 | **Implement Redis Rate Limiting** | Performance | P2 | 4 | For horizontal scaling |
| M-016 | **Add E2E Tests (Playwright)** | Testing | P2 | 8 | Full user flow testing |
| M-017 | **Add Integration Tests for Admin CRUD** | Testing | P2 | 4 | Blocked by route issues before |
| M-018 | **Set Up Error Monitoring (Sentry)** | Monitoring | P2 | 2 | Production error tracking |
| M-019 | **Configure Backup Strategy** | Ops | P2 | 2 | Supabase + S3 backups |

---

## 🟢 TO DO - LOW PRIORITY (Nice to have)

| ID | Task | Category | Priority | Est. Hours | Notes |
|----|------|----------|----------|------------|-------|
| L-001 | **Add Testimonials Table to Schema** | Database | P3 | 2 | Currently hardcoded |
| L-002 | **Add VSA Targets Seed Data** | Content | P3 | 1 | Variable Star Association targets |
| L-003 | **Add Outreach Events Seed Data** | Content | P3 | 1 | Community outreach history |
| L-004 | **Implement Dark Mode Toggle** | UI/UX | P3 | 2 | Currently dark-only |
| L-005 | **Add Print Styles for Documents** | UI/UX | P3 | 1 | Meeting minutes, newsletters |
| L-006 | **Create XML Sitemap for SEO** | SEO | P3 | 1 | /sitemap.xml |
| L-007 | **Add OpenGraph/Social Meta Tags** | SEO | P3 | 2 | Better social sharing |
| L-008 | **Add Analytics (Plausible/GA)** | Monitoring | P3 | 1 | Privacy-friendly analytics |
| L-009 | **Create Staging Environment** | Ops | P3 | 2 | Separate from prod |
| L-010 | **Add Email Notifications** | Features | P3 | 4 | Registration confirmations, etc. |
| L-011 | **Add Member Directory (Private)** | Features | P3 | 4 | Members-only section |
| L-012 | **Implement Search Functionality** | Features | P3 | 4 | Site-wide search |
| L-013 | **Add Calendar Feed (ICS)** | Features | P3 | 2 | Subscribe to events |
| L-014 | **Add Weather Widget** | Features | P3 | 2 | For star party planning |
| L-015 | **Add Light Pollution Map** | Features | P3 | 2 | Dark sky finder |

---

## 🟣 IN PROGRESS

| ID | Task | Category | Owner | Started | Notes |
|----|------|----------|-------|---------|-------|
| - | None currently | - | - | - | - |

---

## ✅ DONE (This Sprint)

| ID | Task | Category | Completed | Notes |
|----|------|----------|-----------|-------|
| D-001 | Build 14+ new pages | Build | 2026-02-01 | 10 agents, ~1.5 hours |
| D-002 | Add React Bits components | Build | 2026-02-01 | Aurora, Beams, ScrollReveal, etc. |
| D-003 | Migrate Stripe → PayPal | Payments | 2026-02-01 | Full migration complete |
| D-004 | Fix dynamic route 404s | Bug | 2026-02-01 | Cache corruption issue |
| D-005 | Seed database (78 records) | Database | 2026-02-01 | Gallery, listings, newsletters, events |
| D-006 | Create 6 missing pages | UI/UX | 2026-02-01 | Contact, membership, privacy, terms, sitemap, 404 |
| D-007 | Security audit | Security | 2026-02-01 | CONDITIONAL GO |
| D-008 | Create data migration script | Database | 2026-02-01 | prisma/migrate-legacy.ts |
| D-009 | Create AWS deployment guide | Docs | 2026-02-01 | AWS_DEPLOYMENT.md (23KB) |
| D-010 | Performance optimization | Performance | 2026-02-01 | Skeletons, parallel queries, bundle size |
| D-011 | Mobile QA | Testing | 2026-02-01 | Responsive fixes applied |
| D-012 | Fix classifieds hardcoded data | Bug | 2026-02-01 | Now fetches from DB |
| D-013 | Schema sync (prisma db push) | Database | 2026-02-01 | Missing tables created |
| D-014 | Update to AWS Amplify recommendation | Docs | 2026-02-01 | Changed from Vercel |

---

## 📊 Summary

| Category | Critical | High | Medium | Low | Done |
|----------|----------|------|--------|-----|------|
| Payments | 3 | 2 | 0 | 0 | 1 |
| Security | 2 | 6 | 3 | 0 | 1 |
| Database | 2 | 0 | 2 | 2 | 4 |
| Deployment | 2 | 2 | 0 | 1 | 1 |
| Content | 0 | 5 | 0 | 3 | 1 |
| UI/UX | 0 | 1 | 4 | 3 | 2 |
| Testing | 0 | 2 | 2 | 0 | 1 |
| A11y | 0 | 0 | 2 | 0 | 0 |
| Docs | 0 | 0 | 1 | 0 | 2 |
| Code Quality | 0 | 0 | 2 | 0 | 0 |
| Monitoring | 0 | 0 | 3 | 1 | 0 |
| Features | 0 | 0 | 0 | 6 | 0 |
| **TOTAL** | **10** | **16** | **19** | **15** | **14** |

---

## 🚀 Launch Checklist

### Pre-Launch (MUST DO)
- [ ] PayPal credentials configured (C-001, C-002, C-003)
- [ ] NODE_ENV=production set (C-004)
- [ ] Database schema pushed (C-005)
- [ ] Legacy data migrated (C-006)
- [ ] Rate limiting on critical endpoints (C-007, C-008)
- [ ] Deployed to AWS Amplify (C-009)
- [ ] Custom domain configured (C-010)

### Launch Day
- [ ] DNS propagation verified
- [ ] SSL certificate active
- [ ] All payment flows tested
- [ ] Admin access verified
- [ ] Monitoring active

### Post-Launch (Week 1)
- [ ] High priority security items (H-001 to H-006)
- [ ] Content seeding (H-007 to H-011)
- [ ] Full QA pass (H-012 to H-014)

---

## 📝 Quick Commands

```bash
# Apply schema changes
cd /mnt/c/spac && npx prisma db push

# Run legacy migration
cd /mnt/c/spac && npx ts-node prisma/migrate-legacy.ts

# Seed database
cd /mnt/c/spac && npx prisma db seed

# Build for production
cd /mnt/c/spac && npm run build

# Start dev server
cd /mnt/c/spac && npm run dev
```

---

## 📚 Reference Docs

- `AWS_DEPLOYMENT.md` - Full deployment guide
- `PAYPAL_MIGRATION.md` - PayPal setup instructions
- `SECURITY_AUDIT.md` - Security findings
- `PERFORMANCE_REPORT.md` - Performance audit
- `QA_REPORT_*.md` - QA test results
- `prisma/migrate-legacy.ts` - Data migration script

---

*Generated by Jaygo 🗡️*
