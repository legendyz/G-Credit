# Story 16.2: Frontend — Template List Ownership Filter — Dev Prompt

**Story**: 16.2 — Frontend Template List Ownership Filter  
**Sprint**: 16  
**Estimate**: 2h  
**Priority**: 🟡 MEDIUM (UX correctness — Issuers see only own templates)  
**Date**: 2026-03-04  
**Branch**: `sprint-16/f1-rbac-pilot-readiness`  
**Depends on**: Story 16.1 (✅ Done — backend ownership guard in place)

---

## 📋 Story Overview

When an ISSUER opens the Issue Badge page or Bulk Issuance page, the template dropdown should only show templates they created. ADMIN continues to see all templates. This is the frontend complement to the backend ownership guard (Story 16.1) — even though the backend will reject issuance attempts for non-owned templates, the UI should proactively filter to prevent user confusion.

**Key Goal**: Server-side auto-filtering of templates by `createdBy` for ISSUER role.

---

## ✅ Acceptance Criteria

1. `IssueBadgePage` template dropdown shows only Issuer's own templates (filtered by `createdBy`)
2. `BulkIssuancePage` template selection shows only Issuer's own templates
3. ADMIN sees all templates (no filtering change)
4. Template count in dropdown matches ownership scope
5. Empty state shown if Issuer has no templates yet

---

## 🏗️ Architecture & Approach

### Strategy: Server-Side Auto-Filtering (Recommended)

Rather than passing `creatorId` from the frontend (which can be spoofed), the backend should **auto-inject** the ownership filter based on the authenticated user's role:

- When `ISSUER` calls `GET /api/badge-templates?status=ACTIVE` → server auto-adds `WHERE createdBy = userId`
- When `ADMIN` calls the same endpoint → no additional filter (sees all)
- Frontend code changes are minimal — just handle the new empty state

This approach is:
- **Secure**: Filter is server-enforced, not client-spoofed
- **Minimal frontend change**: Same API call, just different results per role
- **Consistent**: Aligns with ARCH-P1-004 pattern

### Alternative: Query Param Approach (Not Recommended)

Add `creatorId` query param to DTO. Frontend passes `creatorId=<userId>`. This works but is less secure (client can omit/change the param). Only use this if the ISSUER needs to see other issuers' templates in some future scenario.

---

## 📝 Implementation Steps

### Task 1: Backend — Auto-inject `createdBy` filter for ISSUER role

**File**: `backend/src/badge-templates/badge-templates.controller.ts`

The `findAll()` endpoint currently does **not** receive the authenticated user info:

```typescript
// Current (line 65):
async findAll(@Query() query: QueryBadgeTemplatesDto) {
  return this.badgeTemplatesService.findAll(query, true);
}
```

**Change**: Inject `@Request()` and pass the user's ID + role to the service:

```typescript
async findAll(
  @Query() query: QueryBadgeTemplatesDto,
  @Request() req: RequestWithUser,
) {
  // ISSUER: auto-filter to own templates only
  // ADMIN: see all templates
  const creatorId = req.user.role === UserRole.ISSUER ? req.user.userId : undefined;
  return this.badgeTemplatesService.findAll(query, true, creatorId);
}
```

> **Note**: The `findAll()` endpoint uses the global `JwtAuthGuard` (not `@Public()`), so `req.user` is always available.

**File**: `backend/src/badge-templates/badge-templates.service.ts`

Update `findAll()` to accept optional `creatorId`:

```typescript
// Current (line 106):
async findAll(query: QueryBadgeTemplatesDto, onlyActive: boolean = false) {

// Change to:
async findAll(query: QueryBadgeTemplatesDto, onlyActive: boolean = false, creatorId?: string) {
```

Add the `createdBy` filter in the `where` clause (after existing filters, before the query execution):

```typescript
// After search filter block (~line 150), add:
if (creatorId) {
  where.createdBy = creatorId;
}
```

This is the simplest change — one extra `WHERE` condition when `creatorId` is provided.

### Task 1b: Also update `findAllAdmin()` for consistency

The `findAllAdmin()` endpoint (used by `BadgeTemplateListPage.tsx` — the template management page) should ALSO filter for ISSUER:

