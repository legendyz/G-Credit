# Story 16.3: Template Edit/Update Ownership Guard

Status: dev-complete

## Story
As an **Issuer**,
I want **to only edit and manage templates I created**,
So that **I cannot modify another Issuer's templates and template integrity is maintained**.

## Acceptance Criteria
1. [x] `PATCH /badge-templates/:id` checks `template.createdBy === userId` for ISSUER role — **ALREADY IMPLEMENTED** (controller lines 280-288)
2. [x] Status change goes through `PATCH /:id` with `{ status }` — **NO SEPARATE ENDPOINT** — ownership guard covers this path
3. [x] ADMIN can edit/update any template (no ownership check) — **ALREADY IMPLEMENTED**
4. [x] Returns 403 Forbidden with clear message on ownership violation — **ALREADY IMPLEMENTED** (`'You can only update your own badge templates'`)
5. [x] Frontend `BadgeTemplateListPage` only shows edit/delete actions for owned templates (ISSUER) — **ALREADY IMPLEMENTED** via `canModify` flag
6. [x] Existing delete ownership check (ARCH-P1-004) remains functional — **ALREADY IMPLEMENTED** (controller lines 318-328)

## Tasks / Subtasks
- [x] Task 1: Verify ownership check in `badge-templates.controller.ts` `update()` (AC: #1, #3, #4)
  - [x] Already implemented — same pattern as `remove()` (ARCH-P1-004)
  - [x] `if (userRole === ISSUER && template.createdBy !== userId) → 403` — confirmed in controller
- [x] Task 2: Verify ownership check covers status change (AC: #2, #4)
  - [x] No separate status endpoint — status changes go through `PATCH /:id` which is already guarded
- [x] Task 3: Verify frontend ownership gating (AC: #5)
  - [x] `BadgeTemplateListPage.tsx`: `isOwner` and `canModify` flags gate Edit/Delete/Status buttons
  - [x] "Mine" / "Read-only" badges shown for ISSUER role
  - [x] View-only mode with `?readonly=true` for non-owned templates
- [x] Task 4: E2E + Frontend tests (AC: #1-#6)
  - [x] **NEW** Backend E2E: `badge-templates-ownership.e2e-spec.ts` — 12 tests all passing
    - [x] Issuer updates own template → 200 OK
    - [x] Issuer updates other's template → 403 Forbidden
    - [x] Issuer changes own template status → 200 OK
    - [x] Issuer changes other's template status → 403 Forbidden
    - [x] Admin updates any template → 200 OK (ownership bypass)
    - [x] Issuer deletes own template → 200 OK
    - [x] Issuer deletes other's template → 403 Forbidden
    - [x] Admin deletes any template → 200 OK (ownership bypass)
  - [x] **EXISTING** Frontend tests: `BadgeTemplateListPage.test.tsx` — 27 tests all passing
    - [x] "Mine" badge on owned templates
    - [x] View button (not Edit) for non-owned templates
    - [x] Disabled Archive/Delete for non-owned templates
    - [x] ADMIN sees all Edit buttons enabled, no Mine/Read-only badges

## Dev Notes

### ⚠️ CRITICAL DISCOVERY: All Implementation Already Done
During development, we confirmed that **all backend ownership checks and frontend gating were already implemented** from earlier sprints (ARCH-P1-004). This story's actual deliverable is the **E2E test suite** that formally verifies the ownership guard works end-to-end.

### Architecture Patterns Used
- **ARCH-P1-004:** Ownership check pattern in `badge-templates.controller.ts` for both `update()` and `remove()`
- Status changes use the same `PATCH /:id` endpoint — no separate status endpoint exists

### Source Tree Components
- `backend/src/badge-templates/badge-templates.controller.ts` — update (lines 280-288), remove (lines 318-328) ownership checks
- `frontend/src/pages/admin/BadgeTemplateListPage.tsx` — `isOwner`/`canModify` conditional rendering (line 397-398)

### Testing Standards
- Backend E2E: 12 tests covering update/status/delete ownership for Issuer-A, Issuer-B, Admin
- Frontend unit: 6 ownership-specific tests within existing 27-test suite

## Code Review Strategy
- 🔴 HIGH risk — AI Review (authorization change)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- All implementation was already in place from prior sprints (ARCH-P1-004)
- Created `badge-templates-ownership.e2e-spec.ts` with 12 E2E tests — all passing
- Verified existing frontend tests (27/27 passing) already cover ownership UX
- No source code changes needed — story scope was verification + test coverage

### File List
| File | Action |
|------|--------|
| `backend/test/badge-templates-ownership.e2e-spec.ts` | **NEW** — 12 E2E tests for ownership guard |
| `docs/sprints/sprint-16/16-3-template-edit-ownership-guard.md` | **UPDATED** — story status, ACs, dev record |

## Code Review Report

**Reviewer:** Senior Security Code Reviewer (Claude Opus 4.6)
**Date:** 2026-03-03
**Verdict:** ✅ **APPROVE**

### Security

| # | Check | Result | Notes |
|---|-------|--------|-------|
| S1 | Ownership check for PATCH update | ✅ PASS | `badge-templates.controller.ts` lines 280-288: `if (ISSUER && createdBy !== userId) → 403` |
| S2 | Ownership check for DELETE | ✅ PASS | Controller lines 318-328: same ARCH-P1-004 pattern |
| S3 | Status change covered | ✅ PASS | No separate status endpoint — goes through PATCH which has ownership guard |
| S4 | ADMIN bypass correct | ✅ PASS | Only ISSUER triggers check; ADMIN falls through without guard |
| S5 | Error messages clear, no leaks | ✅ PASS | `'You can only update your own badge templates'` / `'You can only delete your own badge templates'` |

### Test Quality

| # | Check | Result | Notes |
|---|-------|--------|-------|
| T7 | E2E covers PATCH update + PATCH status + DELETE | ✅ PASS | 12 tests across 3 `describe` blocks: update (5 tests), status change (3 tests), delete (4 tests) |
| T8 | Delete tests verify template is gone | ✅ PASS | Each delete test follows up with `GET /:id` expecting 404 — confirms actual deletion |
| T-setup | Test isolation | ✅ PASS | Uses `setupE2ETest('tpl-ownership')` for schema isolation, creates fresh templates per test group |
| T-users | Multiple issuers tested | ✅ PASS | Issuer-A and Issuer-B with cross-ownership tests in both directions |
| T-403 | 403 message assertion | ✅ PASS | Checks `expect(body.message).toContain('You can only ...')` for exact message |

### Summary

**Verdict: ✅ APPROVE**

All 12 E2E tests are well-structured and comprehensive. The pre-existing ownership implementation correctly follows ARCH-P1-004. No changes required.

## Retrospective Notes
- Story was estimated at 2h but completed faster due to all implementation being pre-existing
- The ownership guard pattern (ARCH-P1-004) was well-implemented and consistent across update/delete
- Frontend ownership UX (Mine/Read-only badges, disabled buttons) was already comprehensive
- Key learning: planning discovery phase correctly identified pre-existing code, reducing rework
