# Story 8.10: Admin User Management Panel

**Story ID:** Story 8.10  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** HIGH  
**Story Points:** 6  
**Estimated Hours:** 11.5h  
**Status:** Backlog  
**Created:** 2026-02-02

---

## Context

**Problem Identified:** Sprint 7 M365 integration (Story U.2a) syncs users but lacks dynamic role management UI. Currently, roles are assigned via:
1. `.env` file manual mapping (requires service restart)
2. M365 org structure auto-detection (Manager only)
3. Registration API (security vulnerability - should be removed)

**Business Need:** Admins need a UI to manage user roles dynamically without editing configuration files or redeploying the application.

**Security Context:** Security audit (security-audit-sprint-0-7.md) identified role self-assignment on registration as HIGH severity issue. This story provides the proper Admin-controlled role management mechanism.

---

## User Story

**As an** Admin,  
**I want** a user management panel to view all users and assign/modify their roles,  
**So that** I can manage organizational access without editing configuration files or involving developers.

---

## Acceptance Criteria

### AC1: User List Page
**Given** I am logged in as an Admin  
**When** I navigate to `/admin/users`  
**Then** I see a paginated list of all users

**Table Columns:**
- Name (First + Last)
- Email
- Current Role (badge: color-coded)
- Department (from M365 sync)
- Status (Active/Inactive badge)
- Last Login (relative time: "2 days ago")
- Actions (Edit Role, Deactivate)

**Responsive Design (Story 8.5 consistency):**
- Mobile (<640px): Card layout, Name+Role+Actions only, tap to expand
- Tablet (640-1024px): Condensed table, hide Department column
- Desktop (≥1024px): Full table with all columns
- Touch targets: 44×44px minimum for action buttons
- Horizontal scroll on small screens with pinned actions column

**Features:**
- Search by name or email (debounced 300ms)
- Filter by role (dropdown: All, Admin, Issuer, Manager, Employee)
- Filter by status (Active/Inactive toggle)
- Pagination (25 users per page)
- Sort by: Name, Email, Role, Last Login (ascending/descending)
  - Click column header to sort
  - Visual indicator: ↑ (ascending) or ↓ (descending) icon
  - Default: Name ascending
  - Sort state persists in URL query params

**Last Login Display Format:**
- Relative time: "2 hours ago", "3 days ago", "1 month ago"
- Tooltip: Absolute time "Feb 2, 2026 10:30 AM CST"
- Never logged in: "Never" (gray text)
- Format: Using `date-fns` formatDistanceToNow() and format()

**Keyboard Navigation (WCAG 2.1.1):**
- Tab: Navigate through filters → search → table rows → action buttons
- Enter/Space: Activate buttons and open dialogs
- Arrow keys: Navigate table rows when focused
- Shift+Tab: Reverse navigation
- Escape: Close dialogs
- Focus indicators: 3px solid #3B82F6 outline, 2px offset (consistent with Story 8.3)

**Empty State:**
- "No users found" with search/filter reset button

---

### AC2: Edit User Role (Admin Only)
**Given** I am viewing the user list  
**When** I click "Edit Role" on a user row  
**Then** A dialog opens with role selection

**Dialog Contents:**
- User info header (Name, Email, Current Role)
- Role dropdown: Admin, Issuer, Manager, Employee
- Warning message: "Changing role will affect user's access permissions"
- Audit note textarea (optional, max 200 chars): "Reason for role change"
- Cancel / Save buttons

**Accessibility (WCAG 4.1.2):**
- Dialog: `role="dialog"` `aria-modal="true"` `aria-labelledby="edit-role-title"`
- Focus trap: Focus locked inside dialog, Tab cycles through controls
- Focus management: On open → focus role dropdown, On close → return to trigger button
- Escape key: Close dialog

**Validation:**
- Cannot change own role (disabled with tooltip: "You cannot change your own role")
- Confirmation required if demoting Admin to lower role
- Confirmation required if promoting to Admin

