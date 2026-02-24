# Code Review Prompt — Story 12.2: Skill Management UI

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-2-skill-management-ui.md`
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-2-dev-prompt.md`
**Branch:** `sprint-12/management-uis-evidence`
**Commit:** `d1e7959` — `feat(12.2): Skill Management UI + category colors + useSkills bug fix`
**Base:** `8af801c` (12.2 dev prompt commit)

### Story Summary

Full Skill Management page at `/admin/skills` with split layout (category tree left + skills table right), inline add, edit dialog, delete guard. New category color system: `color` field on `SkillCategory` (Prisma migration), 10-color Tailwind palette, auto-assign on creation. Critical bug fix in `useSkills`: `category` → `categoryName` field mapping. Category colors propagated to `BadgeTemplateFormPage`, `BadgeInfo`, `BadgeDetailModal`, and `VerifyBadgePage`.

---

## Scope of Changes

**28 files changed** (including migration directory)

### New Backend Files (1 file)
| File | Lines | Purpose |
|------|-------|---------|
| `backend/prisma/migrations/20260219123907_add_skill_category_color/migration.sql` | 3 | `ALTER TABLE "skill_categories" ADD COLUMN "color" VARCHAR(20)` |

### Modified Backend Files (6 files)
| File | Change | LOC |
|------|--------|-----|
| `backend/prisma/schema.prisma` | Added `color String? @db.VarChar(20)` to `SkillCategory` | +1 |
| `backend/src/skill-categories/dto/skill-category.dto.ts` | `color` field added to Create/Update/Response DTOs with `@IsOptional() @IsString() @MaxLength(20)` | ~15 |
| `backend/src/skill-categories/skill-categories.service.ts` | `CATEGORY_COLORS` static array (10 colors), auto-assign via `existingCount % length` in `create()` | ~10 |
| `backend/src/skill-categories/skill-categories.service.spec.ts` | Added `count: jest.fn().mockResolvedValue(0)` mock for auto-assign test coverage | ~5 |
| `backend/src/badge-verification/badge-verification.service.ts` | Include `category: { select: { color: true } }` in skill resolution, return `categoryColor` | ~10 |
| `backend/src/badge-verification/badge-verification.service.spec.ts` | Updated mock skill data with `category: { color: null }`, assertions check `categoryColor` | ~10 |

### New Frontend Files (7 files, ~1,166 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/lib/categoryColors.ts` | 54 | `CATEGORY_COLORS`, `COLOR_MAP`, `getCategoryColorClasses()` |
| `frontend/src/lib/categoryColors.test.ts` | 44 | 6 tests: all colors, null, undefined, unknown, count, map |
| `frontend/src/hooks/useSkillMutations.ts` | 72 | `useCreateSkill`, `useUpdateSkill`, `useDeleteSkill` hooks |
| `frontend/src/hooks/useSkillMutations.test.tsx` | 109 | 6 tests: POST/PATCH/DELETE + error handling |
| `frontend/src/hooks/useSkills.test.tsx` | 91 | 3 tests: `categoryName` bug fix, `categoryColor`, new fields |
| `frontend/src/pages/admin/SkillManagementPage.tsx` | 595 | Full split-layout page: CategoryTree + skills table + inline add + edit dialog + delete guard |
| `frontend/src/pages/admin/SkillManagementPage.test.tsx` | 207 | 10-11 tests: render, tree, color chips, search, add, edit, delete, empty state |

