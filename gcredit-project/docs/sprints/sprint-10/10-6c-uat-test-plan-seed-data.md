# Story 10.6c: UAT Test Plan & Seed Data Preparation

**Status:** complete  
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

1. [x] UAT Test Plan document created with test cases for all 10 Epics
2. [x] Each test case has: ID, Epic, scenario, steps, expected result, pass/fail column
3. [x] Minimum 30 test cases covering all major user journeys
4. [x] Demo Seed Script created to populate database with realistic test data
5. [x] Seed data includes: 4 test users (Admin, Issuer, Manager, Employee), 5+ badge templates, 10+ issued badges, evidence files, revoked badges
6. [x] Token expiry extended to 4h for UAT session (configurable via .env)
7. [x] UAT Known Limitations document prepared
8. [x] All seed data can be reset with a single command

## Tasks / Subtasks

- [x] **Task 1: Create UAT Test Plan** (AC: #1, #2, #3)
  - [x] Epic 1 (Infrastructure): Health check, API availability
  - [x] Epic 2 (Auth): Register, login, logout, password reset, role access
  - [x] Epic 3 (Templates): Create, edit, archive, search badge templates
  - [x] Epic 4 (Issuance): Issue single badge (via new 10.6b UI), claim badge, verify assertion
  - [x] Epic 5 (Wallet): View wallet, timeline, badge detail, evidence, milestones
  - [x] Epic 6 (Verification): Public verification page, baked badge, JSON-LD
  - [x] Epic 7 (Sharing): Email share, Teams notification, sharing analytics
  - [x] Epic 8 (Bulk): CSV download, upload, validate, preview, batch issue
  - [x] Epic 9 (Revocation): Revoke badge, verification status update, audit trail
  - [x] Epic 10 (Production): Dashboard, search, accessibility, admin panel
  - [x] Cross-Epic: Full lifecycle (issue → claim → share → verify → revoke → re-verify)

- [x] **Task 2: Create Demo Seed Script** (AC: #4, #5, #8)
  - [x] Create `backend/prisma/seed-uat.ts`
  - [x] 4 test users with known credentials
  - [x] 5+ badge templates (various categories, skills)
  - [x] 10+ badges in various states (pending, claimed, revoked)
  - [x] Evidence files (use test fixtures)
  - [x] Milestone configurations
  - [x] Add `npm run seed:uat` script to package.json
  - [x] Add `npm run seed:reset` to clear and re-seed

- [x] **Task 3: Configure UAT environment** (AC: #6)
  - [x] Add `JWT_ACCESS_EXPIRES_IN` with UAT comment to .env.example
  - [x] Document how to switch between dev and UAT token expiry

- [x] **Task 4: Known Limitations document** (AC: #7)
  - [x] Document TD-006 (Teams Channel — workaround: email)
  - [x] Document any feature limitations
  - [x] Provide workarounds for each limitation

- [x] **Task 5: UAT Account Reference Card** (AC: #5)
  - [x] Create quick-reference with test credentials (in UAT test plan + seed script output)
  - [x] Include role descriptions and accessible features per role

## Dev Notes

### Test Accounts
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@gcredit.com | password123 | All features |
| Issuer | issuer@gcredit.com | password123 | Badge templates + issuance |
| Manager | manager@gcredit.com | password123 | Badge wallet + revocation |
| Employee | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | Badge wallet only |

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
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
All 5 tasks completed:
- UAT test plan: 35 test cases across all 10 Epics + 2 cross-epic lifecycle tests
- seed-uat.ts: 4 users, 5 templates, 11 badges (7 CLAIMED, 2 PENDING, 1 REVOKED, 1 expired), 2 evidence files, 2 milestone configs, 3 audit logs
- package.json: added `seed:uat` and `seed:reset` npm scripts
- .env.example: added `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` with UAT comments
- Known limitations: 5 items (LIM-001 through LIM-005)
- Seed script verified: runs successfully against database

### File List
- `docs/sprints/sprint-10/uat-test-plan.md` (new)
- `backend/prisma/seed-uat.ts` (new)
- `docs/sprints/sprint-10/uat-known-limitations.md` (new)
- `backend/package.json` (modified — added seed:uat, seed:reset scripts)
- `backend/.env.example` (modified — added JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN)
- `docs/sprints/sprint-10/10-6c-uat-test-plan-seed-data.md` (modified — story completion)
