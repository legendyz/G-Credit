# Story 8.1: Dashboard Homepage with Key Metrics

**Story ID:** Story 8.1  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** HIGH  
**Story Points:** 5  
**Estimated Hours:** 8h  
**Status:** completed  
**Actual Hours:** 8h  
**Completed:** 2026-02-03

---

## Context

Currently, after login, users land on a blank page or generic placeholder. This Story implements role-specific Dashboards with key metrics and quick actions to provide immediate value and orientation.

**Technical Debt Resolution:**
- UX-P1-001: Celebration feedback for badge claiming
- UX-P1-002: Shared LoadingSpinner component
- UX-P1-003: Retry buttons on error states

**Reference:** PRD Phase 1 MVP, Sprint 7 Retrospective (UX Gap identified)

---

## User Story

**As a** User (Employee/Issuer/Manager/Admin),  
**I want** a role-specific dashboard with key metrics and quick actions,  
**So that** I can immediately see relevant information and take common actions without navigating.

---

## Acceptance Criteria

### AC1: Employee Dashboard
**Given** I am logged in as an Employee  
**When** I land on the homepage (/)  
**Then** I see my Employee Dashboard with:

- **My Badges Summary:**
  - Total badges earned
  - Badges claimed this month
  - Latest badge (card preview with claim button if pending)
  
- **Quick Actions:**
  - "View All My Badges" button → /wallet
  - "Browse Badge Catalog" button → /catalog (future)
  
- **Milestones Section:**
  - Progress toward next milestone (e.g., "3 of 10 Technical Badges Earned - 30%")
  - Visual: Horizontal progress bar (0-25% red, 25-75% yellow, 75-100% green)
  - Recent achievements unlocked

- **Loading States:**
  - Skeleton loaders during data fetch
  - Retry button on error (UX-P1-003)

- **Empty States:**
  - No badges yet: "Start Your Badge Journey!" hero section with CTA "Explore Badge Catalog"
  - No recent activity: "No recent activity" with tips on earning badges
  - Visual: Illustrated placeholder (badge icon + motivational text)

- **Celebration Feedback (UX-P1-002):**
  - Trigger: On first load within 5 minutes of badge issuance
  - Display: Confetti animation (3 seconds) + toast "Congratulations on your new badge!"
  - Persistence: Tracked in localStorage `celebratedBadges: string[]` (show once per badge)
  - Fallback: If missed, show "New" indicator on badge card

- **Refresh Strategy:**
  - Auto-refresh: Poll every 60 seconds (only when tab active)
  - Manual: Pull-to-refresh on mobile, refresh button on desktop
  - Implementation: TanStack Query `refetchInterval: 60000` + `refetchOnWindowFocus: true`

### AC2: Issuer Dashboard
**Given** I am logged in as an Issuer  
**When** I land on the homepage (/)  
**Then** I see my Issuer Dashboard with:

- **Issuance Summary:**
  - Badges issued this month
  - Pending claims (badges in PENDING status)
  - Total recipients
  
- **Quick Actions:**
  - "Issue New Badge" button → /badges/issue
  - "View Issued Badges" button → /badges/manage
  
- **Recent Activity:**
  - Last 5 badge issuances (recipient, template, date)
  - Claim rate percentage

### AC3: Manager Dashboard
**Given** I am logged in as a Manager  
**When** I land on the homepage (/)  
**Then** I see my Manager Dashboard with:

- **Team Insights:**
  - Team members count
  - Team badges earned this month
  - Top skilled team members (by badge count)
  
- **Quick Actions:**
  - "Nominate Team Member" button (future)
  - "View Team Skills" button → /team/skills
  
- **Revocation Alerts:**
  - Recent revocations requiring attention

### AC4: Admin Dashboard
**Given** I am logged in as an Admin  
**When** I land on the homepage (/)  
**Then** I see my Admin Dashboard with:

- **System Overview:**
  - Total users
  - Total badges issued
  - Active badge templates
  - System health indicator
  
- **Quick Actions:**
  - "Manage Templates" button → /admin/templates
  - "Manage Users" button → /admin/users
  - "View Analytics" button → /admin/analytics (future)
  
- **Recent Activity:**
  - Last 10 system events (badge issued, template created, user registered)

### AC5: Shared Components & UX Standards
**Given** any dashboard is loading or encounters errors  
**When** data is being fetched or fails  
**Then** I see consistent UX patterns:

- **LoadingSpinner Component** (UX-P1-002):
  - Shared component: `src/components/ui/LoadingSpinner.tsx`
  - Variants: small, medium, large
  - Used across all dashboards
  
- **Error State with Retry** (UX-P1-003):
  - Error message displayed
  - "Retry" button to re-fetch data
  - Error boundary at dashboard level
  
