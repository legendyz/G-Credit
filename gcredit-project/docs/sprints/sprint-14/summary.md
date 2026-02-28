# Sprint 14 Summary

**Sprint:** Sprint 14 — Dual-Dimension Role Model Refactor  
**Branch:** `sprint-14/role-model-refactor`  
**Duration:** 2026-02-27 to 2026-02-28  
**Target Version:** v1.4.0 (from v1.3.0)  
**Stories:** 9/9 complete (4 waves) — 3 core + 2 absorbed + 4 independent  
**Tests:** 1,757 (Backend 932 + Frontend 794 + E2E 31), 100% pass rate  
**Regressions:** 0

---

## Sprint Goal

> Architecture-first — land the dual-dimension role model refactor and resolve CI reliability, before Sprint 15 UI overhaul.

**Result:** ✅ **ACHIEVED** — All 9 stories delivered. MANAGER removed from UserRole enum. `isManager` JWT claim operational. ManagerGuard + @RequireManager() decorator deployed. 6-combination test matrix (31 tests) validates all role×manager combinations. Design tokens infrastructure ready for Sprint 15.

---

## Wave Delivery

### Wave 1: Quick Win — CI Reliability (Story 14.1)

| Story | Description | Status |
|-------|-------------|--------|
| 14.1 | TD-036: Fix flaky BadgeManagementPage test | ✅ done |

**Key Change:** Test isolation fix — mock state leaking between Vitest workers resolved by proper cleanup in `beforeEach`/`afterEach` hooks.

### Wave 2: Role Model Refactor — Backend (Stories 14.2–14.6)

| Story | Description | Status |
|-------|-------------|--------|
| 14.2 | Schema migration: remove MANAGER from UserRole enum | ✅ done |
| 14.3 | JWT payload + AuthenticatedUser + `isManager` claim | ✅ done |
| 14.4 | ManagerGuard + @RequireManager() decorator | ✅ done |
| 14.5 | RolesGuard update (absorbed by 14.2) | ✅ done |
| 14.6 | M365 sync cleanup (absorbed by 14.2) | ✅ done |

**Key Changes:**
- **ADR-015:** `UserRole` enum now contains only `ADMIN | ISSUER | EMPLOYEE`
- **ADR-017:** Dual-dimension identity — Permission (role) × Organization (isManager)
- Prisma migration removed MANAGER from enum, migrated existing MANAGER users to EMPLOYEE
- `computeIsManager(userId)` at 4 JWT generation points (login, SSO, refresh, claims)
- `ManagerGuard` (58 lines) — Reflector-based with ADMIN bypass
- `@RequireManager()` decorator — clean compositional pattern
- M365 sync `deriveRole()` no longer assigns MANAGER; auto-downgrade removed

### Wave 3: Role Model Refactor — Frontend (Story 14.7)

| Story | Description | Status |
|-------|-------------|--------|
| 14.7 | Frontend types + ProtectedRoute + remove MANAGER references | ✅ done |

**Key Changes:**
- `User` type: `role: 'ADMIN' | 'ISSUER' | 'EMPLOYEE'` + `isManager: boolean`
- `useIsManager()` Zustand selector
- `ProtectedRoute`: independent `requireManager` evaluation via `needsCheck`
- `useDashboard()`: `enabled` query gating prevents unconditional API calls
- All `'MANAGER'` string references removed from frontend application code

### Wave 4: Testing + Design Tokens (Stories 14.8–14.9)

| Story | Description | Status |
|-------|-------------|--------|
| 14.8 | 6-combination role×manager test matrix (31 tests) | ✅ done |
| 14.9 | P1-2: Design tokens prep (11 tokens, ~25 hardcoded colors) | ✅ done |

**Key Changes:**
- **Test Matrix (ADR-017 §7):** 6 combos × 4 endpoints + JWT backward compat + 6 dashboard access tests = 31 tests
- Shared `authRequest()` helper — 5 real logins + 1 `JwtService.sign()` to avoid rate limit
- **Design Tokens:** 11 new CSS custom properties in `@theme` block (linkedin, ms-text/border, confetti, gift-box, shadow-sticky)
- 8 components tokenized: IssuanceTrendChart, SkillsDistributionChart, BadgeShareModal, MicrosoftSsoButton, CelebrationModal, PendingBadgesEmptyState, UserListTable

---

## Architecture Decisions Implemented

| ADR | Title | Sprint 14 Impact |
|-----|-------|-----------------|
| ADR-009 | Tailwind v4 CSS-first config | All design tokens in `@theme {}` blocks (14.9) |
| ADR-015 | UserRole enum = ADMIN\|ISSUER\|EMPLOYEE | MANAGER removed from enum (14.2) |
| ADR-017 | Dual-dimension identity model | Full implementation (14.2–14.8) |

---

## Technical Debt Movement

| Action | ID | Description |
|--------|-----|------------|
| ✅ Resolved | TD-034 | Role Model Refactor — Dual-Dimension Identity |
| ✅ Resolved | TD-036 | Flaky Frontend Test (BadgeManagementPage) |
| 📋 Created | TD-038 | Auth endpoint rate limits hardcoded in decorators (P2, 2-3h) |

**Net:** -1 (2 resolved, 1 created)

---

## Test Results

| Suite | Count | Pass Rate |
|-------|-------|-----------|
| Backend unit/integration | 932 | 100% |
| Frontend unit/component | 794 | 100% |
| E2E role-matrix | 31 | 100% |
| **Total** | **1,757** | **100%** |

**Change from v1.3.0:** +49 tests (1,708 → 1,757)

---

## Files Changed (Summary)

| Category | Files | Key Files |
|----------|-------|-----------|
| Backend source | ~15 | auth.service.ts, manager.guard.ts, jwt.strategy.ts, roles.guard.ts, m365-sync.service.ts |
| Backend tests | ~8 | role-matrix.e2e-spec.ts, badge-management-page.test.tsx |
| Frontend source | ~12 | authStore.ts, ProtectedRoute.tsx, index.css, 8 component files |
| Prisma | 2 | schema.prisma, migration SQL |
| Documentation | ~30 | 9 story files, 9 dev prompts, 9 CR results, backlog, version-manifest |

---

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Estimated effort | ~24h |
| Stories completed | 9/9 (100%) |
| Regressions | 0 |
| Tests added | +49 |
| Tech debt resolved | 2 (TD-034, TD-036) |
| Tech debt created | 1 (TD-038) |
| Commits | ~15 |
| Branch | `sprint-14/role-model-refactor` |
