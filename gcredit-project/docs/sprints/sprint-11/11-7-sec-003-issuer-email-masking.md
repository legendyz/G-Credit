# Story 11.7: SEC-003 — Issuer Email Masking on Public Verification Pages

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 30min  
**Source:** Security Audit MEDIUM  

## Story

As a privacy-conscious issuer,  
I want my email address masked on public badge verification pages,  
So that my full email is not exposed to external viewers.

## Acceptance Criteria

1. [ ] Public verification endpoint returns masked issuer email (e.g., `j***@company.com`)
2. [ ] Existing `maskEmail()` utility is reused
3. [ ] Internal/authenticated views still show full email (if applicable)
4. [ ] Unit test for email masking in verification context
5. [ ] All existing tests pass

## Tasks / Subtasks

- [ ] **Task 1: Apply masking** (AC: #1, #2)
  - [ ] In verification service/controller response: apply `maskEmail()` to issuer email
  - [ ] Locate existing `maskEmail()` function and import it
  - [ ] Apply before returning verification response to public endpoint

- [ ] **Task 2: Verify internal views** (AC: #3)
  - [ ] Ensure admin/issuer views of badge details still show full email
  - [ ] Masking only applies to public verification page response

- [ ] **Task 3: Test** (AC: #4, #5)
  - [ ] Unit test: verification response contains masked email
  - [ ] Run full test suite

## Dev Notes

### Source Tree Components
- **Verification service:** `backend/src/badge-verification/badge-verification.service.ts`
- **maskEmail utility:** Search for existing `maskEmail` function in codebase
- **Verification page:** `frontend/src/pages/VerifyBadgePage.tsx` (341 lines)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
