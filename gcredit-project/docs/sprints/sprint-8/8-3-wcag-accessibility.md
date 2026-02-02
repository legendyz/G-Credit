# Story 8.3: WCAG 2.1 AA Accessibility Compliance

**Story ID:** Story 8.3  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** HIGH  
**Story Points:** 4  
**Estimated Hours:** 6h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

Sprint 7 delivered basic ARIA labels on forms (Story 0.2a). This story achieves full WCAG 2.1 Level AA compliance across the entire application, addressing all UX-P1 accessibility technical debt.

**Technical Debt Resolution:**
- UX-P1-004: Filter label for accessibility
- UX-P1-005: Grid cards keyboard accessible
- UX-P1-006: Share modal tabs keyboard navigation
- UX-P1-007: Status badge color contrast (4.5:1 minimum)

**Reference:** WCAG 2.1 AA Standard, Sprint 7 UX Review

---

## User Story

**As a** User with disabilities (screen reader, keyboard-only, colorblind),  
**I want** the G-Credit platform to be fully accessible,  
**So that** I can use all features independently without barriers.

---

## Acceptance Criteria

### AC1: Keyboard Navigation (WCAG 2.1.1)
**Given** I navigate the site using only keyboard (Tab, Enter, Esc, Arrow keys)  
**When** I interact with any component  
**Then** I can:

- **Tab Navigation:**
  - All interactive elements are reachable via Tab
  - Tab order follows visual layout (logical sequence)
  - Focus indicator visible on all elements (2px outline)
  
- **Grid/Card Navigation (UX-P1-005):**
  - Badge cards in wallet/catalog have `tabIndex={0}`
  - Arrow keys navigate between cards
  - Enter/Space activates card (opens modal)
  
- **Modal Dialogs:**
  - Focus trapped inside modal when open
  - Esc key closes modal
  - Focus returns to trigger button on close
  
- **Share Modal Tabs (UX-P1-006):**
  - Arrow Left/Right navigate between tabs
  - Home/End jump to first/last tab
  - Tab content updates immediately

### AC2: Screen Reader Support (WCAG 1.3.1, 4.1.2)
**Given** I use a screen reader (NVDA, JAWS, VoiceOver)  
**When** I navigate the site  
**Then** I hear:

- **Semantic HTML:**
  - Proper heading hierarchy (h1 → h2 → h3)
  - Landmarks: `<nav>`, `<main>`, `<aside>`, `<footer>`
  - Lists use `<ul>`, `<ol>`, `<li>`
  
- **ARIA Labels:**
  - All buttons have descriptive labels
  - Icons have `aria-label` or `aria-labelledby`
  - Form inputs have associated `<label>` (UX-P1-004)
  - Complex widgets have `role`, `aria-expanded`, `aria-selected`
  
- **Live Regions:**
  - Toast notifications use `role="alert"`
  - Loading states announced with `aria-live="polite"`
  - Error messages use `aria-describedby`

### AC3: Color Contrast (WCAG 1.4.3) - UX-P1-007
**Given** I have low vision or color blindness  
**When** I view status indicators  
**Then** all text has sufficient contrast:

- **Minimum Contrast Ratios:**
  - Normal text (14-18px): 4.5:1
  - Large text (18px+ or 14px+ bold): 3:1
  - UI components (buttons, icons): 3:1
  
- **Status Badge Fixes (UX-P1-007):**
  - ❌ OLD Yellow badge: `#FCD34D` on white = 1.8:1 (FAIL)
  - ✅ NEW Dark yellow: `#B45309` on white = 5.2:1 (PASS)
  - All status colors tested: CLAIMED (green), PENDING (yellow), REVOKED (red), EXPIRED (gray)

### AC4: Form Accessibility (WCAG 3.3.1, 3.3.2)
**Given** I interact with forms  
**When** I fill out inputs  
**Then** forms are accessible:

- **Labels (UX-P1-004):**
  - All inputs have visible `<label>` with `htmlFor` attribute
  - Placeholder text is NOT the only label
  - Required fields marked with `aria-required="true"`
  
- **Error Handling:**
  - Error messages linked via `aria-describedby`
  - Error summary at top of form with `role="alert"`
  - Inline validation triggers on blur, not on every keystroke
  
- **Help Text:**
  - Instructions provided before form (not just error messages)
  - Complex fields have `aria-describedby` pointing to help text

### AC5: Focus Management & Skip Links (WCAG 2.4.1)
**Given** I am a keyboard user  
**When** I load any page  
**Then** I have focus management features:

