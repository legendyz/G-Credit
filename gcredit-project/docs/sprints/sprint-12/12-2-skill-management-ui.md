# Story 12.2: Skill Management UI

Status: backlog

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

1. [ ] Admin can view all skills in a searchable, filterable data table
2. [ ] Table columns: Skill Name, Description, Category, Level, Badge Count, Actions
3. [ ] Admin can filter by category (from tree sidebar or dropdown)
4. [ ] Admin can search skills by name
5. [ ] Admin can create a new skill with: name, description, category, level (optional)
6. [ ] Admin can edit an existing skill
7. [ ] Admin can delete a skill not referenced by any badge template
8. [ ] Delete blocked with message showing which templates reference the skill
9. [ ] Colored skill tags match category colors (tech=blue, leadership=gold, etc.)
10. [ ] Route: `/admin/skills` — combined page with category tree (left) + skills table (right)
11. [ ] Badge Template form skill picker groups skills by category (with category headers)
12. [ ] Badge detail modal and verification page show skill tags with category colors

## Tasks / Subtasks

- [ ] Task 1: Create `SkillManagement` page — split layout (AC: #1, #3, #10)
  - [ ] Wrap in `<AdminPageShell>` (from Story 12.1)
  - [ ] Left panel: `<CategoryTree editable={false}>` (read-only selector from Story 12.1)
  - [ ] Right panel: Skills data table
  - [ ] Click category → filter skills table
  - [ ] Responsive: on <1024px, collapse tree into dropdown selector above table
- [ ] Task 2: Skills data table (AC: #1, #2, #4, #9)
  - [ ] Columns: name, description, category chip (colored), level, badge count
  - [ ] Search input (debounced 300ms)
  - [ ] Pagination using standardized `PaginatedResponse<T>` pattern (per CQ-007)
  - [ ] Hover-reveal action buttons (edit, delete)
- [ ] Task 3: Skill tag color system (AC: #9, #11, #12)
  - [ ] Add `color` field to `SkillCategory` Prisma model (small migration)
  - [ ] 10-color Tailwind palette: `slate`, `blue`, `emerald`, `amber`, `rose`, `violet`, `cyan`, `orange`, `pink`, `lime`
  - [ ] Auto-assign color on category creation, editable by admin
  - [ ] Shared color constant map: `src/lib/categoryColors.ts`
  - [ ] Skill tags render with category color as background
- [ ] Task 3b: Fix `useSkills` category field bug + propagate category colors (AC: #11, #12)
  - [ ] **BUG FIX:** `useSkills.ts` returns `{ category: name }` but `SkillsFilter` expects `{ categoryName: name }` — fix field mapping
  - [ ] Add `categoryColor` to the Skill interface returned by `useSkills` hook
  - [ ] **Badge Template Form** (`BadgeTemplateFormPage.tsx`): replace flat pill list with `SkillsFilter` using `groupByCategory={true}`, skills grouped under category headers
  - [ ] **Badge Detail Modal** (`BadgeInfo.tsx`): change prop from `skills: string[]` to `skills: { name, categoryColor? }[]`, render pills with category color instead of hardcoded blue
  - [ ] **Verify Badge Page** (`VerifyBadgePage.tsx`): add category color to skill pills (backend verification API already returns skill objects, add `category.color` to response)
  - [ ] **Backend:** include `category.color` in skill response DTOs (verification endpoint + skills list)
- [ ] Task 4: Inline add skill (AC: #5)
  - [ ] Inline "Add Skill" row at top of table
  - [ ] Fields: name, description, level (category pre-selected from tree)
  - [ ] Tab-to-submit, Escape-to-cancel
  - [ ] Auto-focus name field on click "+ Add Skill"
- [ ] Task 5: Edit skill dialog (AC: #6)
  - [ ] Pre-populated form
  - [ ] Validation: name required, unique per category
- [ ] Task 6: Delete skill with guard (AC: #7, #8)
  - [ ] Use shared `<ConfirmDialog>` from Story 12.1
  - [ ] Backend check: any templates referencing this skill?
  - [ ] Show template list if blocked
- [ ] Task 7: API integration
  - [ ] `GET /api/skills?categoryId=&search=&page=&limit=`
  - [ ] `POST /api/skills`
  - [ ] `PATCH /api/skills/:id`
  - [ ] `DELETE /api/skills/:id`
- [ ] Task 8: Tests
  - [ ] Data table render + filter tests
  - [ ] Inline add skill tests
  - [ ] Form validation tests
  - [ ] Delete guard tests
  - [ ] Skill tag color rendering tests
  - [ ] `useSkills` category field fix test
  - [ ] Badge Template form grouped skills test
  - [ ] Badge detail modal colored skill tags test

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
### Completion Notes
### File List
