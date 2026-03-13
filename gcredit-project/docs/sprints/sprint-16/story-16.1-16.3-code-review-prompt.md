# Code Review Prompt — Story 16.1 + Story 16.3 (Combined)

> **Sprint**: 16 — RBAC Pilot Readiness  
> **Stories**: 16.1 (Issuer Template Ownership Guard) + 16.3 (Template Edit/Update Ownership Guard)  
> **Risk Level**: 🔴 HIGH — Security-critical authorization logic  
> **Pattern**: ARCH-P1-004 (Ownership Check)  
> **Date**: 2026-03-03  

---

## Your Role

You are a **senior security-focused code reviewer**. Review the code changes listed below for correctness, security, and test coverage. Output a structured review report.

---

## Context

### What is ARCH-P1-004?

The ownership check pattern used throughout G-Credit:
```typescript
if (userRole === UserRole.ISSUER && resource.createdBy !== userId) {
  throw new ForbiddenException('You can only [action] your own [resource]');
}
// ADMIN bypasses — no ownership check
```

### Story 16.1: Backend — Issuer Template Ownership Guard (Badge Issuance)

**Goal**: Prevent an ISSUER from issuing badges using another Issuer's templates. ADMIN can issue using any template.

**Changes made** (8 files, ~451 insertions):

| File | Change |
|------|--------|
| `backend/src/badge-issuance/badge-issuance.service.ts` | Added `callerRole: UserRole` as 3rd param to `issueBadge()`. Added ownership check after template validation. |
| `backend/src/badge-issuance/badge-issuance.controller.ts` | Controller now passes `req.user.role` as 3rd arg to `issueBadge()` |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Added `callerRole` as 3rd param to `confirmBulkIssuance()`. Forwards to `issueBadge()` with `callerRole`. |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Controller now passes `req.user.role` to `confirmBulkIssuance()` |
| `backend/src/badge-issuance/badge-issuance.service.spec.ts` | 3 new unit tests: Issuer own ✅, Issuer other 403, Admin bypass ✅. All existing calls updated for new signature. |
| `backend/src/badge-issuance/badge-issuance-teams.integration.spec.ts` | Updated `issueBadge` calls to include `callerRole`, fixed `template.createdBy` to match issuer. |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | Updated all `confirmBulkIssuance` calls with `callerRole` param. |
| `backend/test/badge-issuance.e2e-spec.ts` | 4 new E2E tests: Issuer-A own 201, Issuer-A other 403, Admin bypass A 201, Admin bypass B 201. |

### Story 16.3: Template Edit/Update Ownership Guard (Template CRUD)

**Goal**: Verify that existing ARCH-P1-004 ownership checks on PATCH and DELETE endpoints are correct and well-tested.

**Key discovery**: All backend + frontend ownership implementation was **already in place** from prior sprints. This story only added E2E test coverage.

**Changes made** (1 new file):

| File | Change |
|------|--------|
| `backend/test/badge-templates-ownership.e2e-spec.ts` | **NEW** — 12 E2E tests covering PATCH update, PATCH status change, and DELETE for owner/non-owner/admin scenarios. |

---

## Source Code to Review

### 1. `badge-issuance.service.ts` — Ownership Guard (Core Change)

```typescript
  /**
   * Issue a single badge
   * @param callerRole - Story 16.1: Caller's role for ownership check (ARCH-P1-004)
   */
  async issueBadge(dto: IssueBadgeDto, issuerId: string, callerRole: UserRole) {
    // 1. Validate template exists and is ACTIVE
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

    // Story 16.1: ARCH-P1-004 — Issuer can only issue badges using own templates
    if (callerRole === UserRole.ISSUER && template.createdBy !== issuerId) {
      throw new ForbiddenException(
        'You can only issue badges using your own templates',
      );
    }
    // ADMIN can issue using any template (no ownership check)

    // 2. Validate recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });
    // ... rest of method unchanged
```

### 2. `badge-issuance.controller.ts` — Passing Role to Service

```typescript
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  async issueBadge(
    @Body() dto: IssueBadgeDto,
    @Request() req: RequestWithUser,
  ) {
    return this.badgeService.issueBadge(dto, req.user.userId, req.user.role);
  }
```

### 3. `bulk-issuance.service.ts` — Propagating callerRole

