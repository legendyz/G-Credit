# Story 8.3 Dev Agent Prompt: Bulk Issuance Preview UI + TD-013 Bundle Splitting

**Sprint:** Sprint 9 | **Category:** Feature + Tech Debt | **Priority:** MEDIUM  
**Estimated Hours:** 14.5h (TD-013: 3h + Preview UI: 8h + P0/P1 Fixes: 3.5h)  
**Target Version:** v0.9.0  
**Date Created:** 2026-02-08  
**Dependencies:** Story 8.2 ✅ (completed)  
**Story File:** `sprint-9/8-3-bulk-preview-ui.md`

---

## 🎯 Mission

Two objectives in this story:

1. **TD-013 (前置任务, 3h):** Implement frontend bundle code splitting — route-based `lazy()` + `<Suspense>` and vendor chunk separation in `vite.config.ts`. Target: main bundle <400 KB (from 579 KB).

2. **Preview UI Enhancement (11.5h):** Significantly enhance the existing `BulkPreviewPage.tsx` (371 lines) with: search/filter/pagination on data table, proper confirmation modal (replace `window.confirm`), smart countdown timer, empty state component, UI text English translation, and comprehensive tests.

**The existing `BulkPreviewPage.tsx` is a basic scaffold.** It already has: session fetch, summary stats grid, error correction panel, error details table (capped at 10), valid rows preview (capped at 5), `ProcessingModal` integration, and completion view. **But it lacks:** search, filter, pagination, proper modal, countdown timer, empty state component, and tests.

---

## ⚠️ Critical Rules

1. **Lessons Learned — MUST follow:**
   - **L34:** Use variable type annotations (`const x: Type = expr`), NOT `as` casts — `eslint --fix` strips `as` casts silently
   - **L35:** Always verify with `npx tsc --noEmit` after all changes — don't rely on `npm test` alone
   - **L36:** When adding strict types, budget time for test mock updates
2. **NO `eslint-disable` comments** — fix properly or skip
3. **English UI text only** — the existing component has Chinese text that must be translated
4. **Commit incrementally** — commit after TD-013, then after each major task
5. **Test-driven** — write tests alongside each component
6. **Update `max-warnings` in package.json** if ESLint warning count changes (currently 284)
7. **Security:** Session IDOR validation already exists in backend — ensure frontend handles 403 properly

---

## 📦 Phase 0: TD-013 — Frontend Bundle Code Splitting (3h)

> **This MUST complete before Preview UI work begins.** Preview UI adds new components — bundle splitting first prevents size bloat.

### Current State
- **Vite config:** No `build.rollupOptions` configured
- **App.tsx:** All route imports are **eager** (no `lazy()`)
- **Bundle size:** 579 KB (target: <400 KB)

### Task 0.1: Analyze Current Bundle (0.5h)

```bash
cd gcredit-project/frontend
npm run build
# Note: vite-bundle-visualizer is NOT installed. Install temporarily:
npx vite-bundle-visualizer
```

Document the top 5 largest dependencies in the output.

### Task 0.2: Route-Based Code Splitting (1.5h)

Convert all route component imports in `App.tsx` to `lazy()` with `<Suspense>` fallback.

**Current `App.tsx` imports (all eager):**
```typescript
import AdminAnalyticsPage from '@/pages/AdminAnalyticsPage';
import BadgeManagementPage from '@/pages/admin/BadgeManagementPage';
import AdminUserManagementPage from '@/pages/AdminUserManagementPage';
import BulkIssuancePage from '@/pages/BulkIssuancePage';
import { BulkPreviewPage } from '@/components/BulkIssuance';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { TimelineView } from '@/components/TimelineView/TimelineView';
import { VerifyBadgePage } from '@/pages/VerifyBadgePage';
import BadgeEmbedPage from '@/pages/BadgeEmbedPage';
```

