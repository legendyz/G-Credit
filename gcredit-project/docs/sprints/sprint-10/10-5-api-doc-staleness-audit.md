# API Documentation Staleness Audit Report

**Audit Date:** 2026-02-09  
**Sprint:** 10 (v1.0.0 Release Sprint, Stories 10.1–10.5 complete)  
**Backend:** NestJS 11, TypeScript 5.7.3  
**Auditor:** Code Review (Story 10.5)

---

## 1. API Documentation Files Found

| # | File | Purpose | Last Updated (per file) |
|---|------|---------|------------------------|
| 1 | `backend/docs/API-GUIDE.md` (2099 lines) | Primary API reference, all modules | Header: "0.9.0 Sprint 9" / Footer: "0.8.0 Sprint 8" |
| 2 | `backend/docs/api/README.md` (285 lines) | API overview & module index | "Version 0.5.0 (Sprint 5)" / Jan 27, 2026 |
| 3 | `backend/docs/api/authentication.md` (755 lines) | Auth endpoints detail | Jan 27, 2026 |
| 4 | `backend/docs/api/badge-issuance.md` (615 lines) | Badge lifecycle endpoints | Jan 27, 2026 |
| 5 | `backend/docs/api/badge-templates.md` (663 lines) | Template CRUD endpoints | Jan 27, 2026 |
| 6 | `backend/docs/README.md` (254 lines) | Backend docs index | "Version 0.2.0" / Jan 26, 2026 |
| 7 | `docs/sprints/sprint-8/8-4-analytics-api.md` (553 lines) | Analytics API story (Sprint 8) | Feb 3, 2026 |
| 8 | `docs/sprints/sprint-10/api-path-audit-report.md` (303 lines) | API path mismatch audit | Feb 9, 2026 |
| 9 | `docs/sprints/sprint-10/10-3c-api-path-audit-fixes.md` (216 lines) | Path audit fix story | Feb 9, 2026 |

---

## 2. All Controller Files & Route Counts

19 controller files, **59 total routes** across the backend:

| # | Controller File | `@Controller()` Prefix | Routes | Documented In |
|---|-----------------|----------------------|--------|---------------|
| 1 | `app.controller.ts` | `` (root) | 7 (`/`, `/health`, `/ready`, `/profile`, `/admin-only`, `/issuer-only`, `/manager-only`) | ❌ Not documented |
| 2 | `auth.controller.ts` | `api/auth` | 9 (register, login, request-reset, reset-password, refresh, logout, profile GET, profile PATCH, change-password) | ✅ `api/authentication.md` + `API-GUIDE.md` |
| 3 | `badge-templates.controller.ts` | `api/badge-templates` | 8 (GET list, GET all, GET criteria-templates, GET criteria-templates/:key, GET :id, POST, PATCH :id, DELETE :id) | ✅ `api/badge-templates.md` + `API-GUIDE.md` |
| 4 | `badge-issuance.controller.ts` | `api/badges` | 12 (POST issue, POST :id/claim, GET my-badges, GET wallet, GET issued, GET :id, POST :id/revoke, GET :id/assertion, POST bulk, GET :id/similar, POST :id/report, GET :id/download/png, GET :id/integrity) | ⚠️ Partially in `api/badge-issuance.md` + `API-GUIDE.md` |
| 5 | `skills.controller.ts` | `api/skills` | 6 (GET list, GET search, GET :id, POST, PATCH :id, DELETE :id) | ⚠️ Only in `API-GUIDE.md` (under badge-templates/skills path — WRONG) |
| 6 | `skill-categories.controller.ts` | `api/skill-categories` | 6 (GET list, GET flat, GET :id, POST, PATCH :id, DELETE :id) | ⚠️ Only in `API-GUIDE.md` (under badge-templates/categories path — WRONG) |
| 7 | `analytics.controller.ts` | `api/analytics` | 5 (system-overview, issuance-trends, top-performers, skills-distribution, recent-activity) | ✅ `API-GUIDE.md` + sprint story `8-4-analytics-api.md` |
| 8 | `admin-users.controller.ts` | `api/admin/users` | 4 (GET list, GET :id, PATCH :id/role, PATCH :id/status) | ✅ `API-GUIDE.md` |
| 9 | `m365-sync.controller.ts` | `api/admin/m365-sync` | 4 (POST sync, GET logs, GET logs/:id, GET status) | ✅ `API-GUIDE.md` |
| 10 | `bulk-issuance.controller.ts` | `api/bulk-issuance` | 5 (GET template, POST upload, GET preview/:sessionId, POST confirm/:sessionId, GET error-report/:sessionId) | ✅ `API-GUIDE.md` |
| 11 | `dashboard.controller.ts` | `api/dashboard` | 4 (GET employee, GET issuer, GET manager, GET admin) | ❌ Not documented |
| 12 | `evidence.controller.ts` | `api/badges/:badgeId/evidence` | 4 (POST upload, GET list, GET :fileId/download, GET :fileId/preview) | ❌ Not documented |
| 13 | `badge-sharing.controller.ts` | `api/badges/share` | 1 (POST email) | ❌ Not documented (only verified in path audit) |
| 14 | `teams-sharing.controller.ts` | `api/badges` | 1 (POST :badgeId/share/teams) | ❌ Not documented |
| 15 | `badge-analytics.controller.ts` | `api/badges` | 2 (GET :badgeId/analytics/shares, GET :badgeId/analytics/shares/history) | ❌ Not documented |
| 16 | `widget-embed.controller.ts` | `api/badges` | 2 (GET :badgeId/embed, GET :badgeId/widget) | ❌ Not documented |
| 17 | `badge-verification.controller.ts` | `api/verify` | 1 (GET :verificationId) | ⚠️ Briefly mentioned in `API-GUIDE.md` under Badge Verification section |
| 18 | `teams-action.controller.ts` | `api/teams/actions` | 1 (POST claim-badge) | ❌ Not documented |
| 19 | `milestones.controller.ts` | `api` | 5 (POST admin/milestones, GET admin/milestones, PATCH admin/milestones/:id, DELETE admin/milestones/:id, GET milestones/achievements) | ❌ Not documented |

