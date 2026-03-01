# Sprint 15 Backlog

**Sprint Number:** Sprint 15  
**Sprint Goal:** Deliver sidebar layout migration, dashboard composite view with permission stacking, and comprehensive UI polish — completing the Pre-Pilot Hardening UI layer.  
**Duration:** 2026-03-01 — TBD (extended sprint, ~56h)  
**Target Version:** v1.5.0  
**Team Capacity:** Solo developer (LegendZhu) + AI Agent support  
**Sprint Lead:** LegendZhu  
**SM Agent:** Bob  
**Branch:** `sprint-15/ui-overhaul-dashboard`  
**Baseline:** v1.4.0 (1,757 tests — BE 932 + FE 794 + E2E 31)

---

## Sprint Goal

Deliver the sidebar layout migration, dashboard composite view with permission stacking, and comprehensive UI polish — completing the Pre-Pilot Hardening UI layer. This is the second-to-last sprint before Phase 4 Pilot deployment.

**"Every user sees their badges first. Managers see their team. Issuers see their tools. Admins see everything. All in one sidebar, one dashboard."**

**Success Criteria:**
- [ ] Sidebar navigation replaces top nav for all screen sizes
- [ ] Dashboard shows stacked tabs based on dual-dimension permissions (role × isManager)
- [ ] All 6 role×manager combinations validated in automated E2E tests
- [ ] Full site emoji migrated to Lucide icons
- [ ] Server-side pagination (templates) + infinite scroll (wallet) operational
- [ ] Mid-Sprint UAT PASS rate ≥ 95%
- [ ] Final UAT PASS rate ≥ 95%
- [ ] All tests pass (target: 1,800+ tests)

---

## Sprint Capacity

### Velocity Reference
| Sprint | Estimated | Actual | Accuracy | Type |
|--------|-----------|--------|----------|------|
| Sprint 12 | 67h | ~60h | 90% | Management UIs |
| Sprint 13 | 50-60h | ~55h | 92% | SSO + Session |
| Sprint 14 | ~24h | ~22h | 92% | Arch refactor |
| **Sprint 15** | **~56h** | TBD | Target: >85% | UI Overhaul |

### Capacity Allocation
| Category | Hours | Percentage |
|----------|-------|------------|
| Wave 1: Backend Prep | 6h | 11% |
| Wave 2: Core UI | 20h | 36% |
| Wave 2.5: Mid-Sprint UAT | 3h | 5% |
| Wave 3: UI Polish | 19h | 34% |
| Wave 4: Testing + Final UAT | 8h | 14% |
| **Total** | **56h** | **100%** |

Feature Development: 44h (79%)  
Testing + UAT: 12h (21%)

---

## Architecture & Design References

| Document | Content | Status |
|----------|---------|--------|
| **ADR-016** | 5 UI design decisions (tabs, sidebar, pagination, icons, P2-12 defer) | ✅ Accepted |
| **ADR-017** | Dual-dimension model (Sprint 14 prerequisite) | ✅ Accepted |
| **ADR-009** | Tailwind v4 CSS-first config — all tokens in `@theme {}` | ✅ Active |
| **ADR-015** | UserRole enum clean design — dev code comment templates | ✅ Active |

---

## Wave Structure

### Wave 1: Backend Prep (~6h)
> **Goal:** API layer ready for frontend UI work

| # | Story | Priority | Est | Depends On | Story Doc |
|---|-------|----------|-----|------------|-----------|
| 15.2 | TD-035-B: Backend Permissions API | HIGH | 3h | Sprint 14 | [15-2](15-2-backend-permissions-api.md) |
| 15.13 | TD-038: Configurable Auth Rate Limits | MEDIUM | 3h | — | [15-13](15-13-td038-configurable-rate-limits.md) |

**Wave 1 Exit Criteria:** Permissions API returns correct data for all 6 combos. Rate limits configurable via env vars.

---

### Wave 2: Core UI (~20h)
> **Goal:** Navigation and dashboard architecture landed

