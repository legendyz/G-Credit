# Story 8.4 Code Review

**Story/Task:** 8.4 Basic Analytics API  
**Date:** 2026-02-03  
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- Analytics module, controller, service, DTOs
- App module wiring
- Unit + E2E tests
- Story claims vs repository state

---

## Summary
API coverage is mostly aligned with AC1–AC5, but caching introduces cross-user data exposure risks and several requirements are only partially enforced. Story documentation also conflicts with the current git state.

---

## Git vs Story Discrepancies
- **Story lists multiple created/modified files but git working tree is clean.** This makes it impossible to verify the exact change set from git. See the Story file list in [gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md](gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md#L500-L516).

---

## Findings

### 🔴 High

1) **User-scoped analytics cached without user-specific keys (data leak risk)**
- `issuance-trends` and `top-performers` are cached but the cache key does not include `userId`, even though the service scopes results by current user role/department. Different issuers/managers can receive each other’s cached data.
- Evidence: [analytics.controller.ts](gcredit-project/backend/src/analytics/analytics.controller.ts#L66-L106), [analytics.service.ts](gcredit-project/backend/src/analytics/analytics.service.ts#L239-L269)
- Story requires `analytics:{endpoint}:{userId}:{queryParams}` keys, which is not met for these endpoints: [8-4-analytics-api.md](gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md#L32-L32)

2) **Story claims changes with no git evidence (traceability gap)**
- The story lists multiple files as created/modified, but there are no current git diffs. This is flagged by the review workflow as a high-severity documentation inconsistency.
- Evidence: [8-4-analytics-api.md](gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md#L500-L516)

---

### 🟡 Medium

3) **AC2 period validation allows unsupported values**
- AC2 allows only `7`, `30`, `90`, `365`, but validation permits any integer from 7 to 365.
- Evidence: [8-4-analytics-api.md](gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md#L124-L125), [issuance-trends.dto.ts](gcredit-project/backend/src/analytics/dto/issuance-trends.dto.ts#L12-L15)

4) **`teamId` is validated as UUID but used as department string**
- DTO requires UUID, while service treats `teamId` as department name; this can reject valid department-based queries.
- Evidence: [top-performers.dto.ts](gcredit-project/backend/src/analytics/dto/top-performers.dto.ts#L11-L12), [analytics.service.ts](gcredit-project/backend/src/analytics/analytics.service.ts#L239-L261)

---

### 🟢 Low

5) **Recent activity actor name uses email, not display name**
- AC5 example expects a name; implementation uses `actorEmail` or `Unknown`.
- Evidence: [8-4-analytics-api.md](gcredit-project/docs/sprints/sprint-8/8-4-analytics-api.md#L199-L205), [analytics.service.ts](gcredit-project/backend/src/analytics/analytics.service.ts#L423-L438)

---

## Recommendations
- ✅ Add user- and role-aware cache keys (or disable caching) for `issuance-trends` and `top-performers`.
- ✅ Align story documentation with git reality or include a commit reference for the change set.
- ✅ Enforce strict `period` validation to allowed values only.
- ✅ Decide whether `teamId` is a UUID or department string and make DTO/service consistent.
- ✅ Map `actor` name from user profile in recent activity (if required by UI).

---

## Resolution (2026-02-03)

All findings addressed:

1. **Finding #1 (High):** Removed `@CacheTTL` from `issuance-trends` and `top-performers` endpoints. These user-scoped endpoints no longer use auto-caching to prevent cross-user data leakage.

2. **Finding #2 (High):** Story documentation updated - this is a git workflow note; all changes are now committed.

3. **Finding #3 (Medium):** Changed period validation from `@Min(7) @Max(365)` to `@IsIn([7, 30, 90, 365])` to enforce only AC2-specified values.

4. **Finding #4 (Medium):** Changed `teamId` from `@IsUUID()` to `@IsString()` - department is a string field, not a UUID.

5. **Finding #5 (Low):** Added batch user lookup in `getRecentActivity()` to display `firstName lastName` instead of email. Falls back to email if user not found.

**Tests:** 297 unit + 96 E2E = 393 tests passing

---

## Outcome
**Status:** ✅ Approved (all findings resolved)