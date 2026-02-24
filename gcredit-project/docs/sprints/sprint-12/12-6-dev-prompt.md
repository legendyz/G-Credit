# Dev Prompt: Story 12.6 — Evidence Unification: UI Integration

**Story:** 12.6 (17h estimated)
**Branch:** `sprint-12/management-uis-evidence` (continue on current branch)
**Depends On:** Story 12.5 ACCEPTED (commit `1d12dc3`)
**Story Spec:** `sprint-12/12-6-evidence-unification-ui.md`

---

## Objective

Integrate the unified evidence model (Story 12.5) into all frontend surfaces: `IssueBadgePage` (stacked file + URL upload), `BadgeDetailModal` (unified evidence list), `VerifyBadgePage` (SAS/direct links), `BadgeManagementPage` (evidence count column), and bulk issuance result page (template-grouped evidence attachment with shared and individual per-badge evidence).

**This is a FRONTEND-ONLY story.** All backend APIs already exist from Story 12.5.

---

## Acceptance Criteria Summary

From the story doc — 13 ACs:

| # | AC | Summary |
|---|-----|---------|
| 1 | IssueBadgePage file upload | Drag & drop + browse file upload alongside URL input |
| 2 | Mixed evidence limit | Up to 5 evidence items (mix of files and URLs) |
| 3 | BadgeDetailModal unified | Displays both FILE and URL evidence in unified list |
| 4 | Badge Management evidence count | Evidence count column in badge table |
| 5 | VerifyBadgePage evidence | SAS-token URLs for files, direct links for URLs |
| 6 | Reusable EvidenceList | Shared component across all pages |
| 7 | Upload progress + validation | Per-file progress bar, 10MB max, type check (PDF/PNG/JPG/DOCX) |
| 8 | No regression | All existing frontend tests pass |
| 9 | Bulk result template grouping | Post-issuance results grouped by template |
| 10 | Shared evidence per group | Shared evidence attachment area per template group |
| 11 | Shared evidence fan-out | Shared evidence → API calls for each badge in group |
| 12 | Individual per-badge evidence | `[+ Individual Evidence]` button per badge row |
| 13 | Skip flow | "Skip — No Evidence" button with confirmation dialog |

---

## Backend API Reference (All Exist from Story 12.5)

### Evidence Endpoints — Base: `POST /api/badges/:badgeId/evidence`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST /` | `/api/badges/:badgeId/evidence` | `multipart/form-data` (field: `file`) | Upload file evidence (max 10MB, PDF/PNG/JPG/DOCX) |
| `POST /url` | `/api/badges/:badgeId/evidence/url` | `{ "sourceUrl": "https://..." }` | Add URL evidence |
| `GET /` | `/api/badges/:badgeId/evidence` | — | List all evidence for badge |
| `GET /:fileId/download` | `/api/badges/:badgeId/evidence/:fileId/download` | — | Generate download SAS token (5-min expiry) |
| `GET /:fileId/preview` | `/api/badges/:badgeId/evidence/:fileId/preview` | — | Generate preview SAS token (5-min expiry) |

### Evidence Response Shape

From `EvidenceFileResponse` (`backend/src/evidence/dto/upload-evidence.dto.ts`):
```typescript
interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: Date;
  type?: 'FILE' | 'URL';      // Story 12.5
  sourceUrl?: string;          // Story 12.5: For URL-type evidence
}
```

### Unified Evidence in Badge Detail Response

From `findOne()` in `badge-issuance.service.ts` — the `GET /api/badges/:id` response now includes:
```typescript
interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;          // originalName for FILE, hostname for URL
  url: string;           // blobUrl for FILE, sourceUrl for URL
  size?: number;         // FILE only
  mimeType?: string;     // FILE only
  uploadedAt: string;
}

// In badge response:
{
  ...badge,
  evidence: EvidenceItem[],   // Story 12.5: unified evidence list
  evidenceUrl: string | null, // Backward compat (1 sprint, deprecated)
}
```

### Badge Issuance API

`POST /api/badges` — `IssueBadgeRequest`:
```typescript
{
  templateId: string;
  recipientId: string;
  evidenceUrl?: string;   // Still accepted, creates EvidenceFile(type=URL) internally
  expiresIn?: number;
}
```

