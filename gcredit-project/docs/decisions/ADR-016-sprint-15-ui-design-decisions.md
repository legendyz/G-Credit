# ADR-016: Sprint 15 UI Design Decisions

**ADR Number:** 016
**Status:** ✅ Accepted
**Date:** 2026-02-27
**Author:** John (PM) + Sally (UX) + Winston (Architect)
**Deciders:** LegendZhu (PO/Project Lead), John (PM), Winston (Architect), Sally (UX), Bob (SM)
**Context:** Sprint 14-16 planning — Sprint 15 UI Overhaul design review meeting

---

## Context and Problem Statement

Sprint 15 implements TD-035 (Dashboard Composite View) and a comprehensive UI overhaul. Five design questions were raised during the multi-agent review meeting. All five were decided by the PO.

---

## Decisions

### DEC-016-01: Dashboard Default Tab — Always "My Badges"

**Decision:** All users see the "My Badges" tab by default upon login, regardless of role.

**Tab Computation Logic (ADR-015 dual-dimension model):**

| Tab | Visibility Condition | Content Component |
|-----|---------------------|-------------------|
| My Badges | Always (all users) | `EmployeeDashboard` |
| Team Overview | `isManager === true` | `ManagerDashboard` |
| Issuance | `role === 'ISSUER' \|\| role === 'ADMIN'` | `IssuerDashboard` |
| Administration | `role === 'ADMIN'` | `AdminDashboard` |

**Rationale:**
- G-Credit is an "everyone has badges" platform — personal achievement comes first
- Even ADMIN users benefit from seeing their own badges before switching to management
- Future enhancement: `localStorage` can remember last-selected tab (not in initial scope)

---

### DEC-016-02: Navigation — Migrate to Sidebar Layout

**Decision:** Replace the current top-navigation (`Navbar.tsx`) with a persistent, collapsible sidebar layout.

**Estimated Effort:** ~12h (increased from original 4h Dropdown plan)

**Rationale:**
- This was an earlier architectural decision that had been deferred
- Current top nav is already overflowing with 9+ links for ADMIN role
- Sidebar provides clear visual grouping, better scalability for future features
- Standard enterprise application pattern (Microsoft 365, Azure Portal, etc.)

**Sidebar Design Specifications:**

```
┌────────────────────────────────────────────────────┐
│ ┌──────────┐                                        │
│ │          │  Main Content Area                     │
│ │ G-Credit │                                        │
│ │          │                                        │
│ │ ──────── │                                        │
│ │ Dashboard│                                        │
│ │ Wallet   │                                        │
│ │          │                                        │
│ │ ISSUANCE │  (group header — visible to            │
│ │ Templates│   ISSUER + ADMIN only)                 │
│ │ Badges   │                                        │
│ │ Bulk     │                                        │
│ │ Analytics│                                        │
│ │          │                                        │
│ │ ADMIN    │  (group header — visible to            │
│ │ Users    │   ADMIN only)                          │
│ │ Skills   │                                        │
│ │ Categs   │                                        │
│ │ Milesto. │                                        │
│ │          │                                        │
│ │ ──────── │                                        │
│ │ Profile  │                                        │
│ │ Sign Out │                                        │
│ └──────────┘                                        │
└────────────────────────────────────────────────────┘
```

**Key Requirements:**
- Collapsible (icon-only mode) with toggle button
- Responsive: on mobile (<768px), sidebar becomes MobileNav drawer (existing pattern)
- Navigation groups controlled by dual-dimension permissions:
  - "Team" group: visible when `isManager === true`
  - "Issuance" group: visible when `role in [ADMIN, ISSUER]`
  - "Admin" group: visible when `role === ADMIN`
- Use shadcn/ui `Sidebar` component (already available via `components.json`)
- Active state indicator (left border highlight or background)

