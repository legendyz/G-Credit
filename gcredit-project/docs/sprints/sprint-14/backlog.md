# Sprint 14 Backlog

**Sprint Number:** Sprint 14  
**Sprint Goal:** Architecture-first — land the dual-dimension role model refactor and resolve CI reliability, before Sprint 15 UI overhaul.  
**Target Version:** v1.4.0  
**Team Capacity:** Solo developer + AI agents  
**Sprint Lead:** LegendZhu  
**Branch:** `sprint-14/role-model-refactor`

---

## Sprint Goal

Deliver the TD-034 dual-dimension identity refactor — separating permission roles (`ADMIN|ISSUER|EMPLOYEE`) from organization identity (`isManager` derived from `directReports`). This unlocks Sprint 15's dashboard composite view and sidebar navigation. Secondary: fix flaky test (TD-036) and prepare design token infrastructure (P1-2).

**"Permission roles answer 'what can you do'; manager identity answers 'who are you in the org chart'. These are now two independent dimensions."**

**Success Criteria:**
- [ ] `UserRole` enum contains only `ADMIN | ISSUER | EMPLOYEE` (MANAGER removed)
- [ ] JWT includes `isManager: boolean` claim derived from `directReports` count
- [ ] New `ManagerGuard` + `@RequireManager()` decorator functional
- [ ] M365 sync no longer assigns MANAGER role (directReports handled by relation)
- [ ] All 6 role×manager combinations pass test matrix
- [ ] Frontend types updated, no `'MANAGER'` string references in application code
- [ ] BadgeManagementPage flaky test fixed — CI reliable
- [ ] All 1,708+ existing tests pass (0 regressions)

---

## Sprint Capacity

### Velocity Reference
| Sprint | Estimated | Actual | Accuracy | Type |
|--------|-----------|--------|----------|------|
| Sprint 11 | 60h | ~65h | 92% | Hardening (25 stories) |
| Sprint 12 | 67h | ~60h | 90% | Management UIs (8 stories) |
| Sprint 12.5 | 8h | ~6h | 75% | Cleanup (2 stories) |
| Sprint 13 | 50-60h | ~55h | 92% | SSO + Session (8 stories) |
| **Sprint 14** | **~24h** | TBD | Target: >90% | Arch refactor (3 stories) |

### Capacity Allocation
| Category | Hours (Est.) | Notes |
|----------|-------------|-------|
| **TD-036:** Flaky test fix | 2-4h | CI reliability quick win — do first |
| **TD-034:** Role model refactor | ~18h | Core architecture change — ADR-017 spec |
| **P1-2:** Design tokens prep | 1h | UI infrastructure for Sprint 15 |
| **Buffer** | 2h | Migration edge cases |
| **TOTAL** | **~24h** | |

---

## Architecture References

| Document | Content | Status |
|----------|---------|--------|
| **ADR-015** | UserRole enum = ADMIN\|ISSUER\|EMPLOYEE only | ✅ Accepted |
| **ADR-017** | TD-034 full architecture spec (11-step sequence) | ✅ Accepted |
| **ADR-011** | User Management (§4.3 Rules 2-3 superseded by ADR-017) | ⚠️ Partially superseded |

## Planning Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| **Version Manifest** | [version-manifest.md](version-manifest.md) | ✅ Created |
| **Story Files** | 9 files in `sprint-14/` directory | ✅ Created |
| **Infrastructure Inventory** | [infrastructure-inventory.md](../../setup/infrastructure-inventory.md) | ✅ Reviewed — no new resources |

---

## Wave Structure

### Wave 1: Quick Win — Flaky Test Fix (Story 14.1)
*Focus: CI reliability before major refactor*

| # | Story | Priority | Est | Depends On | Status |
|---|-------|----------|-----|------------|--------|
| 14.1 | [TD-036: Fix flaky BadgeManagementPage test](14-1-fix-flaky-badge-management-test.md) | HIGH | 2-4h | — | ✅ done |

### Wave 2: Role Model Refactor — Backend (Stories 14.2 — 14.6)
*Focus: Schema migration, JWT, guards, M365 sync — ADR-017 Steps 1-8*

| # | Story | Priority | Est | Depends On | Status |
|---|-------|----------|-----|------------|--------|
| 14.2 | [Schema migration: remove MANAGER from enum](14-2-schema-migration-remove-manager.md) | CRITICAL | 2h | — | ✅ done |
| 14.3 | [JWT payload + AuthenticatedUser + JwtStrategy update](14-3-jwt-payload-ismanager.md) | CRITICAL | 2h | 14.2 | backlog |
| 14.4 | [ManagerGuard + @RequireManager() decorator](14-4-manager-guard-decorator.md) | HIGH | 1h | 14.3 | backlog |
| 14.5 | [RolesGuard update + remove MANAGER from @Roles() decorators](14-5-rolesguard-remove-manager.md) | HIGH | — | — | ✅ absorbed by 14.2 |
| 14.6 | [M365 sync deriveRole() + user management cleanup](14-6-m365-sync-cleanup.md) | HIGH | — | — | ✅ absorbed by 14.2 |

