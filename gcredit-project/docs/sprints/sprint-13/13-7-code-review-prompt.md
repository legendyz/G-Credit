# Code Review Prompt — Story 13.7: API Client Cleanup (Remove axios + Inline Migrations)

## Review Context

| Field | Value |
|-------|-------|
| **Story** | 13.7 — API Client Cleanup (Remove axios + Inline Migrations) |
| **Branch** | `sprint-13/sso-session-management` |
| **Commit** | `c846ab9 feat(story-13.7): API client cleanup — remove axios + migrate inline calls` |
| **Baseline** | `bd8aac9` (Story 13.6 accepted) |
| **Frontend Tests** | 77 files — **793 tests pass** (0 failures) |
| **Stack** | React 18 + Vite + Vitest + React Query + apiFetch centralized client |

## Summary of Changes

Removes dead `axios` dependency and migrates **21 inline `apiFetch()` calls** from page/component code into centralized API library modules. After this change, all API calls route through `apiFetch()` → 401 interceptor automatically via the API lib layer.

**Key changes:**
- `axios` removed from `package.json` (0 active imports — dead dependency)
- 3 new API lib files: `profileApi.ts`, `bulkIssuanceApi.ts`, `verifyApi.ts`
- `badgesApi.ts` extended with 7 new functions (visibility, claim, download, report, similar, recipients)
- `badgeTemplatesApi.ts` extended with `getActiveTemplates()`
- 12 page/component files migrated from inline `apiFetch` to API lib imports
- 3 test files updated to mock the new API lib functions instead of raw `fetch`/`apiFetch`
- Type definitions extracted from component files into API lib files (DRY)

## Files Changed

| File | Type | Lines Changed |
|------|------|---------------|
| `package.json` | Modified | −1 (axios removed) |
| `package-lock.json` | Modified | −120 |
| `src/lib/profileApi.ts` | **New** | +69 |
| `src/lib/bulkIssuanceApi.ts` | **New** | +131 |
| `src/lib/verifyApi.ts` | **New** | +18 |
| `src/lib/badgesApi.ts` | Modified | +79 |
| `src/lib/badgeTemplatesApi.ts` | Modified | +8 |
| `src/pages/ProfilePage.tsx` | Modified | −58/+10 |
| `src/pages/BulkIssuancePage.tsx` | Modified | −23/+5 |
| `src/pages/ClaimBadgePage.tsx` | Modified | −15/+3 |
| `src/pages/IssueBadgePage.tsx` | Modified | −16/+6 |
| `src/pages/VerifyBadgePage.tsx` | Modified | −5/+3 |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Modified | −46/+14 |
| `src/components/BadgeDetailModal/ReportIssueForm.tsx` | Modified | −23/+8 |
| `src/components/BadgeDetailModal/SimilarBadgesSection.tsx` | Modified | −10/+2 |
| `src/components/BulkIssuance/BulkPreviewPage.tsx` | Modified | −89/+11 |
| `src/components/BulkIssuance/ProcessingComplete.tsx` | Modified | −10/+2 |
| `src/components/BulkIssuance/TemplateSelector.tsx` | Modified | −11/+3 |
| `src/components/TimelineView/BadgeTimelineCard.tsx` | Modified | −8/+2 |
| `src/pages/IssueBadgePage.test.tsx` | Modified | −77/+22 |
| `src/pages/ProfilePage.test.tsx` | Modified | −1/+1 |
| `src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` | Modified | +1 |

---

## Production Code — New API Lib Files

### 1. `src/lib/profileApi.ts` (new — 69 lines)

```ts
/**
 * Profile API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: GET/PATCH /auth/profile, POST /auth/change-password
 */

import { apiFetch } from './apiFetch';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/** GET /auth/profile */
export async function getProfile(): Promise<ProfileData> {
  const response = await apiFetch('/auth/profile');
  return handleResponse<ProfileData>(response);
}

/** PATCH /auth/profile */
export async function updateProfile(data: {
  firstName: string;
  lastName: string;
}): Promise<ProfileData> {
  const response = await apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return handleResponse<ProfileData>(response);
}

/** POST /auth/change-password */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to change password');
  }
}
```

### 2. `src/lib/bulkIssuanceApi.ts` (new — 131 lines)

