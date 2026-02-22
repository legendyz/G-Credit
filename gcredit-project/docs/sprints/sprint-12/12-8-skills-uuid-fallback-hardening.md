# Story 12.8: Skills UUID Fallback Hardening

Status: done

## Story

As a **Developer**,
I want to harden the skill name resolution across all frontend pages that display skills,
So that no page ever shows raw UUIDs to users, even when the skill lookup fails.

## Context

- Resolves **TD-017** residual (partially fixed in Story 11.24 via `useSkillNamesMap` hook)
- Story 11.24 added `useSkillNamesMap()` hook used by `BadgeDetailModal`
- Other pages may still have fallback gaps: `VerifyBadgePage`, `BadgeInfo` component, `EmbedBadgePage`
- Need to audit all skill display locations and ensure consistent fallback

## Acceptance Criteria

1. [x] All pages displaying skills show skill names (never UUIDs)
2. [x] Fallback: if skill name cannot be resolved, show "Unknown Skill" with muted styling
3. [x] `useSkillNamesMap()` hook is the single source for skill name resolution
4. [x] Verification page (public, no auth) resolves skills via backend-provided names
5. [x] No existing tests break

## Tasks / Subtasks

- [x] Task 1: Audit all skill display locations
  - [x] `BadgeDetailModal/BadgeInfo.tsx` — partial fix, needs muted styling (F3/F4)
  - [x] `VerifyBadgePage.tsx` — already correct (backend resolves skills)
  - [x] `EmbedBadgePage.tsx` — does not exist
  - [x] `IssueBadgePage.tsx` template preview — no skill display
  - [x] `filtersToChips()` — UUID fallback in chips (F2/F5/F6)
- [x] Task 2: Fix remaining gaps (AC: #1, #2, #3)
  - [x] `useSkillNamesMap()` returns "Unknown Skill" for all unresolved IDs (F1)
  - [x] `filtersToChips()` falls back to "Unknown Skill" instead of raw UUID (F2)
  - [x] `BadgeInfo.tsx` renders "Unknown Skill" with `text-muted-foreground italic bg-muted` (F3/F4)
- [x] Task 3: Backend — include skill names in verification response (AC: #4)
  - [x] Already correct — `badge-verification.service.ts` resolves skill names via Prisma join
- [x] Task 4: Tests (AC: #5)
  - [x] `useSkillNamesMap` — 4 tests: resolved names, unknown fallback, loading fallback, undefined IDs
  - [x] `filtersToChips` — 2 tests: empty map fallback, undefined options fallback
  - [x] `BadgeInfo` — 2 tests: string "Unknown Skill" muted styling, object "Unknown Skill" muted styling
  - [x] Full suite: 699 tests pass (66 files)

## Dev Notes

### Architecture Patterns
- `useSkillNamesMap()` hook pattern (already exists)
- Backend resolution preferred for public pages (no auth → no skill API access)
- "Unknown Skill" styling: `text-muted-foreground italic` (Tailwind classes)

### Effort: ~2h (audit + targeted fixes)

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Backend must resolve skill names for public verification endpoint. Approved as-is.
- **UX (Sally):** "Unknown Skill" uses `text-muted-foreground italic` — subtle, honest about data gap
- **Estimate confirmed:** 2h

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)
### Completion Notes
All 5 ACs met. 3 source files changed, 3 test files updated. 8 new tests added. 699/699 frontend tests pass. TSC clean.
### File List
- `frontend/src/hooks/useSkills.ts` — `useSkillNamesMap()` now returns "Unknown Skill" for all unresolved/loading IDs
- `frontend/src/utils/searchFilters.ts` — `filtersToChips()` skill fallback changed from raw UUID to "Unknown Skill"
- `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` — muted italic styling for "Unknown Skill" pills
- `frontend/src/hooks/useSkills.test.tsx` — 4 new `useSkillNamesMap` tests
- `frontend/src/utils/searchFilters.test.ts` — 2 new skill chip fallback tests
- `frontend/src/components/BadgeDetailModal/BadgeInfo.test.tsx` — 2 new muted styling tests
