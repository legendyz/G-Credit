# Story 16.3: Template Edit/Update Ownership Guard — Dev Prompt

**Story**: 16.3 — Template Edit/Update Ownership Guard  
**Sprint**: 16  
**Estimate**: 2h (reduced — significant code already exists)  
**Priority**: 🟡 MEDIUM  
**Date**: 2026-03-03  
**Branch**: `sprint-16/f1-rbac-pilot-readiness`

---

## 📋 Story Overview

Ensure ISSUERs can only edit, update status, and delete templates they created. ADMIN bypasses all ownership checks.

### ⚠️ CRITICAL DISCOVERY: Most Work Already Done!

During planning analysis, we found that **ownership checks and frontend gating are already implemented**:

| Feature | Status | Location |
|---------|--------|----------|
| `PATCH /:id` (update) ownership check | ✅ ALREADY EXISTS | `badge-templates.controller.ts` lines 280-288 |
| `DELETE /:id` (remove) ownership check | ✅ ALREADY EXISTS | `badge-templates.controller.ts` lines 318-328 |
| Frontend edit/view toggle (`canModify`) | ✅ ALREADY EXISTS | `BadgeTemplateListPage.tsx` line 397-398 |
| Frontend status button disabled for non-owners | ✅ ALREADY EXISTS | `BadgeTemplateListPage.tsx` lines 525-585 |
| Frontend delete disabled for non-owners | ✅ ALREADY EXISTS | `BadgeTemplateListPage.tsx` lines 588-610 |
| "Mine" / "Read-only" visual badges | ✅ ALREADY EXISTS | `BadgeTemplateListPage.tsx` lines 436-446 |

**Status change** goes through `updateTemplate(template.id, { status: newStatus })` → `PATCH /:id` → which already has the ownership guard. There is **NO separate** `/:id/status` endpoint.

### What Actually Needs Doing

This story's remaining scope is **primarily testing and verification**:

1. **Verify** the existing ownership checks work correctly with E2E tests
2. **Add missing E2E tests** that explicitly test the ownership guard on update and delete
3. **Add unit tests** if not already present for the ownership logic
4. **Frontend test**: Verify `canModify` conditional rendering works

---

## ✅ Acceptance Criteria

1. [x] ~~`PATCH /badge-templates/:id` checks `template.createdBy === userId` for ISSUER role~~ → **ALREADY DONE** (lines 280-288)
2. [x] ~~`PATCH /badge-templates/:id/status` checks ownership for ISSUER role~~ → **NO SEPARATE ENDPOINT** — status goes through `PATCH /:id` which is already guarded
3. [x] ~~ADMIN can edit/update any template~~ → **ALREADY DONE** (ADMIN bypasses ownership check)
4. [x] ~~Returns 403 Forbidden with clear message~~ → **ALREADY DONE** (`'You can only update your own badge templates'`)
5. [ ] **Frontend `BadgeTemplateListPage` only shows edit/delete actions for owned templates (ISSUER)** → **ALREADY DONE in UI** — needs test verification
6. [x] ~~Existing delete ownership check (ARCH-P1-004) remains functional~~ → **ALREADY DONE**

**Remaining work**: Write tests to verify all the above works end-to-end.

---

## 🏗️ Existing Code Reference

### Backend — Ownership Check (badge-templates.controller.ts)

**Update method** (lines 276-295) — ALREADY GUARDED:
```typescript
async update(@Param('id') id: string, @Body() body, @UploadedFile() image, @Request() req: RequestWithUser) {
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
    ...
}
```

**Delete method** (lines 312-328) — ALREADY GUARDED:
```typescript
async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
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
    ...
}
```

### Frontend — Conditional Rendering (BadgeTemplateListPage.tsx)

**Ownership detection** (line 397):
```tsx
const isOwner = !isIssuer || template.createdBy === currentUser?.id;
const canModify = !isIssuer || isOwner;
```

**Edit/View toggle** — Shows "Edit" button for owners, "View" for others  
**Status buttons** — `disabled={!canModify}` on Activate, Archive, Reactivate  
**Delete** — `disabled={!canModify}` on delete button  
**Visual indicators** — "Mine" (brand badge) vs "Read-only" (neutral badge with lock icon)

---

## 🧪 Testing — The Core Deliverable

Since the code is already implemented, this story's value is **test coverage**.

### Backend E2E Tests (new describe block)