### Modified Frontend Files (11 files)
| File | Change | LOC |
|------|--------|-----|
| `frontend/src/hooks/useSkills.ts` | **BUG FIX:** `category` → `categoryName`; added `categoryColor`, `categoryId`, `description`, `level` to return mapping | ~20 |
| `frontend/src/components/search/SkillsFilter.tsx` | `Skill` interface extended with `categoryColor?`, `categoryId?`, `description?`, `level?` | +4 |
| `frontend/src/pages/admin/BadgeTemplateFormPage.tsx` | Replaced flat skill pill list with `<SkillsFilter>` dropdown | ~-20/+5 |
| `frontend/src/pages/admin/BadgeTemplateFormPage.test.tsx` | Updated 4+ tests for SkillsFilter combobox pattern instead of pill list | ~60 |
| `frontend/src/components/BadgeDetailModal/BadgeInfo.tsx` | `skills` prop: `string[]` → `(string \| { name, categoryColor? })[]`; colored pills | ~20 |
| `frontend/src/components/BadgeDetailModal/BadgeInfo.test.tsx` | 2 new tests: object-form skills with colors, string fallback | ~20 |
| `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` | Pass `{ name, categoryColor }` objects to `BadgeInfo` via `resolvedSkills` | ~15 |
| `frontend/src/pages/VerifyBadgePage.tsx` | Import `getCategoryColorClasses`, render skill pills with category colors | ~10 |
| `frontend/src/App.tsx` | Lazy import + route `/admin/skills` (ADMIN only) | +10 |
| `frontend/src/components/Navbar.tsx` | "Skills" nav link for ADMIN role | +15 |
| `frontend/src/components/layout/MobileNav.tsx` | "Skills" entry in `navLinks` array (ADMIN role) | +1 |

### Documentation Files (2 files)
| File | Change |
|------|--------|
| `docs/sprints/sprint-12/12-2-skill-management-ui.md` | Status → done, Dev Agent Record, File List, Completion Notes |
| `docs/sprints/sprint-status.yaml` | `12-2-skill-management-ui: done` |

---

## Review Checklist

### 1. Architecture & Patterns Compliance

- [ ] **apiFetch usage:** All API calls use `apiFetch` / `apiFetchJson`? No raw `fetch` or `axios`?
- [ ] **React Query patterns:** `queryKey` naming consistent? `staleTime` reasonable? Mutation `onSuccess` invalidates correct caches?
- [ ] **Lazy loading:** `SkillManagementPage` uses `lazy()` + `export default`?
- [ ] **ProtectedRoute:** Route correctly uses `requiredRoles={['ADMIN']}`?
- [ ] **AdminPageShell:** Reuses shared shell from Story 12.1 correctly?
- [ ] **Toast pattern:** Uses `sonner` — `toast.success()` / `toast.error()`?
- [ ] **Shared components:** Reuses `CategoryTree`, `ConfirmDialog`, `AdminPageShell` from Story 12.1?
- [ ] **Content-Type header:** Dev prompt specified `headers: { 'Content-Type': 'application/json' }` in mutation hooks. Implementation uses `apiFetchJson` without explicit header — does `apiFetchJson` set this internally? Verify no 415 risk.

### 2. Backend Changes Review

#### Prisma Migration (migration.sql)
- [ ] Migration is a simple `ALTER TABLE ADD COLUMN` — safe, nullable, no data loss
- [ ] `VARCHAR(20)` sufficient for Tailwind color names (longest: "emerald" = 7 chars)? Adequate margin.

#### SkillCategory DTOs (skill-category.dto.ts)
- [ ] `color` in `CreateSkillCategoryDto`: `@IsOptional() @IsString() @MaxLength(20)` — correct validators
- [ ] `color` in `UpdateSkillCategoryDto`: same decorators — correct
- [ ] `color` in `SkillCategoryResponseDto`: typed as `string | null` — correct for nullable DB column
- [ ] Swagger `@ApiPropertyOptional` with description and example

#### SkillCategories Service (skill-categories.service.ts)
- [ ] `CATEGORY_COLORS` static array matches frontend `CATEGORY_COLORS` (same 10 colors, same order)?
- [ ] Auto-assign in `create()`: `existingCount % CATEGORY_COLORS.length` — this means colors cycle. Is this acceptable? If a category is deleted, the count changes and new categories may get unexpected colors. **Acceptable for MVP?**
- [ ] Auto-assign only when `!data.color` — correct, respects explicit color input
- [ ] `count()` call has no `where` clause — counts ALL categories (including deleted? No, Prisma soft-delete not used). Verify this is intentional.

#### SkillCategories Service Spec (skill-categories.service.spec.ts)
- [ ] `count` mock added: `count: jest.fn().mockResolvedValue(0)` — returns 0 for new category creation
- [ ] Verify existing tests still pass with added mock
- [ ] Are there tests for auto-assign color? (Check if color is verified in create test assertions)

