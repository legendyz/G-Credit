# Story 10.4: i18n Scan + UX/Code Quality Quick Wins

**Status:** done  
**Priority:** 🟡 MEDIUM  
**Estimate:** 4h  
**Sprint:** Sprint 10  
**Type:** Technical Debt + UX Polish  
**TD Reference:** Sprint 9 Retro Action Item #6, UX Release Audit Quick Wins, TD-020, TD-021

---

## Story

As a **developer**,  
I want **all hardcoded Chinese strings replaced with English, and UX audit quick wins resolved**,  
So that **the application is polished, consistent, and accessible for the v1.0.0 MVP release**.

## Background

Sprint 9 discovered Chinese strings in `ProcessingModal.tsx` from early development. Story 8.4 translated them to English, but a global scan was recommended. Additionally, Sally’s UX Release Audit identified several quick-win issues (window.alert usage, console.log debug code, ARIA role misuse) that can be batch-fixed in this story.

**Note:** This is NOT about full i18n framework setup. This combines i18n scan with low-effort UX polish from the pre-release audit.

## Acceptance Criteria

1. [x] Global scan of `src/` (frontend + backend) for Chinese characters (Unicode range `\u4E00-\u9FFF`)
2. [x] All found Chinese strings replaced with English equivalents
3. [x] UI text remains consistent and grammatically correct
4. [x] All tests pass (0 regressions)
5. [x] 0 `window.alert()` calls in frontend source code
6. [x] 0 `console.log` debug statements in frontend production code
7. [x] Desktop Navbar uses correct ARIA roles (no `role="menubar"` misuse)
8. [x] PR commit message: `fix: i18n scan + UX polish (audit quick wins)`
9. [x] CI `e2e-tests` job depends on both `lint-and-unit` AND `frontend-tests` (TD-020)
10. [x] `react-hooks/set-state-in-effect` rule disabled or downgraded at project level, 9 inline suppressions removed (TD-021)

## Tasks / Subtasks