**Role Badge Colors (WCAG 1.4.3 - 4.5:1 contrast):**
- Admin: bg-red-100 text-red-800 (verified 7.2:1)
- Issuer: bg-blue-100 text-blue-800 (verified 6.8:1)
- Manager: bg-purple-100 text-purple-800 (verified 5.9:1)
- Employee: bg-gray-100 text-gray-800 (verified 8.1:1)

**Backend:**
```typescript
PATCH /api/admin/users/:id/role
{
  "role": "ISSUER",
  "auditNote": "Promoted to badge issuer for HR department"
}
```

**Response:**
```typescript
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "ISSUER",
  "roleUpdatedAt": "2026-02-02T10:30:00Z",
  "roleUpdatedBy": "admin@example.com"
}
```

**Success Toast:** "Role updated successfully for {user.name}"

---

### AC3: User Deactivation
**Given** I am viewing an active user  
**When** I click "Deactivate" button  
**Then** A confirmation dialog appears

**Confirmation Dialog:**
- Title: "Deactivate User"
- Message: "Are you sure you want to deactivate {user.name}? They will not be able to log in, but their badges will remain valid."
- Audit note textarea (optional)
- Cancel / Confirm buttons

**Note:** Role change confirmations (Admin demotion/promotion) use inline warning in dialog instead of second confirmation to reduce friction

**Backend:**
```typescript
PATCH /api/admin/users/:id/status
{
  "isActive": false,
  "auditNote": "User left organization"
}
```

**Effects:**
- User cannot log in (401 on login attempt)
- Existing JWT tokens remain valid until expiry
- User's issued badges remain valid (not revoked)
- User's claimed badges remain valid
- User appears in list with "Inactive" badge

**Reactivation:**
- Inactive users show "Activate" button instead
- Same confirmation flow

---

### AC4: Role Change Audit Trail
**Given** An admin changes a user's role  
**When** The change is saved  
**Then** An audit log entry is created

**Audit Log Schema (new table):**
```prisma
model UserAuditLog {
  id          String   @id @default(uuid())
  userId      String   // Target user
  performedBy String   // Admin who made the change
  action      String   // 'ROLE_CHANGED' | 'STATUS_CHANGED'
  oldValue    String?  // Old role or status
  newValue    String   // New role or status
  note        String?  @db.Text // Admin's note
  createdAt   DateTime @default(now())

  user        User     @relation("UserAuditTarget", fields: [userId], references: [id], onDelete: Cascade)
  admin       User     @relation("UserAuditPerformer", fields: [performedBy], references: [id], onDelete: Cascade)

  @@map("user_audit_logs")
  @@index([userId])
  @@index([performedBy])
  @@index([createdAt])
}

**Cascading Delete Strategy:**
- If target user deleted → delete all audit logs (onDelete: Cascade)
- If admin deleted → delete audit logs where admin was performer (onDelete: Cascade)
- Rationale: Audit logs are historical records tied to user existence
```

**Audit Log Viewing (Future Sprint):**
- Story 8.10 creates the logs
- Sprint 9+ will add UI to view audit trail

---

### AC5: Role Assignment Priority Logic
**Given** M365 sync runs after Admin manually sets a user's role  
**When** The sync processes the user  
**Then** The manually-set role is preserved

**Database Schema Update:**
```prisma
model User {
  // Existing fields...
  role              Role     @default(EMPLOYEE)
  roleSetManually   Boolean  @default(false) // NEW FIELD
  roleUpdatedAt     DateTime? // NEW FIELD
  roleUpdatedBy     String?  // NEW FIELD (Admin user ID)
  roleVersion       Int      @default(0) // NEW FIELD - Optimistic locking
  lastSyncAt        DateTime? // NEW FIELD - Coordination with Story 8.9
  
  // Existing relations...
  auditLogsTarget   UserAuditLog[] @relation("UserAuditTarget")
  auditLogsPerformer UserAuditLog[] @relation("UserAuditPerformer")
}

**Optimistic Locking Implementation:**
- Increment roleVersion on every role update
- Prisma update: `where: { id: userId, roleVersion: currentVersion }`, `data: { roleVersion: { increment: 1 } }`
- If update affects 0 rows → throw ConflictException "User role was modified by another process. Please refresh and try again."
- Prevents race condition between Admin UI and M365 sync
```

