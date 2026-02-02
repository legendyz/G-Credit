# Story 8.5: Responsive Design Optimization

**Story ID:** Story 8.5  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** MEDIUM  
**Story Points:** 3  
**Estimated Hours:** 5h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

Current frontend is functional on desktop (1920x1080) but not optimized for mobile/tablet devices. With increasing mobile usage for professional platforms, responsive design is essential for Phase 1 MVP.

**Target Devices:**
- Mobile: 375x667 (iPhone SE) to 414x896 (iPhone 11 Pro Max)
- Tablet: 768x1024 (iPad) to 1024x1366 (iPad Pro)
- Desktop: 1280x720 to 2560x1440

**Reference:** PRD NFR-11 (Responsive Design), UX Design Specification wireframes

---

## User Story

**As a** User on any device (mobile, tablet, desktop),  
**I want** the G-Credit platform to adapt to my screen size,  
**So that** I can use all features comfortably without horizontal scrolling or tiny buttons.

---

## Acceptance Criteria

### AC1: Mobile-First Layout (320px - 767px)
**Given** I access the site on a mobile device  
**When** I navigate to any page  
**Then** the layout adapts:

- **Navigation:**
  - Hamburger menu icon (☰) replaces desktop nav
  - Slide-out drawer navigation on mobile
  - User avatar menu stacks vertically
  
- **Badge Cards:**
  - Single column layout
  - Cards expand to full width (minus 16px padding)
  - Touch targets minimum 44x44px (Apple HIG)
  
- **Forms:**
  - Input fields stack vertically
  - Labels above inputs (not side-by-side)
  - Submit buttons full width
  
- **Modals:**
  - Full-screen modals on mobile
  - Close button in top-right corner
  - Scrollable content area

### AC2: Tablet Layout (768px - 1023px)
**Given** I access the site on a tablet  
**When** I view the dashboard or badge wallet  
**Then** the layout adapts:

- **Navigation:**
  - Condensed top navigation (shorter labels)
  - Avatar menu remains in top-right
  
- **Badge Cards:**
  - 2-column grid layout
  - Card size: ~360px width each
  - 16px gap between cards
  
- **Dashboard:**
  - Metrics cards: 2 columns
  - Recent activity: Full width below metrics
  
- **Modals:**
  - 80% viewport width
  - Centered with backdrop overlay

### AC3: Desktop Layout (1024px+)
**Given** I access the site on a desktop  
**When** I view any page  
**Then** the layout uses:

- **Navigation:**
  - Full horizontal navigation
  - All menu items visible
  - User avatar menu in top-right
  
- **Badge Cards:**
  - 3-column grid (1280px-1599px)
  - 4-column grid (1600px+)
  - Card size: ~300px width
  
- **Dashboard:**
  - Metrics cards: 4 columns
  - Recent activity: Right sidebar (30% width)
  
- **Modals:**
  - Max width 600px (centered)
  - Backdrop overlay

### AC4: Touch-Friendly Interactions
**Given** I am using a touch device  
**When** I interact with UI elements  
**Then** touch targets meet standards:

- **Minimum Touch Target:** 44x44px (Apple HIG, WCAG AAA)
- **Button Padding:** 12px vertical, 16px horizontal
- **Input Height:** Minimum 44px
- **Spacing:** 8px between tappable elements
- **Hover States:** Replaced with active states on mobile

### AC5: Responsive Images & Icons
**Given** I view badge images on any device  
**When** images load  
**Then** they are optimized:

- **Badge Images:**
  - Serve appropriate resolution (1x, 2x, 3x)
  - Lazy loading for off-screen images
  - Placeholder during load
  
- **Icons:**
  - Vector SVG icons (scale without quality loss)
  - Icon sizes: 16px (mobile), 20px (tablet), 24px (desktop)

### AC6: Responsive Typography
**Given** I read content on different devices  
**When** viewing text  
**Then** font sizes adapt:

| Element | Mobile (375px) | Tablet (768px) | Desktop (1280px+) |
|---------|----------------|----------------|-------------------|
| h1      | 24px          | 32px           | 40px             |
| h2      | 20px          | 24px           | 32px             |
| h3      | 18px          | 20px           | 24px             |
| Body    | 14px          | 16px           | 16px             |
| Small   | 12px          | 14px           | 14px             |

**Line Height:** 1.5 (body), 1.2 (headings)  
**Letter Spacing:** 0 (body), -0.01em (headings)

---

## Tasks / Subtasks

### Task 1: Mobile Navigation (AC1) - 1.5h
- [ ] Create `MobileNav.tsx` component
  - [ ] Hamburger menu icon (☰)
  - [ ] Slide-out drawer with animation
  - [ ] Close on outside click or route change
- [ ] Update `Layout.tsx`
  - [ ] Conditionally render desktop/mobile nav
  - [ ] Use media query: `@media (max-width: 767px)`
- [ ] Write tests (6 tests: open/close, navigation, touch)

### Task 2: Responsive Grid System (AC1, AC2, AC3) - 1h
- [ ] Update `TimelineView.tsx` badge grid
  - [ ] Mobile: 1 column
  - [ ] Tablet: 2 columns
  - [ ] Desktop: 3-4 columns
  - [ ] Use Tailwind responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- [ ] Update `BadgeManagementPage.tsx` table
  - [ ] Mobile: Card layout (stacked)
  - [ ] Desktop: Table layout
