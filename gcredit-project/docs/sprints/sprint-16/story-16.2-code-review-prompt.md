# Code Review Prompt — Story 16.2

> **Sprint**: 16 — RBAC Pilot Readiness  
> **Story**: 16.2 (Frontend — Template List Ownership Filter)  
> **Risk Level**: 🟡 MEDIUM — Data visibility / authorization filter logic  
> **Pattern**: ARCH-P1-004 (Ownership Check — server-side auto-filter variant)  
> **Date**: 2026-03-03  

---

## Your Role

You are a **senior code reviewer** specializing in authorization and data-visibility logic. Review the code changes listed below for correctness, security, consistency, and test coverage. Output a structured review report.

---

## Context

### What changed?

Story 16.2 ensures **ISSUERs only see their own templates** in template lists (both `GET /badge-templates` and `GET /badge-templates/all`). Unlike Stories 16.1/16.3 which block unauthorized mutations (403), this story **filters query results** so ISSUERs only receive their own data.

### Implementation approach

**Server-side auto-filtering** — the controller detects the caller's role and automatically injects `creatorId` when calling the service. No frontend API changes required; the same `getActiveTemplates()` call now returns filtered results transparently.

### ARCH-P1-004 — Filter Variant

```typescript
// Controller injects creatorId for ISSUER role:
const creatorId = req.user.role === UserRole.ISSUER ? req.user.userId : undefined;
return this.badgeTemplatesService.findAll(query, onlyActive, creatorId);

// Service applies filter:
if (creatorId) {
  where.createdBy = creatorId;
}
```

### Changes Summary (8 files, +298 / -28)

| File | Change |
|------|--------|
| `backend/src/badge-templates/badge-templates.controller.ts` | Added `@Request()` to `findAll()` + `findAllAdmin()`, compute `creatorId` for ISSUER, pass to service |
| `backend/src/badge-templates/badge-templates.service.ts` | Added optional `creatorId?: string` param to `findAll()`, applies `where.createdBy = creatorId` |
| `backend/src/badge-templates/badge-templates.service.spec.ts` | +85 lines — 5 new unit tests for creatorId filtering |
| `backend/test/badge-templates.e2e-spec.ts` | +115 lines — 5 new E2E tests (ISSUER-A/B isolation, ADMIN sees all, empty list, `/all` endpoint) |
| `frontend/src/pages/IssueBadgePage.tsx` | +16/-1 — empty state when templates array is empty (disabled select + guidance text) |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | +9/-1 — empty state message when no templates available |
| `frontend/src/pages/IssueBadgePage.test.tsx` | +15 lines — 1 new test for empty state |
| `docs/sprints/sprint-16/16-2-frontend-template-ownership-filter.md` | Status → `dev-complete`, all ACs checked, dev agent record filled |

---

## Source Code to Review

### 1. `badge-templates.controller.ts` — Auto-injecting creatorId

```typescript
  // GET /badge-templates — auth-required, only ACTIVE templates
  async findAll(
    @Query() query: QueryBadgeTemplatesDto,
    @Request() req: RequestWithUser,
  ) {
    // Story 16.2: ISSUER sees only own templates; ADMIN sees all
    const creatorId =
      req.user?.role === UserRole.ISSUER ? req.user.userId : undefined;
    return this.badgeTemplatesService.findAll(query, true, creatorId);
  }

  // GET /badge-templates/all — Admin/Issuer only, all statuses
  async findAllAdmin(
    @Query() query: QueryBadgeTemplatesDto,
    @Request() req: RequestWithUser,
  ) {
    // Story 16.2: ISSUER sees only own templates; ADMIN sees all
    const creatorId =
      req.user.role === UserRole.ISSUER ? req.user.userId : undefined;
    return this.badgeTemplatesService.findAll(query, false, creatorId);
  }
```

**⚠️ Reviewer Note**: `findAll()` uses `req.user?.role` (optional chain) while `findAllAdmin()` uses `req.user.role` (no optional chain). Both endpoints require authentication — is the inconsistency intentional?

### 2. `badge-templates.service.ts` — Ownership filter in query

