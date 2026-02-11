# Code Quality Audit Report

**Date:** 2026-02-11  
**Agent:** Developer (Amelia)  
**Scope:** Audit 4 from Post-MVP Audit Plan  
**Project:** G-Credit v1.0.0 (Sprint 10 complete, 1089 tests)

---

## Executive Summary

| Category | Grade | Summary |
|----------|-------|---------|
| Static Analysis | ✅ A | 0 lint errors, 0 TypeScript errors both sides |
| Dead Code | ⚠️ B | 2 unused deps (backend), 2 unused deps (frontend) |
| Duplication | ✅ A | No significant copy-paste patterns detected |
| Pattern Consistency | ⚠️ B | Guards redundancy, 22 services missing Logger, no response wrapper |
| Test Quality | ⚠️ B- | 11 backend services without spec files, 62 frontend components untested |
| Frontend Quality | ⚠️ B | 51 direct fetch() calls vs 1 apiClient call, 71 inline styles |
| Coding Standards | ✅ A | All 7 rules passing or minor deviations |
| **Overall** | **⚠️ B+** | **Solid foundation with specific areas for improvement** |

---

## 4.1 Static Analysis

### Backend

| Check | Result | Details |
|-------|--------|---------|
| ESLint | ✅ PASS | 0 errors, 0 warnings (`--max-warnings=0`) |
| TypeScript (`tsc --noEmit`) | ✅ PASS | No type errors |
| `npm audit` | ⚠️ 4 vulnerabilities | 3 moderate, 1 high |

**Vulnerability Details:**

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| `@isaacs/brace-expansion` 5.0.0 | **HIGH** | Uncontrolled Resource Consumption (GHSA-7h2j-956f-4vf2) | `npm audit fix` |
| `lodash` 4.0.0-4.17.21 | Moderate | Prototype Pollution in `_.unset`/`_.omit` (GHSA-xxjr-mmjv-4gpg) | `npm audit fix` |
| `@nestjs/config` (via lodash) | Moderate | Transitive dependency | Update @nestjs/config |
| `@nestjs/swagger` (via lodash) | Moderate | Transitive dependency | Update @nestjs/swagger |

> **Note:** lodash vulnerability is tracked by ADR-002 (risk accepted). The `@isaacs/brace-expansion` HIGH vulnerability should be addressed before pilot.

### Frontend

| Check | Result | Details |
|-------|--------|---------|
| ESLint | ✅ PASS | 0 errors, 0 warnings |
| TypeScript (`tsc --noEmit`) | ✅ PASS | No type errors |
| `npm audit` | ⚠️ 1 vulnerability | 1 high |

**Vulnerability Details:**

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| `axios` ≤1.13.4 | **HIGH** | DoS via `__proto__` key in mergeConfig (GHSA-43fc-jf86-j433) | `npm audit fix` |

---

## 4.2 Dead Code Detection

### 4.2.1 Unused Dependencies

**Backend (`package.json`):**

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `keyv` | ^5.0.0 | ❌ **Unused** | 0 references in src/ — likely a leftover from cache-manager setup |
| `swagger-ui-express` | ^5.0.1 | ⚠️ **Implicit** | 0 direct imports but used by @nestjs/swagger at runtime |

**Frontend (`package.json`):**

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `framer-motion` | ^12.29.2 | ❌ **Unused** | 0 imports in src/ — only referenced in `vite.config.ts` chunk splitting |
| `tailwindcss-animate` | ^1.0.7 | ❌ **Unused** | Not referenced in `tailwind.config.js` or any source file |

**Recommendation:** Remove `keyv`, `framer-motion`, and `tailwindcss-animate`. Keep `swagger-ui-express` (runtime dependency of @nestjs/swagger).

### 4.2.2 Commented-Out Code

✅ **None found.** No commented-out code blocks detected in either backend or frontend source files.

### 4.2.3 Console.log Usage

| Location | Count | Details |
|----------|-------|---------|
| Backend src/ (non-test) | 1 | `main.ts` — informational message about secret generation (acceptable) |
| Backend test files | 2 | `baked-badge.spec.ts` — debug logging in tests (minor) |
| Frontend src/ (non-test) | 1 | `ErrorBoundary.tsx` — `console.error` for error boundary (acceptable pattern) |

### 4.2.4 Chinese Characters in Source

✅ **None found.** All source code is in English (Rule 1 compliant).

### 4.2.5 TODO/FIXME Comments

✅ **None found.** No untracked TODO/FIXME/HACK comments in source code.

---

## 4.3 Duplication Analysis

### Error Handling Patterns

All services consistently use NestJS built-in HTTP exceptions. Distribution across services:

| Exception Type | Usage Count (across all services) | Pattern |
|---------------|-----------------------------------|---------|
| `NotFoundException` | 55 | Consistent |
| `BadRequestException` | 73 | Consistent |
| `ForbiddenException` | 16 | Consistent |
| `UnauthorizedException` | 10 | auth.service.ts only (expected) |
| `ConflictException` | 9 | Appropriate for version conflicts |
| `InternalServerErrorException` | 0 | Good — framework handles uncaught errors |

✅ **No duplicate authorization logic** — all authorization flows through global guards + `@Roles` decorator.

### DTO Patterns

Controllers consistently use separate DTOs for each endpoint. No obvious consolidation opportunities found — DTOs are appropriately scoped to their endpoints.

---

## 4.4 Pattern Consistency

### 4.4.1 Guard Application

Guards are applied **globally** via `APP_GUARD` in `app.module.ts`:
- `JwtAuthGuard` — JWT validation on all routes
- `RolesGuard` — role-based access control  
- `ThrottlerGuard` — rate limiting (Story 8.6)

**Finding:** 12 controllers have **redundant** `@UseGuards(JwtAuthGuard, RolesGuard)` decorators. These are unnecessary since guards are applied globally, but they don't cause harm and arguably serve as documentation.

| Controllers with Redundant Guards | Count |
|-----------------------------------|-------|
| `admin-users`, `badge-issuance`, `badge-templates`, `bulk-issuance`, `dashboard`, `evidence`, `m365-sync`, `milestones`, `skill-categories`, `skills`, `badge-analytics`, `badge-sharing`, `teams-sharing`, `teams-action` | 14 |

**Recommendation:** Low priority. Consider removing redundant `@UseGuards` for consistency, or keep them as explicit documentation. Either way, be consistent.

### 4.4.2 Logging

| Pattern | Count | Status |
|---------|-------|--------|
| Services WITH NestJS Logger | ~8 (large services) | ✅ |
| Services WITHOUT any logger | 22 | ⚠️ |

**Services missing Logger instance:**
- `analytics.controller.ts`, `assertion-generator.service.ts`, `csv-parser.service.ts`
- `badge-issuance.controller.ts`, `badge-analytics.controller.ts`, `badge-analytics.service.ts`
- `badge-templates.controller.ts`, `badge-verification.controller.ts`
- `recommendations.service.ts`, `issuance-criteria-validator.service.ts`
- `evidence.controller.ts`, `evidence.service.ts`
- `teams-action.controller.ts`, `teams-sharing.controller.ts`
- `milestones.controller.ts`, `auth.controller.ts`
- `skill-categories.controller.ts`, `skill-categories.service.ts`
- `skills.controller.ts`, `skills.service.ts`
- `app.controller.ts`, `app.service.ts`

**Impact:** Error handling in these services/controllers won't produce structured log output. Errors will only be caught by NestJS exception filter.

**Recommendation:** Add `private readonly logger = new Logger(ClassName.name)` to all services and controllers. Priority: services first, controllers can rely on the service layer logging.

### 4.4.3 Response Wrapper

No standardized response envelope (e.g., `{ data, meta, errors }`) is used. Controllers return raw objects/arrays directly.

**Current pagination responses are inconsistent:**

| Service | Pagination Shape |
|---------|-----------------|
| `badge-templates` | `{ data, total, page, totalPages }` |
| `admin-users` | `{ data, pagination: { page, limit, total, totalPages } }` |
| `bulk-issuance` | `{ rows, totalRows, page, pageSize, totalPages }` |
| `analytics` | `limit` + `offset` parameters |
| `badge-issuance` | `{ data, pagination: { page, limit, total, totalPages } }` |

**Recommendation:** Consider standardizing pagination responses for Phase 2.  A shared `PaginatedResponse<T>` type would improve frontend consistency.

### 4.4.4 Controller Prefix

All controllers correctly use `api/` prefix per coding standard #2:
- ✅ 18 controllers with `api/` prefix
- ✅ `app.controller.ts` — root controller with no prefix (intentional for `/health` and `/` endpoints)

---

## 4.5 Test Quality

### 4.5.1 Test Distribution

| Layer | Test Cases | Spec Files |
|-------|-----------|------------|
| Backend unit tests | 562 | 38 spec files |
| Frontend tests | 527 | 45 test files |
| **Total** | **1,089** | **83 files** |

### 4.5.2 Assertion Density

Lowest assertion-to-test ratios (potential quality concern at ratio < 1.5):