- **Empty State:**
  - Friendly message when no data
  - Call-to-action button (e.g., "Issue Your First Badge")

### AC6: Celebration Feedback (UX-P1-001)
**Given** I just claimed a badge  
**When** I am redirected to the dashboard  
**Then** I see celebration feedback:

- Green checkmark icon with "Congratulations!"
- Badge preview card highlighted
- Auto-scroll to "Latest Badge" section
- Confetti animation deferred to Sprint 9 (basic celebration only)

---

## Tasks / Subtasks

### Task 1: Shared Components (AC5) - 2h ✅
- [x] Create `LoadingSpinner.tsx` component (UX-P1-002)
  - [x] Implement size variants (small/medium/large)
  - [x] Add Tailwind animations
  - [x] Write unit tests (6 tests)
- [x] Create `ErrorBoundary.tsx` component with retry
  - [x] Implement error catching
  - [x] Add retry button (UX-P1-003)
  - [x] Write unit tests (8 tests)
- [x] Create `EmptyState.tsx` component
  - [x] Support custom message and CTA button
  - [x] Write unit tests (7 tests)
- [x] Create `ErrorDisplay.tsx` component (UX-P1-003)
  - [x] Support inline/card/page variants
  - [x] Write unit tests (11 tests)

### Task 2: Employee Dashboard (AC1, AC6) - 2h ✅
- [x] Create `EmployeeDashboard.tsx` component
  - [x] Implement badge summary cards
  - [x] Add quick action buttons
  - [x] Integrate milestones progress bar
  - [x] Add celebration feedback logic (AC6)
- [x] Create API hooks:
  - [x] `useEmployeeDashboard()` - fetch badge statistics + milestones
- [x] Write tests (hooks + component)

### Task 3: Issuer Dashboard (AC2) - 1.5h ✅
- [x] Create `IssuerDashboard.tsx` component
  - [x] Implement issuance summary cards
  - [x] Add recent activity list (table + mobile cards)
  - [x] Add quick action buttons
  - [x] Add claim rate gauge
- [x] Create API hook: `useIssuerDashboard()`
- [x] Write tests

### Task 4: Manager Dashboard (AC3) - 1.5h ✅
- [x] Create `ManagerDashboard.tsx` component
  - [x] Implement team insights cards
  - [x] Add top performers section (ranked list)
  - [x] Add revocation alerts section
  - [x] Add quick action buttons
- [x] Create API hook: `useManagerDashboard()`
- [x] Write tests

### Task 5: Admin Dashboard (AC4) - 1.5h ✅
- [x] Create `AdminDashboard.tsx` component
  - [x] Implement system overview cards
  - [x] Add system health banner
  - [x] Add recent activity feed
  - [x] Add quick actions grid
- [x] Create API hook: `useAdminDashboard()`
- [x] Write tests

### Task 6: Route Configuration & Role-Based Rendering - 0.5h ✅
- [x] Update `src/App.tsx` to render role-specific dashboard on `/`
- [x] Add role detection logic in DashboardPage.tsx
- [x] Move TimelineView to `/wallet` route

### Task 7: Backend API Implementation - 2h ✅
- [x] Create DashboardModule (controller, service, DTOs)
- [x] Implement 4 role-specific endpoints
- [x] Write 23 unit tests
- [x] Write 18 E2E tests

### Task 8: CelebrationModal Component (AC6) - 0.5h ✅
- [x] Create `CelebrationModal.tsx` with confetti animation
- [x] Add preset components (BadgeEarnedCelebration, MilestoneReachedCelebration)
- [x] Write tests (11 tests)

---

## Backend API Requirements

### New Endpoints Required

#### 1. GET /api/dashboard/employee
**Response:**
```json
{
  "badgeSummary": {
    "total": 12,
    "claimedThisMonth": 3,
    "latestBadge": {
      "id": "uuid",
      "templateName": "Python Expert",
      "status": "PENDING",
      "issuedAt": "2026-02-01T10:00:00Z"
    }
  },
  "milestones": {
    "current": {
      "title": "Badge Collector",
      "progress": 12,
      "target": 15,
      "icon": "🏆"
    },
    "recentAchievements": [...]
  }
}
```

#### 2. GET /api/dashboard/issuer
**Response:**
```json
{
  "issuanceSummary": {
    "issuedThisMonth": 45,
    "pendingClaims": 8,
    "totalRecipients": 120,
    "claimRate": 0.82
  },
  "recentActivity": [
    {
      "badgeId": "uuid",
      "recipientName": "John Doe",
      "templateName": "Python Expert",
      "issuedAt": "2026-02-02T09:00:00Z"
    }
  ]
}
```

