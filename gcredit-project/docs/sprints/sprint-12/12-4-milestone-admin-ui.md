# Story 12.4: Milestone Admin UI

Status: backlog

## Story

As an **Admin**,
I want to manage milestone configurations (create, edit, activate/deactivate) through the UI,
So that I can define and control achievement milestones without using Swagger.

## Context

- Resolves **TD-009** (Milestone Admin UI — missing frontend)
- Backend complete: `MilestoneConfig` CRUD + auto-trigger on badge issuance/claim
- Employee-facing milestone display already works (Dashboard progress cards, Wallet timeline)
- What's missing: Admin can't create/edit milestones from UI
- Prisma model: `MilestoneConfig { id, type, title, description, trigger(Json), icon, isActive, createdBy }`

## Acceptance Criteria

1. [ ] Admin can view all milestones in a card grid layout
2. [ ] Each card shows: icon, title, description, type, trigger summary, isActive toggle, achievement count
3. [ ] Admin can create a new milestone via form dialog
4. [ ] Create form supports all 4 types: BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM
5. [ ] Form dynamically shows type-specific fields (e.g., BADGE_COUNT → badge count threshold)
6. [ ] Admin can edit an existing milestone
7. [ ] Admin can toggle isActive status directly from the card
8. [ ] Achievement count shows how many users have reached this milestone
9. [ ] Route: `/admin/milestones`

## Tasks / Subtasks

- [ ] Task 1: Create `MilestoneManagement` page (AC: #1, #2, #8)
  - [ ] Card grid layout (3 columns)
  - [ ] Each card: icon, title, description, type chip, toggle, stats
  - [ ] Achievement count badge
  - [ ] Empty state for no milestones
- [ ] Task 2: Create milestone form dialog (AC: #3, #4, #5)
  - [ ] Type selector (4 options)
  - [ ] Dynamic fields per type:
    - BADGE_COUNT: `badgeCount` (number input)
    - SKILL_TRACK: `categoryId` (category selector)
    - ANNIVERSARY: `years` (number input)
    - CUSTOM: `trigger` (JSON editor or key-value)
  - [ ] Common fields: title, description, icon (emoji picker or text input)
- [ ] Task 3: Edit milestone dialog (AC: #6)
  - [ ] Pre-populated form
  - [ ] Type cannot be changed after creation (or with warning)
- [ ] Task 4: Toggle isActive (AC: #7)
  - [ ] Inline toggle switch on card
  - [ ] API: `PATCH /api/admin/milestones/:id` (body: { isActive })
  - [ ] Toast confirmation
- [ ] Task 5: API integration (AC: #1-#8)
  - [ ] `GET /api/admin/milestones` — list all
  - [ ] `POST /api/admin/milestones` — create
  - [ ] `PATCH /api/admin/milestones/:id` — update
- [ ] Task 6: Tests
  - [ ] Card grid rendering tests
  - [ ] Form dynamic field tests
  - [ ] Toggle tests

## Dev Notes

### Architecture Patterns
- Card grid layout (not table — milestones are configuration items, not list data)
- Toggle switch: Shadcn `Switch` component
- Dynamic form: conditional rendering based on `type` selection
- Follow design-direction.md card styles

### Existing Backend Endpoints
- `GET /api/admin/milestones` — list
- `POST /api/admin/milestones` — create
- `PATCH /api/admin/milestones/:id` — update
- Note: DELETE may not exist — milestones with achievements should be deactivated, not deleted

### Key Schema Reference
```prisma
model MilestoneConfig {
  id, type(MilestoneType), title, description, trigger(Json),
  icon, isActive, createdBy, achievements[]
}
enum MilestoneType { BADGE_COUNT, SKILL_TRACK, ANNIVERSARY, CUSTOM }
```

### ⚠️ Phase 2 Review Needed
- **Architecture Review:** Achievement count endpoint, trigger JSON schema validation
- **UX Review:** Card layout, dynamic form UX, emoji icon picker

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
