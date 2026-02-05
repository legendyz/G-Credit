# Story 8.9 Code Review

**Story/Task:** 8.9 M365 User Sync - Production Hardening  
**Date:** 2026-02-05  
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- M365 sync backend module, controller, DTOs, service, tests
- Prisma schema and migration for sync logging
- Story documentation vs repo state

---

## Summary
Core sync flow exists, but several acceptance criteria are only partially implemented. Audit logging is missing required fields, retry logic skips network errors, and deactivation does not handle disabled Azure accounts. Test coverage is permissive in E2E and does not validate AC behavior.

---

## Git vs Story Discrepancies
- **Story lists files as created/modified, but all changes are untracked.** Evidence: `git status --porcelain` shows untracked [gcredit-project/backend/src/m365-sync](gcredit-project/backend/src/m365-sync) and [gcredit-project/backend/test/m365-sync.e2e-spec.ts](gcredit-project/backend/test/m365-sync.e2e-spec.ts), plus modified [gcredit-project/backend/src/app.module.ts](gcredit-project/backend/src/app.module.ts).
- **Story marks status "Complete" while local tests for M365 sync are failing in terminal history.** Evidence: story status in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L1-L10).

---

## Findings

### 🔴 High

1) **Audit logging does not capture required fields (AC3)**
- Story requires `syncedBy`, failed count, and metadata (retry count, pagination pages). Current implementation stores only counts/status/errorMessage and the schema lacks those fields.
- Evidence: required fields in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L82-L123); current write path in [gcredit-project/backend/src/m365-sync/m365-sync.service.ts](gcredit-project/backend/src/m365-sync/m365-sync.service.ts#L316-L389); schema in [gcredit-project/backend/prisma/schema.prisma](gcredit-project/backend/prisma/schema.prisma#L324-L340).

2) **Retry logic ignores "network errors" (AC2)**
- AC2 includes retry on network errors, but `isRetryableError` only accepts numeric status codes; errors without `statusCode`/`code` never retry.
- Evidence: retry logic in [gcredit-project/backend/src/m365-sync/m365-sync.service.ts](gcredit-project/backend/src/m365-sync/m365-sync.service.ts#L136-L141); story requirement in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L76-L93).

3) **Disabled Azure accounts are not deactivated locally (AC4)**
- `syncSingleUser` skips disabled accounts without updating local `isActive`, and deactivation logic only checks missing Azure IDs. Users who remain in Azure AD but are disabled stay active in GCredit.
- Evidence: skip without update in [gcredit-project/backend/src/m365-sync/m365-sync.service.ts](gcredit-project/backend/src/m365-sync/m365-sync.service.ts#L238-L245); deactivation only on missing Azure IDs in [gcredit-project/backend/src/m365-sync/m365-sync.service.ts](gcredit-project/backend/src/m365-sync/m365-sync.service.ts#L161-L213); AC4 requirement in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L132-L167).

---

### 🟡 Medium

4) **CLI command described in story is not implemented**
- Story includes `sync:m365` CLI command, but codebase only exposes admin API endpoints and no command class exists.
- Evidence: CLI spec in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L266-L336); API-only implementation in [gcredit-project/backend/src/m365-sync/m365-sync.controller.ts](gcredit-project/backend/src/m365-sync/m365-sync.controller.ts#L1-L138).

5) **E2E tests are permissive and do not validate sync behavior**
- E2E test allows 500 for sync trigger and does not assert audit logging, retry, or deactivation behaviors, despite DoD claiming integration tests with mock M365 API and all test scenarios passing.
- Evidence: permissive test in [gcredit-project/backend/test/m365-sync.e2e-spec.ts](gcredit-project/backend/test/m365-sync.e2e-spec.ts#L87-L97); DoD in [gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md](gcredit-project/docs/sprints/sprint-8/U-2b-m365-hardening.md#L343-L351).

6) **Status semantics inconsistent between DB logs and API result**
- DB uses `PARTIAL_SUCCESS` but API result uses `PARTIAL`; logs expose `PARTIAL_SUCCESS` while result DTO allows `PARTIAL`. This creates inconsistent client expectations.
- Evidence: mapping in [gcredit-project/backend/src/m365-sync/m365-sync.service.ts](gcredit-project/backend/src/m365-sync/m365-sync.service.ts#L369-L399); result enum in [gcredit-project/backend/src/m365-sync/dto/sync-result.dto.ts](gcredit-project/backend/src/m365-sync/dto/sync-result.dto.ts#L3-L33); log enum in [gcredit-project/backend/src/m365-sync/dto/sync-log.dto.ts](gcredit-project/backend/src/m365-sync/dto/sync-log.dto.ts#L49-L74).

---

## Recommendations
- Add `syncedBy`, `usersFailed`, and `metadata` fields to `M365SyncLog`, populate them in `runSync`, and update DTOs accordingly.
- Treat network errors as retryable (e.g., `code` in `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`), and add tests to cover them.
- Deactivate local users when Azure account is disabled, not only when missing from Azure.
- If CLI command is required, implement it or remove from story with rationale.
- Strengthen E2E tests to mock Graph and assert audit logging, retry behavior, and deactivation outcomes.
- Align status enum naming across DB, DTOs, and responses.

---

## Outcome
**Status:** Changes requested (AC gaps and audit/test coverage issues present).