**Target — lazy loading:**
```typescript
import { lazy, Suspense } from 'react';

// Keep non-lazy: ProtectedRoute, Layout, Navbar (always needed)
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Lazy-load all page components
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const TimelineView = lazy(() => import('@/components/TimelineView/TimelineView').then(m => ({ default: m.TimelineView })));
const VerifyBadgePage = lazy(() => import('@/pages/VerifyBadgePage').then(m => ({ default: m.VerifyBadgePage })));
const BadgeEmbedPage = lazy(() => import('@/pages/BadgeEmbedPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/AdminAnalyticsPage'));
const BadgeManagementPage = lazy(() => import('@/pages/admin/BadgeManagementPage'));
const AdminUserManagementPage = lazy(() => import('@/pages/AdminUserManagementPage'));
const BulkIssuancePage = lazy(() => import('@/pages/BulkIssuancePage'));
const BulkPreviewPage = lazy(() => import('@/components/BulkIssuance/BulkPreviewPage'));
```

**Note:** Named exports need `.then(m => ({ default: m.ExportName }))` wrapper. Default exports work directly.

**Add Suspense wrapper:**
```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* ... all routes unchanged */}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Simple loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
```

### Task 0.3: Vendor Chunk Splitting (0.5h)

Add `manualChunks` to `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot'],
          'query-vendor': ['@tanstack/react-query'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },
  test: { /* unchanged */ },
});
```

**⚠️ IMPORTANT:** Only include packages that actually exist in `package.json`. The story spec mentions `chart.js`, `react-chartjs-2`, and `lodash-es` but these are **NOT installed** — do NOT include them. Check `package.json` dependencies before configuring chunks.

### Task 0.4: Verify Bundle Size (0.5h)

```bash
npm run build
# Check output sizes
# Target: main chunk <400 KB
# Run Lighthouse (optional): npx lighthouse http://localhost:5173 --output json
```

Verify all routes still load correctly after splitting:
- `/login`
- `/` (dashboard)
- `/wallet`
- `/admin/analytics`
- `/admin/badges`
- `/admin/bulk-issuance`
- `/admin/users`

**TD-013 Quality Gate:**
- [ ] Main bundle < 400 KB
- [ ] All 7+ routes load correctly
- [ ] Frontend tests still pass: `npx vitest run`
- [ ] No console errors in browser
- [ ] Commit: `feat: TD-013 implement route-based code splitting and vendor chunks`

---

## 📦 Phase 1: Backend — Enrich Preview API (1.5h)

### Current State

Backend `GET /api/bulk-issuance/preview/:sessionId` already exists and returns `PreviewData`:
```typescript
interface PreviewData {
  sessionId: string;
  validRows: number;
  errorRows: number;
  totalRows: number;
  errors: SessionError[];
  status: string;
  createdAt: string;
  expiresAt: string;
  rows: PreviewRow[];   // rows have: rowNumber, badgeTemplateId, recipientEmail, evidenceUrl, isValid, error
}
```

**What's missing:** Badge template names, recipient names, and template breakdown summary (AC1 requires these).

### Task 1.1: Enrich `getPreviewData()` in `bulk-issuance.service.ts` (1h)

Add enrichment after loading session data:
1. Collect unique `badgeTemplateId` values from rows → query `badge_templates` table → map ID→name
2. Collect unique `recipientEmail` values from valid rows → query `users` table → map email→name
3. Build `summary.byTemplate` aggregation
4. Return enriched response:

```typescript
interface EnrichedPreviewData extends PreviewData {
  summary: {
    byTemplate: Array<{ templateId: string; templateName: string; count: number }>;
  };
  rows: Array<PreviewRow & { 
    badgeName?: string;       // from badge_templates.name
    recipientName?: string;   // from users.firstName + lastName
  }>;
}
```

**Key implementation notes:**
- Use `this.prisma.badge_templates.findMany({ where: { id: { in: templateIds } } })` for batch lookup
- Use `this.prisma.users.findMany({ where: { email: { in: emails } } })` for batch lookup
- Handle missing templates/users gracefully (show ID/email as fallback)
- Don't break existing API contract — enriched fields are additive

