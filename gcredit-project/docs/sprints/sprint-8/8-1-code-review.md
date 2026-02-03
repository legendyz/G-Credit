# Story 8.1 Code Review

**Story/Task:** 8.1 Dashboard Homepage with Key Metrics  
**Date:** 2026-02-03  
**Reviewer:** Amelia (Dev Agent)

---

## Scope Reviewed
- Backend dashboard module (controller/service/DTO/tests)
- Frontend dashboards, shared UX components, routing, hooks
- Story documentation vs repo state
- Commit range provided (8d22eff..19bfc80)

---

## Summary
Core dashboard APIs exist and shared UX components are implemented, but several ACs are not fully met and some story claims do not match the repo (missing dashboard tests, status inconsistency). Multiple quick-action requirements are unimplemented, and celebration UX doesn’t match AC6.

---

## Git vs Story Discrepancies
- **Story status is still “backlog” despite completion notes and DoD claiming completion.** Evidence: [8-1-dashboard-homepage.md](gcredit-project/docs/sprints/sprint-8/8-1-dashboard-homepage.md#L9)
- **Story claims dashboard component/hook/integration tests, but no dashboard test files exist.** Evidence: [8-1-dashboard-homepage.md](gcredit-project/docs/sprints/sprint-8/8-1-dashboard-homepage.md#L351-L353)

---

## Findings

### 🔴 High

1) **AC1 Employee quick actions + latest-badge claim button are missing**
- Employee dashboard renders summary, milestone, and recent badges only; no “View All My Badges” or “Browse Badge Catalog” actions, and the latest badge card has no claim button for pending badges.
- Evidence: [EmployeeDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L134-L235), [EmployeeDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L292-L340)

2) **AC1 milestone “recent achievements unlocked” section is missing**
- Backend DTO and UI include only a single `currentMilestone`, no recent achievements list.
- Evidence: [dashboard.dto.ts](gcredit-project/backend/src/dashboard/dto/dashboard.dto.ts#L88-L124), [EmployeeDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L169-L210)

3) **AC2 Issuer quick actions are missing**
- Issuer dashboard shows summary + activity but no “Issue New Badge” or “View Issued Badges” actions.
- Evidence: [IssuerDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx#L47-L132)

4) **AC3 Manager quick actions are missing**
- Manager dashboard shows team insights/top performers/revocation alerts only; no “Nominate Team Member” or “View Team Skills” actions.
- Evidence: [ManagerDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/ManagerDashboard.tsx#L47-L166)

5) **AC5 ErrorBoundary is not used at the dashboard level**
- `DashboardPage` renders dashboards directly without wrapping them in `ErrorBoundary` or the HOC.
- Evidence: [DashboardPage.tsx](gcredit-project/frontend/src/pages/dashboard/DashboardPage.tsx#L14-L77)

6) **AC6 celebration UX requirements are not met**
- Requirements include green checkmark, highlighted badge preview, and auto-scroll to latest badge. Current implementation only shows a modal with confetti and no highlight/scroll behavior.
- Evidence: [EmployeeDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L235-L257), [CelebrationModal.tsx](gcredit-project/frontend/src/components/common/CelebrationModal.tsx#L49-L155)

---

### 🟡 Medium

7) **Manual refresh UI is missing despite AC1**
- AC1 requires pull-to-refresh on mobile and a refresh button on desktop; the dashboard relies on polling only.
- Evidence: [useDashboard.ts](gcredit-project/frontend/src/hooks/useDashboard.ts#L27-L69), [EmployeeDashboard.tsx](gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx#L134-L235)

8) **Story test claims are not verifiable in repo**
- Story lists dashboard component/hook/integration tests, but only shared component tests are present; no dashboard tests exist under pages.
- Evidence: [8-1-dashboard-homepage.md](gcredit-project/docs/sprints/sprint-8/8-1-dashboard-homepage.md#L187-L214)

---

## Recommendations
- Implement quick action buttons for Employee/Issuer/Manager dashboards as specified.
- Add latest badge claim CTA (pending badge) and recent achievements list in employee dashboard data + UI.
- Wrap dashboard rendering with `ErrorBoundary`.
- Implement AC6 UX details (highlight + auto-scroll + checkmark) and align confetti behavior with AC6 scope.
- Add manual refresh controls in UI.
- Add dashboard component/hook/integration tests or correct story claims.

---

## Outcome
**Status:** Changes requested (high-severity AC gaps present).