**Updated Role Decision Logic:**
```typescript
// In M365 sync service
async determineUserRole(m365User: M365User, existingUser?: User): Promise<Role> {
  // 1. HIGHEST PRIORITY: Manual role assignment by Admin
  if (existingUser?.roleSetManually) {
    this.logger.log(`Preserving manually-set role for ${m365User.mail}: ${existingUser.role}`);
    return existingUser.role;
  }
  
  // 2. Check .env manual mapping (initial setup only)
  const manualMapping = JSON.parse(process.env.M365_ROLE_MAPPING || '{}');
  if (manualMapping[m365User.mail]) {
    return manualMapping[m365User.mail];
  }
  
  // 3. M365 org structure auto-detection
  if (m365User.directReportsCount > 0) {
    return Role.MANAGER;
  }
  
  // 4. Default to Employee
  return Role.EMPLOYEE;
}
```

---

### AC6: Security & Authorization
**Given** A non-Admin user tries to access user management  
**When** They navigate to `/admin/users`  
**Then** They receive 403 Forbidden

**Backend Endpoints (all Admin-only):**
- `GET /api/admin/users` - List all users with pagination/filtering
- `GET /api/admin/users/:id` - Get single user details
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Activate/deactivate user

**Frontend Route Guard:**
```typescript
// In router configuration
{
  path: '/admin/users',
  element: <AdminRoute><UserManagementPage /></AdminRoute>,
  // AdminRoute checks user.role === 'ADMIN'
}
```

**RBAC Guards:**
```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController { ... }
```

---

## Tasks / Subtasks

### Task 1: Database Schema Updates - 1h
- [ ] Create Prisma migration for User table updates
  - [ ] Add `roleSetManually` Boolean field (default: false)
  - [ ] Add `roleUpdatedAt` DateTime? field
  - [ ] Add `roleUpdatedBy` String? field
  - [ ] Add `roleVersion` Int field (default: 0) - Optimistic locking
  - [ ] Add `lastSyncAt` DateTime? field - M365 sync coordination
- [ ] Create UserAuditLog table
  - [ ] Add indexes on userId, performedBy, createdAt
  - [ ] Add foreign key relations to User table with onDelete: Cascade
- [ ] Run migration: `npx prisma migrate dev --name add-user-management`
- [ ] Generate Prisma client

---

### Task 2: Backend - Admin Users API - 4h

#### Subtask 2.1: Create AdminUsersController (1.25h)
- [ ] Create `src/admin/admin-users.controller.ts`
- [ ] Add `@Roles(Role.ADMIN)` guard to controller
- [ ] Implement `GET /api/admin/users` (list with pagination)
  - [ ] Query params: page, limit, search, roleFilter, statusFilter, cursor, sortBy, sortOrder
  - [ ] Hybrid pagination: Offset (<1000 users) vs Cursor (≥1000 users)
  - [ ] Return: users[], total, page, limit, totalPages, nextCursor?, hasMore?
- [ ] Implement `GET /api/admin/users/:id` (single user)
- [ ] Implement `PATCH /api/admin/users/:id/role` (update role)
- [ ] Implement `PATCH /api/admin/users/:id/status` (activate/deactivate)
- [ ] Add Swagger documentation

#### Subtask 2.2: Create AdminUsersService (1.5h)
- [ ] Create `src/admin/admin-users.service.ts`
- [ ] Implement `findAll()` with pagination/filtering
  - [ ] Prisma query with where clauses
  - [ ] Search: `OR [{ firstName: { contains } }, { lastName: { contains } }, { email: { contains } }]`
  - [ ] Filter by role: `where: { role: roleFilter }`
  - [ ] Filter by status: `where: { isActive: statusFilter }`
- [ ] Implement `updateRole()` with audit logging and optimistic locking
  - [ ] Validate: User exists, requester is not target (cannot change own role)
  - [ ] Optimistic locking: WHERE id AND roleVersion, INCREMENT roleVersion
  - [ ] If 0 rows updated → throw ConflictException (409)
  - [ ] Update: `roleSetManually = true`, `roleUpdatedAt = now()`, `roleUpdatedBy = adminId`
  - [ ] Create audit log entry in same transaction