### Task 1.2: Backend Tests (0.5h)

Add/update tests in `bulk-issuance.service.spec.ts`:
- Test enrichment: verify `badgeName` and `recipientName` populated
- Test missing template gracefully falls back to ID
- Test missing user gracefully falls back to email
- Existing preview tests should still pass

**Quality Gate:**
- [ ] `npm test` — all 510+ tests pass
- [ ] `npx tsc --noEmit` — no new errors
- [ ] Commit: `feat: Story 8.3 enrich preview API with badge/recipient names`

---

## 📦 Phase 2: Frontend — Enhance BulkPreviewPage (8h)

### Current File Analysis

`frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` (371 lines) has:
- ✅ Session fetch with Bearer auth
- ✅ Loading spinner
- ✅ Error handling (403/404)
- ✅ Summary stats grid (total/valid/error)
- ✅ Error correction panel (UX-P0-3 — download + re-upload buttons)
- ✅ Error details table (capped at 10 rows)
- ✅ Valid rows table (capped at 5 rows)
- ✅ Confirm button + ProcessingModal integration
- ✅ Processing complete view

**Needs enhancement/addition:**
- ❌ Chinese text → English translation
- ❌ `window.confirm()` → proper modal component (AC4)
- ❌ No search/filter on data table (AC2)
- ❌ No pagination with rows-per-page selector (AC2, UX-P1-5)
- ❌ No smart countdown timer (AC5, UX-P1-3)
- ❌ No empty state component (AC6)
- ❌ No template breakdown in header (AC1)
- ❌ No tests

### Refactoring Strategy

Break the monolithic `BulkPreviewPage.tsx` into focused components:

```
frontend/src/components/BulkIssuance/
├── BulkPreviewPage.tsx          # Main orchestrator (ENHANCE)
├── BulkPreviewHeader.tsx        # NEW: summary + timer
├── BulkPreviewTable.tsx         # NEW: data table with search/filter/pagination
├── ErrorCorrectionPanel.tsx     # NEW: extracted from BulkPreviewPage
├── ConfirmationModal.tsx        # NEW: replaces window.confirm()
├── EmptyPreviewState.tsx        # NEW: zero valid rows
├── SessionExpiryTimer.tsx       # NEW: smart countdown
├── ProcessingModal.tsx          # EXISTS (keep as-is)
├── ProcessingComplete.tsx       # NEW: extracted completion view
├── TemplateSelector.tsx         # EXISTS (keep as-is)
├── index.ts                     # UPDATE: add new exports
└── __tests__/
    ├── BulkPreviewPage.test.tsx     # NEW
    ├── BulkPreviewHeader.test.tsx    # NEW
    ├── BulkPreviewTable.test.tsx     # NEW
    ├── ErrorCorrectionPanel.test.tsx # NEW
    ├── ConfirmationModal.test.tsx    # NEW
    ├── EmptyPreviewState.test.tsx    # NEW
    └── SessionExpiryTimer.test.tsx   # NEW
```

---

### Task 2.1: Create `BulkPreviewHeader.tsx` (1h)

Display preview summary with template breakdown and session timer.

**Props:**
```typescript
interface BulkPreviewHeaderProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
  templateBreakdown: Array<{ templateName: string; count: number }>;
  expiresAt: string;
}
```

**Requirements:**
- Show "Bulk Issuance Preview — X Badges" title
- Summary stats: total / valid (green) / errors (red)  
- Template breakdown as colored pills/chips
- Integrate `SessionExpiryTimer` component
- All text in English

