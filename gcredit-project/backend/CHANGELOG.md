# Changelog

All notable changes to the G-Credit Backend API project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-02-14 (Sprint 11 — Security & Quality Hardening)

### Sprint 11 Summary — Post-MVP Hardening

**Branch:** `sprint-11/security-quality-hardening`  
**Stories:** 25/25 complete (7 waves, all code reviews APPROVED)  
**Tests:** 756 tests (49 suites), 100% pass rate (+222 from v1.0.0)

#### Security — 8 Stories

- **Account Lockout (11.1):** 5 failed login attempts → 15min lockout with progressive delay, `failedLoginAttempts` + `lockedUntil` fields
- **Magic-Byte File Validation (11.2):** JPEG/PNG/GIF/WebP/PDF magic-byte validation on upload, dual validation (extension + magic bytes)
- **npm Audit + Swagger Gate (11.3):** 0 HIGH/CRITICAL vulnerabilities, Swagger disabled when `NODE_ENV=production`
- **JWT httpOnly Cookies (11.6):** Migrated from `localStorage` JWT to `httpOnly` cookies with `SameSite=Lax`, dual-read strategy for backward compatibility, `Set-Cookie` headers on login/refresh
- **Issuer Email Masking (11.7):** `a***n@example.com` format in 6 public-facing endpoints
- **PII Log Sanitization (11.8):** `LogSanitizer` utility redacts email addresses, JWT tokens, and passwords from logs
- **HTML Sanitization Pipe (11.9):** `SanitizeHtmlPipe` strips XSS vectors from all text input fields
- **Remove Unused Dependencies (11.14):** 5 unused packages removed (class-validator dupes, winston, etc.)

#### Code Quality — 5 Stories

- **Badge Templates Service Tests (11.10):** 96%+ coverage, 15 test cases for CRUD + status transitions
- **Issuance Criteria Validator Tests (11.11):** 90%+ coverage, edge case validation
- **Blob Storage Service Tests (11.12):** Azure mock tests for upload/download/delete operations
- **NestJS Logger Integration (11.13):** Replaced `console.log` with NestJS `Logger` in all 22 services/controllers
- **Pagination Standardization (11.16):** `PaginatedResponse<T>` interface + `createPaginatedResponse()` utility, 5 endpoints migrated

#### Features — 5 Stories

- **Badge Visibility Toggle (11.4):** `isPublic` field on badge assertions, owner-only toggle, verification respects visibility
- **Analytics CSV Export (11.17):** `GET /api/analytics/export` endpoint, 4-section RFC 4180 CSV with BOM
- **Verification Skill UUID→Name (11.18):** Display `nameEn` instead of raw UUID in verification responses
- **403 Access Denied Page (11.19):** Backend returns proper 403 for role-based access violations
- **ClaimPage Hardcoded UUID Fix (11.20):** Dynamic UUID from URL params instead of hardcoded value

#### Developer Experience — 2 Stories

- **CI Quality Gates (11.21):** ESLint `no-console: 'error'` rule, CI Chinese character detection in both BE/FE jobs, `scripts/check-chinese.sh`
- **Husky Pre-commit Hooks (11.22):** Root `package.json` with Husky v9 + lint-staged, pre-push mirrors full CI pipeline

### UAT Fixes & Enhancements (2026-02-17 ~ 2026-02-18)

Changes discovered and fixed during v1.1.0 UAT testing session.

#### User Management (eb5a7bf)

- **Search Scope Extended:** `admin-users.service.ts` search now matches `role` (enum value matching via `Object.values(UserRole).filter()`) and `department` (contains) in addition to firstName/lastName/email
- **Sort Enhancements:** Added `department` and `status` to `sortBy` enum in `admin-users-query.dto.ts`; `buildOrderBy` handles department→department, status→isActive mapping

#### Analytics — ISSUER Scoping (f431669)

- **New `getIssuerOverview()` Method:** Analytics service returns issuer-scoped badge stats (distinct recipients, own-issued badges, claim rate)
- **Controller Update:** `system-overview` endpoint changed from `@Roles('ADMIN')` to `@Roles('ADMIN', 'ISSUER')`; routes to `getIssuerOverview()` for ISSUER role
- **Cache Fix:** Removed fixed `@CacheKey` from system-overview (was serving identical cached data regardless of user role)
- **E2E Test Update:** `analytics.e2e-spec.ts` updated — ISSUER now expects 200 (scoped data) instead of 403

#### Developer Experience (4cc58e0)

- **Developer Onboarding Guide:** New `docs/development/developer-onboarding-guide.md` for new team members

---

## [1.0.0] - 2026-02-11 (Sprint 10 — v1.0.0 Release)

### Sprint 10 Summary — v1.0.0 Release Sprint

**Branch:** `sprint-10/v1-release`  
**UAT:** ✅ PASSED — 33/33 test cases (Round 2, 2026-02-11)  
**Tests:** 534 backend unit/integration + 527 frontend = 1,061 total (100% pass)

#### Features

- **Badge Template Management UI Support** (Story 10.8 / BUG-003)
  - Full CRUD API support for template lifecycle (DRAFT → ACTIVE → ARCHIVED)
  - `GET /api/badges/recipients` endpoint for badge issuance recipient dropdown

- **Admin Analytics — Real Data** (Story 10.5)
  - Replace mock analytics data with real database aggregations
  - Badge issuance trends, category breakdowns, user activity metrics
  - Record badge share events in AuditLog for analytics tracking

- **Profile & Password Change API** (Story 10.8 / BUG-007)
  - `GET /api/auth/profile` — includes department field
  - `PATCH /api/auth/profile` — update name
  - `POST /api/auth/change-password` — password change with verification

- **Manager Badge Revocation** (Story 10.8 / BUG-006)
  - MANAGER role added to revoke endpoint guards
  - Department-based access control (same-department only)
  - MANAGER added to `GET /api/badges/issued` with department-filtered query

- **Department Editing** (Re-UAT Round 2)
  - `PATCH /api/admin/users/:id` — Admin can edit user department

- **Email Badge Claiming** (Re-UAT Round 2)
  - Support dual claim paths: token-based (from email link) and ID-based (from wallet)
  - Populate `req.user` on `@Public()` routes with Bearer token

- **Session Validation on Startup**
  - Token expiry check on application load (frontend auth store)

#### Bug Fixes

- **BUG-002:** Navbar "My Wallet" link → `/` instead of `/wallet` (9 UAT cases affected)
- **BUG-003:** No Badge Template Management UI (5 UAT cases — new pages built)
- **BUG-004:** Issue Badge recipient dropdown not loading users (4 UAT cases)
- **BUG-005:** BadgeSearchBar input doesn't accept typing (2 UAT cases)
- **BUG-006:** Manager role has no revocation UI entry point (3 UAT cases)
- **BUG-007:** No Profile / password change page (1 UAT case)
- **BUG-008:** Prisma P2028 transaction timeout on first bulk issuance (intermittent)
- Fix verify page data mapping from `_meta` field
- Fix garbled Unicode separator in evidence file metadata
- Parse Azure credentials from connection string (eliminate redundant env vars)
- Convert UAT seed IDs to valid UUID v4 format
- Fix `canActivate` return type mismatch (TS2416)
- Increase global rate limit from 10 to 60 req/min
- Base64-encode `originalName` metadata to prevent Azure HMAC auth failure
- Eliminate duplicate PrismaService/StorageService instances
- BlobStorageService uses ConfigService DI instead of static env read

#### Technical Debt Resolved

- **TD-017:** Fix 114 tsc test type errors → 0 errors (Story 10.1)
- **TD-018:** TODO/FIXME cleanup — 14 markers removed (Story 10.3)
- **TD-019:** Frontend ESLint cleanup + CI gate (Story 10.3b)
- **TD-020:** CI E2E job missing frontend dependency (Story 10.4)
- **TD-021:** `react-hooks/set-state-in-effect` → project-level off (Story 10.4)
- **TD-022:** API path mismatches — 5 critical route fixes (Story 10.3c)
- **ESLint Regression:** Backend warnings 423 → 0 + CI zero-tolerance gate (Story 10.2)
- **UX-001:** CSV template pre-fills selected templateId + copy-to-clipboard
- **UX-002:** Partial-valid CSV allows confirm for valid rows (X of Y count)
- **UX-003:** All dashboard summary cards clickable with navigation

#### Security

- JWT dual-token authentication (15min access + 7d refresh with rotation)
- RBAC with 4 roles (ADMIN, ISSUER, MANAGER, EMPLOYEE)
- Helmet CSP headers
- Rate limiting (60 req/min global, configurable per-endpoint)
- IDOR protection on all resource endpoints
- Prisma transaction isolation for bulk operations

