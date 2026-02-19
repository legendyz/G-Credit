# Story 12.1: Skill Category Management UI

Status: backlog

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

1. [ ] Admin can view all skill categories in a tree/nested list structure
2. [ ] Admin can create a new top-level category (level 1) — no parent required
3. [ ] Admin can create subcategories under any existing category (level 2, 3)
4. [ ] Admin can edit category name, description, and display order for ALL levels
5. [ ] Admin can delete empty categories (no skills assigned)
6. [ ] Delete is blocked with clear message if category has skills
7. [ ] System-defined categories (`isSystemDefined=true`) show a lock icon and cannot be deleted
8. [ ] Tree view supports expand/collapse
9. [ ] Category count shows number of skills in each category
10. [ ] Route: `/admin/skills/categories` accessible via sidebar nav (future Sprint 13)

## Tasks / Subtasks

- [ ] Task 0: Create shared `<AdminPageShell>` component (CROSS-CUTTING)
  - [ ] Props: `title`, `description`, `actions` (slot), `loading`, `empty` state
  - [ ] Consistent page header, content area, loading skeleton, empty state, error boundary
  - [ ] Location: `src/components/admin/AdminPageShell.tsx`
  - [ ] Used by: Stories 12.1, 12.2, 12.3, 12.4
- [ ] Task 0b: Create shared `<ConfirmDialog>` component (CROSS-CUTTING)
  - [ ] Props: `title`, `description` (supports dynamic text), `confirmLabel`, `variant` (danger/default)
  - [ ] Location: `src/components/ui/ConfirmDialog.tsx`
  - [ ] Used by: all stories for delete/lock actions
- [ ] Task 1: Create `<CategoryTree>` shared component (AC: #1, #8, #9)
  - [ ] Tree/nested list with expand/collapse (Lucide ChevronRight/ChevronDown)
  - [ ] Display per node: name, skill count (e.g., "Frontend (12 skills)"), system lock icon
  - [ ] Props: `editable` (true = show drag handles + action buttons; false = read-only selector)
  - [ ] Responsive: on <1024px collapse tree into dropdown selector
  - [ ] Empty state: "Create your first skill category" prompt with CTA button
  - [ ] Location: `src/components/admin/CategoryTree.tsx`
  - [ ] Used by: Stories 12.1 (editable), 12.2 (read-only selector)
- [ ] Task 2: Drag-and-drop reorder (AC: #4 — displayOrder)
  - [ ] Install `@dnd-kit/core` + `@dnd-kit/sortable`
  - [ ] Drag handle icon (⠿) on left of each tree node
  - [ ] Blue insertion line during drag
  - [ ] Constraint: same-level reorder ONLY (no cross-level reparenting via drag)
  - [ ] Cross-level move: separate "Move to..." menu action
  - [ ] API: `PATCH /api/skills/categories/:id` with new `displayOrder`
- [ ] Task 3: Create category form dialog (AC: #2, #3, #4)
  - [ ] Create dialog: name, description, parent selector (optional — empty = Level 1)
  - [ ] Edit dialog: pre-populated fields
  - [ ] Validation: name required, max 100 chars
- [ ] Task 3b: Backend — allow Level 1 category creation (AC: #2)
  - [ ] `CreateSkillCategoryDto`: change `parentId` from `@IsUUID()` required to `@IsOptional() @IsUUID()` optional
  - [ ] `skill-categories.service.ts` `create()`: if no `parentId`, set `level = 1`; if `parentId`, validate parent exists + `level < 3`
  - [ ] Update existing backend tests for create without `parentId`
  - [ ] Update Swagger docs (`description` field on `parentId`)
- [ ] Task 4: Delete category with guard (AC: #5, #6, #7)
  - [ ] Use shared `<ConfirmDialog>` with specific text: "Delete 'Frontend Development' and its 12 skills?"
  - [ ] Backend validation: reject DELETE + UPDATE on `isSystemDefined` categories with 403
  - [ ] Frontend: disable delete button for system categories (lock icon)
- [ ] Task 5: API integration (AC: #1-#6)
  - [ ] Fetch tree: `GET /api/skill-categories` (existing — returns nested JSON with `?includeSkills=true`)
  - [ ] Flat list: `GET /api/skill-categories/flat` (for parent selector dropdown)
  - [ ] Create: `POST /api/skill-categories` (parentId optional — null = Level 1)
  - [ ] Update: `PATCH /api/skill-categories/:id`
  - [ ] Delete: `DELETE /api/skill-categories/:id`
  - [ ] Consider optimistic UI updates with rollback on error (tree is small, ~30-50 nodes)
- [ ] Task 6: Route + navigation setup (AC: #10)
  - [ ] Add route to router config
  - [ ] Add page to admin routes
- [ ] Task 7: Tests
  - [ ] AdminPageShell component tests
  - [ ] ConfirmDialog component tests
  - [ ] CategoryTree component tests (editable + read-only modes)
  - [ ] Drag-and-drop reorder tests
  - [ ] API integration tests (mock)
  - [ ] Form validation tests

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
### Completion Notes
### File List
