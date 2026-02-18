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
- Design reference: [ui-design-direction.md](../../planning/ui-design-direction.md) — Skill Tags section
- Prototype reference: [gcredit-ui-prototype.html](../../../../_bmad-output/gcredit-ui-prototype.html) — Skill Management page

## Acceptance Criteria

1. [ ] Admin can view all skill categories in a tree/nested list structure
2. [ ] Admin can create a new top-level category (level 1)
3. [ ] Admin can create subcategories under any existing category (level 2, 3)
4. [ ] Admin can edit category name, description, and display order
5. [ ] Admin can delete empty categories (no skills assigned)
6. [ ] Delete is blocked with clear message if category has skills
7. [ ] System-defined categories (`isSystemDefined=true`) show a lock icon and cannot be deleted
8. [ ] Tree view supports expand/collapse
9. [ ] Category count shows number of skills in each category
10. [ ] Route: `/admin/skills/categories` accessible via sidebar nav (future Sprint 13)

## Tasks / Subtasks

- [ ] Task 1: Create `SkillCategoryManagement` page component (AC: #1, #8)
  - [ ] Tree/nested list view with expand/collapse
  - [ ] Display: name, description, skill count, system badge
  - [ ] Loading skeleton state
- [ ] Task 2: Create category form dialog (AC: #2, #3, #4)
  - [ ] Create dialog: name, description, parent selector
  - [ ] Edit dialog: pre-populated fields
  - [ ] Validation: name required, max 100 chars
- [ ] Task 3: Delete category with guard (AC: #5, #6, #7)
  - [ ] Confirmation dialog
  - [ ] Backend validation: reject if skills exist
  - [ ] Frontend: disable delete button for system categories
- [ ] Task 4: API integration (AC: #1-#6)
  - [ ] Fetch categories tree from `GET /api/skills/categories`
  - [ ] Create: `POST /api/skills/categories`
  - [ ] Update: `PATCH /api/skills/categories/:id`
  - [ ] Delete: `DELETE /api/skills/categories/:id`
- [ ] Task 5: Route + navigation setup (AC: #10)
  - [ ] Add route to router config
  - [ ] Add page to admin routes
- [ ] Task 6: Tests
  - [ ] Component render tests
  - [ ] API integration tests (mock)
  - [ ] Form validation tests

## Dev Notes

### Architecture Patterns
- Use existing API client pattern (`API_BASE_URL` + fetch)
- Shadcn/ui `Dialog` for create/edit forms
- Shadcn/ui `Card` for tree nodes
- Lucide icons for tree expand/collapse
- Sonner toast for success/error feedback
- Consider `react-arborist` or custom tree component

### Existing Backend Endpoints
- `GET /api/skills/categories` — returns flat list with `parentId`
- `POST /api/skills/categories` — create (body: name, description, parentId?)
- `PATCH /api/skills/categories/:id` — update
- `DELETE /api/skills/categories/:id` — delete (blocked if has skills)

### Key Schema Reference
```prisma
model SkillCategory {
  id, name, nameEn, description, parentId, parent, children,
  level (1-3), isSystemDefined, isEditable, displayOrder, skills[]
}
```

### ⚠️ Phase 2 Review Needed
- **Architecture Review:** Tree rendering strategy, data fetching pattern
- **UX Review:** Tree interaction design, mobile responsiveness

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
