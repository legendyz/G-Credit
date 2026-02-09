# Story 10.6a: UI Walkthrough & Screenshot Baseline

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 2h  
**Sprint:** Sprint 10  
**Type:** UAT Preparation  
**Dependencies:** Phase 1 & 2 complete  
**Discovered:** Sprint Planning review (2026-02-09)

---

## Story

As a **Product Owner**,  
I want **to see the actual running UI for all pages and roles before UAT begins**,  
So that **I can confirm the design matches requirements and identify any UI issues early**.

## Background

All 10 Epics have been developed across Sprints 0-9 with 976 automated tests. However, the Product Owner has not yet viewed the running UI end-to-end. Before investing 20+ hours in UAT execution, a visual walkthrough is needed to:
1. Confirm the UI matches UX design specifications
2. Establish a screenshot baseline for all pages
3. Identify any obvious design gaps before formal UAT
4. Validate that dead navigation links (fixed in Story 10.3) now work correctly

## Acceptance Criteria

1. [ ] Application started (backend + frontend) with seed data loaded
2. [ ] All 11 routes visited and screenshotted for each applicable role
3. [ ] 4 role-based walkthroughs completed (Admin, Issuer, Manager, Employee)
4. [ ] Screenshot baseline saved to `docs/sprints/sprint-10/screenshots/`
5. [ ] UI issues checklist created comparing actual vs. UX spec
6. [ ] Any P0 UI issues flagged for immediate fix (before UAT)
7. [ ] Sign-off: UI is acceptable for UAT execution

## Tasks / Subtasks

- [ ] **Task 1: Environment Setup** (0.25h)
  - [ ] Start backend: `npm run start:dev`
  - [ ] Start frontend: `npm run dev`
  - [ ] Run existing seed: `npm run seed` (or manual data setup)
  - [ ] Verify health endpoint: GET /api

- [ ] **Task 2: Admin Role Walkthrough** (0.5h)
  - [ ] Login as Admin
  - [ ] Screenshot: Admin Dashboard (`/`)
  - [ ] Screenshot: Badge Management (`/admin/badges`)
  - [ ] Screenshot: User Management (`/admin/users`)
  - [ ] Screenshot: Analytics (`/admin/analytics`)
  - [ ] Screenshot: Bulk Issuance (`/admin/bulk-issuance`)
  - [ ] Test all Quick Action buttons — verify no dead links

- [ ] **Task 3: Issuer Role Walkthrough** (0.25h)
  - [ ] Login as Issuer
  - [ ] Screenshot: Issuer Dashboard
  - [ ] Screenshot: Badge Management (same page, issuer view)
  - [ ] Test "Issue New Badge" button destination

- [ ] **Task 4: Manager Role Walkthrough** (0.25h)
  - [ ] Login as Manager
  - [ ] Screenshot: Manager Dashboard
  - [ ] Screenshot: Badge Wallet (`/wallet`)

- [ ] **Task 5: Employee Role Walkthrough** (0.25h)
  - [ ] Login as Employee
  - [ ] Screenshot: Employee Dashboard
  - [ ] Screenshot: Badge Wallet (timeline + grid views)
  - [ ] Screenshot: Badge Detail Modal (if badges exist)
  - [ ] Screenshot: Empty State (if no badges)

- [ ] **Task 6: Public Pages** (0.25h)
  - [ ] Screenshot: Login Page (`/login`)
  - [ ] Screenshot: Verification Page (`/verify/:id`)
  - [ ] Screenshot: 404 Page (any invalid route)

- [ ] **Task 7: UI Issues Checklist** (0.25h)
  - [ ] Compare each screenshot against UX design specification
  - [ ] Note any layout/color/typography discrepancies
  - [ ] Note any missing features or broken interactions
  - [ ] Classify issues as P0/P1/P2
  - [ ] Decision: proceed to UAT or fix P0 issues first

## Output Files

- `docs/sprints/sprint-10/screenshots/` (directory with PNG screenshots)
- UI issues noted in completion notes below

## Dev Notes

### Routes to Visit
| Route | Page | Roles |
|-------|------|-------|
| `/login` | Login Page | Public |
| `/` | Dashboard (role-based) | All 4 |
| `/wallet` | Badge Wallet | Employee, Manager |
| `/admin/badges` | Badge Management | Admin, Issuer |
| `/admin/bulk-issuance` | Bulk Issuance | Admin, Issuer |
| `/admin/users` | User Management | Admin |
| `/admin/analytics` | Analytics | Admin, Issuer |
| `/verify/:id` | Public Verification | Public |
| `/badges/:id/embed` | Badge Embed | Public |
| `/*` | 404 Page | Public |

### UX Reference Documents
- `docs/planning/ux-design-specification.md` (3,321 lines — master UX spec)
- `docs/sprints/sprint-7/login-ux-spec.md` (Login page spec)
- `docs/sprints/sprint-4/ux-badge-wallet-timeline-view.md` (Wallet spec)
- `docs/sprints/sprint-10/ux-release-audit-v1.0.0.md` (UX audit, 4.1/5)

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