#### Badge Verification Service (badge-verification.service.ts)
- [ ] Skill resolution query includes `category: { select: { color: true } }` — correct nested select
- [ ] Response maps `categoryColor: s.category?.color ?? null` — null fallback correct
- [ ] No breaking change to public verification API schema (additive only — `categoryColor` field added to skill objects)

#### Badge Verification Service Spec (badge-verification.service.spec.ts)
- [ ] Mock skill data updated with `category: { color: null }` — correct null handling
- [ ] Assertions check `categoryColor: null` in expectations — verified

### 3. Frontend — New Components Review

#### categoryColors.ts (54 lines)
- [ ] `CATEGORY_COLORS` array: 10 colors — matches backend `CATEGORY_COLORS` exactly?
- [ ] `COLOR_MAP`: All 10 entries with `{ bg, text, border }` — all use pattern `bg-{color}-100`, `text-{color}-800`, `border-{color}-300`
- [ ] `DEFAULT_COLOR`: `'slate'` — reasonable fallback
- [ ] `getCategoryColorClasses()`: Handles null/undefined/unknown string → fallback to slate
- [ ] Type safety: `color as CategoryColor` cast + fallback via `?? DEFAULT_COLOR` + nullish coalescing on `COLOR_MAP` lookup
- [ ] **Tailwind class generation:** All classes are statically defined (not dynamically constructed), so Tailwind scanner will detect them correctly. No JIT safelist needed. ✓

#### categoryColors.test.ts (44 lines)
- [ ] 6 tests cover: all colors, null, undefined, unknown string, count, map coverage
- [ ] Missing edge case tests? Empty string `''` as color?