| File | Tests | Expects | Ratio |
|------|-------|---------|-------|
| `graph-email.service.spec.ts` | 6 | 6 | 1.0 |
| `graph-teams.service.spec.ts` | 6 | 6 | 1.0 |
| `teams-sharing.controller.spec.ts` | 7 | 7 | 1.0 |
| `badge-issuance.controller.spec.ts` | 1 | 1 | 1.0 |
| `app.controller.spec.ts` | 1 | 1 | 1.0 |
| `microsoft-graph.module.spec.ts` | 7 | 7 | 1.0 |

**Note:** 1:1 ratio tests have exactly one assertion per case. These are not necessarily weak — they may be testing single behaviors correctly. However, `badge-issuance.controller.spec.ts` with only 1 test for a 415-line controller is a significant gap.

### 4.5.3 Backend Services Without Spec Files

| Service | Lines | Risk |
|---------|-------|------|
| `badge-templates.service.ts` | 386 | **HIGH** — core module, 0 unit tests |
| `blob-storage.service.ts` | 346 | **HIGH** — critical infrastructure |
| `issuance-criteria-validator.service.ts` | 358 | **HIGH** — complex validation logic |
| `badge-notification.service.ts` | N/A | MEDIUM — email notification logic |
| `csv-parser.service.ts` | N/A | LOW — covered by csv-validation.service.spec.ts |
| `email.service.ts` | N/A | MEDIUM — email infrastructure |
| `skill-categories.service.ts` | N/A | MEDIUM — CRUD service |
| `skills.service.ts` | N/A | MEDIUM — CRUD service |
| `prisma.service.ts` | N/A | LOW — thin wrapper |
| `storage.service.ts` | N/A | LOW — thin wrapper |
| `app.service.ts` | N/A | LOW — hello world |

**Recommendation:** Prioritize spec files for `badge-templates.service.ts`, `blob-storage.service.ts`, and `issuance-criteria-validator.service.ts`. These are complex services with no unit test coverage.

### 4.5.4 Frontend Components Without Tests

**Pages without tests (12):**
- All 5 dashboard pages (`AdminDashboard`, `DashboardPage`, `EmployeeDashboard`, `IssuerDashboard`, `ManagerDashboard`)
- `AdminAnalyticsPage` (has separate test), `AdminUserManagementPage`, `BadgeEmbedPage`, `ClaimBadgePage`, `LoginPage`, `NotFoundPage`, `VerifyBadgePage`

**Components without tests (62+):**
- All `BadgeDetailModal` sub-components (10 files)
- All `BadgeWallet` empty state scenarios (4 files)
- All `TimelineView` sub-components (6 files)
- All `analytics` chart components (5 files)
- All `ui` primitives (10 files — `button`, `card`, `dialog`, `input`, etc.)
- `Navbar`, `ProtectedRoute`, `BadgeShareModal`, `UserListTable`, admin dialogs

**Note:** Some untested components (ui primitives) are generated by shadcn/ui and typically don't need custom tests. The `BadgeDetailModal` and `TimelineView` composite components are higher risk.

---

## 4.6 Frontend-Specific

### 4.6.1 Component Size

Components exceeding 300 lines (should consider splitting):

| Component | Lines | Recommendation |
|-----------|-------|----------------|
| `BadgeShareModal.tsx` | 742 | **Split** — extract share platform logic, preview, and form sections |
| `BadgeDetailModal.tsx` | 538 | Already split into sub-components ✅ (but root file still large) |
| `BadgeManagementPage.tsx` | 524 | **Split** — extract table, filters, actions into sub-components |
| `EmployeeDashboard.tsx` | 495 | **Split** — extract stat cards, badge grid, activity feed |
| `UserListTable.tsx` | 489 | **Split** — extract row actions, filters, pagination controls |
| `BadgeTemplateFormPage.tsx` | 480 | **Split** — extract form sections, image upload, skill picker |
| `BulkIssuancePage.tsx` | 430 | Already has sub-components but root is still large |
| `TimelineView.tsx` | 398 | Already split into sub-components ✅ |
| `BadgeTemplateListPage.tsx` | 397 | **Split** — extract grid/list toggle, card component |

### 4.6.2 API Client Consistency

| Pattern | Count | Status |
|---------|-------|--------|
| Direct `fetch()` calls | 51 | ⚠️ Widespread |
| Centralized `apiClient` (axios) | 1 | ❌ Near-unused |

**Finding:** The project has `axios` installed and an `apiClient` configured, but 51 API calls use `fetch()` directly across 20 files. All fetch calls correctly use `API_BASE_URL` from `lib/apiConfig`, so they work — but this creates inconsistency in error handling, token attachment, response parsing, and retry logic.

**Files with most `fetch()` usage:** `BulkPreviewPage.tsx`, `BadgeDetailModal.tsx`, `BulkIssuancePage.tsx`, `ProfilePage.tsx`

