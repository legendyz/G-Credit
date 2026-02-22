# Story 12.9: Sprint 12 UAT — Management UIs + Evidence Unification

Status: backlog

## Story

As a **Product Owner / Tester**,
I want to validate all Sprint 12 features through structured user acceptance testing,
So that I can confirm the new admin management UIs and unified evidence system work correctly before release.

## Context

- Sprint 12 delivers 4 new admin pages (Skill Category, Skill, User Enhancement, Milestone) + evidence unification
- Previous UAT: Sprint 10 v1.0.0 (35 test cases, 153 PASS — see `sprint-10/uat-test-plan.md`)
- This UAT focuses on **new Sprint 12 features** + regression of affected existing features
- UAT should be executed after all Stories 12.1–12.8 are complete
- UAT test plan document will be created as a deliverable of this story

## Acceptance Criteria

1. [ ] UAT test plan document created (`sprint-12/uat-test-plan.md`)
2. [ ] Seed data updated to include new management entities (categories, skills, milestones)
3. [ ] All Sprint 12 UAT test cases executed
4. [ ] All CRITICAL/HIGH test cases PASS
5. [ ] Regression test cases PASS (existing features not broken)
6. [ ] Bugs found during UAT documented and fixed (or deferred with justification)
7. [ ] UAT sign-off recorded in test plan

## UAT Scope

### New Feature Test Cases (~25 cases)

**Skill Category Management (Stories 12.1):**
- UAT-S12-001: Admin views skill category tree (3 levels)
- UAT-S12-002: Admin creates top-level category
- UAT-S12-003: Admin creates subcategory under existing category
- UAT-S12-004: Admin edits category name/description
- UAT-S12-005: Admin drag-and-drop reorders categories (same level)
- UAT-S12-006: Admin delete blocked for category with skills
- UAT-S12-007: System-defined category shows lock icon, no delete

