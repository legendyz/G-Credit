# Story 11.18: Verification Page — Skill UUID → Name Resolution

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 1.5h  
**Source:** UX Bug / Polish  

## Story

As a badge verifier,  
I want to see human-readable skill names instead of UUIDs on the verification page,  
So that verification results are meaningful and professional.

## Acceptance Criteria

1. [ ] Verification page displays skill names instead of skill UUIDs
2. [ ] Backend verification endpoint returns resolved skill names
3. [ ] Graceful fallback: if skill lookup fails, show UUID with "(unknown skill)" label
4. [ ] No performance regression on verification page load
5. [ ] Tests updated

## Tasks / Subtasks

- [ ] **Task 1: Backend — resolve skill names** (AC: #2)
  - [ ] In verification response, join skills table to resolve UUID → name
  - [ ] Include in DTO: `{ id: uuid, name: string }` for each skill
  - [ ] Handle missing skills gracefully (AC: #3)

- [ ] **Task 2: Frontend — display names** (AC: #1)
  - [ ] Update `VerifyBadgePage.tsx` (341 lines) to render `skill.name` 
  - [ ] Remove UUID display
  - [ ] Show "(unknown skill)" fallback for unresolved skills

- [ ] **Task 3: Tests** (AC: #5)
  - [ ] Update verification service tests
  - [ ] Update frontend component tests

## Dev Notes

### Source Tree Components
- **Frontend:** `frontend/src/pages/VerifyBadgePage.tsx` (341 lines)
- **Backend:** Verification endpoint in `issued-badges` or `verification` module
- **DB:** Skills relation on badge template or issued badge

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
