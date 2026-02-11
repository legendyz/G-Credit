# G-Credit v1.0.0 — UAT Results Report

**Version:** 1.0  
**Tester:** LegendZhu (Product Owner)  
**Date:** 2026-02-10  
**Sprint:** 10  
**Story:** 10.7  
**Environment:** localhost:3000 (backend) + localhost:5173 (frontend)  
**Seed Data:** `npm run seed:uat` — verified (4 users, 5 templates, 11 badges)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 35 |
| PASS | 2 (5.7%) |
| PARTIAL | 7 (20.0%) |
| FAIL | 25 (71.4%) |
| SKIP | 1 (2.9%) |
| **Unique Root-Cause Bugs** | **7** |
| Test Plan Corrections Needed | 2 |
| UX Improvements Identified | 3 |
| Architecture Questions | 1 |

**Verdict:** ❌ UAT NOT PASSED — 7 bugs identified, 5 are P0/P1 blockers. Most failures are cascading from a small number of root-cause issues. After fixing the 7 bugs, the true pass rate is expected to reach ~90%+.

---

## Root Cause Analysis

The 25 FAILed test cases trace back to **7 distinct bugs** plus **2 test plan corrections**:

| Root Cause | Bug ID | Severity | Cases Affected |
|------------|--------|----------|----------------|
| "My Wallet" nav link → `/` instead of `/wallet` | BUG-002 | 🔴 P0 | UAT-003,004,016-022 (9 cases) |
| No Badge Template Management UI in frontend | BUG-003 | 🔴 P0 | UAT-008-011,034 (5 cases) |
| Issue Badge recipient dropdown not loading users | BUG-004 | 🔴 P0 | UAT-012-015 (4 cases) |
| Search input in BadgeSearchBar doesn't accept typing | BUG-005 | 🔴 P0 | UAT-011,032 (2 cases) |
| Manager role has no revocation UI entry point | BUG-006 | 🟡 P1 | UAT-028-030 (3 cases) |
| No profile / password change page | BUG-007 | 🟡 P1 | UAT-006 (1 case) |
| Prisma P2028 transaction timeout on first bulk issuance | BUG-008 | 🟡 P1 | UAT-026 (intermittent) |
| Test plan wrong URLs (/api/health, /api/docs) | TP-FIX | 📝 | UAT-001,002 (2 cases) |

---

## Detailed Test Results

### Test Accounts Verification

| Role | Result | Notes |
|------|--------|-------|
| Admin | ⚠️ PARTIAL | Nav: My Wallet, Badge Management, Bulk Issuance, Analytics. Quick Actions: Manage Users, Badge Templates, Analytics, Settings(greyed out). Cannot confirm all features present. |
| Issuer | ⚠️ PARTIAL | Nav: My Wallet, Badge Management, Bulk Issuance, Analytics. Quick Actions: Issue New Badge, View Issued Badges. Cannot confirm all features present. |
| Manager | ❌ FAIL | Only "My Wallet" visible. Dashboard shows team info (Team members, Team badges this month) correctly, but no revocation entry point. → **BUG-006** |
| Employee | ✅ PASS | Correct limited view. |

### Epic 1: Infrastructure (2 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-001 | ❌ FAIL | `/api/health` → 404. Actual endpoint is `/health` (no global API prefix) | **TP-FIX-1** |
| UAT-002 | ❌ FAIL | `/api/docs` → 404. Actual endpoint is `/api-docs` (known, reported multiple times) | **TP-FIX-2** |

### Epic 2: Authentication (5 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-003 | ⚠️ PARTIAL | Login succeeds, Dashboard displays, but nav highlights "My Wallet" instead of Dashboard | **BUG-002** |
| UAT-004 | ⚠️ PARTIAL | Login succeeds, Dashboard displays, but nav highlights "My Wallet" instead of Dashboard | **BUG-002** |
| UAT-005 | ✅ PASS | Logout clears session correctly | — |
| UAT-006 | ❌ FAIL | No profile/password change page exists in frontend | **BUG-007** |
| UAT-007 | ⚠️ PARTIAL | Employee navigating to `/admin/badges/issue` → redirected back to Dashboard. Behavior correct (access denied), UAT wording says "redirected away" which matches. | **Acceptable** |

### Epic 3: Badge Templates (4 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-008 | ❌ FAIL | No "Create Template" UI. Quick Action "Badge Templates" navigates to Badge Management page. No template CRUD UI exists in frontend. | **BUG-003** |
| UAT-009 | ❌ FAIL | Blocked by UAT-008 | **BUG-003** |
| UAT-010 | ❌ FAIL | Blocked by UAT-008 | **BUG-003** |
| UAT-011 | ❌ FAIL | Blocked by UAT-008. Also: search popup in Badge Management doesn't accept character input. | **BUG-003 + BUG-005** |

