# ADR-017: TD-034 Role Model Refactor — Dual-Dimension Identity Architecture

**ADR Number:** 017
**Status:** ✅ Accepted
**Date:** 2026-02-27
**Author:** Winston (Architect)
**Deciders:** LegendZhu (PO/Project Lead), Winston (Architect), John (PM), Bob (SM), Sally (UX)
**Context:** Sprint 14 implementation — TD-034 architecture specification
**Related:** ADR-011 (User Management), ADR-015 (Enum Design), ADR-016 (UI Decisions)

---

## 1. Problem Statement

G-Credit's current identity model uses a single `UserRole` enum to represent two fundamentally different concepts:

```
Current: UserRole { ADMIN, ISSUER, MANAGER, EMPLOYEE }
                    ──────────────────  ───────────────
                    Permission roles    Org identity
```

**Why this fails:**

| Scenario | Current Model | Expected Behavior |
|----------|---------------|-------------------|
| Team Lead who also issues badges | Must choose MANAGER or ISSUER — can't be both | Should see Team view AND Issuance view |
| ADMIN who manages direct reports | ADMIN role hides manager features | Should see Admin panel AND Team view |
| Issuer loses all subordinates | No automatic change — stays ISSUER | Manager features should silently disappear |
| M365 sync: user in "Badge Issuers" group AND has directReports | Group → ISSUER wins, directReports ignored | Should be ISSUER + Manager simultaneously |

**Core issue:** Permission and organization identity are **orthogonal dimensions** forced into a single axis.

---

## 2. Solution: Dual-Dimension Identity Model

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Identity Model                       │
│                                                              │
│  Dimension 1: Permission Role          Dimension 2: Org ID  │
│  ┌──────────────────────┐             ┌──────────────────┐  │
│  │  Stored in DB:       │             │  Derived at       │  │
│  │  user.role enum      │             │  runtime:         │  │
│  │                      │             │                   │  │
│  │  ADMIN               │             │  isManager =      │  │
│  │  ISSUER              │             │  directReports    │  │
│  │  EMPLOYEE (default)  │             │  .length > 0      │  │
│  │                      │             │                   │  │
│  │  "What can you DO?"  │             │  "WHO are you     │  │
│  │                      │             │   in the org?"    │  │
│  └──────────────────────┘             └──────────────────┘  │
│                                                              │
│  Combined at two points:                                     │
│  1. JWT generation (login/refresh) → { role, isManager }    │
│  2. Query time (dashboard/guards) → DB join on directReports│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Six Valid Combinations

| # | Permission Role | isManager | Example User | Dashboard Tabs |
|---|----------------|-----------|-------------|----------------|
| 1 | EMPLOYEE | false | Regular employee | My Badges |
| 2 | EMPLOYEE | true | Team lead (no issuance rights) | My Badges, Team Overview |
| 3 | ISSUER | false | HR badge specialist | My Badges, Issuance |
| 4 | ISSUER | true | HR manager who issues badges | My Badges, Team Overview, Issuance |
| 5 | ADMIN | false | System admin (no direct reports) | My Badges, Issuance, Administration |
| 6 | ADMIN | true | Admin who manages a team | My Badges, Team Overview, Issuance, Administration |

---

## 3. Schema Changes

### 3.1 UserRole Enum Migration

**Before (v1.3.0):**
```prisma
enum UserRole {
  ADMIN
  ISSUER
  MANAGER     // ← REMOVE
  EMPLOYEE
}
```

**After (v1.4.0):**
```prisma
// ADR-015/ADR-017: Permission roles ONLY.
// Manager identity derived from directReports relation.
// GUEST will be added when FEAT-009 implemented — see ADR-014.
enum UserRole {
  ADMIN       // Full system administration
  ISSUER      // Badge template creation and issuance
  EMPLOYEE    // Base role — no elevated permissions (default)
}
```

**Prisma Migration SQL:**
```sql
-- Step 1: Migrate existing MANAGER users to EMPLOYEE
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'MANAGER';

-- Step 2: Remove MANAGER from enum
-- Prisma handles this via ALTER TYPE ... RENAME VALUE or recreating the enum type
-- The migration generator will produce the exact SQL
```