**UI:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Bulk Issuance Preview                           │
│─────────────────────────────────────────────────────│
│  ✅ 95 badges ready  │  ❌ 5 errors  │  ⏱️ 25:30  │
│                                                     │
│  Templates: [Leadership: 45] [Team Player: 30]      │
│             [Innovation: 20]                        │
└─────────────────────────────────────────────────────┘
```

**Tests (4):**
- Renders correct counts
- Displays template breakdown pills
- Shows timer when <5 min remaining
- Hides timer when >5 min remaining

---

### Task 2.2: Create `SessionExpiryTimer.tsx` (0.5h)

Smart countdown timer per UX-P1-3.

**Props:**
```typescript
interface SessionExpiryTimerProps {
  expiresAt: string;
  onExpired: () => void;
}
```

**Behavior (UX-P1-3):**
- **>5 min remaining:** No timer displayed (reduces anxiety)
- **5-0 min remaining:** Show warning: "⏱️ Preview expires in 4:32. Please confirm soon."
- **0 min (expired):** Call `onExpired()` callback → parent shows expired modal

**Implementation:**
- Use `useEffect` + `setInterval(1000)` to update every second
- Calculate remaining seconds from `expiresAt` vs `Date.now()`
- Clean up interval on unmount

**Tests (3):**
- Hidden when >5 min remaining  
- Visible with correct time when <5 min
- Calls `onExpired` when time reaches 0

---

### Task 2.3: Create `BulkPreviewTable.tsx` (2.5h)

Full-featured data table for valid rows with search, filter, and pagination.

**Props:**
```typescript
interface BulkPreviewTableProps {
  rows: Array<{
    rowNumber: number;
    badgeTemplateId: string;
    badgeName?: string;
    recipientEmail: string;
    recipientName?: string;
    evidenceUrl?: string;
    isValid: boolean;
  }>;
  validRows: number;
}
```

**Requirements (AC2 + UX-P1-5):**
- **Columns:** Badge Name, Recipient Name, Recipient Email, Evidence URL, Status
- **Search:** Filter by recipient name or email (client-side, debounced 300ms)
- **Filter:** Dropdown to filter by badge template name
- **Pagination:** Default 25 rows/page, selector [10 | 25 | 50]
- **Row count:** "Showing 1-25 of 95 badges"
- **Responsive:** Horizontal scroll on mobile
- **Only show valid rows** (`rows.filter(r => r.isValid)`)

**Implementation notes:**
- All filtering/search/pagination is **client-side** (max 20 rows for MVP, no need for server-side)
- Use `useMemo` for filtered results to avoid re-computation
- Use `useDebounce` hook (already exists at `@/hooks/useDebounce.ts`) for search input
- Display `badgeName ?? badgeTemplateId` as fallback if name not available
- Display `recipientName ?? recipientEmail` as fallback

**Tests (6):**
- Renders table with correct columns
- Search filters by recipient name
- Search filters by recipient email  
- Template filter works
- Pagination shows correct page
- Rows-per-page selector changes page size

---

### Task 2.4: Create `ErrorCorrectionPanel.tsx` (0.5h)

Extract the existing error correction panel from `BulkPreviewPage.tsx` into its own component.

**Props:**
```typescript
interface ErrorCorrectionPanelProps {
  errorCount: number;
  validCount: number;
  errors: Array<{
    rowNumber: number;
    badgeTemplateId: string;
    recipientEmail: string;
    message: string;
  }>;
  onDownloadErrorReport: () => void;
  onReupload: () => void;
}
```

**Requirements (UX-P0-3 — already partially implemented):**
- Error summary with count
- Guided workflow text (English):
  ```
  ⚠️ 5 errors prevent badge issuance
  
  To fix errors:
  1. Click "Download Error Report" below
  2. Correct errors in your original CSV file
  3. Click "Re-upload Fixed CSV" to replace this upload
  
  Or: Continue with 15 valid badges (5 will be skipped)
  ```
- Error details table (Row #, Template ID, Email, Error Message)
- "Download Error Report" button
- "Re-upload Fixed CSV" button
- Show all errors (remove 10-row cap — max is 20 for MVP anyway)

**Tests (4):**
- Renders error count correctly
- Shows all error rows in table
- Download button calls `onDownloadErrorReport`
- Re-upload button calls `onReupload`

---

### Task 2.5: Create `ConfirmationModal.tsx` (0.5h)

Replace `window.confirm()` with a proper React modal.

**Props:**
```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  badgeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Requirements (AC4):**
- Use Radix UI Dialog (already available: `@radix-ui/react-dialog`)
- Title: "Confirm Bulk Issuance"
- Body: "You are about to issue **X** badges. This action cannot be undone."
- Warning icon (⚠️)
- "Cancel" button (secondary)
- "Confirm and Issue" button (primary, green)