```typescript
  async findAll(
    query: QueryBadgeTemplatesDto,
    onlyActive: boolean = false,
    creatorId?: string,
  ) {
    // ... existing query building ...

    // Skill filter
    if (skillId) {
      where.skills = { some: { id: skillId } };
    }

    // Story 16.2: Ownership filter — ISSUER sees only own templates
    if (creatorId) {
      where.createdBy = creatorId;
    }

    // Search filter (name or description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ... findMany + count + return paginated ...
  }
```

### 3. Unit Tests — `badge-templates.service.spec.ts` (5 new tests)

```typescript
    describe('creatorId ownership filter (Story 16.2)', () => {
      it('should filter templates by createdBy when creatorId provided', async () => {
        // Verifies where clause includes createdBy: 'issuer-a-id'
      });

      it('should NOT filter by createdBy when creatorId is undefined', async () => {
        // Verifies where clause does NOT have createdBy property
      });

      it('should return only matching templates when creatorId provided', async () => {
        // Verifies result.data length and meta.total
      });

      it('should return empty list when creatorId matches no templates', async () => {
        // Verifies empty data + meta.total === 0
      });

      it('should combine creatorId with search filter', async () => {
        // Verifies where has BOTH createdBy AND OR (search) clauses
      });
    });
```

### 4. E2E Tests — `badge-templates.e2e-spec.ts` (5 new tests)

```typescript
  describe('Template List Ownership Filter (Story 16.2)', () => {
    // Setup: issuerA and issuerB each create a template

    it('ISSUER-A sees only own templates via GET /api/badge-templates');
    // Asserts: all returned items have createdBy === issuerA.id
    // Asserts: issuerATemplateId ∈ response, issuerBTemplateId ∉ response

    it('ISSUER-B sees only own templates via GET /api/badge-templates');
    // Asserts: all returned items have createdBy === issuerB.id

    it('ADMIN sees all templates (no ownership filter)');
    // Asserts: response contains both issuerATemplateId AND issuerBTemplateId

    it('ISSUER with no templates sees empty list');
    // Asserts: data === [], meta.total === 0

    it('ISSUER-A sees only own templates via GET /api/badge-templates/all');
    // Asserts: all returned items have createdBy === issuerA.id
  });
```

### 5. Frontend — `IssueBadgePage.tsx` (empty state)

```tsx
  <Select
    value={selectedTemplateId}
    onValueChange={setSelectedTemplateId}
    disabled={loadingTemplates || templates.length === 0}  // ← NEW: also disabled when empty
  >
    <SelectTrigger>
      <SelectValue
        placeholder={
          loadingTemplates
            ? 'Loading templates...'
            : templates.length === 0
              ? 'No templates available'     // ← NEW placeholder
              : 'Select a template'
        }
      />
    </SelectTrigger>
    {/* ... SelectContent ... */}
  </Select>

  {/* Story 16.2: Empty state when ISSUER has no templates */}
  {!loadingTemplates && templates.length === 0 && (
    <p className="text-sm text-neutral-500 mt-1">
      No templates found. Create a template first before issuing badges.
    </p>
  )}
```

### 6. Frontend — `TemplateSelector.tsx` (empty state for bulk issuance)

```tsx
  {/* Story 16.2: Empty state when ISSUER has no templates at all */}
  {!isLoading && templates.length === 0 && (
    <p className="text-sm text-gray-500 mt-1">
      No templates available. Create a template first.
    </p>
  )}
```

### 7. Frontend Test — `IssueBadgePage.test.tsx` (1 new test)

```typescript
  it('shows empty state message when no templates are available', async () => {
    mockGetActiveTemplates.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No templates found/i)).toBeInTheDocument();
    });

    const selects = screen.getAllByTestId('native-select');
    expect(selects[0]).toBeDisabled();
  });
```

---

## Review Checklist

Please evaluate each item and score as ✅ PASS, ⚠️ CONCERN, or ❌ FAIL:

### Security / Authorization (Critical)
- [ ] **S1**: ISSUER cannot obtain other Issuers' templates via `GET /badge-templates` — server-side filter is mandatory, not optional
- [ ] **S2**: ISSUER cannot bypass filter via `GET /badge-templates/all` — same ownership logic applied
- [ ] **S3**: ADMIN correctly bypasses filter — `creatorId` is `undefined` so no `where.createdBy` added
- [ ] **S4**: EMPLOYEE role: `UserRole.ISSUER` check is explicit — EMPLOYEE callers get `creatorId = undefined`, which means **no filter is applied** — is this correct? (EMPLOYEE should not reach these endpoints due to `@Roles` guard, but verify)
- [ ] **S5**: Filter happens at **query level** (Prisma WHERE clause), not post-query JS filter — ensures pagination `meta.total` is accurate
- [ ] **S6**: No way for client to override `creatorId` — it's computed server-side from JWT, not from query params

