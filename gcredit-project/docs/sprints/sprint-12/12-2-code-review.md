# Code Review — Story 12.2: Skill Management UI

## Re-Review (Post-Fix Commit `9d7eaa6`)

Date: 2026-02-20  
Reviewer: Dev Agent (Re-validation)

### Re-review Scope
- Fix commit: `9d7eaa6` (`fix(12.2): address code review findings - 5 fixes`)
- Re-validated files: `SkillManagementPage`, `useSkills`, `useSkillMutations`, `skills.service`, `skill.dto`, `SkillsFilter`, related tests/docs
- Re-run tests:
  - Frontend targeted: `21/21 PASS`
  - Backend type-check: `tsc --noEmit PASS`

### Previously Reported Findings — Status

1. **AC #2 Badge Count column missing** — **Closed**  
  `SkillManagementPage` now includes `Badges` column and row values from `skill.badgeCount`.

2. **AC #8 no template list in delete block message** — **Closed**  
  `skills.service.remove()` now returns blocking message with template names list.

3. **Tab-to-submit not implemented** — **Closed**  
  Inline add now supports submit on `Tab` (last field) and `Enter`, with `Escape` cancel.

4. **Edit dialog missing category selector** — **Closed**  
  Edit dialog now includes category selector (`edit-category`), and backend supports `categoryId` update in DTO/service.

5. **Touch discoverability of row actions** — **Closed**  
  Action buttons are always visible on small screens; hover-only behavior kept for `sm+`.

### Updated Decision

**Result: APPROVED**  
The previously identified 5 issues are addressed and verified. Story 12.2 can remain in `done` state.

Date: 2026-02-19  
Reviewer: Dev Agent (Adversarial Review)

## Scope

- Story: `docs/sprints/sprint-12/12-2-skill-management-ui.md`
- Dev prompt: `docs/sprints/sprint-12/12-2-dev-prompt.md`
- Commit reviewed: `d1e7959` (base `8af801c`)
- Files reviewed: all implementation files in commit scope (BE + FE + tests)

## Validation Executed

- Frontend targeted tests: **61/61 PASS**
  - `SkillManagementPage.test.tsx`
  - `useSkills.test.tsx`
  - `useSkillMutations.test.tsx`
  - `categoryColors.test.ts`
  - `BadgeInfo.test.tsx`
  - `BadgeTemplateFormPage.test.tsx`
- Backend targeted tests: **24/24 PASS**
  - `skill-categories.service.spec.ts`
  - `badge-verification.service.spec.ts`

## Executive Summary

Implementation quality is solid and the major architecture direction is correct (shared components reuse, color propagation, hook bug fix, route/nav wiring).  
However, I found **5 actionable issues**: **2 High**, **2 Medium**, **1 Low**.

Current recommendation: **CHANGES REQUIRED** before marking Story 12.2 as fully complete against its own AC/task wording.

---

## Findings

### High

1. **AC #2 gap: Badge Count column is missing in skill table**
- Story AC requires columns: Name, Description, Category, Level, **Badge Count**, Actions.
- Current table renders Name/Description/Category/Level/Actions only.
- Evidence:
  - Story requirement: `12-2-skill-management-ui.md` line 22
  - Task claim: `12-2-skill-management-ui.md` line 43
  - Table headers in implementation: `SkillManagementPage.tsx` around lines 331–347
- Impact: Admin cannot proactively assess usage before edit/delete.

2. **AC #8 gap: delete block message does not show which templates reference the skill**
- Story AC asks for message showing referencing templates.
- Backend currently returns only a count (`referenced by N badge template(s)`), not template names/list.
- Evidence:
  - Story requirement: `12-2-skill-management-ui.md` line 28
  - Backend message: `backend/src/skills/skills.service.ts` line 162
  - Frontend only surfaces backend error toast (no template list UI): `useSkillMutations.ts` onError handlers
- Impact: AC intent is only partially met.

### Medium

3. **Task deviation: inline add uses Enter-to-submit, not Tab-to-submit**
- Story/task explicitly marks “Tab-to-submit, Escape-to-cancel” as done.
- Implementation handles `Escape` and `Enter`; no Tab submit logic on last field.
- Evidence:
  - Story task: `12-2-skill-management-ui.md` line 63
  - Keyboard handler: `SkillManagementPage.tsx` lines 138–142
- Impact: documented behavior mismatch.

4. **Task deviation: edit dialog lacks category selector**
- Dev prompt Task 6 asks edit dialog to include category field (flat category select).
- Current dialog includes only name/description/level.
- Evidence:
  - Edit dialog section: `SkillManagementPage.tsx` lines 522–562
  - No `edit-category` selector in file
- Impact: cannot reassign skill category in edit flow.

### Low

5. **Row action discoverability on touch devices**
- Edit/Delete actions are hover-reveal only (`opacity-0 group-hover:opacity-100`).
- On touch/mobile this is not discoverable.
- Evidence:
  - `SkillManagementPage.tsx` line 442
- Impact: UX/accessibility debt (non-blocking).

---

## Confirmed Good Implementations

- `useSkills` bug fix (`category` → `categoryName`) implemented correctly.
- `apiFetchJson` path is safe: `Content-Type: application/json` is automatically set by `apiFetch` for non-FormData payloads.
- Backend and frontend color palettes are aligned (same 10 colors).
- Route `/admin/skills` is lazy-loaded and protected with `requiredRoles={['ADMIN']}`.
- Navigation links added in desktop and mobile nav.

---

## AC Coverage Snapshot

- Fully met: AC 1, 3, 4, 5, 6, 7, 9, 10, 11, 12
- Partially met / not met as written: **AC 2, AC 8**

---

## Recommended Fix Order

1. Add **Badge Count** column (AC #2) with data source (`_count` from backend or computed lookup).
2. Improve delete block output to include **template names/list** (AC #8).
3. Align inline add keyboard behavior with documented Tab-submit OR update story/task wording.
4. Decide whether category reassignment is required in edit dialog; implement or explicitly defer in story.
5. Make action buttons always visible at mobile breakpoints.

## Final Verdict

**Status: CHANGES REQUIRED** (to satisfy story ACs exactly as written).