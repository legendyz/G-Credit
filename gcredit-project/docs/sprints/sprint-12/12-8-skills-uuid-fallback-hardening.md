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
  - [ ] Add "Unknown Skill" fallback styling
- [ ] Task 3: Backend — include skill names in verification response (AC: #4)
  - [ ] `GET /api/verify/:verificationId` should return resolved skill names
  - [ ] Public endpoint — no auth needed, skill names from template join
- [ ] Task 4: Tests (AC: #5)
  - [ ] Test fallback rendering ("Unknown Skill")
  - [ ] Test verification page skill display

## Dev Notes

### Architecture Patterns
- `useSkillNamesMap()` hook pattern (already exists)
- Backend resolution preferred for public pages (no auth → no skill API access)

### Effort: ~2h (audit + targeted fixes)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
