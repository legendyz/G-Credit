# Code Review - Sprint 10 Story 10.3 (TODO/FIXME Cleanup)

Date: 2026-02-08  
Reviewer: Amelia (Dev Agent)

## Scope
Story: 10-3-todo-fixme-cleanup.md  
Commits reviewed:  
- fda29c1 (refactor: resolve TODO/FIXME markers + fix dead links and localhost URLs)  
Reviewed files:
- gcredit-project/frontend/src/lib/apiConfig.ts
- gcredit-project/frontend/src/pages/NotFoundPage.tsx
- gcredit-project/frontend/src/App.tsx
- gcredit-project/frontend/src/lib/badgesApi.ts
- gcredit-project/frontend/src/lib/badgeShareApi.ts
- gcredit-project/frontend/src/hooks/useDashboard.ts
- gcredit-project/frontend/src/hooks/useWallet.ts
- gcredit-project/frontend/src/pages/BulkIssuancePage.tsx
- gcredit-project/frontend/src/pages/VerifyBadgePage.tsx
- gcredit-project/frontend/src/pages/AdminAnalyticsPage.tsx
- gcredit-project/frontend/src/pages/dashboard/EmployeeDashboard.tsx
- gcredit-project/frontend/src/pages/dashboard/IssuerDashboard.tsx
- gcredit-project/frontend/src/pages/dashboard/ManagerDashboard.tsx
- gcredit-project/frontend/src/pages/dashboard/AdminDashboard.tsx
- gcredit-project/frontend/src/components/BulkIssuance/TemplateSelector.tsx
- gcredit-project/frontend/src/components/BulkIssuance/BulkPreviewPage.tsx
- gcredit-project/frontend/src/components/BulkIssuance/ProcessingComplete.tsx
- gcredit-project/frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx
- gcredit-project/frontend/src/components/BadgeDetailModal/EvidenceSection.tsx
- gcredit-project/frontend/src/components/BadgeDetailModal/SimilarBadgesSection.tsx
- gcredit-project/frontend/src/components/BadgeDetailModal/ReportIssueForm.tsx
- gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx
- gcredit-project/backend/src/dashboard/dashboard.service.ts
- gcredit-project/backend/src/dashboard/dashboard.service.spec.ts
- gcredit-project/backend/src/modules/auth/auth.service.ts
- gcredit-project/backend/src/skills/skills.service.ts
- gcredit-project/backend/src/badge-sharing/controllers/teams-sharing.controller.ts
- gcredit-project/backend/src/badge-sharing/controllers/teams-sharing.controller.spec.ts
- gcredit-project/backend/src/badge-issuance/badge-issuance-teams.integration.spec.ts
- gcredit-project/backend/src/microsoft-graph/services/graph-teams.service.spec.ts
- gcredit-project/backend/src/microsoft-graph/teams/teams-badge-notification.service.spec.ts
- gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md

## Git vs Story Discrepancies
- None observed. Story file list matches the reviewed set. Evidence: [gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md](gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md#L151-L182).

## Findings

### High
1) AC5 requires 0 hardcoded `localhost:3000` URLs in frontend source, but `API_BASE_URL` still falls back to `http://localhost:3000/api`. This violates the acceptance criterion as written and reintroduces a hardcoded localhost string.  
- AC5 requirement: [gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md](gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md#L24-L30)  
- Hardcoded fallback: [gcredit-project/frontend/src/lib/apiConfig.ts](gcredit-project/frontend/src/lib/apiConfig.ts#L1-L6)

### Medium
2) AC6 requires no dead navigation links. The New Employee empty state renders a "Learn How to Earn" button that is wired to a no-op handler in `TimelineView`, so the CTA is clickable but does nothing. This is still a dead navigation action and should be disabled or routed to a valid page.  
- AC6 requirement: [gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md](gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md#L24-L30)  
- No-op handler passed: [gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx](gcredit-project/frontend/src/components/TimelineView/TimelineView.tsx#L167-L178)  
- CTA uses the handler: [gcredit-project/frontend/src/components/BadgeWallet/EmptyStateScenarios/NewEmployeeEmptyState.tsx](gcredit-project/frontend/src/components/BadgeWallet/EmptyStateScenarios/NewEmployeeEmptyState.tsx#L41-L53)

3) AC3 claims all existing tests still pass, but no test logs or artifacts are stored in-repo to validate the claim during review. This makes AC3 unverifiable.  
- AC3 claim: [gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md](gcredit-project/docs/sprints/sprint-10/10-3-todo-fixme-cleanup.md#L24-L27)

## AC Coverage Summary (Current State)
- AC1: No TODO/FIXME markers found in reviewed source, but not re-verified across the entire repo in this review session.  
- AC2: Implemented (Teams item converted to ADR-style deferment).  
- AC3: Not independently verifiable (no test artifacts).  
- AC4: Not independently re-run here; story claims grep returns 0.  
- AC5: Not met (localhost fallback remains).  
- AC6: Not met (Learn More CTA no-op).  
- AC7: Implemented (catch-all route added).  
- AC8: Met (commit subject matches required string).

## Test Coverage Notes
- The story claims all tests pass, but there are no execution logs or artifacts in the repo to confirm it.
