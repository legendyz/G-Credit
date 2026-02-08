# Story 8.1 Dev Agent Prompt: CSV Template & Validation

**Sprint:** Sprint 9 | **Epic:** 8 - Bulk Badge Issuance | **Priority:** HIGH  
**Estimated Hours:** 8.5h | **Target Version:** v0.9.0  
**Date Created:** 2026-02-07  

---

## 🎯 Mission

Implement Story 8.1 — CSV Template & Validation for the Bulk Badge Issuance feature. This story delivers the template download UI, template generation API improvements, CSV field validation logic, and a new frontend page at `/admin/bulk-issuance`.

---

## 📋 Pre-Conditions (Already Complete)

The following P0 fixes are **already implemented** — do NOT reimplement:

- ✅ **ARCH-C1** — `CsvValidationService.sanitizeCsvField()` in `backend/src/bulk-issuance/csv-validation.service.ts`
- ✅ **ARCH-C2** — IDOR ownership validation in `bulk-issuance.service.ts` (session.issuerId checks)
- ✅ **UX-P0-1** — `ProcessingModal.tsx` pseudo-progress indicator
- ✅ **UX-P0-2** — `EXAMPLE-DELETE-THIS-ROW` prefix in `generateTemplate()`
- ✅ **UX-P0-3** — Error report download + re-upload workflow in `BulkPreviewPage.tsx`

### Existing Files (DO NOT recreate from scratch — extend/modify as needed)

```
backend/src/bulk-issuance/
├── bulk-issuance.controller.ts    # Already has: GET template, POST upload, GET preview, POST confirm, GET error-report
├── bulk-issuance.module.ts        # Already registered in AppModule
├── bulk-issuance.service.ts       # Already has: generateTemplate(), createSession(), getPreviewData(), confirmBulkIssuance()
├── bulk-issuance.service.spec.ts  # Already has: IDOR prevention tests
├── csv-validation.service.ts      # Already has: sanitizeCsvField(), validateBadgeTemplateId(), validateEmail(), isExampleData()
├── csv-validation.service.spec.ts # Already has: 24+ injection tests

frontend/src/components/BulkIssuance/
├── BulkPreviewPage.tsx            # Already has: preview table, error panel, re-upload workflow
├── ProcessingModal.tsx            # Already has: pseudo-progress indicator
├── index.ts                       # Already has: barrel exports
```

---

## 📦 Deliverables

### Task 1: Backend — Improve Template Generation (2h)

**File:** `backend/src/bulk-issuance/bulk-issuance.service.ts`

**What to change in `generateTemplate()`:**

1. **Enhance CSV header comments** — Add field-by-field documentation:
   ```csv
   # G-Credit Bulk Badge Issuance Template
   # Instructions: Fill in the rows below with badge issuance data
   # DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOADING YOUR REAL DATA
   #
   # Field Specifications:
   # templateId       - Badge template name (e.g., "Leadership Excellence") or UUID (REQUIRED)
   # recipientEmail   - Must match a registered user email address (REQUIRED)
   # evidenceUrl      - Link to supporting documentation, HTTP/HTTPS format (OPTIONAL)
   # notes            - Reason for awarding this badge, max 500 characters (OPTIONAL)
   #
   # Tips:
   # - You can find badge template names in the Badge Catalog page
   # - Maximum 20 badges per upload (file size limit: 100KB)
   # - recipientEmail must match existing user accounts
   ```

2. **Dynamic filename with date** — Change `downloadTemplate()` in controller to use dynamic filename:
   ```typescript
   const dateStr = new Date().toISOString().split('T')[0]; // e.g., 2026-02-07
   res.setHeader('Content-Disposition', `attachment; filename="bulk-badge-issuance-template-${dateStr}.csv"`);
   ```

3. **UTF-8 BOM prefix** — Add BOM for Excel compatibility:
   ```typescript
   const BOM = '\uFEFF';
   res.send(BOM + csv);
   ```

**File:** `backend/src/bulk-issuance/bulk-issuance.controller.ts`
- Update `downloadTemplate()` with dynamic date filename and BOM prefix

**Tests to add/update** (in `bulk-issuance.service.spec.ts`):
- Test: template contains all required headers
- Test: template contains field documentation comments
- Test: template contains EXAMPLE-DELETE-THIS-ROW rows
- Test: template uses UTF-8 encoding

---

### Task 2: Backend — Enhance Validation Logic (1.5h)

**File:** `backend/src/bulk-issuance/csv-validation.service.ts`

Add the following validation methods (some partially exist, enhance them):