**Data Preservation:** Users who had `role = MANAGER` retain their `managerId`/`directReports` relationships. Only the enum value changes. No data is lost.

### 3.2 User Model — No Schema Change Required

The `User` model already has all necessary fields:

```prisma
model User {
  // ... existing fields ...
  
  // Permission dimension (stored)
  role          UserRole  @default(EMPLOYEE)
  
  // Organization dimension (derived from relation)
  managerId     String?
  manager       User?   @relation("ManagerReports", fields: [managerId], references: [id], onDelete: SetNull)
  directReports User[]  @relation("ManagerReports")
  
  // Manual role override tracking
  roleSetManually Boolean   @default(false)
}
```

No new columns are needed. The `isManager` flag is **computed, not stored**.

---

## 4. Backend Changes

### 4.1 JWT Payload — Add `isManager` Claim

**Current JwtPayload:**
```typescript
interface JwtPayload {
  sub: string;   // user ID
  email: string;
  role: string;  // UserRole enum value
}
```

**New JwtPayload:**
```typescript
interface JwtPayload {
  sub: string;      // user ID
  email: string;
  role: string;     // UserRole: 'ADMIN' | 'ISSUER' | 'EMPLOYEE'
  isManager: boolean; // derived from directReports count > 0
}
```

**Changes in `auth.service.ts`** — Three JWT generation points:

```typescript
// Helper: compute isManager from DB
private async computeIsManager(userId: string): Promise<boolean> {
  const count = await this.prisma.user.count({
    where: { managerId: userId },
  });
  return count > 0;
}

// 1. Registration — always false (new user has no reports)
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
  isManager: false,  // New users never have direct reports
};

// 2. Login — compute from DB
const isManager = await this.computeIsManager(freshUser.id);
const payload = {
  sub: freshUser.id,
  email: freshUser.email,
  role: freshUser.role,
  isManager,
};

// 3. Token refresh — compute from DB (may have changed since last login)
const isManager = await this.computeIsManager(tokenRecord.user.id);
const newPayload = {
  sub: tokenRecord.user.id,
  email: tokenRecord.user.email,
  role: tokenRecord.user.role,
  isManager,
};
```

**Performance Note:** `prisma.user.count({ where: { managerId } })` uses the existing `@@index([managerId])` — O(1) index lookup, ~1ms.

### 4.2 AuthenticatedUser Interface

**Current:**
```typescript
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
```

**New:**
```typescript
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;       // Permission dimension
  isManager: boolean;   // Organization dimension
}
```

### 4.3 JwtStrategy — Pass `isManager` Through

```typescript
// jwt.strategy.ts
validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    isManager: payload.isManager ?? false, // backward compat for old tokens
  };
}
```

**Backward Compatibility:** During rollout, existing tokens in flight won't have `isManager`. The `?? false` fallback ensures old tokens still work — users just won't see manager features until their next login/refresh.

### 4.4 RolesGuard — Permission Dimension Only (Unchanged Logic)

```typescript
// roles.guard.ts
// ADR-017: This guard checks permission roles (ADMIN/ISSUER/EMPLOYEE) only.
// For manager-scoped access, use @RequireManager() decorator + ManagerGuard.
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    
    // ADMIN bypasses all permission checks
    if (user.role === 'ADMIN') return true;
    
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Key point:** RolesGuard does NOT check `isManager`. It only validates the permission dimension.

### 4.5 New ManagerGuard — Organization Dimension

```typescript
// manager.guard.ts — NEW FILE
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_MANAGER_KEY = 'requireManager';

@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireManager = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MANAGER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireManager) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    
    // ADMIN bypasses manager check too
    if (user.role === 'ADMIN') return true;
    
    return user.isManager === true;
  }
}
```

```typescript
// require-manager.decorator.ts — NEW FILE
import { SetMetadata } from '@nestjs/common';
import { REQUIRE_MANAGER_KEY } from '../guards/manager.guard';

