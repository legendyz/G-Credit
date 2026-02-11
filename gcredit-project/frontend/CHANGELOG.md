# Changelog

All notable changes to the G-Credit Frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-11 (Sprint 10 — v1.0.0 Release)

### Sprint 10 Summary — v1.0.0 Release Sprint

**Branch:** `sprint-10/v1-release`  
**UAT:** ✅ PASSED — 33/33 test cases (Round 2, 2026-02-11)  
**Tests:** 527 tests (45 files), 100% pass rate  
**Bundle:** 235 KB main chunk (route-based code splitting)

#### Features — 10 Epics Complete

- **Epic 1: Infrastructure** — React 19 + Vite 7 + Tailwind v4 + Shadcn/ui
- **Epic 2: Authentication** — JWT login/logout, RBAC route protection, Profile page
- **Epic 3: Badge Templates** — BadgeTemplateListPage + BadgeTemplateFormPage (CRUD, search, filter, status management)
- **Epic 4: Badge Issuance** — IssueBadgePage with template selector + recipient dropdown
- **Epic 5: Employee Wallet** — Timeline view, Badge detail modal, Evidence files, Similar badges
- **Epic 6: Badge Verification** — Public verification page, Baked badge PNG download, JSON-LD
- **Epic 7: Badge Sharing** — Email sharing, Share analytics, Embeddable widget
- **Epic 8: Bulk Issuance** — CSV upload, Drag-drop UI, Preview/confirm, Error report
- **Epic 9: Badge Revocation** — Revocation panel, Audit trail, State transitions in Wallet
- **Epic 10: Production MVP** — Admin Dashboard, Analytics, User Management, Search, Accessibility

#### New Pages (Sprint 10)

- `BadgeTemplateListPage.tsx` — Template list with search, filter, status management
- `BadgeTemplateFormPage.tsx` — Template create/edit form with skill selection
- `ProfilePage.tsx` — Profile info display + password change
- `ClaimBadgePage.tsx` — Email badge claiming via token

#### Design System & UI Overhaul (Story 10.6d)

- Migrated to Tailwind v4 `@theme` CSS custom properties
- Unified design tokens: colors, typography, spacing, shadows
- Consistent component styling across all pages
- WCAG 2.1 AA compliant (keyboard navigation, ARIA labels, color contrast)
- Minimum 44×44px touch targets

#### Bug Fixes (Story 10.8 + Re-UAT Round 2)

- **BUG-002:** Navbar restructured — separate Dashboard + My Wallet links with correct active states
- **BUG-003:** Badge Template Management UI built from scratch
- **BUG-004:** IssueBadgePage uses `/badges/recipients` endpoint
- **BUG-005:** SearchInput controlled mode fix (`internalValue` state)
- **BUG-006:** Manager role added to BadgeManagementPage with real auth store
- **BUG-007:** ProfilePage with password change form
- Evidence file UI — padding, cursor, download URL property
- Download PNG button unified to blue style
- Analytics refresh button uses `invalidateQueries` + category `nameEn`
- User Management nav link added (ADMIN-only)
- Session validation on startup (token expiry check + auto-logout)

#### Technical Improvements

- Route-based code splitting: 10 lazy-loaded routes via `React.lazy()` + `Suspense`
- 5 vendor chunks: react, ui, query, animation, utils
- Main bundle: 707 KB → 235 KB (66.8% reduction)
- ESLint: 0 errors + 0 warnings (CI zero-tolerance gate)
- TypeScript strict mode — 0 `tsc --noEmit` errors
- i18n cleanup — all Chinese UI strings converted to English

#### Testing

- 527 tests across 45 files (100% pass rate)
- 74 new tests added in Sprint 10 (badgeTemplatesApi, BadgeTemplateListPage, BadgeTemplateFormPage, ProfilePage)
- TanStack Query v5 integration tests
- Component tests with React Testing Library

---

## [0.9.0] - 2026-02-08 (Sprint 9 — Bulk Badge Issuance)

### Features
- Bulk issuance UI: CSV upload, drag-drop, preview, confirm
- 7 new components: BulkPreviewHeader, BulkPreviewTable, ErrorCorrectionPanel, ConfirmationModal, EmptyPreviewState, SessionExpiryTimer, ProcessingComplete
- ProcessingModal with per-badge progress
- Route-based code splitting (TD-013)

### Testing
- 397 tests (100% pass rate)

---

## [0.8.0] - 2026-02-05 (Sprint 8 — Production-Ready MVP)

### Features
- Admin Dashboard with key metrics
- Badge search & filter enhancement
- WCAG 2.1 AA accessibility compliance
- Analytics dashboard
- Responsive design optimization
- Admin User Management panel

### Testing
- 328 tests (100% pass rate)

---

## [0.7.0] - 2026-02-02 (Sprint 7 — Badge Revocation)

### Features
- Admin Revocation Panel with filters and search
- Badge lifecycle state transitions in Wallet
- Audit trail display

---

## [0.6.0] - 2026-01-31 (Sprint 6 — Badge Sharing)

### Features
- Email badge sharing via Microsoft Graph API
- Embeddable badge widget
- Badge sharing analytics
- Teams Adaptive Cards integration

---

## [0.5.0] - 2026-01-29 (Sprint 5 — Badge Verification)

### Features
- Public verification page (VerifyBadgePage)
- Baked badge PNG download
- Email masking for privacy

---

## [0.4.0] - 2026-01-28 (Sprint 4 — Employee Badge Wallet)

### Features
- Timeline view with date navigation
- Badge detail modal (10 sub-components)
- Evidence file management
- Similar badge recommendations
- Milestone achievements
- Empty state handling

---

## [0.3.0] - 2026-01-28 (Sprint 3 — Badge Issuance)

### Features
- Badge issuance workflow UI

---

## [0.2.0] - 2026-01-26 (Sprint 2 — Badge Templates)

### Features
- Badge template management (early version)
- Multi-language support

---

## [0.1.0] - 2026-01-25 (Sprint 1 — Authentication)

### Features
- Login / Logout pages
- JWT authentication
- Role-based route protection

---

## [0.0.0] - 2026-01-24 (Sprint 0 — Infrastructure)

### Features
- React 19 + Vite 7 + TypeScript 5.9 + Tailwind CSS 4
- Shadcn/ui component library
- Project scaffolding
