# Story 16.1: Backend — Issuer Template Ownership Guard — Dev Prompt

**Story**: 16.1 — Issuer Template Ownership Guard  
**Sprint**: 16  
**Estimate**: 4h  
**Priority**: 🔴 HIGH (Security-critical — authorization logic)  
**Date**: 2026-03-03  
**Branch**: `sprint-16/f1-rbac-pilot-readiness`

---

## 📋 Story Overview

When an ISSUER issues a badge (single or bulk), the system must verify that the template used belongs to that ISSUER (`template.createdBy === issuerId`). ADMIN bypasses this check. This prevents Issuer-A from accidentally or deliberately issuing badges using Issuer-B's templates.

**Key Goal**: Add ownership guard to `issueBadge()` and ensure bulk issuance inherits it.

---

## ✅ Acceptance Criteria

1. `issueBadge()` checks `template.createdBy === issuerId` for ISSUER role; ADMIN bypasses
2. `bulkIssuance` upload/confirm checks the same ownership
3. Returns 403 Forbidden with message `'You can only issue badges using your own templates'`
4. ADMIN can issue badges using any template (no ownership check)
5. Existing E2E tests still pass (no regression)
6. New E2E tests cover: Issuer own template ✅, Issuer other's template ✗, Admin any template ✅

---

## 🏗️ Architecture & Approach

### Pattern to Follow: ARCH-P1-004

The ownership check pattern is already used in `badge-templates.controller.ts` for `update()` and `remove()`. Here is the **exact reference code** from `badge-templates.controller.ts` lines 280-288:

```typescript
// ARCH-P1-004: Ownership check - ISSUER can only update own templates
const userId = req.user.userId;
const userRole = req.user.role;

if (userRole === UserRole.ISSUER) {
  const template = await this.badgeTemplatesService.findOneRaw(id);
  if (template.createdBy !== userId) {
    throw new ForbiddenException(
      'You can only update your own badge templates',
    );
  }
}
// ADMIN can update any template (no ownership check)
```

### Key Implementation Detail

**Current flow** — badge issuance controller (`badge-issuance.controller.ts` line 74):
```typescript
async issueBadge(@Body() dto: IssueBadgeDto, @Request() req: RequestWithUser) {
  return this.badgeService.issueBadge(dto, req.user.userId);
}
```

The controller currently only passes `req.user.userId` — **NOT the role**. The service needs the role to distinguish ISSUER vs ADMIN.

**Solution**: Pass the caller's role to `issueBadge()`. Two options:

**Option A (Recommended)**: Add `role` as a third parameter to `issueBadge()`:
```typescript
// Controller:
return this.badgeService.issueBadge(dto, req.user.userId, req.user.role);

// Service method signature:
async issueBadge(dto: IssueBadgeDto, issuerId: string, callerRole: UserRole)
```

**Option B**: Look up the user's role from DB inside the service (extra query — less efficient).

Go with **Option A**.

### Where to Add the Guard in `issueBadge()`

In `badge-issuance.service.ts`, the `issueBadge()` method already validates the template exists and is ACTIVE (lines 82-94). Add the ownership check **immediately after** the template validation:

```typescript
// Current code (lines 82-94):
const template = await this.prisma.badgeTemplate.findUnique({
  where: { id: dto.templateId },
});

if (!template) {
  throw new NotFoundException(`Badge template ${dto.templateId} not found`);
}

if (template.status !== 'ACTIVE') {
  throw new BadRequestException(
    `Badge template ${template.name} is not active`,
  );
}

// ===== ADD OWNERSHIP CHECK HERE =====
// Story 16.1: ARCH-P1-004 — Issuer can only issue badges using own templates
if (callerRole === UserRole.ISSUER && template.createdBy !== issuerId) {
  throw new ForbiddenException(
    'You can only issue badges using your own templates',
  );
}
// ADMIN can issue using any template (no ownership check)
```

### Bulk Issuance — Automatic Inheritance

The bulk issuance flow calls `this.badgeIssuanceService.issueBadge()` internally in `bulk-issuance.service.ts` line 632:

```typescript
const issueResult = await this.badgeIssuanceService.issueBadge(
  {
    templateId: template.id,
    recipientId: recipient.id,
  },
  currentUserId,  // ← need to also pass role
);
```

**Change needed**: `bulk-issuance.service.ts` must also pass the caller's role to `issueBadge()`:

1. `confirmBulkIssuance(sessionId, currentUserId)` → change to `confirmBulkIssuance(sessionId, currentUserId, callerRole: UserRole)`
2. The controller `confirm/:sessionId` endpoint must pass `req.user.role`
3. OR: look up the role from the session's issuer (the `loadSession()` returns the session which has `issuerId` — we can look up the user to get their role, but passing from controller is cleaner)

**Recommended approach**: Pass `callerRole` from controller through to `confirmBulkIssuance()` → `issueBadge()`.

### Files to Change