export const RequireManager = () => SetMetadata(REQUIRE_MANAGER_KEY, true);
```

**Usage Example:**
```typescript
// Team badge overview — requires manager identity, any permission role
@Get('team-badges')
@RequireManager()
@UseGuards(JwtAuthGuard, ManagerGuard)
async getTeamBadges(@Req() req: RequestWithUser) {
  return this.dashboardService.getTeamBadges(req.user.userId);
}

// Badge issuance — requires ISSUER permission, manager status irrelevant
@Post('issue')
@Roles('ADMIN', 'ISSUER')
@UseGuards(JwtAuthGuard, RolesGuard)
async issueBadge(@Body() dto: IssueBadgeDto) { ... }

// Both dimensions — e.g., manager who can also issue
@Post('team-recommend')
@Roles('ISSUER')
@RequireManager()
@UseGuards(JwtAuthGuard, RolesGuard, ManagerGuard)
async recommendTeamBadge() { ... }
```

### 4.6 M365 Sync — Role Derivation Change

**Current `deriveRole()` logic (Priority 3 sets MANAGER):**
```typescript
async deriveRole(azureId, existingUser, hasDirectReports): Promise<UserRole> {
  // Priority 1: Security Group → ADMIN | ISSUER
  const groupRole = await this.getUserRoleFromGroups(azureId);
  if (groupRole) return groupRole;
  
  // Priority 2: roleSetManually → keep existing
  if (existingUser?.roleSetManually) return existingUser.role;
  
  // Priority 3: directReports > 0 → MANAGER  ← REMOVE THIS
  if (hasDirectReports) return UserRole.MANAGER;
  
  // Priority 4: default → EMPLOYEE
  return UserRole.EMPLOYEE;
}
```

**New `deriveRole()` logic:**
```typescript
async deriveRole(azureId, existingUser, hasDirectReports): Promise<UserRole> {
  // ADR-017: Role derivation sets PERMISSION roles only.
  // Manager identity is NOT a role — derived from directReports relation.
  
  // Priority 1: Security Group → ADMIN | ISSUER
  const groupRole = await this.getUserRoleFromGroups(azureId);
  if (groupRole) return groupRole;
  
  // Priority 2: roleSetManually → keep existing
  if (existingUser?.roleSetManually) return existingUser.role;
  
  // Priority 3: default → EMPLOYEE
  // (hasDirectReports is no longer used for role derivation —
  //  manager identity is handled by the directReports relation itself)
  return UserRole.EMPLOYEE;
}
```

**Impact:** Users who were previously auto-assigned MANAGER by M365 sync (due to having direct reports) will now get EMPLOYEE. Their manager identity is preserved via the `directReports` relation and surfaced via the `isManager` JWT claim.

### 4.7 User Management Service — Remove Auto-Downgrade

**Current behavior (ADR-011):**
- Deleting a MANAGER's last subordinate auto-downgrades them from MANAGER → EMPLOYEE
- Blocking role change from MANAGER if `directReportsCount > 0`

**New behavior:**
- No auto-downgrade needed — MANAGER is no longer a role value
- No blocking needed — permission role changes are independent of subordinate count
- Deleting a user's last subordinate simply means `isManager` becomes `false` on next JWT refresh

**Removed Logic:**
```typescript
// DELETE: Auto-downgrade when last subordinate removed
// DELETE: Block MANAGER → EMPLOYEE if directReportsCount > 0
// DELETE: MANAGER → ADMIN allowed special case
```

These rules in ADR-011 §4.3 are **superseded** by ADR-017. The role field no longer contains MANAGER, so role-change validation around MANAGER is removed entirely.

### 4.8 New Permissions Endpoint

```typescript
// users.controller.ts
@Get('me/permissions')
@UseGuards(JwtAuthGuard)
async getMyPermissions(@Req() req: RequestWithUser) {
  const directReportsCount = await this.prisma.user.count({
    where: { managerId: req.user.userId },
  });
  
  return {
    role: req.user.role,
    isManager: directReportsCount > 0,
    permissions: {
      canViewTeam: directReportsCount > 0 || req.user.role === 'ADMIN',
      canIssueBadges: ['ADMIN', 'ISSUER'].includes(req.user.role),
      canManageUsers: req.user.role === 'ADMIN',
      canManageTemplates: ['ADMIN', 'ISSUER'].includes(req.user.role),
      canViewAnalytics: ['ADMIN', 'ISSUER'].includes(req.user.role),
      canViewAdminPanel: req.user.role === 'ADMIN',
    },
  };
}
```

This endpoint provides the frontend with a single source of truth for UI tab/sidebar visibility, avoiding scattered permission logic in components.

---

## 5. Frontend Changes

### 5.1 Auth Store — Add `isManager`

```typescript
// authStore.ts
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ISSUER' | 'EMPLOYEE';  // MANAGER removed
  isManager: boolean;                       // NEW: from JWT or /me/permissions
  department?: string;
}

