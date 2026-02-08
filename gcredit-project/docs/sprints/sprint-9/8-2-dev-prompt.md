# Story 8.2 Dev Agent Prompt: CSV Upload & Parsing

**Sprint:** Sprint 9 | **Epic:** 8 - Bulk Badge Issuance | **Priority:** HIGH  
**Estimated Hours:** 11.5h | **Target Version:** v0.9.0  
**Date Created:** 2026-02-07  
**Dependencies:** Story 8.1 ✅ (completed 2026-02-07)  
**Security Critical:** 🔴 YES — XSS sanitization, rate limiting, transaction validation  

---

## 🎯 Mission

Implement Story 8.2 — CSV Upload & Parsing. This story enhances the existing upload endpoint with XSS sanitization, rate limiting, database transaction-wrapped validation, and enhanced drag-drop UX. Most of the upload/parsing infrastructure already exists from Story 8.1; this story focuses on **hardening security, improving UX, and adding missing features**.

---

## 📋 Pre-Conditions — What Already Exists (DO NOT Recreate)

Story 8.1 already implemented a substantial portion of the upload flow. **Read and understand** these files before making changes:

### Backend (already functional)

| File | What's Already There |
|------|---------------------|
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | `POST /api/bulk-issuance/upload` with Multer `FileInterceptor`, 100KB file size limit, RBAC (ISSUER/ADMIN), CSV mimetype check |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | `createSession()` — UTF-8 BOM stripping, RFC 4180 `parseCsvLine()`, header validation (`badgeTemplateId`, `recipientEmail`), max 20 rows, in-memory session store, 30-min TTL, IDOR protection |
| `backend/src/bulk-issuance/csv-validation.service.ts` | `sanitizeCsvField()` (ARCH-C1), `validateBadgeTemplateIdInDb()`, `validateRegisteredEmail()`, `validateEvidenceUrl()`, `validateNotes()`, `validateRow()`, `isExampleData()`, `generateSafeCsv()` |
| `backend/src/bulk-issuance/bulk-issuance.module.ts` | Module registered with PrismaModule, exports BulkIssuanceService + CsvValidationService |

### Frontend (already functional)

| File | What's Already There |
|------|---------------------|
| `frontend/src/pages/BulkIssuancePage.tsx` | Step 1 (template download) + Step 2 (CSV upload) with drag-drop, file validation (100KB/.csv), upload to `POST /api/bulk-issuance/upload`, navigate to preview on success, toast notifications |
| `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` | Preview table, error panel, re-upload workflow, error report download |
| `frontend/src/components/BulkIssuance/ProcessingModal.tsx` | Pseudo-progress indicator |
| `frontend/src/App.tsx` | Routes: `/admin/bulk-issuance`, `/admin/bulk-issuance/preview/:sessionId` |

### Infrastructure (already set up)

| Component | Status |
|-----------|--------|
| `@nestjs/throttler` | ✅ Installed (`^6.5.0`), `ThrottlerModule` configured globally in `app.module.ts`, `ThrottlerGuard` applied globally |
| `@nestjs/platform-express` + Multer | ✅ Already used in upload endpoint |
| `PrismaService` | ✅ Injected into `CsvValidationService` |
| RBAC (`JwtAuthGuard` + `RolesGuard`) | ✅ Applied to all bulk-issuance endpoints |

---

## 📦 Deliverables

### Task 1: Backend — XSS Input Sanitization (ARCH-C7) (1.5h)

**Problem:** User-supplied text fields (`narrativeJustification`, `evidenceUrl`, `badgeTemplateId`) could contain XSS payloads that execute in the preview UI.

**Solution:** Add server-side HTML sanitization for all text input fields.

**Option A (Preferred): Use `sanitize-html` package** (lightweight, server-side only)
```bash
cd gcredit-project/backend
npm install sanitize-html
npm install -D @types/sanitize-html
```

**Option B: Manual regex stripping** (if no new dependency preferred)

**File:** `backend/src/bulk-issuance/csv-validation.service.ts`

Add a new method and integrate into `validateRow()`:

