# Code Review Report — Story 12.8: Skills UUID Fallback Hardening

## Scope

- Story: `docs/sprints/sprint-12/12-8-skills-uuid-fallback-hardening.md`
- Dev Prompt: `docs/sprints/sprint-12/12-8-dev-prompt.md`
- Review Prompt: `docs/sprints/sprint-12/12-8-code-review-prompt.md`
- Base commit: `8452a3a`
- Reviewed commit: `a2a0199`
- Re-review commit: `b48e224` (follow-up refactor for prior observations)

## Verdict

**Approved with Follow-ups.**

No blocking defects found. The implementation meets Story 12.8 acceptance criteria and closes the UUID leakage paths in scoped frontend flows.

Re-review confirms prior NB2/NB3 follow-ups are implemented correctly in `b48e224` with no functional regression.

## What Was Verified

### Diff / File Scope

- ✅ Commit scope matches prompt: 8 files changed, `+169 / -35`
- ✅ Changed files align with declared Story 12.8 implementation and test plan

### Source Review

- ✅ `frontend/src/hooks/useSkills.ts`
  - `useSkillNamesMap()` now returns entries for all requested IDs
  - unresolved/loading IDs fallback to `"Unknown Skill"`
  - explicit return type `Record<string, string>` retained
- ✅ `frontend/src/utils/searchFilters.ts`
  - skill chip fallback changed from raw `id` to `"Unknown Skill"`
- ✅ `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx`
  - `"Unknown Skill"` now uses muted italic styling (`text-muted-foreground italic bg-muted`)
- ✅ No conflicting fallback observed in reviewed skill label paths

### Tests / Static Checks

- ✅ `npm test -- src/hooks/useSkills.test.tsx --run` → 7/7 passed
- ✅ `npm test -- src/utils/searchFilters.test.ts --run` → 33/33 passed
- ✅ `npm test -- src/components/BadgeDetailModal/BadgeInfo.test.tsx --run` → 11/11 passed
- ✅ `npx tsc --noEmit` passed
- ✅ `npm run lint` passed

### Re-review Validation (commit `b48e224`)

- ✅ `useSkillNamesMap()` now uses shared constant `UNKNOWN_SKILL_LABEL` (magic string coupling reduced)
- ✅ Skill lookup path optimized from repeated `find()` to `Map`-based lookup (addresses O(n×m) concern)
- ✅ `searchFilters.ts` and `BadgeInfo.tsx` consume the shared fallback constant
- ✅ Targeted regression checks all pass:
  - `src/hooks/useSkills.test.tsx` (7/7)
  - `src/utils/searchFilters.test.ts` (33/33)
  - `src/components/BadgeDetailModal/BadgeInfo.test.tsx` (11/11)
  - `npx tsc --noEmit`, `npm run lint`

## AC Coverage

- ✅ **AC #1**: Skill displays no longer fall back to UUID in reviewed frontend paths
- ✅ **AC #2**: Unresolved skills render `"Unknown Skill"` with muted styling in Badge Detail presentation
- ✅ **AC #3**: `useSkillNamesMap()` remains the central hook for ID→name resolution behavior
- ✅ **AC #4**: Verify page remains backend-resolved for skills (no regression found)
- ✅ **AC #5**: Updated and targeted tests pass; lint/type-check clean

## Non-Blocking Observations

1. **Loading-state UX flash risk (minor):** `useSkillNamesMap()` intentionally returns fallback labels before skills query resolves. This prevents UUID leakage but may briefly show muted unknown chips before names hydrate.
2. **Layering note (minor):** `searchFilters.ts` now imports fallback constant from `useSkills.ts` (hook module). Consider moving shared label constants to a neutral constants module to avoid cross-layer coupling.

## Recommendation

Keep current implementation as-is for Story 12.8 completion. Remaining observations are optional refinements, not blockers.
