# Story 14.6: M365 Sync + User Management Cleanup

**Status:** done  
**Priority:** HIGH  
**Estimate:** 2h  
**Wave:** 2 — Role Model Refactor (Backend)  
**Source:** ADR-017 §4.6-4.7  
**Depends On:** 14.2  
**Absorbed By:** Story 14.2 (commits `7fe5ee0`, `25c0ae3`)

---

## Story

**As a** system,  
**I want** M365 sync to stop assigning MANAGER role and user management to stop auto-downgrading MANAGER,  
**So that** role derivation only sets permission-role values.

## Acceptance Criteria

1. [x] `m365-sync.service.ts` `deriveRole()`: Priority 3 now returns `EMPLOYEE` instead of `MANAGER` (ADR-017)
2. [x] Direct reports still synced from Graph API — `managerId` relation maintained (untouched)
3. [x] User management service: auto-upgrade logic removed (EMPLOYEE→MANAGER on subordinate assignment)
4. [x] User management service: block on MANAGER role change removed (role changes independent of directReports)
5. [x] M365 sync tests updated — no expectations for MANAGER role assignment (`m365-sync.service.spec.ts`)
6. [x] User management tests updated — auto-downgrade code paths removed
7. [x] ADR-017 reference comments added in affected code (line 1046 in m365-sync.service.ts, lines 329-338 in admin-users.service.ts)

## Tasks / Subtasks

- [ ] **Task 1: Update `deriveRole()` in M365 sync** (AC: #1, #2)
  - [ ] Locate `m365-sync.service.ts` → `deriveRole()` method
  - [ ] Remove Priority 3 branch: `if (hasDirectReports) return 'MANAGER'`
  - [ ] Keep direct reports sync logic intact — `managerId` relation must still be set
  - [ ] Verify remaining priority logic:
    - Priority 1: Admin group membership → ADMIN
    - Priority 2: Issuers group membership → ISSUER
    - Default: EMPLOYEE
- [ ] **Task 2: Remove auto-downgrade logic** (AC: #3)
  - [ ] Find user management service code that auto-downgrades MANAGER→EMPLOYEE
  - [ ] Remove the logic (when last subordinate is removed)
  - [ ] Verify: removing a user's last direct report does NOT change their role
- [ ] **Task 3: Remove role change block** (AC: #4)
  - [ ] Find code that blocks role changes when `directReportsCount > 0`
  - [ ] Remove the block — role changes should be independent of direct reports count
  - [ ] Verify: admin can change any user's role regardless of their direct reports
- [ ] **Task 4: Add ADR supersession comments** (AC: #7)
  - [ ] In affected code, add: `// ADR-011 §4.3 Rules 2-3 superseded by ADR-017 §10`
  - [ ] Reference ADR-017 for the new dual-dimension model
- [ ] **Task 5: Update tests** (AC: #5, #6)
  - [ ] M365 sync tests: remove expectations for MANAGER role assignment
  - [ ] M365 sync tests: add expectation that `hasDirectReports` user gets EMPLOYEE (not MANAGER)
  - [ ] User management tests: remove auto-downgrade assertions
  - [ ] User management tests: verify role change works regardless of directReports

## Dev Notes

### Architecture Patterns Used
- M365 Graph API integration (Client Credentials flow)
- Role derivation from security group membership
- Separation of permission role from org identity

### Source Tree Components
- `src/m365/m365-sync.service.ts` — `deriveRole()` method
- `src/user/user.service.ts` or user management service — auto-downgrade logic
- Corresponding test files

### Testing Standards
- Verify M365 sync still correctly derives ADMIN and ISSUER roles
- Verify direct reports sync is unaffected (managerId relations)
- Verify no auto-downgrade side effects remain

### References
- ADR-017 §4.6 — M365 sync changes
- ADR-017 §4.7 — User management cleanup
- ADR-017 §10 — ADR-011 supersession
- ADR-011 §4.3 Rules 2-3 — original (now superseded) logic

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot) — absorbed into Story 14.2 development

### Completion Notes
- **Absorbed by Story 14.2** — dev expanded 14.2 scope to fix CI lint compliance
- `m365-sync.service.ts`: Priority 3 in `deriveRole()` changed from `return UserRole.MANAGER` to `return UserRole.EMPLOYEE`; ADR-017 comment added at line 360
- `m365-sync.service.spec.ts`: 20+ lines updated — removed MANAGER role expectations, updated to expect EMPLOYEE
- `admin-users.service.ts`: ~190 lines removed — auto-upgrade (EMPLOYEE→MANAGER) and auto-downgrade (MANAGER→EMPLOYEE) logic fully removed
- ADR-017 references added at key decision points
- **Note:** `ManagerUpdateResponse` interface still has `managerAutoUpgraded`/`managerAutoDowngraded` fields — these are no-ops now but interface cleanup is non-blocking

### File List
- See Story 14.2 commits `7fe5ee0` and `25c0ae3` for full file list

## Retrospective Notes
- Story was fully absorbed into 14.2 due to CI lint compliance requirements
- The most impactful change was removing ~190 lines of auto-upgrade/downgrade logic from admin-users.service.ts
