# Story 15.2: Backend Permissions API (TD-035-B)

**Status:** done  
**Started:** 2026-03-01  
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

1. [x] `GET /api/users/me/permissions` endpoint returns the user's effective permissions
2. [x] Response includes: `role`, `isManager`, `dashboardTabs[]`, `sidebarGroups[]`
3. [x] `dashboardTabs` array contains only the tabs the user should see (per DEC-016-01 matrix)
4. [x] `sidebarGroups` array contains only the navigation groups the user should see (per DEC-016-02)
5. [x] Endpoint requires JWT authentication (returns 401 for unauthenticated)
6. [x] Response is fast (<50ms) — no database queries, computed from JWT claims
7. [x] Response does NOT include user email, ID, or any PII — only permission flags _(Arch Security Note)_
8. [x] Swagger documentation complete with response schema
9. [x] Unit tests cover all 6 role×manager combinations
10. [x] Backend computation logic mirrors frontend `utils/permissions.ts` — same results for same inputs _(CROSS-001)_

## Tasks / Subtasks

- [x] **Task 1: Create PermissionsController** (AC: #1, #5)
  - [x] `@Controller('api/users/me')` with `@UseGuards(JwtAuthGuard)`
  - [x] `GET /permissions` endpoint
  - [x] Extract `role` and `isManager` from `@CurrentUser()` decorator
- [x] **Task 2: Implement permission computation** (AC: #2, #3, #4)
  - [x] Create `computeDashboardTabs(role, isManager)` utility
  - [x] Create `computeSidebarGroups(role, isManager)` utility
  - [x] Return structured `UserPermissionsDto` response
  - [x] Ensure computation logic aligns with frontend `utils/permissions.ts` _(CROSS-001)_
- [x] **Task 3: Create DTOs** (AC: #2, #8)
  - [x] `UserPermissionsDto` with class-validator decorators
  - [x] `@ApiResponse` Swagger documentation
  - [x] Response shape includes both computed arrays AND flat booleans _(NOTE-15.2-003)_:
    ```json
    {
      "role": "ISSUER",
      "isManager": true,
      "dashboardTabs": ["my-badges", "team-overview", "issuance"],
      "sidebarGroups": ["base", "team", "issuance"],
      "permissions": {
        "canViewTeam": true,
        "canIssueBadges": true,
        "canManageUsers": false
      }
    }
    ```
- [x] **Task 4: Tests (Unit + E2E)** (AC: #5, #6, #8, #9)
  - [x] Test all 6 role×manager combinations
  - [x] Test 401 for unauthenticated request (e2e integration test)
  - [x] Verify no database calls (mock PrismaService should not be invoked)

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Add real unauthenticated 401 test (integration/e2e) for `GET /api/users/me/permissions` and remove misleading claim-only comment evidence [backend/src/modules/auth/permissions.controller.spec.ts:5]
- [x] [AI-Review][HIGH] Align Task 3 claim with implementation: either add `class-validator` decorators to DTO fields or update story/task wording to Swagger-only DTO [backend/src/modules/auth/dto/user-permissions.dto.ts:12]
- [x] [AI-Review][HIGH] Resolve CROSS-001 evidence gap by implementing/pointing to canonical frontend permissions utility and adding parity tests against backend mapping [frontend/src/hooks/useDashboard.ts:87]
- [x] [AI-Review][MEDIUM] Sync story and sprint tracking status consistently (`in-progress` vs `review`) before next CR pass [gcredit-project/docs/sprints/sprint-status.yaml:187]
- [x] [AI-Review][MEDIUM] Update Story 15.2 File List to include all story-related documentation changes tracked in git for transparency [gcredit-project/docs/sprints/sprint-15/15-2-backend-permissions-api.md:121]
- [x] [AI-Review][LOW] Tighten type safety by replacing `role: string` with `UserRole`-constrained types in permissions compute/DTO contracts [backend/src/modules/auth/utils/compute-permissions.ts:32]

## Dev Notes

### Architecture Patterns Used
- Pure JWT claim-based computation (no DB queries for permissions)
- `@CurrentUser()` decorator for authenticated user access
- DTO pattern with class-validator + Swagger
- `UserRole` enum from Prisma for type-safe role constraints

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
- `backend/test/permissions.e2e-spec.ts` (new)
- `frontend/src/utils/permissions.ts` (new)
- `frontend/src/utils/permissions.test.ts` (new)

### Review Findings (2026-03-01)
- **NOTE-15.2-001 (DEC-15-01):** Frontend uses JWT claims for instant rendering; this API is background verification + enrichment source (Hybrid approach)
- **NOTE-15.2-002:** Cache in frontend authStore, invalidated on token refresh / SSO re-sync
- **NOTE-15.2-003:** Response includes both computed arrays (`dashboardTabs`, `sidebarGroups`) AND flat permission booleans for flexibility
- **CROSS-001:** Backend `compute-permissions.ts` must produce identical results to frontend `utils/permissions.ts` for same (role, isManager) inputs
- **Security:** Do NOT include PII (email, userId) in permissions response — keep minimal

### Testing Standards
- 6-combination matrix (following Sprint 14 Story 14.8 pattern)
- No database mocking needed — pure computation
- Verify response shape matches DTO

### References
- ADR-016 DEC-016-01: Dashboard tab matrix
- ADR-016 DEC-016-02: Sidebar navigation groups
- ADR-015/017: Dual-dimension identity model
- Sprint 14 Story 14.3: JWT payload + isManager claim
- [ARCHITECTURE-REVIEW-SPRINT-15.md](ARCHITECTURE-REVIEW-SPRINT-15.md) — Story 15.2 section

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (via GitHub Copilot)

### Completion Notes
- **Task 1:** Created `PermissionsController` at `api/users/me` with `@UseGuards(JwtAuthGuard)` and `GET /permissions` endpoint. Uses `@CurrentUser()` decorator (project uses `CurrentUser` not `GetUser`).
- **Task 2:** Created `compute-permissions.ts` utility with `computeDashboardTabs()`, `computeSidebarGroups()`, `computeFlatPermissions()`, and `computePermissions()` — all pure functions, no DB calls. Matrix matches DEC-016-01/02 exactly.
- **Task 3:** Created `UserPermissionsDto` with `@ApiProperty` Swagger decorators + `class-validator` decorators (`@IsEnum`, `@IsBoolean`, `@IsArray`, `@IsString`, `@ValidateNested`). Includes `FlatPermissionsDto` nested class. No PII fields.
- **Task 4:** 28 unit tests covering all 6 role×manager combinations (controller-level + utility-level), PII exclusion check, no-DB-calls verification. Parameterized tests via `it.each`.
- Registered `PermissionsController` in `AuthModule`.
- Targeted verification complete: backend unit tests (28), backend permissions e2e tests (10), and frontend parity tests (24) passed.

**Code Review Follow-up (2026-03-01):**
- ✅ Resolved [HIGH] Real 401 e2e test: Created `test/permissions.e2e-spec.ts` (10 tests — 401 unauthenticated, 401 invalid token, 6 combo e2e, PII check, response shape)
- ✅ Resolved [HIGH] class-validator: Added `@IsEnum(UserRole)`, `@IsBoolean()`, `@IsArray()`, `@IsString({each:true})`, `@ValidateNested()`, `@Type()` to DTO
- ✅ Resolved [HIGH] CROSS-001: Created `frontend/src/utils/permissions.ts` (canonical frontend implementation) + `permissions.test.ts` (24 parity tests)
- ✅ Resolved [MEDIUM] Status sync: Story + sprint-status.yaml both set to `review`
- ✅ Resolved [MEDIUM] File List: Updated with all changed files
- ✅ Resolved [LOW] Type safety: All `role: string` → `role: UserRole` (Prisma enum) in compute-permissions.ts + DTO

### File List
- `backend/src/modules/auth/utils/compute-permissions.ts` (NEW → MODIFIED: UserRole type)
- `backend/src/modules/auth/dto/user-permissions.dto.ts` (NEW → MODIFIED: class-validator + UserRole)
- `backend/src/modules/auth/permissions.controller.ts` (NEW)
- `backend/src/modules/auth/permissions.controller.spec.ts` (NEW → MODIFIED: removed misleading 401 comment)
- `backend/src/modules/auth/auth.module.ts` (MODIFIED — added PermissionsController)
- `backend/test/permissions.e2e-spec.ts` (NEW — e2e integration test: 401 + 6 combos)
- `frontend/src/utils/permissions.ts` (NEW — CROSS-001 canonical frontend implementation)
- `frontend/src/utils/permissions.test.ts` (NEW — 24 parity tests)
- `gcredit-project/docs/sprints/sprint-status.yaml` (MODIFIED — status sync)
- `gcredit-project/docs/sprints/sprint-15/15-2-backend-permissions-api.md` (MODIFIED — review follow-ups)

### Change Log
- **2026-03-01 (CR Round 2):** Documentation consistency pass completed — aligned 15.2 status across story/sprint trackers, clarified Task 4 as Unit + E2E scope (401 via e2e), expanded Source Tree Components to include `permissions.e2e-spec.ts` and frontend CROSS-001 utility/test files, and updated verification summary to targeted pass counts (BE unit 28 / BE e2e 10 / FE parity 24).
- **2026-03-01 (CR Finalization):** Story 15.2 moved from `review` to `done` after re-review pass confirmed all HIGH/MEDIUM findings resolved and verification evidence complete.