| # | Story | Priority | Est | Depends On | Story Doc |
|---|-------|----------|-----|------------|-----------|
| 15.3 | TD-035-C: Sidebar Layout Migration | CRITICAL | 12h | 15.2 | [15-3](15-3-sidebar-layout-migration.md) |
| 15.1 | TD-035-A: Dashboard Tabbed Composite View | CRITICAL | 8h | 15.2 | [15-1](15-1-dashboard-composite-view.md) |

**Wave 2 Exit Criteria:** Sidebar replaces top nav. Dashboard shows permission-stacked tabs. All routes working.

**Dependencies:** 15.3 and 15.1 both depend on 15.2 (Permissions API).

---

### Wave 2.5: Mid-Sprint UAT (~3h)
> **Goal:** Validate core structural UI before building polish on top

| # | Story | Priority | Est | Depends On | Story Doc |
|---|-------|----------|-----|------------|-----------|
| 15.14 | Mid-Sprint UAT: Sidebar + Dashboard | HIGH | 3h | 15.1, 15.3 | [15-14](15-14-mid-sprint-uat.md) |

**UAT Scope:** 56 test cases — sidebar groups (24), dashboard tabs (18), route integrity (10), responsive (4).  
**Test Accounts:** 6 combinations (EMPLOYEE, EMPLOYEE+Manager, ISSUER, ISSUER+Manager, ADMIN, ADMIN+Manager).

**Mid-Sprint UAT Exit Criteria:** ≥95% pass rate. All FAIL items have action plan for Wave 3 or tech debt.

---

### Wave 3: UI Polish (~19h)
> **Goal:** Visual quality elevated to Pilot-ready standard

| # | Story | Priority | Est | Depends On | Story Doc |
|---|-------|----------|-----|------------|-----------|
| 15.10 | P2-7: Full Site Emoji → Lucide Icons | MEDIUM | 5h | 15.3 | [15-10](15-10-emoji-to-lucide-icons.md) |
| 15.7 | P2-1: Template List Server-Side Pagination | MEDIUM | 3h | — | [15-7](15-7-template-list-pagination.md) |
| 15.8 | P2-2: Wallet Cursor-Based Infinite Scroll | MEDIUM | 3h | — | [15-8](15-8-wallet-infinite-scroll.md) |
| 15.5 | P1-1: Inline Styles → Tailwind Classes | MEDIUM | 2h | — | [15-5](15-5-inline-styles-to-tailwind.md) |
| 15.6 | P1-7: Forgot Password Page | MEDIUM | 2h | — | [15-6](15-6-forgot-password-page.md) |
| 15.12 | P2-11: Dirty-Form Guard | MEDIUM | 2h | — | [15-12](15-12-dirty-form-guard.md) |
| 15.9 | P2-5: Styled Delete Confirmation | LOW | 1h | — | [15-9](15-9-styled-delete-confirmation.md) |
| 15.11 | P2-8: z-index Scale | LOW | 1h | — | [15-11](15-11-zindex-scale.md) |

**Wave 3 Exit Criteria:** All UI polish stories done. No emoji in application UI. Pagination + infinite scroll operational.

---

### Wave 4: Testing + Final UAT (~8h)
> **Goal:** Full coverage verification — Pilot-ready confidence

| # | Story | Priority | Est | Depends On | Story Doc |
|---|-------|----------|-----|------------|-----------|
| 15.4 | TD-035-D: Role×Manager Combination Testing | HIGH | 4h | 15.1, 15.3, 15.13 | [15-4](15-4-role-manager-test-matrix.md) |
| 15.15 | Final UAT: Full UI Acceptance | HIGH | 4h | All W1-W3 | [15-15](15-15-final-uat.md) |

**Final UAT Scope:** 40 test cases — regression (10), pagination (8), forms/dialogs (8), visual quality (10), technical (4).

**Wave 4 Exit Criteria:** E2E test matrix passes 10/10 runs. Final UAT ≥95% pass rate. All tests pass.