// New selector
export const useIsManager = () => useAuthStore((state) => state.user?.isManager ?? false);
```

### 5.2 Type Updates

**`adminUsersApi.ts`:**
```typescript
// Remove MANAGER from frontend type
export type UserRole = 'ADMIN' | 'ISSUER' | 'EMPLOYEE';
```

**`ProtectedRoute.tsx`:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'EMPLOYEE'>;  // MANAGER removed
  requireManager?: boolean;  // NEW: organization dimension check
}

export function ProtectedRoute({ children, requiredRoles, requireManager }: ProtectedRouteProps) {
  const { isAuthenticated, user, sessionValidated, validateSession } = useAuthStore();
  
  // ... session validation ...

  // Check permission dimension
  if (requiredRoles?.length && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }
  
  // Check organization dimension
  if (requireManager && user && !user.isManager && user.role !== 'ADMIN') {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
```

### 5.3 App.tsx Route Changes

```typescript
// BEFORE: MANAGER in requiredRoles
<ProtectedRoute requiredRoles={['ADMIN', 'ISSUER', 'MANAGER']}>
  <BadgeManagementPage />
</ProtectedRoute>

// AFTER: Separate dimensions
<ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']} requireManager>
  <BadgeManagementPage />
</ProtectedRoute>
```

### 5.4 DashboardPage — Tabbed Composite View

```typescript
// ADR-016 DEC-016-01: Default tab = "My Badges"
// ADR-017: Tabs computed from dual dimensions

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('my-badges');

  // Declarative tab computation
  const tabs = useMemo(() => {
    const t = [{ id: 'my-badges', label: 'My Badges', component: EmployeeDashboard }];
    
    if (user?.isManager) {
      t.push({ id: 'team', label: 'Team Overview', component: ManagerDashboard });
    }
    if (user?.role === 'ISSUER' || user?.role === 'ADMIN') {
      t.push({ id: 'issuance', label: 'Issuance', component: IssuerDashboard });
    }
    if (user?.role === 'ADMIN') {
      t.push({ id: 'admin', label: 'Administration', component: AdminDashboard });
    }
    
    return t;
  }, [user?.role, user?.isManager]);

  return (
    <ErrorBoundary>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </ErrorBoundary>
  );
};
```

### 5.5 Navbar/Sidebar — Remove MANAGER Branch

**Current Navbar has three role-based blocks:**
1. `['ADMIN', 'ISSUER'].includes(role)` → Templates, Badges, Bulk Issue, Analytics
2. `role === 'ADMIN'` → Users, Categories, Skills, Milestones
3. `role === 'MANAGER'` → Badges (standalone link)

**New Sidebar navigation groups (ADR-016 DEC-016-02):**
```typescript
const navGroups = [
  {
    label: null, // No group header
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, visible: true },
      { to: '/wallet', label: 'My Wallet', icon: Wallet, visible: true },
    ],
  },
  {
    label: 'Team',
    visible: user?.isManager || user?.role === 'ADMIN',
    items: [
      { to: '/team/badges', label: 'Team Badges', icon: Users, visible: true },
    ],
  },
  {
    label: 'Issuance',
    visible: ['ADMIN', 'ISSUER'].includes(user?.role),
    items: [
      { to: '/admin/templates', label: 'Templates', icon: FileText, visible: true },
      { to: '/admin/badges', label: 'Badges', icon: Award, visible: true },
      { to: '/admin/bulk-issuance', label: 'Bulk Issue', icon: Upload, visible: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, visible: true },
    ],
  },
  {
    label: 'Administration',
    visible: user?.role === 'ADMIN',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserCog, visible: true },
      { to: '/admin/skills/categories', label: 'Categories', icon: FolderTree, visible: true },
      { to: '/admin/skills', label: 'Skills', icon: Sparkles, visible: true },
      { to: '/admin/milestones', label: 'Milestones', icon: Trophy, visible: true },
    ],
  },
];
```

