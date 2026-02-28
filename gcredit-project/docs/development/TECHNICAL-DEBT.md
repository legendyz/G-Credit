# Technical Debt Tracking

**Last Updated:** 2026-02-28 (Sprint 14 closeout)  
**Status:** Active  
**Version:** v1.4.0  
**Codebase Health:** tsc 0 errors (BE+FE) | ESLint 0 errors + 0 warnings (BE+FE) | npm audit 0 vulnerabilities (prod)

This document tracks known technical debt across the G-Credit project. Items are prioritized and linked to relevant sprints for resolution.

---

## Summary

| Category | Count | Items |
|----------|-------|-------|
| ✅ Resolved | 24 | TD-001, 002, 003, 013, 014, 015, 016b, 017, 018, 019, 020, 021, 022, 023, 024, 025, 028, 029, 034, 036 + lodash, ESLint regression, Prisma |
| ⏸️ External Blocker | 1 | TD-006 |
| 📋 Deferred (trigger-based) | 6 | TD-005, 016, 030, 031, 032, 038 |
| 📋 Deferred (architecture) | 1 | TD-033, 035 |
| 📋 Process Improvement | 2 | TD-026, 027 |
| 🔍 Track | 2 | TD-004, 037 |

---

## 📋 Open Items

### ⏸️ External Blocker

#### TD-006: Teams Channel Permissions

**Identified:** Sprint 10 | **Severity:** Medium | **Effort:** 1 day (admin approval)

**Issue:** 4 Teams integration tests skipped. Requires tenant admin to approve `ChannelMessage.Send` Graph API permission.

**Impact:** Badge sharing via Teams channel not functional. Email sharing works as fallback.

**Workaround:** Teams tab hidden in UI (commented out with TD-006 references).

**Files with TD-006 markers:**
- `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` (tab config)
- `frontend/src/components/BadgeShareModal/BadgeShareModal.test.tsx`
- `frontend/src/components/BadgeDetailModal/BadgeAnalytics.tsx`

**Testing:** See [SKIPPED-TESTS-TRACKER.md](../testing/SKIPPED-TESTS-TRACKER.md) for 4 skipped test details.

**Resolution:** Awaits tenant admin action — not a code change.

---

### 📋 Deferred (Trigger-Based)

#### TD-005: Assertion Hash Backward Compatibility Script

**Identified:** Sprint 5 | **Severity:** Low | **Effort:** 2 hours

**Issue:** Badges created before Story 6.5 lack `metadataHash`. Need backfill script to compute hash from existing `assertionJson`.

**Trigger:** Before production deployment or when hash-based integrity verification is enforced on legacy badges.

**Status:** No script exists yet.

---

#### TD-016: Async Bulk Processing

**Identified:** Sprint 9 | **Severity:** Low | **Effort:** 8 hours

**Issue:** Bulk badge issuance limited to 20 badges synchronously.

**Plan:** Add Redis + Bull Queue for >20 badge async processing.

**Trigger:** When user feedback validates need for >20 badges per batch.

**Note:** TD-016 (Dashboard JSON display) was separately resolved by Sprint 12 Story 12.7.

---

#### TD-030: LinkedIn Dynamic OG Meta Tags

**Identified:** Sprint 11 | **Severity:** P2 | **Effort:** 4-6 hours

**Issue:** LinkedIn crawler gets static generic OG meta tags for all `/verify/:id` share links — all previews show identical card.

**Root Cause:** SPA with no SSR; LinkedIn bot doesn't execute JavaScript.

**Plan:** Backend middleware detecting crawler User-Agent and returning pre-rendered HTML with dynamic `og:title`, `og:description`, `og:image`.

---

#### TD-031: Time-Based Milestone Metrics

**Identified:** Sprint 12 | **Severity:** P3 | **Effort:** ~17 hours

**Issue:** Milestone engine supports `badge_count` and `category_count` only. Missing:
1. **Time Window Filter** — "Earn N badges within M days" (~4h)
2. **Streak** — "Earn badges in N consecutive months" (~8h)
3. **Tenure** — "N days since first badge / account creation" (~5h)