---

## Stories Summary

| ID | Title | Priority | Est | Wave | Status |
|----|-------|----------|-----|------|--------|
| 15.1 | Dashboard Tabbed Composite View | CRITICAL | 8h | W2 | 🔴 backlog |
| 15.2 | Backend Permissions API | HIGH | 3h | W1 | ✅ done |
| 15.3 | Sidebar Layout Migration | CRITICAL | 12h | W2 | � in-progress |
| 15.4 | Role×Manager Test Matrix | HIGH | 4h | W4 | 🔴 backlog |
| 15.5 | Inline Styles → Tailwind | MEDIUM | 2h | W3 | 🔴 backlog |
| 15.6 | Forgot Password Page | MEDIUM | 2h | W3 | 🔴 backlog |
| 15.7 | Template List Pagination | MEDIUM | 3h | W3 | 🔴 backlog |
| 15.8 | Wallet Infinite Scroll | MEDIUM | 3h | W3 | 🔴 backlog |
| 15.9 | Styled Delete Confirmation | LOW | 1h | W3 | 🔴 backlog |
| 15.10 | Emoji → Lucide Icons | MEDIUM | 5h | W3 | 🔴 backlog |
| 15.11 | z-index Scale | LOW | 1h | W3 | 🔴 backlog |
| 15.12 | Dirty-Form Guard | MEDIUM | 2h | W3 | 🔴 backlog |
| 15.13 | TD-038: Configurable Rate Limits | MEDIUM | 3h | W1 | ✅ done |
| 15.14 | Mid-Sprint UAT | HIGH | 3h | W2.5 | 🔴 backlog |
| 15.15 | Final UAT | HIGH | 4h | W4 | 🔴 backlog |
| **Total** | **15 stories** | | **56h** | | |

---

## Code Review Strategy

| Story | Risk Level | Review Method | Reason |
|-------|-----------|---------------|--------|
| 15.3 (Sidebar) | 🔴 HIGH | AI Review + Self-Review | Major UI architecture change |
| 15.1 (Dashboard) | 🔴 HIGH | AI Review + Self-Review | Permission logic, routing |
| 15.2 (Permissions API) | 🟡 MEDIUM | AI Review + Self-Review | Security endpoint |
| 15.4 (Test Matrix) | 🟡 MEDIUM | Self-Review | E2E test reliability |
| 15.13 (Rate Limits) | 🟡 MEDIUM | AI Review | Security configuration |
| 15.7 (Pagination) | 🟡 MEDIUM | Self-Review | Backend + Frontend |
| 15.8 (Infinite Scroll) | 🟡 MEDIUM | Self-Review | Backend + Frontend |
| Others (15.5-15.6, 15.9-15.12) | 🟢 LOW | Self-Review | UI polish, low risk |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| shadcn/ui Sidebar component API mismatch | Medium | Low | Review docs before coding; fallback to custom sidebar |
| Sidebar migration breaks existing routes | High | Medium | Comprehensive route testing in Wave 2.5 UAT |
| IntersectionObserver edge cases (mobile Safari) | Medium | Low | Test on multiple browsers; polyfill if needed |
| Rate limit migration breaks production defaults | High | Low | Exact same defaults; regression test |
| Scope creep from UI polish discoveries | Medium | Medium | P2-12 already deferred; strict scope boundary |
| Test flakiness (expanding E2E matrix) | Medium | Low | Apply Sprint 14 Lesson 51; configurable rate limits (15.13) |
| Extended sprint fatigue | Medium | Medium | Wave structure allows natural pause points |

---

## Dependencies

### Internal Dependencies (Story-to-Story)

| From | To | Type |
|------|-----|------|
| 15.2 | 15.1, 15.3 | Data dependency (Permissions API) |
| 15.3 | 15.10, 15.11 | Merge conflict avoidance |
| 15.1, 15.3 | 15.14 (Mid UAT) | Prerequisite |
| All W1-W3 | 15.15 (Final UAT) | Prerequisite |
| 15.13 | 15.4 (E2E tests) | Test infrastructure |

