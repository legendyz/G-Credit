# Sprint 15 Retrospective

**Sprint Number:** Sprint 15  
**Sprint Name:** UI Overhaul + Dashboard Composite View  
**Version:** v1.5.0  
**Date:** 2026-03-03  
**Participants:** LegendZhu, SM Agent (Bob)

---

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 15 |
| Stories Completed | 14 (93%) |
| Stories Deferred | 1 (15.6 Forgot Password) |
| Estimated Hours | ~56h |
| Tests Added | +78 (1,757 → 1,835) |
| Test Pass Rate | 100% (1,835/1,835) |
| Mid-Sprint UAT | 56/56 PASS (100%) |
| Final UAT | 36/36 PASS, 4 SKIP (100% testable) |
| Bugs Found in UAT | 6 |
| Bugs Fixed in UAT | 6 |
| ADRs Created | 2 (ADR-016, ADR-018) |
| Tech Debt Resolved | 2 (TD-035, TD-038) |

---

## What Went Well ✅

### 1. Two-Phase UAT Catches Real Issues
The mid-sprint UAT (Wave 2.5, 56 tests) + final UAT (Wave 4, 36 tests) structure proved highly effective. The final UAT caught 6 UI bugs that unit tests couldn't detect — all z-index stacking, overflow, and layout issues. Without the manual UAT, these would have shipped to pilot users.

### 2. Container Scroll Model Solves Stacking Context
The container scroll pattern (`overflow-hidden` root + `overflow-y-auto` scroll area) elegantly solved the wallet page z-index issue. Instead of fighting stacking contexts with ever-higher z-index values, restructuring the scroll ownership eliminated the root cause. This pattern is now reusable for any page with sticky headers + scrollable content.

### 3. Wave-Based Execution Handles Large Sprint
With 15 stories across 4 waves (+ Wave 2.5 mid-sprint UAT), the wave structure provided natural checkpoints. Backend prep (W1) → Core UI (W2) → UAT gate (W2.5) → Polish (W3) → Final UAT (W4). Each wave had clear entry/exit criteria.

### 4. ADR-016 Eliminated Design Debates
Having 5 pre-accepted UI design decisions (tabs over accordion, sidebar over top nav, server pagination for templates, Lucide for icons, P2-12 deferred) meant zero design debates during development. Stories mapped directly to decisions.

### 5. Tailwind v4 Audit Caught Silent Failure
Lesson 52 (shadcn/ui CSS variable syntax) caught a class of bug that produces no build errors, no lint warnings, and no test failures — only visible via manual rendering. The audit step (`grep -rn 'w-\[--'`) is now a standard post-install check.

---

## What Could Be Improved 🔧

### 1. Z-Index Issues Discovered Late
Despite having a defined z-index scale (Story 15.11), multiple stacking context issues were only caught during final UAT. The z-index scale defines token values but doesn't prevent incorrect layering in complex layouts. **Action:** Add a visual z-index regression check to the UAT plan (layered component screenshot comparison).

### 2. Filter Pagination Reset Was a Common Pattern Miss
The Badge Management page not resetting `currentPage` when filters change is a well-known React pagination pattern. This should have been caught during code review. **Action:** Add "pagination reset on filter change" to the code review checklist for any page with both filters and pagination.

### 3. Forgot Password Deferred
Story 15.6 was deferred because the backend password reset flow isn't wired. This dependency should have been identified during sprint planning. **Action:** Improve dependency analysis during planning — check backend API availability for each frontend story.

### 4. Compact UI Required Multiple Iterations
The filter bar went through several layout iterations (grid → flex-wrap, various heights) before landing on the final compact h-9 design. Better up-front wireframing for compact states would reduce iteration cycles. **Action:** Include compact/mobile wireframes in UX specs for complex filter components.

---

## Action Items for Sprint 16

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Add visual z-index regression check to UAT plans | SM | MEDIUM |
| 2 | Add "pagination reset on filter change" to CR checklist | Dev | HIGH |
| 3 | Verify backend API availability for all frontend stories during planning | SM | HIGH |
| 4 | Include compact/mobile wireframes for filter components | UX | LOW |
| 5 | Run shadcn/ui CSS variable audit after any component update | Dev | HIGH |

---

## Lessons Learned

### Lesson 53: Container Scroll Model Eliminates Z-Index Wars
When a sticky element (filter bar) and scrollable content compete in z-index, restructuring scroll ownership to a container div (`overflow-hidden` root + `overflow-y-auto` child) eliminates the stacking context conflict entirely. This is preferable to z-index escalation.

### Lesson 54: Inset Box-Shadow for Input Focus in Constrained Containers
Standard focus indicators (`ring-2`, `outline`, `border-2`) extend beyond element boundaries, causing overflow in `overflow-hidden` containers. Using `shadow-[inset_0_0_0_1px_...]` provides a visible focus ring that stays within bounds. Documented in ADR-018.

### Lesson 55: Filter State Changes Must Reset Pagination
Any page combining filters + pagination must reset `currentPage` to 1 when any filter changes. Otherwise users see empty pages or stale data. Implement via `useEffect` watching all filter dependencies.

---

## Sprint 15 → Sprint 16 Handoff

### Carried Forward
- 15.6 Forgot Password → Backlog (tech debt, no dependencies, ~2h)

### Sprint 16 Scope (Planned)
- **F-1 Level 1:** Fine-Grained RBAC — Issuer template ownership (~8h)
- **Pilot Readiness Validation** (~4h)
- **Optional:** P2-12 Template preview modes (4h), 15.6 Forgot Password (2h)

### Prerequisites for Sprint 16
- Sprint 15 merged to `main` and tagged `v1.5.0`
- All 1,835 tests passing on `main`

---

**Created:** 2026-03-03  
**Created By:** SM Agent (Bob)