```typescript
import sanitize from 'sanitize-html';

/**
 * Sanitize text input to prevent XSS attacks (ARCH-C7)
 * Strips ALL HTML tags and attributes from text fields
 */
sanitizeTextInput(value: string): string {
  if (!value) return value;
  return sanitize(value, {
    allowedTags: [],        // No HTML tags allowed
    allowedAttributes: {},  // No attributes allowed
  });
}
```

**Integration points — sanitize BEFORE validation:**
1. In `createSession()` (bulk-issuance.service.ts) — sanitize each row's text fields after CSV parsing, before passing to `validateRow()`
2. Sanitize: `narrativeJustification`, `badgeTemplateId` (name field), `evidenceUrl` (strip HTML from URL strings)
3. Do NOT sanitize `recipientEmail` — email validation already enforces format

**Tests to add** (in `csv-validation.service.spec.ts`):
- Test: strips `<script>alert('xss')</script>` from narrativeJustification
- Test: strips HTML tags `<b>bold</b>` → `bold`
- Test: handles nested HTML `<div><script>x</script></div>` → empty or clean text
- Test: preserves clean text without modification
- Test: handles null/empty safely

---

### Task 2: Backend — Rate Limiting for Upload Endpoint (ARCH-C3) (0.5h)

**Problem:** An attacker could spam the upload endpoint to consume server resources.

**Solution:** `@nestjs/throttler` is already installed and configured globally. Add endpoint-specific stricter limit to the upload endpoint. Make limit environment-configurable for test/dev.

**File:** `backend/src/bulk-issuance/bulk-issuance.controller.ts`

```typescript
import { Throttle } from '@nestjs/throttler';

// Add to the uploadCsv method:
// Production: 10/5min | Test/Dev: configurable via UPLOAD_THROTTLE_LIMIT env var
@Throttle({ default: { 
  ttl: parseInt(process.env.UPLOAD_THROTTLE_TTL || '300000'),
  limit: parseInt(process.env.UPLOAD_THROTTLE_LIMIT || '10'),
} })  // 10 uploads per 5 minutes per user (updated 2026-02-07, was 3)
@Post('upload')
// ... existing decorators
async uploadCsv(...) { ... }
```

**Also handle 429 response in Swagger:**
```typescript
@ApiResponse({ status: 429, description: 'Too many upload requests. Try again later.' })
```

**Environment overrides (test/dev):**
- `.env.test`: `UPLOAD_THROTTLE_LIMIT=50`
- `test/setup.ts`: `process.env.UPLOAD_THROTTLE_LIMIT = '50';`

**Tests:**
- E2E test: 11th upload within 5 minutes returns 429 (production limit = 10)

---

### Task 3: Backend — Database Transaction Validation (ARCH-C4) (1.5h)

**Problem:** Current validation does individual DB queries per row. If a badge template is revoked mid-validation, earlier rows pass but later ones fail, causing inconsistency.

**Solution:** Wrap the entire validation pass in a Prisma transaction with `READ COMMITTED` isolation.

**File:** `backend/src/bulk-issuance/bulk-issuance.service.ts`

Refactor `createSession()` to use a transaction:

```typescript
async createSession(csvContent: string, issuerId: string): Promise<PreviewData> {
  // ... existing CSV parsing code (BOM strip, header check, max rows) ...

  // Wrap validation in a database transaction for consistency (ARCH-C4)
  const { validRows, errors, rows } = await this.prisma.$transaction(async (tx) => {
    const localValidRows: any[] = [];
    const localErrors: SessionError[] = [];
    const localRows: PreviewData['rows'] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = this.parseCsvLine(lines[i]);
      
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      // XSS Sanitize text fields BEFORE validation (ARCH-C7)
      row.narrativeJustification = this.csvValidation.sanitizeTextInput(row.narrativeJustification || '');
      row.badgeTemplateId = this.csvValidation.sanitizeTextInput(row.badgeTemplateId || '');

      // Validate within transaction context
      const rowValidation = await this.csvValidation.validateRowInTransaction(row, tx);
      
      // ... same error/valid row logic as current ...
    }
    
    return { validRows: localValidRows, errors: localErrors, rows: localRows };
  }, {
    isolationLevel: 'ReadCommitted',
    timeout: 10000,  // 10 second timeout for validation
  });

  // ... store session (same as current) ...
}
```

