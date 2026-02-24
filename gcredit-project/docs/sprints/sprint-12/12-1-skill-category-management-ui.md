# Story 12.1: Skill Category Management UI

Status: done

## Story

As an **Admin**,
I want to manage skill categories (create, edit, delete, reorder) through a visual tree interface,
So that I can organize the skill taxonomy without using Swagger or direct API calls.

## Context

- Backend API already exists: `GET/POST/PATCH/DELETE /api/skills/categories`
- Prisma model `SkillCategory` supports hierarchy: `parentId`, `level` (1-3), `children` relation
- Currently no frontend page for category management
- **Backend change needed:** `parentId` is currently required in `CreateSkillCategoryDto` — must be made optional so Admin can create Level 1 categories
- Design reference: [ui-design-direction.md](../../planning/ui-design-direction.md) — Skill Tags section
- Prototype reference: [gcredit-ui-prototype.html](../../../../_bmad-output/gcredit-ui-prototype.html) — Skill Management page

## Acceptance Criteria

1. [x] Admin can view all skill categories in a tree/nested list structure
2. [x] Admin can create a new top-level category (level 1) — no parent required
3. [x] Admin can create subcategories under any existing category (level 2, 3)
4. [x] Admin can edit category name, description, and display order for ALL levels
5. [x] Admin can delete empty categories (no skills assigned)
6. [x] Delete is blocked with clear message if category has skills
7. [x] System-defined categories (`isSystemDefined=true`) show a lock icon and cannot be deleted
8. [x] Tree view supports expand/collapse
9. [x] Category count shows number of skills in each category
10. [x] Route: `/admin/skills/categories` accessible via sidebar nav (future Sprint 13)

## Tasks / Subtasks

- [x] Task 0: Create shared `<AdminPageShell>` component (CROSS-CUTTING)
  - [x] Props: `title`, `description`, `actions` (slot), `loading`, `empty` state
  - [x] Consistent page header, content area, loading skeleton, empty state, error boundary
  - [x] Location: `src/components/admin/AdminPageShell.tsx`
  - [x] Used by: Stories 12.1, 12.2, 12.3, 12.4
- [x] Task 0b: Create shared `<ConfirmDialog>` component (CROSS-CUTTING)
  - [x] Props: `title`, `description` (supports dynamic text), `confirmLabel`, `variant` (danger/default)
  - [x] Location: `src/components/ui/ConfirmDialog.tsx`
  - [x] Used by: all stories for delete/lock actions
