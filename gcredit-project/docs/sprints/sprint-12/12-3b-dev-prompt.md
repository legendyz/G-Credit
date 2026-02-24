# Dev Prompt: Story 12.3b — User Management UI + Manual Creation

**Story:** 12.3b (14h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Depends On:** Story 12.3a ACCEPTED (schema + sync — commits `9a25791`, `b63c60d`)
**Base Commit:** `8fb2e49` (12.3a SM acceptance)

---

## Objective

Enhance the Admin User Management page with source-aware UX (M365 vs Local), user detail slide-over panel, manual local user creation, and security hardening. The page should show contextual controls based on user source: M365 users get view + lock only; local users get full CRUD. The `managerId` FK and M365 sync infrastructure from 12.3a are in place — this story builds the UI layer on top.

---

## Acceptance Criteria (12.3b scope)

From the story doc — ACs owned by 12.3b:

| AC# | Summary |
|-----|---------|
| **1** | Admin can view all users in a data table with: name, email, role, status, **source (M365/Local)**, badge count, last active |
| **2** | Admin can search users by name or email (debounced 300ms) |
| **3** | Admin can filter by role (Admin/Issuer/Manager/Employee) |
| **4** | Admin can filter by status (Active/Locked/Inactive) |
| **5** | Admin can filter by source (M365/Local/All) |
| **6** | Admin can edit a **local** user's role via edit dialog (role edit disabled for M365 users) |
| **7** | Admin can lock/unlock **any** user account (M365 or Local) |
| **8** | Admin can view user detail slide-over panel (profile info + badge summary + activity + source indicator) |
| **9** | Table supports pagination with page size selector |
| **10** | Row hover reveals action buttons — **contextual** per source (M365: view + lock only; Local: edit + view + lock + delete) |
| **11** | Role change requires confirmation dialog |
| **12** | Route: `/admin/users` (enhance existing page) |
| **13** | User source badge: `M365` (blue Microsoft icon) or `Local` (gray icon) |
| **14** | M365 user detail panel shows: "Identity managed by Microsoft 365. Role assigned via Security Group." + last sync timestamp |
| **15** | Admin can create a local user via "Add User" dialog |
| **16** | Created user has `azureId = null`, `roleSetManually = true` |
| **17** | Email uniqueness enforced (400/409 if already exists) |
| **18** | New backend endpoint: `POST /api/admin/users` |
| **22** | Seed data: keep only `admin@gcredit.com` as bootstrap seed (other demo users optional for dev env) |
| **33** | `POST /api/admin/users` validates via `CreateUserDto` |
| **34** | Delete local user who is manager → `managerId = null` on subordinates; UI confirms with subordinate count |
| **36** | API responses MUST exclude `azureId` raw value; return computed `source` field only |
| **37** | Lock confirmation for M365 users includes notice about M365 vs G-Credit scope |

---

## Current Codebase State

### What Exists (from previous sprints + 12.3a)

**Backend:**
- `admin-users.service.ts` (536 lines) — `findAll()`, `findOne()`, `updateRole()`, `updateStatus()`, `updateDepartment()`. No `createUser()`.
- `admin-users.controller.ts` (189 lines) — GET `/admin/users`, GET `/admin/users/:id`, PATCH `.../role`, PATCH `.../status`, PATCH `.../department`. No POST endpoint.
- DTOs: `AdminUsersQueryDto`, `UpdateUserRoleDto`, `UpdateUserStatusDto`, `UpdateUserDepartmentDto`. No `CreateUserDto`.
- `admin-users.module.ts` — imports `PrismaModule` only.
- `getUserSelect()` returns: `id, email, firstName, lastName, role, department, isActive, lastLoginAt, roleSetManually, roleUpdatedAt, roleUpdatedBy, roleVersion, createdAt`. Does NOT include `azureId`, `source`, `lastSyncAt`, `managerId`, `badgeCount`.
- Prisma User model now has: `managerId String?`, `manager`, `directReports` (from 12.3a).

**Frontend:**
- `AdminUserManagementPage.tsx` (237 lines) — uses `PageTemplate` (not `AdminPageShell`), has `M365SyncPanel` integrated, filter bar (search + role + status), `UserListTable`, pagination.
- `UserListTable.tsx` (516 lines) — table with columns: Name, Email, Role, Department, Status, Last Login, Actions. No source column. Actions: Edit Role + Deactivate. Mobile card view.
- `EditRoleDialog.tsx` (311 lines) — custom modal overlay pattern (not shadcn Dialog), focus trap, role select, audit note, admin 2-step confirm, optimistic locking.
- `DeactivateUserDialog.tsx` (214 lines) — same modal pattern, toggle activate/deactivate, self-deactivation blocked.
- `RoleBadge.tsx` (53 lines) — ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray.
- `adminUsersApi.ts` (211 lines) — types + API functions. `AdminUser` type does NOT have `source`, `azureId`, `lastSyncAt`, `managerId`, `badgeCount`.
- `useAdminUsers.ts` (88 lines) — hooks: `useAdminUsers`, `useUpdateUserRole`, `useUpdateUserStatus`, `useUpdateUserDepartment`. No `useCreateUser`.
- Shadcn UI available: `dialog.tsx`, `select.tsx`, `input.tsx`, `label.tsx`, `button.tsx`, `badge.tsx`, `table.tsx`, `card.tsx`, `skeleton.tsx`. **NOT installed:** `sheet.tsx` (needed for slide-over panel).

### `.env.example` (already has)
```env
AZURE_ADMIN_GROUP_ID="3403ed09-..."
AZURE_ISSUER_GROUP_ID="7aa2bac0-..."
DEFAULT_USER_PASSWORD="password123"
```

---

## Tasks (1–8)

### Task 1: Backend — API response enhancement (AC: #36, #1, #13, #14)

**Goal:** Add `source`, `sourceLabel`, `lastSyncAt`, `managerId`, and `_count.issuedBadges` to user API responses. **CRITICAL: exclude `azureId` from response.**

**File:** `gcredit-project/backend/src/admin-users/admin-users.service.ts`

**1a. Update `getUserSelect()`:**

```typescript
private getUserSelect() {
  return {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    department: true,
    isActive: true,
    lastLoginAt: true,
    roleSetManually: true,
    roleUpdatedAt: true,
    roleUpdatedBy: true,
    roleVersion: true,
    createdAt: true,
    // 12.3b additions:
    azureId: true,        // INTERNAL ONLY — used to compute `source`, stripped before response
    lastSyncAt: true,     // For M365 user detail panel
    managerId: true,      // For manager display
    failedLoginAttempts: true, // For locked status detection
    lockedUntil: true,    // For locked status detection
    _count: {
      select: {
        issuedBadges: true,  // Badge count column
      },
    },
  };
}
```

**1b. Add response mapping helper:**

```typescript
private mapUserToResponse(user: any): UserListItem {
  const { azureId, _count, ...rest } = user;
  return {
    ...rest,
    source: azureId ? 'M365' : 'LOCAL' as 'M365' | 'LOCAL',
    sourceLabel: azureId ? 'Microsoft 365' : 'Local Account',
    badgeCount: _count?.issuedBadges ?? 0,
    // azureId is intentionally excluded (AC #36 — security)
  };
}
```

**1c. Apply mapping in `findAll()` and `findOne()`:**
- In `findAll()`: map `users` array through `mapUserToResponse()` before returning.
- In `findOne()`: map single user through `mapUserToResponse()` before returning.

**1d. Update `UserListItem` type:**

Add to the interface:
```typescript
source: 'M365' | 'LOCAL';
sourceLabel: string;
badgeCount: number;
lastSyncAt: string | null;
managerId: string | null;
failedLoginAttempts: number;
lockedUntil: string | null;
```

**Verification:** After this task, `GET /admin/users` response items should include `source`, `sourceLabel`, `badgeCount`, `lastSyncAt`, `managerId` but NOT `azureId`.

---

### Task 2: Backend — Source filter + status filter enhancement (AC: #4, #5)

**File:** `gcredit-project/backend/src/admin-users/dto/admin-users-query.dto.ts`

**2a. Add `sourceFilter` to `AdminUsersQueryDto`:**

```typescript
@IsOptional()
@IsIn(['M365', 'LOCAL'])
sourceFilter?: 'M365' | 'LOCAL';
```

**2b. Update `findAll()` in `admin-users.service.ts`:**

In the `where` clause builder, add source filter:
```typescript
if (query.sourceFilter === 'M365') {
  where.azureId = { not: null };
} else if (query.sourceFilter === 'LOCAL') {
  where.azureId = null;
}
```

**2c. Enhance status filter (AC #4):**

The current `statusFilter` is a simple boolean (`isActive`). The story requires 3 states: Active / Locked / Inactive:
- **Active:** `isActive === true` AND NOT locked
- **Locked:** `isActive === true` AND (`lockedUntil > now()` OR `failedLoginAttempts >= 5`)
- **Inactive:** `isActive === false`

Add to `AdminUsersQueryDto`:
```typescript
@IsOptional()
@IsIn(['ACTIVE', 'LOCKED', 'INACTIVE'])
statusFilter?: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
```

Update `findAll()` where clause:
```typescript
if (query.statusFilter === 'ACTIVE') {
  where.isActive = true;
  where.OR = [
    { lockedUntil: null },
    { lockedUntil: { lt: new Date() } },
  ];
  where.failedLoginAttempts = { lt: 5 };
} else if (query.statusFilter === 'LOCKED') {
  where.isActive = true;
  where.OR = [
    { lockedUntil: { gt: new Date() } },
    { failedLoginAttempts: { gte: 5 } },
  ];
} else if (query.statusFilter === 'INACTIVE') {
  where.isActive = false;
}
```

**Note:** The existing `statusFilter` (boolean) should be replaced with the new enum-based filter. Update frontend to send the new values. If the old boolean filter is used elsewhere, keep backward compatibility.

---

### Task 3: Backend — M365 user role guard + lock notice (AC: #6, #37)

**File:** `gcredit-project/backend/src/admin-users/admin-users.service.ts`

**3a. Guard role changes for M365 users (AC #6):**

In `updateRole()`, after fetching the user, add:
```typescript
// Check if user is M365-synced — role managed via Security Group
if (user.azureId) {
  throw new BadRequestException(
    'M365 user roles are managed via Security Group membership. ' +
    'To change this user\'s role, update their Security Group in Azure AD.'
  );
}
```

This must come BEFORE the existing `roleVersion` optimistic locking check.

**3b. The lock behavior (AC #37) is a frontend concern** — the backend `updateStatus()` already works for both M365 and Local users. The M365 notice text ("This will prevent sign-in to G-Credit only...") is added in the frontend dialog (Task 6).

---

### Task 4: Backend — Manual user creation endpoint (AC: #15, #16, #17, #18, #33)

**4a. Create `CreateUserDto`:**

**File:** `gcredit-project/backend/src/admin-users/dto/create-user.dto.ts` (NEW)

```typescript
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';
import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @SanitizeHtml()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @SanitizeHtml()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(100)
  department?: string;

  @ApiProperty({ enum: ['EMPLOYEE', 'ISSUER', 'MANAGER'], example: 'EMPLOYEE' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-manager' })
  @IsOptional()
  @IsString()
  managerId?: string;
}
```

**Note:** `role` validation should exclude `ADMIN` — only `EMPLOYEE`, `ISSUER`, `MANAGER` are allowed for manual creation. Add a custom validator or check in the service layer:
```typescript
if (dto.role === UserRole.ADMIN) {
  throw new BadRequestException('Cannot create users with ADMIN role directly. Use Security Group assignment.');
}
```

**4b. Export from `dto/index.ts`:**

Add `export { CreateUserDto } from './create-user.dto';`

**4c. Add `createUser()` to `admin-users.service.ts`:**

```typescript
async createUser(dto: CreateUserDto, adminId: string): Promise<UserListItem> {
  // 1. Check email uniqueness
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });
  if (existing) {
    throw new ConflictException(`User with email ${dto.email} already exists`);
  }

  // 2. Validate managerId if provided
  if (dto.managerId) {
    const manager = await this.prisma.user.findUnique({
      where: { id: dto.managerId },
    });
    if (!manager) {
      throw new BadRequestException('Selected manager does not exist');
    }
  }

  // 3. Don't allow ADMIN role for manual creation
  if (dto.role === UserRole.ADMIN) {
    throw new BadRequestException(
      'Cannot create users with ADMIN role directly. Use Security Group assignment.'
    );
  }

  // 4. Hash default password
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 5. Create user + audit log in transaction
  const user = await this.prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department || null,
        role: dto.role,
        managerId: dto.managerId || null,
        azureId: null,          // AC #16: local user
        roleSetManually: true,  // AC #16: manual assignment
        isActive: true,
      },
      select: this.getUserSelect(),
    });

    await tx.userAuditLog.create({
      data: {
        userId: created.id,
        action: 'USER_CREATED',
        performedBy: adminId,
        newValue: JSON.stringify({
          email: dto.email.toLowerCase(),
          role: dto.role,
          department: dto.department || null,
        }),
      },
    });

    return created;
  });

  return this.mapUserToResponse(user);
}
```

**4d. Add controller endpoint:**

**File:** `gcredit-project/backend/src/admin-users/admin-users.controller.ts`

```typescript
@Post()
@ApiOperation({ summary: 'Create a local user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@ApiResponse({ status: 409, description: 'Email already exists' })
async createUser(
  @Body() createUserDto: CreateUserDto,
  @Req() req: { user: { userId: string } },
) {
  return this.adminUsersService.createUser(createUserDto, req.user.userId);
}
```

**4e. Add bcrypt import** to `admin-users.service.ts`:
```typescript
import * as bcrypt from 'bcrypt';
```

---

### Task 5: Backend — Delete user with subordinate guard (AC: #34)

**File:** `gcredit-project/backend/src/admin-users/admin-users.service.ts`

**5a. Add `deleteUser()` method:**

```typescript
async deleteUser(userId: string, adminId: string): Promise<{ message: string }> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      azureId: true,
      email: true,
      _count: { select: { directReports: true } },
    },
  });

  if (!user) {
    throw new NotFoundException(`User ${userId} not found`);
  }

  // Cannot delete M365 users — they are managed by Azure AD
  if (user.azureId) {
    throw new BadRequestException(
      'Cannot delete M365 users. Deactivate them instead, or remove from Azure AD.'
    );
  }

  // Cannot delete self
  if (userId === adminId) {
    throw new BadRequestException('Cannot delete your own account');
  }

  await this.prisma.$transaction(async (tx) => {
    // subordinates' managerId will be set to null via onDelete: SetNull
    // (Prisma schema already has onDelete: SetNull on the manager relation)

    // Audit log
    await tx.userAuditLog.create({
      data: {
        userId,
        action: 'USER_DELETED',
        performedBy: adminId,
        oldValue: JSON.stringify({
          email: user.email,
          directReportsCount: user._count.directReports,
        }),
      },
    });

    await tx.user.delete({ where: { id: userId } });
  });

  return { message: 'User deleted successfully' };
}
```

**5b. Add controller endpoint:**

```typescript
@Delete(':id')
@ApiOperation({ summary: 'Delete a local user' })
@ApiResponse({ status: 200, description: 'User deleted' })
@ApiResponse({ status: 400, description: 'Cannot delete M365 user or self' })
async deleteUser(
  @Param('id', ParseUUIDPipe) id: string,
  @Req() req: { user: { userId: string } },
) {
  return this.adminUsersService.deleteUser(id, req.user.userId);
}
```

**5c. Add `getDirectReportsCount()` helper** (for frontend to show confirmation):

Add to `findOne()` response: include `_count: { select: { directReports: true } }` in the select, and map to `directReportsCount` in the response. This lets the frontend show "This user manages X users. Their manager will be unassigned." in the delete confirmation dialog.

---

### Task 6: Frontend — Source badge + enhanced table (AC: #1, #5, #9, #10, #13)

**6a. Update `AdminUser` type in `adminUsersApi.ts`:**

```typescript
export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  roleSetManually: boolean;
  roleUpdatedAt: string | null;
  roleUpdatedBy: string | null;
  roleVersion: number;
  createdAt: string;
  // 12.3b additions:
  source: 'M365' | 'LOCAL';
  sourceLabel: string;
  badgeCount: number;
  lastSyncAt: string | null;
  managerId: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  directReportsCount?: number;
}
```

**6b. Create `SourceBadge.tsx`:**

**File:** `gcredit-project/frontend/src/components/admin/SourceBadge.tsx` (NEW)

```tsx
import { cn } from '@/lib/utils';

interface SourceBadgeProps {
  source: 'M365' | 'LOCAL';
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const isM365 = source === 'M365';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isM365
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        className,
      )}
    >
      {isM365 ? (
        <>
          {/* Microsoft icon — simple SVG or Lucide Cloud icon */}
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z" />
          </svg>
          M365
        </>
      ) : (
        <>Local</>
      )}
    </span>
  );
}
```

**6c. Update `UserListTable.tsx`:**

Add new columns to the table:
- **Source** column → `<SourceBadge source={user.source} />`
- **Badge Count** column → `user.badgeCount` (number)
- Reorder columns: Name, Email, Role, Source, Status, Badge Count, Last Login, Actions

**Context-aware row actions (AC #10):**
```tsx
{/* M365 users: view + lock only */}
{user.source === 'M365' ? (
  <>
    <button onClick={() => openDetailPanel(user)} title="View details">
      <Eye className="h-4 w-4" />
    </button>
    <button onClick={() => openStatusDialog(user)} title={user.isActive ? 'Lock' : 'Unlock'}>
      {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
    </button>
  </>
) : (
  <>
    {/* Local users: edit + view + lock + delete */}
    <button onClick={() => openRoleDialog(user)} title="Edit role">
      <Pencil className="h-4 w-4" />
    </button>
    <button onClick={() => openDetailPanel(user)} title="View details">
      <Eye className="h-4 w-4" />
    </button>
    <button onClick={() => openStatusDialog(user)} title={user.isActive ? 'Lock' : 'Unlock'}>
      {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
    </button>
    <button onClick={() => openDeleteDialog(user)} title="Delete user" className="text-red-600">
      <Trash2 className="h-4 w-4" />
    </button>
  </>
)}
```

**6d. Source filter in `AdminUserManagementPage.tsx` (AC #5):**

Add a Source filter dropdown next to the existing Role and Status filters:
```tsx
<Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
  <SelectTrigger className="w-[130px]">
    <SelectValue placeholder="Source" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ALL">All Sources</SelectItem>
    <SelectItem value="M365">M365</SelectItem>
    <SelectItem value="LOCAL">Local</SelectItem>
  </SelectContent>
</Select>
```

Update `AdminUsersQueryParams` type and `useAdminUsers()` call to pass `sourceFilter`.

**6e. Enhance status filter (AC #4):**

Replace the boolean status filter with a 3-option dropdown:
```tsx
<Select value={statusFilter} onValueChange={handleStatusFilterChange}>
  <SelectTrigger className="w-[140px]">
    <SelectValue placeholder="Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ALL">All Status</SelectItem>
    <SelectItem value="ACTIVE">Active</SelectItem>
    <SelectItem value="LOCKED">Locked</SelectItem>
    <SelectItem value="INACTIVE">Inactive</SelectItem>
  </SelectContent>
</Select>
```

**6f. Page size selector (AC #9):**

Add page size selector near pagination:
```tsx
<Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
  <SelectTrigger className="w-[80px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="10">10</SelectItem>
    <SelectItem value="25">25</SelectItem>
    <SelectItem value="50">50</SelectItem>
    <SelectItem value="100">100</SelectItem>
  </SelectContent>
</Select>
```

Update the `PAGE_SIZE` constant to be state-driven instead of hardcoded.

---

### Task 7: Frontend — User detail slide-over panel + Create User dialog (AC: #8, #14, #15, #34, #37)

**7a. Install Shadcn Sheet component:**

```bash
cd gcredit-project/frontend && npx shadcn@latest add sheet
```

This creates `src/components/ui/sheet.tsx`.

**7b. Create `UserDetailPanel.tsx`:**

**File:** `gcredit-project/frontend/src/components/admin/UserDetailPanel.tsx` (NEW, ~200–250 lines)

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
```

**Sections:**
1. **Header:** Avatar (initials), full name, email, `<SourceBadge />`
2. **Account Info:** Role badge, Status badge, Department, Manager name, Created date, Last login
3. **Source section (AC #14):**
   - M365 users: Info badge — "Identity managed by Microsoft 365. Role assigned via Security Group." + `Last Synced: {lastSyncAt formatted}`
   - Local users: "Local Account — identity managed within G-Credit."
4. **Badge Summary:** Badge count + link to badge list
5. **Actions:** Lock/Unlock switch (all users), Edit Role button (local only), Delete button (local only with subordinate warning)

**Props:**
```typescript
interface UserDetailPanelProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}
```

**M365 info display (AC #14):**
```tsx
{user.source === 'M365' && (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
    <p className="font-medium">Identity managed by Microsoft 365</p>
    <p className="mt-1 text-blue-600">
      Role assigned via Security Group membership.
    </p>
    {user.lastSyncAt && (
      <p className="mt-1 text-blue-500 text-xs">
        Last synced: {formatDistanceToNow(new Date(user.lastSyncAt), { addSuffix: true })}
      </p>
    )}
  </div>
)}
```

**7c. Create `CreateUserDialog.tsx`:**

**File:** `gcredit-project/frontend/src/components/admin/CreateUserDialog.tsx` (NEW, ~250–300 lines)

Follow the existing modal overlay pattern from `EditRoleDialog.tsx` (custom overlay, focus trap, `aria-modal`).

**Form fields:**
- Email (required, input type="email")
- First Name (required, max 100)
- Last Name (required, max 100)
- Department (optional, max 100)
- Role (select: EMPLOYEE / ISSUER / MANAGER — no ADMIN option)
- Manager (search/select existing user — optional)

**Manager picker pattern:**
- Simple select with search. Query `GET /admin/users?limit=100&sortBy=name&sortOrder=asc` to get user list.
- Or a simpler approach: text input with datalist-style autocomplete.
- Show display name + role in the option.

**Form validation (client-side):**
- Email: required, valid email format
- First Name: required, 1-100 chars
- Last Name: required, 1-100 chars
- Role: required, one of EMPLOYEE/ISSUER/MANAGER
- Manager: optional UUID

**On submit:**
- Call `createUser()` API function
- On success: `toast.success('User created successfully')`, close dialog, invalidate user list
- On error (409): `toast.error('A user with this email already exists')`
- On error (400): display validation errors

**Note about default password:** The dialog should show a notice: "User will be created with the default password. They should change it on first login."

**7d. Create `DeleteUserDialog.tsx`:**

**File:** `gcredit-project/frontend/src/components/admin/DeleteUserDialog.tsx` (NEW, ~150 lines)

Follow the `DeactivateUserDialog.tsx` pattern.

**Key logic:**
- Only shown for local users (`source === 'LOCAL'`)
- If user has `directReportsCount > 0`: "This user manages {N} users. Their manager will be unassigned."
- Self-delete blocked
- Destructive button variant
- Audit note optional

**M365 user lock notice (AC #37):**

In `DeactivateUserDialog.tsx`, add M365-specific notice when locking:
```tsx
{user.source === 'M365' && !user.isActive === false && (
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
    <p>This will prevent sign-in to G-Credit only.</p>
    <p className="mt-1">To disable their Microsoft 365 account, contact your IT administrator.</p>
  </div>
)}
```

---

### Task 8: Frontend — API layer + hooks + integration (AC: #2, #3, #6, #7, #11, #12)

**8a. Add API functions to `adminUsersApi.ts`:**

```typescript
// Create local user
export async function createUser(data: CreateUserRequest): Promise<AdminUser> {
  const response = await apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }
  return response.json();
}

// Delete user
export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await apiFetch(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
  return response.json();
}

// Types
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  role: UserRole;
  managerId?: string;
}
```

**8b. Add hooks to `useAdminUsers.ts`:**

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
    },
  });
}
```

**8c. Update `AdminUsersQueryParams`:**

```typescript
export interface AdminUsersQueryParams {
  page?: number;
  limit?: number;  // Now driven by page size selector
  search?: string;
  roleFilter?: UserRole;
  statusFilter?: 'ACTIVE' | 'LOCKED' | 'INACTIVE';  // Changed from boolean
  sourceFilter?: 'M365' | 'LOCAL';  // NEW
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}
```

**8d. Integrate in `AdminUserManagementPage.tsx`:**

Add state + controls:
```typescript
const [sourceFilter, setSourceFilter] = useUrlParam('source', '');
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
```

Add "Create User" button in the page header/actions area:
```tsx
<Button onClick={() => setIsCreateDialogOpen(true)}>
  <UserPlus className="h-4 w-4 mr-2" />
  Add User
</Button>
```

Wire up dialogs:
```tsx
<CreateUserDialog
  isOpen={isCreateDialogOpen}
  onClose={() => setIsCreateDialogOpen(false)}
/>
<UserDetailPanel
  user={selectedUser}
  isOpen={isDetailPanelOpen}
  onClose={() => { setIsDetailPanelOpen(false); setSelectedUser(null); }}
  currentUserId={currentUser.id}
/>
```

**8e. EditRoleDialog M365 guard (AC #6):**

In `EditRoleDialog.tsx`, add early return / disabled state when user is M365:
```tsx
// This dialog should never open for M365 users (caller should check)
// But as safety net:
if (user.source === 'M365') {
  return null; // Or show info message
}
```

The row actions in `UserListTable.tsx` should not show the Edit Role button for M365 users (handled in Task 6c).

---

### Task 9: Tests (AC: all 12.3b ACs)

**9a. Backend tests** — `admin-users.service.spec.ts`:

Add tests for:
- `createUser()`: successful creation, duplicate email 409, invalid managerId 400, ADMIN role blocked 400, `azureId = null` + `roleSetManually = true` verification, audit log creation
- `deleteUser()`: successful delete, M365 user delete blocked 400, self-delete blocked 400, user not found 404, subordinate count in audit log
- `updateRole()` M365 guard: M365 user role change blocked 400
- `findAll()` source filter: `sourceFilter: 'M365'` returns only M365 users, `sourceFilter: 'LOCAL'` returns only local users
- `findAll()` status filter: ACTIVE/LOCKED/INACTIVE filter variants
- Response mapping: `azureId` excluded from response, `source` field computed correctly

**9b. Frontend tests:**

**`UserListTable.test.tsx`** (or update existing):
- Source badge renders for M365 / Local users
- Context-aware actions: M365 user shows view+lock only; Local shows edit+view+lock+delete
- Badge count column renders

**`CreateUserDialog.test.tsx`**:
- Form renders all fields
- Email validation (required, format)
- Role dropdown excludes ADMIN
- Submit calls createUser API
- Duplicate email shows error toast
- Default password notice shown

**`UserDetailPanel.test.tsx`**:
- M365 user shows "Identity managed by Microsoft 365" notice
- Local user does NOT show M365 notice
- Last sync timestamp shown for M365 users
- Edit controls disabled for M365 users

**`DeleteUserDialog.test.tsx`**:
- Subordinate warning shown when `directReportsCount > 0`
- Self-delete blocked
- Confirm triggers delete API

**`SourceBadge.test.tsx`**:
- `source='M365'` renders blue badge with M365 text
- `source='LOCAL'` renders gray badge with Local text

---

## File Summary

### New Files
| File | Purpose | Est. Lines |
|------|---------|------------|
| `backend/src/admin-users/dto/create-user.dto.ts` | Create user DTO with validation | ~45 |
| `frontend/src/components/admin/SourceBadge.tsx` | M365/Local source badge | ~40 |
| `frontend/src/components/admin/UserDetailPanel.tsx` | Slide-over detail panel | ~250 |
| `frontend/src/components/admin/CreateUserDialog.tsx` | Create local user dialog | ~280 |
| `frontend/src/components/admin/DeleteUserDialog.tsx` | Delete user confirmation dialog | ~150 |
| `frontend/src/components/ui/sheet.tsx` | Shadcn Sheet (installed via CLI) | ~auto |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/admin-users/admin-users.service.ts` | Add `createUser()`, `deleteUser()`, `mapUserToResponse()`, update `getUserSelect()`, `findAll()` filters, M365 role guard in `updateRole()` |
| `backend/src/admin-users/admin-users.controller.ts` | Add `POST /admin/users`, `DELETE /admin/users/:id` |
| `backend/src/admin-users/dto/index.ts` | Export `CreateUserDto` |
| `backend/src/admin-users/dto/admin-users-query.dto.ts` | Add `sourceFilter`, enhance `statusFilter` |
| `frontend/src/lib/adminUsersApi.ts` | Add `createUser()`, `deleteUser()`, update `AdminUser` type, add `CreateUserRequest` |
| `frontend/src/hooks/useAdminUsers.ts` | Add `useCreateUser()`, `useDeleteUser()` |
| `frontend/src/pages/AdminUserManagementPage.tsx` | Source filter, status filter enhancement, page size selector, Create User button, detail panel integration |
| `frontend/src/components/admin/UserListTable.tsx` | Source column, badge count column, context-aware actions (M365 vs Local), detail panel trigger, delete action |
| `frontend/src/components/admin/EditRoleDialog.tsx` | M365 user safety guard |
| `frontend/src/components/admin/DeactivateUserDialog.tsx` | M365 lock notice (AC #37) |
| `backend/src/admin-users/admin-users.service.spec.ts` | Tests for createUser, deleteUser, M365 guards, source/status filters |

### Test Files (new or updated)
| File | Tests |
|------|-------|
| `backend/src/admin-users/admin-users.service.spec.ts` | ~12 new tests |
| `frontend/src/components/admin/SourceBadge.test.tsx` | 2 tests |
| `frontend/src/components/admin/CreateUserDialog.test.tsx` | 5-6 tests |
| `frontend/src/components/admin/UserDetailPanel.test.tsx` | 4-5 tests |
| `frontend/src/components/admin/DeleteUserDialog.test.tsx` | 3-4 tests |

---

## Coding Standards Reminder

- **apiFetch patterns:** Use `apiFetch` from `@/lib/apiFetch`. It auto-sets `Content-Type: application/json` for non-FormData bodies.
- **React Query keys:** Use `adminUsersKeys` factory pattern from `useAdminUsers.ts`.
- **Modal pattern:** Follow `EditRoleDialog.tsx` pattern — custom overlay, `useFocusTrap`, `aria-modal`, keyboard handling (Escape to close).
- **Toast:** Use `sonner` — `toast.success()`, `toast.error()`.
- **Role badge colors:** ADMIN=red, ISSUER=blue, MANAGER=purple, EMPLOYEE=gray (all via `RoleBadge` component).
- **Accessibility:** All interactive elements need `min-h-[44px] min-w-[44px]` touch targets, proper `aria-label`, keyboard navigation.
- **Backend validation:** `class-validator` decorators on DTOs, `class-transformer` for type coercion.
- **Audit logging:** All mutating operations create `UserAuditLog` entries within the same transaction.
- **Response mapping:** NEVER expose `azureId` in API responses. Always compute `source` field internally.
- **Import convention:** Absolute imports with `@/` prefix for frontend; relative imports for backend.
- **Error handling:** Backend throws NestJS HTTP exceptions (400, 404, 409); frontend catches and shows toast.

---

## Execution Order

1. **Task 1** (Backend API response) — Foundation: `source` field available for all downstream tasks
2. **Task 2** (Backend filters) — Enables frontend source + status filtering
3. **Task 3** (Backend M365 guard) — Security: blocks M365 role edits
4. **Task 4** (Backend create user) — New endpoint + DTO
5. **Task 5** (Backend delete user) — New endpoint with subordinate handling
6. **Task 6** (Frontend table enhancement) — Source badge, columns, actions
7. **Task 7** (Frontend panels + dialogs) — Detail panel, create dialog, delete dialog, M365 notice
8. **Task 8** (Frontend API + hooks + integration) — Wire everything together
9. **Task 9** (Tests) — Cover all paths

Tasks 1–5 (backend) can be done first as a unit, then Tasks 6–8 (frontend), then Task 9 (tests).

---

## Verification Checklist

After implementation, verify:

- [ ] `GET /admin/users` returns `source: 'M365' | 'LOCAL'` — **no `azureId`** in response
- [ ] `GET /admin/users?sourceFilter=M365` returns only M365 users
- [ ] `GET /admin/users?statusFilter=LOCKED` returns only locked users
- [ ] `PATCH /admin/users/:id/role` for M365 user → 400 error
- [ ] `POST /admin/users` creates user with `azureId: null, roleSetManually: true`
- [ ] `POST /admin/users` with duplicate email → 409
- [ ] `POST /admin/users` with `role: ADMIN` → 400
- [ ] `DELETE /admin/users/:id` for M365 user → 400
- [ ] `DELETE /admin/users/:id` for manager → subordinates' `managerId` set to null
- [ ] M365 user row: view + lock actions only (no edit role, no delete)
- [ ] Local user row: edit + view + lock + delete actions
- [ ] Detail panel for M365 user shows sync notice + last synced
- [ ] Lock dialog for M365 user shows "G-Credit only" notice
- [ ] Page size selector works (10/25/50/100)
- [ ] Source badge renders correctly (blue for M365, gray for Local)
- [ ] All backend tests pass: `npx jest src/admin-users --verbose --forceExit`
- [ ] Frontend type check: `npx tsc --noEmit`
- [ ] Backend type check: `npx tsc --noEmit`