**File:** `backend/src/bulk-issuance/csv-validation.service.ts`

Add a transaction-aware validation method:

```typescript
/**
 * Validate a row using a transaction-scoped Prisma client (ARCH-C4)
 * Ensures consistent reads during batch validation
 */
async validateRowInTransaction(
  row: Record<string, string>, 
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Check badge template exists with ACTIVE status
  if (!row.badgeTemplateId) {
    errors.push('Badge template ID is required');
  } else if (this.isExampleData(row.badgeTemplateId)) {
    errors.push('Example row detected. Please delete example rows and add your real data.');
  } else {
    const template = await tx.badgeTemplate.findFirst({
      where: {
        OR: [{ id: row.badgeTemplateId }, { name: row.badgeTemplateId }],
        status: 'ACTIVE',
      },
    });
    if (!template) {
      errors.push(`Badge template "${row.badgeTemplateId}" not found or is not in ACTIVE status`);
    }
  }
  
  // Check recipient email
  // ... similar pattern using tx instead of this.prisma ...
  
  // Validate evidence URL and notes (non-DB, same as current)
  const urlResult = this.validateEvidenceUrl(row.evidenceUrl);
  if (!urlResult.valid) errors.push(urlResult.error!);
  
  const notesResult = this.validateNotes(row.narrativeJustification);
  if (!notesResult.valid) errors.push(notesResult.error!);
  
  return { valid: errors.length === 0, errors };
}
```

**Tests:**
- Test: validation uses transaction (mock Prisma `$transaction`)
- Test: validation is consistent even if template status changes during batch

---

### Task 4: Frontend — Enhanced Drag-Drop Visual Feedback (UX-P1-4) (1h)

**Problem:** Current drag-drop has basic visual feedback but doesn't match UX-P1-4 spec.

**File:** `frontend/src/pages/BulkIssuancePage.tsx`

Enhance the drop zone with three distinct visual states:

```typescript
// Add state for file selected
const [fileSelected, setFileSelected] = useState(false);

// Update drop zone className:
const dropZoneClasses = `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
  transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center
  ${isUploading ? 'opacity-50 pointer-events-none' : ''}
  ${dragActive 
    ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'    // Drag-over state
    : fileSelected
      ? 'border-green-500 bg-green-50'                         // File selected state
      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'  // Default state
  }`;
```

**Add file preview section** (show selected file details before auto-upload):
```tsx
{selectedFile && !isUploading && (
  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span>✅ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
  </div>
)}
```

**Modify upload flow:** Instead of auto-uploading on file select → show file preview first with explicit "Upload CSV" button:
1. `handleFileChange` → set `selectedFile` and `fileSelected = true`, but do NOT auto-call `handleUpload`
2. Add separate "Upload CSV" button below drop zone (enabled when `selectedFile` exists)
3. Upload button → calls `handleUpload(selectedFile)`

**Tests to add** (in `BulkIssuancePage.test.tsx`):
- Test: drag-over state applies blue border classes
- Test: file selected state shows file preview with name and size
- Test: upload button disabled when no file selected

---

### Task 5: Frontend — Validation Summary Display (0.5h)

**Current behavior:** After upload, the page immediately navigates to the preview page.

**Enhancement:** When upload returns errors, show an inline validation summary before navigating:

**File:** `frontend/src/pages/BulkIssuancePage.tsx`

Add state and conditional rendering:

```typescript
const [uploadResult, setUploadResult] = useState<{
  totalRows: number;
  validRows: number;
  errorRows: number;
  sessionId: string;
} | null>(null);
```

**After successful upload response:**
- If `errorRows === 0` → auto-navigate to preview (current behavior)
- If `errorRows > 0` → show summary panel with:
  ```
  ✅ 15 of 20 badges valid
  ❌ 5 errors found
  
  [View Preview & Fix Errors →]    [Upload New File]
  ```