### `apiFetch` Wrapper

All API calls use `apiFetch()` from `src/lib/apiFetch.ts`:
```typescript
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // Automatically includes credentials (httpOnly cookies)
  // Sets Content-Type: application/json by default
  // Skips Content-Type for FormData (browser sets boundary)
}
```

**Important:** For file uploads, pass `FormData` as body — `apiFetch` will NOT set `Content-Type` (browser sets `multipart/form-data` boundary automatically).

---

## Current Codebase State

### 1. `frontend/src/pages/IssueBadgePage.tsx` (272 lines)

**Current state:** Single `evidenceUrl` text input (optional). No file upload capability. Submits URL directly in the `issueBadge()` JSON body. No two-step flow.

Key current code:
```tsx
// Form state (line ~51)
const [evidenceUrl, setEvidenceUrl] = useState('');

// Submit handler (line ~115) — sends evidenceUrl in JSON body
await issueBadge({
  templateId: selectedTemplateId,
  recipientId: selectedRecipientId,
  ...(evidenceUrl ? { evidenceUrl } : {}),
  ...(expiresIn !== '' ? { expiresIn: Number(expiresIn) } : {}),
});

// Evidence URL input (line ~223)
<Label htmlFor="evidenceUrl">
  Evidence URL <span className="text-neutral-500">(optional)</span>
</Label>
<Input
  id="evidenceUrl"
  type="url"
  placeholder="https://example.com/evidence"
  value={evidenceUrl}
  onChange={(e) => setEvidenceUrl(e.target.value)}
/>
```

**What needs to change (Task 2):**
- Replace single URL input with stacked layout: drag zone → OR → URL input → attached evidence list
- Keep track of pending files (File objects) + pending URLs (strings) in component state
- **Two-step submit:** (1) issue badge via `POST /api/badges` → get `badgeId` → (2) upload files via `POST /api/badges/:badgeId/evidence` + add URLs via `POST /api/badges/:badgeId/evidence/url` → navigate to success
- Per-file progress bar (not global spinner)
- 5-item combined limit (files + URLs)
- Validation: max 10MB per file, allowed types (PDF, PNG, JPG, DOCX)

---

### 2. `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx` (185 lines)

**Current state:** Only displays FILE-type evidence. Uses inline `apiFetch()` calls. Interface lacks `type` and `sourceUrl` fields. Supports preview (images/PDFs) and download via SAS tokens.

Key current code:
```tsx
// Interface (line ~5) — MISSING type and sourceUrl
interface EvidenceFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  // Missing: type?: 'FILE' | 'URL'
  // Missing: sourceUrl?: string
}

// Renders file icon, name, size, Preview/Download buttons
// Hidden when evidenceFiles.length === 0
```

**What needs to change (Task 3):**
- Replace this entire component with the new shared `<EvidenceList>` component
- In `BadgeDetailModal.tsx`, fetch evidence from the `badge.evidence` field (unified `EvidenceItem[]` from `findOne()` response) instead of separate fetch
- Pass `editable={false}` for read-only display

---

### 3. `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` (566 lines)

**Current evidence usage** (line ~303):
```tsx
import EvidenceSection from './EvidenceSection';
// ...
{/* AC 4.4: Evidence Files Section (from Story 4.3) */}
<EvidenceSection badgeId={badge.id} />
```

**What needs to change (Task 3):**
- Import `EvidenceList` from `@/components/evidence/EvidenceList`
- Replace `<EvidenceSection badgeId={badge.id} />` with `<EvidenceList items={badge.evidence || []} editable={false} />`
- Remove `EvidenceSection` import (this component can be deprecated/deleted)
- The badge detail fetched at top of component (`BadgeDetail` type) needs the `evidence` field — update `BadgeDetail` type in `types/badge.ts`

---

### 4. `frontend/src/pages/VerifyBadgePage.tsx` (286 lines)

**Current state:** Renders `evidenceFiles` from metadata using simple `<a>` links with direct `blobUrl`. No SAS token handling for files, no distinction between FILE and URL types.

