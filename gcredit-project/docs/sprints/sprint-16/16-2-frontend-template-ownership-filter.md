# Story 16.2: Frontend — Template List Ownership Filter

Status: done

## Story
As an **Issuer**,
I want **to only see templates I created when issuing badges**,
So that **I am not confused by templates from other Issuers and can only use my own**.

## Acceptance Criteria
1. [x] `IssueBadgePage` template dropdown shows only Issuer's own templates (filtered by `createdBy`)
2. [x] `BulkIssuancePage` template selection shows only Issuer's own templates
3. [x] ADMIN sees all templates (no filtering change)
4. [x] Template count in dropdown matches ownership scope
5. [x] Empty state shown if Issuer has no templates yet

## Tasks / Subtasks
- [x] Task 1: Add `creatorId` query param to template list API (AC: #1)
  - [x] Backend: `findAll()` accepts optional `creatorId` filter — server-side auto-inject approach
  - [x] When ISSUER requests, auto-inject `creatorId = userId` on server side (both `findAll` and `findAllAdmin`)
- [x] Task 2: Update `IssueBadgePage` template fetching (AC: #1, #4, #5)
  - [x] Server-side filtering — no frontend API changes needed
  - [x] Show "No templates found. Create a template first before issuing badges." empty state
- [x] Task 3: Update `BulkIssuancePage` template selection (AC: #2)
  - [x] Empty state message in `TemplateSelector.tsx` when templates array is empty
- [x] Task 4: Frontend tests (AC: #1-#5)
  - [x] Test: Empty state when no owned templates (IssueBadgePage.test.tsx)
- [x] Task 5: Backend unit tests
  - [x] 5 unit tests for `creatorId` filter in badge-templates.service.spec.ts
- [x] Task 6: Backend E2E tests
  - [x] 5 E2E tests for ownership filter (ISSUER-A, ISSUER-B, ADMIN, empty, /all endpoint)

## Dev Notes
### Architecture Patterns Used
- Backend option: Add `creatorId` filter to `QueryBadgeTemplatesDto` + auto-inject in controller
- Frontend: `getActiveTemplates()` in `badgeTemplatesApi.ts` — already fetches ACTIVE templates
- Alternative: Server-side auto-filtering (Issuer requests `/badge-templates` → server adds `WHERE createdBy = userId`)

### Source Tree Components
- `backend/src/badge-templates/badge-templates.service.ts` — `findAll()` where clause
- `backend/src/badge-templates/badge-templates.controller.ts` — inject userId for ISSUER
- `frontend/src/pages/IssueBadgePage.tsx` — template dropdown
- `frontend/src/pages/BulkIssuancePage.tsx` — template selection
- `frontend/src/lib/badgeTemplatesApi.ts` — API functions

### Testing Standards
- Frontend: Vitest + React Testing Library
- Mock API responses with ownership-scoped data

### References
- `badge-templates.controller.ts` `findAll()` and `findAllAdmin()` — two existing endpoints
- Lesson 55: Filter changes must reset pagination

## Code Review Strategy
- 🟡 MEDIUM risk — AI Review + Self-review

## Code Review Report

**Reviewer:** Senior Code Reviewer (Authorization / Data Visibility)
**Date:** 2026-03-04
**Verdict:** ✅ **APPROVE WITH COMMENTS**

### Security / Authorization

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1 | ISSUER cannot fetch other issuers' templates via `/badge-templates` | ✅ PASS | Controller injects `creatorId` for ISSUER, service applies `where.createdBy` at query level |
| S2 | ISSUER cannot bypass via `/badge-templates/all` | ✅ PASS | Same `creatorId` injection logic in `findAllAdmin()` |
| S3 | ADMIN bypass works correctly | ✅ PASS | `creatorId` is `undefined` for ADMIN; no ownership clause added |
| S4 | EMPLOYEE behavior is explicit and safe | ⚠️ CONCERN | `GET /api/badge-templates` has no `@Roles` guard; EMPLOYEE can receive unfiltered ACTIVE templates. If intended as catalog exposure, acceptable; if not, add role restriction or EMPLOYEE filter policy |
| S5 | Filter is applied in DB query, not post-filter | ✅ PASS | Prisma `where.createdBy` composes with pagination/count correctly |
| S6 | Client cannot override `creatorId` | ✅ PASS | `creatorId` is derived from JWT server-side, not query params |

### Architecture Consistency

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A1 | `req.user?.role` vs `req.user.role` inconsistency | ✅ PASS | **Re-review fixed**: `findAll()` now uses `req.user.role`, consistent with `findAllAdmin()` |
| A2 | Controller-layer injection for query filtering | ✅ PASS | Appropriate for list filtering; mutation guards remain separate by story (16.1/16.3) |
| A3 | `creatorId` as internal optional service param | ✅ PASS | Correctly avoids exposing auth-derived filter in public DTO |
| A4 | Story/ARCH comments accuracy | ✅ PASS | Story 16.2 and ownership-filter comments are present and aligned |

### Test Quality

| # | Check | Result | Notes |
|---|-------|--------|-------|
| T1 | Unit coverage for creatorId filter scenarios | ✅ PASS | 5 unit tests cover apply/no-apply/result/empty/search-composition |
| T2 | E2E uses real HTTP + JWT | ✅ PASS | `supertest` with logged-in users/tokens |
| T3 | E2E isolation across issuers | ✅ PASS | Issuer-A / Issuer-B templates created independently |
| T4 | ADMIN sees both issuers' templates | ✅ PASS | Explicit inclusion assertions for both template IDs |
| T5 | `/badge-templates/all` ownership behavior | ✅ PASS | Issuer-only ownership assertions included |
| T6 | IssueBadgePage empty-state frontend test | ✅ PASS | Verifies message and disabled template selector |
| T7 | TemplateSelector empty-state test coverage | ✅ PASS | **Re-review fixed**: added `TemplateSelector.test.tsx` with 4 tests (empty state, loading guard, non-empty guard, render) |

### Frontend Notes

| # | Check | Result | Notes |
|---|-------|--------|-------|
| F1 | Empty-state copy clarity | ✅ PASS | Messages are actionable and clear |
| F2 | Empty state blocks invalid template selection | ✅ PASS | `IssueBadgePage` select disabled when `templates.length === 0` |
| F3 | `text-neutral-500` vs `text-gray-500` token usage | ✅ PASS | **Re-review fixed**: empty-state token in `TemplateSelector.tsx` unified to `text-neutral-500` |
| F4 | `&quot;` usage in TemplateSelector | ✅ PASS | Valid JSX render output; no functional regression risk |
| F5 | Empty-state rendering guard | ✅ PASS | Correctly gated on `!isLoading && templates.length === 0` |

### Code Quality / Edge Cases

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C1 | Debug artifacts | ✅ PASS | No debug leftovers in reviewed files |
| C2 | Backward compatibility of service signature | ✅ PASS | `creatorId` remains optional (`creatorId?: string`) |
| C3 | Story tracking completeness | ✅ PASS | ACs, tasks, agent record, and file list are filled |
| E1 | Issuer demoted to employee | ⚠️ CONCERN | Behavior depends on API role policy; currently EMPLOYEE can still call `/badge-templates` and get ACTIVE list |
| E2 | Pagination with ownership filter | ✅ PASS | Query-level filter keeps `meta.total` semantically correct |
| E3 | Filter composition (`creatorId` + search/skill/status) | ✅ PASS | Prisma `where` clause composes conditions correctly |
| E4 | Legacy `createdBy = null` templates | ✅ PASS | ISSUER cannot see orphan templates under `where.createdBy=issuerId` (safe default) |

### Summary

Core Story 16.2 objective is met: ISSUER list visibility is server-side filtered for both `/badge-templates` and `/badge-templates/all`, with ADMIN bypass and strong unit/E2E coverage.

**Non-blocking follow-ups recommended:**
1. ~~Standardize `req.user` access style (`?.` vs direct) in `badge-templates.controller.ts`~~ **FIXED** — removed optional chain in `findAll()`, both endpoints now use `req.user.role`
2. ~~Add a frontend unit test for `TemplateSelector` empty-state behavior~~ **FIXED** — added `TemplateSelector.test.tsx` with 4 tests (empty state, loading guard, non-empty guard, basic render)
3. Confirm and document EMPLOYEE access policy for `GET /api/badge-templates` (catalog vs restricted) — deferred to Sprint 17 RBAC hardening
4. ~~Color token inconsistency (`text-neutral-500` vs `text-gray-500`)~~ **FIXED** — unified `TemplateSelector.tsx` empty state to `text-neutral-500`

### Re-review (Post-fix)

**Date:** 2026-03-04  
**Scope:** Validate fixes for A1 / F3 / T7 from initial review  
**Result:** ✅ **PASS**

- A1 verified in `badge-templates.controller.ts`: `findAll()` now uses direct `req.user.role` access
- F3 verified in `TemplateSelector.tsx`: empty-state text uses `text-neutral-500`
- T7 verified in `TemplateSelector.test.tsx`: 4 dedicated tests added and passing

**Updated overall verdict:** ✅ **APPROVE WITH COMMENTS** (remaining non-blocking concern: S4/E1 policy clarity for EMPLOYEE access to `GET /api/badge-templates`)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- **Approach**: Server-side auto-filtering (ARCH-P1-004 pattern) — controller detects ISSUER role and injects `creatorId` before calling service. No frontend API changes needed; `getActiveTemplates()` call unchanged.
- **Backend**: `findAll(query, onlyActive, creatorId?)` now accepts optional `creatorId`; both `findAll()` and `findAllAdmin()` controller endpoints inject `req.user.userId` when `role === ISSUER`.
- **Frontend**: Added empty state messages to `IssueBadgePage.tsx` (disabled Select + guidance text) and `TemplateSelector.tsx` (info paragraph).
- **Tests**: 5 backend unit tests (creatorId filter), 5 E2E tests (ISSUER-A/B isolation, ADMIN sees all, empty list, /all endpoint), 1 frontend test (empty state).
- All 48 backend unit tests pass, 12 frontend tests pass, 0 TypeScript errors.

### File List
- `backend/src/badge-templates/badge-templates.service.ts` — added `creatorId` param + `where.createdBy` filter
- `backend/src/badge-templates/badge-templates.controller.ts` — inject `creatorId` for ISSUER in `findAll()` + `findAllAdmin()`
- `frontend/src/pages/IssueBadgePage.tsx` — empty state when templates array empty
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx` — empty state message
- `frontend/src/components/BulkIssuance/TemplateSelector.test.tsx` — 4 new tests (empty state coverage)
- `backend/src/badge-templates/badge-templates.service.spec.ts` — 5 new unit tests
- `backend/test/badge-templates.e2e-spec.ts` — 5 new E2E tests
- `frontend/src/pages/IssueBadgePage.test.tsx` — 1 new empty state test

## Retrospective Notes
