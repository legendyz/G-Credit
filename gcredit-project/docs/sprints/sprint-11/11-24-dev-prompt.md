# Dev Prompt — Story 11.24: Data Contract Alignment

## Agent Activation

You are the Dev Agent (Amelia). Load `_bmad/bmm/agents/dev.md` persona.

**Story File:** `gcredit-project/docs/sprints/sprint-11/11-24-data-contract-alignment.md`  
**Branch:** `sprint-11/security-quality-hardening`  
**communication_language:** English (代码注释和 commit 用英文，但 story 文件中中文保留原样)

---

## Critical Context

### What Happened

Sprint 11 完成了 23 个 stories（安全加固 + 功能补全），但 UAT 排查发现 **14 个数据契约断裂问题** — 后端数据结构变了，前端没同步。模式是："上游改了、下游断了"。

### Current Codebase State

- **Backend:** NestJS 11.x, Prisma 6.19.2, PostgreSQL 16, Port 3000
- **Frontend:** React 19 + Vite, React Query, Tailwind CSS, Port 5173
- **Tests:** BE 722 + FE 541 = 1263 total (all passing)
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **ESLint:** Clean (FE and BE)
- **Auth:** httpOnly cookies via `apiFetch` wrapper (`credentials: 'include'`)

### Key Architecture Patterns

1. **API calls:** Frontend uses `apiFetch()` from `frontend/src/lib/apiFetch.ts` — always use this, never raw `fetch` or `axios`
2. **State management:** React Query for server state, Zustand for auth store
3. **Prisma queries:** Service methods return full relations via `include:`, controllers transform to DTOs
4. **Testing:** Jest for both BE and FE. BE uses `@nestjs/testing`, FE uses `@testing-library/react`

---

## Task Execution Order (MUST follow in sequence)

### Task 1: Backend — `formatActivityDescription()` (AC-C1) ~2h

**File:** `backend/src/dashboard/dashboard.service.ts`

**Current code (L401 area):**
```typescript
description: log.metadata ? JSON.stringify(log.metadata) : log.action,
```

**What to do:**
1. Create a `formatActivityDescription(action: string, metadata: Record<string, unknown> | null): string` function
2. Handle these action types by parsing metadata into human-readable strings:
   - `ISSUED` → `Badge "{{badgeName}}" issued to {{recipientEmail}}`
   - `CLAIMED` → `Badge status changed: {{oldStatus}} → {{newStatus}}`
   - `REVOKED` → `Revoked "{{badgeName}}" — {{reason}}`
   - `NOTIFICATION_SENT` → `{{notificationType}} notification sent to {{recipientEmail}}`
   - `CREATED` → `Template "{{templateName}}" created`
   - `UPDATED` → `Template "{{templateName}}" updated`
   - Unknown action → return `action` string as-is
3. Use `metadata?.fieldName ?? ''` to safely access possibly-missing fields
4. Replace `JSON.stringify(log.metadata)` call with `formatActivityDescription(log.action, log.metadata as Record<string, unknown>)`
5. **Write unit tests** for `formatActivityDescription()` — test all 6 action types + unknown + null metadata
6. Run `cd gcredit-project/backend; npx jest --forceExit` — all tests must pass

**AC:** Admin Dashboard Recent Activity shows human-readable descriptions, not JSON.

---

### Task 2: Frontend — `BadgeInfo.tsx` criteria multi-format support (AC-C2) ~30min

**File:** `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx`

**Current code (L12-17 area):** only handles `{ requirements: [...] }` format.

**What to do:**
1. Read the current criteria parsing logic
2. Add support for three formats in priority order:
   - `{ requirements: ['req1', 'req2'] }` → render as bullet list (existing)
   - `{ type: 'manual', description: 'Complete the course' }` or `{ description: '...' }` → render description as paragraph
   - Plain string → render as paragraph
   - `null/undefined` → show nothing or "No criteria specified"
3. Use `typeof criteria === 'string'` and `'requirements' in criteria` and `'description' in criteria` guards
4. **Write/update tests** for BadgeInfo with all three formats
5. Run `cd gcredit-project/frontend; npx vitest run` — all tests must pass

**AC:** Earning Criteria renders correctly for all template creation methods.

---

### Task 3: Wallet API — Badge/Milestone type discrimination (AC-C3) ~2h

