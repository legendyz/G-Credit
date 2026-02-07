# Story 8.2: CSV Upload & Parsing

**Status:** review  
**Epic:** Epic 8 - Bulk Badge Issuance  
**Sprint:** Sprint 9  
**Priority:** HIGH  
**Estimated Hours:** 11.5h (原6h + 安全修复4.5h + UX改进1h)  
**Actual Hours:** 4h  
**Dependencies:** Story 8.1 (CSV Template)  
**Post-Review Updates:** C1, C3, C4, C5, C7, UX-P1-4 (2026-02-05架构/UX审查)  
**Security Critical:** 🔴 MUST fix C1 (CSV Injection) and C2 (IDOR) before dev starts

---

## Story

As an **Issuer**,  
I want **to upload a CSV file for bulk badge issuance**,  
So that **I can issue multiple badges at once**.

---

## Acceptance Criteria

1. [x] **AC1: File Upload UI** ⚠️ **P1-Enhancement**
   - File upload input accepts CSV and TXT files only
   - Drag-and-drop support for CSV files
   - Maximum file size: 100KB (updated from 10MB for 20-badge MVP)
   - Upload button disabled until file selected
   - ⚠️ **UX-P1-4**: Add drag-drop visual feedback states (1h)
     - Default: Dashed border `#ccc`
     - Drag-over: Blue border `#007bff`, scale 1.02, background `#e7f3ff`
     - File selected: Green border `#28a745`, background `#d4edda`

2. [x] **AC2: File Validation**
   - Validate file size (max 10MB)
   - Validate file type (CSV or TXT only)
   - Show error if validation fails with specific reason

3. [x] **AC3: CSV Parsing** 🔴 **Security Fix**
   - Parse CSV file and validate structure
   - Check for required headers: `badgeTemplateId, recipientEmail`
   - UTF-8 encoding support
   - ⚠️ **ARCH-C5**: Handle UTF-8 BOM (Windows Excel adds `EF BB BF`, 0.5h)
     - Strip BOM before parsing to prevent header mismatch
     - Test with Windows Excel-generated CSVs
   - Handle both CRLF and LF line endings

4. [x] **AC4: Row Validation** 🔴 **CRITICAL Security Fixes**
   - ⚠️ **ARCH-C1**: CSV Injection sanitization (BLOCKER, 1h)
     - Strip dangerous formula prefixes: `=`, `+`, `-`, `@`, `\t`, `\r`
     - Prefix with single quote `'` to force text interpretation in Excel
     - Apply to: narrativeJustification, evidenceUrl fields
     - Prevents Remote Code Execution (RCE) when admins download error reports
   - ⚠️ **ARCH-C7**: XSS input sanitization (1h)
     - Use DOMPurify to sanitize all text fields
     - Strip all HTML tags from narrativeJustification
     - Prevents XSS attacks in preview UI
   - Validate each row for required fields (badgeTemplateId, recipientEmail)
   - ⚠️ **ARCH-C4**: Run validation in database transaction (1.5h)
     - Load templates + users in single transaction for consistency
     - Prevents race conditions (template revoked during validation)
   - Check badgeTemplateId exists and status = APPROVED
   - Check recipientEmail exists in User table
   - Validate evidenceUrl format (if provided)
   - Validate narrativeJustification length ≤500 chars (if provided)
   - Collect all errors with row numbers

5. [x] **AC5: Validation Summary**
   - API endpoint POST `/api/bulk-issuance/upload` accepts CSV file
   - Response includes: totalRows, validRows, errorRows count

6. [x] **AC6: Rate Limiting** 🔴 **Security Fix** (ARCH-C3, 0.5h)
   - Add `@Throttle({ default: { ttl: 300000, limit: 10 } })` to upload endpoint
   - Limit: 10 uploads per 5 minutes per user (updated 2026-02-07, was 3)
   - Environment-configurable via `UPLOAD_THROTTLE_LIMIT` for test/dev (default: 50)
   - Prevents DoS attacks via spam uploads
   - Return 429 Too Many Requests with retry-after header
   - Response includes array of validation errors with row numbers
   - Successful parse stores data in temporary staging table

6. [x] **AC6: Session Management**
   - Upload creates temporary session (30 min expiry)
   - Session ID returned for preview retrieval
   - Old sessions cleaned up automatically

---

## Tasks / Subtasks

### Task 1: Backend - File Upload API (AC: #1, #2, #3, #5) - 2.5h
- [x] **1.1** Install file upload library: `npm install @nestjs/platform-express multer @types/multer`
- [x] **1.2** Create POST `/api/bulk-issuance/upload` endpoint with file upload
- [x] **1.3** Configure multer with file size limit (10MB) and mimetype filter
- [x] **1.4** Implement `uploadCSV()` controller method
- [x] **1.5** Parse CSV using `csv-parser` library
- [x] **1.6** Validate CSV structure (required headers present)
- [x] **1.7** Return validation summary: `{ totalRows, validRows, errorRows, errors[], sessionId }`
- [x] **1.8** Unit tests for file upload (8 tests: success, size limit, type validation, etc.)