### Epic 4: Badge Issuance (4 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-012 | ❌ FAIL | (1) No UI navigation path to Issue Badge page — only via URL. (2) Recipient dropdown doesn't load user list. | **BUG-004** |
| UAT-013 | ❌ FAIL | Blocked by UAT-012 | **BUG-004** |
| UAT-014 | ❌ FAIL | Blocked by UAT-012 | **BUG-004** |
| UAT-015 | ❌ FAIL | Blocked by UAT-012 | **BUG-004** |

### Epic 5: Employee Wallet (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-016 | ❌ FAIL | Clicking "My Wallet" stays on Dashboard. Nav link points to `/` not `/wallet`. | **BUG-002** |
| UAT-017 | ❌ FAIL | Cannot reach Wallet page | **BUG-002** |
| UAT-018 | ❌ FAIL | Cannot reach Wallet page | **BUG-002** |

### Epic 6: Badge Verification (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-019 | ❌ FAIL | Cannot navigate to Wallet to find verification links. Note: `/verify/{id}` is a public route — could test directly with seed data verification IDs. | **BUG-002** (indirect) |
| UAT-020 | ❌ FAIL | Blocked by UAT-019 | **BUG-002** |
| UAT-021 | ❌ FAIL | Blocked by UAT-019 | **BUG-002** |

### Epic 7: Badge Sharing (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-022 | ❌ FAIL | Dashboard shows PENDING badge with "Claim Badge" button. After clicking Claim, navigates to "My Badges" page (unexpected). Cannot access Share features. | **BUG-002** (nav confusion) |
| UAT-023 | ❌ FAIL | Blocked by UAT-022 | **BUG-002** |
| UAT-024 | ❌ FAIL | Blocked by UAT-022 | **BUG-002** |

### Epic 8: Bulk Issuance (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-025 | ⚠️ PARTIAL | CSV downloads successfully (headers at row 15). **UX issues:** (1) Selected template ID not pre-filled in CSV (2) Template ID is long UUID, hard to copy. | **UX-001** |
| UAT-026 | ⚠️ PARTIAL | First upload → Internal Server Error (Prisma P2028 transaction timeout). Second upload succeeds. | **BUG-008** |
| UAT-027 | ⚠️ PARTIAL | Partial valid CSV: shows correct count for valid rows + "Confirm Issuance" button. Button is greyed out, suggesting partial send is possible but not actionable. Confusing UX. | **UX-002** |

### Epic 9: Badge Revocation (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-028 | ❌ FAIL | Manager role has no revocation UI. Nav only shows "My Wallet". Frontend restricts revocation to ADMIN/ISSUER roles. | **BUG-006** |
| UAT-029 | ❌ FAIL | Blocked by UAT-028 | **BUG-006** |
| UAT-030 | ❌ FAIL | Blocked by UAT-028 | **BUG-006** |

### Epic 10: Production Features (3 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-031 | ⚠️ PARTIAL | Dashboard IS the home page (no navigation needed — TP wording misleading). No trend charts. Only "Total Users" and "Active Templates" cards are clickable; "Active This Month" and "Total Badges Issued" are not. | **UX-003** |
| UAT-032 | ❌ FAIL | Badge Management search: popup appears but doesn't accept character input. | **BUG-005** |
| UAT-033 | ✅ PASS | Role change works. **Architecture question raised:** Should Issuer be a permission flag rather than exclusive role? See FEAT-004. | — |

### Cross-Epic (2 cases)

| ID | Result | Notes | Root Cause |
|----|--------|-------|------------|
| UAT-034 | ❌ FAIL | Cannot find template creation UI as Admin. Full lifecycle cannot begin. | **BUG-003** |
| UAT-035 | ⏭️ SKIP | Deferred until other bugs resolved. | — |

---

## Bug Registry

### 🔴 P0 — Core Flow Blockers

#### BUG-002: Navbar "My Wallet" links to Dashboard (`/`) instead of Wallet (`/wallet`)
- **Severity:** P0
- **Component:** `frontend/src/components/Navbar.tsx`
- **Impact:** 9 test cases affected. Users cannot navigate to Wallet page via UI.
- **Root Cause:** Navbar link `to="/"` with label "My Wallet". Actual wallet route is `/wallet`.
- **Fix:** Change nav link `to="/wallet"`. Add separate Dashboard link or make `/` redirect intelligently.
- **Also affects:** Navigation active state — all pages show "My Wallet" as highlighted because `/` always matches.

#### BUG-003: No Badge Template Management UI
- **Severity:** P0
- **Component:** Frontend — missing pages
- **Impact:** 5 test cases affected. Admin/Issuer cannot create, edit, activate, or archive templates via UI.
- **Root Cause:** Template CRUD pages were never built in the frontend. Backend API exists (`/badge-templates` CRUD) but no UI.
- **Fix:** Need to build `BadgeTemplateListPage` + `BadgeTemplateFormPage` (create/edit) with status management.
- **Note:** Quick Action "Badge Templates" incorrectly navigates to Badge Management page.