```typescript
// Add these methods or enhance existing ones:

/**
 * Validate evidence URL format (optional field)
 */
validateEvidenceUrl(url: string | null): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') return { valid: true }; // Optional field
  
  const urlRegex = /^https?:\/\/.+/i;
  if (!urlRegex.test(url)) {
    return { valid: false, error: 'Evidence URL must be a valid HTTP/HTTPS URL' };
  }
  return { valid: true };
}

/**
 * Validate narrative justification length (optional, max 500 chars)
 */
validateNotes(text: string | null): { valid: boolean; error?: string } {
  if (!text || text.trim() === '') return { valid: true }; // Optional field
  
  if (text.length > 500) {
    return { valid: false, error: `Notes exceed 500 character limit (${text.length} chars)` };
  }
  return { valid: true };
}

/**
 * Validate a complete CSV row
 */
validateRow(row: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const templateResult = this.validateBadgeTemplateId(row.templateId);
  if (!templateResult.valid) errors.push(templateResult.error!);
  
  const emailResult = this.validateEmail(row.recipientEmail);
  if (!emailResult.valid) errors.push(emailResult.error!);
  
  const urlResult = this.validateEvidenceUrl(row.evidenceUrl);
  if (!urlResult.valid) errors.push(urlResult.error!);
  
  const notesResult = this.validateNotes(row.notes);
  if (!notesResult.valid) errors.push(notesResult.error!);
  
  return { valid: errors.length === 0, errors };
}
```

**Tests to add** (in `csv-validation.service.spec.ts`):
- `validateEvidenceUrl` — 5 tests: null/empty returns valid, valid HTTP URL, valid HTTPS URL, invalid URL format, ftp URL rejected
- `validateNotes` — 4 tests: null returns valid, valid text under 500 chars, exactly 500 chars valid, 501+ chars rejected
- `validateRow` — 6 tests: all valid row, missing templateId, invalid email, invalid URL, notes too long, multiple errors

---

### Task 3: Frontend — Bulk Issuance Page + Template Download (2.5h)

**Create:** `frontend/src/pages/BulkIssuancePage.tsx`

```
Route: /admin/bulk-issuance
RBAC: ISSUER, ADMIN only
```

**Page Layout:**
```
+------------------------------------------------------+
|  Bulk Badge Issuance                                 |
|------------------------------------------------------|
|  Step 1: Download Template                           |
|                                                      |
|  [🎖 Select Badge Template ▼]  (P1 - autocomplete)  |
|                                                      |
|  [📥 Download CSV Template]                          |
|                                                      |
|  📋 Instructions:                                    |
|  1. Download the CSV template above                  |
|  2. Open in Excel/Google Sheets                      |
|  3. Delete the example rows (marked EXAMPLE-DELETE)  |
|  4. Fill in your badge issuance data                 |
|  5. Save as CSV and upload in Step 2 below          |
|                                                      |
|  💡 Tip: Find badge template names in Badge Catalog  |
|  ⚠️ Maximum 20 badges per upload (100KB limit)       |
|------------------------------------------------------|
|  Step 2: Upload CSV                                  |
|                                                      |
|  [ Drag & drop CSV file here, or click to browse ]   |
|                                                      |
|  Supported: .csv files up to 100KB (max 20 rows)     |
+------------------------------------------------------+
```

**Implementation Details:**
1. Use existing UI patterns from the project (Shadcn/ui components, Tailwind CSS)
2. `downloadTemplate()` — calls `GET /api/bulk-issuance/template`, triggers browser download
3. Show success toast via `sonner`: "CSV template downloaded successfully"
4. Upload section — calls `POST /api/bulk-issuance/upload` with `FormData`
5. On successful upload → redirect to `/admin/bulk-issuance/preview/:sessionId` (BulkPreviewPage)
6. File validation before upload:
   - Must be `.csv` file
   - Max size 100KB (102,400 bytes)
   - Show clear error toast if file too large: "File exceeds 100KB limit. Maximum 20 badges per upload."

**Create:** `frontend/src/pages/BulkIssuancePage.test.tsx`
- Test: renders download template button
- Test: download button calls API and triggers file download
- Test: shows success toast after download

---

### Task 4: Frontend — Register Route in App.tsx (0.5h)

**File:** `frontend/src/App.tsx`

Add the new route after the `/admin/badges` route:

```tsx
import BulkIssuancePage from '@/pages/BulkIssuancePage';

// Add inside <Routes>:
<Route 
  path="/admin/bulk-issuance" 
  element={
    <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
      <Layout pageTitle="Bulk Badge Issuance">
        <BulkIssuancePage />
      </Layout>
    </ProtectedRoute>
  } 
/>

// Also add preview route for BulkPreviewPage (already exists as component):
<Route 
  path="/admin/bulk-issuance/preview/:sessionId" 
  element={
    <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
      <Layout pageTitle="Bulk Issuance Preview">
        <BulkPreviewPage />
      </Layout>
    </ProtectedRoute>
  } 
/>
```

Also add a navigation link to the sidebar/nav if applicable — check `frontend/src/components/layout/Layout.tsx` for nav structure and add a "Bulk Issuance" link for ADMIN/ISSUER roles.

---

### Task 5: E2E Testing (1h)

**Create:** `backend/test/bulk-issuance-template.e2e-spec.ts`

