# Dev Prompt — Story 13.7: API Client Cleanup (Remove axios + Inline Migrations)

## Story Reference

- **Story file**: `docs/sprints/sprint-13/13-7-api-client-cleanup.md`
- **Branch**: `sprint-13/sso-session-management`
- **Baseline commit**: `bd8aac9` (Story 13.6 accepted)
- **Estimate**: 3–4h
- **Priority**: MEDIUM
- **Depends on**: Story 13.5 ✅ (401 interceptor in `apiFetch()`)

## Objective

Unify all frontend API calls through `apiFetch()` / `apiFetchJson()` + React Query hooks. Remove dead `axios` dependency. Eliminate any remaining `localStorage` token references in API-calling code. After this story, **every API call** routes through the 401 interceptor automatically.

## Pre-Implementation Audit Results (SM-verified 2026-02-26)

### 1. `axios` dependency

- **`package.json` line 25**: `"axios": "^1.13.4"` — dead dependency, zero active imports
- **Single comment reference**: `VerifyBadgePage.tsx:44` — comment only mentioning "instead of axios"
- **Action**: `npm uninstall axios`, verify zero references

### 2. Inline `apiFetch()` calls in page components (9 calls across 4 pages)

| File | Line | Call | Candidate API Lib | Notes |
|------|------|------|--------------------|-------|
| `BulkIssuancePage.tsx` | 47 | `apiFetch(templateUrl)` — fetch template image | — | Binary/blob fetch for preview — may stay inline or move to `bulkIssuanceApi.ts` |
| `BulkIssuancePage.tsx` | 107 | `apiFetch('/bulk-issuance/upload', { POST, FormData })` | — | File upload — needs new `bulkIssuanceApi.ts` |
| `ClaimBadgePage.tsx` | 37 | `apiFetch('/badges/claim', { POST })` | `badgesApi.ts` | Could use existing `badgesApi` or new claim function |
| `IssueBadgePage.tsx` | 63 | `apiFetch('/badge-templates?status=ACTIVE')` | `badgeTemplatesApi.ts` | `getAllTemplates()` exists but doesn't filter by status |
| `IssueBadgePage.tsx` | 81 | `apiFetch('/badges/recipients')` | `badgesApi.ts` | Needs new `getRecipients()` function |
| `ProfilePage.tsx` | 71 | `apiFetch('/auth/profile')` | — | Needs new `profileApi.ts` or add to `authStore` |
| `ProfilePage.tsx` | 95 | `apiFetch('/auth/profile', { PATCH })` | — | Needs new `profileApi.ts` |
| `ProfilePage.tsx` | 161 | `apiFetch('/auth/change-password', { POST })` | — | Needs new `profileApi.ts` |
| `VerifyBadgePage.tsx` | 45 | `apiFetch('/verify/${id}')` | — | Needs new `verifyApi.ts` or add to `badgesApi.ts` |

### 3. Inline `apiFetch()` calls in components (12 calls across 5 components)

| File | Line | Call | Candidate API Lib | Notes |
|------|------|------|--------------------|-------|
| `BadgeTimelineCard.tsx` | 42 | `apiFetch('/badges/${id}/visibility', { PATCH })` | `badgesApi.ts` | Needs `updateVisibility()` |
| `BadgeDetailModal.tsx` | 63 | `apiFetch('/badges/${id}')` | `badgesApi.ts` | `getBadgeById()` exists! Direct replacement |
| `BadgeDetailModal.tsx` | 107 | `apiFetch('/badges/${id}/download/png')` | `badgesApi.ts` | Binary download — needs `downloadBadgePng()` |
| `BadgeDetailModal.tsx` | 137 | `apiFetch('/badges/${id}/visibility', { PATCH })` | `badgesApi.ts` | Same as TimelineCard — `updateVisibility()` |
| `BadgeDetailModal.tsx` | 159 | `apiFetch('/badges/${id}/claim', { POST })` | `badgesApi.ts` | Needs `claimBadge()` |
| `BulkPreviewPage.tsx` | 96 | `apiFetch('/bulk-issuance/preview/${id}')` | — | Needs `bulkIssuanceApi.ts` |
| `BulkPreviewPage.tsx` | 131 | `apiFetch('/bulk-issuance/error-report/${id}')` | — | Binary download |
| `BulkPreviewPage.tsx` | 164 | `apiFetch('/bulk-issuance/confirm/${id}', { POST })` | — | Needs `bulkIssuanceApi.ts` |
| `ReportIssueForm.tsx` | 37 | `apiFetch('/badges/${id}/report', { POST })` | `badgesApi.ts` | Needs `reportIssue()` |
| `ProcessingComplete.tsx` | 40 | `apiFetch('/bulk-issuance/error-report/${id}')` | — | Same as BulkPreviewPage download |
| `SimilarBadgesSection.tsx` | 28 | `apiFetch('/badges/${id}/similar?limit=6')` | `badgesApi.ts` | Needs `getSimilarBadges()` |
| `TemplateSelector.tsx` | 40 | `apiFetch('/badge-templates?status=ACTIVE')` | `badgeTemplatesApi.ts` | Same as IssueBadgePage — `getActiveTemplates()` |

