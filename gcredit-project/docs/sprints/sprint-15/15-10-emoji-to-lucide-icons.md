# Story 15.10: Full Site Emoji → Lucide Icons (P2-7)

**Status:** backlog  
**Priority:** MEDIUM  
**Estimate:** 5h  
**Wave:** 3 — UI Polish  
**Source:** P2-7 (Post-MVP UI Audit), ADR-016 DEC-016-05  
**Dependencies:** 15.3 (Sidebar migration — avoid conflicting icon changes)

---

## Story

**As a** user of G-Credit,  
**I want** consistent professional icons throughout the application instead of emoji,  
**So that** the visual quality matches enterprise application standards for Pilot deployment.

## Acceptance Criteria

1. [ ] ALL emoji icons across the entire site replaced with Lucide React icons
2. [ ] Scope includes: Dashboard cards, Toast messages, Dialog icons, Navigation items, Empty states, Error states, Status indicators
3. [ ] Consistent icon sizing (16px, 20px, 24px scale based on context)
4. [ ] Icons use design token colors where applicable
5. [ ] No emoji characters remain in component JSX (text labels are fine, e.g., "🏆" in seed data is OK)
6. [ ] Accessible: icons have `aria-hidden="true"` when decorative, `aria-label` when functional

## Tasks / Subtasks

- [ ] **Task 1: Audit all emoji usage** (AC: #1, #2)
  - [ ] Search frontend source for emoji patterns: Unicode emoji, emoji entities
  - [ ] Categorize by component and context (decorative, status, navigation)
  - [ ] Create mapping table: emoji → Lucide icon name
- [ ] **Task 2: Dashboard card icons** (AC: #1)
  - [ ] Replace dashboard stat card emojis with Lucide icons
  - [ ] Use appropriate semantic icons (Award, Users, TrendingUp, etc.)
- [ ] **Task 3: Navigation icons** (AC: #1)
  - [ ] Ensure sidebar items use Lucide icons (may already be done in 15.3)
  - [ ] Verify mobile navigation icons
- [ ] **Task 4: Status indicators** (AC: #1)
  - [ ] Badge status emojis → Lucide icons (CheckCircle, Clock, XCircle, etc.)
  - [ ] Toast message icons → consistent Lucide usage
- [ ] **Task 5: Empty/Error states** (AC: #1)
  - [ ] Empty state illustrations → Lucide icons with descriptive text
  - [ ] Error state icons → AlertTriangle, XCircle
- [ ] **Task 6: Dialog & modal icons** (AC: #1)
  - [ ] Confirmation dialogs → Lucide icons (works with 15.9)
  - [ ] Success/error feedback icons
- [ ] **Task 7: Styling standardization** (AC: #3, #4)
  - [ ] Define icon size scale: `size={16}` (inline), `size={20}` (default), `size={24}` (prominent)
  - [ ] Use `@theme` design tokens for icon colors
  - [ ] Apply `strokeWidth` consistently (default 2, thin 1.5)
- [ ] **Task 8: Accessibility audit** (AC: #6)
  - [ ] Decorative icons: `aria-hidden="true"`
  - [ ] Interactive icons (buttons): `aria-label` or wrapping `<button>` with label
- [ ] **Task 9: Final verification** (AC: #5)
  - [ ] Search for remaining emoji in JSX components
  - [ ] Verify no visual regression

## Dev Notes

### Architecture Patterns Used
- ADR-016 DEC-016-05: Full site Lucide migration
- ADR-009: Design tokens for icon colors
- Lucide React library (already a project dependency)

### Icon Mapping Examples
| Emoji | Context | Lucide Icon |
|-------|---------|-------------|
| 🏆 | Badge/Achievement | `Award` |
| 📊 | Analytics | `BarChart3` |
| 👥 | Team/Users | `Users` |
| ✅ | Success/Done | `CheckCircle` |
| ❌ | Error/Failed | `XCircle` |
| ⚠️ | Warning | `AlertTriangle` |
| 📧 | Email | `Mail` |
| 🔒 | Security/Auth | `Lock` |
| 🎉 | Celebration | `PartyPopper` |
| ⏳ | Pending | `Clock` |

### Source Tree Components
- Widespread changes across `frontend/src/pages/` and `frontend/src/components/`
- Icon imports from `lucide-react`

### Testing Standards
- Visual check all pages for consistent icon usage
- Accessibility audit (aria attributes)

### References
- ADR-016 DEC-016-05: Full Lucide migration rationale
- Lucide React docs: https://lucide.dev/guide/packages/lucide-react

## Dev Agent Record

### Agent Model Used
_To be filled during development_

### Completion Notes
_To be filled during development_

### File List
_To be filled during development_
