# ADR-018: Search Input UI Design Pattern

**ADR Number:** 018
**Status:** ✅ Accepted
**Date:** 2026-03-03
**Author:** LegendZhu (PO/Project Lead)
**Context:** Sprint 15 UAT — standardized search input focus behavior across all viewports

---

## Context and Problem Statement

During Sprint 15 UAT, the search input focus indicator was found to overflow its container boundary on the right side. After multiple iterations, a proven pattern was established that works reliably across desktop, tablet, and mobile. This ADR codifies this pattern as the **project-wide standard** for all search inputs.

---

## Decision

All search inputs in the G-Credit project **MUST** follow the `SearchInput` component pattern defined in `frontend/src/components/search/SearchInput.tsx`.

---

## Design Specification

### Focus Indicator

| Aspect | Implementation | Rationale |
|--------|---------------|-----------|
| **Focus style** | `border-blue-500 shadow-[inset_0_0_0_1px_rgb(59,130,246)]` | Inset box-shadow stays inside the container boundary |
| **Unfocused style** | `border-gray-300` (light) / `border-gray-600` (dark) | Subtle 1px border |
| **Native outline** | `style={{ outline: 'none', WebkitAppearance: 'none' }}` + `outline-none` class | Suppress browser native outline that overflows container |
| **Container overflow** | `overflow-hidden` on the border container | Clips any residual browser chrome |

### ❌ Patterns NOT to Use

| Avoid | Reason |
|-------|--------|
| `ring-2 ring-blue-500` | Tailwind ring uses `box-shadow` that extends **outside** the element, overflows container |
| `ring-inset` | Still visible outside container in some browsers |
| `outline outline-2` | CSS outline doesn't respect `border-radius` in older browsers, can overflow |
| `border-2` on focus | Changes element width by 1px, causes layout shift |
| Browser native `type="search"` outline | Uncontrollable, extends beyond container bounds |

### Container Structure

```
┌─────────────────────────────────────────────────┐
│ Container: border rounded-lg overflow-hidden     │
│ ┌─────┬──────────────────────────────┬─────┐    │
│ │ 🔍  │  Input (outline: none)       │  ✕  │    │
│ │44x44│  flex-1, bg-transparent      │44x44│    │
│ └─────┴──────────────────────────────┴─────┘    │
│  Focus: inset box-shadow (blue-500)              │
└─────────────────────────────────────────────────┘
```

### Sizing & Touch Targets

- Container: `min-h-[44px] h-12` (WCAG 2.5.5 — 44×44px touch target)
- Search icon: `w-11 h-11` (44px touch area, 20px visual icon)
- Clear button: `w-11 h-11` (44px touch area, 20px visual icon)

### Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Desktop** (≥1024px) | Search input inside flex row with filter dropdowns |
| **Tablet** (768–1023px) | Same as desktop, filters may wrap |
| **Mobile** (<640px) | When `expandOnMobileFocus`, expands to full-width (absolute positioned), hides filter chips during focus |

### Mobile Expansion (Optional)

When `expandOnMobileFocus` is enabled:
- `max-sm:absolute max-sm:left-0 max-sm:right-0 max-sm:mx-4 max-sm:z-sticky`
- Parent container MUST have `position: relative`
- Filter chips hidden during focus via `hidden sm:flex`

### Browser-Specific Handling

```css
/* Hide WebKit search decoration */
[&::-webkit-search-cancel-button]:hidden
[&::-webkit-search-decoration]:hidden
```

```tsx
/* Force suppress native outline */
style={{ outline: 'none', WebkitAppearance: 'none' }}
```

---

## Applies To

All search functionality in the project:

| Page | Component | Usage |
|------|-----------|-------|
| Badge Wallet | `BadgeSearchBar` → `SearchInput` | Employee badge search |
| Badge Management (Admin) | `BadgeSearchBar` → `SearchInput` | Admin badge filtering |
| User Management (Admin) | Should use `SearchInput` | User search |
| Any future search | **MUST** use `SearchInput` | Standard component |

---

## Consequences

- **Positive:** Consistent search UX across all pages and viewports
- **Positive:** No focus overflow issues on any browser
- **Positive:** WCAG compliant touch targets
- **Negative:** Developers must use `SearchInput` component, not native `<input>` for search
- **Negative:** Custom focus handling means browser default accessibility focus may differ

---

## References

- `frontend/src/components/search/SearchInput.tsx` — Canonical implementation
- `frontend/src/components/search/BadgeSearchBar.tsx` — Composition example
- ADR-016: Sprint 15 UI Design Decisions (z-index scale, UX priorities)
- WCAG 2.5.5: Target Size (Minimum 44×44px)

---

*Established during Sprint 15 UAT testing, 2026-03-03.*