```ts
/**
 * Bulk Issuance API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: CSV template download, upload, preview, error-report, confirm
 */

import { apiFetch } from './apiFetch';

export interface BulkUploadResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  sessionId: string;
}

export interface SessionError {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

export interface PreviewRow {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  isValid: boolean;
  error?: string;
  badgeName?: string;
  recipientName?: string;
}

export interface TemplateBreakdown {
  templateId: string;
  templateName: string;
  count: number;
}

export interface EnrichedPreviewData {
  sessionId: string;
  validRows: number;
  errorRows: number;
  totalRows: number;
  errors: SessionError[];
  status: string;
  createdAt: string;
  expiresAt: string;
  rows: PreviewRow[];
  summary?: {
    byTemplate: TemplateBreakdown[];
  };
}

export interface BulkConfirmResult {
  processed: number;
  failed: number;
  results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
    badgeId?: string;
    emailError?: string;
  }>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/** GET /bulk-issuance/template — returns CSV blob for download */
export async function downloadTemplate(templateId?: string): Promise<Response> {
  const url = templateId
    ? `/bulk-issuance/template?templateId=${encodeURIComponent(templateId)}`
    : '/bulk-issuance/template';
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  return response;
}

/** POST /bulk-issuance/upload — FormData with CSV file */
export async function uploadBulkIssuance(formData: FormData): Promise<BulkUploadResult> {
  const response = await apiFetch('/bulk-issuance/upload', {
    method: 'POST',
    body: formData,
  });
  return handleResponse<BulkUploadResult>(response);
}

/** GET /bulk-issuance/preview/:sessionId */
export async function getBulkPreview(sessionId: string): Promise<EnrichedPreviewData> {
  const response = await apiFetch(`/bulk-issuance/preview/${sessionId}`);
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to access this session');
    }
    if (response.status === 404) {
      throw new Error('Session not found or has expired');
    }
    throw new Error('Failed to load preview data');
  }
  return response.json();
}

/** GET /bulk-issuance/error-report/:sessionId — returns blob */
export async function downloadErrorReport(sessionId: string): Promise<Blob> {
  const response = await apiFetch(`/bulk-issuance/error-report/${sessionId}`);
  if (!response.ok) throw new Error('Failed to download error report');
  return response.blob();
}

/** POST /bulk-issuance/confirm/:sessionId */
export async function confirmBulkIssuance(
  sessionId: string,
  signal?: AbortSignal
): Promise<BulkConfirmResult> {
  const response = await apiFetch(`/bulk-issuance/confirm/${sessionId}`, {
    method: 'POST',
    signal,
  });
  return handleResponse<BulkConfirmResult>(response);
}
```

### 3. `src/lib/verifyApi.ts` (new — 18 lines)

```ts
/**
 * Verify API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: GET /verify/:verificationId
 */

import { apiFetch } from './apiFetch';

/**
 * GET /verify/:verificationId — returns raw Response for status-specific handling.
 *
 * The caller (VerifyBadgePage) needs direct access to response status codes
 * (404, 410) for distinct error states, so we return the raw Response.
 */
export async function verifyBadge(verificationId: string): Promise<Response> {
  return apiFetch(`/verify/${verificationId}`);
}
```

---

## Production Code — Extended API Lib Files

### 4. `src/lib/badgesApi.ts` — 7 new functions (+79 lines)

```ts
// --- Story 13.7: API Client Cleanup — migrated inline calls ---

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

/** PATCH /badges/:id/visibility */
export async function updateBadgeVisibility(
  badgeId: string,
  visibility: 'PUBLIC' | 'PRIVATE'
): Promise<void> {
  const res = await apiFetch(`/badges/${badgeId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) throw new Error('Failed to update visibility');
}