### 4. localStorage token references

| File | Line | Code | Action |
|------|------|------|--------|
| `authStore.ts` | 136 | `localStorage.removeItem('accessToken')` | **KEEP** — labeled "migration cleanup", safe belt-and-suspenders |
| `authStore.ts` | 137 | `localStorage.removeItem('refreshToken')` | **KEEP** — same migration cleanup |

**No `localStorage.getItem('accessToken')` or `localStorage.getItem('refreshToken')` found anywhere** — AC #5 is already satisfied.

### 5. Existing API lib files (8 files)

| File | Functions | Uses `apiFetch`/`apiFetchJson` |
|------|-----------|-------------------------------|
| `adminUsersApi.ts` | Multiple admin CRUD | ✅ |
| `analyticsApi.ts` | Analytics endpoints | ✅ |
| `badgesApi.ts` | `getAllBadges`, `getIssuedBadges`, `revokeBadge`, `getBadgeById`, `issueBadge` | ✅ |
| `badgeShareApi.ts` | Share/link functions | ✅ |
| `badgeTemplatesApi.ts` | CRUD + `getAllTemplates`, `getTemplateById`, etc. | ✅ |
| `evidenceApi.ts` | Evidence uploads | ✅ |
| `m365SyncApi.ts` | M365 sync triggers | ✅ |
| `milestonesApi.ts` | Milestone endpoints | ✅ |

### 6. Existing React Query hooks (reference pattern)

| Hook | API Lib | Pattern |
|------|---------|---------|
| `useWallet.ts` | Inline `apiFetch` | `useQuery` + inline fetch |
| `useSkillCategories.ts` | Inline `apiFetch` | `useQuery`/`useMutation` + inline |
| `useAdminUsers.ts` | `adminUsersApi.ts` | `useQuery`/`useMutation` + API lib |
| `useDashboard.ts` | Various | `useQuery` |
| `useAnalytics.ts` | `analyticsApi.ts` | `useQuery` |
| `useBadgeSearch.ts` | — | Zustand + fetch |
| `useSkills.ts` | — | `useQuery` |
| `useM365Sync.ts` | `m365SyncApi.ts` | `useQuery`/`useMutation` |

---

## Implementation Plan

### Task 1: Remove `axios` dependency (AC #1, #2)

```bash
cd gcredit-project/frontend
npm uninstall axios
```

