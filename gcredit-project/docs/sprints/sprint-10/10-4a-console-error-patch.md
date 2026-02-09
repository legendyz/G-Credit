# Patch 10.4a: Frontend console.error Cleanup

**Parent Story:** 10.4 (i18n + UX Quick Wins)  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 30min  
**Goal:** Remove all 10 frontend `console.error` calls — delete redundant ones (toast already present), replace bare ones with `toast.error`, keep ErrorBoundary.

---

## Context

Story 10.4 验收发现 10 个 `console.error` 残留在 catch blocks 中。AC6 定义的 "0 console.log debug statements" 已满足，但与 coding-standards.md "No console.log/error/warn in frontend" 规则存在差异。SM 决定立即修复，不积累技术债务。

---

## Changes Required

### Group A: DELETE console.error (toast already exists) — 6 locations

| # | File | Line | Action |
|---|------|------|--------|
| 1 | `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | ~109 | Delete `console.error('Download failed:', err);` — toast.error on next line |
| 2 | `src/components/BadgeDetailModal/BadgeDetailModal.tsx` | ~155 | Delete `console.error('Claim failed:', err);` — toast.error on next line |
| 3 | `src/components/BadgeDetailModal/EvidenceSection.tsx` | ~83 | Delete `console.error('Download error:', err);` — toast.error on next line |
| 4 | `src/components/BadgeDetailModal/EvidenceSection.tsx` | ~118 | Delete `console.error('Preview error:', err);` — toast.error on next line |
| 5 | `src/pages/BulkIssuancePage.tsx` | ~80 | Delete `console.error('Template download error:', error);` — toast.error above |
| 6 | `src/pages/BulkIssuancePage.tsx` | ~144 | Delete `console.error('Upload error:', error);` — toast.error above |

### Group B: REPLACE with toast.error (no user feedback today) — 3 locations

| # | File | Line | Action |
|---|------|------|--------|
| 7 | `src/components/BadgeDetailModal/VerificationSection.tsx` | ~16 | Add `import { toast } from 'sonner';` + replace `console.error('Failed to copy:', err)` → `toast.error('Failed to copy to clipboard')` |
| 8 | `src/components/BulkIssuance/TemplateSelector.tsx` | ~56 | Add `import { toast } from 'sonner';` + replace `console.error('Failed to fetch badge templates:', error)` → `toast.error('Failed to load badge templates')` |
| 9 | `src/pages/BadgeEmbedPage.tsx` | ~57 | Add `import { toast } from 'sonner';` + replace `console.error('Failed to fetch widget HTML:', err)` → `toast.error('Failed to load badge widget')` |

### Group C: KEEP as-is — 1 location

| # | File | Line | Reason |
|---|------|------|--------|
| 10 | `src/components/common/ErrorBoundary.tsx` | ~39 | React `componentDidCatch` lifecycle — this is React's built-in error logging hook. Toast is inappropriate here (component tree may be broken). **Keep.** |

---

## Acceptance Criteria

1. [ ] `Get-ChildItem -Recurse -Include "*.ts","*.tsx" frontend/src -Exclude "*.test.*","*.spec.*" | Select-String "console\.error"` returns **only 1 match** (ErrorBoundary.tsx)
2. [ ] All existing frontend tests pass (`npx vitest run` — 397 tests)
3. [ ] Frontend ESLint passes (`npm run lint` — 0 errors, 0 warnings)
4. [ ] Commit message: `fix: remove 9 frontend console.error — replace with toast or delete redundant`

---

## Verification

```powershell
# After changes:
cd gcredit-project/frontend
Get-ChildItem -Recurse -Include "*.ts","*.tsx" src -Exclude "*.test.*","*.spec.*" | Select-String "console\.(log|error|warn)"
# Expected: only ErrorBoundary.tsx:39

npx vitest run  # 397 tests pass
npm run lint    # 0 errors
```