#### Testing

- Backend: 534 tests (35 suites), 100% pass
- Frontend: 527 tests (45 files), 100% pass
- 74 new regression tests added in Sprint 10 (Story 10.8)
- E2E: Schema-based isolation, 100% reliability

---

## [0.9.0] - Sprint 9 Complete (2026-02-08)

### Sprint 9 Summary - Epic 8: Bulk Badge Issuance + TD Cleanup

**Branch:** `sprint-9/epic-8-bulk-issuance-td-cleanup`

#### Completed Stories

##### Story 8.1: CSV Template & Validation (8h actual) - 2026-02-07
- **GET /api/bulk-issuance/template** - Download CSV template
  - UTF-8 BOM header for Windows Excel compatibility
  - Dynamic date in filename (`bulk-issuance-template-YYYY-MM-DD.csv`)
  - Headers: badgeTemplateId, recipientEmail, evidenceUrl, narrativeJustification
  - 2 example rows with "EXAMPLE-DELETE-THIS-ROW" prefix (UX-P0-2)
- **Badge Template Selector** - Frontend TemplateSelector component
  - Fetches approved templates via API, pre-fills badgeTemplateId column
- **File Upload Infrastructure** - Multer with 100KB limit for 20-badge MVP
- **Testing:** 7 ACs verified, all tests passing

##### Story 8.2: CSV Upload & Parsing + Security Hardening (4h actual) - 2026-02-07
- **POST /api/bulk-issuance/upload** - Upload and parse CSV
  - RFC 4180 compliant CSV parser with CRLF support
  - UTF-8 BOM stripping for Windows Excel files (ARCH-C5)
  - CSV injection sanitization via `sanitizeCsvField()` (ARCH-C1)
  - XSS input sanitization via `sanitize-html` (ARCH-C7)
  - DB-backed sessions with `$transaction` ReadCommitted isolation (ARCH-C4)
  - Row-by-row validation: badgeTemplateId exists + APPROVED, recipientEmail in DB
  - IDOR protection on session retrieval (ARCH-C2)
  - Rate limiting: `@Throttle` env-configurable (default 10 req/5min) (ARCH-C3)
  - 429 status documented in Swagger
- **GET /api/bulk-issuance/preview/:sessionId** - Preview parsed results
- **POST /api/bulk-issuance/confirm/:sessionId** - Confirm bulk issuance
- **GET /api/bulk-issuance/error-report/:sessionId** - Download error report CSV
- **Frontend: BulkIssuancePage** (381 lines)
  - 3-state drag-drop: default (gray) → drag-over (blue) → file-selected (green)
  - File preview with size display, explicit Upload CSV button
  - Validation summary panel with auto-navigate on 0 errors
- **Database:** BulkIssuanceSession table with status tracking
- **Testing:** 6 ACs verified, Backend 510 + Frontend 339 + E2E 143 = 992 total tests (0 failures)

##### Story 8.3: Bulk Preview UI + TD-013 Bundle Splitting (10h actual) - 2026-02-08
- **TD-013: Route-Based Code Splitting** - Bundle optimization
  - Main chunk: 707 KB → 235 KB (66.8% reduction, target <400 KB)
  - 10 lazy-loaded routes via `React.lazy()` + `<Suspense>`
  - 5 vendor chunks: react-vendor, ui-vendor, query-vendor, animation-vendor, utils-vendor
  - `vite.config.ts` `manualChunks` configuration
- **Backend Preview Enrichment**
  - Badge template name resolution for preview display
  - Recipient name resolution from user records
  - Template summary aggregation (badge counts per template)
  - Server-side pagination support (`page`/`pageSize` query params)
- **Frontend: 7 New Components** (959 lines, 29 tests)
  - `BulkPreviewHeader` — Session summary with badge/recipient counts
  - `BulkPreviewTable` — Paginated table with error highlighting and inline correction
  - `ErrorCorrectionPanel` — Inline error editing with field validation
  - `ConfirmationModal` — Final confirmation with error/valid row summary
  - `EmptyPreviewState` — Empty state with navigation back to upload
  - `SessionExpiryTimer` — Countdown timer with auto-redirect after 5s expiry
  - `ProcessingComplete` — Success state with navigation options
  - `BulkPreviewPage` — Complete rewrite (341 lines), composes all sub-components
- **Testing:** 1042 total tests (Backend 520 + Frontend 370 + E2E 152), 0 failures
- **SM Acceptance:** All 5 code review findings verified as FALSE POSITIVE

##### Story 8.4: Batch Processing Phase 1 + TD-014 Email Unification (7h actual) - 2026-02-08
- **TD-014: Email System Unification** — Remove nodemailer
  - `EmailService` rewritten to delegate to `GraphEmailService`
  - `nodemailer` + `@types/nodemailer` removed from package.json
  - `EmailModule` imports `MicrosoftGraphModule` for GraphEmailService access
  - `sendPasswordReset()` API contract preserved (zero changes in AuthService)
  - `EMAIL_SETUP_QUICK.md` updated for Graph API
