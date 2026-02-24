# Story 12.2: Skill Management UI

Status: done

## Story

As an **Admin**,
I want to manage individual skills within categories (create, edit, delete, search, filter),
So that I can maintain a comprehensive and accurate skill taxonomy for badge templates.

## Context

- Backend API exists: `GET/POST/PATCH/DELETE /api/skills`
- Prisma model: `Skill { id, name, description, categoryId, level?, category }`
- Skills are referenced by `BadgeTemplate.skillIds` (string array)
- Currently skills can only be managed via Swagger
- Depends on Story 12.1 (category tree provides the category context)

## Acceptance Criteria

1. [x] Admin can view all skills in a searchable, filterable data table
2. [x] Table columns: Skill Name, Description, Category, Level, Badge Count, Actions
3. [x] Admin can filter by category (from tree sidebar or dropdown)
4. [x] Admin can search skills by name
5. [x] Admin can create a new skill with: name, description, category, level (optional)
6. [x] Admin can edit an existing skill
7. [x] Admin can delete a skill not referenced by any badge template
8. [x] Delete blocked with message showing which templates reference the skill
9. [x] Colored skill tags match category colors (tech=blue, leadership=gold, etc.)
10. [x] Route: `/admin/skills` — combined page with category tree (left) + skills table (right)
11. [x] Badge Template form skill picker groups skills by category (with category headers)
12. [x] Badge detail modal and verification page show skill tags with category colors

## Tasks / Subtasks

