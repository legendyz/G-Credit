# Story 11.15: CQ-006 — Frontend Design System Consistency

**Status:** backlog  
**Priority:** 🟡 MEDIUM  
**Estimate:** 3-4h  
**Source:** Code Quality Audit  

## Story

As a frontend developer,  
I want inline styles replaced with Tailwind CSS utility classes,  
So that the UI follows a consistent design system.

## Acceptance Criteria

1. [ ] All inline `style={}` objects in React components replaced with Tailwind classes
2. [ ] Color values use design tokens (CSS variables or Tailwind theme colors)
3. [ ] Spacing values use Tailwind spacing scale (p-4, mt-2, gap-3)
4. [ ] No visual regressions (manual spot-check key pages)
5. [ ] ESLint passes with `--max-warnings=0`

## Tasks / Subtasks

- [ ] **Task 1: Audit inline styles** (AC: #1)
  - [ ] `grep -rn "style={{" frontend/src/ --include="*.tsx"` — catalog all occurrences
  - [ ] Categorize: layout, color, spacing, typography, animation

- [ ] **Task 2: Replace inline styles** (AC: #1-3)
  - [ ] Convert `style={{ marginTop: '16px' }}` → `className="mt-4"`
  - [ ] Convert `style={{ color: '#333' }}` → `className="text-foreground"`
  - [ ] Convert `style={{ display: 'flex', gap: '8px' }}` → `className="flex gap-2"`
  - [ ] For dynamic styles that cannot be expressed as Tailwind, leave with comment

- [ ] **Task 3: Design token audit** (AC: #2)
  - [ ] Check for hardcoded hex colors → replace with theme tokens
  - [ ] Verify Shadcn/ui theme variables are used consistently

- [ ] **Task 4: Visual verification** (AC: #4)
  - [ ] Spot-check: Dashboard, Badge Wallet, Badge Detail, Verification page
  - [ ] Verify responsive behavior maintained

- [ ] **Task 5: Verify** (AC: #5)
  - [ ] `npm run lint` → 0 warnings
  - [ ] `npm run build`
  - [ ] `npm test`

## Dev Notes

### Source Tree Components
- **Scan directory:** `frontend/src/` — all `.tsx` files
- **Design system:** Tailwind CSS 4.x + Shadcn/ui
- **Theme:** CSS variables in `index.css` + Tailwind config

### Priorities
- Focus on most-visible pages first (Dashboard, Wallet, Badge Detail)
- Dynamic styles (e.g., calculated positions) may stay as inline — document these

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
