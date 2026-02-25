# Changelog

All notable changes to the G-Credit Frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.1] - 2026-02-25 (Sprint 12.5 — Deferred Items Cleanup)

### Sprint 12.5 Summary — Deferred Items from Sprint 12

**Branch:** `sprint-12.5/deferred-cleanup`
**Stories:** 2/2 complete | **PR:** #8 merged 2026-02-25
**Tests:** 738 passed (68 test files, 100% pass rate, +36 from v1.2.0)
**UAT:** 26/26 PASS (signed off 2026-02-25)

#### Story 12.5.1: CategoryTree Enhancements (D-1, D-2, D-3)

- **D-1 Responsive Dropdown (`< 1024px`):** New `<CategoryDropdown>` component renders on screens < 1024px. Indented hierarchy display with `└` prefix. All CRUD actions accessible via toolbar. DnD disabled on mobile. 19 tests.
- **D-2 Blue Insertion Line:** 2px blue line (`border-blue-500`) at insertion point during drag. Replaces opacity-only feedback with precise positional indicator.
- **D-3 Cross-Level "Move to...":** New `<MoveToDialog>` with read-only tree for target parent selection. Disabled constraints (self, descendants, current parent). 9 tests.
- **Batch Reorder Hook:** New `useReorderSkillCategories()` in `useSkillCategories.ts` — batches all PATCH requests via `Promise.all`, single cache invalidation, single toast.

#### Story 12.5.2: Remove Legacy `Badge.evidenceUrl` (D-4)

- No frontend changes required — `evidenceUrl` was never referenced in frontend code.

#### UAT Bug Fixes

- **Disabled button tooltip (S12.5-005):** Wrapped disabled Delete/Move buttons in `<span title>` wrapper (browsers ignore hover on disabled elements).
- **DnD reorder not persisting (S12.5-008):** Replaced N individual mutations with batched `useReorderSkillCategories` hook.
- **CategoryDropdown UX:** Added gray hover (`focus:bg-neutral-100`), context info display, L3 depth warning hint.

#### New Components

| Component | Tests |
|-----------|-------|
| `CategoryDropdown.tsx` | 19 |
| `MoveToDialog.tsx` | 9 |
| `CategoryTree.tsx` (updated) | +6 |
| `SkillCategoryManagementPage.tsx` (updated) | 10 |

---

## [1.2.0] - 2026-02-24 (Sprint 12 — Management UIs & Evidence)

### Sprint 12 Summary — Management UIs & Evidence Unification

**Branch:** `sprint-12/management-uis-evidence`  
**Stories:** 8/8 development stories complete (3 waves)  
**Tests:** 702 tests (66 test files, 100% pass rate, +151 from v1.1.0)

#### Wave 1: Admin Management UIs — 4 Stories

- **Skill Category Management UI (12.1):** Hierarchical 3-level tree view with `@dnd-kit` drag-and-drop reorder (same-level). CRUD operations. System-defined category protection (lock icon, no delete). Shared `<AdminPageShell>`, `<ConfirmDialog>`, `<CategoryTree>` components. 70 new tests.
- **Skill Management UI (12.2):** Split layout — category tree (left) + skills table (right). Skill CRUD with badge-usage guard. Colored skill tags (10-color palette, auto-assign per category, propagated to 3 existing pages). 32 new tests.
- **User Management UI Enhancement (12.3):** Enhanced user table with search/filter/sort. Role edit modal. Account lock/unlock toggle. User detail slide-over panel. 62+ tests.
- **Milestone Admin UI (12.4):** Card grid layout. Dynamic form per milestone type. Active/inactive toggle. Achievement count display. `<MilestoneFormSheet>` with Zod validation. 44+ tests.

#### Wave 2: Evidence Unification — 2 Stories

- **Evidence Data Model UI (12.5/12.6):** Shared `<EvidenceList>` and `<EvidenceAttachmentPanel>` components. File upload in `IssueBadgePage`. Evidence column in Badge Management table. SAS token fix for `VerifyBadgePage`. Unified evidence display across wallet, verification, and management pages.

#### Wave 3: Quick Fixes — 2 Stories

- **Activity Feed Formatting (12.7):** `buildActivityDescription()` utility in `RecentActivityFeed` and `AdminDashboard`. Human-readable descriptions for all action types. 12 tests.
- **Skills UUID Hardening (12.8):** `useSkillNamesMap()` hook applied to all skill display locations. "Unknown Skill" fallback label. 8 tests.

#### Bug Fixes (Session)

- **Skill Category Cache Invalidation:** Added `['skill-categories']` invalidation to `useUpdateSkill` mutation (was missing, only invalidated `['skills']`)
- **Category Tree Visual Alignment:** Added dotted leader line between name and right-side badges/actions, enhanced hover to `neutral-100/70`

### Sprint 12 UAT Fixes & Enhancements (2026-02-23)

Issues discovered and fixed during Sprint 12 UAT testing session.

#### Audit Activity — Shared Utility Refactoring (10e5d2d)

- **New `utils/audit-activity.utils.ts`:** Single source of truth for activity icons, verbs, and description formatting
  - `ACTIVITY_CONFIG`: icon + verb mapping for all 8 activity types
  - `getActivityIcon()`: safe icon lookup with fallback for unknown types
  - `buildActivityDescription()`: safe description builder with empty-field guards (no empty `""`, no dangling "to"/"from")
- **`RecentActivityFeed.tsx`:** Removed local `ACTIVITY_CONFIG` and `buildDescription()`, imports from shared utils
- **`AdminDashboard.tsx`:** Removed inline `actionIcons` map, imports `getActivityIcon()` from shared utils; shows description directly instead of raw type + description
- **`analytics.ts`:** Added `TEMPLATE_UPDATED` and `USER_UPDATED` to `ActivityType` union