**Skill Management (Story 12.2):**
- UAT-S12-008: Admin views skills filtered by category
- UAT-S12-009: Admin creates skill with inline add (tab-to-submit)
- UAT-S12-010: Admin edits/deletes skill (delete blocked if badge usage)
- UAT-S12-011: Skill tags show category color
- UAT-S12-011b: Badge Template form groups skills by category (AC #11)
- UAT-S12-011c: Badge detail + verify page show category-colored skill tags (AC #12)

**User Management Enhancement (Story 12.3 — Dual-Mode Provisioning):**
- UAT-S12-012: Admin views user table with source badges (M365 blue / Local gray), role badges, status, badge count
- UAT-S12-012b: Admin searches users by name/email (debounced); filters by role, status (Active/Locked/Inactive), and **source (M365/Local/All)**; changes page size (10/25/50/100)
- UAT-S12-013: Admin edits **local** user role via confirmation dialog; verify role edit is **disabled/hidden for M365 users** (backend returns 400)
- UAT-S12-013b: Context-aware row actions — M365 user row shows only view + lock; Local user row shows edit + view + lock + delete
- UAT-S12-014: Admin lock/unlock any user; M365 lock dialog shows notice: "This will prevent sign-in to G-Credit only. To disable their Microsoft 365 account, contact your IT administrator."
- UAT-S12-015: Admin opens user detail slide-over (Sheet); M365 user panel shows "Identity managed by Microsoft 365. Role assigned via Security Group." + last synced timestamp
- UAT-S12-015b: Admin creates a local user via "Add User" dialog (email, firstName, lastName, department, role); duplicate email returns 409; ADMIN role excluded from creation
- UAT-S12-015c: Admin deletes a local user; if user is a manager, confirmation shows subordinate count warning; delete is **blocked for M365 users**
- UAT-S12-015d: M365 Sync panel: "Sync Users" (full sync) and "Sync Roles" (groups-only sync) buttons; sync history table shows sync type (FULL / GROUPS_ONLY)

**Milestone Admin (Story 12.4):**
- UAT-S12-016: Admin views milestone card grid (Global + Category sections)
- UAT-S12-017: Admin creates milestone with unified form (metric + scope + threshold model): badge_count × global, badge_count × category, category_count × global
- UAT-S12-018: Admin activates/deactivates milestone toggle; metric/scope locked in edit mode
- UAT-S12-018b: Dashboard shows real milestone progress (not hardcoded); CelebrationModal fires on milestone achievement
- UAT-S12-018c: MilestoneTimelineCard renders in wallet TimelineView

**Evidence Unification (Stories 12.5–12.6):**
- UAT-S12-019: Issuer uploads file evidence during badge issuance
- UAT-S12-020: Issuer adds URL evidence during badge issuance
- UAT-S12-021: Evidence displays consistently across Badge Management, Wallet, Verify pages
- UAT-S12-022: Existing badges with old evidence still display correctly (migration)

**Quick Fixes (Stories 12.7–12.8):**
- UAT-S12-023: Activity feed shows human-readable descriptions (not JSON/UUID)
- UAT-S12-024: No UUID displayed for skill names anywhere in the UI

### Regression Test Cases (~8 cases)

- UAT-S12-R01: Existing badge issuance flow still works (single + bulk)
- UAT-S12-R02: Badge claim/verify/revoke lifecycle unaffected
- UAT-S12-R03: Dashboard analytics still display correctly — **verify manager-based team scoping** (migrated from department-based in 12.3a)
- UAT-S12-R04: Employee wallet view still works
- UAT-S12-R05: Email sharing still functional
- UAT-S12-R06: RBAC enforcement unchanged
- UAT-S12-R07: Manager badge-issuance scoping uses `managerId` (not department) — manager sees only direct reports
- UAT-S12-R08: API responses for `/api/admin/users` exclude `azureId`, return computed `source` field only

### Test Accounts

| Role | Email | Password | Sprint 12 Features |
|------|-------|----------|-------------------|
| Admin | admin@gcredit.com | password123 | All new admin pages, user management |
| Issuer | issuer@gcredit.com | password123 | Evidence upload during issuance |
| Manager | manager@gcredit.com | password123 | Regression: revocation |
| Employee | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | Regression: wallet, evidence display |

## Tasks / Subtasks

- [ ] Task 0: Pre-UAT Code Hygiene Check (2h) — **Execute before UAT begins**
  - [ ] **Stale `evidenceUrl` references:** `grep -rn "evidenceUrl" backend/src/ frontend/src/` — verify 12.5+12.6 cleaned up all consumers; frontend should use unified `evidence[]`
  - [ ] **Legacy `bulkIssueBadges()` in badge-issuance.service.ts:** confirm no active controller route calls it (replaced by `BulkIssuanceService`); if dead code → remove or mark with TODO for Sprint 13
  - [ ] **Dead imports / unused variables:** `npx tsc --noEmit` (BE + FE) — zero errors; `npx eslint src/ --max-warnings=0` (BE) — zero warnings
  - [ ] **Cross-story API consistency:** verify 12.5 `EvidenceItem` interface matches what 12.6 frontend consumes; check no duplicated type definitions
  - [ ] **Orphaned test mocks:** grep for test files still referencing removed fields (e.g., `evidenceUrl` in bulk issuance specs)
  - [ ] **Result:** clean → proceed to UAT; findings → fix inline or record as D-5+ in Sprint 13 deferred items
- [ ] Task 1: Create UAT test plan document (2h)
  - [ ] Define detailed test steps for each UAT case
  - [ ] Prepare pre-conditions and expected results
  - [ ] Document environment setup steps
- [ ] Task 2: Prepare seed data for Sprint 12 features (1h)
  - [ ] Add sample skill categories (3-level tree, include system-defined)
  - [ ] Add sample skills with category assignments
  - [ ] Add sample milestones (multiple types)
  - [ ] Ensure evidence migration data is present
- [ ] Task 3: Execute UAT test cases (2h)
  - [ ] New feature tests: ~31 cases
  - [ ] Regression tests: ~6 cases
  - [ ] Record PASS/FAIL for each
- [ ] Task 4: Bug triage and fix (1h buffer)
  - [ ] Document bugs found
  - [ ] Fix CRITICAL/HIGH bugs
  - [ ] Defer LOW bugs to Sprint 13 with justification
- [ ] Task 5: Sign-off and documentation (0.5h)
  - [ ] Update UAT test plan with results
  - [ ] Record sign-off

## Dev Notes

- Reference Sprint 10 UAT structure: `sprint-10/uat-test-plan.md`
- Playwright scripts in `_bmad-output/playwright-sessions/` can be updated for new pages
- Keep UAT lightweight — focus on happy paths + critical error paths
- Evidence migration regression is HIGH priority (data integrity)

---

✅ Phase 2 Review Complete (2026-02-19) — Added during final planning audit

**Estimate:** 7h (was 5h; +2h for Pre-UAT Code Hygiene Check — PO decision 2026-02-22)  
**Priority:** 🟡 Medium  
**Dependencies:** All Stories 12.1–12.8 must be complete before UAT execution