**Focus Indicator Specifications:**
- Style: 3px solid outline (not dotted/dashed)
- Color: Primary blue (#3B82F6) for light theme, light blue (#60A5FA) for dark theme
- Contrast: Minimum 3:1 against background (WCAG 2.1 AA)
- Offset: 2px outset (doesn't overlap element content)
- Border radius: Matches element border-radius + 2px
- Animation: Smooth transition (150ms ease-in-out)
- Visibility: Always visible for keyboard users
- Implementation: CSS `outline` property (not `border` - doesn't affect layout)

**Example CSS:**
```css
*:focus {
  outline: 3px solid #3B82F6;
  outline-offset: 2px;
  transition: outline 150ms ease-in-out;
}

*:focus:not(:focus-visible) {
  outline: none; /* Hide for mouse users on supported browsers */
}
```

**Skip Link Specifications:**
- Primary skip link: "Skip to main content" → jumps to `<main id="main-content">`
- Secondary skip link (if applicable): "Skip to navigation" → jumps to `<nav id="main-navigation">`
- Position: First focusable element in `<body>`, visually hidden until focused
- Visibility: Shows on keyboard focus (absolute position, z-index 9999, white background, black text)
- Styling: Prominent button-style (not just underlined text)
- Action: On click/Enter, focus moves to target landmark AND scrolls into view
- Landmark regions required:
  - `<header role="banner">` - Site header
  - `<nav role="navigation" aria-label="Main navigation">` - Primary nav
  - `<main role="main" id="main-content" tabindex="-1">` - Main content (tabindex for focus)
  - `<aside role="complementary">` - Sidebar (if exists)
  - `<footer role="contentinfo">` - Site footer

**Given** I am a keyboard user  
**When** I load any page  
**Then** I can:

- **Skip Navigation:**
  - "Skip to main content" link appears on first Tab press
  - Link jumps focus to `<main>` element
  - Visually hidden until focused
  
- **Focus Management:**
  - Focus never lost (always on a visible element)
  - Modal open: focus moves to modal
  - Modal close: focus returns to trigger
  - Page navigation: focus moves to page heading

### AC6: Accessibility Testing & Documentation
**Given** development is complete  
**When** I run accessibility audits  
**Then** all tools pass:

- **Automated Testing:**
  - Lighthouse Accessibility score >= 95
  - axe DevTools: 0 violations
  - WAVE: 0 errors
  
- **Manual Testing:**
  - NVDA screen reader testing (Windows)
  - VoiceOver testing (macOS)
  - Keyboard-only navigation testing
  - Color contrast verification (contrast checker tool)

---

## Tasks / Subtasks

### Task 1: Keyboard Navigation Enhancements (AC1) - 2h
- [ ] **Grid/Card Navigation (UX-P1-005):**
  - [ ] Update `TimelineView.tsx` badge cards
    - [ ] Add `tabIndex={0}` to all cards
    - [ ] Implement arrow key navigation with `onKeyDown`
    - [ ] Add Enter/Space activation
    - [ ] Write tests (4 tests)
  - [ ] Update `BadgeCatalog` (future-ready)
  
- [ ] **Share Modal Tabs (UX-P1-006):**
  - [ ] Update `BadgeShareModal.tsx`
    - [ ] Implement arrow key navigation between tabs
    - [ ] Add Home/End key support
    - [ ] Update `aria-selected` dynamically
    - [ ] Write tests (6 tests)
  
- [ ] **Modal Focus Management:**
  - [ ] Create `useFocusTrap` hook
  - [ ] Apply to all modals (BadgeDetail, Share, Revoke, Report)
  - [ ] Test Esc key and outside-click behaviors
  - [ ] Write tests (5 tests)

### Task 2: Screen Reader Support (AC2) - 1.5h
- [ ] **Semantic HTML Audit:**
  - [ ] Add landmark roles to layout components
  - [ ] Fix heading hierarchy (scan all pages)
  - [ ] Ensure lists use `<ul>` / `<ol>`
  
- [ ] **ARIA Labels:**
  - [ ] Audit all icon buttons (add `aria-label`)
  - [ ] Add `aria-labelledby` to complex widgets
  - [ ] Add `aria-live` to toast notifications
  - [ ] Add `aria-describedby` to error messages
  
- [ ] **Live Regions:**
  - [ ] Update `ToastProvider` with `role="alert"`
  - [ ] Add `aria-live="polite"` to loading spinners
  - [ ] Write screen reader tests (manual)

### Task 3: Color Contrast Fixes (AC3) - UX-P1-007 - 1h
- [ ] **Status Badge Color Updates:**
  - [ ] Update `StatusBadge.tsx` component
    - [ ] Replace yellow: `#FCD34D` → `#B45309`
    - [ ] Verify green (CLAIMED): `#10B981` = 4.5:1 ✓
    - [ ] Verify red (REVOKED): `#EF4444` = 4.5:1 ✓
    - [ ] Verify gray (EXPIRED): `#6B7280` = 4.6:1 ✓
  - [ ] Run contrast checker on all UI components
  - [ ] Document color palette in design system
  
- [ ] **Text Contrast Audit:**
  - [ ] Check all text colors against backgrounds
  - [ ] Fix any violations (buttons, links, labels)
  - [ ] Test in color blindness simulator

### Task 4: Form Accessibility (AC4) - UX-P1-004 - 1h
- [ ] **Label Fixes (UX-P1-004):**
  - [ ] Add `<label>` to all form inputs
  - [ ] Update `TimelineView` filter select
  - [ ] Update `BadgeShareModal` form inputs
  - [ ] Update `RevokeBadgeModal` form
  
- [ ] **Error Handling:**
  - [ ] Add `aria-describedby` to error messages
  - [ ] Create `FormError` component with `role="alert"`
  - [ ] Test error message announcements
  
- [ ] **Required Fields:**
  - [ ] Add `aria-required="true"` to required inputs
  - [ ] Add visual `*` indicator
  - [ ] Write tests (5 tests)

### Task 5: Focus Management & Skip Links (AC5) - 0.5h
- [ ] **Skip Navigation:**
  - [ ] Add "Skip to main content" link in `Layout.tsx`
  - [ ] Style with `.sr-only` class (visible on focus)
  - [ ] Test keyboard focus behavior
  
- [ ] **Focus Restoration:**
  - [ ] Ensure focus returns after modal close
  - [ ] Test page navigation focus behavior
  - [ ] Write tests (3 tests)

---

## Testing & Validation

### Automated Tools (AC6)
- [ ] **Lighthouse Accessibility Audit:**
  - [ ] Run on all major pages (Login, Wallet, Dashboard, Verify)
  - [ ] Target score: >= 95
  - [ ] Fix all flagged issues
  
- [ ] **axe DevTools:**
  - [ ] Install browser extension
  - [ ] Scan all pages
  - [ ] 0 violations required
  
- [ ] **WAVE:**
  - [ ] Scan public verification page
  - [ ] Fix all errors (warnings acceptable)

### Manual Testing
- [ ] **Screen Reader Testing:**
  - [ ] NVDA on Windows (primary)
  - [ ] VoiceOver on macOS (secondary)
  - [ ] Test: Login flow, Badge claiming, Dashboard navigation
  
- [ ] **Keyboard Testing:**
  - [ ] Unplug mouse, navigate entire site with keyboard
  - [ ] Document any unreachable elements
  
- [ ] **Color Contrast:**
  - [ ] Use WebAIM Contrast Checker
  - [ ] Test with color blindness simulators (Deuteranopia, Protanopia)

---

## Dev Notes

### Architecture Patterns Used
- **useFocusTrap Hook:** Reusable focus management for modals
- **ARIA Composition:** Use `aria-labelledby` + `aria-describedby` for complex relationships
- **Semantic HTML First:** Use native elements before adding ARIA

### Source Tree Components
```
src/
├── components/
│   ├── ui/
│   │   ├── StatusBadge.tsx (UPDATED - color contrast)
│   │   ├── FormError.tsx (NEW - accessible error display)
│   │   └── SkipLink.tsx (NEW)
│   ├── layout/
│   │   └── Layout.tsx (UPDATED - skip link + landmarks)
│   ├── wallet/
│   │   └── TimelineView.tsx (UPDATED - keyboard nav)
│   └── modals/
│       ├── BadgeShareModal.tsx (UPDATED - tab keyboard nav)
│       └── BadgeDetailModal.tsx (UPDATED - focus trap)
├── hooks/
│   └── useFocusTrap.ts (NEW)
└── styles/
    └── accessibility.css (NEW - .sr-only, focus styles)
```

### Testing Standards
- **Component Tests:** 23 tests (keyboard nav, ARIA, focus)
- **Manual Tests:** 6 scenarios (screen reader, keyboard, contrast)
- **Lighthouse Audits:** 4 pages (Login, Wallet, Dashboard, Verify)
- **Total:** ~29 tests + audits

### Technical Debt Resolved
- ✅ UX-P1-004: Filter accessibility labels
- ✅ UX-P1-005: Grid keyboard navigation
- ✅ UX-P1-006: Share modal tab navigation
- ✅ UX-P1-007: Status badge color contrast

---

## Definition of Done

- [ ] All 6 Acceptance Criteria met
- [ ] 29 tests passing (automated + manual)
- [ ] Lighthouse Accessibility score >= 95 on all pages
- [ ] axe DevTools: 0 violations
- [ ] WAVE: 0 errors
- [ ] NVDA screen reader testing complete (documented)
- [ ] Keyboard-only navigation works 100%
- [ ] All status colors pass 4.5:1 contrast
- [ ] Code review complete
- [ ] Accessibility documentation added to README
- [ ] Story file updated with completion notes

---

## Dependencies

**Blocked By:**
- Story 8.1 (Dashboard components need accessibility)
- Story 8.2 (Search components need accessibility)

**Blocks:**
- None (but improves usability of all features)

---

## References

- [WCAG 2.1 Level AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?levels=aa)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- technical-debt-from-reviews.md (UX-P1-004~007)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse Accessibility](https://developers.google.com/web/tools/lighthouse)