Key current code:
```tsx
// VerificationResponse type includes:
evidenceFiles: Array<{ filename: string; blobUrl: string; uploadedAt: string }>;

// Evidence rendering (line ~170):
{badge.evidenceFiles && badge.evidenceFiles.length > 0 && (
  <div>
    <div className="font-semibold text-sm text-neutral-500 mb-2">Evidence</div>
    <div className="space-y-2">
      {badge.evidenceFiles.map((file, index) => (
        <a key={index} href={file.blobUrl} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-2 text-brand-600 hover:text-brand-800 hover:underline">
          <ExternalLink className="h-4 w-4" />
          {file.filename}
        </a>
      ))}
    </div>
  </div>
)}
```

**What needs to change (Task 5):**
- Replace inline evidence rendering with `<EvidenceList items={evidence} editable={false} />`
- Map `VerificationResponse.evidenceFiles` to `EvidenceItem[]` format, OR update the verification API response to include the unified `evidence` field
- FILE type: use SAS token preview/download endpoints
- URL type: render as direct clickable link
- Note: The verify endpoint (`GET /api/verify/:verificationId`) returns `_meta.evidenceFiles` — need to map this to `EvidenceItem[]` format

---

### 5. `frontend/src/pages/admin/BadgeManagementPage.tsx` (769 lines)

**Current state:** No evidence-related code at all. Badge list table with search, status filter, bulk actions.

**What needs to change (Task 4):**
- Add "Evidence" column to the badge table showing count (e.g., "3 📎")
- The `Badge` type from `badgesApi.ts` needs an `evidenceCount` or `evidence` field — currently doesn't exist
- Option A: Add `evidenceCount` to the `/badges/issued` response (backend change — may need a quick backend addition)
- Option B: Use `evidence` array from badge detail (requires fetching detail per row — expensive)
- **Recommended:** Option A is better, but if not available, can show evidence count only when user clicks/expands a row

---

### 6. `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx` (201 lines)

**Current state:** Already cleaned in Story 12.5 — no evidence-related code. Simple table with search/filter/pagination for valid bulk rows. Columns: Badge Name, Recipient Name, Recipient Email, Status.

**What needs to change (Task 6):** NOTHING — already clean. Mark Task 6 as done.

---

### 7. `frontend/src/components/BulkIssuance/ProcessingComplete.tsx` (143 lines)

**Current state:** Shows success/failure counts after bulk issuance. Flat list of results — no template grouping, no evidence attachment.

Key current code:
```tsx
interface BadgeResult {
  row: number;
  recipientEmail: string;
  badgeName: string;
  status: 'success' | 'failed';
  error?: string;
  emailError?: string;
}

interface ProcessingCompleteProps {
  success: number;
  failed: number;
  results: BadgeResult[];
  sessionId?: string;
  onViewBadges: () => void;
  onRetryFailed?: () => void;
}
```

**What needs to change (Tasks 7–10):**
- This component needs major rework OR a new `BulkResultPage.tsx` component
- Group results by `badgeName` (template name)
- Each group gets:
  - Collapsible header with template name + badge count
  - Shared evidence upload area (reuses `EvidenceList` + file upload zone)
  - Individual recipient rows with `[+ Individual Evidence]` buttons
- Shared evidence fan-out logic: upload evidence to each badge in group via API
- Skip flow: "Skip — No Evidence" button
- **Note:** `BadgeResult` needs `badgeId` from the confirm API response to call evidence API per badge

---

### 8. `frontend/src/lib/badgesApi.ts` (212 lines)

**Current state:** `IssueBadgeRequest` has `evidenceUrl?: string`. No evidence-specific API functions.

```typescript
export interface IssueBadgeRequest {
  templateId: string;
  recipientId: string;
  evidenceUrl?: string;
  expiresIn?: number;
}

export async function issueBadge(dto: IssueBadgeRequest): Promise<Badge> {
  const response = await apiFetch('/badges', { method: 'POST', body: JSON.stringify(dto) });
  return handleResponse<Badge>(response);
}
```

