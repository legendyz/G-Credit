# UX Release Audit - Sprint 10 (v1.0.0 Pre-Release)

**Reviewer:** Sally 🎨 (UX Designer)  
**Date:** 2026-02-08  
**Scope:** Full MVP Frontend (Sprint 0-9 deliverables)  
**Verdict:** RELEASE READY WITH NOTES

---

## Executive Summary

The G-Credit frontend application is a well-structured, accessibility-conscious MVP that demonstrates strong engineering practices across 10 sprints of development. The codebase shows consistent use of Shadcn/ui components, proper WCAG 2.1 Level AA patterns (skip links, ARIA labels, focus management, landmark roles, contrast-verified status badges), and thoughtful responsive design with mobile-first navigation. The role-based dashboard system, badge wallet with timeline view, and bulk issuance workflow are all complete and polished.

However, the audit identified several issues that should be addressed before or shortly after the v1.0.0 release. The most significant are: **8 hardcoded `localhost:3000` URLs** that bypass the centralized API_BASE_URL pattern, **7 "Quick Action" buttons linking to non-existent routes** (e.g., `/catalog`, `/team/nominate`, `/admin/templates`, `/admin/settings`), the **AdminAnalyticsPage running entirely on mock data**, and **2 instances of `window.alert()` used for error handling** instead of the project's established toast pattern. There are no Chinese strings in the production code.

Overall, the application delivers a cohesive, accessible experience that aligns with the UX Design Specification. The role-based navigation, celebration modals, empty states, and error boundaries create a polished product. With the critical items resolved, this is ready for v1.0.0 release.

---

## Audit Results by Area

### 1. Navigation & Information Architecture
**Rating:** 4/5

**Strengths:**
- Clean role-based routing in [App.tsx](gcredit-project/frontend/src/App.tsx) with `ProtectedRoute` guarding admin pages by role (`ADMIN`, `ISSUER`)
- Desktop navbar ([Navbar.tsx](gcredit-project/frontend/src/components/Navbar.tsx)) conditionally shows admin links based on user role
- Mobile navigation ([MobileNav.tsx](gcredit-project/frontend/src/components/layout/MobileNav.tsx)) is a well-implemented slide-out drawer with role-filtered links
- Skip link targets main content correctly
- Public routes (`/verify/:id`, `/badges/:id/embed`) are properly unprotected

