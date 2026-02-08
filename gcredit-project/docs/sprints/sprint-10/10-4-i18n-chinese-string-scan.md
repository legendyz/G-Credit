# Story 10.4: i18n Scan + UX/Code Quality Quick Wins

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 3h  
**Sprint:** Sprint 10  
**Type:** Technical Debt + UX Polish  
**TD Reference:** Sprint 9 Retro Action Item #6, UX Release Audit Quick Wins

---

## Story

As a **developer**,  
I want **all hardcoded Chinese strings replaced with English, and UX audit quick wins resolved**,  
So that **the application is polished, consistent, and accessible for the v1.0.0 MVP release**.

## Background

Sprint 9 discovered Chinese strings in `ProcessingModal.tsx` from early development. Story 8.4 translated them to English, but a global scan was recommended. Additionally, Sally’s UX Release Audit identified several quick-win issues (window.alert usage, console.log debug code, ARIA role misuse) that can be batch-fixed in this story.

**Note:** This is NOT about full i18n framework setup. This combines i18n scan with low-effort UX polish from the pre-release audit.

## Acceptance Criteria

1. [ ] Global scan of `src/` (frontend + backend) for Chinese characters (Unicode range `\u4E00-\u9FFF`)
2. [ ] All found Chinese strings replaced with English equivalents
3. [ ] UI text remains consistent and grammatically correct
4. [ ] All tests pass (0 regressions)
5. [ ] 0 `window.alert()` calls in frontend source code
6. [ ] 0 `console.log` debug statements in frontend production code
7. [ ] Desktop Navbar uses correct ARIA roles (no `role="menubar"` misuse)
8. [ ] PR commit message: `fix: i18n scan + UX polish (audit quick wins)`

## Tasks / Subtasks

- [ ] **Task 1: Scan for Chinese characters** (AC: #1)
  - [ ] Run regex search: `[\u4E00-\u9FFF]` across `frontend/src/` and `backend/src/`
  - [ ] Catalog all found instances with file:line references
  - [ ] Exclude: comments, documentation, test data

- [ ] **Task 2: Replace with English** (AC: #2, #3)
  - [ ] Translate each Chinese string to appropriate English
  - [ ] Verify context-appropriate translation
  - [ ] Update component props/labels as needed

- [ ] **Task 3: Verify i18n** (AC: #4)
  - [ ] Run frontend tests
  - [ ] Visual verification of affected components (if any)

### 🏗️ UX Audit Quick Wins (from Sally’s Release Audit)

- [ ] **Task 4: Replace `window.alert()` with `toast.error()`** (AC: #5) — 15min
  - `BulkPreviewPage.tsx L157`: `alert(err instanceof Error ? err.message : 'Download failed')` → `toast.error(...)`
  - `ProcessingComplete.tsx L60`: `alert('Failed to download error report')` → `toast.error(...)`
  - Import `toast` from Sonner (already used elsewhere in the app)
  - _Source: UX Release Audit — Sally, Issue #4_

- [ ] **Task 5: Remove `console.log` from BadgeDetailModal** (AC: #6) — 5min
  - `BadgeDetailModal.tsx L29`: Debug logging left in production code
  - Fix: Remove the `console.log` statement
  - _Source: UX Release Audit — Sally, Issue #7_

- [ ] **Task 6: Fix Navbar ARIA `role="menubar"` misuse** (AC: #7) — 30min
  - `Navbar.tsx L41-42`: Desktop nav uses `role="menubar"` / `role="menuitem"` but doesn’t implement Arrow key navigation
  - Fix: Replace with standard `<nav>` + `<ul>` / `<li>` pattern (role-less navigation landmark)
  - Keep `role="navigation"` and `aria-label` on the `<nav>` element
  - Add active link styling (match MobileNav’s `isActive` pattern) while we’re touching this component
  - _Source: UX Release Audit — Sally, Issue #6 + Recommendation #1_

- [ ] **Task 7: Remove ~30 `console.log` in backend source** (AC: #6) — 30min
  - Migrate `console.log` / `console.error` to NestJS `Logger` with proper context
  - Key files: auth audit logs, startup messages, storage.service.ts, badge-templates.service.ts
  - _Source: Architecture Release Audit — Winston, Production Readiness finding_

## Dev Notes

### Scan Command
```powershell
# PowerShell scan for Chinese characters
Select-String -Path "frontend/src/**/*.tsx","frontend/src/**/*.ts","backend/src/**/*.ts" -Pattern "[\u4E00-\u9FFF]" -Recurse
```

### UX Audit References
- [ux-release-audit-v1.0.0.md](ux-release-audit-v1.0.0.md) — Sally’s full audit report
- [architecture-release-audit-v1.0.0.md](architecture-release-audit-v1.0.0.md) — Winston’s audit (console.log finding)
- Quick Wins #4-7 mapped from audit issues

### Time Budget
| Task | Source | Time |
|------|--------|------|
| i18n scan + fix | Sprint 9 Retro | 45min |
| window.alert → toast | UX Audit #4 | 15min |
| console.log removal (FE) | UX Audit #7 | 5min |
| Navbar ARIA fix + active styling | UX Audit #6 | 30min |
| console.log → Logger (BE) | Arch Audit | 30min |
| Testing & verification | — | 15min |
| **Total** | | **~2h 20min** |

### References
- Sprint 9 Retrospective: Chinese string issue in ProcessingModal
- Sprint 9 Story 8.4: ProcessingModal translation fix

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