**What needs to change:**
- Add evidence API functions (new `evidenceApi.ts` or extend this module):
  ```typescript
  export async function uploadEvidenceFile(badgeId: string, file: File, onProgress?: (pct: number) => void): Promise<EvidenceItem>
  export async function addUrlEvidence(badgeId: string, sourceUrl: string): Promise<EvidenceItem>
  export async function listEvidence(badgeId: string): Promise<EvidenceItem[]>
  export async function getEvidencePreviewUrl(badgeId: string, fileId: string): Promise<{ url: string }>
  export async function getEvidenceDownloadUrl(badgeId: string, fileId: string): Promise<{ url: string }>
  ```
- Note: For file upload with progress tracking, you cannot use `apiFetch` directly — need `XMLHttpRequest` or a custom fetch wrapper with `ReadableStream` to track upload progress. Consider using `XMLHttpRequest` for the upload function.

---

### 9. `frontend/src/types/badge.ts` (82 lines)

**Current state:** No `evidence` field on `BadgeDetail`. `VerificationResponse.evidenceFiles` uses old format.

```typescript
export interface BadgeDetail {
  id: string;
  status: BadgeStatus;
  // ... other fields
  // MISSING: evidence: EvidenceItem[]
}

export interface VerificationResponse {
  // ...
  evidenceFiles: Array<{ filename: string; blobUrl: string; uploadedAt: string }>;
}
```

**What needs to change:**
- Add `EvidenceItem` type (shared across all evidence consumers)
- Add `evidence?: EvidenceItem[]` to `BadgeDetail`
- Update `VerificationResponse.evidenceFiles` to use `EvidenceItem[]` format (or map at transform time)

---

## Implementation Guide

### Task 1: Create shared `<EvidenceList>` component

**Location:** `src/components/evidence/EvidenceList.tsx`

**Props interface:**
```typescript
interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;        // originalName for FILE, hostname/truncated URL for URL
  url: string;         // blobUrl for FILE, sourceUrl for URL
  size?: number;       // FILE only (bytes)
  mimeType?: string;   // FILE only
  uploadedAt: string;
}

interface EvidenceListProps {
  items: EvidenceItem[];
  editable?: boolean;        // Show remove (✕) buttons
  badgeId?: string;          // For SAS token fetches (preview/download)
  onRemove?: (id: string) => void;
}
```

**Rendering rules:**
- FILE item: `📄 [type-icon/thumb] │ originalName │ 2.1 MB │ [Preview] [Download]`
  - Image files (PNG/JPG): Show 40×40 thumbnail preview using SAS token URL
  - PDF/DOCX: Show file type icon (📄)
  - Download: calls `GET /api/badges/:badgeId/evidence/:fileId/download` → opens SAS URL
  - Preview: calls `GET /api/badges/:badgeId/evidence/:fileId/preview` → opens SAS URL
- URL item: `🔗 [link-icon] │ truncated-url │ [Open ↗]`
  - Open: opens `sourceUrl` directly in new tab
- Editable mode: Show ✕ remove button per item
- Read-only mode: Hide remove button
- Empty state: Return `null` (hide entirely, consistent with current `EvidenceSection` behavior)
- Subtle hover background on items

**Helper functions to include:**
```typescript
function formatFileSize(bytes: number): string { ... }
function getFileIcon(mimeType: string): string { ... }
function truncateUrl(url: string, maxLen?: number): string { ... }
```

---

### Task 2: Update `IssueBadgePage` — stacked upload layout

**File:** `src/pages/IssueBadgePage.tsx`

**New component state:**
```typescript
// Replace evidenceUrl with:
const [pendingFiles, setPendingFiles] = useState<File[]>([]);
const [pendingUrls, setPendingUrls] = useState<string[]>([]);
const [urlInput, setUrlInput] = useState('');
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
const [isAttachingEvidence, setIsAttachingEvidence] = useState(false);
const totalEvidence = pendingFiles.length + pendingUrls.length;
```

**Layout (replace the current evidence URL input):**
```
┌─────────────────────────────────────┐
│  📎 Drag files here or browse       │
│     PDF, PNG, JPG, DOCX (max 10MB)  │
└─────────────────────────────────────┘
── OR ──
🔗 [Enter evidence URL____________] [+ Add]
📋 Attached Evidence (2/5):
├─ 📄 certificate.pdf (2.1 MB)  [✕]
└─ 🔗 https://coursera.org/cert  [✕]
```