- [x] **Task 1: Scan for Chinese characters** (AC: #1)
  - [x] Run regex search: `[\u4E00-\u9FFF]` across `frontend/src/` and `backend/src/`
  - [x] Catalog all found instances with file:line references
  - [x] Exclude: comments, documentation, test data

- [x] **Task 2: Replace with English** (AC: #2, #3)
  - [x] Translate each Chinese string to appropriate English
  - [x] Verify context-appropriate translation
  - [x] Update component props/labels as needed

- [x] **Task 3: Verify i18n** (AC: #4)
  - [x] Run frontend tests
  - [x] Visual verification of affected components (if any)

### 🏗️ UX Audit Quick Wins (from Sally’s Release Audit)

- [x] **Task 4: Replace `window.alert()` with `toast.error()`** (AC: #5) — 15min
  - `BulkPreviewPage.tsx L157`: `alert(err instanceof Error ? err.message : 'Download failed')` → `toast.error(...)`
  - `ProcessingComplete.tsx L60`: `alert('Failed to download error report')` → `toast.error(...)`
  - Import `toast` from Sonner (already used elsewhere in the app)
  - _Source: UX Release Audit — Sally, Issue #4_

- [x] **Task 5: Remove `console.log` from BadgeDetailModal** (AC: #6) — 5min
  - `BadgeDetailModal.tsx L29`: Debug logging left in production code
  - Fix: Remove the `console.log` statement
  - _Source: UX Release Audit — Sally, Issue #7_

- [x] **Task 6: Fix Navbar ARIA `role="menubar"` misuse** (AC: #7) — 30min
  - `Navbar.tsx L41-42`: Desktop nav uses `role="menubar"` / `role="menuitem"` but doesn’t implement Arrow key navigation
  - Fix: Replace with standard `<nav>` + `<ul>` / `<li>` pattern (role-less navigation landmark)
  - Keep `role="navigation"` and `aria-label` on the `<nav>` element
  - Add active link styling (match MobileNav’s `isActive` pattern) while we’re touching this component
  - _Source: UX Release Audit — Sally, Issue #6 + Recommendation #1_

- [x] **Task 7: Remove ~30 `console.log` in backend source** (AC: #6) — 30min
  - Migrate `console.log` / `console.error` to NestJS `Logger` with proper context
  - Key files: auth audit logs, startup messages, storage.service.ts, badge-templates.service.ts
  - _Source: Architecture Release Audit — Winston, Production Readiness finding_

### 🔧 CI/ESLint Quick Fixes (from Story 10.3b Code Review)

- [x] **Task 8: TD-020 — Fix CI E2E job missing frontend dependency** (AC: #9) — 10min
  - `.github/workflows/test.yml`: Change `e2e-tests` job `needs: lint-and-unit` to `needs: [lint-and-unit, frontend-tests]`
  - _Source: Story 10.3b SM Code Review (2026-02-09)_

- [x] **Task 9: TD-021 — Downgrade react-hooks/set-state-in-effect to warn** (AC: #10) — 15min
  - `frontend/eslint.config.js`: Add rule override `'react-hooks/set-state-in-effect': 'warn'`
  - Remove 9 inline `// eslint-disable-next-line react-hooks/set-state-in-effect` from: ProcessingModal, CelebrationModal, useMediaQuery, EmployeeDashboard, DeactivateUserDialog, EditRoleDialog, SearchInput, MobileNav, useBadgeSearch
  - Verify `npx eslint . --max-warnings=0` still passes (warnings become 0 after removing rule override... wait — need to set to `off` or keep as `warn` with 0 warnings tolerance. **Recommended:** Set to `'off'` since all 9 patterns are legitimate React 19 idioms)
  - _Source: Story 10.3b SM Code Review (2026-02-09)_

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
| TD-020: CI E2E job fix | 10.3b Review | 10min |
| TD-021: ESLint rule override + cleanup | 10.3b Review | 15min |
| Testing & verification | — | 15min |
| **Total** | | **~2h 45min** |

### References
- Sprint 9 Retrospective: Chinese string issue in ProcessingModal
- Sprint 9 Story 8.4: ProcessingModal translation fix

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
All tasks completed. Code review fixes applied:
- Finding #2: widget-embed.controller.ts console.log replaced with CustomEvent dispatch
- Finding #3: axe-setup.ts console.log/warn removed (silent DEV-only init)
- Finding #1: Commits squashed with correct AC8 message

### File List
| File | Change |
|------|--------|
| backend/src/skills/dto/skill.dto.ts | 8 Chinese @ApiProperty descriptions → English |
| backend/src/badge-templates/dto/badge-template.dto.ts | ~22 Chinese strings → English |
| backend/src/badge-templates/dto/query-badge-template.dto.ts | ~10 Chinese strings → English |
| backend/src/skill-categories/dto/skill-category.dto.ts | ~17 Chinese strings → English |
| backend/src/badge-templates/badge-templates.controller.ts | 2 Chinese @ApiBody examples → English |
| backend/src/admin-users/admin-users.service.ts | 2 corrupted Unicode chars fixed |
| frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx | console.log → toast.success |
| frontend/src/components/BadgeWallet/EmptyState.tsx | 2 default prop console.log → () => {} |
| backend/src/main.ts | 2 console.log → Logger('Bootstrap') |
| backend/src/common/prisma.service.ts | console.log → Logger |
| backend/src/common/storage.service.ts | 3 console.* → Logger |
| backend/src/common/email.service.ts | 6 DEV console.log → Logger |
| backend/src/modules/auth/auth.service.ts | 5 console.log/error → Logger |
| backend/src/config/azure-blob.config.ts | 2 console.warn → Logger |
| backend/src/badge-templates/badge-templates.service.ts | 4 console.log/error → Logger |
| backend/src/badge-sharing/controllers/widget-embed.controller.ts | console.log → CustomEvent dispatch |
| frontend/src/lib/axe-setup.ts | console.log/warn removed (DEV-only, silent) |
| frontend/src/components/Navbar.tsx | role="menubar" → semantic ul/li + active styling |
| .github/workflows/test.yml | e2e-tests needs: [lint-and-unit, frontend-tests] |
| frontend/eslint.config.js | react-hooks/set-state-in-effect: 'off' |
| frontend/src/hooks/useBadgeSearch.ts | Remove eslint-disable comment |
| frontend/src/hooks/useMediaQuery.ts | Remove eslint-disable comment |
| frontend/src/pages/dashboard/EmployeeDashboard.tsx | Remove eslint-disable comment |
| frontend/src/components/BulkIssuance/ProcessingModal.tsx | Remove eslint-disable comment |
| frontend/src/components/search/SearchInput.tsx | Remove eslint-disable comment |
| frontend/src/components/admin/EditRoleDialog.tsx | Remove eslint-disable/enable block |
| frontend/src/components/common/CelebrationModal.tsx | Remove eslint-disable comment |
| frontend/src/components/layout/MobileNav.tsx | Remove eslint-disable comment |
| frontend/src/components/admin/DeactivateUserDialog.tsx | Remove eslint-disable/enable block |