**Tests:**
- Test: shows validation summary when errors exist
- Test: auto-navigates when no errors

---

### Task 6: Backend — CRLF Line Ending Support (0.5h)

**File:** `backend/src/bulk-issuance/bulk-issuance.service.ts`

The current `createSession()` splits on `\n`. Enhance to handle Windows CRLF (`\r\n`):

```typescript
// Replace:
const lines = cleanContent.split('\n')

// With:
const lines = cleanContent.split(/\r?\n/)
```

Also strip trailing `\r` from parsed fields in `parseCsvLine()` if any remain.

**Tests:**
- Test: parses CRLF line endings correctly
- Test: parses LF line endings correctly  
- Test: handles mixed line endings

---

### Task 7: E2E Tests (1.5h)

**Create:** `backend/test/bulk-issuance-upload.e2e-spec.ts`

| # | Test Case | Expected |
|---|-----------|----------|
| 1 | POST upload with valid CSV → returns 201 with sessionId | `{sessionId, validRows, errorRows}` |
| 2 | POST upload with no file → returns 400 | `CSV file is required` |
| 3 | POST upload with non-CSV file → returns 400 | `File must be in CSV format` |
| 4 | POST upload with >100KB file → returns 413 or 400 | File size error |
| 5 | POST upload with >20 rows → returns 400 | `exceeding the maximum of 20` |
| 6 | POST upload with missing headers → returns 400 | `Missing required header` |
| 7 | POST upload with EXAMPLE rows → errors array includes example detection | `Example row detected` |
| 8 | POST upload with XSS in narrativeJustification → sanitized in response | No `<script>` in response |
| 9 | POST upload 11th time within 5 min → returns 429 | Rate limited (ARCH-C3: 10/5min) |
| 10 | POST upload as EMPLOYEE → returns 403 | RBAC enforced |
| 11 | GET preview with wrong userId → returns 403 | IDOR protection |
| 12 | POST upload with CRLF line endings → parses correctly | Same result as LF |

---

## ⚙️ Technical Constraints

| Constraint | Value |
|-----------|-------|
| Max file size | 100KB (102,400 bytes) — Multer limit already set |
| Max rows | 20 — already enforced in `createSession()` |
| Rate limit (upload) | 10 per 5 minutes per user (env-configurable via `UPLOAD_THROTTLE_LIMIT`) |
| Session TTL | 30 minutes — already implemented |
| Processing | Synchronous (no Redis/Bull) |
| XSS prevention | `sanitize-html` (strip all HTML tags) |
| CSV injection | `sanitizeCsvField()` already in place (ARCH-C1 ✅) |
| IDOR protection | `session.issuerId !== currentUserId` already in place (ARCH-C2 ✅) |
| Transaction isolation | `READ COMMITTED` for validation |
| Transaction timeout | 10 seconds |
| Framework | NestJS 11, React 19, Vite 7, Tailwind + Shadcn/ui |
| Test target | ≥80% coverage |

---

## 🧪 Test Summary

| Type | Count | Location |
|------|-------|----------|
| Unit — XSS sanitization | 5 | `csv-validation.service.spec.ts` |
| Unit — transaction validation | 2 | `csv-validation.service.spec.ts` |
| Unit — CRLF parsing | 3 | `bulk-issuance.service.spec.ts` |
| Component — drag-drop UX | 3 | `BulkIssuancePage.test.tsx` |
| Component — validation summary | 2 | `BulkIssuancePage.test.tsx` |
| E2E — upload endpoint | 12 | `test/bulk-issuance-upload.e2e-spec.ts` |
| **Total New Tests** | **27** | |

---