**Drag zone implementation:**
- Native HTML5 drag-and-drop API (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`)
- `<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx" />` for browse fallback
- Visual feedback: dashed border → solid blue border on dragover
- Disabled when `totalEvidence >= 5`

**Validation (use Sonner toast per coding standards):**
- Too large: `toast.error("File exceeds 10MB limit")`
- Wrong type: `toast.error("Only PDF, PNG, JPG, DOCX files are supported")`
- Max reached: disable drop zone, gray out, `toast.warning("Maximum 5 evidence items reached")`

**Two-step submit flow:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Step 1: Issue badge (no evidence yet)
    const badge = await issueBadge({
      templateId: selectedTemplateId,
      recipientId: selectedRecipientId,
      ...(expiresIn !== '' ? { expiresIn: Number(expiresIn) } : {}),
    });

    // Step 2: Attach evidence (files + URLs)
    if (pendingFiles.length > 0 || pendingUrls.length > 0) {
      setIsAttachingEvidence(true);

      // Upload files with progress tracking
      for (const file of pendingFiles) {
        await uploadEvidenceFile(badge.id, file, (pct) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
        });
      }

      // Add URL evidence
      for (const url of pendingUrls) {
        await addUrlEvidence(badge.id, url);
      }
    }

    toast.success('Badge issued successfully!');
    navigate('/admin/badges');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to issue badge');
  } finally {
    setIsSubmitting(false);
    setIsAttachingEvidence(false);
  }
};
```

**Important:** The button text should change during two-step:
- Default: "Issue Badge"
- Step 1: "Issuing..."
- Step 2: "Attaching evidence..." (with per-file progress)

---

### Task 3: Update `BadgeDetailModal`

**File:** `src/components/BadgeDetailModal/BadgeDetailModal.tsx`

**Changes:**
1. Import `EvidenceList` from `@/components/evidence/EvidenceList`
2. Remove `import EvidenceSection from './EvidenceSection'`
3. Replace:
   ```tsx
   <EvidenceSection badgeId={badge.id} />
   ```
   with:
   ```tsx
   {badge.evidence && badge.evidence.length > 0 && (
     <EvidenceList items={badge.evidence} editable={false} badgeId={badge.id} />
   )}
   ```
4. Update `BadgeDetail` type in `types/badge.ts` to include `evidence?: EvidenceItem[]`

**Note:** The `findOne()` response already includes `evidence: EvidenceItem[]` from Story 12.5. No additional API calls needed.

---

### Task 4: Update Badge Management table

**File:** `src/pages/admin/BadgeManagementPage.tsx`

**Approach:** Add an "Evidence" column showing count. Since the badge list API (`/badges/issued`) doesn't currently return evidence count, use one of:
- **Option A (preferred):** Quick backend tweak — add `_count: { evidenceFiles: true }` to Prisma query in `findAll()` and map to response. This is a 5-line backend change. If you go this route, add it to a `evidenceCount` field in the Badge list response.
- **Option B (frontend-only fallback):** Lazy-load evidence count on expand/click. Less ideal for table view.

**If Option A backend change (recommended):**
In `badge-issuance.service.ts`, `findAll()` method — add to the Prisma include:
```typescript
include: {
  template: true,
  recipient: true,
  issuer: true,
  _count: { select: { evidenceFiles: true } },
}
```
Then map `badge._count.evidenceFiles` to a `evidenceCount` field in the response.

**Frontend column:**
```tsx
<th>Evidence</th>
// ...
<td>{badge.evidenceCount > 0 ? `${badge.evidenceCount} 📎` : '—'}</td>
```

---

### Task 5: Update `VerifyBadgePage`

**File:** `src/pages/VerifyBadgePage.tsx`

**Changes:**
1. Import `EvidenceList` from `@/components/evidence/EvidenceList`
2. Transform `badge.evidenceFiles` to `EvidenceItem[]` format:
   ```typescript
   const evidenceItems: EvidenceItem[] = (badge.evidenceFiles || []).map(f => ({
     id: f.filename,  // or generate
     type: 'FILE' as const,
     name: f.filename,
     url: f.blobUrl,
     uploadedAt: f.uploadedAt,
   }));
   ```
   Note: The verify endpoint currently returns `_meta.evidenceFiles` — check if it includes `type`/`sourceUrl` from Story 12.5. If not, update the backend's verify endpoint to include these fields, or assume all are FILE type for now.
3. Replace the inline evidence rendering block with:
   ```tsx
   {evidenceItems.length > 0 && (
     <div>
       <div className="font-semibold text-sm text-neutral-500 mb-2">Evidence</div>
       <EvidenceList items={evidenceItems} editable={false} badgeId={badge.id} />
     </div>
   )}
   ```

---

### Task 6: `BulkPreviewTable` — Already done

Story 12.5 already removed the evidence URL column. No changes needed. Mark complete.

---

### Task 7: Bulk result page — template group layout

**File:** `src/components/BulkIssuance/BulkResultPage.tsx` (NEW)

**Purpose:** After bulk issuance completes, display results grouped by template with evidence attachment areas.

**Prerequisites:**
- The bulk confirm API (`POST /api/bulk-issuance/confirm/:sessionId`) must return `badgeId` for each result row. Check the current response shape — if it doesn't include `badgeId`, a quick backend addition is needed.

**Current `ProcessingComplete` result shape:**
```typescript
interface BadgeResult {
  row: number;
  recipientEmail: string;
  badgeName: string;
  status: 'success' | 'failed';
  error?: string;
  badgeId?: string;  // NEEDED — check if bulk confirm already returns this
}
```

**Template grouping logic:**
```typescript
interface TemplateGroup {
  templateName: string;
  badges: BadgeResult[];  // Only successful badges
  failedBadges: BadgeResult[];
  isExpanded: boolean;
  sharedEvidence: EvidenceItem[];       // Evidence to fan-out to all badges
  individualEvidence: Record<string, EvidenceItem[]>;  // badgeId → evidence items
}