### Wave 3: Role Model Refactor — Frontend (Story 14.7)
*Focus: Type updates, remove MANAGER references — ADR-017 Steps 9-10*

| # | Story | Priority | Est | Depends On | Status |
|---|-------|----------|-----|------------|--------|
| 14.7 | [Frontend types + ProtectedRoute + remove MANAGER checks](14-7-frontend-remove-manager.md) | HIGH | 3h | 14.3 | backlog (partial) |

### Wave 4: Testing + Design Tokens (Stories 14.8 — 14.9)
*Focus: 6-combination test matrix, design token prep*

| # | Story | Priority | Est | Depends On | Status |
|---|-------|----------|-----|------------|--------|
| 14.8 | [6-combination test matrix + regression](14-8-test-matrix-6-combinations.md) | HIGH | 2h | 14.3, 14.4, 14.7 | backlog |
| 14.9 | [P1-2: Hardcoded colors → design tokens](14-9-design-tokens-prep.md) | LOW | 1h | — | backlog |

---

## Scope Absorption Note (Sprint-In-Flight)

> **Story 14.2** expanded scope during development (commit `7fe5ee0`–`25c0ae3`) due to
> pre-push ESLint `--max-warnings=0` enforcement. The MANAGER enum removal cascaded
> into 21 files across the codebase, fully absorbing **14.5** and **14.6**, and
> partially completing work in **14.4** (inline guards), **14.7** (5 frontend files),
> and **14.8** (test factory updates). Remaining estimates have been adjusted
> accordingly. See individual story files for details.

---

## User Stories

### Wave 1: Quick Win

#### Story 14.1: Fix Flaky BadgeManagementPage Test (TD-036)
**Priority:** HIGH  
**Estimate:** 2-4h  
**Source:** TD-036 (Sprint 13 closeout)  
**File:** `frontend/src/pages/admin/BadgeManagementPage.test.tsx`

**As a** developer,  
**I want** the BadgeManagementPage test to pass reliably in the full test suite,  
**So that** CI pre-push hooks don't fail intermittently.

**Acceptance Criteria:**
1. [ ] Test "should show Revoke button for PENDING badges when ADMIN" passes 10/10 runs in full suite
2. [ ] Root cause identified and documented (test isolation / shared mock state / DOM timing)
3. [ ] Fix does not weaken assertion coverage
4. [ ] Pre-push hook passes 5 consecutive times without `--no-verify`

**Investigation Notes:**
- Passes in isolation, fails ~1 in 3 full suite runs
- Suspect: Vitest worker scheduling or shared mock state leakage
- Check: `getAllByRole` with `toBeGreaterThanOrEqual(2)` may mask subtle timing

---

### Wave 2: Role Model Refactor — Backend

#### Story 14.2: Schema Migration — Remove MANAGER from UserRole Enum
**Priority:** CRITICAL  
**Estimate:** 2h  
**Source:** ADR-015 DEC-015-01, ADR-017 §3  

**As a** system architect,  
**I want** the UserRole enum to only contain permission-role values,  
**So that** organization identity (manager) is cleanly separated from permission identity.

**Acceptance Criteria:**
1. [ ] Prisma migration created: `UserRole` enum = `{ ADMIN, ISSUER, EMPLOYEE }`
2. [ ] All existing `role = 'MANAGER'` rows migrated to `role = 'EMPLOYEE'`
3. [ ] `directReports` relationships preserved (zero data loss)
4. [ ] ADR-015 code comments added to `schema.prisma` enum definition
5. [ ] Migration reversible (rollback SQL documented)
6. [ ] All seed data updated (no MANAGER references in seed files)

**Migration SQL (generated by Prisma):**
```sql
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'MANAGER';
-- Prisma handles ALTER TYPE for enum value removal
```

---

#### Story 14.3: JWT Payload — Add `isManager` Claim
**Priority:** CRITICAL  
**Estimate:** 2h  
**Source:** ADR-017 §4.1-4.3  

**As a** user with direct reports,  
**I want** my JWT token to include `isManager: true`,  
**So that** the frontend can show me team management features.