**Tests (3):**
- Renders with correct badge count
- Calls `onConfirm` when confirmed
- Calls `onCancel` when cancelled

---

### Task 2.6: Create `EmptyPreviewState.tsx` (0.5h)

Component for when CSV has zero valid rows (AC6).

**Props:**
```typescript
interface EmptyPreviewStateProps {
  onReupload: () => void;
}
```

**UI:**
```
┌─────────────────────────────────────────┐
│                                         │
│              📋  No Valid Badges         │
│                                         │
│  No valid badges found in CSV file.     │
│  Please check the template format       │
│  and try again.                         │
│                                         │
│          [🔄 Re-upload CSV]             │
│                                         │
└─────────────────────────────────────────┘
```

**Tests (2):**
- Renders message
- Re-upload button calls `onReupload`

---

### Task 2.7: Create `ProcessingComplete.tsx` (0.25h)

Extract the existing processing complete view from `BulkPreviewPage.tsx`.

**Props:**
```typescript
interface ProcessingCompleteProps {
  success: number;
  failed: number;
  onViewBadges: () => void;
}
```

Translate existing Chinese text to English: "Issuance Complete" / "Issued Successfully" / "Failed".

**Tests (2):**
- Shows success/failure counts
- View badges button navigates

---

### Task 2.8: Refactor `BulkPreviewPage.tsx` — Wire Everything Together (2h)

Refactor the existing 371-line monolith to compose the new sub-components.

**Key changes:**
1. Replace inline summary stats → `<BulkPreviewHeader>`
2. Replace inline error panel → `<ErrorCorrectionPanel>`
3. Replace inline valid rows table → `<BulkPreviewTable>`
4. Replace `window.confirm()` → `<ConfirmationModal>`
5. Add `<EmptyPreviewState>` for zero valid rows
6. Replace inline completion view → `<ProcessingComplete>`
7. Add session expired modal (when `SessionExpiryTimer` fires `onExpired`)
8. Translate all remaining Chinese text to English
9. Update `PreviewData` interface to include enriched fields

**Updated state management:**
```typescript
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [sessionExpired, setSessionExpired] = useState(false);
```

**Updated fetch type:**
```typescript
interface EnrichedPreviewRow extends PreviewRow {
  badgeName?: string;
  recipientName?: string;
}

interface EnrichedPreviewData extends PreviewData {
  summary?: {
    byTemplate: Array<{ templateName: string; count: number }>;
  };
  rows: EnrichedPreviewRow[];
}
```

**Navigation fix:** The "Re-upload" button currently navigates to `/admin/bulk-issuance/upload` which doesn't exist as a route. The correct path is `/admin/bulk-issuance` (the upload page route).

**Tests for BulkPreviewPage (6):**
- Renders loading state
- Renders error state (403/404)
- Renders preview with summary + table
- Shows error correction panel when errors exist
- Shows empty state when zero valid rows
- Confirmation modal opens on confirm click

---

### Task 2.9: Update `index.ts` Barrel Exports (0.1h)

Add new component exports:
```typescript
export { default as BulkPreviewPage } from './BulkPreviewPage';
export { default as ProcessingModal } from './ProcessingModal';
export { default as TemplateSelector } from './TemplateSelector';
export { default as BulkPreviewHeader } from './BulkPreviewHeader';
export { default as BulkPreviewTable } from './BulkPreviewTable';
export { default as ErrorCorrectionPanel } from './ErrorCorrectionPanel';
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as EmptyPreviewState } from './EmptyPreviewState';
export { default as SessionExpiryTimer } from './SessionExpiryTimer';
export { default as ProcessingComplete } from './ProcessingComplete';
```