/** POST /badges/:id/claim — claim a specific badge (wallet modal) */
export async function claimBadge(badgeId: string): Promise<Record<string, unknown>> {
  const response = await apiFetch(`/badges/${badgeId}/claim`, {
    method: 'POST',
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** POST /badges/claim — public claim by token (email link) */
export async function claimBadgeByToken(data: {
  claimToken: string;
}): Promise<Record<string, unknown>> {
  const response = await apiFetch('/badges/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** GET /badges/:id/download/png — returns blob */
export async function downloadBadgePng(badgeId: string): Promise<Blob> {
  const response = await apiFetch(`/badges/${badgeId}/download/png`);
  if (!response.ok) throw new Error('Failed to download badge');
  return response.blob();
}

/** POST /badges/:id/report */
export async function reportBadgeIssue(
  badgeId: string,
  data: { issueType: string; description: string; email: string }
): Promise<Record<string, unknown>> {
  const response = await apiFetch(`/badges/${badgeId}/report`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<Record<string, unknown>>(response);
}

/** GET /badges/:id/similar?limit=N */
export async function getSimilarBadges(badgeId: string, limit = 6): Promise<unknown[]> {
  return apiFetchJson(`/badges/${badgeId}/similar?limit=${limit}`);
}

/** GET /badges/recipients */
export async function getRecipients(): Promise<Recipient[]> {
  return apiFetchJson('/badges/recipients');
}
```

### 5. `src/lib/badgeTemplatesApi.ts` — 1 new function (+8 lines)

```ts
/** GET /badge-templates?status=ACTIVE — only active templates */
export async function getActiveTemplates(): Promise<BadgeTemplate[]> {
  const response = await apiFetch('/badge-templates?status=ACTIVE');
  const data = await handleResponse<BadgeTemplate[] | BadgeTemplateListResponse>(response);
  return Array.isArray(data) ? data : data.data || [];
}
```

---

## Production Code — Migrated Page/Component Files

### 6. `src/pages/ProfilePage.tsx` (−58/+10)

- Removed inline `ProfileData` interface (now imported from `profileApi.ts`)
- Replaced 3 inline `apiFetch` calls with `getProfile()`, `updateProfile()`, `changePassword()`
- Removed manual `response.ok` / `response.json()` boilerplate — handled by API lib

### 7. `src/pages/BulkIssuancePage.tsx` (−23/+5)

- Replaced `downloadTemplate()` and `uploadBulkIssuance()` inline calls
- Template URL construction moved into API lib
- FormData upload error handling moved into API lib

### 8. `src/pages/ClaimBadgePage.tsx` (−15/+3)

- Replaced inline POST `/badges/claim` with `claimBadgeByToken()`
- Added `as any` cast for untyped response data access

### 9. `src/pages/IssueBadgePage.tsx` (−16/+6)

- Replaced inline GET `/badge-templates?status=ACTIVE` with `getActiveTemplates()`
- Replaced inline GET `/badges/recipients` with `getRecipients()`
- Removed manual array normalization (handled in API lib)

### 10. `src/pages/VerifyBadgePage.tsx` (−5/+3)

- Replaced inline `apiFetch('/verify/${id}')` with `verifyBadge(id)`
- Removed legacy comment about axios

### 11. `src/components/BadgeDetailModal/BadgeDetailModal.tsx` (−46/+14)

- Replaced 4 inline calls: `getBadgeById`, `downloadBadgePng`, `updateBadgeVisibility`, `claimBadge`
- Added `as unknown as BadgeDetail` cast for type mismatch between API lib `Badge` and component `BadgeDetail`

### 12. `src/components/BadgeDetailModal/ReportIssueForm.tsx` (−23/+8)

- Replaced inline POST `/badges/${id}/report` with `reportBadgeIssue()`

### 13. `src/components/BadgeDetailModal/SimilarBadgesSection.tsx` (−10/+2)

- Replaced inline GET `/badges/${id}/similar` with `getSimilarBadges()`

### 14. `src/components/BulkIssuance/BulkPreviewPage.tsx` (−89/+11)

- Removed 5 inline type definitions (moved to `bulkIssuanceApi.ts`)
- Replaced 3 inline calls: `getBulkPreview`, `downloadErrorReport`, `confirmBulkIssuance`
- Non-null assertion `sessionId!` used (URL param guaranteed by route)

### 15. `src/components/BulkIssuance/ProcessingComplete.tsx` (−10/+2)

- Replaced inline error report download with `downloadErrorReport()`

### 16. `src/components/BulkIssuance/TemplateSelector.tsx` (−11/+3)

- Replaced inline GET `/badge-templates?status=ACTIVE` with `getActiveTemplates()`
- Removed manual array normalization

### 17. `src/components/TimelineView/BadgeTimelineCard.tsx` (−8/+2)

- Replaced inline PATCH visibility with `updateBadgeVisibility()`

---

## Test File Changes

### 18. `src/pages/IssueBadgePage.test.tsx` (−77/+22)

Major refactor: mocks now target API lib functions instead of raw `global.fetch`:
- Added `mockGetRecipients` and `mockGetActiveTemplates` mocks
- Added `vi.mock('@/lib/badgeTemplatesApi')` block
- Replaced `mockFetch` call count assertions with API lib mock assertions
- Tests now verify `getActiveTemplates` and `getRecipients` are called, not raw fetch URLs

### 19. `src/pages/ProfilePage.test.tsx` (−1/+1)

- Error message changed: `'Failed to load profile'` → `'Server error'` (matches new `handleResponse` error message from mock)

### 20. `src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` (+1)

- Added missing `json` method to mock response for 500 error case (needed by `handleResponse`)

---

## Acceptance Criteria Coverage

| AC | Description | How Addressed |
|----|-------------|---------------|
| 1 | `axios` removed from `package.json` and `package-lock.json` | `"axios": "^1.13.4"` line removed, lock file −120 lines |
| 2 | No `import axios` or `require('axios')` in any frontend file | Zero imports remaining (one historical comment in VerifyBadgePage removed) |
| 3 | Inline `apiFetch` calls migrated to API lib + hooks | 21 inline calls → 11 API lib functions across 3 new + 2 extended files |
| 4 | All `*Api.ts` files use `apiFetch()`/`apiFetchJson()` | All 11 API lib files verified |
| 5 | No `localStorage.getItem` for tokens in API-calling code | Already clean — only `removeItem` in authStore logout cleanup |
| 6 | Tests pass, no axios in test files | 77 files, 793 tests pass, zero axios imports |

---

## Review Checklist

### Correctness
- [ ] All 21 inline-to-lib migrations preserve the same HTTP method, path, and body
- [ ] Error handling behavior preserved — same user-facing error messages and toast patterns
- [ ] Binary responses (blob downloads) handled correctly — `downloadBadgePng`, `downloadErrorReport`, `downloadTemplate` return Blob/Response, not JSON
- [ ] `verifyApi.ts` returns raw `Response` — is this consistent with other API libs that parse?
- [ ] `handleResponse<T>()` duplicated across `profileApi`, `bulkIssuanceApi`, `badgesApi` — should there be a shared utility?
- [ ] `getActiveTemplates()` handles both array and paginated response — is this defensively correct?

### Type Safety
- [ ] `claimBadge` / `claimBadgeByToken` return `Record<string, unknown>` — callers use `as any` casts. Are proper types needed?
- [ ] `reportBadgeIssue` returns `Record<string, unknown>` — caller casts to `Record<string, string>` for message access
- [ ] `getSimilarBadges` returns `unknown[]` — caller casts to `SimilarBadge[]`
- [ ] `getBadgeById` → `as unknown as BadgeDetail` double cast in `BadgeDetailModal` — type mismatch between API `Badge` and component `BadgeDetail`
- [ ] `sessionId!` non-null assertions in `BulkPreviewPage` (2 occurrences) — are these safe?

### Testing
- [ ] `IssueBadgePage.test.tsx` refactored mocks — verify all 11 test cases still exercise the right code paths
- [ ] `ProfilePage.test.tsx` error message change from `'Failed to load profile'` to `'Server error'` — is this a test behavior regression or intended?
- [ ] No new test files for the 3 new API lib modules — acceptable for pure refactor?
- [ ] `BulkPreviewPage.test.tsx` added `json` mock for 500 case — is this sufficient?

### Code Quality
- [ ] `handleResponse<T>()` is a private helper duplicated in 3 new API libs + exists in `badgeTemplatesApi` — consider extracting to shared utility in `apiFetch.ts`
- [ ] `as any` / `as unknown as X` casts — are these temporary or should types be aligned?
- [ ] Naming consistency: `claimBadge` (by ID) vs `claimBadgeByToken` — clear enough?
- [ ] `package-lock.json` shows −120 lines from axios removal — verify no other dependency was accidentally removed

### Completeness
- [ ] Verify zero remaining `import { apiFetch }` in page/component files (should only be in `*Api.ts` + test files + `stores/authStore.ts`)
- [ ] Verify `axios` not in `package-lock.json`
- [ ] Check if `useWallet.ts` or `useBadgeSearch.ts` still have inline `apiFetch` (not in scope per dev prompt — but worth noting)

---

## How to Review

```bash
# View the commit
git log --oneline bd8aac9..c846ab9

# View all changes
git diff bd8aac9 c846ab9

# View only production code (no tests/docs)
git diff bd8aac9 c846ab9 -- 'gcredit-project/frontend/src/lib/' 'gcredit-project/frontend/src/pages/' 'gcredit-project/frontend/src/components/'

# Verify no axios remains
cd gcredit-project/frontend
grep -r "import.*axios\|require.*axios" src/

# Verify no inline apiFetch in pages/components (should only be in lib/ and stores/)
grep -r "from.*apiFetch" src/pages/ src/components/

# Run tests
npx vitest run

# Run build
npx vite build
```

---

## Expected Output Format

```markdown
## Code Review: Story 13.7 — API Client Cleanup

**Verdict**: Approved | Approved with Required Fixes | Changes Required

### Findings

#### [Critical | Major | Minor | Nit] — <title>
- **File**: `<path>`
- **Issue**: <description>
- **Fix**: <action required or suggestion>

### Summary
<1-2 paragraph summary>
```