**API Response Example:**
```json
{
  "success": true,
  "totalRows": 100,
  "validRows": 95,
  "errorRows": 5,
  "errors": [
    { "row": 12, "field": "badgeTemplateId", "error": "Badge template not found" },
    { "row": 45, "field": "recipientEmail", "error": "User does not exist" },
    { "row": 67, "field": "evidenceUrl", "error": "Invalid URL format" }
  ],
  "sessionId": "uuid-1234-5678",
  "expiresAt": "2026-02-06T10:30:00Z"
}
```

---

### Task 2: Row-by-Row Validation (AC: #4) - 1.5h
- [x] **2.1** Reuse `CsvValidationService` from Story 8.1
- [x] **2.2** Implement `validateRow()` method for each CSV row
- [x] **2.3** Batch database queries for performance (load all templates/users once)
- [x] **2.4** Collect validation errors with row numbers
- [x] **2.5** Continue processing even if errors found (don't stop at first error)
- [x] **2.6** Unit tests for validation (10 tests: various error scenarios)

**Validation Logic:**
```typescript
interface ValidationError {
  row: number;
  field: string;
  error: string;
  value?: string;
}

class CsvUploadService {
  async validateAndParse(file: Express.Multer.File): Promise<ValidationResult> {
    const rows = await this.parseCSV(file);
    
    // Batch load all badge templates and users for performance
    const templates = await this.loadAllBadgeTemplates();
    const users = await this.loadAllUsers();
    
    const errors: ValidationError[] = [];
    const validRows: BulkIssuanceRow[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // +2 for header and 1-index
      const validation = await this.validateRow(rows[i], templates, users);
      
      if (validation.valid) {
        validRows.push(validation.data);
      } else {
        errors.push(...validation.errors.map(e => ({ ...e, row: rowNum })));
      }
    }
    
    return {
      totalRows: rows.length,
      validRows: validRows.length,
      errorRows: errors.length,
      errors,
      data: validRows
    };
  }
}
```

---

### Task 3: Temporary Staging Storage (AC: #5, #6) - 1h
- [x] **3.1** Create `BulkIssuanceSession` table in Prisma schema
  - sessionId (UUID)
  - issuerId (foreign key to User)
  - validRows (JSONB array)
  - totalRows (int)
  - validCount (int)
  - errorCount (int)
  - errors (JSONB array)
  - expiresAt (DateTime)
  - createdAt (DateTime)
- [x] **3.2** Run Prisma migration: `npx prisma migrate dev --name add-bulk-issuance-session`
- [x] **3.3** Store validated data in session table
- [x] **3.4** Set expiry: 30 minutes from upload
- [x] **3.5** Implement cleanup cron job (delete expired sessions daily)
- [x] **3.6** Unit tests for session storage (5 tests)

---

### Task 4: Frontend - File Upload Component (AC: #1, #2) - 1.5h
- [x] **4.1** Create `CsvUploadSection.tsx` component
- [x] **4.2** Implement file input with drag-and-drop using `react-dropzone`
- [x] **4.3** Show file preview (filename, size) after selection
- [x] **4.4** Add "Upload CSV" button (enabled only when file selected)
- [x] **4.5** Show upload progress with spinner
- [x] **4.6** Handle upload errors with toast notifications
- [x] **4.7** Component tests (5 tests: file selection, drag-drop, size validation, etc.)

**UI Mockup:**
```
+------------------------------------------------------+
|  Step 2: Upload CSV File                             |
|------------------------------------------------------|
|  +----------------------------------------------+    |
|  |  📄 Drag and drop your CSV file here         |    |
|  |  or click to browse                          |    |
|  |                                              |    |
|  |  Accepted: CSV, TXT  |  Max size: 10MB      |    |
|  +----------------------------------------------+    |
|                                                      |
|  ✅ Selected: bulk-issuance-2026-02-06.csv (2.5 MB) |
|  [🔼 Upload CSV]                                     |
|                                                      |
+------------------------------------------------------+
```

---

### Task 5: Error Display & User Feedback (AC: #5) - 0.5h
- [x] **5.1** After upload, show validation summary
- [x] **5.2** Display: "95 of 100 badges valid. 5 errors found."
- [x] **5.3** If errors exist, show "Fix Errors" button
- [x] **5.4** If no errors, enable "Preview" button (navigate to Story 8.3)
- [x] **5.5** Store sessionId in React context for preview retrieval

---

## Dev Notes

### Architecture Patterns Used
- **File Upload**: Multer middleware for multipart/form-data
- **CSV Parsing**: csv-parser library for streaming CSV parsing
- **Batch Validation**: Load all reference data once for performance
- **Session Pattern**: Temporary storage with automatic cleanup

### Source Tree Components
```
backend/src/
├── bulk-issuance/
│   ├── bulk-issuance.controller.ts       # POST /upload endpoint
│   ├── bulk-issuance.service.ts          # uploadCSV(), validateAndParse()
│   ├── csv-validation.service.ts         # Row validation (from 8.1)
│   ├── entities/
│   │   └── bulk-issuance-session.entity.ts
│   └── dto/
│       ├── bulk-issuance-row.dto.ts
│       └── validation-result.dto.ts
├── prisma/
│   └── schema.prisma                      # BulkIssuanceSession table

frontend/src/
├── pages/
│   └── BulkIssuancePage.tsx
├── components/
│   └── BulkIssuance/
│       ├── CsvUploadSection.tsx           # File upload
│       └── ValidationSummary.tsx          # Results display
```

### Testing Standards
- **Backend:** 8 unit tests (file upload API)
- **Backend:** 10 unit tests (row validation)
- **Backend:** 5 unit tests (session storage)
- **Frontend:** 5 component tests (file upload UI)
- **E2E:** 8 tests (upload success, errors, large files)
- **Target Coverage:** >80%

### Performance Notes
- **Batch Loading**: Load all badge templates and users in single query
- **Streaming**: Use csv-parser streaming for large files
- **Max File Size**: 10MB ≈ 50,000 rows (accounting for column data)
- **Validation Speed**: ~100 rows/second with batch loading

## References
- Multer docs: https://github.com/expressjs/multer
- csv-parser: https://www.npmjs.com/package/csv-parser
- react-dropzone: https://react-dropzone.js.org/

---

## Dev Agent Record

### Agent Model Used
**Model:** Claude Opus 4.6  
**Date:** 2026-02-07

### Completion Notes
**Status:** Review — all 7 tasks complete, all tests passing  
**Blockers:** None

### Implementation Notes
- **XSS Sanitization (ARCH-C7):** Installed `sanitize-html` dependency. Added `sanitizeTextInput()` method to `CsvValidationService` that strips ALL HTML tags via `sanitize(value, { allowedTags: [], allowedAttributes: {} })`. Applied to `narrativeJustification`, `badgeTemplateId`, and `evidenceUrl` fields before validation in `createSession()`.
- **Rate Limiting (ARCH-C3):** Added `@Throttle({ default: { ttl: 300000, limit: 10 } })` to `uploadCsv()` controller method. Endpoint-specific override limits uploads to 10 per 5 minutes per IP (updated 2026-02-07 from 3→10 per PM/Architect review). Environment-configurable via `UPLOAD_THROTTLE_LIMIT` env var for test/dev environments. Added 429 ApiResponse Swagger doc.
- **CRLF Support (ARCH-C5):** Changed `split('\n')` to `split(/\r?\n/)` in `createSession()` to handle Windows Excel CSV files with `\r\n` line endings.
- **Transaction Validation (ARCH-C4):** Wrapped row validation loop in `this.prisma.$transaction()` with `ReadCommitted` isolation level and 10s timeout. Added `validateRowInTransaction()` method that accepts a transaction client.
- **Frontend UX (UX-P1-4):** Added 3 visual drag-drop states (default gray/drag-over blue/file-selected green), file preview with size, explicit "Upload CSV" button disabled until file selected, validation summary panel with error/success counts and auto-navigate on 0 errors.
- **E2E Tests:** Consolidated to 5 tests respecting the 10-upload rate limit (was 3). RBAC test runs first (doesn't count against throttle), then combined valid+CRLF+XSS+IDOR test, then no-file and non-CSV tests. Rate limiting tested in separate describe block with fresh throttle state. Rate limit E2E test updated to exhaust 10 uploads before asserting 429.

### Test Results
- **Backend Unit Tests:** 502 passed, 28 skipped (86 bulk-issuance specific)
- **Frontend Tests:** 339 passed (11 BulkIssuancePage specific)
- **E2E Tests:** 143 passed across 13 suites (5 new bulk-issuance-upload tests)
- **Zero Regressions**

### File List
**Files Modified:**
- `backend/src/bulk-issuance/csv-validation.service.ts` — Added `sanitizeTextInput()`, `validateRowInTransaction()`
- `backend/src/bulk-issuance/bulk-issuance.service.ts` — CRLF fix, XSS sanitization, transaction wrap
- `backend/src/bulk-issuance/bulk-issuance.controller.ts` — `@Throttle`, 429 ApiResponse
- `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` — CRLF, transaction, XSS tests
- `backend/src/bulk-issuance/csv-validation.service.spec.ts` — sanitizeTextInput, validateRowInTransaction tests
- `frontend/src/pages/BulkIssuancePage.tsx` — Drag-drop states, file preview, validation summary
- `frontend/src/pages/BulkIssuancePage.test.tsx` — 5 new tests

**Files Created:**
- `backend/test/bulk-issuance-upload.e2e-spec.ts` — 5 E2E tests (RBAC, valid+CRLF+XSS+IDOR, no-file, non-CSV, rate limiting)

**Dependencies Added:**
- `sanitize-html` + `@types/sanitize-html` (backend)

---

## Retrospective Notes

### What Went Well
- TBD

### Challenges Encountered
- TBD

### Lessons Learned
- TBD
