# Code Review Report — Story 12.4: Milestone Admin UI & Engine Upgrade

## Scope

- Story: `docs/sprints/sprint-12/12-4-milestone-admin-ui.md`
- Dev prompt: `docs/sprints/sprint-12/12-4-dev-prompt.md`
- Review prompt: `docs/sprints/sprint-12/12-4-code-review-prompt.md`
- Base commit: `c777a1d`
- Reviewed commits: `e1c1e79`, `31541ed`, `df34c04`

## Verdict

**Changes Requested (Not approved yet).**

The implementation is strong overall and most architecture/engine goals are met, but two medium-severity issues remain and should be fixed before approval:

1. `PATCH /admin/milestones/:id` does not enforce the same cross-field trigger validation as create (`category_count + category` can still pass through update path).
2. Admin milestone cards do not expose a delete/deactivate entry point even though delete logic and confirmation dialog exist.

## What Was Verified

### Backend

- ✅ Milestone enum migration strategy is correct for PostgreSQL (`rename -> create -> alter -> drop`) and data migration behavior is consistent with story intent.
- ✅ Milestone engine uses `metric × scope` evaluation with dynamic scope filtering and BFS descendant category traversal.
- ✅ `checkMilestones()` now returns newly achieved milestones; badge issuance and claim flows await this result and degrade gracefully to `[]` on error.
- ✅ Dashboard milestone panel now uses `MilestonesService.getNextMilestone()` instead of hardcoded modulo logic.
- ✅ `MilestonesModule` exports `MilestonesService`; `DashboardModule` imports `MilestonesModule`.

### Frontend

- ✅ `/admin/milestones` route is registered and protected for `ADMIN`.
- ✅ Milestone management page, form sheet, API module, React Query hooks, and switch component are present and wired.
- ✅ Claim flow reads `newMilestones` and triggers milestone celebration modal.
- ⚠️ Timeline milestone card wiring remains partial (`MilestoneTimelineCard` import is still commented).

## Blocking Findings (Must Fix)

### B1 — Missing cross-field validation in update path

- **Severity:** Medium
- **File:** `backend/src/milestones/milestones.controller.ts`
- **Issue:** `createMilestone()` rejects invalid combination (`category_count` + `category`), but `updateMilestone()` does not apply equivalent validation when `dto.trigger` is supplied.
- **Risk:** Invalid trigger state can be persisted through PATCH even though POST blocks it.
- **Recommendation:** In `updateMilestone()`, when `dto.trigger` is present, apply the same cross-field rules as create (or extract shared validator used by both endpoints).

### B2 — No actionable delete/deactivate trigger in card UI

- **Severity:** Medium
- **File:** `frontend/src/pages/admin/MilestoneManagementPage.tsx`
- **Issue:** `MilestoneCardProps` includes `onDelete`, parent passes `onDelete={handleDeleteRequest}`, but `MilestoneCard` does not destructure/use `onDelete`, and no delete/deactivate button/menu is rendered.
- **Risk:** Admin users cannot initiate deactivation from card UI despite confirm dialog flow existing.
- **Recommendation:** Add a visible delete/deactivate action in `MilestoneCard` (button/menu), stop event propagation, and call `onDelete(milestone)`.

## Non-Blocking Observations (Should Fix)

1. Trigger normalization logic is duplicated in `checkMilestones()` and `getNextMilestone()`; extract a shared `normalizeTrigger()` helper.
2. Dashboard call to `getNextMilestone()` is not wrapped in local try/catch; milestone DB failure can fail whole employee dashboard response.
3. `getNextMilestone()` sorts mixed metrics by raw threshold only (badge_count vs category_count), which is not semantically aligned.
4. Milestone timeline rendering AC is only partially implemented (prepared comments but not active rendering).

## AC Assessment Summary

- **Met:** Most backend ACs (engine rewrite, migration, dashboard integration, badge issuance return path) and most admin UI ACs.
- **Partially met:** Timeline rendering AC (component not actually enabled).
- **Not fully met for approval:** Update-path validation parity and delete action accessibility.

## Validation Evidence

Executed in local workspace:

- `backend`: `npm run type-check` ✅
- `backend`: `npm test -- milestones.service.spec.ts --runInBand` ✅ (36/36)
- `backend`: `npm test -- dashboard.service.spec.ts --runInBand` ✅ (30/30)
- `backend`: `npm test -- badge-issuance-teams.integration.spec.ts --runInBand` ⚠️ suite is skipped by current test configuration
- `backend`: `npm run lint` ✅
- `frontend`: `npm run build` ✅
- `frontend`: `npm run lint` ✅

## Approval Decision

**Request Changes**

Please resolve **B1** and **B2**, then re-run targeted checks for milestones controller + milestone admin page behavior. After these two fixes, this story should be in good shape for approval.