function groupByTemplate(results: BadgeResult[]): TemplateGroup[] {
  const groups = new Map<string, TemplateGroup>();
  for (const result of results) {
    let group = groups.get(result.badgeName);
    if (!group) {
      group = {
        templateName: result.badgeName,
        badges: [],
        failedBadges: [],
        isExpanded: false,
        sharedEvidence: [],
        individualEvidence: {},
      };
      groups.set(result.badgeName, group);
    }
    if (result.status === 'success') {
      group.badges.push(result);
    } else {
      group.failedBadges.push(result);
    }
  }
  return [...groups.values()];
}
```

**Layout per the story spec wireframe:**
```
┌──────────────────────────────────────────────────────┐
│ 📋 Bulk Issuance Complete — 18 badges issued         │
│                                                      │
│ 🏆 Cloud Architecture (15 badges)           [▼]     │
│  ├─ 📋 Shared Evidence (0/5):                        │
│  │  ┌────────────────────────────────┐               │
│  │  │ 📎 Drag files here or browse    │               │
│  │  └────────────────────────────────┘               │
│  │  🔗 [Enter URL______________] [+ Add]             │
│  │                                                   │
│  ├─ 📧 alice@gcredit.com  ✅  [+ Individual Evidence] │
│  ├─ 📧 bob@gcredit.com    ✅  [+ Individual Evidence] │
│  └─ 📧 carol@gcredit.com  ✅  [+ Individual Evidence] │
│                                                      │
│ 🏆 Innovation Award (3 badges)              [▼]     │
│  └─ ...                                             │
│                                                      │
│                          [完成] [Skip — No Evidence]  │
└──────────────────────────────────────────────────────┘
```

**Collapsible sections:** Use a simple `isExpanded` toggle per group. First group defaults to expanded.

---

### Task 8: Shared evidence upload per template group

**File:** Within `BulkResultPage.tsx` or extracted as `BulkTemplateGroup.tsx`

**Fan-out logic:**
```typescript
async function applySharedEvidence(group: TemplateGroup) {
  const successBadges = group.badges.filter(b => b.badgeId);
  let processed = 0;

  for (const badge of successBadges) {
    try {
      // Upload each shared file to this badge
      for (const file of sharedPendingFiles) {
        await uploadEvidenceFile(badge.badgeId!, file);
      }
      // Add each shared URL to this badge
      for (const url of sharedPendingUrls) {
        await addUrlEvidence(badge.badgeId!, url);
      }
      processed++;
      setGroupProgress(prev => ({ ...prev, [group.templateName]: processed }));
    } catch (err) {
      // Log partial failure, continue with remaining badges
      console.error(`Failed to attach evidence to badge ${badge.badgeId}:`, err);
    }
  }
}
```

**Concurrency:** For large groups (15+ badges), consider limiting parallel uploads (e.g., `Promise.allSettled` with batches of 3-5).

**Progress indicator:** Show "Applying to X/N badges..." per group.

---

### Task 9: Individual per-badge evidence

**Within badge row in `BulkResultPage.tsx`:**
- `[+ Individual Evidence]` button per successful badge row
- On click: inline expand showing `<EvidenceList editable={true}>` + file drop zone + URL input for that specific badge
- **Combined limit:** shared + individual ≤ 5 per badge
  ```typescript
  const sharedCount = group.sharedEvidence.length;
  const individualCount = group.individualEvidence[badge.badgeId]?.length || 0;
  const remaining = 5 - sharedCount - individualCount;
  ```
- Disable upload when `remaining <= 0`

---

### Task 10: Skip flow

**Within `BulkResultPage.tsx`:**

- "Skip — No Evidence" button at bottom of page
- If NO evidence has been attached anywhere → navigate directly to `/admin/badges`
- If SOME evidence has been attached (partially):
  ```tsx
  <ConfirmDialog
    title="Skip remaining evidence?"
    message="Some evidence has been attached. Skip remaining badges?"
    onConfirm={() => navigate('/admin/badges')}
    onCancel={() => {}}
  />
  ```

---

### Task 11: Tests

**Test files to create/update:**

| Test | File | Coverage |
|------|------|----------|
| EvidenceList component | `src/components/evidence/__tests__/EvidenceList.test.tsx` | FILE + URL rendering, editable + read-only, empty state, remove callback |
| File upload | `src/components/evidence/__tests__/FileUploadZone.test.tsx` | Drag/drop, browse, validation, progress, max limit |
| IssueBadgePage | `src/pages/__tests__/IssueBadgePage.test.tsx` (update existing) | Two-step flow, evidence attachment, error handling |
| VerifyBadgePage | `src/pages/__tests__/VerifyBadgePage.test.tsx` (update) | Evidence display for FILE and URL types |
| Template grouping | `src/components/BulkIssuance/__tests__/BulkResultPage.test.tsx` | Group by template, collapse/expand, counts |
| Shared evidence fan-out | Same file | Mock API calls per badge, progress tracking |
| Individual evidence limit | Same file | shared + individual ≤ 5 |
| Skip flow | Same file | Skip with no evidence, skip with partial evidence |

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/evidence/EvidenceList.tsx` | Shared evidence list component |
| `src/components/evidence/FileUploadZone.tsx` | Drag & drop + browse file upload zone |
| `src/components/evidence/EvidenceAttachmentPanel.tsx` | Combined zone + URL input + list (reused in IssueBadge + Bulk) |
| `src/lib/evidenceApi.ts` | Evidence API functions (upload, addUrl, list, preview, download) |
| `src/components/BulkIssuance/BulkResultPage.tsx` | Template-grouped result page with evidence attachment |
| `src/components/evidence/__tests__/EvidenceList.test.tsx` | Tests |
| `src/components/evidence/__tests__/FileUploadZone.test.tsx` | Tests |
| `src/components/BulkIssuance/__tests__/BulkResultPage.test.tsx` | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/IssueBadgePage.tsx` | Major: stacked upload + two-step flow |
| `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Replace EvidenceSection with EvidenceList |
| `src/pages/VerifyBadgePage.tsx` | Replace inline evidence with EvidenceList |
| `src/pages/admin/BadgeManagementPage.tsx` | Add evidence count column |
| `src/types/badge.ts` | Add EvidenceItem type, update BadgeDetail |
| `src/lib/badgesApi.ts` | Update IssueBadgeRequest (remove evidenceUrl), add Badge.evidenceCount |
| `src/components/BulkIssuance/BulkPreviewPage.tsx` | Route to BulkResultPage after processing |
| `src/components/BulkIssuance/ProcessingComplete.tsx` | May become a child of BulkResultPage or be deprecated |