### 5.6 MobileNav — Same Logic

MobileNav `navLinks` array currently contains `'MANAGER'` in role arrays. All occurrences updated to use `isManager` boolean check instead of role string matching.

### 5.7 AdminUserManagementPage — MANAGER Filter Removed

```typescript
// BEFORE
const ROLES: (UserRole | 'ALL')[] = ['ALL', 'ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'];

// AFTER
const ROLES: (UserRole | 'ALL')[] = ['ALL', 'ADMIN', 'ISSUER', 'EMPLOYEE'];
```

Role column in the user table should display combined tags:
```
| Name     | Role Tags              |
|----------|------------------------|
| Alice    | [ISSUER] [Manager]     |  ← dual display
| Bob      | [EMPLOYEE]             |
| Charlie  | [ADMIN] [Manager]      |
```

### 5.8 BadgeManagementPage — Remove MANAGER Cases

```typescript
// BEFORE
const userRole = userRoleProp || (currentUser?.role as 'ADMIN' | 'ISSUER' | 'MANAGER') || 'ADMIN';

// AFTER
const userRole = userRoleProp || (currentUser?.role as 'ADMIN' | 'ISSUER' | 'EMPLOYEE') || 'ADMIN';
```

All `if (userRole === 'MANAGER')` branches → replaced with either:
- `if (user.isManager)` — for team-scoped visibility
- Removed entirely — if the MANAGER privilege was equivalent to ISSUER

---

## 6. Audit Log Migration

### 6.1 Historical Records — Preserve As-Is

Existing `UserRoleAuditLog` entries with `previousRole = 'MANAGER'` or `newRole = 'MANAGER'` are **not migrated**. They remain as historical records.

### 6.2 New Audit Log Entries

Post-migration audit log entries will only contain `ADMIN`, `ISSUER`, or `EMPLOYEE` as role values. The `description` field can reference manager status changes:

```typescript
// Example audit entry when admin reassigns subordinates
{
  action: 'SUBORDINATE_REASSIGNED',
  description: 'User john@co lost manager status (0 remaining direct reports)',
  // Note: no role_changed event — isManager is derived, not stored
}
```

---

## 7. Testing Strategy

### 7.1 Test Matrix — 6 Combinations

| # | Setup | Permission Tests | Manager Tests | Dashboard Tests |
|---|-------|-----------------|---------------|-----------------|
| 1 | EMPLOYEE, 0 reports | Can access wallet ✅, Can't issue ❌, Can't admin ❌ | isManager=false | 1 tab: My Badges |
| 2 | EMPLOYEE, 2 reports | Can access wallet ✅, Can't issue ❌, Can't admin ❌ | isManager=true, Can see team ✅ | 2 tabs: My Badges, Team |
| 3 | ISSUER, 0 reports | Can issue ✅, Can't admin ❌ | isManager=false | 2 tabs: My Badges, Issuance |
| 4 | ISSUER, 3 reports | Can issue ✅, Can't admin ❌ | isManager=true, Can see team ✅ | 3 tabs: My Badges, Team, Issuance |
| 5 | ADMIN, 0 reports | Full access ✅ | isManager=false (ADMIN bypasses) | 3 tabs: My Badges, Issuance, Admin |
| 6 | ADMIN, 1 report | Full access ✅ | isManager=true | 4 tabs: My Badges, Team, Issuance, Admin |

### 7.2 Migration Test

- Create test users with `role = MANAGER` before migration
- Run Prisma migration
- Verify: role changed to EMPLOYEE, `directReports` relation preserved
- Verify: JWT generation returns `isManager: true` for those users

### 7.3 Backward Compatibility Test