| File | Change |
|------|--------|
| `backend/src/badge-issuance/badge-issuance.service.ts` | Add `callerRole` param to `issueBadge()`, add ownership check after template validation |
| `backend/src/badge-issuance/badge-issuance.controller.ts` | Pass `req.user.role` as 3rd arg to `issueBadge()` |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Add `callerRole` param to `confirmBulkIssuance()`, pass to `issueBadge()` |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Pass `req.user.role` to `confirmBulkIssuance()` |
| `backend/src/badge-issuance/badge-issuance.service.spec.ts` | Add ownership guard unit tests |
| `backend/test/badge-issuance.e2e-spec.ts` | Add ownership E2E tests |

---

## 🧪 Testing Strategy

### TDD Approach — Write Tests First

#### Unit Tests (badge-issuance.service.spec.ts)

Add a new `describe('Template Ownership Guard')` block:

```typescript
describe('Template Ownership Guard', () => {
  it('should allow ISSUER to issue badge using own template', async () => {
    // Setup: template.createdBy === issuerId
    // Act: issueBadge(dto, issuerId, UserRole.ISSUER)
    // Assert: badge created successfully (201)
  });

  it('should reject ISSUER issuing badge using another Issuer template', async () => {
    // Setup: template.createdBy === 'other-issuer-id'
    // Act: issueBadge(dto, issuerId, UserRole.ISSUER)
    // Assert: throws ForbiddenException with 'You can only issue badges using your own templates'
  });

  it('should allow ADMIN to issue badge using any template', async () => {
    // Setup: template.createdBy === 'some-other-user'
    // Act: issueBadge(dto, adminId, UserRole.ADMIN)
    // Assert: badge created successfully (no ownership check)
  });
});
```

#### E2E Tests (badge-issuance.e2e-spec.ts or new file)

```typescript
describe('Template Ownership Guard (E2E)', () => {
  // Setup: Create 2 Issuers (A, B), each creates a template
  // Create 1 Admin, 1 Employee (recipient)
  
  it('Issuer-A issues badge using own template → 201 Created', ...);
  it('Issuer-A issues badge using Issuer-B template → 403 Forbidden', ...);
  it('Admin issues badge using Issuer-A template → 201 Created', ...);
  
  // Bulk issuance tests
  it('Issuer-A bulk issues using own template CSV → success', ...);
  it('Issuer-A bulk issues using Issuer-B template CSV → rows fail with ownership error', ...);
  it('Admin bulk issues using any template CSV → success', ...);
});
```

### Existing Tests to Watch

After making changes, ensure these existing test suites still pass:
- `npm run test -- --testPathPattern="badge-issuance"` (unit)
- `npm run test:e2e -- --testPathPattern="badge-issuance"` (E2E)
- `npm run test:e2e -- --testPathPattern="bulk-issuance"` (E2E)

---

## ⚠️ Important Notes

1. **Import `UserRole`** from `@prisma/client` in files that don't already have it
2. **`ForbiddenException`** is already imported in `badge-issuance.service.ts` (line 5)
3. **Bulk issuance error handling**: When `issueBadge()` throws `ForbiddenException` during bulk, the catch block at line 647 catches it and records as `status: 'failed'` — this is correct behavior (individual rows fail, batch continues)
4. **Do NOT change the `createSession()` method** — ownership check happens at confirm time (issuance time), not upload time. An Issuer should be able to upload a CSV referencing any template IDs, but only issue from owned ones.
5. **Existing E2E test fixtures**: Check if existing E2E tests create templates with a specific user. If they use ADMIN to create templates but ISSUER to issue, those tests will now fail unless the template's `createdBy` matches. Update fixture setup as needed.

---

## 📎 Reference Files

- **Ownership check reference**: `backend/src/badge-templates/badge-templates.controller.ts` lines 280-331
- **issueBadge() service**: `backend/src/badge-issuance/badge-issuance.service.ts` lines 79-120
- **Bulk issuance confirm**: `backend/src/bulk-issuance/bulk-issuance.service.ts` lines 555-700
- **Bulk issuance controller**: `backend/src/bulk-issuance/bulk-issuance.controller.ts` lines 187-230
- **Badge issuance controller**: `backend/src/badge-issuance/badge-issuance.controller.ts` lines 63-75
- **RequestWithUser interface**: `backend/src/common/interfaces/request-with-user.interface.ts`
- **UserRole enum**: `@prisma/client` → `ADMIN | ISSUER | EMPLOYEE`

---

## 🔀 Code Review Checklist

After implementation, verify:
- [ ] Ownership check is in the **service layer** (not just controller)
- [ ] `ForbiddenException` message is clear and consistent
- [ ] ADMIN bypass is explicit (no accidental blocking)
- [ ] Bulk issuance inherits the guard via `issueBadge()` call
- [ ] No N+1 query introduced (template lookup already exists before the check)
- [ ] All existing tests pass (`npm run test` + `npm run test:e2e`)
- [ ] New tests cover all 3 combinations: own ✅, other's ✗, admin ✅
