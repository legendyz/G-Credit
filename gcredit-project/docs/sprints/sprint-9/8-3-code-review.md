# Code Review — Sprint 9 Story 8.3 (Bulk Preview UI)

## Scope
- Bulk issuance preview UI and backend preview/confirm endpoints for Story 8.3
- Related tests and UX/security requirements (AC1–AC7, ARCH-C2, UX-P0-3, UX-P1-5, UX-P1-3)

## Findings (Ordered by Severity)

### High
1. **Confirm flow never calls the backend issuance endpoint; UI simulates results.** Clicking confirm only sets `isProcessing` locally, and the processing modal uses `Math.random()` to produce success/failure counts. This means no badges are actually issued and the user sees fabricated results.
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx](gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx#L145-L174)
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/ProcessingModal.tsx](gcredit-project/frontend/src/components/BulkIssuance/ProcessingModal.tsx#L26-L55)

### Medium
2. **Confirm button enabled even when errors exist (AC4 mismatch).** The button is disabled only when `validRows === 0`, so a user can confirm issuance even with `errorRows > 0`, contrary to the acceptance criteria.
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx](gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx#L240-L322)

3. **Session expiry does not redirect to upload (AC6 mismatch).** Expiration just toggles local state and shows a modal; there is no automatic redirect to the upload page as required.
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx](gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx#L164-L235)

4. **Preview API lacks pagination support even though UI expects paginated data (AC2).** The controller exposes only `sessionId` and the service returns the full `rows` array; there are no paging parameters or limits. Large CSVs will still send the full payload, defeating pagination requirements.
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts#L150-L170)
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L411-L503)

### Low
5. **Missing E2E coverage for preview/confirm flows.** The only e2e file covers upload behavior; there are no end-to-end tests for preview pagination, confirmation, or error report downloads as listed in the story’s dev record.
   - Evidence: [gcredit-project/backend/test/bulk-issuance-upload.e2e-spec.ts](gcredit-project/backend/test/bulk-issuance-upload.e2e-spec.ts#L1-L140)

## Notes
- Tests were not executed during this review.