Tests:
1. `GET /api/bulk-issuance/template` — returns 200 with CSV content-type
2. `GET /api/bulk-issuance/template` — CSV has correct headers (templateId, recipientEmail, evidenceUrl, notes)
3. `GET /api/bulk-issuance/template` — CSV contains EXAMPLE-DELETE-THIS-ROW in example rows
4. `GET /api/bulk-issuance/template` — response has Content-Disposition with dynamic date filename
5. `GET /api/bulk-issuance/template` — EMPLOYEE role returns 403 Forbidden

---

### Task 6: P1 Enhancement — Badge Template Selector (1h, if time permits)

**Priority:** P1 — implement after core tasks 1-5 are complete

**File:** `frontend/src/components/BulkIssuance/TemplateSelector.tsx`

- Autocomplete/dropdown that fetches `GET /api/badge-templates?status=APPROVED`
- On select → passes `badgeTemplateId` to download function
- Download generates template with pre-filled templateId column
- Display: template name + ID for clarity

**This is optional for Sprint 9 MVP.** If time doesn't permit, skip and mark as deferred.

---

## ⚙️ Technical Constraints

| Constraint | Value |
|-----------|-------|
| Max file size | 100KB (not 10MB) |
| Max badges per upload | 20 |
| Processing type | Synchronous (no Redis/Bull) |
| Session TTL | 30 minutes |
| Notes max length | 500 characters |
| CSV encoding | UTF-8 with BOM |
| RBAC | ISSUER, ADMIN only |
| Framework | NestJS 11 (backend), React 19 + Vite 7 (frontend) |
| UI library | Tailwind CSS + Shadcn/ui |
| Test target | ≥80% coverage |

---

## 🧪 Test Summary

| Type | Count | Location |
|------|-------|----------|
| Unit — template generation | 4 | `bulk-issuance.service.spec.ts` |
| Unit — validation methods | 15 | `csv-validation.service.spec.ts` |
| Component — download UI | 3 | `BulkIssuancePage.test.tsx` |
| E2E — template endpoint | 5 | `test/bulk-issuance-template.e2e-spec.ts` |
| **Total New Tests** | **27** | |

---

## 📁 Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/pages/BulkIssuancePage.tsx` | Main bulk issuance page with template download + CSV upload |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | Component tests |
| `backend/test/bulk-issuance-template.e2e-spec.ts` | E2E tests for template endpoint |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | (P1 optional) Badge template selector |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Enhance `generateTemplate()` with field docs, improve CSV format |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Dynamic filename with date, UTF-8 BOM |
| `backend/src/bulk-issuance/csv-validation.service.ts` | Add `validateEvidenceUrl()`, `validateNotes()`, `validateRow()` |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | Add 4 template generation tests |
| `backend/src/bulk-issuance/csv-validation.service.spec.ts` | Add 15 validation tests |
| `frontend/src/App.tsx` | Add `/admin/bulk-issuance` and `/admin/bulk-issuance/preview/:sessionId` routes |
| `frontend/src/components/layout/Layout.tsx` | Add "Bulk Issuance" nav link (ADMIN/ISSUER) |
| `frontend/src/components/BulkIssuance/index.ts` | Export new components |

---

## ✅ Definition of Done

- [ ] All 7 Acceptance Criteria (AC1-AC7) met
- [ ] 27 new tests pass
- [ ] All 876 existing tests pass (0 regressions)
- [ ] `npm run lint` — no new critical ESLint errors
- [ ] Template downloads correctly in browser
- [ ] CSV opens properly in Excel/Google Sheets (UTF-8 with BOM)
- [ ] RBAC enforced: only ISSUER/ADMIN can access
- [ ] Code follows existing project patterns (Controller-Service, Prisma, ProtectedRoute)

---

## 🔗 Dependencies & References

- **Implementation Spec:** `gcredit-project/docs/sprints/sprint-9/8-1-csv-template-validation.md`
- **Sprint Backlog:** `gcredit-project/docs/sprints/sprint-9/backlog.md`
- **Architecture:** `gcredit-project/docs/architecture/system-architecture.md`
- **UX/Arch Review:** `gcredit-project/docs/sprints/sprint-9/ux-arch-review-report.md`
- **Project Context:** `project-context.md` (Single Source of Truth)

---

## 🚀 Execution Order

```
1. Task 1: Backend — Enhance generateTemplate() + controller (2h)
2. Task 2: Backend — Add validation methods to CsvValidationService (1.5h)
3. Task 3: Frontend — Create BulkIssuancePage with download + upload (2.5h)
4. Task 4: Frontend — Register routes in App.tsx + nav link (0.5h)
5. Task 5: E2E Tests (1h)
6. Task 6: P1 Template Selector (1h, optional)
```

**After each task:** Run relevant tests to verify, commit incrementally.

**After all tasks:** Run full test suite `npm test` to confirm 0 regressions.
