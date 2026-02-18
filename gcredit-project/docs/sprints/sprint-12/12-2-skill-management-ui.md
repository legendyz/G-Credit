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

## Tasks / Subtasks

- [ ] Task 1: Create `SkillManagement` page — split layout (AC: #1, #3, #10)
  - [ ] Left panel: Category tree from Story 12.1 (reuse component)
  - [ ] Right panel: Skills data table
  - [ ] Click category → filter skills table
- [ ] Task 2: Skills data table (AC: #1, #2, #4, #9)
  - [ ] Columns: name, description, category chip, level, badge count
  - [ ] Search input (debounced)
  - [ ] Pagination (reuse `PaginatedResponse<T>` pattern)
  - [ ] Hover-reveal action buttons (edit, delete)
- [ ] Task 3: Skill form dialog (AC: #5, #6)
  - [ ] Create: name, description, category selector, level dropdown
  - [ ] Edit: pre-populated
  - [ ] Validation: name required, unique per category
- [ ] Task 4: Delete skill with guard (AC: #7, #8)
  - [ ] Backend check: any templates referencing this skill?
  - [ ] Show template list if blocked
- [ ] Task 5: API integration
  - [ ] `GET /api/skills?categoryId=&search=&page=&limit=`
  - [ ] `POST /api/skills`
  - [ ] `PATCH /api/skills/:id`
  - [ ] `DELETE /api/skills/:id`
- [ ] Task 6: Tests
  - [ ] Data table render + filter tests
  - [ ] Form validation tests
  - [ ] Delete guard tests

## Dev Notes

### Architecture Patterns
- Reuse `SkillCategoryTree` component from Story 12.1
- Data table pattern from existing `BadgeManagementPage` or `UserManagementPage`
- Shadcn/ui `Table` + custom pagination
- Color mapping: category → skill tag color (define in shared constant)

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

### ⚠️ Phase 2 Review Needed
- **Architecture Review:** Backend endpoint for badge count per skill, delete guard
- **UX Review:** Split layout interaction, skill tag color system

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