**Architecture Impact:** Minimal — leverages existing `metric + scope + threshold` model and JSON trigger column. No Prisma schema migration needed.

**Suggested Phasing:** Time Window + Tenure (9h, one story), Streak (8h, one story).

**Reference:** `docs/sprints/sprint-12/milestone-engine-design-notes-20260221.md`

---

#### TD-032: M365 Sync Performance at Scale

**Identified:** Sprint 12 | **Severity:** P3 | **Effort:** ~18 hours

**Issue:** FULL sync processes users serially (~1.2s/user via 2 Graph API calls each). 17 users = ~20s; 10,000 users = ~3-4 hours + Graph API throttling.

**Partial Fix (Sprint 12):** GROUPS_ONLY sync already optimized — batch group member queries (`81e6b3c`).

**Remaining Optimizations:**
1. Batch Group Query for FULL sync (~2h)
2. Concurrent Processing with p-limit (~3h)
3. Graph `$batch` API for manager queries (~4h)
4. Delta Query (`/users/delta`) (~6h)
5. Redis caching (~3h, ties into TD-016)

**Trigger:** User count exceeds 500 OR FULL sync takes >2 minutes.

**Suggested Phasing:** Phase 1 at 200+ users (5h), Phase 2 at 1000+ users (10h), Phase 3 with TD-016 (3h).

---

#### TD-038: Auth Endpoint Rate Limits Hardcoded in Decorators

**Identified:** Sprint 14 (2026-02-28) | **Severity:** P2 | **Effort:** 2-3 hours

**Issue:** All `@Throttle()` decorators in `auth.controller.ts` use hardcoded values (e.g., login = 5 req/min/IP). The global `ThrottlerModule` reads from `ConfigService` (`RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`), but per-endpoint `@Throttle()` overrides are compile-time constants — they ignore `.env` and `ConfigService`.

**Impact:**
- **Enterprise UX risk:** Users behind shared NAT/proxy share one IP. 10+ employees logging in within 1 minute → 429 errors from the 6th login onward.
- **E2E test friction:** 10 logins in role-matrix tests exceed 5/min limit → 429 in CI.
- **Inconsistency:** `bulk-issuance.controller.ts` attempted `process.env` workaround but documented it as non-functional (class-load timing).

**Affected Endpoints:**
| Endpoint | Hardcoded ttl | Hardcoded limit |
|----------|--------------|----------------|
| `POST /api/auth/login` | 60s | 5 |
| `POST /api/auth/register` | 3600s | 3 |
| `POST /api/auth/request-reset` | 300s | 3 |
| `POST /api/auth/reset-password` | 300s | 5 |
| `POST /api/auth/refresh` | 60s | 10 |
| `PATCH /api/auth/change-password` | 3600s | 3 |
| `PATCH /api/auth/profile` | 60s | 10 |
| `GET /api/auth/sso/callback` | 60s | 10 |

**Proposed Solution:** Custom `ConfigurableThrottlerGuard` extending `ThrottlerGuard` that reads per-route limits from `ConfigService` with sensible defaults. This allows `.env.test` to raise limits for CI and ops to tune production limits without code changes.

**Alternative (simpler):** Replace `@Throttle({ default: { ttl: X, limit: Y } })` with `@Throttle({ default: { ttl: parseInt(process.env.AUTH_LOGIN_THROTTLE_TTL || '60000'), limit: parseInt(process.env.AUTH_LOGIN_THROTTLE_LIMIT || '5') } })` — but this has the same class-load timing issue documented in bulk-issuance.

**Trigger:** Sprint 15 — resolves E2E test friction and prevents enterprise UX issues before pilot.

**Files:** `backend/src/modules/auth/auth.controller.ts`, `backend/src/bulk-issuance/bulk-issuance.controller.ts`

---

#### TD-036: Flaky Frontend Test (BadgeManagementPage)

**Identified:** Sprint 13 closeout (2026-02-27) | **Severity:** Low | **Effort:** 2-4 hours