### Architecture Consistency
- [ ] **A1**: `req.user?.role` (optional chain) in `findAll()` vs `req.user.role` (no optional chain) in `findAllAdmin()` — both endpoints require auth, so `req.user` should always exist. Is the optional chain in `findAll()` defensive programming or a concern?
- [ ] **A2**: `creatorId` is injected at controller layer (consistent with query-filtering pattern), while ownership checks for mutations (16.1/16.3) are at service/controller layer — is this layering appropriate?
- [ ] **A3**: Service method `findAll()` uses optional param (`creatorId?: string`) rather than a DTO property — appropriate for an internal-only parameter that must not be exposed to API consumers
- [ ] **A4**: Comment references (Story 16.2, ARCH-P1-004) are present and accurate

### Test Quality
- [ ] **T1**: Unit tests cover: filter applied ✅, filter not applied ✅, correct results ✅, empty results ✅, combined with search ✅ — comprehensive
- [ ] **T2**: E2E tests use real HTTP with JWT tokens — proper integration testing
- [ ] **T3**: E2E tests create 2+ ISSUERs with distinct templates — proper isolation verification
- [ ] **T4**: E2E tests verify ADMIN sees **both** issuers' templates — bypass confirmed
- [ ] **T5**: E2E test for `/badge-templates/all` endpoint — verifies filter applies to admin-listing too
- [ ] **T6**: Frontend test mocks API returning `[]` and verifies empty state UI + disabled select
- [ ] **T7**: Missing test? TemplateSelector (BulkIssuance) empty state — no frontend test for this component's new behavior

### Frontend Quality
- [ ] **F1**: Empty state text is user-friendly and actionable ("Create a template first...")
- [ ] **F2**: Empty state prevents form submission — select is `disabled` when `templates.length === 0`
- [ ] **F3**: Color inconsistency: `IssueBadgePage` uses `text-neutral-500` while `TemplateSelector` uses `text-gray-500` — are these equivalent in the project's Tailwind config?
- [ ] **F4**: HTML entity `&quot;` used in TemplateSelector instead of `"` — diff artifact or actual change? Verify no rendering regression
- [ ] **F5**: Empty state only shows when `!isLoading && templates.length === 0` — correct guard against flash of empty state during loading

### Code Quality
- [ ] **C1**: No debugging artifacts left (console.log, TODO, etc.)
- [ ] **C2**: Service method signature change is backward-compatible — `creatorId` is optional with `undefined` default
- [ ] **C3**: Story doc updated with all ACs checked, file list, agent record — proper tracking

### Edge Cases
- [ ] **E1**: What if ISSUER creates templates then is demoted to EMPLOYEE? Templates still exist but EMPLOYEE can't reach endpoint — is this handled?
- [ ] **E2**: Pagination with filter — if ISSUER has 3 templates but requests `page=2&limit=10`, does it correctly return empty page with `meta.total=3`?
- [ ] **E3**: `creatorId` filter combined with `skillId` + `search` + `status` — do all filters compose correctly in the Prisma WHERE clause?
- [ ] **E4**: What if `createdBy` field is null for legacy templates? `where.createdBy = creatorId` would not match — acceptable behavior (ISSUER shouldn't see orphaned templates)

---

## Expected Deliverable

Produce a review report with:
1. **Summary verdict**: APPROVE, APPROVE WITH COMMENTS, or REQUEST CHANGES
2. **Security findings**: Any S-items that are ⚠️ or ❌
3. **Architecture concerns**: Especially the optional chain inconsistency (A1)
4. **Test gaps**: Any missing coverage (particularly T7)
5. **Frontend notes**: Color consistency, empty state UX
6. **Edge case analysis**: E-items evaluation

Focus on **authorization correctness first** (can an ISSUER ever see another Issuer's templates?), then consistency with ARCH-P1-004, then test coverage.
