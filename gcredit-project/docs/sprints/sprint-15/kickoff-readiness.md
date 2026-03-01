# Sprint 15 — Kickoff Readiness Checklist

**Sprint:** Sprint 15 — UI Overhaul + Dashboard Composite View  
**Target Version:** v1.5.0  
**Branch:** `sprint-15/ui-overhaul-dashboard`  
**Date:** 2026-03-01  
**SM:** Bob (Agent)  

---

## 1. Planning Artifacts ✅

| Artifact | Status | Location |
|----------|--------|----------|
| Sprint Backlog | ✅ Created | [backlog.md](backlog.md) |
| Version Manifest | ✅ Created | [version-manifest.md](version-manifest.md) |
| Story Files (15) | ✅ All created | [sprint-15/](.) — 15 files |
| sprint-status.yaml | ✅ Updated | [sprint-status.yaml](../sprint-status.yaml) |
| Kickoff Readiness | ✅ This file | [kickoff-readiness.md](kickoff-readiness.md) |

---

## 2. Story Files Verification

| Story | File | Exists |
|-------|------|--------|
| 15.1 | 15-1-dashboard-composite-view.md | ✅ |
| 15.2 | 15-2-backend-permissions-api.md | ✅ |
| 15.3 | 15-3-sidebar-layout-migration.md | ✅ |
| 15.4 | 15-4-role-manager-test-matrix.md | ✅ |
| 15.5 | 15-5-inline-styles-to-tailwind.md | ✅ |
| 15.6 | 15-6-forgot-password-page.md | ✅ |
| 15.7 | 15-7-template-list-pagination.md | ✅ |
| 15.8 | 15-8-wallet-infinite-scroll.md | ✅ |
| 15.9 | 15-9-styled-delete-confirmation.md | ✅ |
| 15.10 | 15-10-emoji-to-lucide-icons.md | ✅ |
| 15.11 | 15-11-zindex-scale.md | ✅ |
| 15.12 | 15-12-dirty-form-guard.md | ✅ |
| 15.13 | 15-13-td038-configurable-rate-limits.md | ✅ |
| 15.14 | 15-14-mid-sprint-uat.md | ✅ |
| 15.15 | 15-15-final-uat.md | ✅ |

---

## 3. Architecture & Design Reviews

| Review | Status | Notes |
|--------|--------|-------|
| ADR-016 reviewed | ✅ | 5 decisions — all scope Sprint 15 stories |
| ADR-017 reviewed | ✅ | Dual-dimension model (Sprint 14 delivered) |
| ADR-009 reviewed | ✅ | Tailwind v4 CSS-first, design tokens |
| 15.3 UX Review | ✅ Complete | APPROVED WITH CHANGES — 4 critical issues, 8 recs |
| 15.1 Architecture Review | ✅ Complete | APPROVED WITH CHANGES — 2 arch issues, 4 medium |
| UX Review Report | ✅ Created | [UX-REVIEW-SPRINT-15.md](UX-REVIEW-SPRINT-15.md) |
| Architecture Review Report | ✅ Created | [ARCHITECTURE-REVIEW-SPRINT-15.md](ARCHITECTURE-REVIEW-SPRINT-15.md) |

---

## 4. Prerequisites Check

| Prerequisite | Status | Detail |
|-------------|--------|--------|
| Sprint 14 merged to main | ✅ | v1.4.0 released, all 9 stories done |
| Dual-dimension model in prod | ✅ | `isManager` in JWT, ManagerGuard active |
| Design tokens in Tailwind theme | ✅ | 11 tokens added in Sprint 14 (14-9) |
| shadcn/ui Sidebar available | ✅ | Already in project via shadcn/ui |
| Backend auth endpoints exist | ✅ | forgot-password / reset-password (Sprint 1) |
| E2E test infrastructure | ✅ | Playwright configured, 31 E2E tests passing |

---

## 5. Environment Verification

| Check | Status | Notes |
|-------|--------|-------|
| Node.js 20.20.0 | ✅ | No change from Sprint 14 |
| npm packages up to date | ✅ | Prisma locked at 6.19.2 |
| No new Azure resources needed | ✅ | No infra changes for Sprint 15 |
| Dev database ready | ✅ | No schema migration needed |
| `.env` template current | ✅ | Will add THROTTLE_* vars in 15.13 |

---

## 6. Test Baseline

| Category | Count | Status |
|----------|-------|--------|
| Backend unit/integration | 932 | ✅ All passing |
| Frontend unit/component | 794 | ✅ All passing |
| E2E (Playwright) | 31 | ✅ All passing |
| **Total** | **1,757** | ✅ 100% pass rate |

**Target after Sprint 15:** 1,800+ tests

---

## 7. Risk Awareness

Top risks acknowledged:
1. **Sidebar migration breaks routes** — Mitigated by Mid-Sprint UAT (W2.5)
2. **Permission stacking logic errors** — Mitigated by 6-combo test matrix (15.4)
3. **Scope creep from UI polish** — P2-12 deferred; strict boundary
4. **Rate limit migration** — Same defaults; regression tested (15.13)
5. **Sprint fatigue (56h)** — Wave structure allows natural pause points

---

## 8. Git Branch Setup

```bash
# To be executed at sprint kickoff:
git checkout main
git pull origin main
git checkout -b sprint-15/ui-overhaul-dashboard
```

- **Branch:** `sprint-15/ui-overhaul-dashboard`
- **Base:** `main` (v1.4.0)
- **Merge strategy:** Squash merge to main
- **Tag on completion:** `v1.5.0`

---

## 9. Wave Execution Order

```
Wave 1 (6h)  → 15.2, 15.13    → Backend APIs ready
    ↓
Wave 2 (20h) → 15.3, 15.1     → Core UI landed
    ↓
Wave 2.5 (3h) → 15.14         → Mid-Sprint UAT gate
    ↓
Wave 3 (19h) → 15.10, 15.7, 15.8, 15.5, 15.6, 15.12, 15.9, 15.11  → UI polish complete
    ↓
Wave 4 (8h)  → 15.4, 15.15    → Full validation + Final UAT
```

---

## 10. Kickoff Decision

| Criteria | Met? |
|----------|------|
| All story files created | ✅ |
| Backlog finalized | ✅ |
| Version manifest current | ✅ |
| sprint-status.yaml updated | ✅ |
| Prerequisites satisfied | ✅ |
| Test baseline green | ✅ |
| Risk mitigations in place | ✅ |

### ✅ READY FOR KICKOFF

Sprint 15 may begin. Start with Wave 1: Story 15.2 (Backend Permissions API) and Story 15.13 (Configurable Rate Limits).

---

**Prepared By:** SM Agent (Bob)  
**Date:** 2026-03-01
