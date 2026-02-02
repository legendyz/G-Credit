# Story 8.3 Code Review Follow-up (Dev Reference)

**Story:** 8.3 WCAG 2.1 Accessibility
**Date:** 2026-02-02
**Reviewer:** Amelia (Dev Agent)

---

## High Priority Fixes (Must Do)

1. **Apply Layout with Skip Link + Landmarks across routes**
   - Current `Layout` is not used in `App.tsx`, so skip links/landmarks are not active.
   - Required: wrap protected routes/pages with `Layout` or integrate skip link + landmarks into the root layout used by all routes.
   - Files:
     - `frontend/src/components/layout/Layout.tsx`
     - `frontend/src/App.tsx`

2. **Keyboard accessibility in Timeline cards (non-grid view)**
   - `BadgeTimelineCard` is a clickable `div` but not focusable and has no keyboard handlers.
   - Required: add `tabIndex={0}`, `role="button"`, and `onKeyDown` to support Enter/Space activation.
   - Files:
     - `frontend/src/components/TimelineView/BadgeTimelineCard.tsx`

3. **WCAG contrast enforcement on Timeline status badge**
   - Timeline cards use hardcoded colors (`bg-yellow-500`, etc.) that aren’t WCAG‑verified.
   - Required: replace custom status chip with `StatusBadge` component or update colors to the WCAG AA palette.
   - Files:
     - `frontend/src/components/TimelineView/BadgeTimelineCard.tsx`
     - `frontend/src/components/ui/StatusBadge.tsx`

4. **Test coverage claims are currently false**
   - Story states new tests exist (52 tests) but no new test files were added.
   - Required: add tests for keyboard navigation, focus trap, tab keyboard navigation, and skip links. Update story counts accordingly.
   - Files:
     - `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`
     - `frontend/src/hooks/useFocusTrap.ts`
     - `frontend/src/hooks/useKeyboardNavigation.ts`

---

## Medium Priority Fixes (Should Do)

5. **Grid keyboard navigation mismatch with responsive columns**
   - `useKeyboardNavigation` uses `columns: 3` even when grid is 1–2 columns.
   - Required: dynamically set columns based on screen size or compute from CSS.
   - Files:
     - `frontend/src/components/TimelineView/TimelineView.tsx`

6. **Accessibility components created but not fully applied**
   - `FormError`, `SkipLink`, and `StatusBadge` exist but are not consistently used in active forms/pages.
   - Required: wire into actual UI usage (Login, modals, wallet, etc.) so AC2/AC4 are met.
   - Files:
     - `frontend/src/components/ui/FormError.tsx`
     - `frontend/src/components/ui/SkipLink.tsx`
     - `frontend/src/components/ui/StatusBadge.tsx`

7. **Story status mismatch with sprint tracking**
   - Story file says DONE, but `sprint-status.yaml` marks 8.3 as backlog.
   - Required: update sprint status once fixes + tests are complete.
   - Files:
     - `docs/sprints/sprint-8/8-3-wcag-accessibility.md`
     - `docs/sprints/sprint-8/sprint-status.yaml`

---

## Suggested Validation Checklist

- [ ] Skip link is first focusable element on every page
- [ ] Landmark roles exist on all main pages
- [ ] Timeline cards are focusable and keyboard-activatable
- [ ] All status badges pass 4.5:1 contrast
- [ ] Grid keyboard navigation works for 1/2/3 columns
- [ ] Tests added and passing for focus trap / keyboard nav / tabs
- [ ] Story and sprint-status updated consistently

---

## Notes

- Keep all changes aligned with Story 8.3 AC1–AC6.
- Avoid scope creep into other stories unless documented in the story file.
