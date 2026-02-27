## Code Review: Story 13.7 — API Client Cleanup

**Verdict**: Approved

## Re-review Update (2026-02-26)

- Fix commits reviewed:
	- `ad11af6` (`fix(frontend): Story 13.7 code review nits — deduplicate handleResponse, strict API types`)
	- `6a4850c` (`fix(frontend): CI build errors — getBadgeById returns BadgeDetail, fix optional chaining`)
- Verified closures:
	1. Repeated response parsing is consolidated by migrating key API calls to `apiFetchJson` in `profileApi.ts`, `bulkIssuanceApi.ts`, `badgesApi.ts`, and `badgeTemplatesApi.ts`.
	2. Broad return types/casts are reduced via stricter API response types (`ClaimBadgeResponse`, `ReportIssueResponse`, `SimilarBadge`) and typed caller updates in `ClaimBadgePage` and `BadgeDetailModal` components.
	3. CI build regression is resolved by aligning `getBadgeById` return type with `BadgeDetail` usage and fixing optional chaining/nullability access in milestone handling.

### Findings

No open issues. Previously reported `Nit` findings are closed.

### Summary

Story 13.7 successfully removes `axios` and centralizes migrated inline API calls into the API library layer. Spot checks confirm migrated methods preserve expected HTTP method/path/body behavior, binary endpoints still return `Blob`/`Response`, and `verifyBadge()` intentionally returns raw `Response` for status-specific handling.

Validation evidence:
- `axios` dependency removed from `frontend/package.json`, and no frontend source imports/requires of axios found.
- No direct `apiFetch` imports remain in page/component production files reviewed for this story (only test-only import observed in `VerifyBadgePage.test.tsx`).
- Targeted tests passed: `npx vitest run src/pages/IssueBadgePage.test.tsx src/pages/ProfilePage.test.tsx src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` → **3 files, 40 tests, 0 failed**.
- Additional re-review tests passed:
	- `npx vitest run src/lib/__tests__/badgeTemplatesApi.test.ts src/pages/IssueBadgePage.test.tsx src/pages/ProfilePage.test.tsx src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` → **4 files, 61 tests, 0 failed**.
	- `npx vitest run src/lib/badgesApi.test.ts` → **1 file, 16 tests, 0 failed**.
- Build passed: `npx vite build` → **success**.