- [x] Task 1: Create `<CategoryTree>` shared component (AC: #1, #8, #9)
  - [x] Tree/nested list with expand/collapse (Lucide ChevronRight/ChevronDown)
  - [x] Display per node: name, skill count (e.g., "Frontend (12 skills)"), system lock icon
  - [x] Props: `editable` (true = show drag handles + action buttons; false = read-only selector)
  - [ ] Responsive: on <1024px collapse tree into dropdown selector *(deferred to Sprint 13)*
  - [x] Empty state: "Create your first skill category" prompt with CTA button
  - [x] Location: `src/components/admin/CategoryTree.tsx`
  - [x] Used by: Stories 12.1 (editable), 12.2 (read-only selector)
- [x] Task 2: Drag-and-drop reorder (AC: #4 — displayOrder)
  - [x] Install `@dnd-kit/core` + `@dnd-kit/sortable`
  - [x] Drag handle icon (⠿) on left of each tree node
  - [ ] Blue insertion line during drag *(deferred — requires DnD overlay customization)*
  - [x] Constraint: same-level reorder ONLY (no cross-level reparenting via drag)
  - [ ] Cross-level move: separate "Move to..." menu action *(deferred to Sprint 13)*
  - [x] API: `PATCH /api/skills/categories/:id` with new `displayOrder`
- [x] Task 3: Create category form dialog (AC: #2, #3, #4)
  - [x] Create dialog: name, description, parent selector (optional — empty = Level 1)
  - [x] Edit dialog: pre-populated fields
  - [x] Validation: name required, max 100 chars
- [x] Task 3b: Backend — allow Level 1 category creation (AC: #2)
  - [x] `CreateSkillCategoryDto`: change `parentId` from `@IsUUID()` required to `@IsOptional() @IsUUID()` optional
  - [x] `skill-categories.service.ts` `create()`: if no `parentId`, set `level = 1`; if `parentId`, validate parent exists + `level < 3`
  - [x] Update existing backend tests for create without `parentId`
  - [x] Update Swagger docs (`description` field on `parentId`)
- [x] Task 4: Delete category with guard (AC: #5, #6, #7)
  - [x] Use shared `<ConfirmDialog>` with specific text: "Delete 'Frontend Development' and its 12 skills?"
  - [x] Backend validation: reject DELETE + UPDATE on `isSystemDefined` categories with 403
  - [x] Frontend: disable delete button for system categories (lock icon)
- [x] Task 5: API integration (AC: #1-#6)
  - [x] Fetch tree: `GET /api/skill-categories` (existing — returns nested JSON with `?includeSkills=true`)
  - [x] Flat list: `GET /api/skill-categories/flat` (for parent selector dropdown)
  - [x] Create: `POST /api/skill-categories` (parentId optional — null = Level 1)
  - [x] Update: `PATCH /api/skill-categories/:id`
  - [x] Delete: `DELETE /api/skill-categories/:id`
  - [x] Consider optimistic UI updates with rollback on error (tree is small, ~30-50 nodes)
- [x] Task 6: Route + navigation setup (AC: #10)
  - [x] Add route to router config
  - [x] Add page to admin routes
- [x] Task 7: Tests
  - [x] AdminPageShell component tests
  - [x] ConfirmDialog component tests
  - [x] CategoryTree component tests (editable + read-only modes)
  - [x] Drag-and-drop reorder tests
  - [x] API integration tests (mock)
  - [x] Form validation tests

## Dev Notes

### Architecture Patterns
- Use existing API client pattern (`API_BASE_URL` + fetch)
- Shadcn/ui `Dialog` for create/edit forms
- Shadcn/ui `Card` for tree nodes
- Lucide icons for tree expand/collapse
- Sonner toast for success/error feedback
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop reorder
- Custom `<CategoryTree>` component (NOT react-arborist — too heavy for our needs)

### New Shared Components (established in this story)
- `<AdminPageShell>` — reusable admin page layout wrapper
- `<ConfirmDialog>` — reusable confirmation dialog with danger variant
- `<CategoryTree>` — reusable tree with editable/read-only modes

### New Dependencies
- `@dnd-kit/core` (drag-and-drop framework)
- `@dnd-kit/sortable` (sortable preset for lists/trees)

### Backend Endpoint Changes
- **EXISTING:** `GET /api/skill-categories` — already returns nested tree (no new endpoint needed)
- `GET /api/skill-categories/flat` — flat list for dropdowns
- `POST /api/skill-categories` — create (body: name, description, parentId?)
  - **CHANGE:** `parentId` becomes optional. When `null` → creates Level 1 category
- `PATCH /api/skill-categories/:id` — update (including displayOrder for reorder)
- `DELETE /api/skill-categories/:id` — delete (blocked if has skills/children; 403 if isSystemDefined)

### Key Schema Reference
```prisma
model SkillCategory {
  id, name, nameEn, description, parentId, parent, children,
  level (1-3), isSystemDefined, isEditable, displayOrder, skills[]
}
```

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Custom tree component, `@dnd-kit` for DnD, same-level reorder only, `/categories/tree` endpoint for nested JSON, optimistic updates, 403 for system-defined categories
- **UX (Sally):** Skill count per node, empty state CTA, specific delete messages, responsive tree→dropdown on <1024px, drag handle (⠿) + blue insertion line
- **Estimate revised:** 8h → **10h** (+2h for dnd-kit + shared components)
- **Cross-cutting components:** AdminPageShell, ConfirmDialog, CategoryTree established here
- **Backend fix (2026-02-19):** `parentId` made optional in CreateDTO + service to allow Admin to create all levels (L1/L2/L3)

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- All 10 acceptance criteria met
- Implementation delivered with tests; 3 subtasks are explicitly deferred (responsive tree dropdown, blue insertion line, cross-level "Move to...")
- Frontend: 621 tests passing (57 files) — +70 new tests from baseline 551
- Backend: 763 tests passing (46 suites) — +4 new tests
- TypeScript: 0 errors (both FE and BE)
- ESLint: 0 errors (both FE and BE)
- New dependencies: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

### File List
**Created (Frontend):**
- `src/components/admin/AdminPageShell.tsx` — Shared admin page wrapper (8 tests)
- `src/components/admin/AdminPageShell.test.tsx`
- `src/components/ui/ConfirmDialog.tsx` — Reusable confirm dialog (7 tests)
- `src/components/ui/ConfirmDialog.test.tsx`
- `src/hooks/useSkillCategories.ts` — React Query CRUD hooks (9 tests)
- `src/hooks/useSkillCategories.test.tsx`
- `src/components/admin/CategoryTree.tsx` — Recursive tree with DnD (13 tests)
- `src/components/admin/CategoryTree.test.tsx`
- `src/components/admin/CategoryFormDialog.tsx` — Create/edit form dialog (9 tests)
- `src/components/admin/CategoryFormDialog.test.tsx`
- `src/pages/admin/SkillCategoryManagementPage.tsx` — Main page (10 tests)
- `src/pages/admin/SkillCategoryManagementPage.test.tsx`

**Modified (Frontend):**
- `src/App.tsx` — Added lazy route `/admin/skills/categories`
- `src/components/Navbar.tsx` — Added "Skill Categories" desktop nav link
- `src/components/layout/MobileNav.tsx` — Added "Skill Categories" mobile nav link

**Created (Backend):**
- `src/skill-categories/skill-categories.service.spec.ts` — 4 unit tests

**Modified (Backend):**
- `src/skill-categories/dto/skill-category.dto.ts` — parentId required → optional
- `src/skill-categories/skill-categories.service.ts` — Handle null parentId for L1 creation

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-02-19 | Story implemented end-to-end | Dev Story workflow execution |