#### 3. GET /api/dashboard/manager
**Response:**
```json
{
  "teamInsights": {
    "teamMembersCount": 15,
    "teamBadgesThisMonth": 28,
    "topPerformers": [
      {
        "userId": "uuid",
        "name": "Jane Smith",
        "badgeCount": 8
      }
    ]
  },
  "revocationAlerts": [...]
}
```

#### 4. GET /api/dashboard/admin
**Response:**
```json
{
  "systemOverview": {
    "totalUsers": 450,
    "totalBadgesIssued": 1234,
    "activeBadgeTemplates": 23,
    "systemHealth": "healthy"
  },
  "recentActivity": [...]
}
```

---

## Dev Notes

### Architecture Patterns Used
- **Role-based Component Composition:** Each role gets dedicated dashboard component
- **Shared UI Components:** LoadingSpinner, ErrorBoundary, EmptyState (DRY principle)
- **React Query for Data Fetching:** All API calls use `useQuery` with caching
- **Error Boundaries:** Dashboard-level error catching with retry capability

### Source Tree Components
```
src/
├── components/
│   ├── dashboards/
│   │   ├── EmployeeDashboard.tsx
│   │   ├── IssuerDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── ui/
│       ├── LoadingSpinner.tsx (NEW - UX-P1-002)
│       ├── ErrorBoundary.tsx (NEW - UX-P1-003)
│       └── EmptyState.tsx (NEW)
├── hooks/
│   └── api/
│       ├── useBadgeSummary.ts
│       ├── useIssuanceSummary.ts
│       ├── useTeamInsights.ts
│       └── useSystemOverview.ts
└── App.tsx (UPDATED - role-based routing)
```

### Testing Standards
- **Component Tests:** 32 tests total (8+6+6+6+4+2)
- **API Hook Tests:** 8 tests (2 per hook)
- **Integration Tests:** 4 tests (role-based dashboard rendering)
- **Total:** ~44 tests

### Technical Debt Resolved
- ✅ UX-P1-001: Celebration feedback (basic implementation)
- ✅ UX-P1-002: Shared LoadingSpinner component
- ✅ UX-P1-003: Error states with retry buttons

---

## Definition of Done

- [x] All 6 Acceptance Criteria met
- [x] 95+ tests passing (41 backend + 54+ frontend)
- [x] Backend API endpoints implemented and documented in Swagger
- [x] LoadingSpinner, ErrorBoundary, EmptyState, ErrorDisplay components reusable
- [x] Role-based routing works for all 4 roles
- [x] Code review complete (self-review)
- [x] No console errors or warnings
- [x] Responsive design (mobile/tablet/desktop) - leverages Story 8.5
- [x] Story file updated with completion notes

---

## Completion Notes (2026-02-03)

**Commit:** `19bfc80` - feat(story-8.1): implement Dashboard Homepage with Key Metrics

### Backend Implementation
- Created `DashboardModule` with controller, service, DTOs
- 4 endpoints: `/api/dashboard/employee|issuer|manager|admin`
- Tests: 23 unit tests + 18 E2E tests (all passing)

### Frontend Implementation
- **Shared UI Components:**
  - `LoadingSpinner.tsx` (UX-P1-002) - size variants, accessibility
  - `EmptyState.tsx` (UX-P1-003) - presets for badges/activity/team
  - `ErrorDisplay.tsx` (UX-P1-003) - inline/card/page variants with retry
  - `ErrorBoundary.tsx` (UX-P1-003) - React error boundary with HOC
  - `CelebrationModal.tsx` (UX-P1-001) - confetti animation, presets

- **Dashboard Components:**
  - `EmployeeDashboard.tsx` - badge summary, milestone progress, recent badges
  - `IssuerDashboard.tsx` - issuance stats, claim rate gauge, activity table
  - `ManagerDashboard.tsx` - team insights, top performers, revocation alerts
  - `AdminDashboard.tsx` - system health, overview stats, quick actions

- **Routing:**
  - `/` → Dashboard (role-based)
  - `/wallet` → Badge Wallet (moved from `/`)

- **Tests:** 54+ new tests (201 total frontend tests passing)

### UX Technical Debt Resolved
- ✅ UX-P1-001: Celebration feedback (CelebrationModal with confetti)
- ✅ UX-P1-002: Loading feedback (LoadingSpinner, PageLoader)
- ✅ UX-P1-003: Error retry buttons (ErrorDisplay, ErrorBoundary)

---

## Dependencies

**Blocked By:**
- Story 0.2b (Login system must be complete for role detection)

**Blocks:**
- Story 8.4 (Analytics API endpoints can be called from Admin dashboard)

---

## References

- PRD Phase 1 MVP requirements
- Sprint 7 Retrospective: "UX Gap Identified"
- technical-debt-from-reviews.md (UX-P1-001/002/003)
- Lesson 28: Pre-UAT Review Pattern (technical completion ≠ UX completion)
