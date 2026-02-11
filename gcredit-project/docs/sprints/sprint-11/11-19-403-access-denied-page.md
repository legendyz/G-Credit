# Story 11.19: 403 Access Denied Page

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 1.5h  
**Source:** UX Gap  

## Story

As a user without required permissions,  
I want to see a clear "Access Denied" page with actionable guidance,  
So that I understand why I can't access a resource and what to do next.

## Acceptance Criteria

1. [ ] `AccessDeniedPage.tsx` component created
2. [ ] Page displays: 403 icon/illustration, "Access Denied" heading, descriptive message
3. [ ] "Go to Dashboard" button navigates to `/dashboard`
4. [ ] "Contact Admin" link or info provided
5. [ ] Route configured at `/403` or `/access-denied`
6. [ ] Auth guard redirects to 403 page on permission failure (instead of blank screen or redirect loop)
7. [ ] Follows existing design system (Shadcn/ui + Tailwind)
8. [ ] Unit tests for component

## Tasks / Subtasks

- [ ] **Task 1: Create page component** (AC: #1-4, #7)
  - [ ] Create `frontend/src/pages/AccessDeniedPage.tsx`
  - [ ] Use Shadcn/ui Card + Button
  - [ ] Include shield/lock icon from Lucide
  - [ ] Style consistent with existing error pages (404 if exists)

- [ ] **Task 2: Route configuration** (AC: #5)
  - [ ] Add route in React Router config
  - [ ] Path: `/access-denied`

- [ ] **Task 3: Auth guard integration** (AC: #6)
  - [ ] Update RBAC route guards to redirect to `/access-denied` on 403
  - [ ] Ensure no redirect loops

- [ ] **Task 4: Tests** (AC: #8)
  - [ ] Test component renders correctly
  - [ ] Test "Go to Dashboard" navigation
  - [ ] Test redirect on permission failure

## Dev Notes

### Source Tree Components
- **New file:** `frontend/src/pages/AccessDeniedPage.tsx`
- **Router:** `frontend/src/App.tsx` or `router.tsx`
- **Auth guards:** Check existing `ProtectedRoute` or `RequireRole` wrappers

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
