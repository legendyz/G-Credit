# Story 15.11: z-index Scale in Tailwind Theme (P2-8)

**Status:** backlog  
**Priority:** LOW  
**Estimate:** 1h  
**Wave:** 3 — UI Polish  
**Source:** P2-8 (Post-MVP UI Audit)  
**Dependencies:** 15.3 (Sidebar — introduces new z-index layers)

---

## Story

**As a** developer building UI components with overlapping layers,  
**I want** a standardized z-index scale defined in the Tailwind theme,  
**So that** modals, toasts, sidebars, and dropdowns layer correctly without ad-hoc values.

## Acceptance Criteria

1. [ ] z-index scale defined in `tailwind.config.js` or `@theme` block
2. [ ] Scale covers: base(0), dropdown(10), sticky(20), sidebar(30), modal(40), toast(50), tooltip(60)
3. [ ] All existing ad-hoc z-index values migrated to use scale tokens
4. [ ] Sidebar z-index fits correctly between sticky and modal layers
5. [ ] Sonner toast renders above modals
6. [ ] No z-index conflicts between components

## Tasks / Subtasks

- [ ] **Task 1: Define z-index scale** (AC: #1, #2)
  - [ ] Add z-index tokens to Tailwind theme (`@theme` or `tailwind.config.js`)
  - [ ] Scale: `z-base: 0`, `z-dropdown: 10`, `z-sticky: 20`, `z-sidebar: 30`, `z-modal: 40`, `z-toast: 50`, `z-tooltip: 60`
- [ ] **Task 2: Audit existing z-index usage** (AC: #3)
  - [ ] Search for `z-index`, `z-[` in frontend source
  - [ ] Map each usage to appropriate scale token
- [ ] **Task 3: Migrate values** (AC: #3, #4, #5)
  - [ ] Replace hardcoded z-index values with Tailwind z-index classes
  - [ ] Verify Sidebar uses `z-sidebar` (z-30)
  - [ ] Verify Sonner toast portal uses `z-toast` (z-50)
  - [ ] Verify modals use `z-modal` (z-40)
- [ ] **Task 4: Visual verification** (AC: #6)
  - [ ] Open sidebar + modal simultaneously → modal above sidebar
  - [ ] Open toast while modal open → toast above modal
  - [ ] Dropdown in content area → above content, below sidebar

## Dev Notes

### z-index Scale
```
z-base:     0    — normal content flow
z-dropdown: 10   — dropdown menus, popovers
z-sticky:   20   — sticky headers, floating action buttons
z-sidebar:  30   — sidebar navigation
z-modal:    40   — dialog/modal overlays
z-toast:    50   — toast notifications (Sonner)
z-tooltip:  60   — tooltips (highest)
```

### Source Tree Components
- `frontend/tailwind.config.js` or `frontend/src/index.css` `@theme` block (modified)
- Various components with z-index values (modified)

### References
- P2-8 from Post-MVP UI audit
- ADR-009: Tailwind v4 `@theme` configuration

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