**Summary:** 59 routes total. ~30 routes are documented in API-GUIDE.md or api/ docs. **~29 routes are either undocumented or incorrectly documented.**

---

## 3. Issues Found

### 🔴 MUST FIX — Version Numbers / Metadata Conflicts

| # | File | Line(s) | Issue | Should Be |
|---|------|---------|-------|-----------|
| MF-1 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L3) | L3 | Version says `0.9.0 (Sprint 9)` | `1.0.0 (Sprint 10)` |
| MF-2 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L2098) | L2098 | Footer says `API Version: 0.8.0 (Sprint 8)` | `1.0.0 (Sprint 10)` — contradicts L3 |
| MF-3 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L2097) | L2097 | Footer says `Last Updated: 2026-02-04` | `2026-02-09` (or current date) |
| MF-4 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L4) | L4 | `Last Updated: 2026-02-08` | Should match actual last update |
| MF-5 | [api/README.md](../../backend/docs/api/README.md#L3) | L3 | Version says `0.5.0 (Sprint 5 Complete)` | `1.0.0 (Sprint 10)` |
| MF-6 | [api/README.md](../../backend/docs/api/README.md#L7) | L7 | `Last Updated: 2026-01-29` | Should be current |
| MF-7 | [backend/docs/README.md](../../backend/docs/README.md#L4) | L4 | Version says `0.2.0` | `1.0.0` |
| MF-8 | [backend/docs/README.md](../../backend/docs/README.md#L5) | L5 | `Last Updated: 2026-01-26` | Should be current |

### 🔴 MUST FIX — Wrong API Paths in Documentation

| # | File | Line(s) | Issue | Correct Path |
|---|------|---------|-------|-------------|
| MF-9 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md#L2) | L2 | Base path says `/badge-templates` | `/api/badge-templates` (controller was updated to `api/badge-templates` in Story 10.3c) |
| MF-10 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md#L38) | L38+ | All endpoint paths use `GET /badge-templates` without `api/` prefix | All should be `GET /api/badge-templates`, etc. |
| MF-11 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md#L98) | L98 | Admin endpoint documented as `GET /badge-templates/all` | Actual: `GET /api/badge-templates/all` |
| MF-12 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md) | Multiple | All curl examples use `http://localhost:3000/badge-templates` | Should be `http://localhost:3000/api/badge-templates` |
| MF-13 | [api/authentication.md](../../backend/docs/api/authentication.md#L2) | L2+ | All endpoint paths use `/auth/...` without `api/` prefix | All should be `/api/auth/...` (controller was updated to `api/auth` in Story 10.3c) |
| MF-14 | [api/authentication.md](../../backend/docs/api/authentication.md) | Multiple | All curl examples use `http://localhost:3000/auth/...` | Should be `http://localhost:3000/api/auth/...` |
| MF-15 | [api/README.md](../../backend/docs/api/README.md#L40) | L40 | Auth path listed as `/auth` | Should be `/api/auth` |
| MF-16 | [api/README.md](../../backend/docs/api/README.md#L269) | L269 | Quick Reference table: Auth path `/auth`, Badge Templates `/api/badge-templates` (inconsistent with module listing) | All should have `api/` prefix |
| MF-17 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L405-L475) | L405–475 | Skills documented at path `/api/badge-templates/skills` | Actual controller path: `/api/skills` (separate controller, not nested under badge-templates) |
| MF-18 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L498-L590) | L498–590 | Skill Categories documented at path `/api/badge-templates/categories` | Actual controller path: `/api/skill-categories` (separate controller) |

### 🔴 MUST FIX — Missing Module Documentation

| # | Module | Controller(s) | Routes | Impact |
|---|--------|--------------|--------|--------|
| MF-19 | **Dashboard** | `dashboard.controller.ts` | 4 (employee, issuer, manager, admin) | Core feature for all user roles — completely undocumented in API docs |
| MF-20 | **Evidence** | `evidence.controller.ts` | 4 (upload, list, download, preview) | Badge evidence management — no API doc |
| MF-21 | **Badge Sharing** | `badge-sharing.controller.ts`, `teams-sharing.controller.ts` | 2 (email share, Teams share) | Key social features — no API doc |
| MF-22 | **Badge Share Analytics** | `badge-analytics.controller.ts` | 2 (shares summary, share history) | Analytics for individual badges — no API doc |
| MF-23 | **Badge Widget/Embed** | `widget-embed.controller.ts` | 2 (embed data, widget HTML) | LinkedIn/social embeddable widgets — no API doc |
| MF-24 | **Milestones** | `milestones.controller.ts` | 5 (CRUD for admin + achievements for user) | Achievement milestones — no API doc |

### 🟡 SHOULD FIX — Stale / Missing Information

| # | File | Issue | Detail |
|---|------|-------|--------|
| SF-1 | [api/README.md](../../backend/docs/api/README.md#L62-L85) | Module listing stops at Sprint 5 | Missing: Analytics (Sprint 8), Admin Users (Sprint 8), M365 Sync (Sprint 8), Dashboard (Sprint 8), Bulk Issuance (Sprint 9), Badge Sharing (Sprint 7), Evidence (Sprint 4), Milestones (Sprint 7) |
| SF-2 | [api/README.md](../../backend/docs/api/README.md#L65-L70) | Skills listed as module #4 at `/api/skills` | Cross-references to `skills.md` which does not exist |
| SF-3 | [api/README.md](../../backend/docs/api/README.md#L73-L75) | Skill Categories listed as module #5 at `/api/skill-categories` | Cross-references to `skill-categories.md` which does not exist |
| SF-4 | [api/README.md](../../backend/docs/api/README.md#L77-L85) | Badge Wallet listed as module #6 "In development" | Should be marked complete (Sprint 4+) |
| SF-5 | [api/README.md](../../backend/docs/api/README.md#L87-L98) | Badge Verification listed as "🆕" and "In development" | Should be marked complete (Sprint 5+) |
| SF-6 | [api/README.md](../../backend/docs/api/README.md#L269-L277) | Quick Reference table only lists 5 modules | Should list all 15+ modules |
| SF-7 | [api/badge-issuance.md](../../backend/docs/api/badge-issuance.md) | Missing 5 endpoints that exist in controller | Missing: `GET wallet`, `GET :id/similar`, `POST :id/report`, `GET :id/download/png`, `GET :id/integrity` |
| SF-8 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md#L319) | Update endpoint documented as `PATCH /badge-templates/:id` | Actual method in controller is `@Patch(':id')` — correct method, but update is documented as method PUT elsewhere in API-GUIDE.md |
| SF-9 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L311) | Badge Templates update documented as `PUT` | Actual controller decorator is `@Patch(':id')` — should be `PATCH` |
| SF-10 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L2092) | Swagger UI URL listed as `http://localhost:3000/api-docs` | Also documented as `http://localhost:3000/api` on L267 — inconsistent |
| SF-11 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L2099) | Coverage stated as "Sprint 0-8" | Should be "Sprint 0-10" |
| SF-12 | [api/badge-issuance.md](../../backend/docs/api/badge-issuance.md#L615) | `Last Updated: January 27, 2026` | Stale by ~2 weeks; revocation, verification, wallet endpoints added since then |
| SF-13 | [api/badge-templates.md](../../backend/docs/api/badge-templates.md#L663) | `Last Updated: January 27, 2026` | Stale; no updates for controller prefix change |
| SF-14 | [api/authentication.md](../../backend/docs/api/authentication.md#L755) | `Last Updated: January 27, 2026` | Stale; no updates for controller prefix change |
| SF-15 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L18) | ToC lists "Badge Sharing" section not present | No Badge Sharing section exists in the guide |
| SF-16 | [api/README.md](../../backend/docs/api/README.md#L87-L95) | `@PublicBadgeVerification path` says `/verify/:verificationId` and `/api/verify/:verificationId` | Actual controller: `api/verify` → only `/api/verify/:verificationId` |
| SF-17 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md) | Dashboard admin endpoint (`GET /api/dashboard/admin`) not documented | Exists in controller but not in API docs |
| SF-18 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L13) | Skills paths documented as `/api/badge-templates/skills` | `skill-categories.controller.ts` has `GET flat` endpoint not documented anywhere |

### 🟢 LOW — Cosmetic / Minor Issues

| # | File | Issue | Detail |
|---|------|-------|--------|
| LO-1 | [api/README.md](../../backend/docs/api/README.md#L3-L5) | API Prefix description says `/api` or `/auth` | After Story 10.3c, everything is under `/api/...` — the `/auth` distinction no longer applies |
| LO-2 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md#L267) | Swagger UI at `http://localhost:3000/api` | Potential confusion: NestJS serves Swagger at `/api-docs` or `/api` depending on setup |
| LO-3 | [api/badge-issuance.md](../../backend/docs/api/badge-issuance.md) | Uses `POST /api/badges/bulk` for old bulk issuance | New Bulk Issuance module at `api/bulk-issuance` exists; the old `POST /api/badges/bulk` may still work but is the legacy approach |
| LO-4 | [API-GUIDE.md](../../backend/docs/API-GUIDE.md) | Register endpoint shows `name` field | Per `api/authentication.md`, actual fields are `firstName` + `lastName` (not combined `name`). Inconsistency between docs. |
| LO-5 | [8-4-analytics-api.md](../../docs/sprints/sprint-8/8-4-analytics-api.md#L271) | Sample controller code uses `@Controller('analytics')` | Actual controller uses `@Controller('api/analytics')` — Story doc has stale example code |
| LO-6 | [api/README.md](../../backend/docs/api/README.md#L161) | Rate limiting section says "Currently, no rate limiting is implemented" | Rate limiting was implemented in Sprint 8 |
| LO-7 | [backend/docs/README.md](../../backend/docs/README.md#L23-L25) | Sprint documentation only lists Sprint 0-2 | Should list Sprint 0-10 |
| LO-8 | `app.controller.ts` | 7 routes exist (health, ready, profile, role-check endpoints) | These are infrastructure/debug routes, likely fine to leave undocumented, but `/health` and `/ready` should be noted for ops |

---

## 4. Missing Dedicated API Documentation Files

The `backend/docs/api/` folder only has 4 files:
- `README.md` (overview)
- `authentication.md`
- `badge-issuance.md`
- `badge-templates.md`

**Missing dedication API docs referenced or needed:**

| File Referenced | Referenced From | Status |
|-----------------|----------------|--------|
| `skills.md` | `api/README.md` L65 | ❌ Does not exist |
| `skill-categories.md` | `api/README.md` L74 | ❌ Does not exist |
| `dashboard.md` | — | ❌ Does not exist (4 endpoints undocumented) |
| `evidence.md` | — | ❌ Does not exist (4 endpoints undocumented) |
| `badge-sharing.md` | — | ❌ Does not exist (5 endpoints across 3 controllers undocumented) |
| `milestones.md` | — | ❌ Does not exist (5 endpoints undocumented) |
| `bulk-issuance.md` | — | ⚠️ Documented in API-GUIDE.md but no dedicated file |
| `analytics.md` | — | ⚠️ Documented in API-GUIDE.md but no dedicated file |
| `admin-users.md` | — | ⚠️ Documented in API-GUIDE.md but no dedicated file |
| `m365-sync.md` | — | ⚠️ Documented in API-GUIDE.md but no dedicated file |

---

## 5. Priority Summary

| Priority | Count | Examples |
|----------|-------|---------|
| 🔴 **MUST FIX** | 24 | Wrong version (×8), wrong paths post-10.3c (×10), 6 undocumented modules |
| 🟡 **SHOULD FIX** | 18 | Stale dates, missing endpoints in existing docs, inconsistent field names, broken cross-refs |
| 🟢 **LOW** | 8 | Cosmetic, redundant legacy info, debug routes |
| **Total Issues** | **50** | |

---

## 6. Recommended Fix Plan

### Phase 1 — Critical Path Updates (before UAT, ~2h)

1. **Update all version numbers** → `1.0.0` in `API-GUIDE.md`, `api/README.md`, `backend/docs/README.md`
2. **Fix all `/auth/...` → `/api/auth/...`** in `api/authentication.md` (~30 occurrences)
3. **Fix all `/badge-templates/...` → `/api/badge-templates/...`** in `api/badge-templates.md` (~25 occurrences)
4. **Fix Skills path** in `API-GUIDE.md`: `/api/badge-templates/skills` → `/api/skills`
5. **Fix Skill Categories path** in `API-GUIDE.md`: `/api/badge-templates/categories` → `/api/skill-categories`
6. **Update `api/README.md` module listing** to include all 15 modules with correct paths
7. **Update all "Last Updated" dates**

### Phase 2 — Module Documentation Gap Fill (~4h)

1. Create `api/dashboard.md` documenting 4 dashboard endpoints
2. Create `api/evidence.md` documenting 4 evidence endpoints
3. Create `api/badge-sharing.md` documenting 5 sharing/analytics/embed endpoints
4. Create `api/milestones.md` documenting 5 milestone endpoints
5. Add missing badge-issuance endpoints (wallet, similar, report, download/png, integrity) to `api/badge-issuance.md`

### Phase 3 — Consistency Cleanup (~1h)

1. Fix PUT → PATCH inconsistency for badge-templates update in `API-GUIDE.md`
2. Fix `name` vs `firstName`/`lastName` inconsistency in register endpoint
3. Consolidate Swagger UI URL references
4. Remove "In development" markers from completed features
5. Update Sprint coverage from "0-8" to "0-10"

---

## 7. Controller-to-Doc Coverage Matrix

| Controller | api/ Dedicated Doc | API-GUIDE.md | Sprint Story | Overall |
|------------|-------------------|-------------|-------------|---------|
| `auth.controller.ts` | ✅ (stale paths) | ✅ | — | ⚠️ Path fix needed |
| `badge-templates.controller.ts` | ✅ (stale paths) | ✅ | — | ⚠️ Path fix needed |
| `badge-issuance.controller.ts` | ⚠️ (5 routes missing) | ✅ | — | ⚠️ Incomplete |
| `skills.controller.ts` | ❌ (referenced but missing) | ⚠️ (wrong path) | — | 🔴 Missing + wrong |
| `skill-categories.controller.ts` | ❌ (referenced but missing) | ⚠️ (wrong path) | — | 🔴 Missing + wrong |
| `analytics.controller.ts` | ❌ | ✅ | ✅ | ✅ Adequate |
| `admin-users.controller.ts` | ❌ | ✅ | — | ✅ Adequate |
| `m365-sync.controller.ts` | ❌ | ✅ | — | ✅ Adequate |
| `bulk-issuance.controller.ts` | ❌ | ✅ | — | ✅ Adequate |
| `dashboard.controller.ts` | ❌ | ❌ | ⚠️ (story only) | 🔴 Undocumented |
| `evidence.controller.ts` | ❌ | ❌ | ❌ | 🔴 Undocumented |
| `badge-sharing.controller.ts` | ❌ | ❌ | ⚠️ (story only) | 🔴 Undocumented |
| `teams-sharing.controller.ts` | ❌ | ❌ | ⚠️ (story only) | 🔴 Undocumented |
| `badge-analytics.controller.ts` | ❌ | ❌ | ⚠️ (story only) | 🔴 Undocumented |
| `widget-embed.controller.ts` | ❌ | ❌ | ⚠️ (story only) | 🔴 Undocumented |
| `badge-verification.controller.ts` | ❌ | ⚠️ (brief) | — | ⚠️ Minimal |
| `teams-action.controller.ts` | ❌ | ❌ | ❌ | 🔴 Undocumented |
| `milestones.controller.ts` | ❌ | ❌ | ❌ | 🔴 Undocumented |
| `app.controller.ts` | ❌ | ❌ | — | 🟢 Infra/debug OK |

**Overall Documentation Coverage: ~50% of routes documented, ~30% accurately documented.**