**Issues:**
1. **Navbar "My Wallet" links to `/` (Dashboard), not `/wallet`** — [Navbar.tsx L47-49](gcredit-project/frontend/src/components/Navbar.tsx#L47-L49). The label says "My Wallet" but navigates to the root dashboard. Users must go to Dashboard first, then click "View All My Badges" to reach the actual wallet at `/wallet`. This is confusing. The navbar should either have a separate "Dashboard" link or rename "My Wallet" to "Dashboard."
2. **No active state on navigation links** — The desktop Navbar does not visually indicate the current page (no `aria-current="page"` or active styling). The MobileNav correctly applies active styling via `isActive` check, creating an inconsistency between desktop and mobile.
3. **User Management not in desktop nav** — The `/admin/users` route is only accessible if the admin knows the URL or navigates from the Admin Dashboard quick actions. It should be in the navigation bar for ADMIN users.

**Recommendations:**
- Add `/wallet` as a separate nav link, or rename current link to "Dashboard"
- Add active link styling to desktop Navbar (consistent with MobileNav)
- Add "User Management" to admin navigation links

---

### 2. UI Consistency
**Rating:** 4/5

**Strengths:**
- Consistent use of Shadcn/ui `Card`, `Button`, `Dialog`, `Alert`, `Input`, `Select`, `Label`, `Textarea`, `Skeleton` across all pages
- Reusable component library: `EmptyState`, `ErrorDisplay`, `LoadingSpinner`, `StatusBadge`, `BadgeImage`, `CelebrationModal`, `FormError`
- Summary cards follow identical pattern across Employee, Issuer, Manager, and Admin dashboards
- Button styling is consistent via `buttonVariants` CVA
- Badge status colors are verified for WCAG contrast and documented in [StatusBadge.tsx](gcredit-project/frontend/src/components/ui/StatusBadge.tsx)

**Issues:**
1. **Duplicate StatusBadge components** — There are three separate StatusBadge implementations:
   - [components/ui/StatusBadge.tsx](gcredit-project/frontend/src/components/ui/StatusBadge.tsx) (the reusable one)
   - [components/admin/StatusBadge.tsx](gcredit-project/frontend/src/components/admin/StatusBadge.tsx) (admin-specific)
   - Inline `StatusBadge` function in [BadgeManagementPage.tsx L80-L101](gcredit-project/frontend/src/pages/admin/BadgeManagementPage.tsx#L80-L101)
   
   This creates maintenance risk and potential visual inconsistency.

2. **Mixed button patterns** — Some pages use native `<button>` elements with manual Tailwind classes (BulkIssuancePage, BadgeEmbedPage, BulkPreviewPage) while others use the Shadcn `<Button>` component. The native buttons lack the consistent `buttonVariants` styling.

3. **Inconsistent page heading visibility** — Layout.tsx uses `sr-only` for page titles (hidden visually), but individual dashboard pages render their own visible `<h1>` elements creating a double-heading situation.

**Recommendations:**
- Consolidate all StatusBadge implementations into the shared `components/ui/StatusBadge.tsx`
- Replace native `<button>` elements with Shadcn `Button` on BulkIssuancePage and BulkPreviewPage
- Either remove the `sr-only` h1 in Layout or remove the visible h1 from page components

---

### 3. WCAG 2.1 Accessibility
**Rating:** 4.5/5

**Strengths:**
- **Skip Links:** Properly implemented in [SkipLink.tsx](gcredit-project/frontend/src/components/ui/SkipLink.tsx), positioned as first focusable element via Layout
- **Landmark Roles:** `role="banner"`, `role="main"`, `role="contentinfo"`, `role="navigation"` all present in [Layout.tsx](gcredit-project/frontend/src/components/layout/Layout.tsx)
- **Focus Management:** Global focus styles in [accessibility.css](gcredit-project/frontend/src/styles/accessibility.css) with `focus-visible` progressive enhancement and `:focus:not(:focus-visible)` hiding for mouse users
- **ARIA Labels:** Comprehensive across nav, buttons, forms, modals, status badges, search inputs
- **Focus Trap:** MobileNav and BadgeShareModal both implement proper focus traps with Tab/Shift+Tab cycling
- **Tab键盘 Navigation:** BadgeShareModal implements Arrow key navigation for tab panels per WAI-ARIA Tabs pattern
- **Reduced Motion:** `prefers-reduced-motion: reduce` support in accessibility.css
- **High Contrast:** `prefers-contrast: high` support with thicker outlines and borders
- **Error Identification:** FormError component uses `role="alert"` with `aria-live`
- **Form Labels:** All login form inputs have proper `<label>` + `htmlFor` associations
- **Touch Targets:** 44×44px minimum enforced across interactive elements
- **Color Contrast:** Status badge colors verified (5.9:1 to 7.5:1 ratios documented)
- **axe-core:** Dev-mode accessibility testing via [axe-setup.ts](gcredit-project/frontend/src/lib/axe-setup.ts)

**Issues:**
1. **Desktop Navbar uses `role="menubar"` / `role="menuitem"`** — [Navbar.tsx L41-L42](gcredit-project/frontend/src/components/Navbar.tsx#L41-L42). Navigation links styled as a menubar should really be a navigation landmark with simple links. The `menubar` role implies Arrow key navigation which is not implemented for the desktop nav. This is a WCAG misuse of ARIA roles.
2. **Missing `aria-describedby` on some error states** — The bulk issuance upload drop zone and the AdminAnalyticsPage error state don't link error messages to their triggering elements.
3. **ProcessingModal lacks `role="dialog"` and `aria-modal`** — [ProcessingModal.tsx](gcredit-project/frontend/src/components/BulkIssuance/ProcessingModal.tsx) uses a fixed overlay but doesn't announce itself as a dialog to assistive technology. No focus trap is implemented.

**Recommendations:**
- Replace `role="menubar"` / `role="menuitem"` with a simple `<nav>` with `<ul>`/`<li>` pattern on desktop
- Add `role="dialog"`, `aria-modal="true"`, and focus trap to ProcessingModal
- Add `aria-describedby` for inline error messages in bulk issuance

---

### 4. Responsive Design
**Rating:** 4.5/5

**Strengths:**
- **Breakpoint strategy:** Consistent `sm:`, `md:`, `lg:` Tailwind breakpoints
- **Mobile navigation:** Full hamburger → slide-out drawer at `< 768px` with body scroll lock
- **Responsive typography:** Dashboard headings scale `text-xl md:text-2xl lg:text-3xl`
- **Responsive grid:** Summary cards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Mobile-specific layouts:** IssuerDashboard shows card-based activity on mobile, table on desktop
- **Touch targets:** All interactive elements enforce `min-h-[44px]` and `min-w-[44px]`
- **BadgeImage component** ([BadgeImage.tsx](gcredit-project/frontend/src/components/common/BadgeImage.tsx)) implements responsive srcset with lazy loading
- **BadgeShareModal** goes full-screen on mobile, constrained on desktop
- **Responsive padding:** Layout uses `px-4 py-4 md:px-6 md:py-6`

**Issues:**
1. **BadgeEmbedPage not responsive** — [BadgeEmbedPage.tsx](gcredit-project/frontend/src/pages/BadgeEmbedPage.tsx) uses `lg:grid-cols-2` but code preview blocks with `<pre>` will overflow on small screens without proper `overflow-x-auto` handling on mobile.
2. **AdminAnalyticsPage overview cards** — Uses `md:grid-cols-4` which may be too many columns on smaller tablets. Should consider `sm:grid-cols-2 lg:grid-cols-4`.
3. **BulkPreviewPage table** — Table data may overflow on mobile without a responsive card alternative like IssuerDashboard has.

**Recommendations:**
- Add mobile card layout for BulkPreviewTable (matches IssuerDashboard pattern)
- Adjust AdminAnalyticsPage grid to `sm:grid-cols-2 lg:grid-cols-4`

---

### 5. User Flows
**Rating:** 4/5

**Strengths:**
- **Login flow:** Clean email/password → redirect to intended page (`location.state.from`) → role-based dashboard
- **Badge claiming:** Dashboard shows pending badges → "Claim Badge" button → CelebrationModal with confetti → badge status updates optimistically
- **Badge detail:** Click badge → BadgeDetailModal with hero, info, timeline, evidence, sharing, verification sections
- **Sharing flow:** BadgeShareModal with tab-based Email/Teams/Widget options and focus trap
- **Bulk issuance:** Download template → Upload CSV → Validation preview → Error correction → Confirm → ProcessingModal with progress → Results
- **Verification:** Public URL → badge details with validity/revocation status → JSON-LD download
- **Revocation:** Admin selects badge → RevokeBadgeModal with reason + notes → confirmation → toast notification

**Issues:**
1. **Dead links in Quick Actions** — Multiple "Quick Action" buttons navigate to routes that don't exist in [App.tsx](gcredit-project/frontend/src/App.tsx):
   - [EmployeeDashboard.tsx L188](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L188): `/catalog` — no route
   - [EmployeeDashboard.tsx L141](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L141): `/badges` — no route
   - [IssuerDashboard.tsx L85](gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx#L85): `/badges/issue` — no route
   - [IssuerDashboard.tsx L93](gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx#L93): `/badges/manage` — no route
   - [ManagerDashboard.tsx L86](gcredit-project/frontend/src/pages/dashboard/ManagerDashboard.tsx#L86): `/team/nominate` — no route
   - [ManagerDashboard.tsx L94](gcredit-project/frontend/src/pages/dashboard/ManagerDashboard.tsx#L94): `/team/skills` — no route
   - [AdminDashboard.tsx L85,L129](gcredit-project/frontend/src/pages/dashboard/AdminDashboard.tsx#L85): `/admin/templates` — no route
   - [AdminDashboard.tsx L139](gcredit-project/frontend/src/pages/dashboard/AdminDashboard.tsx#L139): `/admin/settings` — no route
   - [TimelineView.tsx L176](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L176): `/docs/help/earning-badges` — no route
   
   Clicking these will show a blank page (no 404 handler). **This is the most user-facing bug in the audit.**

2. **No 404/catch-all route** — [App.tsx](gcredit-project/frontend/src/App.tsx) has no `<Route path="*">` fallback. Users who hit a non-existent URL see a blank page.

3. **AdminAnalyticsPage uses mock data** — [AdminAnalyticsPage.tsx L46-100](gcredit-project/frontend/src/pages/AdminAnalyticsPage.tsx#L46-L100) has a TODO comment and uses hardcoded mock data with a `setTimeout` delay. This will show fake data in production.

**Recommendations:**
- **CRITICAL:** Add a 404 route with a helpful empty state
- **CRITICAL:** Remove or disable Quick Action buttons pointing to non-existent routes. Either hide them, show a "Coming Soon" tooltip, or redirect to the closest available page
- Replace mock data in AdminAnalyticsPage with actual API call, or clearly label as "Demo Data" in the UI

---

### 6. Error Handling UX
**Rating:** 4/5

**Strengths:**
- **ErrorBoundary component** wraps all dashboard views with crash recovery
- **ErrorDisplay component** with three variants (`inline`, `card`, `page`) provides consistent error UX
- **Login errors:** Inline `role="alert"` with `aria-live="assertive"` for immediate screen reader announcement
- **Toast notifications** (Sonner) used consistently for success/failure feedback across login, sharing, claiming, revocation
- **FormError component** with accessible error identification (`role="alert"`, icon + text)
- **API errors:** VerifyBadgePage handles 404, 410, and generic errors with specific messaging
- **RevokeBadgeModal** shows both inline error and toast on failure

**Issues:**
1. **`window.alert()` usage** — Two places use native browser alerts instead of toasts:
   - [BulkPreviewPage.tsx L157](gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx#L157): `alert(err instanceof Error ? err.message : 'Download failed')`
   - [ProcessingComplete.tsx L60](gcredit-project/frontend/src/components/BulkIssuance/ProcessingComplete.tsx#L60): `alert('Failed to download error report')`
   
   Native alerts block the UI thread and are inconsistent with the toast pattern used everywhere else.

2. **AdminAnalyticsPage error state** — Uses custom error UI instead of the shared `ErrorDisplay` component, creating visual inconsistency.

3. **TimelineView error state** — Uses a simple inline red box instead of the `ErrorDisplay` component with retry.

**Recommendations:**
- Replace `window.alert()` with `toast.error()` from Sonner
- Use `ErrorDisplay` component consistently in AdminAnalyticsPage and TimelineView

---

### 7. Loading & Empty States
**Rating:** 4.5/5

**Strengths:**
- **LoadingSpinner** with three sizes (`sm`, `md`, `lg`), optional text, `role="status"`, and `aria-busy="true"`
- **PageLoader** used consistently across all dashboards with descriptive text ("Loading your dashboard...", "Loading issuer dashboard...")
- **Skeleton loading** on VerifyBadgePage for content placeholders
- **Route-level loading** via React Suspense with `LoadingFallback` spinner
- **Empty states** are contextual and helpful:
  - `NoBadgesState`: "Start earning badges..."
  - `NoActivityState`: "Activity will appear here..."
  - `NoTeamMembersState`: "Team members will appear here..."
  - `EmptyPreviewState`: For bulk issuance with no valid rows
  - Wallet empty state with scenario detection (all badges, pending only, filter active, no badges)
- **Inline loading** for buttons (login spinner, refresh spinner with animation)
- **Drag-and-drop feedback** in BulkIssuancePage with visual state changes

**Issues:**
1. **BadgeEmbedPage loading** — Uses a custom spinner instead of `LoadingSpinner`/`PageLoader`, creating a minor inconsistency.
2. **AdminAnalyticsPage loading** — Also uses a custom spinner rather than the shared component.

**Recommendations:**
- Replace custom spinners with shared `PageLoader` component for visual consistency

---

### 8. i18n Readiness
**Rating:** 5/5

**Strengths:**
- **Zero Chinese strings** found in production code (the only CJK match was a regex pattern in a test file verifying absence of Chinese: [ProcessingModal.test.tsx L53](gcredit-project/frontend/src/components/BulkIssuance/__tests__/ProcessingModal.test.tsx#L53))
- All user-facing text is in English
- Date formatting uses `toLocaleDateString('en-US', ...)` and `date-fns format()`
- String literals are inline (not extracted to i18n files), which is appropriate for a v1 internal tool but noted for future i18n planning

**Issues:**
- None

---

### 9. Design System Consistency
**Rating:** 4/5

**Strengths:**
- **CSS Variables:** Full theme token system in [index.css](gcredit-project/frontend/src/index.css) with oklch colors, radius tokens, and dark mode support
- **Tailwind Configuration:** Custom theme integrated via `@theme inline` with Shadcn/ui conventions
- **Spacing:** Consistent `space-y-6`, `gap-4`, padding patterns (`p-4 md:p-6 lg:p-8`)
- **Typography:** Consistent heading hierarchy (`text-xl md:text-2xl lg:text-3xl` for page titles, `text-lg` for card titles, `text-sm` for descriptions)
- **Icon strategy:** Lucide icons used consistently, emoji for decorative elements with `aria-hidden="true"`
- **Color palette:** Blue-600 primary, destructive red, green for success — consistent throughout

**Issues:**
1. **Mixed gradient backgrounds** — AdminAnalyticsPage and BadgeEmbedPage use `bg-gradient-to-br from-blue-50 via-white to-purple-50` while the main Layout uses `bg-slate-50`. This creates a different visual feel on admin pages vs. the rest of the app.
2. **Card shadow inconsistency** — Some pages use `shadow-sm` (via Shadcn Card), others use `shadow-lg` or `shadow-xl` (AdminAnalyticsPage, BadgeEmbedPage). The UX spec doesn't define shadow levels.
3. **Border-left accent pattern** — AdminAnalyticsPage uses `border-l-4 border-blue-500` on overview cards, which is unique to that page and not used elsewhere.

**Recommendations:**
- Standardize background treatment across all pages (prefer `bg-slate-50` from Layout)
- Standardize shadow levels to match Shadcn Card defaults
- Keep border-left accent for analytics (distinctive for data visualization pages) but document the pattern

---

### 10. Performance Perception
**Rating:** 4.5/5

**Strengths:**
- **Code splitting:** All page components are lazy-loaded with `React.lazy()` in [App.tsx](gcredit-project/frontend/src/App.tsx) (TD-013)
- **Suspense boundary:** Global fallback spinner during chunk loading
- **Lazy image loading:** BadgeImage uses `loading="lazy"` with srcset for responsive sizes
- **Optimistic UI:** Badge claim updates local state immediately before API confirmation
- **Debounced search:** `useDebounce(search, 300)` prevents excessive API calls in user search and badge search
- **Processing feedback:** BulkIssuance ProcessingModal shows simulated progress bar (1 badge/second) to reduce perceived wait time
- **Session storage:** Badge wallet filter persisted to avoid re-selection
- **React Query:** TanStack Query manages server state with automatic caching and background refetching

**Issues:**
1. **AdminAnalyticsPage fake delay** — [AdminAnalyticsPage.tsx L55](gcredit-project/frontend/src/pages/AdminAnalyticsPage.tsx#L55): `await new Promise(resolve => setTimeout(resolve, 1000))` adds an artificial 1-second delay with mock data, which will be perceived as slow.
2. **No skeleton loading on dashboard cards** — Dashboard summary cards go from spinner to full content. Skeleton placeholders (like VerifyBadgePage uses) would feel faster.

**Recommendations:**
- Remove artificial delay from AdminAnalyticsPage when connecting to real API
- Add skeleton loading for dashboard summary cards

---

## Critical Issues (Must Fix Before v1.0.0)

| # | Area | Issue | Severity | Estimated Fix |
|---|------|-------|----------|---------------|
| 1 | User Flows | **Dead Quick Action links** — 9 buttons navigate to non-existent routes (`/catalog`, `/badges`, `/badges/issue`, `/badges/manage`, `/team/nominate`, `/team/skills`, `/admin/templates`, `/admin/settings`, `/docs/help/earning-badges`). Users see blank page. | **P0 - Critical** | 2h — Either remove/hide buttons, show "Coming Soon" disabled state, or remap to existing pages |
| 2 | User Flows | **No 404 catch-all route** in App.tsx. Any typo or dead link shows blank white page with no recovery. | **P0 - Critical** | 1h — Add `<Route path="*">` with a friendly "Page Not Found" component and navigation back to dashboard |
| 3 | Navigation | **Hardcoded `localhost:3000` URLs** in 6 files (VerifyBadgePage, BadgeDetailModal, EvidenceSection, SimilarBadgesSection, ReportIssueForm, useWallet). These bypass `VITE_API_URL` and will break in staging/production. | **P0 - Critical** | 1h — Replace all `http://localhost:3000` with `API_BASE_URL` from env variable |
| 4 | Error UX | **`window.alert()` in BulkPreviewPage and ProcessingComplete** — Native alerts are jarring and inconsistent with toast pattern. | **P1 - High** | 15min — Replace with `toast.error()` |
| 5 | User Flows | **AdminAnalyticsPage uses mock data** — Shows fake numbers with TODO comment. Users may misinterpret as real data. | **P1 - High** | 2h — Connect to real API endpoint, or add prominent "Demo Data" banner |
| 6 | Accessibility | **Desktop Navbar misuses `role="menubar"`** — Implies Arrow key navigation that isn't implemented. Confuses screen reader users. | **P1 - High** | 30min — Replace with standard nav/list pattern |
| 7 | Debug Code | **`console.log` in BadgeDetailModal** — [BadgeDetailModal.tsx L29](gcredit-project/frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx#L29): Debug logging left in production code. | **P2 - Medium** | 5min — Remove |

---

## Recommendations (Nice to Have)

| # | Area | Recommendation | Priority |
|---|------|---------------|----------|
| 1 | Navigation | Add active link styling to desktop Navbar (match MobileNav pattern) | Medium |
| 2 | Navigation | Add "User Management" link to admin navigation | Medium |
| 3 | Navigation | Fix "My Wallet" nav label/target confusion (links to `/` not `/wallet`) | Medium |
| 4 | Consistency | Consolidate 3 StatusBadge implementations into one shared component | Low |
| 5 | Consistency | Replace native `<button>` with Shadcn `Button` in BulkIssuancePage, BulkPreviewPage | Low |
| 6 | Consistency | Resolve double `<h1>` (Layout sr-only + page visible) pattern | Low |
| 7 | Consistency | Standardize spinner/loader usage (replace custom spinners in AdminAnalyticsPage, BadgeEmbedPage with shared PageLoader) | Low |
| 8 | Consistency | Standardize background gradients and shadow levels across pages | Low |
| 9 | Accessibility | Add `role="dialog"` + `aria-modal` + focus trap to ProcessingModal | Medium |
| 10 | Responsive | Add mobile card layout for BulkPreviewTable | Low |
| 11 | Performance | Add skeleton placeholders for dashboard summary cards | Low |
| 12 | Code Quality | Resolve remaining TODOs in TimelineView.tsx (badge count from API) and BadgeDetailModal.tsx (owner check) | Low |

---

## Chinese String Findings (i18n)

**No Chinese strings found in production source code.**

The only CJK-related match is a test assertion in [ProcessingModal.test.tsx L53](gcredit-project/frontend/src/components/BulkIssuance/__tests__/ProcessingModal.test.tsx#L53) that explicitly verifies the absence of Chinese characters:
```typescript
expect(allText).not.toMatch(/[\u4e00-\u9fff]/);
```

This is correct test behavior — no action needed.

---

## Overall Assessment

**Overall Rating:** 4.1/5

**Category Breakdown:**

| Area | Rating |
|------|--------|
| Navigation & Information Architecture | 4/5 |
| UI Consistency | 4/5 |
| WCAG 2.1 Accessibility | 4.5/5 |
| Responsive Design | 4.5/5 |
| User Flows | 4/5 |
| Error Handling UX | 4/5 |
| Loading & Empty States | 4.5/5 |
| i18n Readiness | 5/5 |
| Design System Consistency | 4/5 |
| Performance Perception | 4.5/5 |

**Release Recommendation:** **APPROVE WITH CONDITIONS**

**Conditions for Approval:**
1. Fix the 9 dead Quick Action links (Critical #1) — either remove, disable with "Coming Soon", or remap
2. Add 404 catch-all route (Critical #2) 
3. Replace hardcoded `localhost:3000` URLs with environment variable (Critical #3)

**Nice-to-have before release (if time permits):**
4. Replace `window.alert()` with `toast.error()` (15 min fix)
5. Remove `console.log` from BadgeDetailModal (5 min fix)
6. Fix `role="menubar"` misuse in Navbar (30 min fix)

Items 4-6 are quick wins totaling ~50 minutes that would significantly improve the polish of v1.0.0.

---

*Reviewed by Sally 🎨, UX Designer — G-Credit Project*  
*Audit methodology: Static code review of all frontend source files in `gcredit-project/frontend/src/`*
