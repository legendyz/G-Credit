# Story 10.5: Admin Analytics — Mock Data → Real Data

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 6h  
**Sprint:** Sprint 10  
**Type:** Feature Enhancement

---

## Story

As an **HR administrator**,  
I want **the admin analytics dashboard to display real data from the database**,  
So that **I can make data-driven decisions about our badge program effectiveness**.

## Background

Sprint 8 Story 8.4 built the Analytics API endpoints, and the `AdminAnalyticsPage.tsx` was created with mock/placeholder data. The backend endpoints exist but the frontend isn't fully connected. The TODO marker at L46 says "Replace mock data with actual admin analytics endpoint."

## Acceptance Criteria

1. [ ] AdminAnalyticsPage fetches data from `/api/analytics/admin` endpoint
2. [ ] Dashboard KPI cards show real metrics (total badges, active users, claim rate, etc.)
3. [ ] Charts render real data (issuance trends, top templates, department distribution)
4. [ ] Loading states display while data is being fetched
5. [ ] Error states display gracefully if API fails
6. [ ] Empty states display when no data is available
7. [ ] Auto-refresh every 5 minutes (configurable)
8. [ ] All existing tests pass + new tests for data integration
9. [ ] PR commit message: `feat: connect admin analytics to real API data`

## Tasks / Subtasks

- [ ] **Task 1: Audit existing analytics API** (AC: #1)
  - [ ] Review `/api/analytics/admin` endpoint response format
  - [ ] Identify any missing data fields needed by frontend
  - [ ] Document API contract

- [ ] **Task 2: Create API service layer** (AC: #1)
  - [ ] Create `analyticsApi.ts` in frontend API client
  - [ ] Add TanStack Query hooks for analytics data
  - [ ] Handle error and loading states

- [ ] **Task 3: Connect KPI cards** (AC: #2)
  - [ ] Replace mock data in KPI cards with real data
  - [ ] Add trend calculations (vs previous period)
  - [ ] Format numbers properly (%, counts, etc.)

- [ ] **Task 4: Connect charts** (AC: #3)
  - [ ] Connect issuance trend chart to real data
  - [ ] Connect top templates bar chart
  - [ ] Connect department distribution (if data available)

- [ ] **Task 5: UX states** (AC: #4, #5, #6)
  - [ ] Add loading skeletons for KPI cards and charts
  - [ ] Add error boundary with retry button
  - [ ] Add empty state for new deployments with no data

- [ ] **Task 6: Auto-refresh** (AC: #7)
  - [ ] Configure TanStack Query refetch interval (5 min)
  - [ ] Add "Last updated" timestamp display

- [ ] **Task 7: Testing** (AC: #8)
  - [ ] Unit tests for analytics API hooks
  - [ ] Component tests for loading/error/empty states
  - [ ] Integration test for full data flow

## Dev Notes

### Dependencies
- Story 10.3 resolves the TODO marker at AdminAnalyticsPage.tsx L46
- This story provides the actual implementation

### References
- Sprint 8 Story 8.4: Analytics API implementation
- AdminAnalyticsPage.tsx current mock data structure

---

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled on completion_

### File List
_To be filled on completion_
