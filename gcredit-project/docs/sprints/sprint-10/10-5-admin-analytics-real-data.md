# Story 10.5: Admin Analytics — Mock Data → Real Data

**Status:** done  
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

1. [x] AdminAnalyticsPage fetches data from 5 `/api/analytics/*` endpoints (`system-overview`, `issuance-trends`, `top-performers`, `skills-distribution`, `recent-activity`)
2. [x] Dashboard KPI cards show real metrics (total badges, active users, claim rate, etc.)
3. [x] Charts render real data (issuance trends, skills distribution, top performers)
4. [x] Loading states display while data is being fetched
5. [x] Error states display gracefully if API fails
6. [x] Empty states display when no data is available
7. [x] Auto-refresh every 5 minutes (configurable via `ANALYTICS_REFRESH_MS` constant)
8. [x] All existing tests pass + new tests for data integration (442 tests, 40 files)
9. [x] PR commit message: `feat: connect admin analytics to real API data`

## Tasks / Subtasks

- [x] **Task 1: Audit existing analytics API** (AC: #1)
  - [x] Review `/api/analytics/*` endpoint response formats (5 endpoints)
  - [x] Identify any missing data fields needed by frontend
  - [x] Document API contract in `src/types/analytics.ts`

- [x] **Task 2: Create API service layer** (AC: #1)
  - [x] Create `analyticsApi.ts` in frontend API client
  - [x] Add TanStack Query hooks for analytics data
  - [x] Handle error and loading states

- [x] **Task 3: Connect KPI cards** (AC: #2)
  - [x] Replace mock data in KPI cards with real data
  - [x] Add trend calculations (vs previous period)
  - [x] Format numbers properly (%, counts, etc.)

- [x] **Task 4: Connect charts** (AC: #3)
  - [x] Connect issuance trend chart to real data (Recharts AreaChart)
  - [x] Connect skills distribution bar chart
  - [x] Connect top performers leaderboard table

- [x] **Task 5: UX states** (AC: #4, #5, #6)
  - [x] Add loading skeletons for KPI cards and charts
  - [x] Add error boundary with retry button
  - [x] Add empty state for new deployments with no data

- [x] **Task 6: Auto-refresh** (AC: #7)
  - [x] Configure TanStack Query refetch interval (5 min via `ANALYTICS_REFRESH_MS`)
  - [x] Add "Last updated" timestamp display

- [x] **Task 7: Testing** (AC: #8)
  - [x] Unit tests for analytics API hooks (14 tests)
  - [x] Component tests for loading/error/empty states
  - [x] Integration test for full data flow

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
Claude Opus 4.6 (GitHub Copilot — Dev Agent)

### Completion Notes
Fully implemented Story 10.5: removed all mock data from AdminAnalyticsPage, connected to 5 backend analytics endpoints via TanStack Query hooks, added Recharts visualizations, loading skeletons, error/empty states, and auto-refresh. Installed `recharts` as new dependency. Code review findings (AC1 doc mismatch + hardcoded refresh interval) resolved. Final state: 442 tests pass (40 files), ESLint 0 errors.

### File List

**New files (11):**
- `src/types/analytics.ts` — TypeScript interfaces for 5 backend DTOs
- `src/lib/analyticsApi.ts` — API client (5 functions)
- `src/hooks/useAnalytics.ts` — TanStack Query hooks (5 hooks + `ANALYTICS_REFRESH_MS` constant)
- `src/components/analytics/IssuanceTrendChart.tsx` — Recharts AreaChart
- `src/components/analytics/SkillsDistributionChart.tsx` — Horizontal BarChart + category breakdown
- `src/components/analytics/TopPerformersTable.tsx` — Leaderboard table
- `src/components/analytics/RecentActivityFeed.tsx` — Activity timeline
- `src/components/analytics/AnalyticsSkeleton.tsx` — Loading skeletons
- `src/lib/__tests__/analyticsApi.test.ts` — API client tests (14 tests)
- `src/hooks/__tests__/useAnalytics.test.tsx` — Hook tests
- `src/pages/__tests__/AdminAnalyticsPage.test.tsx` — Page integration tests

**Modified files (2):**
- `src/pages/AdminAnalyticsPage.tsx` — Complete rewrite (mock data → real API)
- `package.json` — Added `recharts` dependency