- [ ] Implement `updateStatus()` with audit logging
  - [ ] Update: `isActive = true/false`
  - [ ] Create audit log entry

#### Subtask 2.3: Create DTOs (0.25h)
- [ ] Create `update-user-role.dto.ts`
  - [ ] role: @IsEnum(Role)
  - [ ] auditNote?: @IsOptional() @MaxLength(200)
- [ ] Create `update-user-status.dto.ts`
  - [ ] isActive: @IsBoolean()
  - [ ] auditNote?: @IsOptional() @MaxLength(200)
- [ ] Create `admin-users-query.dto.ts`
  - [ ] page?: number (default 1)
  - [ ] limit?: number (default 25)
  - [ ] search?: string
  - [ ] roleFilter?: Role
  - [ ] statusFilter?: boolean

#### Subtask 2.4: Update M365 Sync Logic (1.75h)
- [ ] Update `determineUserRole()` in GraphUsersService
- [ ] Add check for `existingUser.roleSetManually`
- [ ] Preserve manually-set roles during sync
- [ ] Add logging: "Preserving manually-set role for {email}"
- [ ] **Add Transaction Boundaries:**
  - [ ] Batch user updates in transactions (100 users per batch)
  - [ ] Wrap each batch in Prisma.$transaction() with 30s timeout
  - [ ] On error: Rollback batch, log failure, continue to next batch
  - [ ] Track success/failure counts in M365SyncLog
- [ ] **Add Conflict Detection:**
  - [ ] Check `lastSyncAt` vs `roleUpdatedAt` before sync
  - [ ] If `roleUpdatedAt > lastSyncAt` → skip role update (manual change wins)
  - [ ] Update `lastSyncAt` after successful sync
  - [ ] Log: "Manual role change detected after last sync, preserving"

---

### Task 3: Frontend - User Management Page - 4.5h

#### Subtask 3.1: User List Component (2h)
- [ ] Create `src/pages/AdminUserManagementPage.tsx`
- [ ] Create `src/components/admin/UserListTable.tsx`
  - [ ] Table columns: Name, Email, Role, Department, Status, Last Login, Actions
  - [ ] Search input (debounced 300ms)
  - [ ] Role filter dropdown (All, Admin, Issuer, Manager, Employee)
  - [ ] Status filter toggle (Active/Inactive)
  - [ ] Pagination controls (TanStack Table)
  - [ ] Sort by column (click header)
- [ ] Create `src/components/admin/RoleBadge.tsx`
  - [ ] Color coding with WCAG contrast: Admin (bg-red-100/text-red-800), Issuer (bg-blue-100/text-blue-800), Manager (bg-purple-100/text-purple-800), Employee (bg-gray-100/text-gray-800)
- [ ] Create `src/components/admin/StatusBadge.tsx`
  - [ ] Active (green), Inactive (gray)
- [ ] **Responsive Design:**
  - [ ] Mobile (<640px): Card layout with Name+Role+Status+Actions
  - [ ] Tablet (640-1024px): Condensed table, hide Department
  - [ ] Desktop (≥1024px): Full table
  - [ ] Touch targets: 44×44px action buttons
- [ ] **Keyboard Navigation:**
  - [ ] Tab order: Filters → Search → Table → Actions
  - [ ] Arrow keys: Navigate table rows
  - [ ] Enter: Activate focused button
  - [ ] Focus indicators: 3px solid #3B82F6, 2px offset
- [ ] **Sort State Persistence:**
  - [ ] Store sortBy/sortOrder in URL query params
  - [ ] Restore sort on page load
  - [ ] Visual indicators: ↑/↓ icons in headers
- [ ] Implement TanStack Query hook: `useAdminUsers()`
  - [ ] Fetch: `GET /api/admin/users?page={page}&limit={limit}&search={search}`
  - [ ] Cache key includes filters

