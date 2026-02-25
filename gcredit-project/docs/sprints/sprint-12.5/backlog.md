# Sprint 12.5 Backlog — Deferred Items Cleanup

**Sprint Goal:** Clear D-1 through D-4 deferred items from Sprint 12 before Sprint 13 planning.  
**Sprint Type:** Cleanup (mini-sprint, no new features)  
**Duration:** 1 day (2026-02-25)  
**Capacity:** ~7h  
**Branch:** `sprint-12.5/deferred-cleanup`  
**Target Version:** v1.2.1 (patch)

---

## Sprint Summary

| ID | Story | Est. | Status | Owner |
|----|-------|------|--------|-------|
| 12.5.1 | CategoryTree Enhancements (D-1, D-2, D-3) | 6h | Not Started | Dev |
| 12.5.2 | Remove Deprecated `Badge.evidenceUrl` Field (D-4) | 1h | Not Started | Dev |
| **Total** | | **7h** | | |

---

## Deferred Items Mapping

| Deferred | Source | Story | Description |
|----------|--------|-------|-------------|
| D-1 | Story 12.1 Task 1 | 12.5.1 | Responsive tree→dropdown on `<1024px` |
| D-2 | Story 12.1 Task 2 | 12.5.1 | Blue insertion line (DnD visual feedback) |
| D-3 | Story 12.1 Task 2 | 12.5.1 | Cross-level "Move to..." action (new backend API + frontend dialog) |
| D-4 | Story 12.5 | 12.5.2 | Remove deprecated `Badge.evidenceUrl` field from Prisma schema |

---

## Story Details

### Story 12.5.1 — CategoryTree Enhancements

**File:** [12.5.1-category-tree-enhancements.md](./12.5.1-category-tree-enhancements.md)  
**Scope:** Frontend + Backend (D-3 requires new reparent API)  
**Est.:** 6h  
**Risk:** Low — isolated to CategoryTree component and SkillCategories module

### Story 12.5.2 — Remove Deprecated `Badge.evidenceUrl` Field

**File:** [12.5.2-remove-evidence-url.md](./12.5.2-remove-evidence-url.md)  
**Scope:** Prisma migration + backend code cleanup  
**Est.:** 1h  
**Risk:** Low — frontend already decoupled, backend uses EvidenceFile[] exclusively

---

## Wave Structure

**Single wave** — both stories are independent, can be developed in any order.

| Wave | Stories | Parallel? |
|------|---------|-----------|
| 1 | 12.5.1 + 12.5.2 | Yes — no dependencies |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend build: `npm run build` ✅
- [ ] Backend lint: `npm run lint` — 0 warnings
- [ ] Backend tests: all pass (28 skipped = TD-006)
- [ ] Frontend build: `npm run build` ✅
- [ ] Frontend lint: `npm run lint` — 0 issues
- [ ] Frontend tests: all pass
- [ ] No regressions in existing functionality
- [ ] Code committed to sprint branch
- [ ] PR to main

---

## Dependencies

- None — all items are self-contained

## Risks

- D-3 (cross-level move) is the most complex item — requires new backend endpoint with level recalculation and cycle detection. If scope creeps, timebox to 3h and defer remaining edge cases.

---

**Created:** 2026-02-25  
**Last Updated:** 2026-02-25  
**Template Version:** v1.2
