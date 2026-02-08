# Story 8.1: CSV Template & Validation

**Status:** done ✅ SM accepted 2026-02-07  
**Epic:** Epic 8 - Bulk Badge Issuance  
**Sprint:** Sprint 9  
**Priority:** HIGH  
**Estimated Hours:** 8.5h (原6h + UX审查P0/P1修复2.5h)  
**Actual Hours:** 8h  
**Post-Review Updates:** UX-P0-2, UX-P1-1, UX-P1-2 (2026-02-05审查)  

---

## Story

As an **Issuer**,  
I want **to download a standardized CSV template for bulk badge issuance**,  
So that **I can prepare bulk issuance data in the correct format**.

---

## Acceptance Criteria

1. [x] **AC1: Template Download**
   - Issuer can click "Download CSV Template" button on bulk issuance page
   - CSV file downloads with filename `bulk-badge-issuance-template-{date}.csv`
   - Template uses UTF-8 encoding to support international characters

2. [x] **AC2: Template Structure** 🔴 **P0-FIX**
   - CSV headers: `badgeTemplateId, recipientEmail, evidenceUrl, narrativeJustification`
   - ⚠️ **UX-P0-2**: Example rows MUST have `EXAMPLE-DELETE-THIS-ROW` prefix to prevent accidental submission
   - Template includes 2-3 example rows with clearly marked example data
   - Template includes comment rows explaining each field (prefixed with #)
   - Add header comment: "# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD"

3. [x] **AC3: Field Specifications**
   - `badgeTemplateId`: Accepts badge template UUID or name (string)
   - `recipientEmail`: Must match registered user emails (validation on upload)
   - `evidenceUrl`: Optional, accepts valid HTTP/HTTPS URLs
   - `narrativeJustification`: Optional, free text up to 500 characters

4. [x] **AC4: Help Documentation**
   - Template includes inline comments with field requirements
   - Help text explains: "badgeTemplateId can be template name or ID from badge catalog"
   - Help text warns: "recipientEmail must match existing user accounts"

5. [x] **AC5: Analytics Tracking**
   - Template download is logged for analytics (optional)
   - Track: userId, timestamp, templateType

6. [x] **AC6: Template Selector UI** ⚠️ **P1-Enhancement** (UX-P1-1, 2h)
   - Add badge template autocomplete selector before download
   - User selects template → generates CSV with pre-filled badgeTemplateId
   - Reduces manual lookup and copy-paste errors
   - Display template name + ID for clarity

7. [x] **AC7: File Size Limit Adjustment** ⚠️ **P1-Enhancement** (UX-P1-2, 0.5h)
   - Change file size limit from 10MB to 100KB (appropriate for 20-badge MVP)
   - Display clear message: "Maximum 20 badges per upload (file size limit: 100KB)"
   - Validate row count first, then file size

---

## Tasks / Subtasks

### Task 1: Backend - Template Generation API (AC: #1, #2, #3) - 2h
- [x] **1.1** Create `BulkIssuanceController` with `GET /api/bulk-issuance/template` endpoint
- [x] **1.2** Implement `generateCSVTemplate()` service method
- [x] **1.3** Generate CSV with headers and example rows
- [x] **1.4** Add comment rows with field explanations (# prefix)
- [x] **1.5** Set proper HTTP headers: `Content-Type: text/csv`, `Content-Disposition: attachment`
- [x] **1.6** Dynamic filename with current date: `bulk-badge-issuance-template-2026-02-06.csv`
- [x] **1.7** Unit tests for template generation (3 tests: structure, encoding, filename)

**Example CSV Output:**
```csv
# G-Credit Bulk Badge Issuance Template
# Instructions: Fill in the rows below with badge issuance data
# badgeTemplateId: Can be template name (e.g., "Leadership Excellence") or UUID
# recipientEmail: Must match registered user email addresses
# evidenceUrl: (Optional) Link to supporting documentation
# narrativeJustification: (Optional) Reason for awarding this badge (max 500 chars)

badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification
Leadership Excellence,john.doe@company.com,https://example.com/evidence/123,Completed advanced leadership training with distinction
a1b2c3d4-uuid,jane.smith@company.com,,Demonstrated exceptional mentoring skills throughout Q1 2026
```

---

### Task 2: Frontend - Download Button UI (AC: #1, #4) - 1.5h
- [x] **2.1** Create bulk issuance page route: `/admin/bulk-issuance`
- [x] **2.2** Add "Download CSV Template" button with download icon
- [x] **2.3** Implement `downloadTemplate()` function calling backend API
- [x] **2.4** Trigger browser download with proper filename
- [x] **2.5** Show success toast: "CSV template downloaded successfully"
- [x] **2.6** Add help text below button explaining template usage
- [x] **2.7** RBAC check: Only ISSUER and ADMIN roles can access page

**UI Mockup:**
```
+------------------------------------------------------+
|  Bulk Badge Issuance                                 |
|------------------------------------------------------|
|  Step 1: Download Template                           |
|  [📥 Download CSV Template]                          |
|                                                      |
|  📋 Instructions:                                    |
|  1. Download the CSV template                        |
|  2. Fill in badge issuance data                      |
|  3. Upload the completed CSV in Step 2              |
|                                                      |
|  💡 Tip: You can find badge template names in the    |
|     Badge Catalog page                               |
+------------------------------------------------------+
```

---

### Task 3: CSV Validation Logic (Preparation for Story 8.2) (AC: #3) - 1.5h
- [x] **3.1** Create `CsvValidationService` with validation methods
- [x] **3.2** Implement `validateBadgeTemplateId()` - checks if exists and is APPROVED
- [x] **3.3** Implement `validateRecipientEmail()` - checks if user exists in database
- [x] **3.4** Implement `validateEvidenceUrl()` - validates URL format (optional field)
- [x] **3.5** Implement `validateNarrativeJustification()` - checks length ≤500 chars
- [x] **3.6** Unit tests for each validation function (15 tests total)

**Validation Rules:**
```typescript
class CsvValidationService {
  async validateBadgeTemplateId(value: string): Promise<ValidationResult> {
    // Check if UUID or name exists in badge_classes table
    // Check if status = 'APPROVED'
    // Return: { valid: boolean, error?: string, badgeClassId: string }
  }

  async validateRecipientEmail(email: string): Promise<ValidationResult> {
    // Check if user exists in users table
    // Check if user isActive = true
    // Return: { valid: boolean, error?: string, userId: string }
  }

  validateEvidenceUrl(url: string | null): ValidationResult {
    // If null/empty, return valid (optional field)
    // If provided, validate HTTP/HTTPS format
    // Return: { valid: boolean, error?: string }
  }

  validateNarrativeJustification(text: string | null): ValidationResult {
    // If null/empty, return valid (optional field)
    // If provided, check length ≤ 500
    // Return: { valid: boolean, error?: string }
  }
}
```

---

### Task 4: E2E Testing (AC: ALL) - 1h
- [x] **4.1** E2E test: Download template as ISSUER user
- [x] **4.2** E2E test: Verify CSV structure and headers
- [x] **4.3** E2E test: Verify example rows are present
- [x] **4.4** E2E test: RBAC - EMPLOYEE cannot access page (403 Forbidden)
- [x] **4.5** Manual test: Open downloaded CSV in Excel/Google Sheets

---

## Dev Notes

### Architecture Patterns Used
- **Controller-Service Pattern**: Separation of HTTP handling and business logic
- **Static File Generation**: CSV generation in-memory, not stored on disk
- **Content-Type Headers**: Proper MIME type for CSV downloads

### Source Tree Components
```
backend/src/
├── bulk-issuance/
│   ├── bulk-issuance.controller.ts    # GET /api/bulk-issuance/template
│   ├── bulk-issuance.service.ts       # generateCSVTemplate()
│   ├── csv-validation.service.ts      # Validation logic
│   └── dto/
│       └── bulk-issuance-row.dto.ts   # CSV row structure
├── bulk-issuance.module.ts

frontend/src/
├── pages/
│   └── BulkIssuancePage.tsx           # Main page
├── components/
│   └── BulkIssuance/
│       └── TemplateDownload.tsx       # Download section
```

### Testing Standards
- **Backend:** 3 unit tests (template generation)
- **Backend:** 15 unit tests (validation service)
- **Frontend:** 3 component tests (download button, RBAC, success toast)
- **E2E:** 5 tests (download, structure, RBAC)
- **Target Coverage:** >80%

### Project Structure Notes
- CSV template generation is stateless (no database storage)
- Validation service will be reused in Story 8.2 for upload
- Frontend uses React context for bulk issuance workflow state

### References
- Sprint 8 Story 8.3: CSV parsing patterns
- NestJS File Response: https://docs.nestjs.com/techniques/streaming-files
- CSV RFC 4180: https://www.ietf.org/rfc/rfc4180.txt

---

## Dev Agent Record

### Agent Model Used
**Model:** Claude Opus 4.6 (via GitHub Copilot)  
**Date:** 2026-02-07  
**Session Duration:** ~3h (implementation + code review fixes)

### Implementation Notes
- Template generation with UTF-8 BOM, dynamic date filename, field documentation comments
- Column names: `badgeTemplateId`, `recipientEmail`, `evidenceUrl`, `narrativeJustification`
- Example rows with `EXAMPLE-DELETE-THIS-ROW` prefix per UX-P0-2
- Comment row: `# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD`
- CsvValidationService with DB-backed validation: `validateBadgeTemplateIdInDb()` checks ACTIVE status, `validateRegisteredEmail()` checks isActive user
- RFC 4180 compliant `parseCsvLine()` replacing naive `split(',')`
- File size limit: 100KB (`MAX_FILE_SIZE = 102_400`), row count limit: 20 (`MAX_ROWS = 20`)
- BulkIssuancePage with TemplateSelector autocomplete wired into Step 1
- Analytics JSON logging in `downloadTemplate()` endpoint
- Multer file size limit on upload endpoint
- Frontend routes registered in App.tsx, nav links added for ADMIN/ISSUER roles

### Code Review Fixes Applied (2026-02-07)
1. **[HIGH]** Renamed `templateId`→`badgeTemplateId`, `notes`→`narrativeJustification` across all files
2. **[HIGH]** Added DB validation via PrismaService: `validateBadgeTemplateIdInDb()`, `validateRegisteredEmail()`
3. **[MEDIUM]** Added analytics JSON logging in `downloadTemplate()` controller
4. **[MEDIUM]** Wired `TemplateSelector` into `BulkIssuancePage` with state management
5. **[MEDIUM]** Added Multer file size limit + row count max 20 validation
6. **[MEDIUM]** Implemented RFC 4180 `parseCsvLine()` CSV parser
7. **[LOW]** Fixed comment text to match AC exact wording

### Completion Notes
**Status:** All tasks complete, all ACs satisfied, CI/CD pipeline passing  
**Blockers:** None  
**Changes from Original Plan:** Added PrismaService injection for DB-backed validation (code review finding #2); RFC 4180 CSV parser added (code review finding #6)

### Test Results
- **Backend Unit Tests:** 485 passed (35 suites), 0 failed
- **Frontend Unit Tests:** 334 passed (28 suites), 0 failed
- **E2E Tests:** 6 passed (1 suite), 0 failed
- **GitHub Actions CI:** ✅ All checks passing

### File List
**Files Created:**
- `gcredit-project/backend/test/bulk-issuance-template.e2e-spec.ts` — E2E tests for template download
- `gcredit-project/frontend/src/pages/BulkIssuancePage.tsx` — Bulk issuance page component
- `gcredit-project/frontend/src/pages/BulkIssuancePage.test.tsx` — BulkIssuancePage unit tests
- `gcredit-project/frontend/src/components/BulkIssuance/TemplateSelector.tsx` — Badge template autocomplete selector
- `gcredit-project/frontend/src/components/BulkIssuance/index.ts` — TemplateSelector barrel export
- `gcredit-project/docs/sprints/sprint-9/8-1-code-review.md` — Code review findings document

**Files Modified:**
- `gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts` — Analytics logging, Multer file size limit, Logger
- `gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts` — Template generation, RFC 4180 parser, row count limit, BOM stripping
- `gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.spec.ts` — Updated tests for new column names, max rows, BOM
- `gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts` — PrismaService injection, DB validation methods, async validateRow
- `gcredit-project/backend/src/bulk-issuance/csv-validation.service.spec.ts` — Tests for DB validation, correct field names
- `gcredit-project/frontend/src/App.tsx` — Bulk issuance routes
- `gcredit-project/frontend/src/components/Navbar.tsx` — Bulk Issuance nav link
- `gcredit-project/frontend/src/components/layout/MobileNav.tsx` — Bulk Issuance mobile nav link
- `gcredit-project/docs/sprints/sprint-9/sprint-status.yaml` — Story 8.1 status → review
- `.gitignore` — Updated ignore patterns

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-07 | Story 8.1 implementation: Template generation API, BulkIssuancePage UI, CsvValidationService, E2E tests, TemplateSelector (P1) | Dev Agent (Claude Opus 4.6) |
| 2026-02-07 | Code review fixes: 7 findings resolved (2 High, 4 Medium, 1 Low) — column rename, DB validation, analytics, RFC 4180 parser, file limits | Dev Agent (Claude Opus 4.6) |
| 2026-02-07 | GitHub Actions CI validation passed | Dev Agent (Claude Opus 4.6) |

---

## Retrospective Notes

### What Went Well
- Clean implementation following controller-service pattern
- Comprehensive test coverage (485 backend + 334 frontend + 6 E2E)
- Code review caught important issues (column naming consistency, DB validation)
- All fixes applied and validated in single session

### Challenges Encountered
- Column naming inconsistency between story AC and initial implementation — resolved via code review
- Need for DB-backed validation not initially implemented — added PrismaService injection

### Lessons Learned
- Column/field names should be verified against AC exact wording before implementation
- DB validation should be included from the start for any field referencing existing entities
- RFC 4180 compliance matters for CSV parsing robustness

### Recommendations for Future Stories
- Story 8.2 should reuse `CsvValidationService.validateRow()` for upload validation
- Consider adding integration tests for DB validation methods with test database
- TemplateSelector pattern can be reused for other entity selection UIs
