# Story 16.2: Frontend — Template List Ownership Filter

Status: ready-for-dev

## Story
As an **Issuer**,
I want **to only see templates I created when issuing badges**,
So that **I am not confused by templates from other Issuers and can only use my own**.

## Acceptance Criteria
1. [ ] `IssueBadgePage` template dropdown shows only Issuer's own templates (filtered by `createdBy`)
2. [ ] `BulkIssuancePage` template selection shows only Issuer's own templates
3. [ ] ADMIN sees all templates (no filtering change)
4. [ ] Template count in dropdown matches ownership scope
5. [ ] Empty state shown if Issuer has no templates yet

## Tasks / Subtasks
- [ ] Task 1: Add `creatorId` query param to template list API (AC: #1)
  - [ ] Backend: `findAll()` accepts optional `creatorId` filter in `QueryBadgeTemplatesDto`
  - [ ] When ISSUER requests, auto-inject `creatorId = userId` on server side
- [ ] Task 2: Update `IssueBadgePage` template fetching (AC: #1, #4, #5)
  - [ ] Use `getActiveTemplates()` with ownership filter
  - [ ] Show "No templates found. Create a template first." empty state
- [ ] Task 3: Update `BulkIssuancePage` template selection (AC: #2)
  - [ ] Same ownership filter pattern
- [ ] Task 4: Frontend tests (AC: #1-#5)
  - [ ] Test: Issuer sees only own templates
  - [ ] Test: Admin sees all templates
  - [ ] Test: Empty state when no owned templates

## Dev Notes
### Architecture Patterns Used
- Backend option: Add `creatorId` filter to `QueryBadgeTemplatesDto` + auto-inject in controller
- Frontend: `getActiveTemplates()` in `badgeTemplatesApi.ts` — already fetches ACTIVE templates
- Alternative: Server-side auto-filtering (Issuer requests `/badge-templates` → server adds `WHERE createdBy = userId`)

### Source Tree Components
- `backend/src/badge-templates/badge-templates.service.ts` — `findAll()` where clause
- `backend/src/badge-templates/badge-templates.controller.ts` — inject userId for ISSUER
- `frontend/src/pages/IssueBadgePage.tsx` — template dropdown
- `frontend/src/pages/BulkIssuancePage.tsx` — template selection
- `frontend/src/lib/badgeTemplatesApi.ts` — API functions

### Testing Standards
- Frontend: Vitest + React Testing Library
- Mock API responses with ownership-scoped data

### References
- `badge-templates.controller.ts` `findAll()` and `findAllAdmin()` — two existing endpoints
- Lesson 55: Filter changes must reset pagination

## Code Review Strategy
- 🟡 MEDIUM risk — AI Review + Self-review

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
