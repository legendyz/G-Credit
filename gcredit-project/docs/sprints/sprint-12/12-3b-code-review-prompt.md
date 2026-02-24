# Code Review Prompt — Story 12.3b: User Management UI + Manual Creation

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-3-user-management-ui-enhancement.md` (ACs #1–18, #22, #33–34, #36–37)
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-3b-dev-prompt.md` (Tasks 1–9)
**Branch:** `sprint-12/management-uis-evidence`
**Commit:** `731e9a8` — `feat(12.3b): user management UI enhancements and manual user creation`
**Base:** `73907d8` (12.3b dev prompt commit)

### Story Summary

Story 12.3b is the UI-heavy sub-story of 12.3 (User Management). It adds:

1. **Source-aware UX** — `source` computed field (`M365` | `LOCAL`) derived from `azureId` presence; `azureId` excluded from API responses (AC #36)
2. **User data table enhancements** — Source badge column, badge count column, context-aware row actions (M365: view + lock only; Local: edit + view + lock + delete) (AC #1, #10, #13)
3. **Enhanced filters** — Source filter (M365/Local/All), 3-state status filter (Active/Locked/Inactive), page size selector (AC #4, #5, #9)
4. **User detail slide-over panel** — Shadcn Sheet component with M365 sync notice + last synced timestamp (AC #8, #14)
5. **Manual local user creation** — `POST /api/admin/users` endpoint, `CreateUserDto`, `CreateUserDialog` form with ADMIN role blocked (AC #15–18, #33)
6. **User deletion** — `DELETE /api/admin/users/:id` with M365 block, self-delete block, subordinate `managerId` cascade (AC #34)
7. **M365 role edit guard** — Backend blocks role changes for M365 users; frontend hides Edit Role for M365 rows (AC #6)
8. **M365 lock notice** — Lock confirmation dialog shows "G-Credit only" notice for M365 users (AC #37)

---

## Scope of Changes

**19 files changed, +1,829 / −62 lines**

### New Backend Files (1 file)

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/admin-users/dto/create-user.dto.ts` | 56 | `CreateUserDto` with class-validator decorators: `@IsEmail`, `@IsEnum(UserRole)`, `@SanitizeHtml`, `@MinLength`/`@MaxLength` |

### Modified Backend Files (5 files)

| File | Change | LOC |
|------|--------|-----|
| `backend/src/admin-users/admin-users.service.ts` | `createUser()`, `deleteUser()`, `mapUserToResponse()`, `getUserSelect()` expanded, M365 role guard in `updateRole()`, source/status filters in `findAll()` | +229 |
| `backend/src/admin-users/admin-users.controller.ts` | `POST /admin/users` (createUser), `DELETE /admin/users/:id` (deleteUser) | +45 |
| `backend/src/admin-users/dto/admin-users-query.dto.ts` | `sourceFilter` (`M365`/`LOCAL`), `statusFilter` changed from boolean to `ACTIVE`/`LOCKED`/`INACTIVE` enum | +20/−10 |
| `backend/src/admin-users/dto/index.ts` | Export `CreateUserDto` | +1 |
| `backend/src/admin-users/admin-users.service.spec.ts` | 12 new tests: source/status filters, M365 role guard, createUser (success, duplicate, ADMIN block), deleteUser (success, M365 block, self block, not found), response mapping | +263 |
| `backend/src/admin-users/admin-users.controller.spec.ts` | Mock data updated with 12.3b fields, service mock methods added | +10 |

### New Frontend Files (6 files)

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/components/admin/CreateUserDialog.tsx` | 300 | Modal form: email, firstName, lastName, department, role (ADMIN excluded), default password notice, focus trap, aria-modal |
| `frontend/src/components/admin/DeleteUserDialog.tsx` | 183 | Destructive confirmation: subordinate warning, self-delete block, audit note |
| `frontend/src/components/admin/UserDetailPanel.tsx` | 192 | Shadcn Sheet slide-over: avatar, account info, M365 sync notice (AC #14), badge count, direct reports count |
| `frontend/src/components/admin/SourceBadge.tsx` | 43 | M365 (blue + Microsoft icon SVG) / LOCAL (gray) badge |
| `frontend/src/components/admin/SourceBadge.test.tsx` | 34 | 3 tests: M365 styling, LOCAL styling, custom className |
| `frontend/src/components/ui/sheet.tsx` | 120 | Shadcn Sheet (Radix Dialog primitive, slide-in/out animations, 4 side variants) |

### Modified Frontend Files (6 files)

| File | Change | LOC |
|------|--------|-----|
| `frontend/src/pages/AdminUserManagementPage.tsx` | Source filter, enhanced status filter, page size selector, "Add User" button, `CreateUserDialog` integration, URL param persistence | +136/−27 |
| `frontend/src/components/admin/UserListTable.tsx` | Source column, badge count column, context-aware actions (view/edit/lock/delete), `DeleteUserDialog` + `UserDetailPanel` integration, mobile card enhancements | +153/−17 |
| `frontend/src/components/admin/EditRoleDialog.tsx` | M365 source guard — returns null if `user.source === 'M365'` | +5 |
| `frontend/src/components/admin/DeactivateUserDialog.tsx` | M365 lock notice — "This will prevent sign-in to G-Credit only" (AC #37) | +10 |
| `frontend/src/lib/adminUsersApi.ts` | `AdminUser` type extended (source, badgeCount, etc.), `createUser()`, `deleteUser()`, `CreateUserRequest`, `statusFilter` type changed, `sourceFilter` added | +60/−4 |
| `frontend/src/hooks/useAdminUsers.ts` | `useCreateUser()`, `useDeleteUser()` mutation hooks with query invalidation | +31 |

---

## Review Checklist

### 1. Architecture & Patterns Compliance

- [ ] **Response mapping pattern:** `mapUserToResponse()` strips `azureId` and `_count` from every user response. Is the `as unknown as Record<string, unknown>` cast safe? Could it mask type errors?
- [ ] **`getUserSelect()` expansion:** 6 new fields added (`azureId`, `lastSyncAt`, `managerId`, `failedLoginAttempts`, `lockedUntil`, `_count`). Does `azureId` need to be selected even though it's stripped? (Yes — needed for `source` computation)
- [ ] **Prisma `_count` usage:** `badgesReceived` is used in `_count.select`. Verify this matches the Prisma schema — is the relation name `badgesReceived` or `issuedBadges`? The dev prompt specified `issuedBadges` but implementation uses `badgesReceived`. **Check schema for correct relation name.**
- [ ] **React Query patterns:** `useCreateUser()` and `useDeleteUser()` invalidate `adminUsersKeys.lists()` on success — correct, consistent with existing `useUpdateUserRole()` pattern.
- [ ] **Modal pattern consistency:** `CreateUserDialog` and `DeleteUserDialog` follow the same custom overlay pattern as `EditRoleDialog` — fixed overlay, focus trap via `useFocusTrap`, `aria-modal`, Escape to close.
- [ ] **apiFetch usage:** `createUser()` and `deleteUser()` use raw `apiFetch` with manual `response.ok` check + `response.json().catch(() => ({}))` — consistent with existing `updateUserRole()` pattern.
- [ ] **URL param persistence:** All new filters (`sourceFilter`, `statusFilter`, `limit`) are persisted to URL search params via `updateUrlParams()` — consistent with existing `roleFilter` pattern.

### 2. Backend — API Response: `mapUserToResponse()` (AC #36)

#### admin-users.service.ts — `mapUserToResponse()`

```typescript
private mapUserToResponse(user: Record<string, unknown>): UserListItem {
  const { azureId, _count, ...rest } = user;
  return {
    ...rest,
    source: azureId ? 'M365' : 'LOCAL',
    sourceLabel: azureId ? 'Microsoft 365' : 'Local Account',
    badgeCount: (_count as { badgesReceived?: number })?.badgesReceived ?? 0,
    directReportsCount: (_count as { directReports?: number })?.directReports ?? 0,
  } as UserListItem;
}
```

- [ ] **`azureId` excluded (AC #36):** Destructured out — `...rest` spread does not include it. ✓
- [ ] **`_count` excluded:** Destructured out — not in response. ✓
- [ ] **`source` computed:** `azureId ? 'M365' : 'LOCAL'` — correct logic. Handles `null`, empty string edge case: `''` would be falsy → `'LOCAL'`. Is this intended? (Probably fine — `azureId` should be `null` or a valid UUID)
- [ ] **Type safety concern:** `user` parameter is `Record<string, unknown>`, requiring multiple `as unknown as` casts at call sites (`findOne`, `createUser`). The `as UserListItem` cast at return suppresses type checking. **Consider defining a raw DB type instead of using `Record<string, unknown>`.**
- [ ] **`badgeCount` source:** Uses `badgesReceived` from `_count`. **Cross-check with Prisma schema** — is the Badge relation on User named `badgesReceived` or `issuedBadges`? A mismatch would silently return `0` for all users.
- [ ] **`directReportsCount` included:** Even though not in dev prompt's initial `UserListItem` spec, it's useful for the delete confirmation dialog. ✓

#### admin-users.service.ts — `getUserSelect()` (expanded)

- [ ] **`azureId: true`** — needed internally for `source` computation, stripped by `mapUserToResponse()`. ✓
- [ ] **`lastSyncAt: true`** — for M365 detail panel. ✓
- [ ] **`managerId: true`** — for future manager display. ✓
- [ ] **`failedLoginAttempts: true`** + **`lockedUntil: true`** — for LOCKED status detection. ✓
- [ ] **`_count: { select: { badgesReceived: true, directReports: true } }`** — badge count + subordinate count. ✓
- [ ] **Performance impact:** Adding `_count` triggers subqueries. For large user lists (1000+ users), does this add meaningful latency? Likely acceptable for admin-only page with pagination.

### 3. Backend — Source & Status Filters (AC #4, #5)

#### admin-users-query.dto.ts

- [ ] **`statusFilter` type change:** `boolean` → `'ACTIVE' | 'LOCKED' | 'INACTIVE'` string enum with `@IsIn()`. **Breaking change** — existing callers sending `true`/`false` will get validation errors. Is backward compat handled?
- [ ] **Backward compat in service:** `findAll()` has an `else if (statusFilter !== undefined)` fallback that casts to boolean: `where.isActive = statusFilter as unknown as boolean`. This looks fragile — `'ACTIVE'` as boolean → `true` (truthy), but `'INACTIVE'` as boolean → also `true` (truthy non-empty string). **Verify this backward compat logic is correct or remove it if no callers use the old API.**
- [ ] **`sourceFilter` validation:** `@IsIn(['M365', 'LOCAL'])` + `@IsOptional()` — correct. ✓
- [ ] **`Transform` removal:** The old `@Transform(({ value }) => value === 'true' || value === true)` for boolean conversion is removed. Import `Transform` is also removed. Correct cleanup. ✓

#### admin-users.service.ts — `findAll()` filter logic

**ACTIVE filter:**
```typescript
if (statusFilter === 'ACTIVE') {
  where.isActive = true;
  where.AND = [
    { OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }] },
    { failedLoginAttempts: { lt: 5 } },
  ];
}
```
- [ ] **Logic correct?** Active = `isActive: true` AND (not locked OR lock expired) AND failed attempts < 5. ✓
- [ ] **`where.AND` vs `where.OR` mixing:** If other filters (like `roleFilter` or `search`) also set `where.AND` or `where.OR`, they could conflict. **Check if `findAll()` has other `where.AND`/`where.OR` usages that could collide with the ACTIVE filter's `where.AND`.**

**LOCKED filter:**
```typescript
} else if (statusFilter === 'LOCKED') {
  where.isActive = true;
  where.OR = [
    { lockedUntil: { gt: new Date() } },
    { failedLoginAttempts: { gte: 5 } },
  ];
}
```
- [ ] **Locked = active but locked out:** `isActive: true` AND (lockedUntil in future OR ≥5 failed attempts). ✓
- [ ] **Potential query conflict:** If `search` filter also uses `where.OR` (common for `firstName OR lastName OR email` search), this `where.OR` would **overwrite** the search OR. **This is a potential bug — verify that `search` and `LOCKED` status filter can coexist.** If `search` also sets `where.OR`, the last one wins (Prisma object merge). Consider using `where.AND = [{ OR: [...search...] }, { OR: [...locked...] }]` instead.

**Source filter:**
```typescript
if (query.sourceFilter === 'M365') {
  where.azureId = { not: null };
} else if (query.sourceFilter === 'LOCAL') {
  where.azureId = null;
}
```
- [ ] **Query correct:** M365 → `azureId` not null; LOCAL → `azureId` is null. ✓
- [ ] **Index coverage:** `azureId` has a unique index (from Prisma `@unique`). Filter should be efficient. ✓

### 4. Backend — M365 Role Guard (AC #6)

#### admin-users.service.ts — `updateRole()`

```typescript
if (currentUser.azureId) {
  throw new BadRequestException(
    'M365 user roles are managed via Security Group membership. ' +
    "To change this user's role, update their Security Group in Azure AD."
  );
}
```

- [ ] **Guard placement:** After `findUnique` (user exists), before `roleVersion` check (optimistic locking). Correct order — no point checking version if role change is blocked. ✓
- [ ] **Select updated:** `select` now includes `azureId: true` — needed for the guard. ✓
- [ ] **Error message quality:** Clear, actionable, tells admin what to do instead. ✓
- [ ] **Security:** Backend enforcement — frontend guard (returning null) is defense-in-depth only. ✓

### 5. Backend — Create User (AC #15, #16, #17, #18, #33)

#### dto/create-user.dto.ts (56 lines)

- [ ] **`@IsEmail()` on `email`** — standard email validation. ✓
- [ ] **`@SanitizeHtml()` on `firstName`, `lastName`, `department`** — XSS prevention. ✓
- [ ] **`@MinLength(1)` + `@MaxLength(100)`** on name fields — prevents empty strings. ✓
- [ ] **`@IsEnum(UserRole)` on `role`** — allows all UserRole values including `ADMIN`. The DTO does NOT restrict to `EMPLOYEE | ISSUER | MANAGER` at the validation level. **The ADMIN block is only in the service layer.** Is this intentional? The `@IsEnum(UserRole)` would allow `ADMIN` past DTO validation, then the service blocks it. This is a valid pattern (validation = type correctness, service = business logic).
- [ ] **`@IsOptional()` on `managerId`** — `@IsString()` but **no `@IsUUID()`** for UUID format validation. A non-UUID `managerId` would pass DTO validation but fail at the Prisma FK constraint. **Consider adding `@IsUUID()` for early validation.**
- [ ] **`department` field:** `@IsOptional()` + `@MaxLength(100)` — consistent with other DTOs. ✓
- [ ] **No `password` field:** Correct — uses `DEFAULT_USER_PASSWORD` from env. ✓

#### admin-users.service.ts — `createUser()`

- [ ] **ADMIN role block (AC #33):** Checked BEFORE email uniqueness — saves a DB query if blocked. ✓
- [ ] **Email uniqueness (AC #17):** `findUnique({ where: { email: dto.email.toLowerCase() } })`. Case-insensitive via `toLowerCase()`. ✓
- [ ] **Email normalization:** `dto.email.toLowerCase()` applied consistently in both the uniqueness check and the `create()` data. ✓
- [ ] **Manager validation:** If `managerId` provided, verifies manager exists. If not found → `BadRequestException`. ✓
- [ ] **Password hashing:** `bcrypt.hash(defaultPassword, 10)` — salt rounds = 10, standard. ✓
- [ ] **`DEFAULT_USER_PASSWORD` fallback:** `process.env.DEFAULT_USER_PASSWORD || 'password123'`. Fallback is only for development — is this documented/acceptable for production? **Consider logging a warning if env var is missing.**
- [ ] **Transaction:** User creation + audit log in `$transaction`. ✓
- [ ] **AC #16 fields:** `azureId: null`, `roleSetManually: true`, `isActive: true`. ✓
- [ ] **Audit log model:** Uses `userRoleAuditLog` (not `userAuditLog` as in dev prompt). **Verify this matches the Prisma schema.** If the model name is wrong, the transaction will fail at runtime.
- [ ] **Audit log action:** `'USER_CREATED'` — is this a recognized action in the `UserRoleAuditLog` model? Check if the model has an enum constraint on `action`.
- [ ] **Return value:** Mapped through `mapUserToResponse()` — `azureId` stripped. ✓
- [ ] **PII in logging:** `this.logger.log('Local user created: ${dto.email.toLowerCase()} (role: ${dto.role}) by admin ${adminId}')` — **includes email (PII)** in logs. AC #38 from 12.3a requires PII-free logging. **This may violate the PII logging policy.** Consider using user ID instead of email.

#### admin-users.controller.ts — `POST /admin/users`

- [ ] **`@Post()` decorator** — maps to `POST /api/admin/users`. ✓
- [ ] **`@HttpCode(HttpStatus.CREATED)`** — returns 201. ✓
- [ ] **`@ApiOperation` + `@ApiResponse`** — Swagger docs for 201, 400, 409. ✓
- [ ] **`@Body() dto: CreateUserDto`** — auto-validated by global validation pipe. ✓
- [ ] **Auth:** Inherits class-level `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`. Admin-only. ✓
- [ ] **Logging in controller:** `this.logger.log('Admin user:${req.user.userId} creating local user ${dto.email}')` — also logs email PII. Same concern as service layer.

### 6. Backend — Delete User (AC #34)

#### admin-users.service.ts — `deleteUser()`

- [ ] **User lookup:** Includes `_count: { select: { directReports: true } }` for subordinate count. ✓
- [ ] **M365 block:** `if (user.azureId)` → 400 "Cannot delete M365 users". ✓
- [ ] **Self-delete block:** `if (userId === adminId)` → 400 "Cannot delete your own account". ✓
- [ ] **Subordinate handling:** Comment says "onDelete: SetNull in schema handles subordinate managerId clearing". **Verify the Prisma schema has `onDelete: SetNull` on the manager relation.** If not, the delete will cascade unexpectedly or throw FK constraint error.
- [ ] **Audit log:** Records `email` and `directReportsCount` in `oldValue`. Email in audit log is PII — is this acceptable for audit trail purposes? (Audit logs typically need PII for accountability, unlike operational logs)
- [ ] **Audit log action:** `'USER_DELETED'` with `newValue: 'DELETED'` — reasonable.
- [ ] **Soft vs hard delete:** Uses `tx.user.delete()` — **hard delete**. The dev prompt specified delete. But consider: is hard delete appropriate? What about related records (badges, audit logs)? Are there FK constraints that would prevent deletion?
- [ ] **No email in log:** `this.logger.log('User ${user.email} deleted by admin ${adminId}')` — **again logs PII (email)**. Same concern.

#### admin-users.controller.ts — `DELETE /admin/users/:id`

- [ ] **`@Delete(':id')` + `@HttpCode(HttpStatus.OK)`** — returns 200. ✓
- [ ] **`@Param('id', ParseUUIDPipe) id: string`** — UUID validation on path parameter. ✓
- [ ] **`@ApiParam` + `@ApiResponse`** — Swagger docs for 200, 400, 404. ✓
- [ ] **Admin-only:** Inherits class-level guards. ✓

### 7. Backend — Tests (12.3b additions)

#### admin-users.service.spec.ts (+263 lines — 12 new tests)

**Source/Status Filters (5 tests):**
- [ ] `sourceFilter: 'M365'` → `where: { azureId: { not: null } }` ✓
- [ ] `sourceFilter: 'LOCAL'` → `where: { azureId: null }` ✓
- [ ] `statusFilter: 'LOCKED'` → verifies `OR` with `failedLoginAttempts: { gte: 5 }` ✓
- [ ] `statusFilter: 'INACTIVE'` → verifies `isActive: false` ✓
- [ ] M365 user mapping → `source: 'M365'`, `sourceLabel: 'Microsoft 365'`, `badgeCount`, `directReportsCount`, no `azureId`, no `_count` ✓

**M365 Role Guard (1 test):**
- [ ] M365 user role change → `BadRequestException`. ✓
- [ ] **Missing test:** Local user role change should still work after the guard is added. Is there an existing test that covers this?

**createUser (3 tests):**
- [ ] Success: local user created with `source: 'LOCAL'`. ✓
- [ ] Duplicate email → `ConflictException`. ✓
- [ ] ADMIN role → `BadRequestException`. ✓
- [ ] **Missing tests:** Invalid managerId (manager not found), managerId validation, transaction audit log creation verification

**deleteUser (4 tests):**
- [ ] Success: local user deleted. ✓
- [ ] M365 user → `BadRequestException`. ✓
- [ ] Self-delete → `BadRequestException`. ✓
- [ ] Not found → `NotFoundException`. ✓
- [ ] **Missing test:** Delete user with subordinates — verify subordinates' `managerId` is set to null (or at least that the delete succeeds)

**`containing` helper:** Tests use `containing()` — verify this is defined in the test file (likely a custom matcher or imported utility).

#### admin-users.controller.spec.ts (+10 lines)

- [ ] Mock `UserListItem` updated with 12.3b fields (`source`, `sourceLabel`, `badgeCount`, etc.). ✓
- [ ] Service mock adds `createUser` and `deleteUser` methods. ✓
- [ ] **No new controller-level tests for createUser/deleteUser endpoints.** Controller tests only update mock data. Endpoint routing and response codes are NOT tested. Consider adding controller-level tests or relying on E2E tests.

### 8. Frontend — AdminUserManagementPage.tsx (AC #2, #4, #5, #9, #12, #15)

- [ ] **Source filter (AC #5):** New `<Select>` with `M365`/`LOCAL`/`ALL` values, persisted to URL params via `handleSourceFilterChange`. ✓
- [ ] **Enhanced status filter (AC #4):** Changed from `all`/`active`/`inactive` to `ALL`/`ACTIVE`/`LOCKED`/`INACTIVE`. ✓
- [ ] **Page size selector (AC #9):** `PAGE_SIZE_OPTIONS = [10, 25, 50, 100]`, state-driven `pageSize`, URL param `limit`. Page resets to 1 on size change. ✓
- [ ] **"Add User" button (AC #15):** In page header actions area, opens `CreateUserDialog`. ✓
- [ ] **`CreateUserDialog` integration:** `isCreateDialogOpen` state, closes via `setIsCreateDialogOpen(false)`. ✓
- [ ] **Constants change:** `PAGE_SIZE = 25` → `DEFAULT_PAGE_SIZE = 25` + state variable. ✓
- [ ] **`queryParams` memo:** Includes `pageSize`, `sourceFilter`, new `statusFilter` format. Dependency array updated. ✓
- [ ] **`hasFilters` check:** Updated to include `sourceFilter !== 'ALL'`. ✓
- [ ] **`resetFilters` reset:** Resets `sourceFilter`, `statusFilter` to `'ALL'`, `pageSize` to `DEFAULT_PAGE_SIZE`. ✓
- [ ] **URL param initialization:** New filters read from `searchParams` with `'ALL'` defaults. ✓
- [ ] **Page size initialization:** `parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)` with `PAGE_SIZE_OPTIONS.includes()` validation. ✓

### 9. Frontend — UserListTable.tsx (AC #1, #10, #13)

**New columns:**
- [ ] **Source column:** `<SourceBadge source={user.source} />` — hidden on tablet (`!isTablet`). ✓
- [ ] **Badge count column:** `user.badgeCount` — hidden on tablet. ✓
- [ ] **Column order (desktop):** Name, Email (hidden tablet), Role, Source, Department, Status, Badges, Last Login, Actions. ✓

**Context-aware actions (AC #10):**

Desktop (table row actions):
- [ ] **All users:** View details (`<Eye>`) + Lock/Unlock. ✓
- [ ] **Local users only:** Edit Role (`<Pencil>`) + Delete (`<Trash2>`). `{user.source === 'LOCAL' && ...}`. ✓
- [ ] **Delete button styling:** `text-red-600 hover:text-red-700 hover:bg-red-50` — destructive visual hint. ✓

Mobile (card actions):
- [ ] **View button replaces Edit Role as primary action:** Mobile "View" button instead of "Edit Role". ✓
- [ ] **Edit Role:** Only shown for `user.source === 'LOCAL'`. ✓
- [ ] **Delete:** Only shown for `user.source === 'LOCAL'`. ✓
- [ ] **Lock/Unlock:** Shown for all users. ✓

**Mobile card:**
- [ ] **SourceBadge in card header:** Next to `RoleBadge`. ✓

**Dialog state management:**
- [ ] **`dialogType` expanded:** `'role' | 'status' | 'delete' | null` — added `'delete'`. ✓
- [ ] **`detailPanelUser`:** Separate state for Sheet panel (independent of dialog state). ✓
- [ ] **`openDeleteDialog()`:** Sets `selectedUser` + `dialogType = 'delete'`. ✓
- [ ] **`openDetailPanel()` / `closeDetailPanel()`:** Manages `detailPanelUser` state. ✓

**Dialog rendering:**
- [ ] **`DeleteUserDialog`:** Rendered when `dialogType === 'delete'`. Passes `currentUserId` and `triggerRef`. ✓
- [ ] **`UserDetailPanel`:** Rendered always (Sheet manages its own open/close via `isOpen`). ✓
- [ ] **Duplicate rendering:** `UserDetailPanel` and `DeleteUserDialog` are rendered in BOTH mobile view AND desktop view code paths. This is a correct pattern — the same dialog/panel is needed in both layouts.

### 10. Frontend — CreateUserDialog.tsx (AC #15, #17, #33)

- [ ] **Form fields:** Email (required), First Name (required), Last Name (required), Department (optional), Role (required, ADMIN excluded). ✓
- [ ] **`ALLOWED_ROLES`:** `['EMPLOYEE', 'ISSUER', 'MANAGER']` — ADMIN excluded. ✓
- [ ] **No `managerId` field:** The dev prompt specified a manager picker, but the implementation omits it. Field is optional in the DTO, so this is acceptable for MVP. **Note: AC #34 subordinate handling still works because `managerId` is set on existing users, not during creation.**
- [ ] **Client-side validation:**
  - Email: required + regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Simple but may miss edge cases (e.g., `user@.com`). Adequate for frontend guard.
  - First/Last Name: required + max 100 chars.
  - Role: required (always has `'EMPLOYEE'` default, so validation never fails).
- [ ] **Form reset:** `useEffect` resets all fields when `isOpen` changes to `true`. ✓
- [ ] **Error handling:** Catches mutation error, checks for `'already exists'` or `'409'` in message → specific toast. Other errors → generic toast. ✓
- [ ] **Default password notice:** Amber info box — "User will be created with the default password." ✓
- [ ] **Loading state:** Button shows "Creating..." and is disabled while `isPending`. ✓
- [ ] **Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="create-user-title"`, focus trap, Escape closes, `aria-invalid`, `aria-describedby` for errors. ✓
- [ ] **Overlay click to close:** `onClick` on overlay checks `e.target === e.currentTarget`. ✓
- [ ] **Focus ring:** All interactive elements have `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`. ✓
- [ ] **Missing: `Textarea` component import** — `DeleteUserDialog` imports `Textarea` from `@/components/ui/textarea`. Verify this component exists.
- [ ] **Dual export:** `export function CreateUserDialog` + `export default CreateUserDialog`. Redundant but harmless.

### 11. Frontend — DeleteUserDialog.tsx (AC #34)

- [ ] **Subordinate warning (AC #34):** Shows amber notice when `directReportsCount > 0`: "This user manages N users. Their manager will be unassigned." ✓
- [ ] **Self-delete block:** Red notice + delete button disabled when `isSelf`. ✓
- [ ] **Audit note:** Optional textarea, max 200 chars with character counter. ✓
- [ ] **`auditNote` not sent:** The `handleConfirm` calls `deleteUserMutation.mutateAsync(user.id)` — only passes `userId`, **not the `auditNote`**. The collected audit note is discarded. **Bug: audit note is not sent to the backend.** The `deleteUser()` API function only takes `userId`, not an audit note object.
- [ ] **Delete API doesn't accept audit note:** The backend `DELETE /admin/users/:id` has no request body — it's a path-only endpoint. If audit notes are desired for deletion, the endpoint needs to accept a body or query parameter. **Either remove the audit note UI or add audit note support to the backend.**
- [ ] **Destructive button variant:** `variant="destructive"` — correct for delete action. ✓
- [ ] **Loading state:** "Deleting..." while `isPending`. ✓
- [ ] **Error handling:** Catches and shows toast. ✓

### 12. Frontend — UserDetailPanel.tsx (AC #8, #14)

- [ ] **Shadcn Sheet:** Uses `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` from `@/components/ui/sheet`. Width: `w-full sm:max-w-md`. ✓
- [ ] **Avatar initials:** First letter of firstName + lastName, uppercased. Falls back to first letter of email. ✓
- [ ] **M365 sync notice (AC #14):** Blue info box — "Identity managed by Microsoft 365. Role assigned via Security Group membership." + relative `lastSyncAt` timestamp. ✓
- [ ] **Local account notice:** Gray info box — "Local Account. Identity managed within G-Credit." ✓
- [ ] **Account info sections:** Role (RoleBadge), Status (StatusBadge), Department, Role Set Manually, Created, Last Login (relative + absolute title), Failed Logins (conditional), Locked Until (conditional). ✓
- [ ] **Badge count:** `Badge` component showing `{user.badgeCount} badge(s) received`. ✓
- [ ] **Direct reports:** Shows count when `> 0`. ✓
- [ ] **date-fns usage:** `format` and `formatDistanceToNow` — verify `date-fns` is in frontend dependencies.
- [ ] **No action buttons in panel:** The dev prompt mentioned Edit Role / Delete / Lock buttons in the panel. The implementation only shows information — **no action buttons in the detail panel.** This is a design choice — actions are available from the table row. Acceptable for MVP.
- [ ] **`SheetTitle` with `sr-only`:** Title is screen-reader only — the visual header is the avatar + name section. Good accessibility pattern. ✓
- [ ] **`StatusBadge` import:** Imported from `./StatusBadge`. Verify this component exists and accepts `{ isActive: boolean }` props.

### 13. Frontend — SourceBadge.tsx + Tests

#### SourceBadge.tsx (43 lines)
- [ ] **M365 badge:** Blue background (`bg-blue-100 text-blue-800`), Microsoft icon (4-squares SVG), "M365" text. ✓
- [ ] **Local badge:** Gray background (`bg-gray-100 text-gray-700`), just "Local" text. ✓
- [ ] **`data-testid`:** `source-badge-m365` / `source-badge-local` — used in tests. ✓
- [ ] **Dark mode support:** Both variants have dark mode classes. ✓
- [ ] **`aria-hidden="true"`** on SVG icon — correct, text provides meaning. ✓

#### SourceBadge.test.tsx (34 lines — 3 tests)
- [ ] M365 badge: renders, has text, has blue class. ✓
- [ ] LOCAL badge: renders, has text, has gray class. ✓
- [ ] Custom className applied. ✓
- [ ] **Test runner:** Uses `vitest` + `@testing-library/react`. ✓

### 14. Frontend — EditRoleDialog.tsx M365 Guard (AC #6)

```typescript
if (user.source === 'M365') {
  return null;
}
```

- [ ] **Placement:** After `if (!isOpen) return null;` — only checked when dialog would render. ✓
- [ ] **Defense-in-depth:** Backend also blocks via `updateRole()` M365 guard. This is the frontend layer. ✓
- [ ] **UX concern:** The caller (`UserListTable`) already hides the Edit Role button for M365 users. This guard is a safety net — the dialog should never open for M365 users. Correct pattern. ✓

### 15. Frontend — DeactivateUserDialog.tsx M365 Lock Notice (AC #37)

```tsx
{user.source === 'M365' && isDeactivating && (
  <div className="...amber...">
    <p>This will prevent sign-in to G-Credit only.</p>
    <p className="mt-1">To disable their Microsoft 365 account, contact your IT administrator.</p>
  </div>
)}
```

- [ ] **Condition:** Only shows for M365 users AND when deactivating (not when re-activating). ✓
- [ ] **Message content (AC #37):** Clarifies scope — G-Credit only, not M365. ✓
- [ ] **Placement:** After the self-deactivation warning, before the audit note textarea. ✓

### 16. Frontend — Sheet Component

#### sheet.tsx (120 lines — Shadcn)
- [ ] **Standard Shadcn component:** Based on `@radix-ui/react-dialog`. ✓
- [ ] **Side variants:** top, bottom, left, right (default: right). ✓
- [ ] **Animations:** `animate-in`/`animate-out`, slide transitions per side. ✓
- [ ] **Overlay:** `bg-black/80`, fade animations. ✓
- [ ] **Close button:** Top-right X icon with sr-only "Close" label. ✓
- [ ] **Tailwind v4 compatibility:** Uses `cva` for variants. Verify `class-variance-authority` is in dependencies.
- [ ] **`@radix-ui/react-dialog` dependency:** Verify this is installed (Sheet reuses Dialog primitive). ✓ (already used by existing Dialog component)

### 17. Frontend — API Layer + Hooks

#### adminUsersApi.ts changes
- [ ] **`AdminUser` type extended:** 8 new fields (source, sourceLabel, badgeCount, lastSyncAt, managerId, failedLoginAttempts, lockedUntil, directReportsCount). ✓
- [ ] **`AdminUsersQueryParams` changes:** `statusFilter: boolean` → `'ACTIVE' | 'LOCKED' | 'INACTIVE'`, `sourceFilter: 'M365' | 'LOCAL'` added. ✓
- [ ] **`CreateUserRequest` type:** email, firstName, lastName, department?, role, managerId?. ✓
- [ ] **`createUser()` function:** `POST /admin/users`, body JSON, error catch for non-JSON response. ✓
- [ ] **`deleteUser()` function:** `DELETE /admin/users/:id`, error catch. ✓
- [ ] **`getAdminUsers()` query params:** `statusFilter` and `sourceFilter` appended as string params. `statusFilter` no longer does boolean conversion. ✓

#### useAdminUsers.ts additions
- [ ] **`useCreateUser()`:** `useMutation` → `createUser()`, invalidates `lists()` on success. ✓
- [ ] **`useDeleteUser()`:** `useMutation` → `deleteUser(userId)`, invalidates `lists()` on success. ✓
- [ ] **No `onError` handlers:** Error handling is delegated to the calling component (via `.mutateAsync()` try/catch). Consistent with existing pattern. ✓

---

## Potential Issues Identified Pre-Review

### 🔴 P0 — `badgesReceived` vs `issuedBadges` Relation Name Mismatch

**File:** `backend/src/admin-users/admin-users.service.ts` — `getUserSelect()` and `mapUserToResponse()`
**Issue:** The `_count` select uses `badgesReceived` but the dev prompt specified `issuedBadges`. If the Prisma schema names the badge relation differently (e.g., `issuedBadges`, `badges`, or `receivedBadges`), the `_count` query will silently return `undefined` for that field, and `badgeCount` will always be `0`.
**Impact:** HIGH — badge count column shows `0` for all users despite having badges.
**Action:** Cross-check the Prisma schema: `grep -n "badges" schema.prisma` — find the User model's relation to Badge/BadgeIssuance. Verify the relation name matches `badgesReceived`.

### 🔴 P0 — `where.OR` Conflict Between Search and LOCKED Status Filter

**File:** `backend/src/admin-users/admin-users.service.ts` — `findAll()`
**Issue:** The `LOCKED` status filter sets `where.OR = [...]`. If the existing search logic also sets `where.OR` (for `firstName OR lastName OR email` matching), the last assignment wins — the search OR would be overwritten by the LOCKED OR (or vice versa). This means searching for a user while LOCKED filter is active may return incorrect results.
**Impact:** HIGH — combined search + LOCKED filter could return wrong results.
**Action:** Check the `findAll()` search implementation. If it uses `where.OR`, refactor both to use `where.AND = [{ OR: [...search] }, { OR: [...locked] }]`.

### 🟡 P1 — Audit Note Not Sent in Delete Request

**File:** `frontend/src/components/admin/DeleteUserDialog.tsx`
**Issue:** The dialog collects an `auditNote` via `<Textarea>` but `handleConfirm` only passes `user.id` to `deleteUserMutation.mutateAsync()`. The backend `DELETE /admin/users/:id` endpoint has no request body. The audit note is collected but never transmitted.
**Impact:** Medium — misleading UX. Admin enters a note thinking it's recorded, but it's discarded.
**Action:** Either (a) remove the audit note UI from the delete dialog, or (b) add request body support to the DELETE endpoint and pass the note through.

### 🟡 P1 — PII in Operational Logs

**Files:** `admin-users.service.ts` (`createUser`, `deleteUser`), `admin-users.controller.ts` (`createUser`, `deleteUser`)
**Issue:** `this.logger.log()` calls include `dto.email` and `user.email` — user email is PII. AC #38 (from 12.3a) requires PII-free logging. While AC #38 technically belongs to 12.3a (M365 sync), the principle should apply to new endpoints too.
**Impact:** Medium — PII exposure in server logs. May violate GDPR / data protection policies.
**Action:** Replace email with user ID in log messages: `'Local user created: ${created.id} (role: ${role}) by admin ${adminId}'`.

### 🟡 P1 — `managerId` Missing UUID Validation in CreateUserDto

**File:** `backend/src/admin-users/dto/create-user.dto.ts`
**Issue:** `managerId` has `@IsOptional()` + `@IsString()` but no `@IsUUID()` decorator. A non-UUID string (e.g., `"abc"`) would pass DTO validation but fail at the Prisma FK constraint with an unhelpful error.
**Impact:** Low-Medium — poor error messages for invalid manager IDs.
**Action:** Add `@IsUUID()` decorator after `@IsString()`.

### 🟡 P1 — `statusFilter` Backward Compatibility Fragility

**File:** `backend/src/admin-users/admin-users.service.ts` — `findAll()`
**Issue:** The backward compat fallback `where.isActive = statusFilter as unknown as boolean` doesn't work correctly for string values — `'ACTIVE'` as boolean is `true` (truthy), but so is `'INACTIVE'` (non-empty string is truthy in JS). This means old callers sending any string would get `isActive: true`.
**Impact:** Low — only affects callers using the old boolean API (if any exist outside the admin frontend).
**Action:** Remove the backward compat branch if no other callers use the old boolean format, or fix the cast logic.

### 🟡 P1 — Hard Delete May Fail on FK Constraints

**File:** `backend/src/admin-users/admin-users.service.ts` — `deleteUser()`
**Issue:** `tx.user.delete()` performs a hard delete. If the user has related records (badges received, badge issuances, audit logs, etc.) that don't have `onDelete: Cascade` or `onDelete: SetNull`, the delete will throw a Prisma FK constraint error.
**Impact:** Medium — delete may fail unpredictably for users with badges/activity.
**Action:** Check the Prisma schema for all relations pointing to User. Verify `onDelete` behavior for: badges, badge issuances, audit logs, sessions, etc. Consider soft delete (`isActive: false, isDeleted: true`) instead of hard delete.

### 🟢 P2 — No Frontend Tests for CreateUserDialog, DeleteUserDialog, UserDetailPanel

**Issue:** Only `SourceBadge.test.tsx` is added. No tests for the three major new components (CreateUserDialog, DeleteUserDialog, UserDetailPanel). The dev prompt specified tests for these.
**Impact:** Low for MVP — manual testing covers functionality. But reduces regression confidence.
**Action:** Document as follow-up. At minimum, add tests for: (a) CreateUserDialog form validation, (b) DeleteUserDialog subordinate warning, (c) UserDetailPanel M365 notice.

### 🟢 P2 — Type Safety: `as unknown as Record<string, unknown>` Casts

**File:** `backend/src/admin-users/admin-users.service.ts`
**Issue:** Multiple `as unknown as Record<string, unknown>` casts when calling `mapUserToResponse()`. This bypasses TypeScript's type checking entirely. If the Prisma select shape changes, the cast would hide type mismatches.
**Impact:** Low — code works but loses compile-time safety for response mapping.
**Action:** Define a `RawUserFromDb` interface matching `getUserSelect()` shape and use it instead of `Record<string, unknown>`.

---

## Acceptance Criteria Verification Matrix

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | Data table with source column, badge count | ✅ | `UserListTable.tsx`: Source + Badges columns added |
| 2 | Search by name or email (debounced 300ms) | ✅ | `AdminUserManagementPage.tsx`: existing `useDebounce(search, 300)` |
| 3 | Filter by role | ✅ | Existing role dropdown — unchanged |
| 4 | Filter by status (Active/Locked/Inactive) | ✅ | `AdminUserManagementPage.tsx`: 3-state status filter, backed by `findAll()` enum logic |
| 5 | Filter by source (M365/Local/All) | ✅ | `AdminUserManagementPage.tsx`: source filter dropdown, backed by `azureId` filter in `findAll()` |
| 6 | Edit local user role only (M365 blocked) | ✅ | Backend: `updateRole()` M365 azureId guard. Frontend: `EditRoleDialog` returns null for M365, button hidden for M365 |
| 7 | Lock/unlock any user | ✅ | Lock/Unlock button shown for all users (M365 + Local) |
| 8 | User detail slide-over panel | ✅ | `UserDetailPanel.tsx`: Sheet with avatar, account info, source, badges, direct reports |
| 9 | Pagination with page size selector | ✅ | `AdminUserManagementPage.tsx`: `PAGE_SIZE_OPTIONS = [10, 25, 50, 100]` |
| 10 | Context-aware row actions | ✅ | `UserListTable.tsx`: M365 → view + lock; Local → edit + view + lock + delete |
| 11 | Role change confirmation dialog | ✅ | Existing `EditRoleDialog` — unchanged |
| 12 | Route `/admin/users` | ✅ | Existing route — unchanged |
| 13 | Source badge (M365 blue/Local gray) | ✅ | `SourceBadge.tsx`: blue with Microsoft icon / gray |
| 14 | M365 detail panel: sync notice + last synced | ✅ | `UserDetailPanel.tsx`: "Identity managed by Microsoft 365" + `lastSyncAt` relative time |
| 15 | Create local user via dialog | ✅ | `CreateUserDialog.tsx`: form with validation, `POST /admin/users` |
| 16 | Created user: `azureId = null`, `roleSetManually = true` | ✅ | `createUser()`: explicitly sets both fields |
| 17 | Email uniqueness (409/400) | ✅ | `createUser()`: `findUnique({ email })` → `ConflictException` |
| 18 | New endpoint: `POST /api/admin/users` | ✅ | `admin-users.controller.ts`: `@Post()` with CreateUserDto |
| 22 | Seed data: admin bootstrap | ⚪ | Not visible in diff — seed file not changed in this commit. Verify separately |
| 33 | CreateUserDto validation | ✅ | `create-user.dto.ts`: class-validator decorators |
| 34 | Delete manager → subordinate managerId null + UI warning | ✅ | Backend: `onDelete: SetNull` + `deleteUser()`. Frontend: `DeleteUserDialog` shows subordinate count warning |
| 36 | API excludes `azureId`, returns `source` | ✅ | `mapUserToResponse()`: strips `azureId`, computes `source` |
| 37 | M365 lock notice: "G-Credit only" | ✅ | `DeactivateUserDialog.tsx`: amber notice for M365 + deactivating |

**Summary:** 19/20 12.3b ACs verified in code. AC #22 (seed data) not verifiable from diff — requires separate check.

---

## Key Files for Review

| Priority | File | Lines | Focus |
|----------|------|-------|-------|
| 🔴 HIGH | `admin-users.service.ts` | +229 | `mapUserToResponse()` type safety, `_count.badgesReceived` relation name, `findAll()` OR conflict with search, `createUser()` ADMIN guard + email normalization, `deleteUser()` hard delete + FK constraints, PII logging |
| 🔴 HIGH | `admin-users.service.spec.ts` | +263 | 12 new tests — coverage completeness, mock setup for `$transaction`, `containing()` helper |
| 🟡 MED | `AdminUserManagementPage.tsx` | +136/−27 | Source filter, status filter, page size selector, URL param sync, Create dialog integration |
| 🟡 MED | `UserListTable.tsx` | +153/−17 | Context-aware actions, new columns, mobile card updates, dialog state management |
| 🟡 MED | `CreateUserDialog.tsx` | 300 | Form validation, error handling, accessibility, missing managerId picker |
| 🟡 MED | `DeleteUserDialog.tsx` | 183 | Subordinate warning, audit note not sent (bug), self-delete |
| 🟡 MED | `UserDetailPanel.tsx` | 192 | M365 sync notice, date formatting, Sheet integration |
| 🟡 MED | `admin-users-query.dto.ts` | +20/−10 | `statusFilter` type change, backward compat risk |
| 🟡 MED | `admin-users.controller.ts` | +45 | POST/DELETE endpoints, auth guards, Swagger docs |
| 🟢 LOW | `create-user.dto.ts` | 56 | Decorators, missing `@IsUUID()` on managerId |
| 🟢 LOW | `adminUsersApi.ts` | +60/−4 | Type extensions, API functions |
| 🟢 LOW | `useAdminUsers.ts` | +31 | Create/Delete mutation hooks |
| 🟢 LOW | `EditRoleDialog.tsx` | +5 | M365 guard — return null |
| 🟢 LOW | `DeactivateUserDialog.tsx` | +10 | M365 lock notice |
| 🟢 LOW | `SourceBadge.tsx` + test | 77 | Badge component + 3 tests |
| 🟢 LOW | `sheet.tsx` | 120 | Standard Shadcn component |
| 🟢 LOW | `admin-users.controller.spec.ts` | +10 | Mock data update |

---

## Review Execution Guide

1. **Read Story file** — focus on ACs #1–18, #22, #33–34, #36–37 (12.3b scope)
2. **Verify critical issue first:**
   - **`badgesReceived` relation name:** `grep -n "badges" backend/prisma/schema.prisma` — compare with `getUserSelect()` usage
   - **`where.OR` conflict:** Read `findAll()` search implementation — check if `where.OR` is used for text search
3. **Start with HIGH priority files:**
   - `admin-users.service.ts` — trace `mapUserToResponse()` + `createUser()` + `deleteUser()` + filter logic
   - `admin-users.service.spec.ts` — verify 12 new tests cover all paths
4. **Verify security:**
   - `azureId` never appears in any API response (check `mapUserToResponse` calls)
   - M365 role guard in both backend (`updateRole`) and frontend (`EditRoleDialog`, `UserListTable`)
   - ADMIN role blocked in `createUser()` service layer
   - PII logging in `createUser()` / `deleteUser()` — assess severity
5. **Check frontend components:**
   - `CreateUserDialog` — form validation, ADMIN excluded, default password notice
   - `DeleteUserDialog` — audit note not sent bug, subordinate warning
   - `UserDetailPanel` — M365 notice with `lastSyncAt`
   - `UserListTable` — context-aware actions for both mobile and desktop
6. **Run tests:**
   ```bash
   cd gcredit-project/backend && npx jest src/admin-users --verbose --forceExit
   cd gcredit-project/backend && npx tsc --noEmit
   cd gcredit-project/frontend && npx tsc --noEmit
   cd gcredit-project/frontend && npx vitest run src/components/admin/SourceBadge.test.tsx
   ```
7. **Manual verification (if environment available):**
   - `GET /admin/users` — verify `source` field present, `azureId` absent
   - `GET /admin/users?sourceFilter=M365` — only M365 users returned
   - `GET /admin/users?statusFilter=LOCKED` — only locked users returned
   - `GET /admin/users?search=john&statusFilter=LOCKED` — verify combined filter works (OR conflict check)
   - `POST /admin/users` with `role: ADMIN` → 400
   - `POST /admin/users` with duplicate email → 409
   - `PATCH /admin/users/:m365UserId/role` → 400 "Security Group"
   - `DELETE /admin/users/:m365UserId` → 400 "Cannot delete M365"
   - `DELETE /admin/users/:selfId` → 400 "Cannot delete your own"
   - Verify page size selector changes query results count
   - Verify source filter + role filter work together