### External Dependencies
- None — Sprint 15 uses only existing infrastructure and dependencies

---

## Testing Strategy

### Unit Testing
- Target: >80% new code coverage
- Key areas: Permission computation, sidebar group visibility, tab rendering

### E2E Testing
- 6-combination role×manager matrix (Story 15.4)
- Sidebar + Dashboard + Route verification
- Rate limit aware (Story 15.13 enables reliable E2E)

### UAT Testing (Staged — 2 Rounds)
- **Mid-Sprint (W2.5):** 56 test cases — structural validation post Core UI
- **Final (W4):** 40 test cases — full acceptance
- **Total UAT:** 96 test cases across 2 rounds
- **Testers:** LegendZhu (manual) + Agent (automated where possible)

---

## Technical Debt Addressed

| ID | Description | Story | Status |
|----|-------------|-------|--------|
| TD-035 | Dashboard Composite View — Permission Stacking | 15.1-15.4 | 🔴 Sprint 15 |
| TD-038 | Auth Rate Limits Hardcoded | 15.13 | 🔴 Sprint 15 |

---

## Deferred Items

| Item | Reason | Target |
|------|--------|--------|
| **P2-12:** Template preview modes (wallet/catalog/verify views) | Sprint 15 already at ~56h; not blocking for pilot (DEC-016-04) | Sprint 16 or Post-Pilot |

---

## Definition of Done (Sprint Level)

- [ ] All 15 stories completed and tested
- [ ] Sidebar navigation replaces top nav — all role/manager combos correct
- [ ] Dashboard tabs computed from dual dimensions — 6 combos verified
- [ ] All emoji replaced with Lucide icons across entire frontend
- [ ] Template pagination + wallet infinite scroll functional
- [ ] Dirty-form guard active on template forms
- [ ] Forgot Password flow wired end-to-end
- [ ] z-index scale defined — no hardcoded z-index values
- [ ] All inline static styles converted to Tailwind
- [ ] Mid-Sprint UAT ≥ 95% pass rate
- [ ] Final UAT ≥ 95% pass rate
- [ ] All 1,757+ existing tests pass + new tests for Sprint 15 features (target: 1,800+)
- [ ] Pre-push hook passes reliably
- [ ] CHANGELOG.md updated (frontend + backend) for v1.5.0
- [ ] `project-context.md` updated for Sprint 15
- [ ] Sprint summary + retrospective created
- [ ] Code merged to main + Git tag v1.5.0
- [ ] No P0/P1 bugs remaining

---

## Version Manifest

See [version-manifest.md](version-manifest.md) for complete dependency snapshot.

**Key versions:** React 19.2.0, NestJS 11.0.1, Tailwind 4.1.18, Prisma 6.19.2 (locked), Vite 7.2.4

---

## Git Strategy

- **Branch:** `sprint-15/ui-overhaul-dashboard`
- **Base:** `main` (after Sprint 14 merge)
- **Merge:** Squash merge to main
- **Tag:** `v1.5.0`
- **Commit convention:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

---

## Related Documents

- [Version Manifest](version-manifest.md)
- [ADR-016: Sprint 15 UI Design Decisions](../../decisions/ADR-016-sprint-15-ui-design-decisions.md)
- [ADR-017: Dual-Dimension Identity Model](../../decisions/ADR-017-dual-dimension-identity-model.md)
- [Sprint 14 Retrospective](../sprint-14/retrospective.md)
- [Sprint 14 Summary](../sprint-14/summary.md)

---

**Created:** 2026-02-27  
**Updated:** 2026-03-01 — Revised to 15 stories / ~56h with staged UAT and TD-038  
**Created By:** SM Agent (Bob)  
**Design Spec:** ADR-016 (John/Sally/Winston)  
**Architecture Spec:** ADR-017 (Winston)