**Acceptance Criteria:**
1. [ ] `JwtPayload` interface: add `isManager: boolean` field
2. [ ] `AuthenticatedUser` interface: add `isManager: boolean` field
3. [ ] `auth.service.ts` — 3 JWT generation points updated:
   - Registration: `isManager: false` (new users)
   - Login: `isManager` computed from `prisma.user.count({ where: { managerId } })`
   - Token refresh: `isManager` recomputed (may change between refreshes)
4. [ ] `jwt.strategy.ts` — `validate()` passes `isManager` through (with `?? false` fallback for old tokens)
5. [ ] Helper method: `computeIsManager(userId)` uses `@@index([managerId])` — O(1) lookup
6. [ ] Backward compatibility: tokens without `isManager` treated as `false`
7. [ ] Unit tests: JWT payload contains `isManager` for user with/without direct reports

---

#### Story 14.4: ManagerGuard + @RequireManager() Decorator
**Priority:** HIGH  
**Estimate:** 2h  
**Source:** ADR-017 §4.5  

**As a** backend developer,  
**I want** a dedicated guard for manager-scoped endpoints,  
**So that** organization-dimension access control is separated from permission-dimension.

**Acceptance Criteria:**
1. [ ] New file: `src/common/guards/manager.guard.ts` — checks `user.isManager`
2. [ ] New file: `src/common/decorators/require-manager.decorator.ts`
3. [ ] ADMIN bypasses ManagerGuard (consistent with RolesGuard)
4. [ ] Can compose: `@Roles('ISSUER') + @RequireManager()` for dual-dimension checks
5. [ ] ADR-017 code comments in guard file
6. [ ] Unit tests: manager allowed, non-manager denied, ADMIN always allowed
7. [ ] Decorator metadata test: `Reflect.getMetadata()` returns correct value

---

#### Story 14.5: RolesGuard Update — Remove MANAGER References
**Priority:** HIGH  
**Estimate:** 2h  
**Source:** ADR-017 §4.4  

**As a** backend developer,  
**I want** all `@Roles('MANAGER')` decorators removed from controllers,  
**So that** RBAC checks only operate on permission-role values.

**Acceptance Criteria:**
1. [ ] `roles.guard.ts` — update doc comment (remove MANAGER from hierarchy description)
2. [ ] ADR-017 code comment added to RolesGuard
3. [ ] All `@Roles('MANAGER', ...)` decorators updated:
   - `app.controller.ts`: `@Roles('MANAGER', 'ADMIN')` → `@RequireManager()` or `@Roles('ADMIN')`
   - `badge-issuance.controller.spec.ts`: remove MANAGER from test arrays
4. [ ] `BadgeManagementPage` backend route: MANAGER → `@RequireManager()` or removed
5. [ ] Grep verification: zero `'MANAGER'` string matches in backend `src/` (excluding test fixtures with historical data)
6. [ ] All existing RBAC tests updated and passing

---

#### Story 14.6: M365 Sync + User Management Cleanup
**Priority:** HIGH  
**Estimate:** 2h  
**Source:** ADR-017 §4.6-4.7  

**As a** system,  
**I want** M365 sync to stop assigning MANAGER role and user management to stop auto-downgrading MANAGER,  
**So that** role derivation only sets permission-role values.

**Acceptance Criteria:**
1. [ ] `m365-sync.service.ts` `deriveRole()`: remove Priority 3 (`hasDirectReports → MANAGER`)
2. [ ] Direct reports still synced from Graph API — `managerId` relation maintained
3. [ ] User management service: remove auto-downgrade logic (MANAGER→EMPLOYEE on last subordinate removal)
4. [ ] User management service: remove block on MANAGER role change when directReportsCount > 0
5. [ ] M365 sync tests updated — no expectations for MANAGER role assignment
6. [ ] User management tests updated — no auto-downgrade assertions
7. [ ] ADR-011 superseded sections noted in comments (link to ADR-017 §10)

---

### Wave 3: Role Model Refactor — Frontend

#### Story 14.7: Frontend Type Updates + Remove MANAGER References
**Priority:** HIGH  
**Estimate:** 4h  
**Source:** ADR-017 §5  

**As a** frontend developer,  
**I want** all `'MANAGER'` type references removed and `isManager` available from auth store,  
**So that** UI components use the dual-dimension model correctly.

