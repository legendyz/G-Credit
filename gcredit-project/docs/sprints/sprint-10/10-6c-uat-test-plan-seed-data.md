# Story 10.6c: UAT Test Plan & Seed Data Preparation

**Status:** backlog  
**Priority:** 🔴 HIGH  
**Estimate:** 6h  
**Sprint:** Sprint 10  
**Type:** UAT Preparation  
**Split From:** Original Story 10.6 (split into 10.6a + 10.6b + 10.6c on 2026-02-09)

---

## Story

As a **Scrum Master**,  
I want **a comprehensive UAT test plan covering all 10 completed Epics with realistic seed data**,  
So that **we can systematically validate every feature before v1.0.0 release**.

## Background

G-Credit has completed 10 Epics across 9 Sprints with 976 tests at the unit/integration/E2E level. Before tagging v1.0.0, we need manual UAT to validate end-to-end user journeys that automated tests may not fully cover — particularly UX flow, cross-module interactions, and edge cases.

**Note:** Original 8h Story 10.6 was split into three stories:
- **10.6a** (2h): UI Walkthrough & Screenshot Baseline — visual review before UAT
- **10.6b** (6h): Single Badge Issuance UI — add missing issuance form
- **10.6c** (6h): This story — UAT test plan + seed data + known limitations

## Acceptance Criteria

1. [ ] UAT Test Plan document created with test cases for all 10 Epics
2. [ ] Each test case has: ID, Epic, scenario, steps, expected result, pass/fail column
3. [ ] Minimum 30 test cases covering all major user journeys
4. [ ] Demo Seed Script created to populate database with realistic test data
5. [ ] Seed data includes: 4 test users (Admin, Issuer, Manager, Employee), 5+ badge templates, 10+ issued badges, evidence files, revoked badges
6. [ ] Token expiry extended to 4h for UAT session (configurable via .env)
7. [ ] UAT Known Limitations document prepared
8. [ ] All seed data can be reset with a single command

## Tasks / Subtasks

- [ ] **Task 1: Create UAT Test Plan** (AC: #1, #2, #3)
  - [ ] Epic 1 (Infrastructure): Health check, API availability
  - [ ] Epic 2 (Auth): Register, login, logout, password reset, role access
  - [ ] Epic 3 (Templates): Create, edit, archive, search badge templates
  - [ ] Epic 4 (Issuance): Issue single badge (via new 10.6b UI), claim badge, verify assertion
  - [ ] Epic 5 (Wallet): View wallet, timeline, badge detail, evidence, milestones
  - [ ] Epic 6 (Verification): Public verification page, baked badge, JSON-LD
  - [ ] Epic 7 (Sharing): Email share, Teams notification, sharing analytics
  - [ ] Epic 8 (Bulk): CSV download, upload, validate, preview, batch issue
  - [ ] Epic 9 (Revocation): Revoke badge, verification status update, audit trail
  - [ ] Epic 10 (Production): Dashboard, search, accessibility, admin panel
  - [ ] Cross-Epic: Full lifecycle (issue → claim → share → verify → revoke → re-verify)

- [ ] **Task 2: Create Demo Seed Script** (AC: #4, #5, #8)
  - [ ] Create `backend/prisma/seed-uat.ts`
  - [ ] 4 test users with known credentials
  - [ ] 5+ badge templates (various categories, skills)
  - [ ] 10+ badges in various states (pending, claimed, revoked)
  - [ ] Evidence files (use test fixtures)
  - [ ] Milestone configurations
  - [ ] Add `npm run seed:uat` script to package.json
  - [ ] Add `npm run seed:reset` to clear and re-seed

- [ ] **Task 3: Configure UAT environment** (AC: #6)
  - [ ] Add `JWT_ACCESS_TOKEN_EXPIRY_UAT=4h` to .env.example
  - [ ] Document how to switch between dev and UAT token expiry

- [ ] **Task 4: Known Limitations document** (AC: #7)
  - [ ] Document TD-006 (Teams Channel — workaround: email)
  - [ ] Document any feature limitations
  - [ ] Provide workarounds for each limitation

- [ ] **Task 5: UAT Account Reference Card** (AC: #5)
  - [ ] Create quick-reference with test credentials
  - [ ] Include role descriptions and accessible features per role

## Dev Notes

### Test Accounts
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@test.gcredit.com | Test@2026! | All features |
| Issuer | issuer@test.gcredit.com | Test@2026! | Badge templates + issuance |
| Manager | manager@test.gcredit.com | Test@2026! | Badge wallet + revocation |
| Employee | employee@test.gcredit.com | Test@2026! | Badge wallet only |

### Output Files
- `docs/sprints/sprint-10/uat-test-plan.md`
- `backend/prisma/seed-uat.ts`
- `docs/sprints/sprint-10/uat-known-limitations.md`

### References
- Sprint 7 UAT: 15/15 scenarios passed (100%)
- Sprint 7 Pre-UAT Review Pattern (Lesson 28)

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