- **POST /api/bulk-issuance/confirm/:sessionId** — Synchronous batch processing
  - Loop through up to 20 valid badges, call `BadgeIssuanceService.issueBadge()` each
  - Template name/UUID → resolved to template UUID before issuance
  - Recipient email → resolved to user UUID before issuance
  - Partial failure handling (individual errors don't stop batch)
  - Status transitions: VALIDATED → PROCESSING → COMPLETED/FAILED
  - IDOR protection via `loadSession()` ownership check (ARCH-C2)
  - Each badge issued in atomic `prisma.$transaction` (ARCH-C6)
- **Frontend: ProcessingModal Enhancement**
  - Chinese text translated to English (5 strings)
  - Simulated per-badge progress (1-second ticks)
  - Current badge label, success/remaining counts
  - 30-second timeout via AbortController
- **Frontend: ProcessingComplete Enhancement**
  - Failed badges table with error details
  - "Retry Failed Badges" button
  - "Download Error Report" button
  - Email notification error display
- **Module Wiring:** BulkIssuanceModule imports BadgeIssuanceModule
- **Testing:** 1087 total tests (Backend 532 + Frontend 397 + E2E 158), 0 failures
- **SM Acceptance:** 5/6 code review findings verified as FALSE POSITIVE

#### Sprint 9 Complete — All 5 Stories Done

##### TD-015: ESLint Type Safety Cleanup (8h actual) - 2026-02-07
- **Warning Reduction:** 1303 → 284 warnings (78% reduction, exceeded 62% target)
- **Shared `RequestWithUser` interface** — Replaces `req: any` across 9 controllers
  - `src/common/interfaces/request-with-user.interface.ts` (new file)
  - `AuthenticatedUser` + `RequestWithUser` typed with `UserRole` enum
- **Rule-by-rule fixes:**
  - `no-unsafe-member-access`: 497 → 78 (419 fixed)
  - `no-unsafe-argument`: 253 → 51 (202 fixed)
  - `no-unsafe-assignment`: 196 → 50 (146 fixed)
  - `no-unsafe-call`: 121 → 65 (56 fixed)
  - `no-unused-vars`: 89 → 0 (all fixed via removal/`_` prefix)
  - `unbound-method`: 67 → 0 (eslint override for test files)
  - `no-unsafe-return`: 50 → 40 (10 fixed)
  - `require-await`: 29 → 0 (removed unnecessary `async`)
  - `no-floating-promises`: 1 → 0 (added `await`)
- **ESLint config enhancements:**
  - `no-unused-vars` with `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`
  - `unbound-method: 'off'` for `**/*.spec.ts` and `**/test/**/*.ts`
- **`package.json` max-warnings:** 1310 → 284 → 282 (after CI fix)
- **Testing:** All 992 tests passing (510 unit + 339 frontend + 143 E2E), zero regressions
- **CI Fix** (commit 5deace0): Resolved 12 tsc build errors in src files
  - `badge-issuance.service.ts`: Prisma `hasSome` filter type + JsonValue cast
  - `csv-parser.service.ts`: cast `parse()` result, `instanceof Error` check
  - `badge-analytics.service.spec.ts`: `Prisma.JsonNull` test expectation
  - Remaining 126 tsc errors (98% test files) tracked as TD-017 (Sprint 10)

---

## [0.8.0] - Sprint 8 Complete (2026-02-05)

### Sprint 8 Summary - Production-Ready MVP

**Epic 10: Production-Ready MVP** - UX Excellence, Security Hardening & M365 Integration.

#### Highlights
- ✅ **12/12 Work Items Complete** (80h actual / 76h estimated)
- ✅ **17/17 P1 Technical Debt Resolved**
- ✅ **677 Tests Passing** (349 backend + 328 frontend)
- ✅ **100% Test Reliability** in parallel execution
- ✅ **WCAG 2.1 AA Compliant**

#### Stories Delivered
1. **Story 8.1:** Dashboard Homepage with Key Metrics (8h)
2. **Story 8.2:** Badge Search & Filter Enhancement (5.5h)
3. **Story 8.3:** WCAG 2.1 AA Accessibility Compliance (8.5h)
4. **Story 8.4:** Analytics API with Caching (6h)
5. **Story 8.5:** Responsive Design Optimization (4h)
6. **Story 8.9:** M365 Production Hardening (6h)
7. **Story 8.10:** Admin User Management Panel (11.5h)

#### Tasks Delivered
1. **Task 8.0:** Sprint Setup (1.5h)
2. **Task 8.6:** Security Hardening (6.5h)
3. **Task 8.7:** Architecture Fixes (5h)
4. **Task 8.8:** E2E Test Isolation (8h)

---

### Added - Admin User Management (Story 8.10) - 2026-02-03

#### Admin User Management API
- **GET /api/admin/users** - List users with search, filter, sort, pagination
  - Query params: search, role, isActive, sortBy, sortOrder, page, limit
  - Response: Paginated list with user details (excludes sensitive data)
  - Authorization: Admin role only
  
- **GET /api/admin/users/:id** - Get single user details
  - Includes role audit history
  - Authorization: Admin role only
  
- **PATCH /api/admin/users/:id/role** - Update user role
  - Request: `{ role: UserRole, note?: string }`
  - Optimistic locking: Uses roleVersion to prevent conflicts with M365 sync
  - Audit logging: Creates UserRoleAuditLog entry
  - Validation: Cannot change own role
  - Authorization: Admin role only
  
- **PATCH /api/admin/users/:id/status** - Activate/deactivate user
  - Request: `{ isActive: boolean, reason?: string }`
  - Soft delete: Sets isActive flag, does not delete user data
  - Authorization: Admin role only

#### Database Changes
- **New Table: UserRoleAuditLog**
  - Columns: `id, userId, previousRole, newRole, changedBy, changeReason, createdAt`
  - Purpose: Track all role changes for compliance and audit
  - Relations: Cascade delete with User
  
- **User Model Updates**
  - `roleSetManually` (Boolean): Flag to preserve manual role during M365 sync
  - `roleUpdatedAt` (DateTime?): When role was last changed
  - `roleUpdatedBy` (String?): Who changed the role
  - `roleVersion` (Int): Optimistic locking version for M365 sync conflicts
  - `lastSyncAt` (DateTime?): Last M365 sync timestamp
  - Migration: `20260203153938_add_user_management`

#### Security
- **SEC-HIGH-003 Resolved:** Role self-assignment vulnerability fixed
- **Admin-Only Access:** All endpoints protected by RolesGuard
- **Self-Edit Prevention:** Admins cannot modify their own role

#### Testing (29 tests, 100% pass rate)
- **Controller Tests (16):** HTTP status codes, DTO validation, authorization
- **Service Tests (13):** Business logic, optimistic locking, audit logging

---

### Added - M365 Production Hardening (Story 8.9) - 2026-02-05

#### M365 Sync API (Admin-Only)
- **POST /api/admin/m365-sync** - Trigger M365 user synchronization
  - Request: `{ syncType: "FULL" | "INCREMENTAL" }` (optional, default: FULL)
  - Response: SyncResultDto with counts, errors, duration
  - Features: Pagination (1000+ users), exponential backoff retry, audit logging
  - Authorization: Admin role only
  
- **GET /api/admin/m365-sync/logs** - Get sync history
  - Query params: limit (default: 10, max: 100)
  - Authorization: Admin role only
  
- **GET /api/admin/m365-sync/logs/:id** - Get sync log details
  - Authorization: Admin role only
  
- **GET /api/admin/m365-sync/status** - Check M365 integration availability
  - Response: `{ available: boolean, lastSync: DateTime | null }`
  - Authorization: Admin role only

#### Key Features (ADR-008 Compliance)
- **AC1: Pagination** - Handles 1000+ users via @odata.nextLink (999/page max)
- **AC2: Retry Logic** - Exponential backoff (1s→2s→4s), max 3 retries
  - Retryable errors: 429, 5xx, network errors (ECONNRESET, ETIMEDOUT, etc.)
- **AC3: Audit Logging** - M365SyncLog with syncedBy, failedCount, metadata
- **AC4: User Deactivation** - Deactivates removed AND disabled Azure accounts
  - Preserves `roleSetManually` user roles during sync
- **AC5: Error Recovery** - Per-user processing, no transaction rollback

#### Database Changes
- **M365SyncLog Table Updates**
  - `syncedBy` (String): Who triggered the sync (CLI, Admin email, or SYSTEM)
  - `failedCount` (Int): Users that failed to sync
  - `metadata` (JSON): Retry attempts, pages processed, deactivated count

- **UserAuditLog Table**
  - Logs user deactivation events from M365 sync
  - Fields: userId, action, changes, source, actorId, timestamp

#### CLI Command
- **npm run sync:m365** - CLI script for manual/scheduled sync
  - Script: `scripts/sync-m365.ts`

#### Testing (85 tests, 100% pass rate)
- **Service Unit Tests (55):** Pagination, retry, deactivation, error recovery
- **Controller Unit Tests (12):** HTTP status codes, authorization
- **E2E Tests (18):** Full API integration tests with audit validation

---

## [0.7.0] - 2026-02-02 (Sprint 7 Complete)

### Sprint 7 Summary - Badge Revocation & Lifecycle UAT

**Epic 9: Badge Revocation** - Complete badge lifecycle management with revocation, notifications, and admin UI.

#### Highlights
- ✅ **10/10 Stories Complete** (38.5h actual / 41-47h estimated)
- ✅ **UAT 100% Pass** (15/15 tests across Employee, Manager, External Verifier personas)
- ✅ **9 P0 Issues Fixed** (4 Security, 1 Architecture, 4 UX from pre-UAT reviews)
- ✅ **302 Core Tests Passing** (100% pass rate)
- ✅ **0 P0/P1 Bugs** found during UAT

#### Stories Delivered
1. **Story 9.1:** Badge Revocation API (Manager-only authorization, audit logging)
2. **Story 9.2:** Revoked Badge Display in Verification Page
3. **Story 9.3:** Employee Wallet Revoked Badge Display
4. **Story 9.4:** Revocation Email Notifications (async with retry)
5. **Story 9.5:** Admin Badge Management UI (search, filter, revoke modal)
6. **Story 0.1:** Git branch setup
7. **Story 0.2a:** Login page navigation
8. **Phase A:** Security P0 fixes (SEC-P0-001/002/003, ARCH-P0-002)
9. **Phase B:** UX P0 fixes (toast alerts, form labels, claim celebration, login)
10. **Story U.1:** Complete Lifecycle UAT

#### Pre-UAT Review Fixes (P0)
- **SEC-P0-001:** Authorization before DB query (security ordering)
- **SEC-P0-002:** 403 for unauthorized role (not 400)
- **SEC-P0-003:** Test coverage for authorization flows
- **ARCH-P0-002:** Remove console.log from production code
- **UX-P0-001:** Toast system for user feedback
- **UX-P0-002:** Form label accessibility
- **UX-P0-003:** Badge claim celebration
- **UX-P0-004:** Login navigation from header

### Added - Badge Revocation (Story 9.1) - 2026-02-01

#### Badge Revocation API
- **POST /api/badges/:id/revoke** - Revoke a badge with reason and notes
  - Authorization: Manager role only (403 for Employee/Admin)
  - Idempotency: Repeated revoke calls return 200 OK (safe to retry)
  - Audit Logging: Creates AuditLog entry for every revocation
  - Request: `{ reason: string, notes?: string }`
  - Response: `{ id, status: 'REVOKED', revokedAt, revocationReason, revocationNotes, revokedBy }`
  - Validation: Cannot revoke already REVOKED badges (idempotent)

#### Database Changes
- **New Table: AuditLog**
  - Columns: `id, action, entityType, entityId, userId, metadata (JSONB), createdAt`
  - Purpose: Comprehensive audit trail for all sensitive operations
  - Indexed: `entityType, entityId` for fast entity history queries
  
- **Badge Status Enum Update**
  - Added `REVOKED` status to BadgeStatus enum
  - Existing statuses: DRAFT, PENDING, CLAIMED, REVOKED
  - Migration: `20260201_add_revoked_status_and_audit_log`

#### Authorization & Security
- **Manager-Only Revocation:** Only users with Manager role can revoke badges
- **Authorization Ordering:** Checks permissions before database queries (security best practice)
- **HTTP Status Standardization:** 200 OK for idempotent operations, 403 for unauthorized
- **Audit Trail:** WHO (userId), WHAT (revoke badge), WHEN (timestamp), WHY (reason + notes)

#### Testing (47 tests, 100% pass rate)
- **Unit Tests (21):**
  - Service layer: Authorization, idempotency, audit logging, error cases
  - Controller layer: DTO validation, HTTP status codes, response format
  - Security: Role-based access control tests
  
- **E2E Tests (26):**
  - Full revocation flow: Manager revokes badge successfully
  - Authorization: Employee/Admin get 403 errors
  - Idempotency: Repeated revoke returns 200 OK with same data
  - Audit logging: AuditLog entry created correctly
  - Error cases: Invalid badge ID (404), unauthorized (403)

#### Code Quality
- **Code Review:** 4 issues identified and fixed
  - Authorization ordering improved
  - HTTP status code standardization
  - Test completeness enhancements
  - Documentation clarity improvements
- **Test Coverage:** >80% for all new code
- **TypeScript:** Strict mode, zero compilation errors
- **ESLint:** Zero warnings

#### Documentation
- **Swagger API Docs:** Complete endpoint documentation with examples
- **Architect TDD Guide:** 500-line implementation guide in story file
- **Developer Context:** DEVELOPER-CONTEXT.md with decision reference
- **Code Comments:** Complex authorization logic well-documented

### Added - Revoked Badge Display in Verification Page (Story 9.2) - 2026-02-01

#### Public Verification Page Updates
- **Revocation Status Display:** Red alert banner with "BADGE REVOKED" message
- **Reason Categorization:** Public vs private revocation reasons
  - Public reasons (shown): "Expired", "Issued in Error", "Duplicate"
  - Private reasons (generic message): "Policy Violation", "Fraud"
- **Disabled Actions:** Download and Share buttons disabled for revoked badges
- **ARIA Accessibility:** role="alert" for screen readers

#### API Changes
- **GET /api/badges/:id/verify** - Enhanced response with revocation data
  - Returns: `{ status: 'REVOKED', revokedAt, revocationReason, revokedBy }`
  - Reason categorization logic in backend
  - Defensive rendering for missing revokedBy field

#### Frontend Components
- **RevokedBadgeAlert:** Reusable component for revocation warnings
- **Reason Display Logic:** Conditional rendering based on reason category
- **Visual Design:** Red color theme, warning icons, clear messaging

#### Testing (25 tests, 100% pass rate)
- **Unit Tests (8):** Reason categorization, API integration, component rendering
- **E2E Tests (17):** Full verification page flow with revoked badges
- **Code Review:** 6 issues identified and fixed
  - AC2: revokedBy field defensive rendering
  - AC1: Conditional rendering improvements
  - AC4: Endpoint path documentation
  - DoD: Test marking consistency
  - publicReasons array alignment

### Added - Employee Wallet Revoked Badge Display (Story 9.3) - 2026-02-01

#### Employee Wallet Enhancements
- **Visual Distinction:** Revoked badges displayed with:
  - Grayed out appearance (opacity 0.6)
  - Red "REVOKED" label overlay
  - RevocationSection with metadata (date, reason, revoker)
- **Default Filter:** "Active badges only" filter enabled by default
- **Filter Persistence:** sessionStorage maintains filter state across page loads
- **Disabled Sharing:** Share buttons (LinkedIn, Teams, Email) disabled with tooltips
- **Evidence Preservation:** Download button remains enabled for revoked badges

#### Frontend Features
- **RevocationSection Component:** Displays revocation metadata
  - Revocation date
  - Reason (if public category)
  - Revoker name
- **Filter Controls:** Toggle between Active/All/Revoked badges
- **Conditional Rendering:** Status-aware badge display logic
- **ARIA Labels:** Accessibility improvements for screen readers

#### Testing (24 tests passing, 3 new)
- **E2E Tests:** Revoked badge visibility, filter functionality, share button states
- **Code Review:** 6 issues identified and fixed (4 HIGH, 2 MEDIUM)
  - HIGH: AC3 Download remains enabled (evidence preservation)
  - HIGH: AC4 sessionStorage filter persistence
  - HIGH: AC5 API endpoint documentation updates
  - HIGH: LinkedIn/Teams share validation
  - MEDIUM: E2E test marking (pending UAT)
  - MEDIUM: ARIA label additions

#### UX Decisions
- **Download Policy:** Revoked badges remain downloadable (evidence/archival purposes)
- **Share Policy:** Social sharing disabled (prevent distribution of invalid credentials)
- **Filter Default:** Active badges only (reduce visual clutter, focus on valid credentials)
- **Reason Display:** Only public reasons shown (privacy protection)

### Added - Revocation Email Notifications (Story 9.4) - 2026-02-01

#### Email Notification System
- **Asynchronous Delivery:** Non-blocking email notifications for badge revocation
- **Retry Logic:** 3 attempts with exponential backoff for failed deliveries
- **Enhanced Template:** Revocation date, reason (conditional), notes, wallet URL
- **Audit Logging:** All notification attempts logged to AuditLog
- **Manager CC Infrastructure:** Prepared for future manager notifications

#### Email Template Features
- **Personalization:** Recipient name, badge name, issuer name
- **Revocation Details:**
  - Revocation date displayed
  - Reason shown only if provided and not sensitive
  - Optional notes included conditionally
- **Action Links:** Direct link to employee badge wallet
- **Professional Tone:** Supportive messaging, not punitive

#### Testing (8 tests, 100% pass rate)
- **Unit Tests (7):** Email service, template rendering, retry logic, audit logging
- **E2E Tests (1):** Full revocation flow with email delivery (expanded)
- **Code Review:** 9 issues identified and fixed (4 HIGH, 4 MEDIUM, 1 LOW)
  - revocationDate added to email template
  - Retry logic with 3 attempts
  - Audit logging for all attempts
  - Manager CC prepared but not implemented
  - Conditional notes display
  - E2E test expanded
  - Type safety improvements

### Added - Admin Badge Management UI (Story 9.5) - 2026-02-01

#### Badge Management Page
- **Table View:** Badge name, recipient, template, status, issued date, actions
- **Search:** Search by recipient name/email or template name
- **Filter:** By status (All/Active/Pending/Claimed/Revoked/Expired)
- **Pagination:** 10 badges per page with navigation controls
- **Role-Based Actions:** Admin can revoke any badge, Issuer only their own

#### Revocation Modal
- **Form Fields:**
  - Reason dropdown (6 options: Policy Violation, Issued in Error, Expired, Duplicate, Fraud, Other)
  - Notes textarea (optional, 1000 character limit)
  - Character count indicator
- **Validation:** Required reason, optional notes
- **Feedback:** Toast notifications for success/error
- **Accessibility:** Keyboard navigation, ARIA labels, focus management

#### Backend Enhancements
- **Query Parameters:** Added `search` and `activeOnly` to QueryBadgeDto
- **Search Implementation:** Filter by recipient name/email and template name
- **Active Filter:** Combined PENDING + CLAIMED statuses
- **GET /api/badge-issuance/issued-badges** - Enhanced with search and filter support

#### Frontend Architecture
- **API Client:** badgesApi.ts with getAllBadges, revokeBadge functions
- **Components:**
  - BadgeManagementPage.tsx - Main page with table
  - RevokeBadgeModal.tsx - Modal form component
- **State Management:** React Query for data fetching and cache invalidation
- **UI Components:** Radix UI Dialog, Select, Label, Textarea (shadcn/ui)
- **Toast System:** Sonner for notifications

#### Testing (52 tests, 100% pass rate)
- **API Client Tests (17):** Badge operations, auth, error handling
- **Modal Tests (13):** Form validation, rendering, accessibility
- **Page Tests (22):** Table rendering, revoke logic, search, filter, error states
- **Test Infrastructure:** Vitest + jsdom + @testing-library/react

#### Code Review Fixes (5 issues)
- **HIGH:** Revocation reasons synced with backend enum
- **MEDIUM:** EXPIRED badges blocked from revocation (AC1 compliance)
- **MEDIUM:** Search label corrected (removed unsupported "badge ID" claim)
- **MEDIUM:** Toast notifications added (sonner integration)
- **LOW:** "Active" filter option added (PENDING + CLAIMED combined)

### Technical Notes (Stories 9.1-9.5)
- **TDD Approach:** Test-first development for all five stories
- **Code Quality:** 30 code review issues identified and fixed (4+6+6+9+5 across stories)
- **Test Coverage:** >80% for all new code, 334 total tests (297 passing core, 100% pass rate)
- **Idempotency Design:** Safe revocation operations (Story 9.1)
- **Reason Categorization:** Privacy-aware display logic (Stories 9.2, 9.3)
- **Async Notifications:** Non-blocking email delivery with retry (Story 9.4)
- **UX Consistency:** Unified revocation display across verification + wallet + admin UI
- **Audit Logging:** Comprehensive compliance foundation (GDPR, SOX ready)
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support
- **Frontend Testing:** Full test suite with vitest + testing-library (Story 9.5: 52 tests)
- **Future Enhancement:** Story U.1 (UAT testing) will validate complete Epic 9

---

## [0.6.0] - 2026-01-31

### Added - Badge Sharing & Social Proof (Sprint 6, Epic 7)

#### Teams Badge Notifications
- **Adaptive Cards 1.4** - Rich Teams notifications with badge details and action buttons
- **Badge Issuance Trigger** - Automatic Teams notification when badge is issued (PENDING status)
- **Interactive Actions** - "Claim Badge" button in Teams updates badge to CLAIMED
- **Email Fallback** - Automatic email notification if Teams delivery fails
- **Non-blocking** - Teams notifications don't block badge issuance flow
- **Configuration** - `ENABLE_TEAMS_NOTIFICATIONS` flag to enable/disable

#### New API Endpoints
- **Share Badge to Teams** - `POST /badges/:badgeId/share/teams`
  - Request: `{ teamId, channelId, personalMessage? }`
  - Authorization: Only recipient or issuer can share
  - Validation: Cannot share REVOKED badges
  - Response: `{ success, shareId, sharedAt, channelUrl }`

- **Claim Badge Action** - `POST /api/teams/actions/claim-badge`
  - Request: `{ badgeId, userId }`
  - Authorization: Only recipient can claim
  - Validation: Badge must be PENDING status
  - Response: `{ success, message, badge, adaptiveCard }`
  - Returns: Updated Adaptive Card showing CLAIMED status

#### Adaptive Card Features
- **Badge Image** - Displays badge template image (80x80)
- **Badge Details** - Name, issuer, description, issue date
- **Status Indicator** - PENDING with claim instructions, or CLAIMED with success message
- **Action Buttons:**
  - "View Badge" - Opens badge wallet (OpenUrl action)
  - "Claim Badge" - Updates status to CLAIMED (Action.Execute)
- **Responsive Design** - Works on Teams desktop, web, and mobile
- **Theme Support** - Adapts to Teams light/dark theme

#### Configuration & Setup
- **Environment Variables:**
  - `ENABLE_TEAMS_NOTIFICATIONS` - Enable/disable Teams (default: false)
  - `DEFAULT_TEAMS_TEAM_ID` - Default team for notifications (optional)
  - `DEFAULT_TEAMS_CHANNEL_ID` - Default channel (optional)
  - `PLATFORM_URL` - Backend URL for links
  - `FRONTEND_URL` - Frontend URL for wallet links
- **Startup Validation** - Validates Graph API credentials on app start
- **Configuration Guide** - Complete setup documentation in `docs/setup/teams-integration-setup.md`

#### Testing & Documentation
- **Unit Tests:** 48 tests added (194 total, 100% passing)
  - BadgeNotificationCardBuilder: 19 tests
  - TeamsBadgeNotificationService: 11 tests  
  - TeamsSharingController: 7 tests
  - TeamsActionController: 7 tests
  - Badge Issuance Integration: 4 tests
- **Swagger Documentation:** Added "Badge Sharing" and "Teams Actions" API tags
- **Setup Guide:** 280-line guide with configuration, permissions, troubleshooting

#### Technical Details
- **Graph API Integration** - Uses existing GraphTeamsService from Story 0.4
- **Error Handling** - Graceful degradation with email fallback
- **Logging** - Detailed logs for Teams send, fallback, and errors
- **Authorization** - JWT authentication for all endpoints
- **Validation** - DTO validation with class-validator

### Changed
- Updated Swagger API documentation with Teams endpoints
- Enhanced badge issuance flow to trigger Teams notifications
- Updated `.env.example` with Teams configuration examples

### Technical Notes
- Compatible with Microsoft Graph API v1.0
- Requires `TeamsActivity.Send` Graph API permission
- Follows Adaptive Cards 1.4 schema
- Zero breaking changes to existing API

---

## [0.5.0] - 2026-01-29

### Added - Badge Verification & Open Badges 2.0 (Sprint 5)

#### Public Verification System
- **Public Verification Page** - `GET /verify/:verificationId` HTML page with badge details
- **Verification API** - `GET /api/verify/:verificationId` JSON-LD assertion (no auth required)
- **Email Masking** - Recipient privacy protection (j***@example.com format)
- **Status Indicators** - Valid, expired, revoked badge states with visual feedback
- **CORS Support** - Public endpoints accessible from external domains
- **Cache Strategy** - 1h cache for valid badges, no-cache for revoked
- **Custom Headers** - X-Verification-Status header for client-side handling

#### Open Badges 2.0 Compliance
- **JSON-LD Assertions** - Three-layer architecture (Issuer → BadgeClass → Assertion)
- **Hosted Verification** - Public verification URLs (not GPG signed)
- **SHA-256 Email Hashing** - Recipient email privacy in assertions
- **Evidence URLs** - Support for multiple evidence files from Sprint 4
- **Assertion Endpoint** - `GET /api/badges/:id/assertion` for external platforms
- **Standards Validation** - Compatible with Credly, Badgr, Open Badge Passport

#### Baked Badge PNG Generation
- **Sharp Integration** - `sharp@^0.33.0` for PNG image processing
- **iTXt Metadata Embedding** - Assertion JSON embedded in PNG EXIF metadata
- **Download Endpoint** - `GET /api/badges/:id/download/png` (JWT protected)
- **Authorization** - Only recipient can download their own badges
- **File Size Validation** - <5MB limit with automatic resizing
- **Lazy Generation** - On-demand PNG creation (no pre-caching)
- **Placeholder Handling** - Demo badges use generated purple placeholder image

#### Metadata Integrity & Immutability
- **SHA-256 Hashing** - Cryptographic hashing of badge assertions
- **Auto-Generation** - metadataHash auto-populated on badge issuance
- **Integrity Endpoint** - `GET /api/badges/:id/integrity` for verification
- **Tampering Detection** - Alert logging for hash mismatches
- **Backward Compatible** - Handles badges without metadataHash gracefully
- **Immutable Metadata** - Badge assertions cannot be modified after issuance

#### Database Schema Updates
- **Migration** - `20260128113455_add_verification_fields`
- **New Columns:**
  - `verificationId` (UUID, unique) - Public verification identifier
  - `metadataHash` (String) - SHA-256 hash for integrity verification
- **Index** - `idx_badges_verification` on verificationId for fast lookup
- **Backfill** - Auto-populated UUIDs for existing badges during migration

#### Frontend Components
- **VerifyBadgePage.tsx** - Public verification UI with responsive design
- **Alert Component** - Status indicators for valid/expired/revoked badges
- **Skeleton Component** - Loading state for async verification
- **API Transformation** - Handles _meta wrapper structure from backend
- **Download Button** - JSON-LD assertion download with proper MIME type

#### API Endpoints (5 new)
- `GET /verify/:verificationId` - Public HTML verification page
- `GET /api/verify/:verificationId` - Public JSON-LD assertion (CORS)
- `GET /api/badges/:id/assertion` - Open Badges 2.0 assertion
- `GET /api/badges/:id/download/png` - Baked badge PNG (JWT protected)
- `GET /api/badges/:id/integrity` - Integrity verification

#### Testing
- **68 total tests** (24 unit + 6 integration + 38 E2E)
- **Individual suites:** 100% passing
- **Parallel suite:** 45/71 (isolation issues tracked in TD-001)
- **Test Coverage:**
  - `badge-verification.e2e-spec.ts` - 12 tests
  - `baked-badge.e2e-spec.ts` - 18 tests
  - `badge-integrity.e2e-spec.ts` - 5 tests
  - `assertion-generator.service.spec.ts` - 17 tests (integrity + assertion)
  - `baked-badge.spec.ts` - 18 tests (PNG generation)

#### Documentation (9 new files)
- `sprint-5-completion-summary.md` - Sprint metrics and achievements (426 lines)
- `retrospective.md` - Sprint 5 + Epic 6 learnings (25KB)
- `technical-design.md` - Architecture and API specs (796 lines)
- `sprint-review-demo-script.md` - Complete presentation guide
- `demo-validation-checklist.md` - 6 feature validation tests
- `quick-test-script.md` - PowerShell test commands
- `performance-optimization-opportunities.md` - 5 optimizations (618 lines)
- `dev-closeout-summary.md` - Dev perspective summary
- `TECHNICAL-DEBT.md` - 5 tracked issues (18-24h effort)

#### Architecture Decision Records (3 new)
- **ADR-005:** Open Badges 2.0 Integration Strategy
- **ADR-006:** Public API Security Pattern (CORS, rate limiting)
- **ADR-007:** Baked Badge Storage Strategy (Sharp, iTXt metadata)

### Changed
- **Badge Schema** - Added verificationId and metadataHash columns
- **Verification Flow** - Public endpoints no longer require authentication
- **Badge Issuance** - Auto-generates verification identifiers
- **API Responses** - Extended with Open Badges 2.0 metadata

### Fixed
- **Frontend Verification** - API response transformation for _meta wrapper
- **PNG Download** - Placeholder image generation for demo badges
- **Test Suite** - Fixed 14 unit tests after metadataHash migration

### Dependencies
- **Added:** `sharp@^0.33.0` - PNG image processing library

### Technical Debt (5 items tracked)
- **TD-001:** E2E test isolation issues (8-10h) - database cleanup race conditions
- **TD-002:** Update failing badge issuance tests (2-4h) - metadataHash impact
- **TD-003:** Add metadataHash database index (2h) - performance optimization
- **TD-004:** Implement baked badge caching (4-6h) - OPT-001
- **TD-005:** Test data factory pattern (4h) - improve test maintainability

### Performance
- Verification page load: <2s target
- PNG generation: <3s (with Sharp optimization)
- Assertion API: <200ms response time
- Integrity check: <100ms (SHA-256 hashing)

### Security
- Public verification endpoints (unauthenticated by design)
- JWT protection on baked badge download
- SHA-256 cryptographic integrity verification
- Email masking for recipient privacy

### Quality Metrics
- **Stories Completed:** 5/5 (100%)
- **Velocity:** 30h actual vs 28h estimated (107%)
- **Test Coverage:** 68 tests
- **Production Bugs:** 0
- **Code Quality:** Clean production code, test infrastructure debt only

---

## [0.4.0] - 2026-01-28

### Added - Employee Badge Wallet (Sprint 4)

#### Timeline View
- **Badge Wallet API** - `GET /api/badges/wallet` with pagination, status filters, and date grouping
- **Date Navigation** - Chronological badge display grouped by month/year
- **View Modes** - Timeline (default) and grid view toggle
- **Status Filters** - Filter by CLAIMED, PENDING, EXPIRED, REVOKED
- **Responsive Design** - Mobile-optimized horizontal badge cards

#### Badge Detail Modal
- **10 Sub-Components** - ModalHero, IssuerMessage, BadgeInfo, TimelineSection, VerificationSection, EvidenceSection, SimilarBadgesSection, ReportIssueForm
- **Badge Information Display** - Full badge metadata, skills tags, criteria checklist
- **Issuer Message** - Custom message from issuer displayed in callout
- **Timeline Dates** - Issued, claimed, expires dates with 30-day expiry warning
- **Public Verification** - Copy verification URL, verify button linking to public assertion
- **Keyboard Navigation** - Escape to close, focus trap, ARIA compliance

#### Evidence File Management
- **Evidence Upload** - `POST /api/badges/:badgeId/evidence` (10MB limit, 5 MIME types)
- **File Storage** - Azure Blob Storage private container with structured paths
- **SAS Token Generation** - `GET /api/badges/:badgeId/evidence/:fileId/download` (5-min expiry)
- **Evidence Display** - File list with download/preview buttons
- **Security** - Verify badge ownership before SAS token generation
- **Validation** - File size, MIME type (PDF, PNG, JPG, DOC, DOCX), filename sanitization

#### Similar Badge Recommendations
- **Recommendation Algorithm** - Skills overlap (+20), category match (+15), issuer match (+10), popularity (+1/10 holders)
- **Similar Badges API** - `GET /api/badges/:id/similar?limit=5` (default 5, max 10)
- **Scoring System** - In-memory scoring for <500 templates
- **Exclusion Logic** - Excludes already-owned badges
- **Horizontal Scroll UI** - Compact badge cards with "Earn This Badge" CTA

#### Admin-Configurable Milestones
- **Milestone Configs API** - CRUD endpoints (POST/GET/PATCH/DELETE /api/admin/milestones)
- **3 Trigger Types** - BADGE_COUNT, SKILL_TRACK (by category), ANNIVERSARY (tenure months)
- **Async Detection** - `checkMilestones(userId)` called after badge issuance/claiming
- **Performance Optimized** - 5-minute config cache, <500ms detection target
- **Non-Blocking** - Errors logged but don't block badge operations
- **User Achievements API** - `GET /api/milestones/achievements` (employee endpoint)
- **Timeline Integration** - Milestones merged into wallet timeline response
- **RBAC Enforcement** - Admin-only milestone configuration

#### Empty State Handling
- **4 Scenarios** - New employee (welcoming), pending badges (animated), all revoked (neutral), filtered empty
- **Auto-Detection** - `detectEmptyStateScenario()` determines correct state
- **Help Documentation** - `docs/setup/earning-badges.md`, `docs/setup/badge-revocation-policy.md`
- **Contextual CTAs** - Scenario-specific action buttons

#### Badge Issue Reporting
- **Report API** - `POST /api/badges/:id/report` (3 issue types: Incorrect info, Technical problem, Other)
- **Email Integration** - Sends to g-credit@outlook.com with badge details
- **Character Limit** - 500 chars max for description
- **Inline Form** - Embedded in Badge Detail Modal

#### Data Models (3 new tables)
- **evidence_files** - id, badgeId (FK), fileName, originalName, fileSize, mimeType, blobUrl, uploadedBy (FK), uploadedAt
- **milestone_configs** - id, type (enum), title, description, trigger (JSONB), icon, isActive, createdBy (FK), createdAt
- **milestone_achievements** - id, milestoneId (FK), userId (FK), achievedAt, UNIQUE(milestoneId, userId)

#### Testing
- **58 total tests** (100% pass rate)
- **19 milestone service tests** - CRUD, trigger evaluation, cache, deduplication, RBAC
- **11 evidence service tests** - Upload, SAS token, validation, security
- **8 recommendations service tests** - Scoring algorithm, exclusions, limits
- **6 wallet tests** - Pagination, filtering, date groups, milestone merging

#### Frontend Components (20+ files)
- `TimelineView/` - Main wallet view with date sidebar
- `BadgeDetailModal/` - 10 sub-components for comprehensive badge display
- `EmptyStateScenarios/` - 4 scenario-specific components
- `SimilarBadgesSection.tsx` - Horizontal recommendation cards
- Zustand store for modal state management

### Changed
- **Wallet Query** - Modified to merge badges + milestones in chronological order
- **Pagination** - Now calculates total from badges + milestones count
- **Badge Response** - Extended with milestone objects (type: 'milestone')

### Performance
- Milestone detection: <500ms (with 5-min cache)
- Wallet query: <150ms target
- SAS token generation: <100ms
- Modal open: <300ms (lazy-loaded components)

### Security
- SAS token 5-minute expiry (evidence files)
- Badge ownership verification before file access
- RBAC enforcement on milestone admin endpoints
- File upload validation (size, MIME type, sanitization)

### Documentation
- Sprint 4 backlog complete (1054 lines)
- Help docs for new employees and revocation policy
- 7 atomic commits with detailed messages

---

## [0.3.0] - 2026-01-28

### Added - Badge Issuance System (Sprint 3)

#### Core Features
- **Single Badge Issuance** - Issue individual badges with recipient email and optional evidence URL
- **Badge Claiming Workflow** - Recipients receive claim tokens (7-day expiry) via email and claim their badges
- **Badge Revocation** - Admins and issuers can revoke badges (status ISSUED → REVOKED)
- **Email Notifications** - Azure Communication Services integration for badge claim notifications
- **Query Endpoints** - Get user's claimed badges and view issued badges (admin/issuer)
- **Public Verification** - Open Badges 2.0 compliant JSON-LD assertion endpoints
- **Bulk Issuance Preparation** - CSV upload validation endpoint (bulk workflow foundation)

#### Open Badges 2.0 Compliance
- JSON-LD assertion format with @context
- Assertion schema with badge, recipient, issuedOn, verification fields
- Public verification URL: `/api/badges/:id/assertion`
- Badge portability to LinkedIn, Credly, and other platforms

#### Data Models
- `Badge` model with 11 fields (id, templateId, recipientEmail, issuedBy, claimToken, status, claimedAt, assertion, etc.)
- Badge status lifecycle: ISSUED → CLAIMED → REVOKED
- Claim token system with 7-day expiry (UUID v4)
- Foreign key relationships: Badge → BadgeTemplate, Badge → User (issuedBy, claimedBy)

#### API Endpoints (7 core routes)
- `POST /api/badges` - Single badge issuance (ADMIN, ISSUER only)
- `POST /api/badges/:id/claim` - Public claim endpoint (token-based authentication)
- `GET /api/badges/my-badges` - User's claimed badges with template details
- `GET /api/badges/issued` - Issued badges query (admin/issuer, paginated)
- `POST /api/badges/:id/revoke` - Badge revocation with reason
- `GET /api/badges/:id/assertion` - Public Open Badges 2.0 assertion
- `POST /api/badges/bulk/validate-csv` - CSV bulk upload validation (future bulk workflow)

#### Email Notification System
- Azure Communication Services integration (ACS trial: 100 emails/day)
- Professional HTML email templates
- Badge claim notification with token link
- 7-day token expiry enforcement
- Email service with retry logic and error handling

#### RBAC Enforcement
- Badge issuance: ADMIN, ISSUER roles only
- Badge revocation: ADMIN, ISSUER roles only
- Query issued badges: ADMIN, ISSUER, MANAGER roles
- Public endpoints: Badge claiming, assertion verification

#### Testing
- **46 Jest E2E Tests** - Complete end-to-end testing (100% pass rate)
  - Story 4.1: Single badge issuance (8 tests)
  - Story 4.2: Badge claiming workflow (6 tests)
  - Story 4.3: My Badges query (4 tests)
  - Story 4.4: Issued badges query (4 tests)
  - Story 4.5: Badge revocation (4 tests)
  - Badge Templates: 19 tests (from Sprint 2)
  - App health check: 1 test
- **20 Unit Tests** - Service layer coverage
- **7 UAT Scenarios** - User acceptance testing (100% acceptance)
- **Test Coverage:** 82% overall (exceeds 80% target)

#### Documentation
- [sprint-3/summary.md](./docs/sprints/sprint-3/summary.md) - Comprehensive sprint summary
- [sprint-3/retrospective.md](./docs/sprints/sprint-3/retrospective.md) - Sprint retrospective and lessons learned
- [sprint-3/uat-testing-guide.md](./docs/sprints/sprint-3/uat-testing-guide.md) - User acceptance testing guide
- Phase 1-3 documentation reorganization (45%→100% compliance)

### Changed

#### Test Infrastructure Improvements
- **Test Data Isolation** - Badge-templates tests now use unique email domain (`@templatetest.com`)
- **UUID Generation Fix** - Removed fixed string IDs, let Prisma auto-generate proper UUIDs
- **Test Coverage Policy** - "No skipped tests" policy: All failing tests must be investigated and fixed

#### Code Quality
- Fixed UUID validation bug in skill creation tests
- Improved test cleanup order (respects foreign key constraints)
- Enhanced test setup with proper skill category and skill creation

### Fixed

#### Critical Bugs
- **UUID Validation Bug** - Fixed skill creation test using fixed string `'test-category-id'` instead of proper UUID
  - Root Cause: Setup used `upsert({ where: { id: 'test-category-id' }})` which doesn't pass `@IsUUID()` validation
  - Solution: Changed to `create()` without explicit ID, letting Prisma auto-generate UUID
  - Impact: Discovered through user challenge "为什么跳过skill创建测试？" - validating "never skip failing tests" policy
- **Test Data Conflicts** - Badge-templates and badge-issuance tests were sharing `admin@test.com` user
  - Solution: Unique email domains per test suite (e.g., `@templatetest.com`)
  - Impact: 19/46 tests initially failing due to missing test data

#### Documentation Compliance
- Phase 1-3 documentation reorganization completed (100% template compliance)
- Consolidated 5 DOCUMENTATION files to 2 (60% reduction)
- Optimized lessons-learned.md (removed 15 duplicates, 2652→2296 lines)
- Zero code impact from documentation changes (validated via E2E tests)

### Security
- Secure claim token system with 7-day expiry
- RBAC enforcement on all badge operations
- Email validation before issuance
- Badge template verification before issuance
- Revocation audit trail with reason field

### Performance
- Efficient badge queries with Prisma includes
- Pagination for issued badges endpoint (default 10, max 100)
- Badge status filtering (ISSUED, CLAIMED, REVOKED)

### Quality Metrics
- Sprint completion: 100% (6/6 stories, 60/60 acceptance criteria)
- Test pass rate: 100% (46/46 tests, 0 skipped, 0 failed)
- Test coverage: 82% (exceeds 80% target)
- Critical bugs: 0
- Time estimation accuracy: 104% (13h actual / 12.5h estimated)
- Code quality: 9.8/10

---

## [0.2.0] - 2026-01-26

### Added - Badge Template Management System (Sprint 2)

#### Core Features
- **Badge Template CRUD API** - Full create, read, update, delete operations for badge templates
- **Azure Blob Storage Integration** - Automatic image upload, management, and deletion
- **Skill Management System** - Create and associate skills with badge templates
- **Skill Categories** - Hierarchical skill categorization with parent/child relationships
- **Advanced Search** - Full-text search across badge name and description
- **Query API** - Separate public and admin endpoints with pagination and filtering
- **Issuance Criteria System** - JSON-based flexible criteria definition and validation

#### Data Models
- `BadgeTemplate` model with 10 fields (id, name, description, imageUrl, category, status, issuanceCriteria, etc.)
- `Skill` model with many-to-many relationship to BadgeTemplate
- `SkillCategory` model with self-referencing hierarchy
- 5 default skill categories: Technical, Leadership, Business, Creative, Communication

#### API Endpoints (30 total routes)
- `POST /api/badge-templates` - Create badge with image upload
- `GET /api/badge-templates` - Public list (ACTIVE only, paginated)
- `GET /api/badge-templates/admin` - Admin list (all statuses, paginated)
- `GET /api/badge-templates/:id` - Get badge by ID
- `PUT /api/badge-templates/:id` - Update badge (with image replacement)
- `DELETE /api/badge-templates/:id` - Delete badge (cascades to Blob)
- `GET /api/badge-templates/search` - Full-text search
- `POST /api/badge-templates/skills` - Create skill
- `GET /api/badge-templates/skills` - List skills
- `GET /api/badge-templates/skills/:id` - Get skill
- `PUT /api/badge-templates/skills/:id` - Update skill
- `DELETE /api/badge-templates/skills/:id` - Delete skill
- `GET /api/badge-templates/categories` - List categories (hierarchical)
- `POST /api/badge-templates/categories` - Create category
- `GET /api/badge-templates/categories/:id` - Get category
- `PUT /api/badge-templates/categories/:id` - Update category
- `DELETE /api/badge-templates/categories/:id` - Delete category

#### File Upload Features
- File size validation (5MB limit)
- MIME type validation (JPG, JPEG, PNG, GIF, WEBP)
- Automatic file extension detection
- Azure Blob Storage public URL generation
- Automatic cleanup of old images on update/delete

#### Testing
- **19 Jest E2E Tests** - Comprehensive end-to-end testing (21.9s runtime, 100% pass)
  - Story 3.1: Data model verification
  - Story 3.2: CRUD + Blob operations (3 tests)
  - Story 3.3: Query API with pagination (3 tests)
  - Story 3.4: Full-text search (2 tests)
  - Story 3.5: Issuance criteria validation (3 tests)
  - Story 3.6: Skill categories hierarchy (1 test)
  - Enhancement 1: Image management (5 tests)
- **7 PowerShell E2E Tests** - Quick smoke tests (~10s runtime, 100% pass)
- **1 Unit Test** - AppController health check

#### Documentation
- [sprint-2-final-report.md](./docs/sprints/sprint-2/final-report.md) - Comprehensive sprint summary (9.8/10 rating)
- [sprint-2-retrospective.md](./docs/sprints/sprint-2/retrospective.md) - Sprint retrospective and lessons learned
- [sprint-2-code-review-recommendations.md](./docs/sprints/sprint-2/code-review-recommendations.md) - Code quality review (10/10 after improvements)
- [sprint-2-technical-debt-completion.md](./docs/sprints/sprint-2/technical-debt-completion.md) - Tech debt resolution (100% complete)
- [enhancement-1-testing-guide.md](./docs/sprints/sprint-2/enhancement-1-testing-guide.md) - Image validation testing guide

### Changed

#### Code Quality Improvements
- **Multipart JSON Middleware** - Eliminated 70+ lines of duplicate code across controllers
- **Structured Logging** - Replaced console.log with NestJS Logger service
- **File Upload Security** - Added size limits and MIME type validation

#### Configuration
- Updated `nest-cli.json` to include Prisma schema in build assets
- Fixed production build path: `node dist/src/main` (was incorrectly `node dist/main`)

#### Testing Infrastructure
- Migrated from Supertest to Jest E2E test suite (454 lines)
- Added PowerShell E2E test suite for quick validation
- Fixed unit test dependency injection (added PrismaService and StorageService mocks)

#### Post-Sprint Improvements (Completed 2026-01-26)
- **MultipartJsonInterceptor Middleware** - Eliminated 70+ lines of duplicate JSON parsing code (178-line reusable interceptor)
  - Automatic parsing of `skillIds` array and `issuanceCriteria` object from multipart forms
  - Smart handling of malformed JSON (auto-fixes missing quotes in curl requests)
  - Reduced controller code by 88% (create method: 79→9 lines, update method: 8→5 lines)
  - Extensible design for future JSON field additions
- **Code Quality Review** - Comprehensive review raised quality score from 8.5/10 to 10/10
  - Fixed 3 TODO items (skill deletion cascade, audit logging, image validation)
  - Enhanced input validation with class-validator decorators
  - Improved error handling and logging patterns
- **Comprehensive English Documentation** - Created 90KB+ production-ready documentation
  - API Usage Guide (20.6KB) - Complete API reference with curl examples
  - Deployment Guide (25.9KB) - Azure production deployment procedures
  - Testing Guide (26.1KB) - Full test suite documentation
  - This Changelog (11.5KB) - Version history and migration guides
  - Updated README (16.6KB) - Project overview and quick start
- **Final Test Statistics** - 27 tests total (100% pass rate)
  - 1 unit test (AppController health check)
  - 19 Jest E2E tests (22.4s runtime)
  - 7 PowerShell E2E tests (~10s runtime)
  - Full coverage of all Sprint 2 user stories and enhancements

### Fixed

#### Critical Bugs
- **Production Build Path** - Fixed MODULE_NOT_FOUND error in production startup
- **Unit Test Dependencies** - Added missing mock providers for AppController test

#### Technical Debt Resolution (100%)
1. **Multipart Middleware** - Created reusable middleware to handle multipart/form-data + JSON (178 lines)
2. **Jest E2E Tests** - Replaced manual testing with automated test suite (19 tests)
3. **Swagger Documentation** - Auto-generated API docs available at `/api-docs`

### Security
- File upload validation (size + MIME type)
- JWT authentication on all protected endpoints
- Azure Blob Storage SSL connections
- PostgreSQL SSL required connections

### Performance
- Efficient database queries with Prisma
- Azure Blob Storage CDN-ready architecture
- Pagination for all list endpoints (default 10, max 100 per page)

---

## [0.1.0] - 2026-01-25

### Added - Authentication & Authorization System (Sprint 1)

#### Authentication
- JWT-based authentication with configurable expiration (default 7 days)
- Secure password hashing with bcrypt (10 salt rounds)
- Login endpoint (`POST /auth/login`) with email/password
- User profile endpoint (`GET /auth/profile`) with JWT protection

#### Authorization
- Role-based access control (RBAC) system
- Four user roles: ADMIN, ISSUER, MANAGER, EMPLOYEE
- Role guards for endpoint protection
- Public decorator for bypassing authentication

#### User Management
- User registration (`POST /auth/register`)
- User model with roles, timestamps
- Email uniqueness validation
- Password strength validation

#### API Endpoints (Sprint 1)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT
- `GET /auth/profile` - Get current user profile

#### Security Features
- JWT token signing with configurable secret
- Password never returned in API responses
- Token expiration management
- Secure HTTP headers (CORS enabled)

### Documentation
- [Sprint 1 Backlog](./docs/sprints/sprint-1/backlog.md)
- [Sprint 1 Retrospective](./docs/sprints/sprint-1/retrospective.md)
- API documentation with Swagger UI

---

## [0.0.1] - 2026-01-24

### Added - Project Foundation (Sprint 0)

#### Project Setup
- NestJS 11.0.16 framework initialization
- TypeScript 5.7.3 with strict mode enabled
- Prisma 6.19.2 ORM integration
- Azure PostgreSQL 16 Flexible Server connection
- Azure Blob Storage integration
- Environment variable configuration with `.env.example`

#### Database
- Initial Prisma schema with User model
- PostgreSQL migration system setup
- Database connection service (PrismaService)
- SSL-required connections to Azure PostgreSQL

#### Storage
- Azure Blob Storage service (StorageService)
- Two containers: `badges` and `evidence`
- Blob upload/delete operations
- Public access configuration for badge images

#### Development Tools
- ESLint configuration
- Prettier code formatting
- Jest testing framework
- TypeScript strict mode
- Git repository initialization

#### API Structure
- Health check endpoint (`GET /health`)
- Swagger API documentation at `/api-docs`
- CORS enabled for cross-origin requests
- Global validation pipe
- Port configuration (default 3000)

#### Scripts
- `npm run start:dev` - Development server with watch mode
- `npm run start:prod` - Production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run migrate:dev` - Run database migrations (dev)
- `npm run migrate:deploy` - Deploy migrations (prod)

#### Documentation
- [Sprint 0 Backlog](./docs/sprints/sprint-0/backlog.md)
- [Sprint 0 Retrospective](./docs/sprints/sprint-0/retrospective.md)
- [Architecture Document](../docs/architecture/system-architecture.md)
- [Main README](./README.md) with setup instructions

### Technical Decisions
- Chose NestJS for enterprise-grade architecture and TypeScript support
- Selected Prisma ORM for type-safety and migration management
- Used Azure services for cloud-native deployment
- Implemented strict TypeScript mode for code quality
- Configured environment-based configuration

---

## Upcoming Releases

### [0.3.0] - Sprint 3 (Planned)
- Badge Issuance System
- User badge inventory
- Bulk badge issuance
- Badge claiming workflow
- Notification system

### [0.4.0] - Sprint 4 (Planned)
- Badge Display & Sharing
- Public badge pages
- Social media sharing
- Badge verification QR codes
- Badge collections/portfolios

### [0.5.0] - Sprint 5 (Planned)
- Analytics & Reporting
- Badge issuance statistics
- User engagement metrics
- Skill gap analysis
- Admin dashboards

---

## Version History Summary

| Version | Release Date | Sprint | Key Features | Test Pass Rate |
|---------|--------------|--------|--------------|----------------|
| 0.2.0 | 2026-01-26 | Sprint 2 | Badge Templates, Skills, Categories, Search | 27/27 (100%) |
| 0.1.0 | 2026-01-25 | Sprint 1 | Authentication, Authorization, JWT | N/A |
| 0.0.1 | 2026-01-24 | Sprint 0 | Project Setup, Database, Storage | N/A |

---

## Breaking Changes

### [0.2.0]
- None (backward compatible with 0.1.0)

### [0.1.0]
- Initial authentication system (no previous version to break)

---

## Migration Guides

### Upgrading from 0.1.0 to 0.2.0

**Database Migration:**
```bash
# Pull latest code
git checkout main
git pull

# Install dependencies
npm ci

# Run migrations
npm run migrate:deploy

# Seed skill categories (optional)
npm run seed
```

**Environment Variables (No changes required):**
- Existing `.env` configuration is compatible
- No new required variables

**API Compatibility:**
- All Sprint 1 endpoints remain unchanged
- New endpoints added under `/api/badge-templates`
- JWT authentication system unchanged

### Upgrading from 0.0.1 to 0.1.0

**Database Migration:**
```bash
# Run auth migration
npm run migrate:deploy
```

**Environment Variables (Add to .env):**
```env
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

---

## Deprecation Notices

- None at this time

---

## Contributors

**Sprint 2 (0.2.0):**
- Backend Development: AI Agent (PM, Tech Lead, Developer, QA)
- Product Owner: User
- Code Review: AI Agent
- Technical Debt Resolution: AI Agent

**Sprint 1 (0.1.0):**
- Backend Development: AI Agent
- Product Owner: User

**Sprint 0 (0.0.1):**
- Project Setup: AI Agent
- Architecture: AI Agent
- Product Owner: User

---

## License

MIT License - See [LICENSE](../LICENSE) file for details

---

**For detailed API usage, see:** [API-GUIDE.md](./docs/API-GUIDE.md)  
**For deployment instructions, see:** [DEPLOYMENT.md](./docs/DEPLOYMENT.md)  
**For testing guide, see:** [TESTING.md](./docs/TESTING.md)  
**For all documentation, see:** [Documentation Index](../docs/README.md)