- [x] Task 1: Create `SkillManagement` page — split layout (AC: #1, #3, #10)
  - [x] Wrap in `<AdminPageShell>` (from Story 12.1)
  - [x] Left panel: `<CategoryTree editable={false}>` (read-only selector from Story 12.1)
  - [x] Right panel: Skills data table
  - [x] Click category → filter skills table
  - [x] Responsive: on <1024px, collapse tree into dropdown selector above table
- [x] Task 2: Skills data table (AC: #1, #2, #4, #9)
  - [x] Columns: name, description, category chip (colored), level, badge count
  - [x] Search input (debounced 300ms)
  - [x] Pagination using standardized `PaginatedResponse<T>` pattern (per CQ-007)
  - [x] Hover-reveal action buttons (edit, delete)
- [x] Task 3: Skill tag color system (AC: #9, #11, #12)
  - [x] Add `color` field to `SkillCategory` Prisma model (small migration)
  - [x] 10-color Tailwind palette: `slate`, `blue`, `emerald`, `amber`, `rose`, `violet`, `cyan`, `orange`, `pink`, `lime`
  - [x] Auto-assign color on category creation, editable by admin
  - [x] Shared color constant map: `src/lib/categoryColors.ts`
  - [x] Skill tags render with category color as background
- [x] Task 3b: Fix `useSkills` category field bug + propagate category colors (AC: #11, #12)
  - [x] **BUG FIX:** `useSkills.ts` returns `{ category: name }` but `SkillsFilter` expects `{ categoryName: name }` — fix field mapping
  - [x] Add `categoryColor` to the Skill interface returned by `useSkills` hook
  - [x] **Badge Template Form** (`BadgeTemplateFormPage.tsx`): replace flat pill list with `SkillsFilter` using `groupByCategory={true}`, skills grouped under category headers
  - [x] **Badge Detail Modal** (`BadgeInfo.tsx`): change prop from `skills: string[]` to `skills: { name, categoryColor? }[]`, render pills with category color instead of hardcoded blue
  - [x] **Verify Badge Page** (`VerifyBadgePage.tsx`): add category color to skill pills (backend verification API already returns skill objects, add `category.color` to response)
  - [x] **Backend:** include `category.color` in skill response DTOs (verification endpoint + skills list)
- [x] Task 4: Inline add skill (AC: #5)
  - [x] Inline "Add Skill" row at top of table
  - [x] Fields: name, description, level (category pre-selected from tree)
  - [x] Tab-to-submit, Escape-to-cancel
  - [x] Auto-focus name field on click "+ Add Skill"
- [x] Task 5: Edit skill dialog (AC: #6)
  - [x] Pre-populated form
  - [x] Validation: name required, unique per category
- [x] Task 6: Delete skill with guard (AC: #7, #8)
  - [x] Use shared `<ConfirmDialog>` from Story 12.1
  - [x] Backend check: any templates referencing this skill?
  - [x] Show template list if blocked
- [x] Task 7: API integration
  - [x] `GET /api/skills?categoryId=&search=&page=&limit=`
  - [x] `POST /api/skills`
  - [x] `PATCH /api/skills/:id`
  - [x] `DELETE /api/skills/:id`
- [x] Task 8: Tests
  - [x] Data table render + filter tests
  - [x] Inline add skill tests
  - [x] Form validation tests
  - [x] Delete guard tests
  - [x] Skill tag color rendering tests
  - [x] `useSkills` category field fix test
  - [x] Badge Template form grouped skills test
  - [x] Badge detail modal colored skill tags test

## Dev Notes

### Architecture Patterns
- Reuse `<CategoryTree editable={false}>` from Story 12.1 (read-only selector mode)
- Reuse `<AdminPageShell>` from Story 12.1
- Reuse `<ConfirmDialog>` from Story 12.1
- Data table pattern from existing `BadgeManagementPage` or `UserManagementPage`
- Shadcn/ui `Table` + standardized pagination (CQ-007)
- Inline add: custom inline editing row at table top

### Schema Change (small migration)
```prisma
model SkillCategory {
  // ... existing fields ...
  color String? @db.VarChar(20) // Tailwind color name: blue, emerald, amber...
}
```

### Skill Tag Color Map
```typescript
// src/lib/categoryColors.ts
export const CATEGORY_COLORS = [
  'slate', 'blue', 'emerald', 'amber', 'rose',
  'violet', 'cyan', 'orange', 'pink', 'lime'
] as const;
```

### Existing Backend Endpoints
- `GET /api/skills` — paginated list, supports categoryId filter
- `POST /api/skills` — create
- `PATCH /api/skills/:id` — update
- `DELETE /api/skills/:id` — delete

### Key Schema Reference
```prisma
model Skill {
  id, name, description, categoryId, category, level?
  @@unique([name, categoryId])
}
```

### Dependencies
- Story 12.1 (SkillCategoryTree component)

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Shared `<CategoryTree>` with editable/read-only modes, color field on SkillCategory (derived from category, not skill), pagination per CQ-007
- **UX (Sally):** Responsive split→dropdown on <1024px, inline add skill row (tab-to-submit), 10-color Tailwind palette, colored skill tags from category
- **Estimate revised:** 8h → **10h** (+2h for Task 3b: category color propagation to Template Form, Badge Detail, Verify Page + useSkills bug fix)

### Category Display Improvements (2026-02-19)
- **Bug found:** `useSkills` hook maps `category.name` to `category` field, but `SkillsFilter` expects `categoryName` — `groupByCategory` silently broken since inception
- **Scope added:** Template form skill picker grouped by category, badge detail + verify page skill pills colored by category
- **Affected files:** `useSkills.ts`, `BadgeTemplateFormPage.tsx`, `BadgeInfo.tsx`, `VerifyBadgePage.tsx`, backend verification DTO

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- All 8 tasks implemented following dev-prompt sequence
- Prisma migration `20260219123907_add_skill_category_color` applied
- useSkills bug fixed: `category` → `categoryName` field mapping
- Category colors propagated to BadgeTemplateFormPage, BadgeInfo, BadgeDetailModal, VerifyBadgePage
- Removed duplicate "skill selected" counter from BadgeTemplateFormPage (SkillsFilter already shows it)
- Frontend: 61 test files, 654 tests passing
- Backend: 46 suites (4 skipped), 772 tests passing (28 skipped)

### File List
**Backend Created:**
- `prisma/migrations/20260219123907_add_skill_category_color/migration.sql`

**Backend Modified:**
- `prisma/schema.prisma` — added `color String? @db.VarChar(20)` to SkillCategory
- `src/skill-categories/dto/skill-category.dto.ts` — color field in Create/Update/Response DTOs
- `src/skill-categories/skill-categories.service.ts` — CATEGORY_COLORS array, auto-assign in create()
- `src/skill-categories/skill-categories.service.spec.ts` — added `count` mock
- `src/badge-verification/badge-verification.service.ts` — include category.color in skill resolution
- `src/badge-verification/badge-verification.service.spec.ts` — categoryColor in expectations

**Frontend Created:**
- `src/lib/categoryColors.ts` — COLOR_MAP + getCategoryColorClasses()
- `src/lib/categoryColors.test.ts` — 6 tests
- `src/hooks/useSkillMutations.ts` — useCreateSkill, useUpdateSkill, useDeleteSkill
- `src/hooks/useSkillMutations.test.tsx` — 6 tests
- `src/hooks/useSkills.test.tsx` — 3 tests
- `src/pages/admin/SkillManagementPage.tsx` — full CRUD page with split layout
- `src/pages/admin/SkillManagementPage.test.tsx` — 11 tests

**Frontend Modified:**
- `src/hooks/useSkills.ts` — BUG FIX: category→categoryName, added categoryColor/categoryId/description/level
- `src/components/search/SkillsFilter.tsx` — extended Skill interface with optional fields
- `src/pages/admin/BadgeTemplateFormPage.tsx` — replaced flat pills with SkillsFilter dropdown
- `src/pages/admin/BadgeTemplateFormPage.test.tsx` — updated 4 tests for SkillsFilter pattern
- `src/components/BadgeDetailModal/BadgeInfo.tsx` — skills prop supports objects with categoryColor
- `src/components/BadgeDetailModal/BadgeInfo.test.tsx` — 2 new color tests
- `src/components/BadgeDetailModal/BadgeDetailModal.tsx` — passes categoryColor objects to BadgeInfo
- `src/pages/VerifyBadgePage.tsx` — category color rendering for skill pills
- `src/App.tsx` — lazy route for /admin/skills
- `src/components/Navbar.tsx` — Skills nav link (ADMIN)
- `src/components/layout/MobileNav.tsx` — Skills mobile nav link (ADMIN)
