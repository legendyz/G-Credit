# Code Review — Sprint 9 Story 8.4 (Batch Processing Phase 1)

## Scope
- Bulk issuance synchronous processing, email system unification (TD-014), and UI processing/results
- Backend/Frontend tests listed in story Dev Agent Record

## Findings (Ordered by Severity)

### High
1. **AC4 pseudo-progress UI is missing required fields (current badge, success/fail counts, 1-second ticks).** The modal shows a generic progress bar and estimated time, but does not display the “currently processing badge” line, running success/failure counts, or 1-second tick progress per badge as specified.
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/ProcessingModal.tsx](gcredit-project/frontend/src/components/BulkIssuance/ProcessingModal.tsx#L11-L85)

2. **AC1 “split CSV / select first 20 rows” option not implemented; error text does not match required message.** The backend hard-rejects >20 rows with a generic message and no fallback path to select the first 20 rows or split, which is required by AC1.
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L259-L261)

3. **AC3 atomic per-badge transaction is not implemented.** `issueBadge` performs multiple DB writes (`create` then `update`) without a transaction, so a mid-flight failure can leave a partially-issued badge record, violating the “each badge issued in atomic transaction” requirement.
   - Evidence: [gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts](gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts#L90-L133)

### Medium
4. **AC6 “Retry Failed Badges” option is missing in completion UI.** The completion screen only provides “Download Error Report” and “View/Return” actions with no retry action.
   - Evidence: [gcredit-project/frontend/src/components/BulkIssuance/ProcessingComplete.tsx](gcredit-project/frontend/src/components/BulkIssuance/ProcessingComplete.tsx#L111-L121)

5. **AC6 email error reporting is not surfaced in completion summary.** Email failures are logged and swallowed, but the confirm response contains only badge issuance results, so email errors cannot appear in the completion summary as required.
   - Evidence: [gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts](gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts#L147-L150)
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L674-L683)

### Low
6. **E2E coverage gaps vs Task 6 requirements (20/21 badge limit, 20-second processing).** The confirm E2E suite covers success, re-confirm, IDOR, and partial failure, but not the 20/21-row limit or time-bound processing checks.
   - Evidence: [gcredit-project/backend/test/bulk-issuance-confirm.e2e-spec.ts](gcredit-project/backend/test/bulk-issuance-confirm.e2e-spec.ts#L72-L145)

## Notes
- Tests were not executed during this review.
