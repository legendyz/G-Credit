# Story 11.17: FR26 — Analytics CSV Export

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 2h  
**Source:** Feature Request (PO)  

## Story

As an admin,  
I want to export analytics data as CSV,  
So that I can analyze badge issuance trends in external tools (Excel, Google Sheets).

## Acceptance Criteria

1. [ ] `GET /api/analytics/export/csv` endpoint created
2. [ ] CSV includes: badge name, issuer, recipient, issuance date, status, skills
3. [ ] Response has `Content-Type: text/csv` and `Content-Disposition: attachment`
4. [ ] Date range filter supported (query params: `startDate`, `endDate`)
5. [ ] Admin-only access (RBAC guard)
6. [ ] Large datasets handled efficiently (streaming, not buffering entire file)
7. [ ] Unit and integration tests

## Tasks / Subtasks

- [ ] **Task 1: CSV generation service** (AC: #2, #6)
  - [ ] Create `analytics-export.service.ts` or add method to existing analytics service
  - [ ] Query issuance data with date range filter
  - [ ] Generate CSV with headers
  - [ ] Use streaming for large datasets

- [ ] **Task 2: Endpoint** (AC: #1, #3, #4, #5)
  - [ ] Add `@Get('export/csv')` to analytics controller
  - [ ] Apply `@Roles(Role.ADMIN)` guard
  - [ ] Set response headers for CSV download
  - [ ] Accept `startDate` and `endDate` query params

- [ ] **Task 3: Frontend** (AC: #1)
  - [ ] Add "Export CSV" button on analytics dashboard
  - [ ] Trigger download via API call

- [ ] **Task 4: Tests** (AC: #7)
  - [ ] Unit test CSV generation logic
  - [ ] Integration test endpoint with auth

## Dev Notes

### Source Tree Components
- **Controller:** `backend/src/analytics/analytics.controller.ts`
- **Service:** `backend/src/analytics/analytics.service.ts`
- **Frontend:** `frontend/src/pages/AnalyticsDashboardPage.tsx` (or similar)

### Implementation Options
- Option A: Use `csv-stringify` npm package (lightweight)
- Option B: Manual CSV string generation (no new dep)
- Recommend Option B for simplicity — badge data is structured

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