---

## 🔒 Quality Gates

### After TD-013 (Phase 0)
- [ ] `npm run build` succeeds with main chunk < 400 KB
- [ ] All routes load correctly (no blank pages)
- [ ] Frontend tests pass: `npx vitest run`
- [ ] Commit: `feat: TD-013 implement route-based code splitting and vendor chunks`

### After Backend Enrichment (Phase 1)
- [ ] Backend tests: 510+ passed, 0 new failures
- [ ] `npx tsc --noEmit` — no new errors in `backend/`
- [ ] ESLint: `npm run lint` — warnings ≤ 284
- [ ] Commit: `feat: Story 8.3 enrich preview API with badge/recipient names`

### After Frontend Enhancement (Phase 2)
- [ ] Frontend tests: 339+ existing + 30 new tests pass
- [ ] `npx tsc --noEmit` — no new errors in `frontend/`
- [ ] All UI text in English
- [ ] `window.confirm()` fully removed from BulkPreviewPage
- [ ] Smart timer: hidden >5min, visible <5min, expired modal at 0
- [ ] Search + filter + pagination working
- [ ] Empty state renders for zero valid rows
- [ ] Confirmation modal renders and functions
- [ ] Commit: `feat: Story 8.3 bulk preview UI with search, filter, pagination, modal`

### Final Verification
- [ ] Backend: `cd gcredit-project/backend && npm test` — 510+ pass
- [ ] Frontend: `cd gcredit-project/frontend && npx vitest run` — 369+ pass
- [ ] E2E: `cd gcredit-project/backend && npm run test:e2e` — 143+ pass
- [ ] Backend lint: `cd gcredit-project/backend && npm run lint` — warnings ≤ 284
- [ ] Backend tsc: `cd gcredit-project/backend && npx tsc --noEmit`
- [ ] Bundle: main chunk < 400 KB

---

## 📁 Files Context

