# Code Review — Sprint 9 Story 8.2 (CSV Upload & Parsing)

## Scope
- Backend CSV upload/parse flow, validation, throttling, and tests for Story 8.2
- Patch note: rate limit default 10/5min with env overrides

## Findings (Ordered by Severity)

### High
1. **Staging table requirement not met (in-memory sessions only).** Story 8.2 requires storing validated rows in a temporary staging table, but the implementation keeps sessions in an in-memory `Map`, which is lost on process restart and won’t work across multiple instances. This breaks durability and multi-node correctness for preview/confirm flows. 
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L70)

### Medium
2. **Upload rate-limit config conflicts with tests and patch intent.** The controller uses env-based defaults (10 uploads / 5 min), and the e2e test asserts the 11th request returns 429. However `.env.test` overrides `UPLOAD_THROTTLE_LIMIT` to 50, so the test either fails (if `.env.test` is loaded early) or the runtime behavior diverges from the patch requirement. Align the test env or explicitly load envs so the expectation is deterministic. 
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts#L86-L94)
   - Evidence: [gcredit-project/backend/test/bulk-issuance-upload.e2e-spec.ts](gcredit-project/backend/test/bulk-issuance-upload.e2e-spec.ts#L151-L168)
   - Evidence: [gcredit-project/backend/.env.test](gcredit-project/backend/.env.test#L9-L10)

3. **File size/type validation does not match Story 8.2 ACs.** ACs specify max 10MB and allow CSV or TXT. The interceptor enforces 100KB (`MAX_FILE_SIZE=102_400`) and upload validation only accepts `.csv` and CSV mimetypes, rejecting `.txt`. This is a direct requirements mismatch. 
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.controller.ts#L90-L118)
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L90)

4. **CSV parsing breaks on quoted multiline fields.** The parser claims RFC 4180 quoting support, but the code splits the entire file by line breaks before parsing fields. Any quoted field containing a newline will be split into multiple logical rows, producing incorrect row counts and validations. If multiline fields are allowed, this will mis-validate or reject otherwise valid input. 
   - Evidence: [gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts](gcredit-project/backend/src/bulk-issuance/bulk-issuance.service.ts#L128-L180)

## Notes
- Tests were not executed during this review.
