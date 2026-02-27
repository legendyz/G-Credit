# Sprint 15 — UI Overhaul + Dashboard Composite

**Status:** 🔜 Planned  
**Sprint Goal:** Transform UI from role-gated flat nav to sidebar layout + tabbed composite dashboard.  
**Target Version:** v1.5.0  
**Estimated Effort:** ~44h (extended sprint — AI Agent, no time-box)  
**Dependencies:** Sprint 14 (v1.4.0) — role model refactor ✅  

---

## Key Deliverables

- Sidebar layout migration (shadcn/ui `<Sidebar>`)
- Composite dashboard with Badge Wallet / Badge Management / Admin tabs
- isManager-driven tab visibility via permissions API
- Server-side pagination (Templates) + infinite scroll (Wallet)
- Full Lucide icon replacement across all pages
- Inline styles → Tailwind migration
- Forgot password flow, z-index system, delete modal, dirty-form guard

## Architecture

- **ADR-016:** Sprint 15 UI Design Decisions (5 decisions)
- **ADR-017:** TD-034 Dual-Dimension Identity Architecture (frontend sections)

## Stories (13)

| # | Story | Est | Priority |
|---|-------|-----|----------|
| 15.1 | AppSidebar component | 8h | CRITICAL |
| 15.2 | Layout refactor + mobile responsive | 4h | CRITICAL |
| 15.3 | Dashboard composite (tabbed) view | 6h | CRITICAL |
| 15.4 | Role/isManager permissions API | 3h | HIGH |
| 15.5 | Dashboard integration testing | 6h | HIGH |
| 15.6 | Template server-side pagination | 3h | HIGH |
| 15.7 | Wallet infinite scroll | 3h | HIGH |
| 15.8 | Lucide icon full replacement | 3h | MEDIUM |
| 15.9 | Inline styles → Tailwind cleanup | 2h | MEDIUM |
| 15.10 | Forgot password page | 2h | MEDIUM |
| 15.11 | z-index token system | 1h | LOW |
| 15.12 | Delete confirmation modal | 1h | LOW |
| 15.13 | Dirty-form navigation guard | 2h | LOW |

## Deferred

- **P2-12:** Template preview modes → Sprint 16+

## Sprint Documents

- [Backlog](backlog.md)