#### Subtask 3.2: Edit Role Dialog (1.25h)
- [ ] Create `src/components/admin/EditRoleDialog.tsx`
- [ ] Dialog trigger: "Edit Role" button in actions column
- [ ] Dialog contents:
  - [ ] User info header (name, email, current role)
  - [ ] Role dropdown (Radix UI Select)
  - [ ] Warning message (conditional on role change)
  - [ ] Audit note textarea (optional)
  - [ ] Cancel / Save buttons
- [ ] **Accessibility (WCAG 4.1.2):**
  - [ ] Dialog attributes: role="dialog", aria-modal="true", aria-labelledby="edit-role-title"
  - [ ] Focus trap: Tab cycles within dialog
  - [ ] Focus management: Open → focus dropdown, Close → return to trigger
  - [ ] Escape key: Close dialog
- [ ] Validation:
  - [ ] Disable if editing own role (show tooltip)
  - [ ] Inline warning (not separate dialog) if demoting Admin: "⚠️ You are demoting an Admin. This will remove their access to user management."
  - [ ] Inline warning if promoting to Admin: "⚠️ This user will gain full administrative access."
- [ ] Implement mutation: `useUpdateUserRole()`
  - [ ] API: `PATCH /api/admin/users/:id/role`
  - [ ] On success: Refetch user list, show toast
  - [ ] On error: Show error toast

#### Subtask 3.3: Deactivate User Dialog (0.5h)
- [ ] Create `src/components/admin/DeactivateUserDialog.tsx`
- [ ] Confirmation dialog:
  - [ ] Title: "Deactivate User"
  - [ ] Message with user name
  - [ ] Audit note textarea (optional)
  - [ ] Cancel / Confirm buttons
- [ ] **Accessibility:**
  - [ ] Dialog attributes: role="dialog", aria-modal="true", aria-labelledby="deactivate-title"
  - [ ] Focus trap and Escape key handling
- [ ] Implement mutation: `useUpdateUserStatus()`
  - [ ] API: `PATCH /api/admin/users/:id/status`
  - [ ] On success: Refetch user list, show toast
  - [ ] On 409 Conflict: Show error "User was modified by another process. Refresh and try again."
  - [ ] On other error: Show error toast
- [ ] Handle reactivation (same dialog, different text)

#### Subtask 3.4: Navigation Integration (0.75h)
- [ ] Add "User Management" link to Admin sidebar (already planned in Story 0.2)
- [ ] Add route to router configuration:
  ```typescript
  {
    path: '/admin/users',
    element: <AdminRoute><AdminUserManagementPage /></AdminRoute>
  }
  ```
- [ ] Create `AdminRoute` component (role guard)
  - [ ] Check `user.role === 'ADMIN'`
  - [ ] Redirect to 403 page if not Admin
- [ ] **Responsive Navigation:**
  - [ ] Mobile: Hamburger menu with "User Management" link
  - [ ] Desktop: Sidebar with "User Management" link
- [ ] **Add date-fns utility:**
  - [ ] Install: `npm install date-fns`
  - [ ] Format Last Login: formatDistanceToNow() with addSuffix: true
  - [ ] Tooltip: format(date, 'MMM d, yyyy h:mm a zzz')

---

### Task 4: Testing - 2h

#### Subtask 4.1: Unit Tests - Backend (0.5h)
- [ ] Test `AdminUsersService.findAll()` with filters
  - [ ] Search by name/email
  - [ ] Filter by role
  - [ ] Filter by status
  - [ ] Pagination
- [ ] Test `AdminUsersService.updateRole()` with audit logging
  - [ ] Happy path: Role updated, audit log created, roleVersion incremented
  - [ ] Error: Cannot change own role
  - [ ] Error: User not found
  - [ ] Error: Optimistic locking conflict (409 Conflict)
- [ ] Test M365 sync transaction boundaries
  - [ ] Batch transaction success (100 users)
  - [ ] Partial failure: Rollback batch, continue to next
  - [ ] Manual role preservation: Skip user with roleSetManually=true
- [ ] Test `AdminUsersService.updateStatus()` with audit logging