#### useSkillMutations.ts (72 lines)
- [ ] Three hooks: `useCreateSkill`, `useUpdateSkill`, `useDeleteSkill`
- [ ] All use `apiFetchJson` — correct for JSON APIs
- [ ] Create: POST `/skills` → invalidates `['skills']` + `['skill-categories']` ✓
- [ ] Update: PATCH `/skills/${id}` → invalidates `['skills']` only (not categories — skill update doesn't change category counts). Correct?
- [ ] Delete: DELETE `/skills/${id}` → invalidates `['skills']` + `['skill-categories']` ✓
- [ ] Error handling: `toast.error(err.message || fallback)` — correct
- [ ] **Missing per dev prompt:** `headers: { 'Content-Type': 'application/json' }` not set explicitly. Does `apiFetchJson` set this automatically? **Critical to verify** — without `Content-Type: application/json`, NestJS may reject POST/PATCH with 415 Unsupported Media Type.
- [ ] `UpdateSkillInput` does not include `categoryId` — edit dialog doesn't allow changing category. Is this by design? Dev prompt Task 6 edit dialog mentions category field but SkillManagementPage edit dialog only has name/description/level.

#### useSkillMutations.test.tsx (109 lines)
- [ ] 6 tests: create/update/delete + error handling for each
- [ ] Verifies correct URL, method, and payload
- [ ] No test for query invalidation (acceptable — this is a unit test)

#### SkillManagementPage.tsx (595 lines — LARGEST new file)
- [ ] **Page size concern:** 595 lines is large. Dev prompt suggested extracting `<SkillsTable>` if >350 lines. **Should reviewer flag this for refactoring?**
- [ ] **Split layout:** Desktop `lg:flex-row` with `w-72` sidebar + `flex-1` content area
- [ ] **Responsive mobile:** `lg:hidden` dropdown for categories, `hidden lg:block` for tree sidebar
- [ ] **CategoryTree integration:** `editable={false}`, `selectedId`, `onSelect` — correct read-only mode
- [ ] **"All Categories" button:** Above tree, clears `selectedCategoryId` — correct
- [ ] **Search:** Debounced 300ms via `useState` + `setTimeout` — standard pattern
- [ ] **Pagination:** Client-side, `PAGE_SIZE = 10`, shows prev/next + page info — correct
- [ ] **Page reset:** `setCurrentPage(1)` on category/search change — correct

**Inline Add:**
- [ ] Row appears at top of table with `bg-blue-50/50` — visually distinct
- [ ] Name input auto-focus via `useRef` + `useEffect` — correct
- [ ] **Keyboard handling:** Enter → submit, Escape → cancel. **Dev prompt specified "Tab-to-submit"** but implementation uses Enter. Is Tab-to-submit also implemented? If not, this is a **deviation from AC #4 Task 4** ("Tab from last field → submit"). **Verify.**
- [ ] Validation: name required, max 100 chars, category required — correct
- [ ] `createSkill.mutate()` with `onSuccess: () => handleCancelAdd()` — correct: clears inline form on success
- [ ] "+ Add Skill" button disabled when no category selected OR already adding — correct UX

**Edit Dialog:**
- [ ] Uses `<Dialog>` from shadcn/ui — correct
- [ ] Pre-populates name, description, level from `editingSkill` — correct
- [ ] Validation: name required, max 100 chars — correct
- [ ] **No category change in edit:** Edit dialog has name/description/level but NOT category. Dev prompt Task 6 says edit dialog should have "category (select from flat categories)" field. **Deviation — reviewer should verify if this is acceptable.** Moving skills between categories may not be needed for MVP.
- [ ] `updateSkill.mutate()` with `onSuccess: () => setEditingSkill(null)` — closes dialog on success

**Delete Guard:**
- [ ] Uses `<ConfirmDialog variant="danger">` — correct, reuses Story 12.1 component
- [ ] On confirm → `deleteSkill.mutate(id)` with both `onSuccess` and `onError` closing the dialog
- [ ] Backend 400 error ("referenced by N template(s)") displayed via `toast.error(err.message)` in useDeleteSkill hook — correct
- [ ] **Note:** Dev prompt specified showing template list in the block message, but implementation relies on the backend error message being displayed as a toast. This is a simpler approach — **verify it provides sufficient information to the admin.**

**Data Table:**
- [ ] Columns: Name, Description (hidden on mobile), Category (colored chip), Level (hidden on small), Actions (hover-reveal)
- [ ] **AC #2 specifies "Badge Count" column** — the table does NOT have a Badge Count column. Only Name, Description, Category, Level, Actions. **This is a potential AC gap.** The dev agent noted "Removed badge count column" but AC #2 explicitly requires it. **Reviewer should flag.**
- [ ] Colored category chips use `getCategoryColorClasses(skill.categoryColor)` — correct
- [ ] Hover-reveal actions: `opacity-0 group-hover:opacity-100` — works on desktop but **not touch devices** (hover not available). Touch users cannot see action buttons. **Accessibility concern** — same pattern used in Story 12.1's CategoryTree.
- [ ] `table-fixed` with `colgroup` widths — good for consistent column sizing
- [ ] Empty state handles 3 scenarios: search no match, category empty, no skills at all — good UX

#### SkillManagementPage.test.tsx (207 lines)
- [ ] 10-11 tests covering: render, tree sidebar, skill count, color chips, search, add button disabled, edit dialog, delete dialog, confirm delete, empty state, loading
- [ ] Uses proper mocks for `useSkillCategoryTree`, `useSkillCategoryFlat`, `useSkills`, `useSkillMutations`
- [ ] Test for inline add submit? (Check if Enter key triggers create)
- [ ] Test for pagination? (Not tested — acceptable for MVP?)

### 4. Frontend — Modified Files Review

#### useSkills.ts (96 lines — BUG FIX)
- [ ] **P0 Bug Fix verified:** `category: skill.category?.name` → `categoryName: skill.category?.name` ✓
- [ ] New fields: `categoryColor: skill.category?.color`, `categoryId: skill.category?.id`, `description: skill.description`, `level: skill.level` ✓
- [ ] `SkillApiResponse` interface extended with `level?` and `category.color?` ✓
- [ ] `staleTime: 5 * 60 * 1000` (5 min) — reasonable for admin page ✓
- [ ] **Impact analysis:** This fix affects ALL existing consumers of `useSkills`. The bug means `SkillsFilter groupByCategory` was broken since inception. Now it works. Are there any consumers that relied on the broken field name `category`? Check `SkillsFilter.tsx` → uses `skill.categoryName` → was always expecting the correct field, so fix is safe.

#### useSkills.test.tsx (91 lines — NEW)
- [ ] 3 tests: bug fix verification, categoryColor, new fields — coverage is good
- [ ] Explicitly checks `(skills[0] as Record<string, unknown>).category` is `undefined` — ensures old broken field doesn't exist ✓

#### SkillsFilter.tsx (321 lines — INTERFACE EXTENSION)
- [ ] `Skill` interface extended with 4 optional fields — all `?` optional, backward compatible ✓
- [ ] `groupByCategory` still uses `skill.categoryName || 'Other'` — correct, field name now matches data ✓
- [ ] No functional changes to the component itself — pure interface extension ✓

#### BadgeInfo.tsx (87 lines — COLOR PROPAGATION)
- [ ] `SkillItem` type: `string | { name: string; categoryColor?: string | null }` — backward compatible ✓
- [ ] Rendering: `typeof skill === 'object'` check → color vs fallback `bg-blue-600 text-white` ✓
- [ ] `getCategoryColorClasses` import — correct ✓

#### BadgeInfo.test.tsx (99 lines — 2 NEW TESTS)
- [ ] Tests object-form skills with `categoryColor: 'emerald'` and `'blue'` — checks for correct Tailwind classes ✓
- [ ] Tests string skills with fallback blue styling ✓
- [ ] Good coverage of the backward compatibility

#### BadgeDetailModal.tsx (540 lines — COLOR PROPAGATION)
- [ ] `resolvedSkills` computed from `allSkills.find()` to get `{ name, categoryColor }` ✓
- [ ] Fallback: `skillNamesMap[id] || 'Unknown Skill'` with `categoryColor: null` ✓
- [ ] `useSkills()` imported and called alongside existing `useSkillNamesMap` — **performance concern:** This adds a second `useSkills()` call. The existing `useSkillNamesMap()` already calls `useSkills()` internally. So there are potentially TWO `useSkills` queries active. React Query deduplicates identical queries, and both use `queryKey: ['skills', {}]` with matching params, so this should be fine. **Verify deduplication.**
- [ ] `<BadgeInfo skills={resolvedSkills} ... />` — correctly passes objects instead of strings ✓

#### VerifyBadgePage.tsx (400 lines — COLOR PROPAGATION)
- [ ] `import { getCategoryColorClasses }` — correct ✓
- [ ] Skills rendered with `getCategoryColorClasses(skill.categoryColor)` → `${color.bg} ${color.text}` ✓
- [ ] Skill type annotation: `{ id: string; name: string; categoryColor?: string }` — matches backend response ✓
- [ ] Note: This is a PUBLIC page (no auth required). Skill colors come from the verification API, not from `useSkills` hook. ✓

#### BadgeTemplateFormPage.tsx (573 lines — SKILLSFILTER INTEGRATION)
- [ ] Replaced flat pill list with `<SkillsFilter>` component ✓
- [ ] Props: `skills={availableSkills}`, `selectedSkills`, `onChange={setSelectedSkills}`, `groupByCategory={true}`, `searchable={true}`, `showClearButton={true}`, `disabled={isReadOnly}` ✓
- [ ] Skills sourced from `useSkills()` hook — correct ✓

#### BadgeTemplateFormPage.test.tsx (520 lines — UPDATED)
- [ ] Tests updated for SkillsFilter combobox pattern (role="combobox") instead of old pill list ✓
- [ ] `useSkills` mock returns `[{ id: 'skill-1', name: 'Cloud Computing' }, ...]` — no `categoryName`/`categoryColor` in mock. **Is this sufficient?** The mock is minimal but the component only needs `id` and `name` for selection. Category fields used for grouping but test still works. ✓
- [ ] Skill selection toggle test: open dropdown → click option → verify count → click again → verify deselect ✓
- [ ] Read-only mode tests: inputs disabled ✓

#### App.tsx (200 lines — ROUTE)
- [ ] `const SkillManagementPage = lazy(() => import('@/pages/admin/SkillManagementPage'));` ✓
- [ ] Route: `<ProtectedRoute requiredRoles={['ADMIN']}>` → `<Layout pageTitle="Skill Management">` ✓
- [ ] Route path: `/admin/skills` ✓
- [ ] Placement: After `/admin/skills/categories` route — correct (more specific path first) ✓

#### Navbar.tsx (288 lines — NAV LINK)
- [ ] "Skills" link added inside `user?.role === 'ADMIN'` block ✓
- [ ] `to="/admin/skills"` with `isActive('/admin/skills')` ✓
- [ ] Positioned after "Skill Categories" link — logical ordering ✓
- [ ] Consistent styling with other links: `px-4 py-3 text-sm font-medium min-h-[44px]` ✓

#### MobileNav.tsx (314 lines — NAV LINK)
- [ ] `{ to: '/admin/skills', label: 'Skills', roles: ['ADMIN'] }` added to `navLinks` array ✓
- [ ] Positioned after Skill Categories entry ✓
- [ ] Role restriction correct: ADMIN only ✓

### 5. Security Review

- [ ] **Route protection:** `ProtectedRoute requiredRoles={['ADMIN']}` — matches Story AC (Admin only) ✓
- [ ] **Backend role alignment:** Skill controller uses `@Roles(UserRole.ADMIN, UserRole.ISSUER)` for write ops. Story AC says "Admin" but dev prompt clarifies this is intentional — ISSUER can also manage skills. **Is this acceptable?**
- [ ] **Input validation:**
  - Frontend: `maxLength={100}` HTML attribute + trim validation in submit handlers ✓
  - Backend: `@IsString() @MaxLength(100)` + `@SanitizeHtml()` ✓
  - Backend: `@IsString() @MaxLength(20)` for `color` field ✓
- [ ] **Color field injection:** Could a malicious `color` value cause XSS through Tailwind class names? `getCategoryColorClasses` only returns predefined classes from `COLOR_MAP`, falling back to slate for unknown values. Not vulnerable. ✓
- [ ] **Verification API:** Public endpoint now returns `categoryColor` — this is not sensitive data. ✓

### 6. Performance Considerations

- [ ] **SkillManagementPage size:** 595 lines — functional but large. Dev prompt suggested extraction if >350 lines. Consider extracting `SkillsTable` component in future sprint.
- [ ] **Client-side pagination:** All skills fetched at once, paginated client-side. Acceptable for MVP with ~100 skills. May need server-side pagination at scale.
- [ ] **Debounced search:** 300ms timeout — standard, good UX.
- [ ] **React Query deduplication:** `BadgeDetailModal` has two `useSkills()` calls (direct + via `useSkillNamesMap`). React Query deduplicates automatically since same `queryKey`. ✓
- [ ] **No unnecessary re-renders:** `useCallback` for `handleCategorySelect`. Debounced search uses two-state pattern. ✓
- [ ] **`staleTime: 5min`** for skills — appropriate for admin data that changes infrequently.
- [ ] **Color auto-assign:** `prisma.skillCategory.count()` on every create — simple query, acceptable overhead.

### 7. UX/UI Review

- [ ] **Split layout:** Clean desktop split (72px sidebar + flex content). Responsive collapse to dropdown at `<1024px`. ✓
- [ ] **Empty states:** 3-scenario empty state messages (search, category, global) — good UX ✓
- [ ] **Search UX:** Clear button (X icon) when search has value ✓
- [ ] **Inline add:** visually distinct row (`bg-blue-50/50`), auto-focus name input, Save/Cancel buttons ✓
- [ ] **Edit dialog:** Clean dialog with DialogHeader, description, labeled fields ✓
- [ ] **Delete confirmation:** Danger variant, clear title with skill name ✓
- [ ] **Colored chips:** Category name displayed inside colored pill using category's assigned color ✓
- [ ] **Hover-reveal actions:** Smooth opacity transition. **Touch accessibility concern:** Actions invisible without hover. Mobile users can still access via long-press but this is not discoverable.
- [ ] **Loading/error states:** `AdminPageShell` handles loading spinner, error with retry, empty state ✓
- [ ] **Mobile category dropdown:** Uses `Select` with flat categories, indented by level (`'—'.repeat(level - 1)`) ✓

---

## Key Files for Review

| Priority | File | Lines | Focus |
|----------|------|-------|-------|
| 🔴 HIGH | `SkillManagementPage.tsx` | 595 | Page size (595 > 350 limit), inline add keyboard behavior (Tab vs Enter), missing Badge Count column, hover-reveal touch accessibility |
| 🔴 HIGH | `useSkills.ts` | 96 | P0 bug fix verification, field mapping correctness, backward compatibility |
| 🔴 HIGH | `useSkillMutations.ts` | 72 | Missing Content-Type header, category change excluded from edit |
| 🟡 MED | `skill-categories.service.ts` | 236 | Auto-assign color logic, count-based cycling |
| 🟡 MED | `BadgeDetailModal.tsx` | 540 | Dual useSkills call deduplication, resolvedSkills mapping |
| 🟡 MED | `categoryColors.ts` | 54 | Backend/frontend color palette consistency |
| 🟡 MED | `BadgeInfo.tsx` | 87 | Backward compat union type, color rendering |
| 🟡 MED | `badge-verification.service.ts` | 241 | Nested select for category.color, public API schema |
| 🟢 LOW | `VerifyBadgePage.tsx` | 400 | Simple color class application |
| 🟢 LOW | `BadgeTemplateFormPage.tsx` | 573 | SkillsFilter integration (straightforward swap) |
| 🟢 LOW | `App.tsx` / `Navbar.tsx` / `MobileNav.tsx` | ~40 | Route + nav additions |
| 🟢 LOW | All test files | ~750 | Test coverage and assertion quality |

---

## Potential Issues Identified Pre-Review

### 🟡 P1 — Missing Badge Count Column (AC #2 Deviation)

**Files:** `SkillManagementPage.tsx`
**Issue:** AC #2 specifies table columns should include "Badge Count" (number of badge templates referencing each skill). The implemented table only has: Name, Description, Category, Level, Actions. No Badge Count column.
**Impact:** Admins cannot see which skills are heavily used before deciding to edit/delete. The delete guard still works (backend blocks deletion), but the count is not visible proactively.
**Risk:** Medium — functional AC gap but delete guard provides safety net.
**Recommendation:** Reviewer should decide: accept as-is for MVP or require Badge Count column. Adding it requires either backend API enhancement (return `_count` in skill response) or frontend computation (match `skillIds` from templates).

### 🟡 P1 — Tab-to-Submit Not Implemented (AC Task 4 Deviation)

**File:** `SkillManagementPage.tsx` — `handleInlineKeyDown()`
**Issue:** Dev prompt Task 4 specified "Tab from last field → submit". Implementation uses Enter to submit and Escape to cancel, but Tab is not handled for submission. Standard browser Tab behavior will move focus to the next focusable element (Save button).
**Impact:** Low — Enter-to-submit is the more common UX pattern. Tab to Save button then Enter is a 2-step alternative.
**Recommendation:** Clarify if this is acceptable or if Tab-to-submit needs explicit implementation.

### 🟡 P1 — Content-Type Header in Mutation Hooks

**File:** `useSkillMutations.ts`
**Issue:** Dev prompt specified `headers: { 'Content-Type': 'application/json' }` in mutation calls. Implementation uses `apiFetchJson` without explicit Content-Type header. Need to verify that `apiFetchJson` sets this header automatically.
**Risk:** If `apiFetchJson` does NOT set Content-Type, POST/PATCH requests will fail with 415 Unsupported Media Type from NestJS.
**Action:** Check `apiFetch.ts` implementation during review to verify header handling.

### 🟡 P1 — Edit Dialog Missing Category Field

**File:** `SkillManagementPage.tsx` — edit dialog section
**Issue:** Dev prompt Task 6 edit dialog specification includes "category (select from flat categories)" field. The implementation only has name, description, and level — no category change.
**Impact:** Admins cannot move a skill to a different category through the edit dialog. They would need to delete and re-create the skill.
**Risk:** Low for MVP — category reassignment is rarely needed.
**Recommendation:** Accept for MVP, create deferred item if needed.

### 🟢 P2 — SkillManagementPage Size Exceeds Guideline

**File:** `SkillManagementPage.tsx` — 595 lines
**Issue:** Dev prompt stated "This page will be ~250–350 lines. If it gets larger, extract the data table into `<SkillsTable>` component." The actual implementation is 595 lines — 70% over the upper bound.
**Risk:** Low — the code is well-structured with clear sections ('Category tree state', 'Search', 'Inline add', 'Edit dialog', 'Delete guard'). But maintainability may become an issue if more features are added.
**Recommendation:** Document as tech debt for future refactoring. Not a blocker.

### 🟢 P2 — Hover-Reveal Actions Not Accessible on Touch Devices

**File:** `SkillManagementPage.tsx` — skill table row actions
**Issue:** Action buttons (Edit, Delete) use `opacity-0 group-hover:opacity-100` — invisible without hover. Touch device users cannot discover these actions.
**Risk:** Low — this is an admin page primarily used on desktop. Same pattern exists in Story 12.1 CategoryTree.
**Mitigation:** Actions are still clickable if the user taps the correct area. But discoverability is poor.
**Recommendation:** Future enhancement — always show actions on mobile breakpoints.

### 🟢 P2 — Color Auto-Assign Uses Global Count

**File:** `skill-categories.service.ts` — `create()` method
**Issue:** Color auto-assign uses `prisma.skillCategory.count()` (total category count) modulo 10. If categories are deleted and new ones created, colors may not distribute evenly. Two consecutive categories could get the same color if deletions happened in between.
**Risk:** Very low — cosmetic only. Admin can manually set color.
**Recommendation:** Accept for MVP.

---

## Acceptance Criteria Verification Matrix

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | Admin can view all skills in a searchable, filterable data table | ✅ | `SkillManagementPage.tsx` — search input + skills table |
| 2 | Table columns: Name, Description, Category, Level, **Badge Count**, Actions | ⚠️ | Badge Count column **missing** — table has Name, Description, Category, Level, Actions |
| 3 | Admin can filter by category (from tree sidebar or dropdown) | ✅ | CategoryTree (desktop) + Select dropdown (mobile) |
| 4 | Admin can search skills by name | ✅ | Debounced search (300ms) |
| 5 | Admin can create a new skill with: name, description, category, level | ✅ | Inline add row with all fields |
| 6 | Admin can edit an existing skill | ✅ | Edit dialog (name, description, level — no category change) |
| 7 | Admin can delete a skill not referenced by any badge template | ✅ | ConfirmDialog + useDeleteSkill |
| 8 | Delete blocked with message showing which templates reference the skill | ✅ | Backend 400 error → toast.error with message |
| 9 | Colored skill tags match category colors | ✅ | `getCategoryColorClasses` in table + badge pages |
| 10 | Route: `/admin/skills` — combined page | ✅ | App.tsx route + Navbar/MobileNav links |
| 11 | Badge Template form skill picker groups by category | ✅ | `SkillsFilter groupByCategory={true}` in BadgeTemplateFormPage |
| 12 | Badge detail modal and verification page show colored skill tags | ✅ | BadgeInfo + VerifyBadgePage use getCategoryColorClasses |

**Summary:** 11/12 ACs fully met. AC #2 partially met (Badge Count column missing).

---

## Review Execution Guide

1. **Read Story file** — confirm AC understanding
2. **Start with HIGH priority files:**
   - `SkillManagementPage.tsx` — verify inline add Enter/Tab behavior, check for Badge Count column, assess 595-line size
   - `useSkills.ts` — confirm P0 bug fix is correct
   - `useSkillMutations.ts` — verify `apiFetchJson` handles Content-Type internally
3. **Verify `apiFetchJson` implementation** in `frontend/src/lib/apiFetch.ts` — confirm it sets `Content-Type: application/json` header automatically
4. **Check backend/frontend color palette consistency** — both should have same 10 colors in same order
5. **Run tests:**
   ```bash
   cd gcredit-project/frontend && npx vitest run
   cd gcredit-project/backend && npx jest --forceExit
   cd gcredit-project/frontend && npx tsc --noEmit
   cd gcredit-project/backend && npx tsc --noEmit
   ```
6. **Manual E2E verification (if conditions allow):**
   - Login as Admin → navigate to `/admin/skills`
   - Select a category from tree → verify table filters
   - Search for a skill by name → verify debounced search
   - Click "+ Add Skill" → fill inline row → press Enter → verify creation
   - Click Edit icon → modify skill → Save → verify update
   - Click Delete icon → confirm deletion → verify removal
   - Try deleting a skill referenced by a template → verify 400 error toast
   - Navigate to Badge Template form → verify skills grouped by category with colors
   - Open Badge Detail modal → verify colored skill pills
   - Visit `/verify/:id` → verify colored skill tags on public page