**Status:** ✅ Resolved (Sprint 14, Story 14.1)

**Issue:** `BadgeManagementPage.test.tsx` test "should show Revoke button for PENDING badges when ADMIN" fails intermittently when running full frontend test suite, but passes consistently in isolation.

**Symptoms:** Pre-push hook fails ~1 in 3 pushes; retry succeeds.

**Possible Causes:**
- Test isolation issue in Vitest worker scheduling
- Shared mock state leaking between test files
- `getAllByRole` with `toBeGreaterThanOrEqual(2)` assertion masking subtle DOM timing

**Workaround:** Retry push (or `--no-verify`).

**File:** `frontend/src/pages/admin/BadgeManagementPage.test.tsx`

---

### 📋 Deferred (Architecture)

#### TD-033: Manager Delegation (Acting Manager)

**Identified:** Sprint 12 | **Severity:** P3 | **Effort:** ~19 hours

**Issue:** No mechanism for a manager to delegate responsibilities during absence.

**Scope:** Schema (2h) → Backend API (4h) → Permission Guards (4h) → Frontend UI (6h) → Audit logging (3h)

**Trigger:** When organizational workflows require manager absence coverage.

---

#### TD-034: Role Model Refactor — Dual-Dimension Identity

**Identified:** Sprint 12 | **Severity:** P2 | **Effort:** ~18 hours

**Status:** ✅ Resolved (Sprint 14, Stories 14.2–14.8, ADR-015 + ADR-017)

**Issue:** Single `role` enum conflates organization identity (Manager/Employee) with permission role (Admin/Issuer). Makes role combinations impossible.

**Proposed:** Remove MANAGER from enum; derive manager status from `directReportsCount > 0` + JWT `isManager` claim.

**Scope:** Schema migration (2h) → RBAC guards (6h) → JWT claims (2h) → M365 sync (3h) → Frontend (4h) → Audit migration (1h)

**Trigger:** When role combination requirements become blocking for user workflows.

**Dependencies:** TD-035 should follow.

---

#### TD-035: Dashboard Composite View — Permission Stacking

**Identified:** Sprint 12 | **Severity:** P2 | **Effort:** ~18 hours

**Issue:** Dashboard routing is mutually exclusive per role. With dual-dimension identity, users should see stacked sections.

**Dependencies:** TD-034 must be completed first.

---

### 📋 Process Improvement

#### TD-026: SM Audit Triage Workflow

**Identified:** Sprint 11 | **Severity:** Medium | **Effort:** 1 hour

**Issue:** Audit recommendations not systematically converted to stories.

**Plan:** SM agent `[AT]` menu item.

---

#### TD-027: Playwright Visual Regression in CI

**Identified:** Sprint 11 | **Severity:** Low | **Effort:** 4 hours

**Issue:** No automated visual regression testing.

**Plan:** Playwright screenshot comparison in CI.

---

### 🔍 Track (Low Priority, Enhancement)

#### TD-004: Test Coverage for Baked Badge Caching

**Identified:** Sprint 5 | **Severity:** Low | **Effort:** 4 hours

**Issue:** Baked badge generation functional but lacks comprehensive caching tests (hit/miss, invalidation, expiry, concurrency, error handling).

---

#### TD-037: Dark Mode Support

**Identified:** Sprint 13 | **Severity:** Low | **Effort:** TBD

**Issue:** Single TODO in codebase: `MicrosoftSsoButton.tsx` line 8 — `// TODO: dark mode variant`. Full dark mode would require design system-wide theming.

---

## ✅ Resolved Items

