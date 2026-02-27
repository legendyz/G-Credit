# Story 14.6: M365 Sync + User Management Cleanup

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 2h  
**Wave:** 2 — Role Model Refactor (Backend)  
**Source:** ADR-017 §4.6-4.7  
**Depends On:** 14.2

---

## Story

**As a** system,  
**I want** M365 sync to stop assigning MANAGER role and user management to stop auto-downgrading MANAGER,  
**So that** role derivation only sets permission-role values.

## Acceptance Criteria

1. [ ] `m365-sync.service.ts` `deriveRole()`: remove Priority 3 (`hasDirectReports → MANAGER`)
2. [ ] Direct reports still synced from Graph API — `managerId` relation maintained
3. [ ] User management service: remove auto-downgrade logic (MANAGER→EMPLOYEE on last subordinate removal)
4. [ ] User management service: remove block on MANAGER role change when directReportsCount > 0
5. [ ] M365 sync tests updated — no expectations for MANAGER role assignment
6. [ ] User management tests updated — no auto-downgrade assertions
7. [ ] ADR-011 superseded sections noted in comments (link to ADR-017 §10)

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
### Completion Notes
### File List

## Retrospective Notes