## Files to Deprecate (Can Delete)

| File | Reason |
|------|--------|
| `src/components/BadgeDetailModal/EvidenceSection.tsx` | Replaced by shared EvidenceList |

---

## Developer Notes

### Upload Progress Tracking

`apiFetch` uses the Fetch API, which does NOT support upload progress tracking. For file uploads with progress bars, use `XMLHttpRequest`:

```typescript
export function uploadEvidenceFile(
  badgeId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<EvidenceFileResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    xhr.open('POST', `${baseUrl}/api/badges/${badgeId}/evidence`);
    xhr.withCredentials = true;  // Match apiFetch credentials: 'include'
    xhr.send(formData);
  });
}
```

### Sonner Toast Pattern (Coding Standard)

All user-facing messages must use Sonner toasts:
```typescript
import { toast } from 'sonner';
toast.success('Badge issued successfully!');
toast.error('File exceeds 10MB limit');
toast.warning('Maximum 5 evidence items reached');
```

### Bulk Confirm Response — Badge ID Check

The bulk confirm endpoint (`POST /api/bulk-issuance/confirm/:sessionId`) must return `badgeId` for each successful result. Check `bulk-issuance.service.ts` → `confirmBulkIssuance()` → the `results` array. If `badgeId` is missing from the response, add it:

