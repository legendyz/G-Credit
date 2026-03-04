# Story 16.4: Pilot Seed Data + Smoke Test

Status: done

## Story
As a **Product Owner**,
I want **a pilot-ready seed dataset and end-to-end smoke test**,
So that **the system can be demonstrated to the L&D pilot team with realistic data and verified core flows**.

## Acceptance Criteria
1. [x] Pilot seed script creates realistic L&D scenario data
2. [x] Seed data includes: 3 Issuers (L&D trainers), 10 Employees, 1 Admin
3. [x] 5 badge templates across 3 categories (skill, certification, participation)
4. [x] 15+ issued badges in various states (CLAIMED, PENDING, REVOKED, expired)
5. [x] Smoke test script validates core flows: login → issue → wallet → verify
6. [x] Smoke test passes on clean database with seed data

## Tasks / Subtasks
- [x] Task 1: Create pilot seed script `prisma/seed-pilot.ts` (AC: #1-#4)
  - [x] 3 Issuers with distinct template sets (testing ownership isolation)
  - [x] 10 Employees across departments (Engineering, Marketing, Finance)
  - [x] 1 Admin user
  - [x] 5 badge templates with skills attached
  - [x] 16 badges with mixed statuses (10 CLAIMED, 3 PENDING, 1 REVOKED, 1 expired, 1 recent)
  - [x] 3 evidence files (2 FILE + 1 URL)
  - [x] 3 badge shares (2 email + 1 teams)
- [x] Task 2: Update `package.json` with `seed:pilot` command (AC: #1)
- [x] Task 3: Create smoke test script `scripts/pilot-smoke-test.ps1` (AC: #5, #6)
  - [x] Login as Admin, Issuer-A, Employee
  - [x] Issuer-A sees only own templates (ownership isolation)
  - [x] Issue a badge with own template (Issuer-A → Employee)
  - [x] Cross-issuer isolation: Issuer-A blocked from Issuer-B template (403)
  - [x] Check wallet (Employee sees badges)
  - [x] Verify badge (public URL, no auth)
  - [x] Admin sees all templates
- [x] Task 4: Run seed and verify idempotency (AC: #6)

## Dev Notes
### Architecture Patterns Used
- Follows `prisma/seed-uat.ts` patterns: deterministic UUIDs, FK-safe cleanup, bcrypt password, OpenBadges v2 assertion
- UUID prefix `b000` (pilot) vs `a000` (UAT) to avoid collisions
- Smoke test uses `WebSession` for httpOnly cookie auth (Sprint 11)

### Source Tree Components
- `backend/prisma/seed-pilot.ts` — new file (pilot seed data)
- `backend/package.json` — added `seed:pilot` script
- `scripts/pilot-smoke-test.ps1` — new file (8-step smoke test)

### Testing Standards
- Seed script is idempotent (verified: 2 consecutive runs succeeded)
- Smoke test outputs PASS/FAIL per step, returns exit code 1 on any failure

## Code Review Strategy
- 🟢 LOW risk — Self-review (data + script, no production code changes)

## Dev Agent Record
### Agent Model Used
SM direct implementation (no dev agent — test/script only, no prod code)
### Completion Notes
Seed creates 14 users, 3 skill categories, 8 skills, 5 templates (distributed across 3 Issuers for ownership isolation demo), 16 badges, 3 evidence, 3 shares. All badge.issuerId matches template.createdBy. Smoke test validates 8 scenarios including cross-issuer isolation (403).
### File List
- `backend/prisma/seed-pilot.ts` — CREATE
- `backend/package.json` — MODIFY (add `seed:pilot`)
- `scripts/pilot-smoke-test.ps1` — CREATE

## Retrospective Notes
- SM implemented directly instead of using dev agent (no prod code changes needed)
- Seed follows exact same patterns as seed-uat.ts for consistency
