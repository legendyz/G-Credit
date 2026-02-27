# Story 14.9: Design Tokens Prep (P1-2)

**Status:** backlog  
**Priority:** LOW  
**Estimate:** 1h  
**Wave:** 4 — Testing + Design Tokens  
**Source:** P1-2 (Feature Completeness Audit)  
**Depends On:** —

---

## Story

**As a** frontend developer,  
**I want** any remaining hardcoded color values unified into Tailwind v4 theme tokens,  
**So that** Sprint 15 UI polish builds on a consistent design token foundation.

## Acceptance Criteria

1. [ ] Scan codebase for raw hex/rgb color values outside `index.css` `@theme` blocks
2. [ ] Replace with Tailwind token references (e.g., `text-brand-600`, `bg-neutral-100`)
3. [ ] Verify: no visual regressions in key pages (dashboard, login, badges)
4. [ ] Document any new tokens added to `@theme` block

## Tasks / Subtasks

- [ ] **Task 1: Scan for hardcoded colors** (AC: #1)
  - [ ] Search frontend `src/` for hex color patterns: `#[0-9a-fA-F]{3,8}`
  - [ ] Search for rgb/rgba patterns: `rgb\(` / `rgba\(`
  - [ ] Search for inline style color properties: `style={{ color:` / `style={{ backgroundColor:`
  - [ ] Exclude `index.css` `@theme` blocks (those are the source of truth)
  - [ ] Create list of all hardcoded colors with file locations
- [ ] **Task 2: Map to Tailwind tokens** (AC: #2)
  - [ ] For each hardcoded color, find closest existing Tailwind token
  - [ ] If no matching token exists, add to `@theme` block in `index.css`
  - [ ] Replace hardcoded values with Tailwind utility classes
- [ ] **Task 3: Visual regression check** (AC: #3)
  - [ ] Start dev server: `npm run dev`
  - [ ] Visually check: Dashboard page
  - [ ] Visually check: Login page
  - [ ] Visually check: Badge wallet / badge detail pages
  - [ ] Confirm no color changes or visual regressions
- [ ] **Task 4: Document new tokens** (AC: #4)
  - [ ] List any new tokens added to `@theme` block
  - [ ] Document token naming convention for Sprint 15 reference

## Dev Notes

### Architecture Patterns Used
- Tailwind CSS v4 theme configuration
- Design token system (`@theme` block in `index.css`)
- Utility-first CSS approach

### Source Tree Components
- `frontend/src/index.css` — `@theme` block (design token source)
- Various `.tsx` files with hardcoded colors

### Testing Standards
- Visual regression only (no automated visual tests)
- All existing frontend tests must still pass
- Focus on consistency, not redesign

### References
- P1-2 from Feature Completeness Audit
- Sprint 15 — UI overhaul will build on this foundation
- Tailwind CSS v4 documentation

## Dev Agent Record

### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
