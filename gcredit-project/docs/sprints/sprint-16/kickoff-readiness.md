# Sprint 16 Kickoff Readiness Checklist

**Sprint:** Sprint 16  
**Epic:** F-1 — Issuer Template Ownership Isolation + Pilot Readiness  
**Duration:** 2026-03-03 – 2026-03-04 (2 days)  
**Goal:** Enforce issuer-level template ownership so each Issuer can only operate on own templates; validate pilot readiness with seed data and UAT  
**Status:** 🟢 READY TO START  
**Last Updated:** 2026-03-02

---

## ✅ Planning Artifacts Complete

- [x] **Sprint Backlog Created** — `sprint-16/backlog.md` ✅
- [x] **Story Files Created** — 5 stories (16-1 through 16-5) ✅
- [x] **Version Manifest Created** — `sprint-16/version-manifest.md` ✅
- [x] **sprint-status.yaml Updated** — Sprint 16 added as active ✅
- [x] **UX/Architecture Review Complete** — Self-review sufficient (no new UX patterns) ✅
- [x] **Git Branch Planned** — `sprint-16/f1-rbac-pilot-readiness` ✅

---

## 🌿 Git Branch Setup

**⚠️ MUST BE COMPLETED BEFORE ANY CODE CHANGES**

- [ ] **Verify main branch up-to-date**
  ```bash
  git checkout main
  git pull origin main
  git status  # Should be clean
  ```

- [ ] **Create Sprint branch**
  ```bash
  git checkout -b sprint-16/f1-rbac-pilot-readiness
  git push -u origin sprint-16/f1-rbac-pilot-readiness
  ```

**Branch Name:** `sprint-16/f1-rbac-pilot-readiness`

---

## 📦 Environment & Dependencies

### Backend Setup
- [x] **Node.js version:** v20.x LTS
- [ ] **npm packages up-to-date:** `cd backend && npm install`
- [ ] **Prisma client generated:** `npx prisma generate`
- [ ] **Database migrations applied:** None needed (createdBy + index already exist)
- [ ] **Health check passes:** `npm run start:dev` → `/health` returns 200

### Frontend Setup
- [x] **Node.js version:** v20.x LTS
- [ ] **npm packages up-to-date:** `cd frontend && npm install`
- [ ] **Dev server starts:** `npm run dev`

### New Dependencies
- None — no new packages for Sprint 16

---

## ☁️ Azure Resources

### Existing Resources (Verify Access)
- [x] Azure Storage Account: gcreditdevstoragelz — no changes
- [x] SQLite (dev) — local, no external dependency

### New Resources
- None

---

## 🧪 Testing Infrastructure

- [x] **Test suite baseline:** 1,835 tests (BE 991 + FE 844) all passing at v1.5.0
- [ ] **Run baseline:** `npm test` in backend + frontend before starting
- [x] **Coverage target:** >80%

---

## 🔐 Permissions & Access

- [x] **Repository Access:** Push access confirmed (main + sprint branches)
- [x] **External APIs:** No new API keys needed
- ⚠️ **TD-006:** Teams Channel Permissions still pending — not relevant for Sprint 16

---

## 📚 Documentation Review

- [x] **Lessons Learned:** Reviewed LL-049 (TDD for RBAC), LL-051 (reuse guard patterns), LL-055 (staged UAT)
- [x] **Technical Debt:** TD-032 (RBAC strengthening) — partially resolved by F-1
- [x] **Architecture:** ARCH-P1-004 ownership pattern reviewed (exists in delete, extend to update/issuance)

---

## 🚨 Risks & Blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| E2E tests break due to ownership checks | Medium | Medium | Review badge-issuance E2E fixtures for template ownership setup |
| Bulk issuance flow complexity | Low | Medium | Reuse same guard pattern as single issuance |

**Current Blockers:** None

---

## ✅ Kickoff Approval

- [x] **Scrum Master Approval:** All preparation complete
- [ ] **Team Consensus:** Ready to start
- [ ] **Product Owner Informed:** (implicit — user confirmed F-1 scope)

**Status:** 🟢 **READY TO START**  
**Kickoff Date:** 2026-03-03  
**First Stories:** 16.1 + 16.3 (parallel — Backend Ownership Guards)

---

## 🎯 Next Steps

1. ⏭️ Create Git branch `sprint-16/f1-rbac-pilot-readiness`
2. ⏭️ Run `npm install` + `npm test` baseline in BE + FE
3. ⏭️ Start Story 16.1 + 16.3 (Wave 1 — parallel)

---

**Quick Checklist Summary:**
- ✅ Planning Artifacts: 6/6
- ⏳ Git Branch: 0/2
- ⏳ Environment: 2/5
- ✅ Azure Resources: 2/2
- ⏳ Testing: 2/3
- ✅ Permissions: 2/2
- ✅ Documentation: 3/3
- ✅ Risks Assessed: 2/2
- ⏳ Kickoff Approval: 1/3

**Total Progress:** 19/28 items (remaining items are runtime verification)