```typescript
// Current:
async findAllAdmin(@Query() query: QueryBadgeTemplatesDto) {
  return this.badgeTemplatesService.findAll(query, false);
}

// Change to:
async findAllAdmin(
  @Query() query: QueryBadgeTemplatesDto,
  @Request() req: RequestWithUser,
) {
  const creatorId = req.user.role === UserRole.ISSUER ? req.user.userId : undefined;
  return this.badgeTemplatesService.findAll(query, false, creatorId);
}
```

This ensures the template list management page (`/admin/templates`) also only shows the ISSUER's own templates.

### Task 2: Frontend — Empty state for IssueBadgePage

**File**: `frontend/src/pages/IssueBadgePage.tsx`

Currently, the template dropdown has no empty state. When an ISSUER has no templates, the dropdown shows nothing. Add an empty state:

```tsx
// After the template fetch in useEffect (around line 85):
// No change to the fetch logic — getActiveTemplates() still hits the same endpoint

// In the JSX, find the template Select and add empty handling:
{loadingTemplates ? (
  <div>Loading templates...</div>
) : templates.length === 0 ? (
  <div className="text-sm text-gray-500 p-4 text-center">
    <p className="font-medium">No templates found</p>
    <p>Create a template first before issuing badges.</p>
  </div>
) : (
  // existing Select component
)}
```

If an empty state already exists, verify it shows the correct message. If not, add it.

### Task 3: Frontend — Empty state for BulkIssuancePage TemplateSelector

**File**: `frontend/src/components/BulkIssuance/TemplateSelector.tsx`

The `TemplateSelector` component fetches templates via `getActiveTemplates()` (line 41). Same situation — add empty state:

```tsx
// In the dropdown render, when templates.length === 0 and not loading:
{isLoading ? (
  <div className="p-3 text-sm text-gray-500">Loading...</div>
) : filteredTemplates.length === 0 ? (
  <div className="p-3 text-sm text-gray-500 text-center">
    No templates found. Create a template first.
  </div>
) : (
  // existing template list
)}
```

### Task 4: Frontend Tests

**File**: Create or update `frontend/src/pages/IssueBadgePage.test.tsx` (or add to existing)

```typescript
describe('IssueBadgePage — Template Ownership', () => {
  it('should show only owned templates for ISSUER', async () => {
    // Mock getActiveTemplates to return only 2 templates (server-filtered)
    // Mock auth context: role=ISSUER
    // Render IssueBadgePage
    // Assert: 2 templates visible in dropdown
  });

  it('should show all templates for ADMIN', async () => {
    // Mock getActiveTemplates to return 5 templates (no server filter)
    // Mock auth context: role=ADMIN
    // Render IssueBadgePage
    // Assert: 5 templates visible
  });

  it('should show empty state when ISSUER has no templates', async () => {
    // Mock getActiveTemplates to return []
    // Render IssueBadgePage
    // Assert: "No templates found" message visible
    // Assert: "Create a template first" text visible
  });
});
```

**File**: Update `frontend/src/components/BulkIssuance/TemplateSelector.test.tsx` (if exists)

Same pattern — test empty state rendering.

---

## 📂 Files to Change

| File | Change | Risk |
|------|--------|------|
| `backend/src/badge-templates/badge-templates.controller.ts` | Add `@Request()` to `findAll()` + `findAllAdmin()`, pass `creatorId` for ISSUER | LOW |
| `backend/src/badge-templates/badge-templates.service.ts` | Add optional `creatorId` param to `findAll()`, add `where.createdBy` filter | LOW |
| `frontend/src/pages/IssueBadgePage.tsx` | Add empty state when templates array is empty | LOW |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | Add empty state when templates array is empty | LOW |
| Frontend tests (new/updated) | Test ownership filtering and empty state | LOW |

---

## 🧪 Testing Strategy

### Backend Unit Tests

Add tests in a new or existing badge-templates spec:

```typescript
describe('findAll() with creatorId filter', () => {
  it('should return only templates with matching createdBy when creatorId provided', async () => {
    // Setup: 3 templates — 2 by issuer-A, 1 by issuer-B
    // Act: findAll({}, true, 'issuer-A-id')
    // Assert: returns 2 templates, both with createdBy = 'issuer-A-id'
  });

  it('should return all templates when creatorId is undefined', async () => {
    // Setup: 3 templates by different creators
    // Act: findAll({}, true)
    // Assert: returns all 3 templates
  });
});
```