```typescript
// In confirmBulkIssuance() — after successful issueBadge() call:
results.push({
  row: ...,
  recipientEmail: ...,
  badgeName: ...,
  status: 'success',
  badgeId: badge.id,  // ← NEEDED for evidence API calls
});
```

### Frontend Type Additions

Add to `src/types/badge.ts`:
```typescript
export interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface BadgeDetail {
  // ... existing fields ...
  evidence?: EvidenceItem[];  // Story 12.6
}
```

### Routing — BulkResultPage

Add route in `App.tsx`:
```tsx
<Route path="/admin/bulk-issuance/result/:sessionId" element={<BulkResultPage />} />
```

Or if navigated with state from `ProcessingComplete`:
```tsx
navigate('/admin/bulk-issuance/result', { state: { results, sessionId } });
```

---

## Pre-Submission Checklist

- [ ] `<EvidenceList>` renders FILE items with icon/name/size/Preview/Download
- [ ] `<EvidenceList>` renders URL items with icon/truncated-url/Open
- [ ] `<EvidenceList>` editable mode shows ✕ remove button
- [ ] `<EvidenceList>` read-only mode hides remove button
- [ ] `<EvidenceList>` returns null when items is empty
- [ ] `IssueBadgePage` has drag zone + URL input + attached list
- [ ] `IssueBadgePage` enforces 5-item combined limit
- [ ] `IssueBadgePage` validates file size (10MB) and type (PDF/PNG/JPG/DOCX)
- [ ] `IssueBadgePage` two-step: issue → attach evidence → success
- [ ] `IssueBadgePage` shows per-file upload progress
- [ ] `BadgeDetailModal` uses `<EvidenceList editable={false}>`
- [ ] `BadgeDetailModal` reads from `badge.evidence` (unified list)
- [ ] `VerifyBadgePage` uses `<EvidenceList editable={false}>`
- [ ] `VerifyBadgePage` FILE type uses SAS token preview/download
- [ ] `VerifyBadgePage` URL type renders as clickable link
- [ ] `BadgeManagementPage` shows evidence count column
- [ ] Bulk result page groups badges by template
- [ ] Bulk template group has shared evidence upload area
- [ ] Shared evidence fan-out calls API per badge
- [ ] Individual badge evidence via `[+ Individual Evidence]`
- [ ] Combined shared + individual ≤ 5 per badge enforced
- [ ] "Skip — No Evidence" button navigates to dashboard
- [ ] Skip with partial evidence shows confirmation dialog
- [ ] All existing frontend tests pass
- [ ] New tests for EvidenceList, FileUploadZone, IssueBadgePage, VerifyBadgePage, BulkResultPage
- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint --max-warnings=0` clean
- [ ] `sprint-status.yaml` updated: `12-6: review`

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