- Verify zero `axios` references: `grep -r "axios" src/` should return only the single comment in `VerifyBadgePage.tsx`
- Remove or update that comment reference too (optional, it's documenting history)
- Verify `package-lock.json` no longer contains axios

### Task 2: Create new API lib files for uncovered domains

#### 2a. `src/lib/profileApi.ts` (NEW)

Covers: ProfilePage inline calls (3 calls)

```typescript
import { apiFetch, apiFetchJson } from './apiFetch';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  role: string;
  // ... add fields as needed from existing ProfilePage types
}

/** GET /auth/profile */
export async function getProfile(): Promise<UserProfile> {
  return apiFetchJson('/auth/profile');
}

/** PATCH /auth/profile */
export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetchJson('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** POST /auth/change-password */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const res = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Password change failed');
  }
}
```

#### 2b. `src/lib/bulkIssuanceApi.ts` (NEW)

Covers: BulkIssuancePage, BulkPreviewPage, ProcessingComplete, TemplateSelector inline calls (7 calls)

```typescript
import { apiFetch, apiFetchJson } from './apiFetch';

/** POST /bulk-issuance/upload — FormData with CSV file */
export async function uploadBulkIssuance(formData: FormData): Promise<{ sessionId: string; ... }> {
  // Note: do NOT set Content-Type — apiFetch detects FormData and lets browser set boundary
  const res = await apiFetch('/bulk-issuance/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

/** GET /bulk-issuance/preview/:sessionId */
export async function getBulkPreview(sessionId: string): Promise<BulkPreviewData> {
  return apiFetchJson(`/bulk-issuance/preview/${sessionId}`);
}

/** GET /bulk-issuance/error-report/:sessionId — returns blob */
export async function downloadErrorReport(sessionId: string): Promise<Blob> {
  const res = await apiFetch(`/bulk-issuance/error-report/${sessionId}`);
  if (!res.ok) throw new Error('Failed to download error report');
  return res.blob();
}

/** POST /bulk-issuance/confirm/:sessionId */
export async function confirmBulkIssuance(sessionId: string): Promise<BulkConfirmResult> {
  return apiFetchJson(`/bulk-issuance/confirm/${sessionId}`, { method: 'POST' });
}
```

**Type definitions**: Extract from existing page components or define minimal interfaces. Check what the pages currently expect from the response JSON.

#### 2c. `src/lib/verifyApi.ts` (NEW)

Covers: VerifyBadgePage inline call (1 call)

```typescript
import { apiFetchJson } from './apiFetch';

export interface VerificationResult {
  // Match existing VerifyBadgePage types
  valid: boolean;
  badge?: { ... };
  // ...
}

/** GET /verify/:verificationId */
export async function verifyBadge(verificationId: string): Promise<VerificationResult> {
  return apiFetchJson(`/verify/${verificationId}`);
}
```

### Task 3: Extend existing API lib files

#### 3a. `src/lib/badgesApi.ts` — Add missing functions

```typescript
// ADD these functions:

/** PATCH /badges/:id/visibility */
export async function updateBadgeVisibility(
  badgeId: string,
  visibility: 'PUBLIC' | 'PRIVATE'
): Promise<Badge> {
  return apiFetchJson(`/badges/${badgeId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
}

/** POST /badges/:id/claim */
export async function claimBadge(badgeId: string, data?: unknown): Promise<Badge> {
  return apiFetchJson(`/badges/${badgeId}/claim`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/** GET /badges/:id/download/png — returns blob */
export async function downloadBadgePng(badgeId: string): Promise<Blob> {
  const res = await apiFetch(`/badges/${badgeId}/download/png`);
  if (!res.ok) throw new Error('Failed to download badge');
  return res.blob();
}

/** POST /badges/:id/report */
export async function reportBadgeIssue(
  badgeId: string,
  data: { reason: string; description?: string }
): Promise<void> {
  const res = await apiFetch(`/badges/${badgeId}/report`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit report');
}

/** GET /badges/:id/similar */
export async function getSimilarBadges(badgeId: string, limit = 6): Promise<Badge[]> {
  return apiFetchJson(`/badges/${badgeId}/similar?limit=${limit}`);
}

/** GET /badges/recipients */
export async function getRecipients(): Promise<Recipient[]> {
  return apiFetchJson('/badges/recipients');
}

/** POST /badges/claim (public claim by token) */
export async function claimBadgeByToken(data: { claimToken: string }): Promise<Badge> {
  return apiFetchJson('/badges/claim', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

#### 3b. `src/lib/badgeTemplatesApi.ts` — Add active templates filter

```typescript
/** GET /badge-templates?status=ACTIVE */
export async function getActiveTemplates(): Promise<BadgeTemplate[]> {
  return apiFetchJson('/badge-templates?status=ACTIVE');
}
```

### Task 4: Migrate page components to use API lib functions

For each page with inline `apiFetch`, replace with the corresponding API lib call. The pages should import from `@/lib/*Api` instead of `@/lib/apiFetch`.

**Migration checklist:**

| Component | Replace | With |
|-----------|---------|------|
| `BulkIssuancePage.tsx` | Inline upload | `bulkIssuanceApi.uploadBulkIssuance()` |
| `BulkIssuancePage.tsx` | Inline template fetch | Keep inline (binary/blob for image preview) OR move to API lib |
| `ClaimBadgePage.tsx` | Inline `/badges/claim` POST | `badgesApi.claimBadgeByToken()` |
| `IssueBadgePage.tsx` | Inline `/badge-templates?status=ACTIVE` | `badgeTemplatesApi.getActiveTemplates()` |
| `IssueBadgePage.tsx` | Inline `/badges/recipients` | `badgesApi.getRecipients()` |
| `ProfilePage.tsx` | 3 inline calls | `profileApi.getProfile()`, `.updateProfile()`, `.changePassword()` |
| `VerifyBadgePage.tsx` | Inline `/verify/${id}` | `verifyApi.verifyBadge()` |
| `BadgeDetailModal.tsx` | Inline `getBadgeById` | `badgesApi.getBadgeById()` (already exists!) |
| `BadgeDetailModal.tsx` | Inline download | `badgesApi.downloadBadgePng()` |
| `BadgeDetailModal.tsx` | Inline visibility | `badgesApi.updateBadgeVisibility()` |
| `BadgeDetailModal.tsx` | Inline claim | `badgesApi.claimBadge()` |
| `BadgeTimelineCard.tsx` | Inline visibility | `badgesApi.updateBadgeVisibility()` |
| `BulkPreviewPage.tsx` | 3 inline calls | `bulkIssuanceApi.*` |
| `ProcessingComplete.tsx` | Inline error report | `bulkIssuanceApi.downloadErrorReport()` |
| `ReportIssueForm.tsx` | Inline report | `badgesApi.reportBadgeIssue()` |
| `SimilarBadgesSection.tsx` | Inline similar | `badgesApi.getSimilarBadges()` |
| `TemplateSelector.tsx` | Inline active templates | `badgeTemplatesApi.getActiveTemplates()` |

**Important patterns to preserve:**
- Keep existing error handling logic (toast messages, loading states)
- Maintain the same response parsing behavior
- For blob/binary responses (`downloadBadgePng`, `downloadErrorReport`, template image preview), you may keep the API lib function returning a raw `Response` or `Blob` — don't force JSON parsing
- Don't convert to `useQuery`/`useMutation` if the call is in an event handler (e.g., click-to-download, form submit) — `useMutation` is appropriate for these; `useQuery` for load-on-mount fetches
- If a page currently manages state via `useState` + `useEffect` fetch, consider **whether converting to `useQuery` is safe**:
  - If the component has complex local state management interleaved with the fetch, keep the pattern simple — just replace the inline `apiFetch` call with the API lib function
  - If it's a straightforward fetch-on-mount → display pattern, `useQuery` is preferred

### Task 5: localStorage audit (AC #5)

Already verified: **No `localStorage.getItem('accessToken')` or `localStorage.getItem('refreshToken')` exists** in any API-calling code. The only references are in `authStore.logout()` as cleanup removal calls — **KEEP these** as belt-and-suspenders migration cleanup.

### Task 6: Verification

```bash
# Run full test suite (must pass 793+ tests)
cd gcredit-project/frontend
npx vitest run

# Run lint
npx eslint src/

# Run build (ensure no import errors)
npx vite build

# Verify zero axios references
grep -r "import.*axios\|require.*axios" src/
# Expected: 0 results
```

---

## Acceptance Criteria Checklist

| AC | Criteria | How to verify |
|----|----------|---------------|
| 1 | `axios` removed from `package.json` and `package-lock.json` | `npm ls axios` returns error / not found |
| 2 | No `import axios` or `require('axios')` in any frontend file | `grep -r "axios" src/` returns 0 production imports |
| 3 | Inline `apiFetch` calls migrated to API lib + hooks where appropriate | All 21 inline calls replaced or justified |
| 4 | All `*Api.ts` files use `apiFetch()` / `apiFetchJson()` | Review each API lib file |
| 5 | No `localStorage.getItem` for tokens in API-calling code | Already verified — pass |
| 6 | All tests pass, no axios in test files | `npx vitest run` — 793+ pass |

## Commit Convention

```
feat(story-13.7): API client cleanup — remove axios + migrate inline calls

- Remove dead axios dependency
- Create profileApi.ts, bulkIssuanceApi.ts, verifyApi.ts
- Extend badgesApi.ts: visibility, claim, download, report, similar, recipients
- Extend badgeTemplatesApi.ts: getActiveTemplates
- Migrate 21 inline apiFetch calls to API lib functions
- All API calls now route through 401 interceptor
```

## Key Files to Touch

**New files:**
- `src/lib/profileApi.ts`
- `src/lib/bulkIssuanceApi.ts`
- `src/lib/verifyApi.ts`

**Extended files:**
- `src/lib/badgesApi.ts` (add 7 functions)
- `src/lib/badgeTemplatesApi.ts` (add 1 function)

**Migrated pages/components (remove `import { apiFetch }` after migration):**
- `src/pages/BulkIssuancePage.tsx`
- `src/pages/ClaimBadgePage.tsx`
- `src/pages/IssueBadgePage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/VerifyBadgePage.tsx`
- `src/components/BadgeDetailModal/BadgeDetailModal.tsx`
- `src/components/BadgeDetailModal/ReportIssueForm.tsx`
- `src/components/BadgeDetailModal/SimilarBadgesSection.tsx`
- `src/components/BulkIssuance/BulkPreviewPage.tsx`
- `src/components/BulkIssuance/ProcessingComplete.tsx`
- `src/components/BulkIssuance/TemplateSelector.tsx`
- `src/components/TimelineView/BadgeTimelineCard.tsx`

**Removed dependency:**
- `package.json` — remove `axios`

## Test Strategy

- **No new test files needed** — this is a refactor with no behavior change
- **All 793 existing tests must pass** — migration should be transparent
- If any test mocks `apiFetch` directly, ensure the mock still works after the API lib indirection layer
- Run full test suite + lint + build as final verification
