# Story 11.20: ClaimPage Hardcoded UUID Fix

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 2h  
**Source:** Code Quality Audit / Bug  

## Story

As a developer,  
I want the ClaimPage to use dynamic badge template lookup instead of a hardcoded UUID,  
So that badge claiming works correctly across environments and for all templates.

## Acceptance Criteria

1. [ ] Hardcoded UUID removed from ClaimPage component
2. [ ] Badge template resolved dynamically from URL params or API
3. [ ] Error handling for invalid/missing badge claim links
4. [ ] Works correctly in all environments (dev, staging, production)
5. [ ] Tests updated

## Tasks / Subtasks

- [ ] **Task 1: Identify hardcoded UUID** (AC: #1)
  - [ ] `grep -n "UUID\|hardcoded\|template.*id" frontend/src/pages/ClaimPage.tsx`
  - [ ] Trace how the UUID is used

- [ ] **Task 2: Implement dynamic resolution** (AC: #2)
  - [ ] Extract badge/claim ID from route params (`useParams()`)
  - [ ] Query API for badge template by claim token/ID
  - [ ] Remove hardcoded constant

- [ ] **Task 3: Error handling** (AC: #3)
  - [ ] Invalid claim token → show "Invalid claim link" message
  - [ ] Expired claim → show "This claim has expired" message
  - [ ] Already claimed → show "Already claimed" message

- [ ] **Task 4: Verify** (AC: #4, #5)
  - [ ] Test with different badge templates
  - [ ] Update component tests
  - [ ] Run `npm test` + `npm run build`

## Dev Notes

### Source Tree Components
- **Frontend:** `frontend/src/pages/ClaimPage.tsx`
- **Related API:** Badge claim endpoint

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
