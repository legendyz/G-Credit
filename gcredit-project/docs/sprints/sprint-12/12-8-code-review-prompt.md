# Code Review Prompt: Story 12.8 — Skills UUID Fallback Hardening

**Story:** 12.8 (~2h estimated)
**Branch:** `sprint-12/management-uis-evidence`
**Dev Commit:** `a2a0199`
**Baseline:** `8452a3a` (dev prompt commit)
**Story Spec:** `sprint-12/12-8-skills-uuid-fallback-hardening.md`

---

## Change Summary

**8 files changed, +169 / -35 lines**

| # | File | Action | Lines |
|---|------|--------|-------|
| 1 | `frontend/src/hooks/useSkills.ts` | Modified — `useSkillNamesMap()` fallback | +17 / -8 |
| 2 | `frontend/src/utils/searchFilters.ts` | Modified — chip label fallback | +1 / -1 |
| 3 | `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` | Modified — muted styling | +6 / -3 |
| 4 | `frontend/src/hooks/useSkills.test.tsx` | Modified — 4 new tests | +75 / -1 |
| 5 | `frontend/src/utils/searchFilters.test.ts` | Modified — 2 new tests | +14 |
| 6 | `frontend/src/components/BadgeDetailModal/BadgeInfo.test.tsx` | Modified — 2 new tests | +24 |
| 7 | `docs/sprints/sprint-12/12-8-skills-uuid-fallback-hardening.md` | Updated — ACs/tasks/dev record | +30 / -23 |
| 8 | `docs/sprints/sprint-status.yaml` | Updated — `12-8: review` | +1 / -1 |

---

## AC Coverage Matrix

| AC | Description | Dev Claim | Files Involved |
|----|-------------|-----------|----------------|
| #1 | All pages show skill names, never UUIDs | ✅ | `useSkills.ts`, `searchFilters.ts` |
| #2 | Fallback "Unknown Skill" with muted styling | ✅ | `BadgeInfo.tsx`, `useSkills.ts` |
| #3 | `useSkillNamesMap()` is single source | ✅ | `useSkills.ts` |
| #4 | Verify page resolves via backend | ✅ (pre-existing) | No change — already correct |
| #5 | No existing tests break | ✅ | 699 FE tests pass |

---

## Review Checklist

### Source File #1: `frontend/src/hooks/useSkills.ts` — `useSkillNamesMap()` rewrite

**Change:** Hook now always returns an entry for every requested skill ID. Unresolved or pre-load IDs map to `"Unknown Skill"`.

Review points:
- [ ] **O1:** When `skills` is `undefined` (loading/error), all IDs map to `"Unknown Skill"` — is this correct during loading state? Could cause a flash of "Unknown Skill" pills before real names appear.
- [ ] **O2:** Uses `skills.find()` in a reduce loop — O(n×m) complexity. With typical skill counts (<100) this is fine, but note the pattern change from `skills.reduce` → `skillIds.reduce`.
- [ ] **O3:** Return type explicitly annotated as `Record<string, string>` — good.

### Source File #2: `frontend/src/utils/searchFilters.ts` — chip label fallback

**Change:** Line 208: `|| id` → `|| 'Unknown Skill'`

Review points:
- [ ] **O4:** Single-line change, straightforward. Verify no other fallback to raw ID exists in this file.

### Source File #3: `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` — muted styling

**Change:** Added `isUnknown` check. When `name === 'Unknown Skill'`, uses `text-muted-foreground italic bg-muted` instead of category color or default blue.

Review points:
- [ ] **O5:** `font-medium` moved to the non-unknown branches — verify it doesn't affect existing styling (was previously on all pills).
- [ ] **O6:** String comparison `name === 'Unknown Skill'` — brittle if the fallback text ever changes. Acceptable for this scope but worth noting.

### Test Files

Review points:
- [ ] **O7:** `useSkillNamesMap` tests (4 new): covers resolved names, unknown fallback, loading state, undefined IDs. Verify the loading test correctly validates pre-load behavior.
- [ ] **O8:** `filtersToChips` tests (2 new): empty map + undefined options. Clean.
- [ ] **O9:** `BadgeInfo` tests (2 new): string "Unknown Skill" + object `{name: 'Unknown Skill', categoryColor: null}`. Both verify muted class presence and blue class absence.

---

## Potential Concerns

| ID | Severity | Description |
|----|----------|-------------|
| O1 | S4-Note | Loading flash — `useSkillNamesMap` returns "Unknown Skill" during initial load, may cause brief visual flash before React Query resolves. Mitigated by 5-min stale time cache. |
| O5 | S4-Note | `font-medium` class moved from all pills to non-unknown branches. Existing pills were always `font-medium` before; now only non-unknown pills get it. This is intentional (unknown = muted = no bold) but verify visually. |
| O6 | S4-Note | Magic string `'Unknown Skill'` used in 3 files (hook, component, tests). Consider extracting to a constant if scope grows. Fine for current usage. |

---

## Verification Commands

```bash
# Frontend tests
cd gcredit-project/frontend && npx vitest run

# Backend tests (no backend changes, but confirm no regression)
cd gcredit-project/backend && npx jest --forceExit

# TypeScript check
cd gcredit-project/frontend && npx tsc --noEmit

# Lint
cd gcredit-project/frontend && npx eslint . --max-warnings=0
```

---

## Reviewer Verdict Template

```
Verdict: [Approved | Approved with Follow-ups | Changes Requested]

Blocking findings: [none | list]
Non-blocking observations: [list]
```
