# Story 16.4: Pilot Seed Data + Smoke Test

Status: ready-for-dev

## Story
As a **Product Owner**,
I want **a pilot-ready seed dataset and end-to-end smoke test**,
So that **the system can be demonstrated to the L&D pilot team with realistic data and verified core flows**.

## Acceptance Criteria
1. [ ] Pilot seed script creates realistic L&D scenario data
2. [ ] Seed data includes: 3 Issuers (L&D trainers), 10 Employees, 1 Admin
3. [ ] 5 badge templates across 3 categories (skill, certification, participation)
4. [ ] 15+ issued badges in various states (ACTIVE, PENDING, REVOKED)
5. [ ] Smoke test script validates core flows: login → issue → wallet → verify → share
6. [ ] Smoke test passes on clean database with seed data

## Tasks / Subtasks
- [ ] Task 1: Create pilot seed script `prisma/seed-pilot.ts` (AC: #1-#4)
  - [ ] 3 Issuers with distinct template sets (testing ownership isolation)
  - [ ] 10 Employees across departments
  - [ ] 1 Admin user
  - [ ] 5 badge templates with skills attached
  - [ ] 15+ badges with mixed statuses
  - [ ] Evidence attachments on some badges
- [ ] Task 2: Update `package.json` with `seed:pilot` command (AC: #1)
- [ ] Task 3: Create smoke test script `test-scripts/pilot-smoke-test.ps1` (AC: #5, #6)
  - [ ] Login as each role (Admin, Issuer, Employee)
  - [ ] Issue a badge (Issuer → Employee)
  - [ ] Check wallet (Employee sees badge)
  - [ ] Verify badge (public URL)
  - [ ] Share badge (generate share link)
- [ ] Task 4: Run smoke test and document results (AC: #6)

## Dev Notes
### Architecture Patterns Used
- Existing `prisma/seed.ts` as reference for seed structure
- Smoke test uses `curl` or PowerShell `Invoke-RestMethod`

### Source Tree Components
- `backend/prisma/seed-pilot.ts` — new file
- `backend/package.json` — new script entry
- `scripts/pilot-smoke-test.ps1` — new file

### Testing Standards
- Seed script is idempotent (can run multiple times)
- Smoke test outputs PASS/FAIL per step

## Code Review Strategy
- 🟢 LOW risk — Self-review (data + script, no production code)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