- Generate JWT without `isManager` claim (simulating old token)
- Verify: `JwtStrategy.validate()` returns `isManager: false` (fallback)
- Verify: no errors, user sees Employee-only view

### 7.4 M365 Sync Test

- User in "Badge Issuers" group + has directReports
- Before: `deriveRole` → ISSUER (group wins), directReports ignored for role
- After: `deriveRole` → ISSUER, JWT `isManager: true` from directReports
- Verify: user sees Issuance tab AND Team tab

---

## 8. Implementation Sequence (Sprint 14)

| Step | Task | Effort | Dependencies |
|------|------|--------|-------------|
| 1 | Schema migration: remove MANAGER from enum, migrate data | 2h | None |
| 2 | Backend: `JwtPayload` + `AuthenticatedUser` + `JwtStrategy` update | 2h | Step 1 |
| 3 | Backend: `ManagerGuard` + `@RequireManager()` decorator | 2h | Step 2 |
| 4 | Backend: Update `RolesGuard` comment + remove MANAGER from `@Roles()` decorators | 2h | Step 2 |
| 5 | Backend: M365 sync `deriveRole()` — remove MANAGER branch | 1h | Step 1 |
| 6 | Backend: User management — remove auto-downgrade logic | 1h | Step 1 |
| 7 | Backend: New `/api/users/me/permissions` endpoint | 1h | Step 3 |
| 8 | Backend: Audit log — add manager status tracking | 1h | Step 3 |
| 9 | Frontend: Auth store + types + ProtectedRoute update | 2h | Step 2 |
| 10 | Frontend: Remove all `=== 'MANAGER'` checks, use `isManager` | 2h | Step 9 |
| 11 | Testing: 6-combination test matrix | 2h | Steps 1-10 |
| **Total** | | **~18h** | |

**Note:** Frontend dashboard tabbed view (TD-035-A) and sidebar (TD-035-C) are Sprint 15 work, not Sprint 14. Sprint 14 focuses on the backend model change + minimal frontend type updates to keep the app functional.

---

## 9. Rollback Plan

If issues are discovered post-migration:

1. **Prisma rollback:** `npx prisma migrate revert` — re-adds MANAGER to enum
2. **Data restore:** Re-run `UPDATE users SET role = 'MANAGER' WHERE id IN (select userId from user_role_audit_logs where previousRole = 'MANAGER')`
3. **Code revert:** Git revert the commit
4. **JWT forward-compat:** Old code ignores `isManager` claim (not read), so mixed-version deployment is safe

**Risk Assessment:** LOW — the migration is data-preserving (only enum value changes, relations untouched) and JWT changes are backward-compatible.

---

## 10. ADR-011 Superseded Sections

The following sections in ADR-011 (User Management Architecture) are **superseded** by this ADR:

| ADR-011 Section | Status | Reason |
|-----------------|--------|--------|
| §4.3 Rule 2: Block MANAGER role change with directReports > 0 | ❌ Superseded | MANAGER no longer exists as a role value |
| §4.3 Rule 3: Auto-downgrade on last subordinate removal | ❌ Superseded | No auto-downgrade needed — isManager is derived |
| §3.2 Priority 3: directReports > 0 → MANAGER | ❌ Superseded | M365 sync no longer sets MANAGER role |
| §3.2 Role Priority table row for MANAGER | ❌ Superseded | Replaced by JWT `isManager` claim |

All other sections of ADR-011 remain valid (managerId FK, cycle detection, M365 group sync, etc.).

---

## References

- **ADR-011:** User Management Architecture — `managerId` FK, M365 sync (partially superseded)
- **ADR-015:** UserRole Enum Clean Design — enum = `ADMIN | ISSUER | EMPLOYEE`
- **ADR-016:** Sprint 15 UI Design Decisions — Sidebar, Dashboard tabs, Pagination
- **TD-034:** Technical Debt item — Role Model Refactor
- **TD-035:** Technical Debt item — Dashboard Composite View (Sprint 15)

---

*Accepted unanimously during Sprint 14-16 design review meeting, 2026-02-27.*
*This is the definitive architecture specification for TD-034 implementation.*
