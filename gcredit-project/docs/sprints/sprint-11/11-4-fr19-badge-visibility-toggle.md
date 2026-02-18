# Story 11.4: FR19 — Badge Visibility Toggle (Public/Private Control)

**Status:** backlog  
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-6h  
**Source:** PRD Audit + Feature Audit P0-1  

## Story

As an employee,  
I want to control whether each of my badges is publicly visible or private,  
So that I have ownership over my professional credential visibility.

## Acceptance Criteria

1. [ ] Badge model has `visibility` field (enum: PUBLIC, PRIVATE, default: PUBLIC)
2. [ ] Database migration adds visibility field to existing badges (all default to PUBLIC — non-breaking)
3. [ ] PATCH `/api/badges/:id/visibility` endpoint allows badge owner to toggle visibility
4. [ ] Only badge owner (recipient) can change their badge's visibility
5. [ ] Public verification page (`/verify/:id`) returns 404 for PRIVATE badges
6. [ ] Employee profile public view filters out PRIVATE badges
7. [ ] Badge wallet UI shows toggle switch per badge
8. [ ] Unit tests for visibility logic (service + controller)
9. [ ] E2E test for visibility toggle flow
10. [ ] All existing tests pass (0 regressions)

## Tasks / Subtasks

- [ ] **Task 1: DB Schema Migration** (AC: #1, #2)
  - [ ] Add to `schema.prisma` Badge model:
    ```prisma
    visibility BadgeVisibility @default(PUBLIC)
    ```
  - [ ] Add enum:
    ```prisma
    enum BadgeVisibility {
      PUBLIC
      PRIVATE
    }
    ```
  - [ ] Run `npx prisma migrate dev --name add-badge-visibility`
  - [ ] Verify existing badges get `PUBLIC` default

- [ ] **Task 2: Backend API** (AC: #3, #4)
  - [ ] Create `UpdateBadgeVisibilityDto` with `visibility: BadgeVisibility`
  - [ ] Add `PATCH /api/badges/:id/visibility` in `badge-issuance.controller.ts`
  - [ ] In service: verify `badge.recipientId === currentUser.id` (owner check)
  - [ ] Return updated badge

- [ ] **Task 3: Verification page filter** (AC: #5)
  - [ ] In `badge-verification.service.ts`: check `badge.visibility === 'PUBLIC'`
  - [ ] If PRIVATE, throw `NotFoundException` (same as badge not found — no disclosure)

- [ ] **Task 4: Profile public view filter** (AC: #6)
  - [ ] In badge wallet queries for public profile: add `where: { visibility: 'PUBLIC' }`
  - [ ] Owner's own wallet view shows all badges (with visibility indicator)

- [ ] **Task 5: Frontend UI** (AC: #7)
  - [ ] Add toggle switch in badge wallet card (Shadcn Switch component)
  - [ ] Call PATCH endpoint on toggle
  - [ ] Optimistic UI update with revert on error
  - [ ] Show lock icon for PRIVATE badges

- [ ] **Task 6: Tests** (AC: #8, #9, #10)
  - [ ] Unit test: visibility toggle service logic
  - [ ] Unit test: owner-only authorization check
  - [ ] Unit test: verification page PRIVATE badge returns 404
  - [ ] E2E test: toggle visibility → verify public page behavior changes
  - [ ] Run full test suite

## Dev Notes

### Source Tree Components
- **Prisma schema:** `backend/prisma/schema.prisma` L181-222 (Badge model)
- **Badge issuance controller:** `backend/src/badge-issuance/badge-issuance.controller.ts`
- **Verification service:** `backend/src/badge-verification/badge-verification.service.ts`
- **Badge wallet page:** `frontend/src/pages/WalletPage.tsx`
- **Badge card component:** `frontend/src/components/BadgeCard/` (or similar)

### Architecture Patterns
- Use Prisma enum for type safety (not string)
- Owner check pattern: same as evidence upload authorization
- NotFoundException for PRIVATE badges prevents enumeration

### Coding Standards
- Controller must have `api/` prefix
- Use `API_BASE_URL` in frontend API calls
- Use NestJS Logger for logging

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