**Acceptance Criteria:**
1. [ ] `authStore.ts`: User interface adds `isManager: boolean`, new `useIsManager()` selector
2. [ ] `adminUsersApi.ts`: `UserRole` type = `'ADMIN' | 'ISSUER' | 'EMPLOYEE'`
3. [ ] `ProtectedRoute.tsx`: `requiredRoles` type removes `'MANAGER'`, adds `requireManager?: boolean` prop
4. [ ] `App.tsx`: all `requiredRoles` arrays — remove `'MANAGER'`
5. [ ] `Navbar.tsx`: remove `role === 'MANAGER'` conditional block
6. [ ] `MobileNav.tsx`: remove `'MANAGER'` from all `navLinks` role arrays
7. [ ] `AdminUserManagementPage.tsx`: `ROLES` array removes `'MANAGER'`
8. [ ] `BadgeManagementPage.tsx`: remove `'MANAGER'` from type union, replace `role === 'MANAGER'` checks with `isManager`
9. [ ] `DashboardPage.tsx`: remove `case 'MANAGER':` — minimal change (full tabbed view in Sprint 15)
10. [ ] Grep verification: zero `'MANAGER'` string matches in frontend `src/` (excluding test historical data)
11. [ ] All frontend tests updated and passing
12. [ ] Role display: combined tags `[Issuer] [Manager]` where applicable

---

### Wave 4: Testing + Design Tokens

#### Story 14.8: 6-Combination Test Matrix
**Priority:** HIGH  
**Estimate:** 2h  
**Source:** ADR-017 §7  

**As a** QA engineer,  
**I want** all 6 valid role×manager combinations verified,  
**So that** the dual-dimension model is fully validated before Sprint 15 UI work begins.

**Acceptance Criteria:**
1. [ ] Test matrix executed — all 6 combinations:

| # | Permission Role | isManager | Dashboard | Team Access | Issue Access | Admin Access |
|---|----------------|-----------|-----------|-------------|-------------|-------------|
| 1 | EMPLOYEE | false | ✅ | ❌ | ❌ | ❌ |
| 2 | EMPLOYEE | true | ✅ | ✅ | ❌ | ❌ |
| 3 | ISSUER | false | ✅ | ❌ | ✅ | ❌ |
| 4 | ISSUER | true | ✅ | ✅ | ✅ | ❌ |
| 5 | ADMIN | false | ✅ | ✅* | ✅ | ✅ |
| 6 | ADMIN | true | ✅ | ✅ | ✅ | ✅ |

*ADMIN bypasses ManagerGuard

2. [ ] JWT backward compatibility: old tokens (without `isManager`) work with `isManager=false` fallback
3. [ ] Migration test: MANAGER users → EMPLOYEE with directReports preserved
4. [ ] M365 sync test: user in Issuers group + has directReports → ISSUER role + isManager=true
5. [ ] Full regression: all 1,708+ tests pass

---

#### Story 14.9: Design Tokens Prep (P1-2)
**Priority:** LOW  
**Estimate:** 1h  
**Source:** P1-2 (Feature Completeness Audit)  

**As a** frontend developer,  
**I want** any remaining hardcoded color values unified into Tailwind v4 theme tokens,  
**So that** Sprint 15 UI polish builds on a consistent design token foundation.

**Acceptance Criteria:**
1. [ ] Scan codebase for raw hex/rgb color values outside `index.css` `@theme` blocks
2. [ ] Replace with Tailwind token references (e.g., `text-brand-600`, `bg-neutral-100`)
3. [ ] Verify: no visual regressions in key pages (dashboard, login, badges)
4. [ ] Document any new tokens added to `@theme` block

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Prisma enum migration fails on existing data | Blocks all work | Low | Test migration on copy of prod data first; rollback SQL ready |
| Old JWT tokens in flight after deploy | Users lose manager features temporarily | Medium | `?? false` fallback; features restore on next login/refresh |
| MANAGER removal breaks undiscovered code paths | Runtime errors | Medium | Pre-migration grep + comprehensive test matrix |
| M365 sync regression (role derivation change) | Users get wrong role | Low | Specific sync test with directReports + Security Group combo |

---

## Definition of Done (Sprint Level)

- [ ] All 9 stories completed and tested
- [ ] UserRole enum = `{ ADMIN, ISSUER, EMPLOYEE }` in schema
- [ ] JWT `isManager` claim functional at all 3 generation points
- [ ] ManagerGuard + @RequireManager() decorator registered and tested
- [ ] Zero `'MANAGER'` string references in application code (backend + frontend)
- [ ] 6-combination test matrix all pass
- [ ] All 1,708+ existing tests pass (0 regressions)
- [ ] Pre-push hook passes reliably (TD-036 fix verified)
- [ ] ADR code comments in place (schema, guards, routes)
- [ ] CHANGELOG.md updated for v1.4.0
- [ ] Sprint retrospective notes captured

---

**Created:** 2026-02-27  
**Created By:** SM Agent (Bob)  
**Architecture Spec:** ADR-017 (Winston)
