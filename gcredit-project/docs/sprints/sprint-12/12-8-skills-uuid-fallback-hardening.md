# Story 12.8: Skills UUID Fallback Hardening

Status: backlog

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

1. [ ] All pages displaying skills show skill names (never UUIDs)
2. [ ] Fallback: if skill name cannot be resolved, show "Unknown Skill" with muted styling
3. [ ] `useSkillNamesMap()` hook is the single source for skill name resolution
4. [ ] Verification page (public, no auth) resolves skills via backend-provided names
5. [ ] No existing tests break

## Tasks / Subtasks

- [ ] Task 1: Audit all skill display locations
  - [ ] `BadgeDetailModal/BadgeInfo.tsx` — check status
  - [ ] `VerifyBadgePage.tsx` — check status
  - [ ] `EmbedBadgePage.tsx` — check status
  - [ ] `IssueBadgePage.tsx` template preview — check status
  - [ ] Any other skill pill/tag rendering
- [ ] Task 2: Fix remaining gaps (AC: #1, #2, #3)
  - [ ] Apply `useSkillNamesMap()` where missing
  - [ ] Add "Unknown Skill" fallback with `text-muted-foreground italic` styling — subtle but honest
- [ ] Task 3: Backend — include skill names in verification response (AC: #4)
  - [ ] `GET /api/verify/:verificationId` should return resolved skill names
  - [ ] Public endpoint — no auth needed, skill names from template join
  - [ ] This is the critical fix: public pages can't call skill API (no auth)
- [ ] Task 4: Tests (AC: #5)
  - [ ] Test fallback rendering ("Unknown Skill" with muted italic styling)
  - [ ] Test verification page skill display

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
### Completion Notes
### File List
