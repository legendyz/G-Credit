# Sprint 15 UX Review Report

**Version:** v1.4.0 → v1.5.0  
**Sprint Goal:** UI Overhaul — Sidebar Navigation + Dashboard Composite View  
**Reviewer:** Amelia (UX Designer Agent)  
**Review Date:** 2026-03-01  
**Stories Reviewed:** 15.3 (Sidebar Layout Migration), 15.1 (Dashboard Composite View)  
**Status:** COMPREHENSIVE REVIEW COMPLETE

---

## Executive Summary

I have conducted a UX review of the two CRITICAL Sprint 15 stories focusing on navigation redesign and dashboard composition. These are the most impactful UI changes since the initial MVP (Sprint 8) and will fundamentally reshape how users interact with G-Credit.

### Overall Verdict: **APPROVED WITH CHANGES** ⚠️

The stories demonstrate strong alignment with ADR-016 design decisions and the dual-dimension identity model from Sprint 14. However, I identified **4 critical issues** and **8 recommendations** that should be addressed before or during development.

### Key Findings:
- ✅ **Strengths:** Clear permission-based visibility model, shadcn/ui component alignment, accessibility awareness, responsive strategy
- ⚠️ **Critical Issues:** 4 issues requiring attention (2 blocking, 2 high)
- 💡 **Recommendations:** 8 enhancements to improve UX quality
- 📊 **Story Ratings:**
  - Story 15.3 (Sidebar): **APPROVED WITH CHANGES** ⚠️
  - Story 15.1 (Dashboard): **APPROVED WITH CHANGES** ⚠️

---

## Current State Analysis

### Existing Navigation (Navbar.tsx — 254 lines)
- **Desktop:** Horizontal top nav with flat link list, role-gated
- **Problem:** ADMIN users see 10+ inline links — horizontal crowding, no grouping
- **Mobile (MobileNav.tsx — 329 lines):** Right-slide drawer, well-implemented focus trap, WCAG-compliant touch targets
- **Observation:** Navbar lives at `components/Navbar.tsx` while MobileNav lives at `components/layout/MobileNav.tsx` — inconsistent organization

### Existing Dashboard (DashboardPage.tsx — 91 lines)
- **Pattern:** Role-switch rendering — dashboards stacked vertically (e.g., ISSUER sees IssuerDashboard + EmployeeDashboard stacked)
- **Problem:** No tab separation means users scroll through unrelated sections; ADMIN sees AdminDashboard only (no employee view)
- **No Tabs/Sidebar components installed:** Both need to be added via shadcn/ui CLI

---

## Story-by-Story Review

### Story 15.3: Sidebar Layout Migration
**Rating:** **APPROVED WITH CHANGES** ⚠️  
**Priority:** CRITICAL  
**Estimate:** 12h

#### ✅ Strengths
1. **Permission-based group visibility** — Clean, deterministic model tied to role × isManager
2. **Collapsible icon-only mode** — Reduces horizontal footprint, preserves screen real estate
3. **Design token usage** (Task 7) — Proper use of `@theme` tokens per Sprint 14 lesson
4. **ASCII wireframe in ADR-016** — Clear reference for implementation
5. **Mobile strategy** — Sidebar becomes drawer overlay on <768px, preserving existing MobileNav pattern
6. **Profile section at bottom** — Standard sidebar UX pattern

#### ⚠️ Critical Issues

**CRITICAL-15.3-001: ADMIN Sidebar Group Inconsistency**  
- **Severity:** CRITICAL 🔴  
- **Location:** AC #3 — "Team group: Visible when `isManager === true`"  
- **Issue:** The backlog summary table previously said "ADMIN always sees Team in sidebar (bypasses manager check)" but the Story AC says `isManager === true`. These needed to match.  
- **Impact:** Inconsistent behavior between sidebar and dashboard tabs.  
- **Resolution:** ✅ **Option B selected** — Team group visibility strictly `isManager === true`. No ADMIN bypass. Rationale: ManagerDashboard shows direct reports data; ADMIN without direct reports would see an empty tab. If org-wide team view is needed later, it should be a separate feature.  
- **Status:** RESOLVED ✅ (2026-03-01)

