# Story 15.5: Inline Styles → Tailwind Classes (P1-1)

**Status:** backlog  
**Priority:** MEDIUM  
**Estimate:** 2h  
**Wave:** 3 — UI Polish  
**Source:** P1-1 (Post-MVP UI Audit)  
**Dependencies:** 15.3 (Sidebar migration should be complete to avoid merge conflicts)

---

## Story

**As a** developer maintaining the frontend codebase,  
**I want** all inline styles converted to Tailwind CSS classes,  
**So that** the styling is consistent, maintainable, and uses the design token system.

## Acceptance Criteria

1. [ ] All inline `style={{}}` attributes in React components replaced with Tailwind classes
2. [ ] No visual regression — components look identical before and after
3. [ ] Dynamic styles (computed values) use Tailwind's arbitrary value syntax `[value]` or CSS variables
4. [ ] No new CSS files created — use only Tailwind classes and `@theme` tokens
5. [ ] ESLint passes with 0 errors

## Tasks / Subtasks

- [ ] **Task 1: Audit inline styles** (AC: #1)
  - [ ] Search codebase for `style={{` and `style={` patterns
  - [ ] Categorize: static (easy conversion) vs dynamic (needs careful handling)
  - [ ] Create list of files and components to update
- [ ] **Task 2: Convert static inline styles** (AC: #1, #2)
  - [ ] Replace padding/margin/width/height with Tailwind utilities
  - [ ] Replace colors with `@theme` design tokens or Tailwind color classes
  - [ ] Replace flex/grid layouts with Tailwind layout classes
- [ ] **Task 3: Handle dynamic styles** (AC: #3)
  - [ ] Computed widths/heights → CSS variables or Tailwind arbitrary values
  - [ ] Conditional colors → Tailwind conditional classes (cn() utility)
  - [ ] Animation-related styles → Tailwind animation classes
- [ ] **Task 4: Visual verification** (AC: #2)
  - [ ] Compare before/after screenshots for modified components
  - [ ] Verify responsive behavior unchanged
- [ ] **Task 5: Cleanup** (AC: #4, #5)
  - [ ] Remove any orphaned CSS that was backing inline styles
  - [ ] Run ESLint + Prettier

## Dev Notes

### Architecture Patterns Used
- ADR-009: Tailwind v4 CSS-first configuration
- `cn()` utility (from `lib/utils.ts`) for conditional class merging
- `@theme` design tokens for colors

### Testing Standards
- Visual regression check (manual or screenshot comparison)
- ESLint pass

### References
- ADR-009: Tailwind v4 design tokens
- Sprint 14 Story 14.9: Design tokens prep

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
