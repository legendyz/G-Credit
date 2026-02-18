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
  - [ ] Wrap in `<AdminPageShell>` (from Story 12.1)
  - [ ] Card grid layout (3 columns, responsive)
  - [ ] Each card: icon (top-left, prominent), title, description, type chip, stats
  - [ ] Active/Inactive toggle (Shadcn `Switch`) directly on card (top-right)
  - [ ] Achievement count badge on card
  - [ ] Empty state: "Create your first milestone" prompt
- [ ] Task 2: Create milestone form dialog/sheet (AC: #3, #4, #5)
  - [ ] Use Shadcn `Sheet` or `Dialog` — NOT full page navigation (admin stays in grid context)
  - [ ] Type selector (4 options)
  - [ ] Dynamic fields per type with **Zod validation schemas**:
    - BADGE_COUNT: `{ threshold: z.number().min(1) }`
    - SKILL_TRACK: `{ skillCategoryId: z.string().uuid(), requiredCount: z.number().min(1) }`
    - ANNIVERSARY: `{ years: z.number().min(1) }`
    - CUSTOM: `{ description: z.string(), criteria: z.string() }`
  - [ ] Common fields: title, description, icon
  - [ ] **Icon selection:** Lucide icon selector dropdown (curated list of ~20 achievement-relevant icons)
- [ ] Task 3: Edit milestone dialog (AC: #6)
  - [ ] Pre-populated form
  - [ ] Type CANNOT be changed after creation (field disabled + tooltip explaining why)
- [ ] Task 4: Toggle isActive (AC: #7)
  - [ ] Inline toggle switch directly on card (top-right position)
  - [ ] API: `PATCH /api/admin/milestones/:id` (body: { isActive })
  - [ ] Toast confirmation (Sonner)
- [ ] Task 5: API integration (AC: #1-#8)
  - [ ] `GET /api/admin/milestones` — list all (include achievement count)
  - [ ] `POST /api/admin/milestones` — create
  - [ ] `PATCH /api/admin/milestones/:id` — update
- [ ] Task 6: Tests
  - [ ] Card grid rendering tests
  - [ ] Dynamic form field tests (Zod validation per type)
  - [ ] Toggle tests
  - [ ] Icon selector tests

## Dev Notes

### Architecture Patterns
- Wrap in `<AdminPageShell>` from Story 12.1
- Card grid layout (not table — milestones are configuration items, not list data)
- Toggle switch: Shadcn `Switch` component (directly on card, top-right)
- Dynamic form: conditional rendering based on `type` selection
- Zod schemas for trigger validation per MilestoneType
- Icon selector: curated Lucide icon dropdown (~20 icons)
- Create/edit: Shadcn `Sheet` or `Dialog` (NOT full page navigation)
- Follow design-direction.md card styles

### Trigger JSON Schemas (Zod)
```typescript
import { z } from 'zod';

export const MilestoneTriggerSchemas = {
  BADGE_COUNT: z.object({ threshold: z.number().min(1) }),
  SKILL_TRACK: z.object({ skillCategoryId: z.string().uuid(), requiredCount: z.number().min(1) }),
  ANNIVERSARY: z.object({ years: z.number().min(1) }),
  CUSTOM: z.object({ description: z.string().min(1), criteria: z.string().min(1) }),
};
```

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

### ✅ Phase 2 Review Complete (2026-02-19)
- **Architecture (Winston):** Zod trigger schemas per MilestoneType, achievement count from MilestoneAchievement count, no DELETE (deactivate instead)
- **UX (Sally):** Icon (top-left prominent), toggle (top-right on card), create in sheet/dialog (no page nav), card grid responsive, empty state CTA
- **Estimate confirmed:** 8h

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