**CRITICAL-15.3-002: Transition Animation Spec Missing**  
- **Severity:** HIGH 🟠  
- **Location:** AC #4 (collapsible), AC #8 (SidebarInset)  
- **Issue:** No specification for collapse/expand animation duration or easing. `SidebarInset` content shift needs smooth transition to avoid jarring layout shift.  
- **Recommendation:** Add to AC:
  - Collapse/expand: 200ms ease-in-out transition
  - Content area shifts smoothly (no jump/flash)
  - `prefers-reduced-motion: reduce` — instant transition, no animation
- **Status:** HIGH PRIORITY ⚠️

#### 💡 Recommendations

**REC-15.3-001: Sidebar Width Specification**
- Story mentions "expanded ~240px, collapsed ~60px" only in Dev Notes, not in AC
- Recommend adding explicit width AC: sidebar expanded width 240px, collapsed 56px (matches shadcn/ui default)
- Ensure these values are Tailwind theme tokens, not hardcoded

**REC-15.3-002: Tooltip on Collapsed Icons**
- When sidebar is collapsed to icon-only, nav items should show tooltip on hover with full label
- shadcn/ui Sidebar provides this by default via `SidebarMenuButton tooltip` prop — document in AC

**REC-15.3-003: Active State Clarity**
- AC #5 says "left border highlight or background" — pick one for consistency
- Recommend: **left border (3px solid primary)** + subtle background tint — provides both visual weight and area highlight
- Match existing active pattern from MobileNav (which uses background highlight)

**REC-15.3-004: Keyboard Navigation Pattern**
- AC #10 mentions Tab, Enter, Escape — but should also specify:
  - Arrow keys for navigating between sidebar items within a group
  - Home/End for jumping to first/last item
  - `role="navigation"` + `aria-label="Main navigation"` on sidebar container

---

### Story 15.1: Dashboard Tabbed Composite View
**Rating:** **APPROVED WITH CHANGES** ⚠️  
**Priority:** CRITICAL  
**Estimate:** 8h

#### ✅ Strengths
1. **"My Badges" always default** (DEC-016-01) — User-centered: every user sees their own data first
2. **Additive tab computation** — Clean mental model: more permissions = more tabs
3. **Existing dashboards preserved** — No rework of sub-dashboard components
4. **ErrorBoundary per tab** — Fault isolation, one tab failure doesn't crash all tabs
5. **URL doesn't change on tab switch** — Simpler implementation, no routing complexity

#### ⚠️ Critical Issues