### Backend E2E Tests

```typescript
describe('GET /api/badge-templates — Ownership Filter', () => {
  it('ISSUER sees only own templates', async () => {
    // Setup: Issuer-A creates 2 templates, Issuer-B creates 1
    // Act: GET /api/badge-templates?status=ACTIVE as Issuer-A
    // Assert: response.data has 2 items, all with createdBy = Issuer-A.id
  });

  it('ADMIN sees all templates', async () => {
    // Setup: same as above
    // Act: GET /api/badge-templates?status=ACTIVE as Admin
    // Assert: response.data has 3 items
  });

  it('ISSUER with no templates sees empty list', async () => {
    // Setup: Issuer-C has no templates
    // Act: GET /api/badge-templates?status=ACTIVE as Issuer-C
    // Assert: response.data is [], total = 0
  });
});
```

### Frontend Tests

- Vitest + React Testing Library
- Mock `getActiveTemplates()` to return server-filtered results
- Test empty state rendering
- Don't test the filtering logic itself (that's the backend's job)

### Existing Tests to Watch

After making changes, ensure these still pass:
- `npx jest --testPathPatterns "badge-templates"` (backend unit)
- `npx jest --config ./test/jest-e2e.json --testPathPatterns "badge-templates"` (backend E2E)
- `npx vitest run BadgeTemplateListPage` (frontend)
- `npx vitest run IssueBadgePage` (frontend — if exists)

---

## ⚠️ Important Notes

1. **Import `RequestWithUser`**: Already imported in controller — verify. Add `@Request()` decorator import from `@nestjs/common`.
2. **Import `UserRole`**: Already imported in controller (`import { UserRole } from '@prisma/client'`).
3. **`getActiveTemplates()` calls `GET /badge-templates?status=ACTIVE`** — this is the `findAll()` endpoint (not `findAllAdmin()`). The auto-filter on `findAll()` covers both IssueBadgePage AND the `TemplateSelector` component since they both use `getActiveTemplates()`.
4. **No frontend API change needed**: The `getActiveTemplates()` function doesn't need modification — the server handles filtering based on the JWT cookie/token.
5. **Pagination meta stays correct**: Since `createdBy` is added to the `where` clause, `total` count reflects filtered results automatically.
6. **Lesson 55**: Filter changes must reset pagination — not applicable here since the filter is auto-injected (not user-toggled).
7. **EMPLOYEE role**: Employees don't access `IssueBadgePage` or `BulkIssuancePage` (route guards already block). No need to handle EMPLOYEE in the filter logic.

---

## 📎 Reference Files

| File | Purpose | Key Lines |
|------|---------|-----------|
| `backend/src/badge-templates/badge-templates.controller.ts` | Controller — `findAll()` + `findAllAdmin()` | Lines 53-88 |
| `backend/src/badge-templates/badge-templates.service.ts` | Service — `findAll()` with WHERE clause | Lines 106-180 |
| `backend/src/badge-templates/dto/query-badge-template.dto.ts` | Query DTO (no change needed) | Full file |
| `frontend/src/lib/badgeTemplatesApi.ts` | `getActiveTemplates()` — calls `GET /badge-templates?status=ACTIVE` | Lines 189-195 |
| `frontend/src/pages/IssueBadgePage.tsx` | Template dropdown in issue form | Lines 80-90 |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | Template selector in bulk issuance | Lines 28-50 |
| `backend/src/common/interfaces/request-with-user.interface.ts` | `RequestWithUser` type | Full file |

---

## 🔀 Code Review Checklist

After implementation, verify:
- [ ] Server-side filtering — `createdBy` WHERE clause added for ISSUER role
- [ ] ADMIN bypass — no filter applied when role is ADMIN
- [ ] Both endpoints filtered — `findAll()` AND `findAllAdmin()` pass `creatorId`
- [ ] Empty state — IssueBadgePage shows "No templates found" when array is empty
- [ ] Empty state — TemplateSelector shows appropriate empty message
- [ ] No frontend API changes — `getActiveTemplates()` function unchanged
- [ ] Pagination works — total/meta reflects filtered count
- [ ] All existing tests pass (no regression)
- [ ] New tests cover: ISSUER filtered ✅, ADMIN all ✅, empty state ✅
