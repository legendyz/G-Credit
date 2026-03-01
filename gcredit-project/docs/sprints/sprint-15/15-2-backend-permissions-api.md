# Story 15.2: Backend Permissions API (TD-035-B)

**Status:** backlog  
**Priority:** HIGH  
**Estimate:** 3h  
**Wave:** 1 — Backend Prep  
**Source:** TD-035-B, ADR-016 DEC-016-01  
**Dependencies:** None (Sprint 14 ADR-017 dual-dimension model is prerequisite — ✅ done)

---

## Story

**As a** frontend application,  
**I want** a dedicated permissions API endpoint,  
**So that** the dashboard and sidebar can determine which sections to display based on the user's combined permissions.

## Acceptance Criteria

1. [ ] `GET /api/users/me/permissions` endpoint returns the user's effective permissions
2. [ ] Response includes: `role`, `isManager`, `dashboardTabs[]`, `sidebarGroups[]`
3. [ ] `dashboardTabs` array contains only the tabs the user should see (per DEC-016-01 matrix)
4. [ ] `sidebarGroups` array contains only the navigation groups the user should see (per DEC-016-02)
5. [ ] Endpoint requires JWT authentication (returns 401 for unauthenticated)
6. [ ] Response is fast (<50ms) — no database queries, computed from JWT claims
7. [ ] Swagger documentation complete with response schema
8. [ ] Unit tests cover all 6 role×manager combinations

## Tasks / Subtasks

- [ ] **Task 1: Create PermissionsController** (AC: #1, #5)
  - [ ] `@Controller('api/users/me')` with `@UseGuards(JwtAuthGuard)`
  - [ ] `GET /permissions` endpoint
  - [ ] Extract `role` and `isManager` from `@GetUser()` decorator
- [ ] **Task 2: Implement permission computation** (AC: #2, #3, #4)
  - [ ] Create `computeDashboardTabs(role, isManager)` utility
  - [ ] Create `computeSidebarGroups(role, isManager)` utility
  - [ ] Return structured `UserPermissionsDto` response
- [ ] **Task 3: Create DTOs** (AC: #2, #7)
  - [ ] `UserPermissionsDto` with class-validator decorators
  - [ ] `@ApiResponse` Swagger documentation
  - [ ] Response shape: `{ role, isManager, dashboardTabs, sidebarGroups }`
- [ ] **Task 4: Unit tests** (AC: #6, #8)
  - [ ] Test all 6 role×manager combinations
  - [ ] Test 401 for unauthenticated request
  - [ ] Verify no database calls (mock PrismaService should not be invoked)

## Dev Notes

### Architecture Patterns Used
- Pure JWT claim-based computation (no DB queries for permissions)
- `@GetUser()` decorator for authenticated user access
- DTO pattern with class-validator + Swagger

### Permission Matrix

| Role | isManager | Dashboard Tabs | Sidebar Groups |
|------|-----------|---------------|----------------|
| EMPLOYEE | false | [my-badges] | [base] |
| EMPLOYEE | true | [my-badges, team] | [base, team] |
| ISSUER | false | [my-badges, issuance] | [base, issuance] |
| ISSUER | true | [my-badges, team, issuance] | [base, team, issuance] |
| ADMIN | false | [my-badges, issuance, admin] | [base, issuance, admin] |
| ADMIN | true | [my-badges, team, issuance, admin] | [base, team, issuance, admin] |

### Source Tree Components
- `backend/src/modules/auth/permissions.controller.ts` (new)
- `backend/src/modules/auth/dto/user-permissions.dto.ts` (new)
- `backend/src/modules/auth/utils/compute-permissions.ts` (new)
- `backend/src/modules/auth/permissions.controller.spec.ts` (new)

### Testing Standards
- 6-combination matrix (following Sprint 14 Story 14.8 pattern)
- No database mocking needed — pure computation
- Verify response shape matches DTO

### References
- ADR-016 DEC-016-01: Dashboard tab matrix
- ADR-016 DEC-016-02: Sidebar navigation groups
- ADR-015/017: Dual-dimension identity model
- Sprint 14 Story 14.3: JWT payload + isManager claim

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
