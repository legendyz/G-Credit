# Sprint 14 Kickoff Readiness Checklist

**Sprint:** Sprint 14  
**Epic:** TD-034 — Dual-Dimension Role Model Refactor  
**Duration:** 2026-02-27 — 2026-03-02 (estimated 3-4 days)  
**Goal:** Architecture-first — land the dual-dimension role model refactor and resolve CI reliability  
**Target Version:** v1.4.0  
**Status:** 🟡 IN PREPARATION → 🟢 READY TO START  
**Last Updated:** 2026-02-27

---

## ✅ Planning Artifacts Complete

- [x] **Sprint Backlog Created** — `sprint-14/backlog.md` ✅
- [x] **Story Files Created** — 9 Story files in `sprint-14/` ✅
- [x] **Version Manifest Created** — `sprint-14/version-manifest.md` ✅
- [x] **sprint-status.yaml Updated** — Sprint 14 entries added, status: in-progress ✅
- [x] **UX/Architecture Review** — Skipped (ADR-017 provides complete spec) ✅
- [ ] **Git Branch Planned** — Branch name: `sprint-14/role-model-refactor`

---

## 🌿 Git Branch Setup (Story 0.1 — CRITICAL)

**⚠️ MUST BE COMPLETED BEFORE ANY CODE CHANGES**

- [ ] **Verify main branch up-to-date**
  ```bash
  git checkout main
  git pull origin main
  git status  # Should be clean
  ```

- [ ] **Create Sprint branch**
  ```bash
  git checkout -b sprint-14/role-model-refactor
  git push -u origin sprint-14/role-model-refactor
  git branch  # Verify current branch
  ```

- [ ] **Verify branch in remote**

**Branch Name:** `sprint-14/role-model-refactor`  
**Base:** `main` (after Sprint 13 v1.3.0 merge)

---

## 📦 Environment & Dependencies

### Backend Setup
- [ ] **Node.js version:** v20.20.0 LTS — verified
- [ ] **npm packages up-to-date:** `cd backend && npm install`
- [ ] **Prisma client generated:** `npx prisma generate`
- [ ] **Database migrations applied:** `npx prisma migrate dev`
- [ ] **Environment variables configured:** `.env` file complete
- [ ] **Health check passes:** `npm run start:dev` → `/health` returns 200

### Frontend Setup
- [ ] **Node.js version:** v20.20.0 LTS — verified
- [ ] **npm packages up-to-date:** `cd frontend && npm install`
- [ ] **Dev server starts:** `npm run dev` → Vite server running
- [ ] **Build succeeds:** `npm run build`

### New Dependencies
**None** — Sprint 14 is a pure refactoring sprint.

---

## ☁️ Azure Resources

### Existing Resources (Verify Access)
- [ ] **Azure Storage Account:** gcreditdevstoragelz — accessible
- [ ] **PostgreSQL Database:** gcredit-dev-db-lz — connection working
- [ ] **Blob Containers:** badges, evidence — accessible

### New Resources
**None** — No new Azure resources needed.

---

## 🧪 Testing Infrastructure

- [ ] **Test suite baseline:**
  - Backend: 914 tests passing (Sprint 13)
  - Frontend: 794 tests passing (Sprint 13)
  - **Total: 1,708 tests**
- [ ] **Pre-push hook:** Husky v9 operational (lint + tsc + jest + build + vitest)
- [ ] **Flaky test:** Story 14.1 will fix TD-036 first

---

## 🔐 Permissions & Access

- [ ] **Azure Portal Access:** Available
- [ ] **Database Access:** Connection string working
- [ ] **Repository Access:** Push to Sprint branch verified

### Known Permission Issues
- ⚠️ **TD-006:** Teams Channel Permissions pending (not relevant to Sprint 14)

---

## 📚 Documentation Review

- [x] **ADR-015:** UserRole enum decision — reviewed ✅
- [x] **ADR-017:** TD-034 full architecture spec — reviewed ✅ (primary reference)
- [x] **Lessons Learned:** Lesson 22 (Prisma format risk), Lesson 3 (don't skip flaky tests) — reviewed ✅
- [x] **Infrastructure Inventory:** No new resources needed — reviewed ✅

---

## 🚨 Risks & Blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Prisma enum migration fails on existing data | Low | High | Test migration on local DB first; rollback SQL ready |
| Old JWT tokens in flight after deploy | Medium | Low | `?? false` fallback; features restore on next login/refresh |
| MANAGER removal breaks undiscovered code paths | Medium | Medium | Pre-migration grep + 6-combination test matrix |
| M365 sync regression (role derivation change) | Low | Medium | Specific sync test with directReports + Security Group combo |

**Current Blockers:** None

---

## 📋 Sprint 13 Action Items to Address

| # | Action | How to Handle |
|---|--------|---------------|
| 1 | Clean temp files (_push-output.txt, etc.) | Include in first commit on sprint branch |
| 2 | Update .gitignore for temp files | Include in first commit on sprint branch |
| 3 | SM acceptance sync sprint-status.yaml | Process improvement — apply during Sprint 14 |
| 4 | UAT minimal fixes only | N/A — no UAT in Sprint 14 |

---

## ✅ Kickoff Approval

- [x] **Scrum Master Approval:** All preparation complete ✅
- [ ] **Team Consensus:** Team agrees Sprint can start
- [ ] **Product Owner Informed:** Stakeholders notified

**Status:** 🟢 **READY TO START**  
**Kickoff Date:** 2026-02-27  
**First Story:** 14.1 — Fix Flaky BadgeManagementPage Test (Quick Win)

---

## 🎯 Development Order

1. ⏭️ **Story 0.1:** Create Git Branch `sprint-14/role-model-refactor`
2. ⏭️ **Story 0.2:** Clean temp files + update .gitignore (Sprint 13 Action Items #1, #2)
3. ⏭️ **Story 14.1:** Fix flaky test (Wave 1 — CI reliability)
4. ⏭️ **Story 14.2:** Schema migration (Wave 2 — start)
5. ⏭️ **Story 14.3:** JWT payload update (Wave 2)
6. ⏭️ **Story 14.4 + 14.5:** ManagerGuard + RolesGuard (parallel, Wave 2)
7. ⏭️ **Story 14.6:** M365 sync cleanup (Wave 2)
8. ⏭️ **Story 14.7:** Frontend updates (Wave 3)
9. ⏭️ **Story 14.8:** 6-combination test matrix (Wave 4)
10. ⏭️ **Story 14.9:** Design tokens prep (Wave 4, can be parallel)

---

**Quick Checklist Summary:**
- ✅ Planning Artifacts: 5/6
- 🟡 Git Branch: 0/3 (pending kickoff)
- 🟡 Environment: 0/9 (verify at kickoff)
- 🟡 Azure Resources: 0/3 (verify at kickoff)
- 🟡 Testing: 0/3 (verify at kickoff)
- ✅ Documentation: 4/4
- 🟡 Risks Assessed: ✅
- 🟡 Kickoff Approval: 1/3

**Planning Phase Complete — Ready for development kickoff.**