#### Subtask 4.2: Unit Tests - Frontend (0.5h)
- [ ] Test `UserListTable` component
  - [ ] Renders user list correctly
  - [ ] Search filters list
  - [ ] Role filter works
  - [ ] Status filter works
  - [ ] Responsive layout: Mobile card view, Desktop table view
  - [ ] Keyboard navigation: Tab order, Enter activates, Arrow keys navigate
  - [ ] Sort state persists in URL
- [ ] Test `EditRoleDialog` component
  - [ ] Opens/closes correctly
  - [ ] ARIA attributes present (role, aria-modal, aria-labelledby)
  - [ ] Focus trap works (Tab cycles within dialog)
  - [ ] Focus management: Open → dropdown, Close → trigger button
  - [ ] Validation: Cannot edit own role
  - [ ] Inline warning on Admin role change (not separate dialog)
- [ ] Test `DeactivateUserDialog` component
  - [ ] Confirmation dialog works
  - [ ] ARIA attributes present
  - [ ] Audit note optional
  - [ ] 409 Conflict error handled with refresh message

#### Subtask 4.3: E2E Tests (1h)
- [ ] Test full user management flow:
  - [ ] Admin logs in → navigates to /admin/users
  - [ ] Sees list of users
  - [ ] Searches for user by email
  - [ ] Clicks "Edit Role" → changes role to Issuer
  - [ ] Sees success toast
  - [ ] Verifies role changed in list
  - [ ] Logs out → logs in as updated user
  - [ ] Verifies new role permissions work
- [ ] Test deactivation flow:
  - [ ] Admin deactivates user
  - [ ] User cannot log in (401 error)
  - [ ] Admin reactivates user
  - [ ] User can log in again
- [ ] Test security:
  - [ ] Non-Admin user cannot access /admin/users (403)
  - [ ] Non-Admin user cannot call PATCH /api/admin/users/:id/role (403)
- [ ] Test race condition handling:
  - [ ] Admin A updates user role → Admin B tries to update same user → B gets 409 error with refresh message
- [ ] Test mobile responsive:
  - [ ] Mobile viewport: Card layout renders, touch targets 44×44px
  - [ ] Desktop viewport: Full table renders
- [ ] Test keyboard navigation:
  - [ ] Tab through entire page, focus indicators visible
  - [ ] Enter key activates Edit Role button
  - [ ] Escape key closes dialog

---

## Technical Details

### API Endpoints

#### GET /api/admin/users
**Query Params:**
- `page?: number` (default: 1)
- `limit?: number` (default: 25, max: 100)
- `search?: string` (searches name, email)
- `roleFilter?: 'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE'`
- `statusFilter?: 'true' | 'false'` (isActive)
- `sortBy?: 'name' | 'email' | 'role' | 'lastLogin'`
- `sortOrder?: 'asc' | 'desc'`
- `cursor?: string` (optional: for cursor-based pagination on large datasets)

**Pagination Strategy (Hybrid):**
- Small datasets (<1000 users): Offset-based (page/limit)
- Large datasets (≥1000 users): Cursor-based (cursor/limit)
- Cursor format: Base64 encoded `{id}_{sortField}_{sortValue}`
- Response includes `nextCursor` and `hasMore` fields
- Frontend switches automatically based on `totalUsers` count