```typescript
  async confirmBulkIssuance(
    sessionId: string,
    currentUserId: string,
    callerRole: import('@prisma/client').UserRole,
  ): Promise<{ success: boolean; processed: number; failed: number; results: [...] }> {
    // ... session validation ...

    for (let i = 0; i < sessionValidRows.length; i++) {
      // ... resolve template and recipient ...

      // Story 16.1: Pass callerRole for ownership check (ARCH-P1-004)
      const issueResult = await this.badgeIssuanceService.issueBadge(
        {
          templateId: template.id,
          recipientId: recipient.id,
        },
        currentUserId,
        callerRole,
      );
      // ...
    }
  }
```

### 4. `bulk-issuance.controller.ts` — Passing Role

```typescript
  async confirmBulkIssuance(
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    // Story 16.1: Pass callerRole for ownership check (ARCH-P1-004)
    return this.bulkIssuanceService.confirmBulkIssuance(sessionId, userId, req.user.role);
  }
```

### 5. `badge-templates.controller.ts` — Pre-existing Ownership (Story 16.3 verifies this)

```typescript
  // PATCH /:id — update
  async update(@Param('id') id: string, @Body() body, @UploadedFile() image, @Request() req) {
    // ARCH-P1-004: Ownership check - ISSUER can only update own templates
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === UserRole.ISSUER) {
      const template = await this.badgeTemplatesService.findOneRaw(id);
      if (template.createdBy !== userId) {
        throw new ForbiddenException('You can only update your own badge templates');
      }
    }
    // ADMIN can update any template (no ownership check)
    // ...
  }

  // DELETE /:id — remove
  async remove(@Param('id') id: string, @Request() req) {
    // ARCH-P1-004: Ownership check - ISSUER can only delete own templates
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === UserRole.ISSUER) {
      const template = await this.badgeTemplatesService.findOneRaw(id);
      if (template.createdBy !== userId) {
        throw new ForbiddenException('You can only delete your own badge templates');
      }
    }
    // ADMIN can delete any template (no ownership check)
    // ...
  }
```

### 6. Unit Tests — `badge-issuance.service.spec.ts` (3 new tests)

```typescript
    // Story 16.1: Template Ownership Guard (ARCH-P1-004)
    describe('Template Ownership Guard', () => {
      const ownerIssuerId = 'owner-issuer-uuid';
      const otherIssuerId = 'other-issuer-uuid';
      const ownedTemplate = { ...mockTemplate, createdBy: ownerIssuerId };

      it('should allow ISSUER to issue badge using own template', async () => {
        // template.createdBy === issuerId → success
        const result = await service.issueBadge(issueDto, ownerIssuerId, UserRole.ISSUER);
        expect(result).toHaveProperty('id');
      });

      it('should reject ISSUER issuing badge using another Issuer\'s template', async () => {
        // template.createdBy !== issuerId → 403
        await expect(
          service.issueBadge(issueDto, otherIssuerId, UserRole.ISSUER),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          service.issueBadge(issueDto, otherIssuerId, UserRole.ISSUER),
        ).rejects.toThrow('You can only issue badges using your own templates');
      });

      it('should allow ADMIN to issue badge using any template (bypass ownership)', async () => {
        // ADMIN + template.createdBy !== adminId → still success
        const result = await service.issueBadge(issueDto, adminId, UserRole.ADMIN);
        expect(result).toHaveProperty('id');
      });
    });
```

### 7. E2E Tests — `badge-issuance.e2e-spec.ts` (4 new tests)

```typescript
  describe('Template Ownership Guard (Story 16.1)', () => {
    let issuerAUser, issuerBUser, issuerATemplateId, issuerBTemplateId;

    beforeAll(async () => {
      issuerAUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
      issuerBUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
      issuerATemplateId = (await ctx.templateFactory.createActive({ createdById: issuerAUser.user.id })).id;
      issuerBTemplateId = (await ctx.templateFactory.createActive({ createdById: issuerBUser.user.id })).id;
    });

    it('Issuer-A issues badge using own template → 201 Created');
    it('Issuer-A issues badge using Issuer-B template → 403 Forbidden');
    it('Admin issues badge using Issuer-A template → 201 Created (bypass)');
    it('Admin issues badge using Issuer-B template → 201 Created (bypass)');
  });
```

### 8. E2E Tests — `badge-templates-ownership.e2e-spec.ts` (12 new tests, Story 16.3)