**Recommendation:** This is a high-value refactor for Phase 2. Standardize on either fetch or axios (not both). If keeping axios, migrate all fetch calls to apiClient. If removing axios, remove the dependency.

### 4.6.3 State Management

| Pattern | Count | Status |
|---------|-------|--------|
| Zustand stores | 1 (`authStore.ts`) | ✅ Correct pattern |
| React Context | 0 | ✅ Not used |
| @tanstack/react-query | Used for server state | ✅ Good pattern |

State management is clean. Auth state in Zustand, server state in React Query. No React Context used.

### 4.6.4 Inline Styles

| Pattern | Count | Notes |
|---------|-------|-------|
| `style={...}` attributes | 71 | ⚠️ Should prefer Tailwind classes |

**Recommendation:** Audit the 71 inline style usages. Some may be dynamic (e.g., computed widths, colors from data) which are acceptable. Static styles should be converted to Tailwind classes.

### 4.6.5 Accessibility (ARIA)

| Pattern | Count |
|---------|-------|
| `aria-label`, `aria-labelledby`, `aria-describedby`, `role=` | 146 |

Good ARIA coverage across the application. Sprint 8 Story 8.3 delivered accessibility improvements.

---

## 4.7 Coding Standards Compliance

| # | Rule | Status | Details |
|---|------|--------|---------|
| 1 | All code in English | ✅ PASS | 0 Chinese characters in source |
| 2 | Controller prefix `api/` | ✅ PASS | 18/18 feature controllers compliant, 1 root controller (intentional) |
| 3 | `API_BASE_URL` for all API calls | ✅ PASS | All 51 fetch calls use `API_BASE_URL` from `lib/apiConfig` |
| 4 | Zustand for state management | ✅ PASS | Zustand for client state, React Query for server state, no React Context |
| 5 | NestJS Logger only | ⚠️ PARTIAL | 22 services/controllers lack Logger instance; 0 console.log in production code |
| 6 | Sonner toast for user messages | ✅ PASS | 43+ toast references, all using `sonner` |
| 7 | TODO references TD ticket | ✅ PASS | No untracked TODO/FIXME comments found |

---

## Prioritized Recommendations

### P0 — Before Pilot

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Run `npm audit fix` in both backend and frontend | 15 min | Resolves 5 known vulnerabilities (2 HIGH) |
| 2 | Write specs for `badge-templates.service.ts` (386 lines, 0 tests) | 4-6h | Core module with no coverage |
| 3 | Write specs for `issuance-criteria-validator.service.ts` (358 lines, 0 tests) | 3-4h | Complex validation with no coverage |

### P1 — Phase 2 Planning

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 4 | Remove unused dependencies (`keyv`, `framer-motion`, `tailwindcss-animate`) | 15 min | Reduces bundle size, removes dead deps |
| 5 | Add NestJS Logger to 22 services/controllers missing it | 2-3h | Improves observability and debugging |
| 6 | Write specs for `blob-storage.service.ts` (346 lines, 0 tests) | 3-4h | Critical infrastructure untested |
| 7 | Standardize API call pattern (fetch vs axios) | 8-12h | Eliminates dual-pattern inconsistency |
| 8 | Standardize pagination response format | 4-6h | `PaginatedResponse<T>` across all endpoints |

### P2 — Ongoing Improvement

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 9 | Split oversized components (BadgeShareModal 742 lines, etc.) | 8-12h | Maintainability |
| 10 | Audit 71 inline styles, migrate static ones to Tailwind | 3-4h | Consistency |
| 11 | Add tests for untested frontend components (62+) | 20-30h | Coverage |
| 12 | Remove redundant `@UseGuards` decorators (or document the convention) | 1h | Consistency |
| 13 | Expand `badge-issuance.controller.spec.ts` (1 test for 415-line controller) | 4-6h | Coverage |

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| Total source files (backend, non-test) | 129 |
| Total test cases | 1,089 (562 backend + 527 frontend) |
| ESLint errors | 0 |
| TypeScript errors | 0 |
| npm audit vulnerabilities | 5 (backend: 4, frontend: 1) |
| Unused dependencies | 3 (`keyv`, `framer-motion`, `tailwindcss-animate`) |
| Commented-out code blocks | 0 |
| Console.log in production code | 0 |
| Services without spec files | 11 |
| Frontend components without tests | 62+ |
| Largest backend file | `badge-issuance.service.ts` (1,379 lines) |
| Largest frontend component | `BadgeShareModal.tsx` (742 lines) |
| Direct fetch() calls (should use apiClient) | 51 |
| Inline style attributes | 71 |
| ARIA attributes | 146 |
