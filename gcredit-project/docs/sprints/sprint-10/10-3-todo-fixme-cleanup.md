# Story 10.3: TD-018 — Code TODO/FIXME Cleanup + UX Audit Critical Fixes

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 5h  
**Sprint:** Sprint 10  
**Type:** Technical Debt  
**TD Reference:** TD-018

---

## Story

As a **developer**,  
I want **all 14 TODO/FIXME markers in source code resolved, hardcoded localhost URLs replaced, and dead navigation links fixed**,  
So that **the codebase is clean for v1.0.0 release with no hidden incomplete work or broken user flows**.

## Background

Sprint 9 identified 14 TODO/FIXME markers across backend (6), frontend (5), and test (3) files. These include hardcoded values, unimplemented features, and deferred checks that should be resolved before v1.0.0.

## Acceptance Criteria

1. [ ] 0 TODO/FIXME markers in `src/` code (backend + frontend)
2. [ ] Any intentionally deferred items converted to ADR or tracked TD
3. [ ] All 1087 existing tests still pass (0 regressions)
4. [ ] `grep -r "TODO\|FIXME" src/` returns 0 results
5. [ ] 0 hardcoded `localhost:3000` URLs in frontend source code
6. [ ] 0 dead navigation links — all Quick Action buttons point to valid routes or are disabled
7. [ ] 404 catch-all route added to App.tsx
8. [ ] PR commit message: `refactor: resolve TODO/FIXME markers + fix dead links and localhost URLs`

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

### 🏗️ UX Audit Critical Fixes (from Sally’s Release Audit)

- [ ] **Task 10: Fix hardcoded `localhost:3000` URLs** (AC: #5) 🔴 CRITICAL
  - 8 occurrences bypassing `VITE_API_URL` — will break in staging/production
  - Files to fix:
    - `frontend/src/pages/VerifyBadgePage.tsx`
    - `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx`
    - `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx`
    - `frontend/src/components/BadgeDetailModal/SimilarBadgesSection.tsx`
    - `frontend/src/components/BadgeDetailModal/ReportIssueForm.tsx`
    - `frontend/src/hooks/useWallet.ts`
  - Fix: Replace all `http://localhost:3000` with `API_BASE_URL` from env config (`import.meta.env.VITE_API_URL`)
  - _Source: UX Release Audit — Sally, Critical Issue #3_

- [ ] **Task 11: Fix dead Quick Action links** (AC: #6) 🔴 CRITICAL
  - 9 buttons navigate to non-existent routes → blank page:
    - `/catalog` — EmployeeDashboard.tsx L188
    - `/badges` — EmployeeDashboard.tsx L141
    - `/badges/issue` — IssuerDashboard.tsx L85
    - `/badges/manage` — IssuerDashboard.tsx L93
    - `/team/nominate` — ManagerDashboard.tsx L86
    - `/team/skills` — ManagerDashboard.tsx L94
    - `/admin/templates` — AdminDashboard.tsx L85, L129
    - `/admin/settings` — AdminDashboard.tsx L139
    - `/docs/help/earning-badges` — TimelineView.tsx L176
  - Fix options (per button):
    - Remap to closest existing route (e.g., `/admin/templates` → `/templates`)
    - Or disable button with "Coming Soon" tooltip + `aria-disabled`
    - Or hide buttons for features not yet implemented
  - _Source: UX Release Audit — Sally, Critical Issue #1_

- [ ] **Task 12: Add 404 catch-all route** (AC: #7) 🔴 CRITICAL
  - No `<Route path="*">` in App.tsx → any typo/dead link shows blank white page
  - Fix: Add a `NotFoundPage` component with:
    - "Page Not Found" heading
    - Link back to Dashboard
    - Consistent Layout wrapper
  - _Source: UX Release Audit — Sally, Critical Issue #2_

## Dev Notes

### Prioritization
- Tasks 10, 11, 12 are **CRITICAL** from UX Audit — must be done first
- Tasks 6, 7, 8 are user-facing — HIGH priority within this story
- Tasks 2, 3 are audit/security — MEDIUM priority
- Task 5 converts to ADR — LOW effort

### UX Audit References
- [ux-release-audit-v1.0.0.md](ux-release-audit-v1.0.0.md) — Sally’s full audit report
- Critical Issues #1, #2, #3 mapped to Tasks 11, 12, 10

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