**CRITICAL-15.1-001: Tab Content Loading Strategy Unclear**  
- **Severity:** HIGH 🟠  
- **Location:** Task 3 — "Lazy-load tab content components"  
- **Issue:** Story says both "lazy-load" (Task 3) and "tab switching is instant" (AC #5). These conflict — lazy-loaded content requires fetch time on first tab switch.  
- **Impact:** Users switching to Team/Issuance/Admin tab for the first time will see loading spinner, not "instant" switch.  
- **Recommendation:** Clarify strategy:
  - **Option A (Recommended):** Mount all visible tabs on page load, hide non-active. Instant switching, slightly longer initial load.
  - **Option B:** Lazy-load with skeleton placeholder. First switch shows skeleton for ~200ms, subsequent switches are instant (keep mounted).
  - Either way, update AC #5 to reflect chosen behavior.
- **Status:** NEEDS CLARIFICATION ⚠️

**CRITICAL-15.1-002: Current Dashboard Stacking vs. Tabs Transition**  
- **Severity:** HIGH 🟠  
- **Location:** AC #4 — existing sub-dashboards as tab content  
- **Issue:** Current DashboardPage.tsx (91 lines) renders some dashboards **stacked** (ISSUER sees IssuerDashboard + EmployeeDashboard both visible; EMPLOYEE+Manager sees ManagerDashboard + EmployeeDashboard both visible). Moving to tabs **separates** them. Users who relied on scrolling between stacked views will need to click tabs.  
- **Impact:** Behavior change for ISSUER and EMPLOYEE+Manager users. Not necessarily bad, but should be documented as intentional UX change.  
- **Recommendation:** Add note in story:
  - "Previous behavior: dashboards stacked vertically. New behavior: dashboards in separate tabs. This is an intentional UX improvement per ADR-016 DEC-016-01."
  - Consider adding cross-tab quick links (e.g., "View Team Overview →" card in My Badges tab for managers)

#### 💡 Recommendations

**REC-15.1-001: Tab Badge/Count Indicators**
- Consider showing count indicators on tabs: "Team Overview (12 members)" or "Issuance (5 pending)"
- Provides at-a-glance information without switching tabs
- Low priority — can be deferred to Sprint 16 if scope concern

**REC-15.1-002: Empty Tab Content Pattern**
- What if ManagerDashboard or AdminDashboard has no data?
- Currently each sub-dashboard handles its own empty state, but verify they all have proper empty state handling
- Recommend: if a tab has zero content, still show the tab (don't hide it) but show meaningful empty state

**REC-15.1-003: Mobile Tab Behavior**
- AC #7 mentions "horizontal scroll or dropdown for narrow screens"
- Recommend: **horizontal scroll with fade indicator** on mobile (standard shadcn/ui Tabs mobile pattern)
- Not dropdown — users lose visibility of available tabs

**REC-15.1-004: Deep Link Support**
- AC #9 says "URL does NOT change on tab switch" but Task 5 says "deep-linking to specific tabs works (e.g., `/dashboard?tab=issuance`)"
- These statements conflict — clarify:
  - **Recommended:** Support `?tab=` query param for deep-linking (e.g., from sidebar "Analytics" linking to `/dashboard?tab=issuance`), but don't push history state on every tab click
  - This gives deep-link capability without cluttering browser history

---

## Pre-Development Checklist

### Must Resolve Before Development
- [x] **CRITICAL-15.3-001:** ADMIN Team group visibility rule — ✅ Option B (strict isManager)
- [x] **CRITICAL-15.1-001:** Tab content loading strategy — ✅ Mount all + gate data fetching
- [x] **CRITICAL-15.1-002:** Acknowledge stacked → tabbed behavior change — ✅ Confirmed intentional UX improvement

### Should Address During Development
- [ ] **CRITICAL-15.3-002:** Add transition animation spec to AC
- [ ] **REC-15.3-002:** Add tooltip spec for collapsed sidebar
- [ ] **REC-15.1-003:** Confirm mobile tab pattern (horizontal scroll)
- [ ] **REC-15.1-004:** Resolve URL/deep-link conflict

### Can Defer to Development Discretion
- [ ] **REC-15.3-001:** Sidebar width as theme tokens
- [ ] **REC-15.3-003:** Active state pattern choice
- [ ] **REC-15.3-004:** Full keyboard nav spec
- [ ] **REC-15.1-001:** Tab count indicators
- [ ] **REC-15.1-002:** Verify sub-dashboard empty states

---

## shadcn/ui Component Installation Required

Neither `sidebar.tsx` nor `tabs.tsx` exists in `frontend/src/components/ui/`. Before development begins:

```bash
npx shadcn@latest add sidebar
npx shadcn@latest add tabs
```

This will install the required primitives and their dependencies (Radix UI, etc.).

---

## Summary Impact Assessment

| Change | Users Affected | Severity | User Education Needed |
|--------|---------------|----------|----------------------|
| Top nav → Sidebar | All users | HIGH | Minimal — sidebar pattern is familiar |
| Stacked dashboards → Tabs | ISSUER, EMPLOYEE+Manager | MEDIUM | Low — tabs are intuitive |
| Collapsed sidebar mode | All desktop users | LOW | Tooltip on hover makes it self-documenting |
| Mobile: drawer preserved | All mobile users | LOW | No change in behavior |

**Overall UX Risk:** **LOW** — The sidebar + tabs pattern is an industry standard. Main risk is the ADMIN Team group visibility decision (CRITICAL-15.3-001) which must be resolved before development.

---

**Reviewed By:** Amelia (UX Designer Agent)  
**Review Date:** 2026-03-01  
**Next Step:** Resolve 2 blocking decisions, then proceed to development