**Impact on Existing Components:**
- `Navbar.tsx` → **replaced** by new `AppSidebar.tsx`
- `Layout.tsx` → refactored to use `SidebarProvider` + `SidebarInset` pattern
- `MobileNav.tsx` → **kept** for mobile breakpoint, updated to match sidebar structure
- All `MANAGER` references removed (uses `isManager` from auth store)

---

### DEC-016-03: Pagination Strategy — Server-Side + Infinite Scroll

**Decision:**
- **Badge Template List (`BadgeTemplateListPage`):** Traditional server-side pagination with page controls
- **Badge Wallet (`TimelineView`):** Cursor-based pagination with infinite scroll (IntersectionObserver)

**Rationale:**
- Template list is a management table — page controls fit the interaction pattern
- Wallet is a visual timeline — infinite scroll provides fluid browsing experience
- Backend `PaginationDto` infrastructure already exists from Sprint 8; cursor pagination extends it
- Pilot-scale data (<100 templates, <500 badges per user) makes both approaches viable; chosen for UX quality, not performance necessity

**Backend Changes:**
- Templates API: Add `page` + `pageSize` query params (reuse existing `PaginationDto`)
- Wallet API: Add `cursor` + `limit` query params, return `nextCursor` in response

---

### DEC-016-04: Template Preview Modes (P2-12) — Deferred

**Decision:** Defer P2-12 (template preview in Wallet/Catalog/Verify views) to Sprint 16 or Post-Pilot.

**Rationale:**
- Sprint 15 scope already at ~44h with Sidebar migration
- Template preview is a "nice to have" — issuers can verify appearance after issuing a test badge
- Can be pulled into Sprint 15 if development completes ahead of schedule

---

### DEC-016-05: Icon Standardization — Full Site Lucide Migration

**Decision:** Replace ALL emoji icons across the entire site with Lucide React icons, not just empty/error states.

**Estimated Effort:** ~5h (increased from 2h partial approach)

**Scope:** Dashboard cards, Toast messages, Dialog icons, navigation items, empty states, error states, status indicators.

**Rationale:**
- Sidebar migration (DEC-016-02) touches navigation icons anyway — doing full site at the same time avoids a second pass
- Consistent icon language improves perceived quality for Pilot
- Lucide React is already a project dependency

---

## Sprint 15 Revised Scope

**Total Estimated Effort: ~44h** (extended sprint to accommodate full scope)

| Story | Description | Estimate |
|-------|-------------|----------|
| TD-035-A | Dashboard tabbed composite view (My Badges default) | 8h |
| TD-035-B | Backend permissions API (`/api/users/me/permissions`) | 3h |
| TD-035-C | Sidebar layout migration (replace top nav) | 12h |
| TD-035-D | Testing: all 6 role×manager combinations | 4h |
| P1-1 | Inline styles → Tailwind classes | 2h |
| P1-7 | Forgot Password page (wire existing backend) | 2h |
| P2-1 | Template list server-side pagination | 3h |
| P2-2 | Wallet infinite scroll (cursor pagination) | 3h |
| P2-5 | Styled delete confirmation modal | 1h |
| P2-7 | Full site emoji → Lucide icons | 5h |
| P2-8 | z-index scale in Tailwind theme | 1h |
| P2-10 | Mobile nav Issue Badge action | — (merged into Sidebar) |
| P2-11 | Dirty-form guard (beforeunload) | 2h |
| **Total** | | **~44h** |

Note: P2-10 (Mobile nav Issue Badge) is absorbed into the Sidebar migration work — no separate estimate needed.

---

## References

- **ADR-015:** UserRole Enum Clean Design — enum = `ADMIN | ISSUER | EMPLOYEE`, manager derived
- **ADR-014:** External User / GUEST Role Strategy (deferred)
- **TD-034:** Role Model Refactor (Sprint 14 prerequisite)
- **TD-035:** Dashboard Composite View — Permission Stacking

---

*All five decisions accepted unanimously during Sprint 14-16 design review meeting, 2026-02-27.*