| ID | Description | Resolved | Sprint | Notes |
|----|-------------|----------|--------|-------|
| TD-001 | E2E Test Suite Isolation Issues | ✅ | Sprint 8 | Schema-based isolation + test data factories (`UserFactory`, `BadgeTemplateFactory`, `BadgeFactory`) + `maxWorkers: 4`. `setupE2ETest()` helper creates per-suite PostgreSQL schema. |
| TD-002 | Badge Issuance E2E Test Regressions | ✅ | Sprint 8 | Resolved by schema isolation (TD-001 fix). Tests no longer share database state. |
| TD-003 | Badge Template Image Validation | ✅ | Sprint 8 | `sharp` metadata inspection + magic-byte validation (SEC-005) + dimension bounds (128-2048px) + MIME whitelist (PNG/JPG) + 2MB file size limit + aspect ratio checks in `blob-storage.service.ts`. |
| TD-009 | Milestone Admin UI | ✅ | Sprint 12 | Full admin UI with card grid, dynamic form per milestone type, active/inactive toggle. Story 12.4. |
| TD-010 | Evidence System Unification | ✅ | Sprint 12 | Two-phase: EvidenceFile model + Prisma migration (12.5) + Unified UI (12.6). |
| TD-013 | Frontend Bundle Code Splitting | ✅ | Sprint 9 | Route-based code splitting: 707 KB → 235 KB (66.8% reduction). Story 8.3. |
| TD-014 | Dual Email System | ✅ | Sprint 9 | nodemailer removed, `EmailService` delegates to `GraphEmailService`. Story 8.4. |
| TD-015 | ESLint Type Safety | ✅ | Sprint 9 | 1303 → 282 warnings (78% reduction). Standalone story. |
| TD-016b | Dashboard JSON Display | ✅ | Sprint 12 | `formatAuditDescription()` + `buildActivityDescription()` replace raw JSON. Story 12.7. |
| TD-017 | Skills UUID Fallback + tsc Errors | ✅ | Sprint 10/12 | 114 tsc errors fixed (Sprint 10). `useSkillNamesMap()` + `UNKNOWN_SKILL_LABEL` (Sprint 12, Story 12.8). |
| TD-018 | Code TODO Cleanup | ✅ | Sprint 10 | 14 TODO/FIXME markers resolved. `apiConfig.ts` centralization. Story 10.3. |
| TD-019 | Frontend ESLint Cleanup | ✅ | Sprint 10 | 49 errors + 21,363 warnings → 0/0. 135 files. CI `--max-warnings=0` gate. Story 10.3b. |
| TD-020 | CI E2E Missing Frontend Dependency | ✅ | Sprint 10 | `e2e-tests` job now depends on `frontend-tests`. Story 10.4. |
| TD-021 | react-hooks Inline Suppressions | ✅ | Sprint 10 | Project-level override, 9 inline suppressions removed. Story 10.4. |
| TD-022 | API Path Mismatches | ✅ | Sprint 10 | 5 critical path mismatches fixed: 4 controller `api/` prefixes + 3 frontend path bugs + 8 hardcoded URL unifications. Story 10.3c. |
| TD-023 | CI Chinese Character Gate | ✅ | Sprint 11 | CI grep gate + `scripts/check-chinese.sh`. Story 11.21. |
| TD-024 | CI console.log Gate | ✅ | Sprint 11 | ESLint `no-console: 'error'` in both configs. Story 11.21. |
| TD-025 | Husky Pre-commit Hooks | ✅ | Sprint 11 | Husky v9 + lint-staged pre-commit + pre-push mirroring CI. Story 11.22. |
| TD-028 | Data Contract Alignment | ✅ | Sprint 11 | 14 API-to-UI data contract issues fixed. Story 11.24. |
| TD-029 | Decorator Metadata Guard Tests | ✅ | Sprint 11 | `Reflect.getMetadata()` tests for `@Public()` and `@Roles()`. Story 11.24. |

| TD-034 | Role Model Refactor — Dual-Dimension Identity | ✅ | Sprint 14 | ADR-015 + ADR-017 implemented. MANAGER removed from UserRole enum. `isManager` JWT claim. ManagerGuard + @RequireManager(). 31-test E2E matrix. Stories 14.2–14.8. |
| TD-036 | Flaky Frontend Test (BadgeManagementPage) | ✅ | Sprint 14 | Test isolation fix — mock state leaking between Vitest workers. Story 14.1. |

### Other Resolved Items

