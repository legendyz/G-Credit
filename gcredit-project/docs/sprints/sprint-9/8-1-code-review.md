# Code Review - Sprint 9 Story 8.1 (CSV Template & Validation)

Date: 2026-02-07  
Reviewer: Amelia (Dev Agent)

## Scope
Story: 8-1-csv-template-validation.md  
Reviewed files:
- backend/src/bulk-issuance/bulk-issuance.controller.ts
- backend/src/bulk-issuance/bulk-issuance.service.ts
- backend/src/bulk-issuance/csv-validation.service.ts
- backend/test/bulk-issuance-template.e2e-spec.ts
- frontend/src/pages/BulkIssuancePage.tsx
- frontend/src/components/BulkIssuance/TemplateSelector.tsx
- frontend/src/App.tsx

## Git vs Story Discrepancies
- Story Dev Agent Record File List is still placeholder (TBD) while multiple files changed in git. This blocks traceability and violates story documentation expectations. See story placeholders at [gcredit-project/docs/sprints/sprint-9/8-1-csv-template-validation.md](gcredit-project/docs/sprints/sprint-9/8-1-csv-template-validation.md#L212-L236).

## Findings

### High
1) Template column names do not match AC requirements. Story requires `badgeTemplateId` and `narrativeJustification`, but template and validation use `templateId` and `notes`. This breaks upload compatibility and violates AC2/AC3/AC4.  
- Header generated with wrong names: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L109)  
- Validation reads `row.templateId` / `row.notes`: [gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts](gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts#L161-L173)

2) AC3 validation for `badgeTemplateId` and `recipientEmail` is not implemented. The service only checks for example data and basic email format; it does not verify template existence/status or registered users. This is explicitly required by AC3 and Task 3.  
- `validateBadgeTemplateId` has no DB checks: [gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts](gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts#L82-L99)  
- `validateEmail` has no registered-user check: [gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts](gcredit-project/backend/src/bulk-issuance/csv-validation.service.ts#L103-L129)

### Medium
3) Analytics tracking for template download (AC5) is missing. The download endpoint returns the CSV but does not log any analytics event (userId, timestamp, templateType).  
- Download endpoint has no analytics call: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts#L59-L67)

4) AC6 template selector UI is not wired into the page, so no pre-filled `badgeTemplateId` is generated. The component exists but is not imported/used in the bulk issuance page.  
- Template selector component exists: [gcredit-project/frontend/src/components/BulkIssuance/TemplateSelector.tsx](gcredit-project/frontend/src/components/BulkIssuance/TemplateSelector.tsx#L2-L178)  
- Bulk page imports show no selector usage: [gcredit-project/frontend/src/pages/BulkIssuancePage.tsx](gcredit-project/frontend/src/pages/BulkIssuancePage.tsx#L12-L30)

5) AC7 enforcement is incomplete on the backend. The UI enforces 100KB client-side, but the API accepts any file size and row count. Row count should be validated first, then file size, per AC7.  
- Upload endpoint has no size/row count checks: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts#L90-L119)  
- Session parsing has no max-row enforcement: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L131-L176)

6) CSV parsing is not RFC4180-safe. Splitting on commas will break values like `narrativeJustification` that contain commas or quoted strings. This will corrupt row data during upload validation.  
- Naive split on commas: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L139-L155)

### Low
7) Required header comment text does not match the AC exact wording. Story specifies `# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD`, but template uses a different string. This is a minor UX/documentation mismatch.  
- Current comment text: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L95)

## AC Coverage Summary (Current State)
- AC1: Partial - Download flow works, filename and UTF-8 via BOM are present; template structure still mismatched.
- AC2: Partial - Example rows exist, but header names and exact delete comment are wrong.
- AC3: Partial - Evidence URL and length validation exist, but no DB checks for template/user.
- AC4: Partial - Help text exists but uses wrong field names; missing exact header text.
- AC5: Not implemented.
- AC6: Not implemented (selector not wired).
- AC7: Partial - Frontend limit only, backend row-count and size validation missing.

## Test Coverage Notes
- E2E tests cover template download only; no tests for upload validation, row count, or selector pre-fill behavior.