- [ ] Write tests (4 tests: breakpoint behavior)

### Task 3: Responsive Modals (AC1, AC2, AC3) - 1h
- [ ] Update modal components (`BadgeDetailModal`, `BadgeShareModal`, `RevokeBadgeModal`)
  - [ ] Mobile: Full-screen modal
  - [ ] Tablet/Desktop: Centered modal (max-width)
  - [ ] Use Tailwind: `w-full md:w-80 lg:max-w-2xl`
- [ ] Add close button positioning
  - [ ] Mobile: Fixed top-right
  - [ ] Desktop: Absolute top-right
- [ ] Write tests (5 tests)

### Task 4: Touch-Friendly UI (AC4) - 0.5h
- [ ] Audit all interactive elements
  - [ ] Ensure 44x44px minimum touch targets
  - [ ] Update button padding: `py-3 px-4`
  - [ ] Update input height: `h-11` (44px)
- [ ] Update hover states
  - [ ] Replace `:hover` with `:active` on mobile
  - [ ] Use media query: `@media (hover: hover)`
- [ ] Write accessibility tests (3 tests)

### Task 5: Responsive Images (AC5) - 0.5h
- [ ] Add lazy loading to badge images
  - [ ] Use `loading="lazy"` attribute
  - [ ] Add placeholder component (skeleton)
- [ ] Optimize image resolution
  - [ ] Serve 400px images for mobile
  - [ ] Serve 800px images for desktop @2x
- [ ] Update `BadgeImage.tsx` component
- [ ] Write tests (3 tests)

### Task 6: Responsive Typography (AC6) - 0.5h
- [ ] Update Tailwind config with responsive font sizes
  - [ ] Use `text-2xl md:text-3xl lg:text-4xl` pattern
  - [ ] Define font-size scale in `tailwind.config.js`
- [ ] Apply to all heading components
  - [ ] h1: `text-2xl md:text-3xl lg:text-4xl`
  - [ ] h2: `text-xl md:text-2xl lg:text-3xl`
  - [ ] h3: `text-lg md:text-xl lg:text-2xl`
- [ ] Write tests (2 tests)

---

## Testing Strategy

### Device Testing
- [ ] **Mobile Devices:**
  - [ ] iPhone SE (375x667) - smallest target
  - [ ] iPhone 12 (390x844) - common
  - [ ] Samsung Galaxy S21 (360x800) - Android
  
- [ ] **Tablets:**
  - [ ] iPad (768x1024) - portrait
  - [ ] iPad Pro (1024x1366) - landscape
  
- [ ] **Desktop:**
  - [ ] 1280x720 (min desktop)
  - [ ] 1920x1080 (common)
  - [ ] 2560x1440 (large)

### Browser DevTools Testing
- [ ] Chrome DevTools responsive mode
- [ ] Firefox Responsive Design Mode
- [ ] Safari Web Inspector (for iOS testing)

### Automated Testing
- [ ] **Responsive Screenshot Tests:**
  - [ ] Capture screenshots at all breakpoints
  - [ ] Compare with baseline (visual regression)
  
- [ ] **Component Tests:**
  - [ ] Test media query behavior with `matchMedia` mock
  - [ ] Test touch event handling

---

## Dev Notes

### Architecture Patterns Used
- **Mobile-First CSS:** Start with mobile styles, add desktop overrides
- **Tailwind Responsive Classes:** `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Container Queries (Future):** Use when browser support improves

### Tailwind Breakpoints
```javascript
// tailwind.config.js
theme: {
  screens: {
    'sm': '640px',  // Small devices
    'md': '768px',  // Tablets
    'lg': '1024px', // Desktops
    'xl': '1280px', // Large desktops
    '2xl': '1536px' // Extra large
  }
}
```

### Source Tree Components
```
src/
├── components/
│   ├── layout/
│   │   ├── MobileNav.tsx (NEW)
│   │   └── Layout.tsx (UPDATED)
│   ├── wallet/
│   │   └── TimelineView.tsx (UPDATED - responsive grid)
│   └── modals/
│       ├── BadgeDetailModal.tsx (UPDATED - responsive width)
│       └── BadgeShareModal.tsx (UPDATED)
└── styles/
    └── responsive.css (NEW - custom media queries)
```

### Testing Standards
- **Component Tests:** 23 tests (navigation, grid, modals, touch, images, typography)
- **Visual Tests:** 18 screenshots (6 pages × 3 breakpoints)
- **Manual Tests:** 9 device tests (3 mobile + 2 tablet + 2 desktop + 2 browsers)
- **Total:** ~50 test points

---

## Definition of Done

- [ ] All 6 Acceptance Criteria met
- [ ] 23 component tests passing
- [ ] Tested on 9 device configurations
- [ ] No horizontal scrolling on any viewport
- [ ] All touch targets >= 44x44px
- [ ] Images lazy-loaded and optimized
- [ ] Typography scales correctly across breakpoints
- [ ] Code review complete
- [ ] Responsive design documented in README
- [ ] Story file updated with completion notes

---

## Dependencies

**Blocked By:**
- Story 8.1 (Dashboard components need responsive layout)
- Story 8.2 (Search components need mobile UI)
- Story 8.3 (Accessibility must work on mobile)

**Blocks:**
- None (but improves all features)

---

## References

- PRD NFR-11: Responsive Design Requirements
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [WCAG 2.1 - Target Size (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- UX Design Specification: Wireframes (mobile views)