#### Skill Management (4c802f8, 74f0e48, 1011d40)

- **Delete Protection:** Disable trash icon when skill is referenced by badge templates (`badgeCount > 0`), grey style + tooltip
- **Column Rename:** "Badges" → "Badge Templates" for clarity
- **Template Hover:** Badge count shows dotted-underline with tooltip listing referencing template names

#### Badge Verification (b00fd50)

- **Download Restriction:** JSON-LD download now disabled for both PENDING and REVOKED badges (was REVOKED-only)

#### Milestone Form UX (b3de40c, 16b3b6a)

- **Category Hierarchy:** Dropdown shows visual indentation (`└` prefix + NBSP) instead of flat list
- **Label Clarification:** "Include sub-categories" → "Count badges from sub-categories too"

#### Navigation (6c650b1)

- **Navbar Optimization:** Reduced padding (`px-4→px-2.5`), shortened labels (Badge Templates→Templates, etc.), centered nav with `flex-1 justify-center`, extracted `navCls()` helper (302→238 lines)

---

## [1.1.0] - 2026-02-14 (Sprint 11 — Security & Quality Hardening)

### Sprint 11 Summary — Post-MVP Hardening

**Branch:** `sprint-11/security-quality-hardening`  
**Stories:** 25/25 complete (7 waves, all code reviews APPROVED)  
**Tests:** 551 tests (51 suites), 100% pass rate (+24 from v1.0.0)

#### Security

- **JWT httpOnly Cookie Migration (11.6):** `apiFetch` wrapper replaces raw `fetch` calls, `credentials: 'include'` for cookie-based auth, removed all `localStorage` JWT token handling
- **Issuer Email Masking (11.7):** Frontend displays masked emails from API responses

#### Features

- **Badge Visibility Toggle (11.4):** Toggle switch in badge detail for owner to set `isPublic`/private
- **LinkedIn Share Tab (11.5):** New tab in ShareDialog with LinkedIn URL builder and `window.open`
- **Analytics CSV Export (11.17):** Export CSV button in AdminAnalyticsPage PageTemplate actions with Download icon, loading spinner, and toast notification
- **403 Access Denied Page (11.19):** Dedicated `/403` route with role-based messaging and navigation links
- **ClaimPage UUID Fix (11.20):** Dynamic UUID from URL params
- **User Management Nav Fix (11.23):** Admin-only navigation entry restored

#### UI/UX Improvements

- **Design System Consistency (11.15):** Migrated 74 inline styles to Tailwind CSS classes (86→12 remaining, all dynamic/Recharts), deleted `App.css` (Vite scaffold remnant)
- **Verification Skill Display (11.18):** Shows `nameEn` instead of raw UUID
- **Pagination Standardization (11.16):** All list pages consume `PaginatedResponse<T>` format consistently

#### Developer Experience

- **ESLint no-console (11.21):** `no-console: 'error'` with test overrides, `ErrorBoundary` eslint-disable exception
- **Chinese Character Fix (11.21):** `方案B` → `Option B` in badge-verification-service
- **Husky Hooks (11.22):** Pre-commit runs lint-staged + Chinese character check, pre-push mirrors full CI

### UAT Fixes & Enhancements (2026-02-17 ~ 2026-02-18)

Changes discovered and fixed during v1.1.0 UAT testing session.

#### Badge Lifecycle UX (dde4685)

- **Wallet Timeline:** Badge issued date now displayed on timeline cards
- **Expired Badge Detection:** Dynamic status detection in wallet and detail modal
- **ExpirationSection:** New component in badge detail modal (gray styling for expired badges)
- **PENDING Badge:** Download button disabled (must claim first)
- **Claim Success:** Wallet cache invalidated for instant UI refresh
- **Verification Page:** PENDING shows amber alert instead of "valid"; EXPIRED badges show isValid=false
- **Unified Status Colors:** CLAIMED=green, PENDING=amber, EXPIRED=gray, REVOKED=red across all components

#### Badge Management (c24441f)

- **Sortable Column Headers:** Badge, Recipient, Issued By, Issued On, Status — 3-click cycle (asc→desc→clear)
- **Mobile Sort Dropdown:** Sort field selector for mobile screens
- **Full-Data Pagination:** Client-side sort/filter over all badges (auto-paginated fetch, 100/page)
- **Table Layout Fix:** `table-fixed` with `colgroup` widths, prevents horizontal scrolling on long revocation reasons
- **Sort Indicators:** ArrowUp/ArrowDown/ArrowUpDown icons + `aria-sort` attributes

#### Badge Detail Modal (eb5a7bf)

- **Issued By:** Hero section now shows issuer name (`Issued by: FirstName LastName`)

#### User Management (eb5a7bf)

- **Search Scope Extended:** Now matches role (enum) and department in addition to name/email
- **Sortable Columns:** Department and Status columns now sortable with 3-click cycle
- **Search Placeholder:** Updated to "Search by name, email, role, or department..."

#### Analytics — ISSUER Scoping (f431669)

- **Issuer Overview:** ISSUER sees only own-issued badge stats (recipients, badges issued, claim rate)
- **Role-Based Sections:** Admin-only sections (Templates, Health, Performers, Skills, Activity, CSV Export) hidden for ISSUER
- **Description Text:** ISSUER sees "Overview of badges you have issued, claim rates, and activity"
- **Hook Optimization:** `useTopPerformers`, `useSkillsDistribution`, `useRecentActivity` hooks accept `enabled` parameter

#### Template Form UX (91a4976)

- **Badge Type Rename:** "Category" label renamed to "Badge Type" to avoid confusion with Skill Category

#### Other Fixes

- **Search Input Mobile:** Restricted expand behavior to small screens only (d81fc73)

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