## 📁 Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `backend/test/bulk-issuance-upload.e2e-spec.ts` | E2E tests for upload endpoint |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/bulk-issuance/csv-validation.service.ts` | Add `sanitizeTextInput()` (ARCH-C7), `validateRowInTransaction()` (ARCH-C4) |
| `backend/src/bulk-issuance/csv-validation.service.spec.ts` | Add XSS + transaction tests |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Wrap validation in `$transaction` (ARCH-C4), add XSS sanitization call, fix CRLF |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | Add CRLF + transaction tests |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Add `@Throttle` to upload endpoint (ARCH-C3), 429 ApiResponse |
| `backend/package.json` | Add `sanitize-html`, `@types/sanitize-html` |
| `frontend/src/pages/BulkIssuancePage.tsx` | Enhanced drag-drop UX (P1-4), validation summary, separate upload button |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | Add drag-drop + validation summary tests |

---

## ⚠️ Critical Implementation Notes

1. **DO NOT break existing tests.** Story 8.1 delivered 485 backend + 334 frontend + 6 E2E tests — all must continue passing.

2. **`validateRow()` must remain backward-compatible.** The non-transaction version is used in existing tests. Add `validateRowInTransaction()` as a **new method**, keep the old one.

3. **The upload endpoint already works.** Your job is to harden it, not rewrite it. The `POST /api/bulk-issuance/upload` → `createSession()` flow is functional.

4. **`sanitize-html` is a backend-only dependency.** Do NOT install it in the frontend package.

5. **Rate limiting is already global.** You're adding a **stricter, endpoint-specific** limit using `@Throttle()` decorator — this overrides the global default for this one endpoint only. The limit (10/5min) is configurable via `UPLOAD_THROTTLE_LIMIT` and `UPLOAD_THROTTLE_TTL` environment variables for test/dev flexibility.

6. **In-memory session store is intentional for MVP.** Do NOT create a Prisma migration or database table for sessions — that's deferred per architecture decision. The `Map<string, ...>` in `bulk-issuance.service.ts` is the designed approach.

---

## ✅ Definition of Done

- [ ] All 6 Acceptance Criteria met (AC1-AC6)
- [ ] ARCH-C3 (rate limiting) applied to upload endpoint
- [ ] ARCH-C4 (transaction validation) implemented
- [ ] ARCH-C5 (BOM handling) verified working (already exists, add test if missing)
- [ ] ARCH-C7 (XSS sanitization) implemented with `sanitize-html`
- [ ] UX-P1-4 (drag-drop visual feedback) enhanced
- [ ] 27 new tests pass
- [ ] All existing tests pass (0 regressions)
- [ ] `npm run lint` — no new critical errors
- [ ] Rate limiting returns 429 correctly for spam uploads
- [ ] XSS payloads stripped from all text fields

---

## 🔗 Dependencies & References

- **Implementation Spec:** `gcredit-project/docs/sprints/sprint-9/8-2-csv-upload-parsing.md`
- **Story 8.1 (prerequisite):** `gcredit-project/docs/sprints/sprint-9/8-1-csv-template-validation.md` — Status: ✅ done
- **UX/Arch Review:** `gcredit-project/docs/sprints/sprint-9/ux-arch-review-report.md`
- **Sprint Backlog:** `gcredit-project/docs/sprints/sprint-9/backlog.md`
- **Project Context:** `project-context.md`
- **Auth throttle pattern:** `backend/src/modules/auth/auth.controller.ts` (reference for `@Throttle` usage)

---

## 🚀 Execution Order

```
1. Task 1: XSS Sanitization — install sanitize-html, add sanitizeTextInput() (1.5h)
2. Task 2: Rate Limiting — add @Throttle to upload endpoint (0.5h)
3. Task 6: CRLF Support — fix line ending handling (0.5h)
4. Task 3: Transaction Validation — wrap validation in $transaction (1.5h)
5. Task 4: Frontend — Enhanced drag-drop UX (1h)
6. Task 5: Frontend — Validation summary display (0.5h)
7. Task 7: E2E Tests (1.5h)
```

**After each task:** Run relevant tests to verify, commit incrementally.

**After all tasks:** Run full test suite to confirm 0 regressions:
```bash
cd gcredit-project/backend && npm test
cd gcredit-project/frontend && npm test
cd gcredit-project/backend && npm run test:e2e
```