#### BUG-004: Issue Badge — Recipient Dropdown Not Loading Users
- **Severity:** P0
- **Component:** `frontend/src/pages/IssueBadgePage.tsx`
- **Impact:** 4 test cases affected. Cannot complete badge issuance.
- **Root Cause:** Calls `GET /admin/users?limit=100&statusFilter=true`. Needs investigation — may be auth header issue, CORS, or API response format mismatch.
- **Additional:** No UI navigation path to Issue Badge page (only via direct URL `/admin/badges/issue`). Issuer Quick Action "Issue New Badge" may not link correctly.

#### BUG-005: BadgeSearchBar Input Doesn't Accept Characters
- **Severity:** P0
- **Component:** `frontend/src/components/search/BadgeSearchBar.tsx`
- **Impact:** 2 test cases affected (UAT-011, UAT-032). Search in Badge Management is non-functional.
- **Root Cause:** Search popup opens but text input field doesn't capture keystrokes. Likely event handler or focus issue.

### 🟡 P1 — Significant Defects

#### BUG-006: Manager Role Has No Revocation UI
- **Severity:** P1
- **Component:** Frontend Navbar + route protection
- **Impact:** 3 test cases affected. Manager cannot perform revocation despite being a documented capability.
- **Root Cause:** Frontend nav/routes restrict Badge Management (and revocation) to ADMIN/ISSUER only. Manager dashboard shows revocation alerts (read-only) but no action capability.
- **Design Decision Needed:** Is Manager supposed to revoke? If yes → add Badge Management access for Manager. If no → update test plan and role documentation.

#### BUG-007: No Profile / Password Change Page
- **Severity:** P1
- **Component:** Frontend — missing page
- **Impact:** 1 test case (UAT-006).
- **Root Cause:** Page never built. No `/profile` or `/settings` route exists.
- **Fix:** Build minimal profile page with password change form.

#### BUG-008: Prisma P2028 Transaction Timeout on Bulk Issuance
- **Severity:** P1
- **Component:** `backend/src/bulk-issuance/bulk-issuance.service.ts` (line 272)
- **Impact:** Intermittent — first bulk issuance attempt fails, retry succeeds.
- **Root Cause:** `PrismaClientKnownRequestError P2028: Unable to start a transaction in the given time.` Likely cold connection pool or transaction timeout too short.
- **Fix:** Increase Prisma transaction timeout or add retry logic.

---

## Test Plan Corrections (TP-FIX)

| ID | Current | Correct | Notes |
|----|---------|---------|-------|
| TP-FIX-1 | `/api/health` | `/health` | No global API prefix in backend |
| TP-FIX-2 | `/api/docs` | `/api-docs` | Known issue, previously reported |

---

## UX Improvement Suggestions (Post-MVP)

| ID | Description | Severity |
|----|-------------|----------|
| UX-001 | Bulk CSV download should pre-fill selected template ID; template ID hard to copy | 🟢 Low |
| UX-002 | Partial-valid CSV: "Confirm Issuance" button greyed out but valid count shown — confusing mixed signal | 🟡 Medium |
| UX-003 | Dashboard: "Active This Month" and "Total Badges Issued" cards not clickable; no trend charts | 🟢 Low |

---

## Architecture Question — FEAT-004

**Raised during UAT-033:** Current role model is single-select (ADMIN / ISSUER / MANAGER / EMPLOYEE). User asks:

> "如果我在工作中是 Manager 同时也要能发 Badge，系统逻辑应该怎样？Manager 和 Employee 应该是二选一，Issuer 应该是权限标签/开关？"

**Recommendation:** Record as FEAT-004 in Post-MVP backlog. Options:
1. Permission-based model: Roles (Admin/Manager/Employee) + Permissions (can_issue, can_revoke)
2. Multi-role model: User can have multiple roles simultaneously
3. Role hierarchy: ADMIN > ISSUER > MANAGER > EMPLOYEE (current, most restrictive)

---

## Cascade Impact Analysis

If the 4 P0 bugs are fixed, the expected re-test results:

| Category | Current | After P0 Fix (Expected) |
|----------|---------|------------------------|
| PASS | 2 | ~22 |
| PARTIAL | 7 | ~8 |
| FAIL | 25 | ~4 (P1 bugs) |
| SKIP | 1 | 1 |

---

## Sign-Off

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | LegendZhu | 2026-02-10 | ❌ NOT PASSED (Round 1) |
| Scrum Master | Bob (SM Agent) | 2026-02-10 | Bugs logged → Story 10.8 |
| Product Owner | LegendZhu | — | Deferred to Round 2 |

> **📌 Round 2 结果:** 所有 7 个 Bug 已修复，Round 2 全部 33/33 PASS。详见 [`uat-retest-results.md`](uat-retest-results.md)。