**Backend file:** `backend/src/badge-issuance/badge-issuance.service.ts` (around L1162)  
**Frontend files:** `frontend/src/hooks/useWallet.ts`, `frontend/src/components/TimelineView/TimelineView.tsx`

**What to do:**

**Backend:**
1. Find the `getWallet()` method in `badge-issuance.service.ts`
2. Ensure each item in the response has `type: 'badge' | 'milestone'` field preserved (don't strip it in `.map()`)

**Frontend:**
1. Update `useWallet.ts` — add `type` field to the wallet item type:
   ```typescript
   type WalletItem = (Badge & { type: 'badge' }) | (Milestone & { type: 'milestone' });
   ```
2. In `TimelineView.tsx` and any grid view: check `item.type` before rendering
3. Create `frontend/src/components/TimelineView/MilestoneTimelineCard.tsx` — a simple card for milestones showing name, date achieved, description
4. Badge items render `BadgeTimelineCard`, milestone items render `MilestoneTimelineCard`
5. **If there are no milestones in the current data/seed**, this is still important for runtime safety — wrap in safe type guard
6. **Write tests** for the type discrimination logic
7. Run both BE and FE test suites

**AC:** Wallet timeline handles mixed badge+milestone data without crashing. Milestones have their own card.

---

### Task 4: Verification page field fixes (AC-M4, AC-M5, AC-L6) ~1h

**Backend file:** `backend/src/badge-verification/badge-verification.controller.ts`  
**Frontend file:** `frontend/src/pages/VerifyBadgePage.tsx`

**What to do:**

**Backend:**
1. In the verification response object, explicitly add:
   ```typescript
   expiresAt: badge.expiresAt,  // The Prisma field name
   claimedAt: badge.claimedAt,
   badgeId: badge.id,           // Actual UUID, not the OB assertion URL
   ```
2. These should be added alongside the existing `...assertionData` spread

**Frontend:**
1. In `VerifyBadgePage.tsx`, update the response mapping:
   - `expiresAt` → read from `apiData.expiresAt` (not `apiData.expires`)
   - `claimedAt` → read from `apiData.claimedAt`
   - `id` → read from `apiData.badgeId` (actual badge UUID, not assertion URL)
2. **Write/update tests** for the field mapping
3. Run FE tests

**AC:** Verification page shows expiry date & claim date when present.

---

### Task 5: Null safety and fallback hardening (AC-M8, AC-M9, AC-M13, AC-L10) ~1.5h

**Files:**
- `backend/src/badge-issuance/badge-issuance.service.ts` — revoker fallback
- `frontend/src/hooks/useWallet.ts` — nullable types
- `frontend/src/components/TimelineView/BadgeTimelineCard.tsx` — image fallback
- `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` — skill fallback

**What to do:**

1. **Revoker fallback** (`badge-issuance.service.ts` L883-899 area):
   When building revocation info and `badge.revoker` is null (deleted admin), provide:
   ```typescript
   revokedBy: badge.revoker
     ? { name: badge.revoker.name, email: badge.revoker.email, role: badge.revoker.role }
     : { name: 'Unknown User', email: '', role: 'N/A' }
   ```

2. **Nullable types** (`useWallet.ts`):
   - Change `imageUrl: string` → `imageUrl: string | null`
   - Change `description: string` → `description: string | null`

3. **Image fallback** (`BadgeTimelineCard.tsx` L101-104 area):
   ```tsx
   {badge.imageUrl ? (
     <img src={badge.imageUrl} alt={badge.name} ... />
   ) : (
     <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
       <Award className="w-6 h-6 text-primary" />
     </div>
   )}
   ```

4. **Skill fallback** (`BadgeDetailModal.tsx` L40 area):
   Change `skillNamesMap[id] || id` to `skillNamesMap[id] || 'Unknown Skill'`

5. **Write tests** for each fallback scenario
6. Run full test suite

**AC:** No crashes for null revoker, null images, or deleted skills.

---

### Task 6: Dead code cleanup (AC-M7, AC-L11) ~30min

**Files:**
- `frontend/src/types/badge.ts` — `issuerMessage` field
- `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` — `IssuerMessage` rendering
- `frontend/src/pages/dashboard/EmployeeDashboard.tsx` — `recentAchievements` section

**What to do:**

1. **`issuerMessage`:** Check if backend Badge model has `issuerMessage` field (it doesn't). Remove:
   - The `issuerMessage?: string` field from `frontend/src/types/badge.ts`
   - The conditional `{badge.issuerMessage && <IssuerMessage ... />}` in `BadgeDetailModal.tsx`
   - Keep the `IssuerMessage` component itself (may be used later)

2. **`recentAchievements`:** In `EmployeeDashboard.tsx` L340-366, the "Recent Achievements Unlocked" section renders data that the backend doesn't return. Either:
   - Remove the section entirely, OR
   - Replace with a `{/* TODO: Implement when backend provides recentAchievements */}` comment and hide the UI

3. Run FE tests to confirm nothing breaks

**AC:** No dead code rendering undefined data.

---

### Task 7: Display polish (AC-L12, AC-L14) ~30min

**Files:**
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx`
- `frontend/src/components/TimelineView/BadgeTimelineCard.tsx`

**What to do:**

1. **TemplateSelector** (L137, L169): Where full UUIDs are shown to user, truncate:
   ```tsx
   // Instead of showing full UUID
   {template.id}
   // Show truncated
   {template.id.slice(0, 8)}...
   ```
   Or better: show template name with ID as tooltip.

2. **Category title case** (`BadgeTimelineCard.tsx`): Where category is displayed:
   ```tsx
   {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
   ```

3. Run FE tests

**AC:** Clean, human-readable display values.

---

## Post-Implementation Checklist

After ALL 7 tasks are complete:

1. **TypeScript check:** `cd gcredit-project/backend; npx tsc --noEmit` — 0 errors
2. **Backend tests:** `cd gcredit-project/backend; npx jest --forceExit` — all pass
3. **Frontend tests:** `cd gcredit-project/frontend; npx vitest run` — all pass
4. **ESLint BE:** `cd gcredit-project/backend; npx eslint src/` — clean
5. **ESLint FE:** `cd gcredit-project/frontend; npx eslint src/` — clean
6. **Commit:** Single commit with message:
   ```
   feat(Story-11.24): Data Contract Alignment — fix 14 API-to-UI issues

   Critical:
   - C-1: formatActivityDescription() for admin dashboard
   - C-2: BadgeInfo multi-format criteria support
   - C-3: Wallet badge/milestone type discrimination

   Medium:
   - M-4/5: Verification page expiresAt + claimedAt fields
   - M-7: Remove issuerMessage dead code
   - M-8: Revoker null fallback
   - M-9: Image null fallback with placeholder
   - M-13: Skill ID fallback to 'Unknown Skill'

   Low:
   - L-6: Verification page badge ID fix
   - L-10: Wallet nullable types
   - L-11: Remove recentAchievements dead code
   - L-12: Template UUID truncation
   - L-14: Category title case
   ```
7. **Mark story as complete** in the story file: `Status: done`

---

## Key File References

| File | Purpose |
|------|---------|
| `project-context.md` | 📖 Single Source of Truth — read first |
| `gcredit-project/docs/sprints/sprint-11/11-24-data-contract-alignment.md` | Story file with full issue details |
| `gcredit-project/docs/sprints/sprint-11/technical-debt.md` | TD-016, TD-017 (superseded by this story) |
| `gcredit-project/backend/src/dashboard/dashboard.service.ts` | Task 1 target |
| `gcredit-project/frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` | Task 2 target |
| `gcredit-project/backend/src/badge-issuance/badge-issuance.service.ts` | Task 3 + 5 target |
| `gcredit-project/frontend/src/hooks/useWallet.ts` | Task 3 + 5 target |
| `gcredit-project/backend/src/badge-verification/badge-verification.controller.ts` | Task 4 target |
| `gcredit-project/frontend/src/pages/VerifyBadgePage.tsx` | Task 4 target |

## Important Constraints

- **DO NOT** modify auth/cookie logic (that's Story 11.25, separate scope)
- **DO NOT** change Prisma schema — all fixes are at service/controller/component level
- **DO NOT** break existing 1263 tests
- **DO** use `apiFetch` for any new API calls (never raw `fetch` or `axios`)
- **DO** follow existing code patterns: Prisma service → Controller DTO → Frontend hook → Component
