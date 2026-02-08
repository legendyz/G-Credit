# Code Review - Sprint 10 Story 10.2 (ESLint Full Cleanup)

Date: 2026-02-08  
Reviewer: Amelia (Dev Agent)

## Scope
Story: 10-2-eslint-regression-ci-gate.md  
Commits reviewed:  
- bdaea90 (refactor: ESLint full cleanup 5370 + zero-tolerance CI gate)  
- 2faf566 (fix: code review 10.2 - remove --fix from CI lint, fail-fast on malformed assertionJson)  
Reviewed files:
- .github/workflows/test.yml
- gcredit-project/backend/package.json
- gcredit-project/backend/src/badge-issuance/services/badge-notification.service.ts
- gcredit-project/backend/src/badge-sharing/badge-sharing.service.ts
- gcredit-project/backend/src/badge-sharing/controllers/widget-embed.controller.ts
- gcredit-project/backend/src/badge-verification/badge-verification.controller.ts
- gcredit-project/backend/src/common/services/blob-storage.service.ts
- gcredit-project/backend/src/common/storage.service.ts
- gcredit-project/backend/src/microsoft-graph/services/graph-email.service.ts
- gcredit-project/backend/src/modules/auth/auth.module.ts
- gcredit-project/backend/test/helpers/jest-typed-matchers.ts
- gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md

## Git vs Story Discrepancies
- Resolved in 2faf566: story File List now includes `sprint-status.yaml` and the story file. Evidence: [gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md](gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md#L109-L113).

## Findings

### High
1) AC7 requires the exact PR commit message `refactor: ESLint full cleanup 537→0 + zero-tolerance CI gate`, but the actual commit subject is `refactor: ESLint full cleanup 5370 + zero-tolerance CI gate`. This does not satisfy the acceptance criterion as written.  
- AC7 requirement: [gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md](gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md#L26-L32)

### Medium
2) AC5 claims all 1087 tests pass, but there are no test logs or artifacts in-repo to verify that claim. This makes AC5 unverifiable in review.  
- Test pass claim: [gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md](gcredit-project/docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md#L100-L107)

### Resolved Since Initial Review
- AC4 enforcement updated: `npm run lint` no longer uses `--fix`, so lint regressions now fail CI. Evidence: [gcredit-project/backend/package.json](gcredit-project/backend/package.json#L15-L16).
- Badge verification now fails fast on malformed `assertionJson` instead of returning empty assertions. Evidence: [gcredit-project/backend/src/badge-verification/badge-verification.controller.ts](gcredit-project/backend/src/badge-verification/badge-verification.controller.ts#L131-L141).

## AC Coverage Summary (Current State)
- AC1: Not independently verifiable (no lint output or logs in repo).  
- AC2: Not independently verifiable (no lint output or logs in repo).  
- AC3: Implemented (lint script updated to `--max-warnings=0`).  
- AC4: Implemented - lint gate exists without `--fix`.  
- AC5: Not independently verifiable (no test logs/artifacts).  
- AC6: Not directly verifiable in review (requires targeted checks in bulk issuance codebase).  
- AC7: Not met (commit message does not match required string).

## Test Coverage Notes
- CI runs backend lint/type-check/unit tests only; no evidence of frontend test execution in this workflow.  
- No test run artifacts are included in the repo to validate the “1087 tests passing” claim.
