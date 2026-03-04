# Story 16.2: Frontend — Template List Ownership Filter

Status: dev-complete

## Story
As an **Issuer**,
I want **to only see templates I created when issuing badges**,
So that **I am not confused by templates from other Issuers and can only use my own**.

## Acceptance Criteria
1. [x] `IssueBadgePage` template dropdown shows only Issuer's own templates (filtered by `createdBy`)
2. [x] `BulkIssuancePage` template selection shows only Issuer's own templates
3. [x] ADMIN sees all templates (no filtering change)
4. [x] Template count in dropdown matches ownership scope
5. [x] Empty state shown if Issuer has no templates yet

## Tasks / Subtasks
- [x] Task 1: Add `creatorId` query param to template list API (AC: #1)
  - [x] Backend: `findAll()` accepts optional `creatorId` filter — server-side auto-inject approach
  - [x] When ISSUER requests, auto-inject `creatorId = userId` on server side (both `findAll` and `findAllAdmin`)
- [x] Task 2: Update `IssueBadgePage` template fetching (AC: #1, #4, #5)
  - [x] Server-side filtering — no frontend API changes needed
  - [x] Show "No templates found. Create a template first before issuing badges." empty state
- [x] Task 3: Update `BulkIssuancePage` template selection (AC: #2)
  - [x] Empty state message in `TemplateSelector.tsx` when templates array is empty
- [x] Task 4: Frontend tests (AC: #1-#5)
  - [x] Test: Empty state when no owned templates (IssueBadgePage.test.tsx)
- [x] Task 5: Backend unit tests
  - [x] 5 unit tests for `creatorId` filter in badge-templates.service.spec.ts
- [x] Task 6: Backend E2E tests
  - [x] 5 E2E tests for ownership filter (ISSUER-A, ISSUER-B, ADMIN, empty, /all endpoint)

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
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- **Approach**: Server-side auto-filtering (ARCH-P1-004 pattern) — controller detects ISSUER role and injects `creatorId` before calling service. No frontend API changes needed; `getActiveTemplates()` call unchanged.
- **Backend**: `findAll(query, onlyActive, creatorId?)` now accepts optional `creatorId`; both `findAll()` and `findAllAdmin()` controller endpoints inject `req.user.userId` when `role === ISSUER`.
- **Frontend**: Added empty state messages to `IssueBadgePage.tsx` (disabled Select + guidance text) and `TemplateSelector.tsx` (info paragraph).
- **Tests**: 5 backend unit tests (creatorId filter), 5 E2E tests (ISSUER-A/B isolation, ADMIN sees all, empty list, /all endpoint), 1 frontend test (empty state).
- All 48 backend unit tests pass, 12 frontend tests pass, 0 TypeScript errors.

### File List
- `backend/src/badge-templates/badge-templates.service.ts` — added `creatorId` param + `where.createdBy` filter
- `backend/src/badge-templates/badge-templates.controller.ts` — inject `creatorId` for ISSUER in `findAll()` + `findAllAdmin()`
- `frontend/src/pages/IssueBadgePage.tsx` — empty state when templates array empty
- `frontend/src/components/BulkIssuance/TemplateSelector.tsx` — empty state message
- `backend/src/badge-templates/badge-templates.service.spec.ts` — 5 new unit tests
- `backend/test/badge-templates.e2e-spec.ts` — 5 new E2E tests
- `frontend/src/pages/IssueBadgePage.test.tsx` — 1 new empty state test

## Retrospective Notes
