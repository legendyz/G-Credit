# Story 12.7: Admin Activity Feed Formatting

Status: backlog

## Story

As an **Admin**,
I want the Admin Dashboard Recent Activity feed to display human-readable descriptions instead of raw JSON,
So that I can quickly understand platform activity without parsing JSON strings.

## Context

- Resolves **TD-016** residual (superseded by Story 11.24 but core formatting still needed)
- Current state: `dashboard.service.ts` uses `JSON.stringify(metadata)` for activity descriptions
- Analytics page `RecentActivityFeed.tsx` already has a working `buildDescription()` pattern — use as reference
- Low complexity, high UX impact

## Acceptance Criteria

1. [ ] Recent Activity on Admin Dashboard shows human-readable descriptions
2. [ ] Covers all action types: ISSUED, CLAIMED, REVOKED, NOTIFICATION_SENT, CREATED, UPDATED
3. [ ] Unknown action types gracefully degrade (show action name, not JSON)
4. [ ] Original metadata preserved in audit log table (not modified)
5. [ ] Unit tests for `formatActivityDescription()` function
6. [ ] Analytics page `RecentActivityFeed` is not affected (uses different data source)

## Tasks / Subtasks

- [ ] Task 1: Create `formatActivityDescription()` in `dashboard.service.ts` (AC: #1, #2, #3)
  - [ ] Switch statement by action type
  - [ ] Extract key fields from metadata
  - [ ] Fallback: return action name for unknown types
- [ ] Task 2: Apply formatter in `getAdminDashboard()` (AC: #1, #4)
  - [ ] Replace `JSON.stringify(metadata)` with `formatActivityDescription(action, metadata)`
- [ ] Task 3: Unit tests (AC: #5)
  - [ ] Test each action type
  - [ ] Test unknown action fallback
  - [ ] Test null metadata handling

## Dev Notes

### Architecture Patterns
- Backend-only fix (Option A from TD-016)
- Reference: `frontend/src/components/analytics/RecentActivityFeed.tsx` — `buildDescription()` pattern

### Key File
- `backend/src/dashboard/dashboard.service.ts` (L398-404)

### Effort: ~3h (small, well-scoped)

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List
