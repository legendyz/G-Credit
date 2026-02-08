# Story 10.3: TD-018 — Code TODO/FIXME Cleanup

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 3h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** TD-018

---

## Story

As a **developer**,  
I want **all 14 TODO/FIXME markers in source code resolved or converted to tracked tech debt**,  
So that **the codebase is clean for v1.0.0 release with no hidden incomplete work**.

## Background

Sprint 9 identified 14 TODO/FIXME markers across backend (6), frontend (5), and test (3) files. These include hardcoded values, unimplemented features, and deferred checks that should be resolved before v1.0.0.

## Acceptance Criteria

1. [ ] 0 TODO/FIXME markers in `src/` code (backend + frontend)
2. [ ] Any intentionally deferred items converted to ADR or tracked TD
3. [ ] All 1087 existing tests still pass (0 regressions)
4. [ ] `grep -r "TODO\|FIXME" src/` returns 0 results
5. [ ] PR commit message: `refactor: resolve 14 TODO/FIXME markers (TD-018)`

## Tasks / Subtasks

### Backend TODOs (6 items)

- [ ] **Task 1: dashboard.service.ts L411** (AC: #1)
  - `systemHealth` hardcoded as 'healthy'
  - Fix: Implement actual health check (DB + external services)

- [ ] **Task 2: auth.service.ts L56** (AC: #1)
  - Audit logging not implemented
  - Fix: Add audit log entry for login/logout/password change events

- [ ] **Task 3: auth.service.ts L86** (AC: #1)
  - Failed attempt rate limiting logging
  - Fix: Log failed attempts with IP + email (for monitoring)

- [ ] **Task 4: skills.service.ts L152** (AC: #1)
  - Check skill references before delete
  - Fix: Check if skill is used by any BadgeTemplate before deletion

- [ ] **Task 5: teams-sharing.controller.ts L91** (AC: #1, #2)
  - Teams Channel Sharing not implemented (TD-006 blocker)
  - Fix: Convert to ADR — "Deferred pending tenant admin approval"

### Frontend TODOs (5 items)

- [ ] **Task 6: BadgeDetailModal.tsx L286** (AC: #1)
  - Badge owner check hardcoded `isOwner={true}`
  - Fix: Compare `badge.recipientId` with `currentUser.id`

- [ ] **Task 7: TimelineView.tsx L153-155** (AC: #1)
  - claimed/pending/revoked badge counts hardcoded to 0
  - Fix: Compute from actual badge data in the wallet

- [ ] **Task 8: AdminAnalyticsPage.tsx L46** (AC: #1)
  - Replace mock data with actual admin analytics endpoint
  - Fix: Connect to `/api/analytics/admin` endpoint (built in Sprint 8)

### Test TODOs (3 items)

- [ ] **Task 9: Test file TODOs** (AC: #1)
  - Scan test files for TODO/FIXME markers
  - Fix: implement or remove with documented reason

## Dev Notes

### Prioritization
- Tasks 6, 7, 8 are user-facing — HIGH priority within this story
- Tasks 2, 3 are audit/security — MEDIUM priority
- Task 5 converts to ADR — LOW effort

### References
- Sprint 9 Retrospective: TD-018 inventory
- TD-006: Teams Channel Permissions (external blocker)

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
