# Code Review - Sprint 10 Story 10.1 (tsc Test Type Errors)

Date: 2026-02-08  
Reviewer: Amelia (Dev Agent)

## Scope
Story: 10-1-tsc-test-type-errors.md  
Reviewed files:
- .github/workflows/test.yml
- gcredit-project/backend/package.json
- gcredit-project/backend/src/admin-users/admin-users.service.spec.ts
- gcredit-project/backend/src/badge-issuance/badge-issuance-teams.integration.spec.ts
- gcredit-project/backend/src/badge-issuance/badge-issuance-wallet.service.spec.ts
- gcredit-project/backend/src/badge-issuance/badge-issuance.service-baked.spec.ts
- gcredit-project/backend/src/badge-issuance/badge-issuance.service.spec.ts
- gcredit-project/backend/src/badge-issuance/services/assertion-generator.service.spec.ts
- gcredit-project/backend/src/badge-sharing/badge-sharing.controller.spec.ts
- gcredit-project/backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts
- gcredit-project/backend/src/badge-sharing/services/email-template.service.spec.ts
- gcredit-project/backend/src/common/guards/security.spec.ts
- gcredit-project/backend/src/microsoft-graph/services/graph-teams.service.spec.ts
- gcredit-project/backend/src/microsoft-graph/services/graph-token-provider.service.spec.ts
- gcredit-project/backend/src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts
- gcredit-project/backend/src/microsoft-graph/teams/teams-action.controller.spec.ts
- gcredit-project/backend/src/microsoft-graph/teams/teams-badge-notification.service.spec.ts
- gcredit-project/backend/src/modules/auth/auth.service.spec.ts
- gcredit-project/backend/src/modules/auth/auth.service.ts
- gcredit-project/backend/test/badge-integrity.e2e-spec.ts
- gcredit-project/backend/test/badge-issuance-isolated.e2e-spec.ts
- gcredit-project/backend/test/factories/badge-template.factory.ts
- gcredit-project/docs/sprints/sprint-10/10-1-dev-prompt.md
- gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md

## Git vs Story Discrepancies
- Story File List omits two files that changed in the commit: `10-1-dev-prompt.md` and the story file itself. The Dev Agent Record should list all touched files. File List evidence: [gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md](gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md#L105-L126).

## Findings

### Medium
1) AC2 claims “1089 tests passing” in the Dev Agent Record, but there are no test logs or artifacts in-repo to validate that claim, and CI only runs backend tests in the backend working directory. This leaves the frontend test pass claim unverified.  
- Test pass claim: [gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md](gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md#L92-L104)  
- Backend-only working directory: [.github/workflows/test.yml](.github/workflows/test.yml#L33-L36)  
- Backend unit tests only: [.github/workflows/test.yml](.github/workflows/test.yml#L57-L58)

2) AC3 says “checked via ESLint,” but CI runs `npm run lint` with `--max-warnings=423` and `--fix`, which does not enforce zero warnings or prevent new `any` warnings from slipping through. That weakens the AC3 verification path.  
- Lint script allows warnings: [gcredit-project/backend/package.json](gcredit-project/backend/package.json#L8-L17)  
- CI uses lint script: [.github/workflows/test.yml](.github/workflows/test.yml#L51-L55)

### Low
3) The “should successfully generate baked badge for valid request” test asserts a rejection from `sharp` using fake PNG data, so the success path isn’t actually validated. This reduces confidence in the baked badge path despite the test name.  
- Failing-by-design test: [gcredit-project/backend/src/badge-issuance/badge-issuance.service-baked.spec.ts](gcredit-project/backend/src/badge-issuance/badge-issuance.service-baked.spec.ts#L192-L205)

4) AC6 is satisfied by the commit message, but the story still shows AC6 as unchecked. This is a documentation mismatch that should be corrected.  
- AC6 checkbox still unchecked: [gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md](gcredit-project/docs/sprints/sprint-10/10-1-tsc-test-type-errors.md#L26-L33)

## AC Coverage Summary (Current State)
- AC1: Not independently verifiable (no tsc output or logs in repo).  
- AC2: Partial - backend coverage in CI, frontend test execution not visible in CI.  
- AC3: Partial - lint configuration allows warnings; zero-warning enforcement missing.  
- AC4: Not independently verifiable from code review alone.  
- AC5: Implemented in CI (tsc --noEmit step present).  
- AC6: Implemented by commit message, but story checkbox is stale.

## Test Coverage Notes
- CI executes backend unit tests and backend E2E, but there is no frontend test job visible in this workflow.  
- No local test results or artifacts are available to confirm the claimed 1089 passing tests.