```
PATCH update:
  - Issuer-A updates own template → 200 OK
  - Issuer-A updates Issuer-B template → 403 Forbidden
  - Issuer-B updates Issuer-A template → 403 Forbidden
  - Admin updates Issuer-A template → 200 OK (bypass)
  - Admin updates Issuer-B template → 200 OK (bypass)

PATCH status change:
  - Issuer-A activates own DRAFT → 200 OK
  - Issuer-A changes Issuer-B DRAFT status → 403 Forbidden
  - Admin activates Issuer-B DRAFT → 200 OK (bypass)

DELETE:
  - Issuer-A deletes own template → 200 OK
  - Issuer-A deletes Issuer-B template → 403 Forbidden
  - Issuer-B deletes own template → 200 OK
  - Admin deletes any template → 200 OK (bypass)
```

---

## Review Checklist

Please evaluate each item and score as ✅ PASS, ⚠️ CONCERN, or ❌ FAIL:

### Security (Critical)
- [ ] **S1**: Ownership check is at the **service layer** (not controller) for badge issuance — defence in depth
- [ ] **S2**: Ownership check occurs **after template validation** but **before any state mutation**
- [ ] **S3**: `ForbiddenException` (403) is returned, not 401 or 404 — correct HTTP semantics
- [ ] **S4**: Error message does not leak internal IDs or other users' data
- [ ] **S5**: ADMIN bypass is correct — only `UserRole.ADMIN` skips, not `EMPLOYEE` or unknown roles
- [ ] **S6**: EMPLOYEE role cannot reach issuance endpoint (blocked by `@Roles` decorator at controller level)
- [ ] **S7**: Bulk issuance correctly propagates `callerRole` — an ISSUER cannot bypass ownership via CSV upload
- [ ] **S8**: No TOCTOU race condition — template ownership cannot change between check and use

### Architecture Consistency
- [ ] **A1**: Pattern consistency — `issueBadge()` ownership check matches `badge-templates.controller.ts` `update()` and `remove()` pattern
- [ ] **A2**: Ownership check for issuance is in service layer; for template CRUD it's in controller layer — is this inconsistency intentional and acceptable?
- [ ] **A3**: `callerRole` type uses `UserRole` enum from Prisma, not raw string — type safety
- [ ] **A4**: Comment references (ARCH-P1-004, Story 16.1) are present and accurate

### Test Quality
- [ ] **T1**: Unit tests cover all 3 scenarios: owner ✅, non-owner ❌, admin bypass ✅
- [ ] **T2**: E2E tests use real HTTP requests with actual JWT tokens (not mocked auth)
- [ ] **T3**: E2E tests create separate Issuer users with distinct templates — proper isolation
- [ ] **T4**: 403 response body assertion checks the exact error message text
- [ ] **T5**: Existing tests updated for new `issueBadge()` signature — no broken mocks
- [ ] **T6**: Integration test (`badge-issuance-teams.integration.spec.ts`) updated correctly
- [ ] **T7**: Template ownership E2E (Story 16.3) covers PATCH update + PATCH status + DELETE — all 3 mutation paths
- [ ] **T8**: Delete tests verify the template is actually gone (follow-up GET returns 404)

### Code Quality
- [ ] **C1**: Method signature change is backward-incompatible — are there any callers not updated?
- [ ] **C2**: JSDoc `@param callerRole` added with proper description
- [ ] **C3**: No debugging artifacts left (console.log, TODO, etc.)
- [ ] **C4**: Import of `ForbiddenException` added to service file
- [ ] **C5**: `bulk-issuance.service.ts` uses `import('@prisma/client').UserRole` (inline import type) — is this idiomatic or should it use a regular import?

### Edge Cases
- [ ] **E1**: What happens if `callerRole` is `EMPLOYEE`? (Should never reach due to `@Roles` guard, but verify service-level behavior)
- [ ] **E2**: What happens if `template.createdBy` is null? (Possible for early templates before ownership tracking)
- [ ] **E3**: Bulk issuance with mixed templates (some owned, some not) — does it correctly fail individual rows?

---

## Expected Deliverable

Produce a review report with:
1. **Summary verdict**: APPROVE, APPROVE WITH COMMENTS, or REQUEST CHANGES
2. **Security findings**: Any S-items that are ⚠️ or ❌
3. **Architecture concerns**: Any A-items worth discussing
4. **Test gaps**: Any missing coverage
5. **Code quality notes**: Minor improvements
6. **Edge case analysis**: E-items evaluation

Focus on **security correctness first**, then architecture consistency, then test quality.