**Response:**
```typescript
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "department": "Engineering",
      "isActive": true,
      "lastLogin": "2026-02-01T15:30:00Z",
      "roleSetManually": false,
      "roleUpdatedAt": null,
      "roleUpdatedBy": null
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

#### PATCH /api/admin/users/:id/role
**Request:**
```typescript
{
  "role": "ISSUER",
  "auditNote": "Promoted to badge issuer for HR department"
}
```

**Response:**
```typescript
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "ISSUER",
  "roleSetManually": true,
  "roleUpdatedAt": "2026-02-02T10:30:00Z",
  "roleUpdatedBy": "admin-user-id"
}
```

**Validation Errors:**
- 400: "Cannot change your own role"
- 400: "Invalid role value"
- 404: "User not found"

#### PATCH /api/admin/users/:id/status
**Request:**
```typescript
{
  "isActive": false,
  "auditNote": "User left organization"
}
```

**Response:**
```typescript
{
  "id": "uuid",
  "email": "user@example.com",
  "isActive": false
}
```

---

## Dependencies

### Blocks (This story blocks):
- None (Sprint 8 can complete without this)

### Blocked By:
- Story 8.0 (Sprint Setup) - Need Prisma migration capability
- Story 8.1 (Dashboard Homepage) - Admin dashboard navigation

### Related Stories:
- Story U.2a (Sprint 7) - M365 user sync (must preserve manually-set roles)
- Story 0.2 (Sprint 7) - Navigation includes "User Management" link
- Story 8.9 (M365 Production Hardening) - **CRITICAL COORDINATION REQUIRED**
  - Both stories update User table (roleVersion, lastSyncAt fields)
  - Story 8.9 M365 sync must check roleSetManually flag before overwriting
  - Story 8.10 manual changes must update roleUpdatedAt/roleVersion
  - Transaction boundaries prevent partial updates
  - Recommend: Complete Story 8.0 migration first, then develop 8.9 and 8.10 in parallel with integration testing

---

## Security Considerations

### Removed Security Vulnerability
This story addresses security audit finding:
- **Finding 3 (HIGH):** Open Registration with Role Assignment
- **Remediation:** Role assignment now only allowed by Admin through this UI

### New Security Features
- Admin-only access (RBAC guards on all endpoints)
- Cannot change own role (prevents privilege escalation)
- Audit trail for all role changes
- Confirmation dialogs for sensitive actions

---

## UX Considerations

### Empty States
- **No users found:** "No users found matching your search"
- **No search results:** "No users found for '{query}'. Try different keywords or clear filters."

### Loading States
- Skeleton loaders for table rows during initial load
- Spinner in dialog during role update
- Optimistic updates (show change immediately, rollback on error)

### Error Handling
- Toast notifications for all errors
- Specific error messages: "Cannot change your own role", "User not found", "Network error"
- Retry button on network errors

---

## Testing Strategy

### Unit Tests
- Backend: Service methods (findAll, updateRole, updateStatus)
- Frontend: Components (UserListTable, EditRoleDialog, DeactivateUserDialog)

### Integration Tests
- Backend: Controller endpoints with RBAC guards
- API: Pagination, filtering, sorting

### E2E Tests
- Full user management flow (search, edit role, deactivate)
- Security: Non-Admin access blocked
- Role preservation during M365 sync

---

## Performance Considerations

### Database Optimization
- Indexes on User table: email, role, isActive, roleUpdatedAt
- Indexes on UserAuditLog table: userId, performedBy, createdAt
- Pagination: Limit queries to 100 users max

### Frontend Optimization
- TanStack Query caching (5-minute cache)
- Debounced search (300ms delay)
- Hybrid pagination: Automatic switch from offset to cursor at 1000 users
- Virtualized table rows (future: if user count > 10,000)

---

## Future Enhancements (Sprint 9+)

### View Audit Trail
- Admin can view full audit history for a user
- Filterable by action type, date range
- Export audit logs to CSV

### Bulk Role Assignment
- Select multiple users
- Change role in bulk (with confirmation)

### Role Templates
- Pre-defined role assignments for departments
- "Assign all HR team as Issuers" button

### Advanced Filters
- Filter by department, last login date
- Filter by badge count, issued badges

---

## Definition of Done

- [ ] All 6 acceptance criteria met (100% completion)
- [ ] Backend API endpoints implemented and tested
- [ ] Frontend UI implemented with all components
- [ ] Prisma migration created and applied
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] E2E tests written and passing
- [ ] Security audit passed (Admin-only access verified)
- [ ] Code review approved
- [ ] Documentation updated (API docs, README)
- [ ] M365 sync logic updated (preserves manual roles)
- [ ] Navigation integrated (Admin sidebar link)
- [ ] No regressions from Sprint 7

---

**Created:** 2026-02-02  
**Created By:** Bob (Scrum Master)  
**Last Updated:** 2026-02-02 (All UX + Architecture fixes applied)  
**Status:** Backlog (Ready for Sprint 8)