| Issue | Status | Notes |
|-------|--------|-------|
| lodash Prototype Pollution | ✅ Risk Accepted | ADR-002. Dev-only exposure, CVSS 6.5. |
| Prisma version locked at 6.x | 🔒 Intentional | Prisma 7 breaking changes deferred to post-MVP. |
| ESLint Warning Regression (Sprint 9→10) | ✅ Sprint 10 | 423 → 0 warnings. Stories 10.2 + 10.3b. |

---

## 📊 Technical Debt Metrics

### Current State (Post-Sprint 14)

| Category | Count | Estimated Effort |
|----------|-------|------------------|
| Resolved | 24 | — |
| External Blocker | 1 | 1 day (admin) |
| Deferred (trigger-based) | 6 | ~51 hours |
| Deferred (architecture) | 1 | ~37 hours |
| Process Improvement | 2 | 5 hours |
| Track (enhancement) | 2 | ~6 hours |
| **Open Total** | **12** | **~99 hours** |

### Codebase Health Dashboard

| Metric | Backend | Frontend |
|--------|---------|----------|
| TypeScript Errors | 0 | 0 |
| ESLint Errors | 0 | 0 |
| ESLint Warnings | 0 | 0 |
| npm audit (prod) | 0 vulnerabilities | 0 vulnerabilities |
| Unit Tests | 932 passed (28 skipped = TD-006) | 794 passed |
| TODO/FIXME in src | 0 | 1 (dark mode) |

### Debt Trend

| Sprint | Created | Resolved | Net | Open Total |
|--------|---------|----------|-----|------------|
| Sprint 5 | 5 (TD-001–005) | 0 | +5 | 5 |
| Sprint 8 | 0 | 3 (TD-001, 002, 003) | -3 | 2 |
| Sprint 9 | 3 (TD-013, 014, 015) | 3 (TD-013, 014, 015) | 0 | 2 |
| Sprint 10 | 6 (TD-018–022, regression) | 7 (TD-017–022, regression) | -1 | 1 |
| Sprint 11 | 8 (TD-023–030) | 5 (TD-023–025, 028, 029) | +3 | 4 |
| Sprint 12 | 5 (TD-031–035) | 4 (TD-009, 010, 016b, 017) | +1 | 5 |
| Sprint 13 | 1 (TD-036) | 0 | +1 | 14* |
| Sprint 14 | 1 (TD-038) | 1 (TD-036) | 0 | 15** |

*\*Open = 1 external blocker + 6 deferred + 3 architecture + 2 process + 2 track*
*\*\*Open = 1 external blocker + 6 deferred + 1 architecture + 2 process + 2 track (TD-034, TD-036 resolved by Sprint 14)*

---

## 📝 Process Notes

### How to Add Technical Debt

1. **Assign ID:** TD-XXX (increment from TD-037)
2. **Set priority:** Critical / High / Medium / Low / P1-P3
3. **Estimate effort** in hours
4. **Document:** Description, impact, root cause, proposed solution
5. **Add to this file** AND to `project-context.md` Known Technical Issues table
6. **Link:** Reference sprint/story, tag affected files

### Debt Prevention Checklist

- [x] ESLint `--max-warnings=0` gate on both BE/FE (CI + pre-push)
- [x] TypeScript strict mode (`noEmit` check in pre-push)
- [x] `no-console` ESLint rule enforced
- [x] Chinese character CI gate
- [x] Husky pre-commit (lint-staged) + pre-push (full CI mirror)
- [x] Schema-based E2E test isolation with data factories
- [x] npm audit 0 vulnerabilities (prod dependencies)
- [ ] Playwright visual regression (TD-027)
- [ ] Audit triage workflow (TD-026)

---

## 🔄 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Initial document — TD-001 through TD-005 | Amelia (Dev Agent) |
| 2026-02-27 | Full rewrite — 35 items audited, 22 resolved, 14 open. Added codebase health metrics, debt trend, prevention checklist. | Bob (SM Agent) |

---

**Next Review:** Sprint 15 Planning