### Files to CREATE (Frontend)
| File | Purpose |
|------|---------|
| `frontend/src/components/BulkIssuance/BulkPreviewHeader.tsx` | Summary header + template breakdown |
| `frontend/src/components/BulkIssuance/BulkPreviewTable.tsx` | Data table + search/filter/pagination |
| `frontend/src/components/BulkIssuance/ErrorCorrectionPanel.tsx` | Error display + correction workflow |
| `frontend/src/components/BulkIssuance/ConfirmationModal.tsx` | Replace `window.confirm()` |
| `frontend/src/components/BulkIssuance/EmptyPreviewState.tsx` | Zero valid rows state |
| `frontend/src/components/BulkIssuance/SessionExpiryTimer.tsx` | Smart countdown timer |
| `frontend/src/components/BulkIssuance/ProcessingComplete.tsx` | Extracted completion view |
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` | Main page tests |
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewHeader.test.tsx` | Header tests |
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewTable.test.tsx` | Table tests |
| `frontend/src/components/BulkIssuance/__tests__/ErrorCorrectionPanel.test.tsx` | Error panel tests |
| `frontend/src/components/BulkIssuance/__tests__/ConfirmationModal.test.tsx` | Modal tests |
| `frontend/src/components/BulkIssuance/__tests__/EmptyPreviewState.test.tsx` | Empty state tests |
| `frontend/src/components/BulkIssuance/__tests__/SessionExpiryTimer.test.tsx` | Timer tests |

### Files to MODIFY
| File | Changes |
|------|---------|
| `frontend/src/App.tsx` | Convert to lazy imports + Suspense |
| `frontend/vite.config.ts` | Add `build.rollupOptions.output.manualChunks` |
| `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` | Major refactor: compose sub-components, translate text, add modal |
| `frontend/src/components/BulkIssuance/index.ts` | Add new exports |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Enrich preview data with badge/recipient names |
| `backend/src/bulk-issuance/bulk-issuance.service.spec.ts` | Add enrichment tests |

### Files to NOT TOUCH
- `ProcessingModal.tsx` — works correctly, no changes needed
- `TemplateSelector.tsx` — not used in preview
- `BulkIssuancePage.tsx` — upload page, separate story
- Backend controller — preview endpoint already exists and is correctly guarded

### Key Existing Files for Reference
| File | Why |
|------|-----|
| `frontend/src/test/setup.ts` | Test setup with global mocks |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | Test pattern example (Vitest + RTL) |
| `frontend/src/hooks/useDebounce.ts` | Reuse for search input debounce |
| `backend/src/bulk-issuance/bulk-issuance.controller.ts` | Existing endpoints reference |
| `backend/src/bulk-issuance/bulk-issuance.service.ts` | Session management, preview data structure |

---

## 🧪 Test Pattern Reference

The project uses **Vitest + @testing-library/react**. Follow this pattern:

```tsx
// Example: ConfirmationModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    badgeCount: 15,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the badge count', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirmed', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Confirm and Issue/i));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('should call onCancel when cancelled', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });
});
```

**Key testing rules:**
- Wrap components needing routing in `<MemoryRouter>`
- Mock `fetch` via `global.fetch = vi.fn()` (already in setup.ts)
- Mock `localStorage.getItem` for auth token
- Use `waitFor` for async operations
- Use `vi.useFakeTimers()` for timer tests (SessionExpiryTimer)

---

## 🚫 Out of Scope

- Story 8.4 (batch processing) — next story
- Backend confirm endpoint changes — already implemented
- Mobile-specific UI design — just ensure horizontal scroll works
- i18n framework — use English strings directly
- Server-side pagination — max 20 rows, client-side is sufficient
- Redis/async processing — deferred to TD-016

---

## ✅ Definition of Done

1. **TD-013:** Main bundle < 400 KB, all routes load, code splitting verified
2. **Backend:** Preview API returns enriched data (badge names, recipient names, template summary)
3. **Frontend:** BulkPreviewPage refactored into focused components with:
   - Search + filter + pagination (AC2, UX-P1-5)
   - Template breakdown header (AC1)
   - Error correction panel with download + re-upload (AC3, UX-P0-3)
   - Proper confirmation modal (AC4)
   - Smart countdown timer (AC5, UX-P1-3)
   - Empty state component (AC6)
   - All text in English
4. **Tests:** 30+ new frontend tests + backend enrichment tests pass
5. **Quality:** All existing tests pass (510 BE + 339 FE + 143 E2E), lint ≤ 284, tsc clean
6. **Security:** IDOR protection verified (403 on wrong session)

---

## 📝 Dev Agent Record Template

Update the Dev Agent Record in `8-3-bulk-preview-ui.md` with:

```markdown
### Agent Model Used
**Model:** [model name]
**Date:** 2026-02-08

### Completion Notes
**Status:** [done/partial]
**Blockers:** [None/describe]

### TD-013 Results
- **Bundle Before:** X KB
- **Bundle After:** X KB (X% reduction)
- **Chunks Created:** [list]
- **Lighthouse Before/After:** X → Y

### Test Results
- **Backend Unit:** X passed, Y skipped
- **Frontend Unit:** X passed (N new)
- **E2E:** X passed
- **tsc --noEmit:** pass/fail

### Components Created
| Component | Lines | Tests |
|-----------|-------|-------|
| BulkPreviewHeader | ? | ? |
| BulkPreviewTable | ? | ? |
| ErrorCorrectionPanel | ? | ? |
| ConfirmationModal | ? | ? |
| EmptyPreviewState | ? | ? |
| SessionExpiryTimer | ? | ? |
| ProcessingComplete | ? | ? |

### File List
**Files Created:** [count]
**Files Modified:** [count]
**Key files:** [list]
```