Add to existing badge-templates E2E spec, or create `badge-templates-ownership.e2e-spec.ts`:

```typescript
describe('Template Ownership Guard (E2E)', () => {
  // Fixture setup:
  // - Issuer-A creates Template-A
  // - Issuer-B creates Template-B
  // - Admin user

  describe('PATCH /api/badge-templates/:id (update)', () => {
    it('Issuer-A updates own Template-A → 200 OK', ...);
    it('Issuer-A updates Issuer-B Template-B → 403 Forbidden', ...);
    it('Admin updates Template-A (owned by Issuer-A) → 200 OK', ...);
  });

  describe('PATCH /api/badge-templates/:id (status change via update)', () => {
    it('Issuer-A changes own template status → 200 OK', ...);
    it('Issuer-A changes other template status → 403 Forbidden', ...);
    it('Admin changes any template status → 200 OK', ...);
  });

  describe('DELETE /api/badge-templates/:id', () => {
    it('Issuer-A deletes own template → 200 OK', ...);
    it('Issuer-A deletes Issuer-B template → 403 Forbidden', ...);
    it('Admin deletes any template → 200 OK', ...);
  });
});
```

### Frontend Tests (BadgeTemplateListPage.test.tsx)

Add tests to existing `BadgeTemplateListPage.test.tsx`:

```typescript
describe('Ownership UI for ISSUER role', () => {
  it('shows "Edit" button for templates created by current user', ...);
  it('shows "View" button for templates created by other users', ...);
  it('disables status change buttons for non-owned templates', ...);
  it('disables delete button for non-owned templates', ...);
  it('shows "Mine" badge for owned templates', ...);
  it('shows "Read-only" badge for non-owned templates', ...);
});

describe('Ownership UI for ADMIN role', () => {
  it('shows "Edit" button for all templates (no ownership restriction)', ...);
  it('enables all action buttons regardless of creator', ...);
});
```

### Test Execution

```bash
# Backend unit tests
cd backend && npm run test -- --testPathPattern="badge-templates"

# Backend E2E tests
cd backend && npm run test:e2e -- --testPathPattern="badge-templates"

# Frontend tests  
cd frontend && npx vitest run --testPathPattern="BadgeTemplateListPage"

# Full regression
cd backend && npm run test
cd frontend && npx vitest run
```

---

## 📁 Files to Change

| File | Change | Effort |
|------|--------|--------|
| `backend/test/badge-templates-ownership.e2e-spec.ts` | **NEW** — E2E tests for update/delete ownership | 45min |
| `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx` | **ADD** ownership UI test cases | 30min |
| `docs/sprints/sprint-16/16-3-template-edit-ownership-guard.md` | Update status, mark ACs, note findings | 5min |

**No backend source changes needed** — the ownership guard is already implemented.

---

## ⚠️ Important Notes

1. **Do NOT duplicate ownership checks** — they already exist in the controller. Just write tests.
2. If you discover any gap during testing (e.g., a missing check), fix it and document the finding.
3. The `BadgeTemplateFormPage` (edit page) itself does not re-check ownership — it relies on the API returning 403. This is acceptable because the list page already prevents navigation to the edit page for non-owners (shows "View" with `?readonly=true` query param).
4. If the `BadgeTemplateFormPage` in edit mode doesn't handle 403 gracefully (e.g., no error toast), add a simple error handler — but this would be a minor enhancement, not a blocker.

---

## 📎 Reference Files

- **Controller (update + delete guards)**: `backend/src/badge-templates/badge-templates.controller.ts` lines 270-331
- **Frontend ownership UI**: `frontend/src/pages/admin/BadgeTemplateListPage.tsx` lines 397-610
- **Existing frontend tests**: `frontend/src/pages/admin/BadgeTemplateListPage.test.tsx`
- **E2E test patterns**: see existing E2E specs in `backend/test/` for auth + role setup patterns
- **RequestWithUser**: `backend/src/common/interfaces/request-with-user.interface.ts`

---

## 🔀 Code Review Checklist

After implementation, verify:
- [ ] E2E tests cover: Issuer-own ✅, Issuer-other ✗, Admin-any ✅ for both update and delete
- [ ] Frontend tests verify conditional rendering of Edit/View, status buttons, delete button
- [ ] No regression in existing badge-templates test suite
- [ ] No unnecessary code duplication (don't re-implement existing guards)
- [ ] Story doc updated with findings and completion notes
