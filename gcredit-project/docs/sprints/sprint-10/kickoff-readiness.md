# Sprint 10 Kickoff Readiness Checklist

**Sprint:** Sprint 10  
**Epic:** v1.0.0 Release (TD Cleanup + UAT + Release)  
**Duration:** 2026-02-09 to 2026-02-22 (2 weeks)  
**Goal:** v1.0.0 Release: Technical Debt Cleanup + Full UAT + Release Tag  
**Status:** 🟡 IN PREPARATION → 🟢 READY TO START  
**Last Updated:** 2026-02-08

---

## ✅ Planning Artifacts Complete

- [x] **Sprint Backlog Created** — [backlog.md](backlog.md) ✅
- [x] **Story Files Created** — 10 stories (10.1-10.10) ✅
- [x] **Version Manifest Created** — [version-manifest.md](version-manifest.md) ✅
- [x] **sprint-status.yaml Created** — [sprint-status.yaml](sprint-status.yaml) ✅
- [ ] **UX/Architecture Review** — Not applicable (no new UI/architecture)
- [x] **Git Branch Planned** — Branch name: `sprint-10/v1-release` ✅

---

## 🌿 Git Branch Setup (Story 0.1 - CRITICAL)

**⚠️ MUST BE COMPLETED BEFORE ANY CODE CHANGES**

- [ ] **Verify main branch up-to-date**
  ```bash
  git checkout main
  git pull origin main
  git status  # Should be clean
  ```

- [ ] **Verify Sprint 9 merge complete**
  ```bash
  git log --oneline -3  # Should show Sprint 9 merge + v0.9.0 tag
  git tag -l "v0.9*"    # Should show v0.9.0
  ```

- [ ] **Create Sprint branch**
  ```bash
  git checkout -b sprint-10/v1-release
  git push -u origin sprint-10/v1-release
  git branch  # Verify current branch
  ```

**Branch Name:** `sprint-10/v1-release`  
**Base:** `main` (post-v0.9.0)

---

## 📦 Environment & Dependencies

### Backend Setup
- [ ] **Node.js version:** v20.20.0 LTS
- [ ] **npm packages up-to-date:** `cd backend && npm install`
- [ ] **Prisma client generated:** `npx prisma generate`
- [ ] **Database migrations applied:** `npx prisma migrate dev`
- [ ] **Environment variables configured:** `.env` file complete
- [ ] **Health check passes:** `npm run start:dev` → `/api/health` returns 200
- [ ] **All tests pass:** `npm test` → 532 tests, 0 failures

### Frontend Setup
- [ ] **npm packages up-to-date:** `cd frontend && npm install`
- [ ] **Dev server starts:** `npm run dev` → Vite server running
- [ ] **All tests pass:** `npm test` → 397 tests, 0 failures
- [ ] **Build succeeds:** `npm run build` → 235 KB main chunk

### No New Dependencies
Sprint 10 has no new npm packages to install.

---

## ☁️ Azure Resources

### Existing Resources (Verify Access)
- [ ] **Azure Storage Account:** gcreditdevstoragelz — accessible
- [ ] **PostgreSQL Database:** gcredit-dev-db-lz — connection working
- [ ] **Blob Containers:** badges (public), evidence (private) — accessible
- [ ] **Azure AD App:** ceafe2e0-73a9-46b6-a203-1005bfdda11f — Graph API working

### No New Resources
Sprint 10 requires no new Azure resources.

---

## 🧪 Testing Infrastructure

- [ ] **Test suite baseline:** Run all tests
  - Backend: 532 tests passing
  - Frontend: 397 tests passing
  - E2E: 158 tests passing
  - **Total: 1087 tests (100% pass rate)**
- [ ] **Test isolation verified:** Schema-based parallel execution stable
- [ ] **Skipped tests documented:** 4 tests (TD-006: Teams Channel Permissions)

---

## 🔐 Permissions & Access

- [ ] **Azure Portal Access:** Team can access resources
- [ ] **Database Access:** Connection strings working
- [ ] **Repository Access:** Team can push to Sprint branch
- [ ] **Microsoft Graph API:** Email sending functional

### Known Permission Issues
- ⚠️ **TD-006:** Teams Channel `ChannelMessage.Send` permission pending → 4 tests skipped → not blocking Sprint 10

---

## 📚 Documentation Review

- [x] **Epic Requirements:** All 10 Epics complete — no new epic requirements
- [x] **Lessons Learned:** Reviewed [lessons-learned.md](../../lessons-learned/lessons-learned.md) — L34, L35, L36 applied to Story 10.1
- [x] **Technical Debt:** Reviewed — TD-017, ESLint, TD-018 all included in Sprint 10
- [x] **Architecture Decisions:** No new ADRs needed

---

## 🚨 Risks & Blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UAT discovers major bugs | Medium | High | 8h buffer (Story 10.8) |
| tsc fixes cascade | Low | Medium | 7h allocated (30-50% buffer per L36) |
| eslint --fix strips casts | Low | Low | Use variable annotations (L34) |
| TD-006 not resolved | High | Low | Not blocking — email workaround |

**Current Blockers:** None

---

## ✅ Kickoff Approval

- [ ] **Scrum Master Approval:** All preparation complete
- [ ] **Team Consensus:** Team agrees Sprint can start
- [ ] **Product Owner Informed:** v1.0.0 release sprint communicated

**Status:** 🟢 **READY TO START** (pending branch creation)  
**Kickoff Date:** 2026-02-09  
**First Story:** 10.1 — TD-017: Fix tsc Test Type Errors

---

## 🎯 Execution Order

```
Day 1-3:  Phase 1 — TD Cleanup (Stories 10.1, 10.2, 10.3, 10.4)
Day 4-5:  Phase 2 — Feature Enhancement (Story 10.5)
Day 6-7:  Phase 3a — UAT Prep (Story 10.6)
Day 8-10: Phase 3b — UAT Execution (Story 10.7)
Day 11:   Phase 3c — Bug Fixes (Story 10.8)
Day 12:   Phase 4a — Release Docs (Story 10.9)
Day 13:   Phase 4b — Merge + Tag (Story 10.10)
Day 14:   Retrospective + Celebration 🎉
```

---

**Quick Checklist Summary:**
- ✅ Planning Artifacts: 6/6
- ⬜ Git Branch: 0/3
- ⬜ Environment: 0/8
- ⬜ Azure Resources: 0/4
- ⬜ Testing Infrastructure: 0/3
- ⬜ Permissions: 0/4
- ✅ Documentation: 4/4
- ⬜ Risks Assessed: 1/1 ✅
- ⬜ Kickoff Approval: 0/3

**Total Progress:** Planning 100% Complete | Environment Verification Pending (Day 1)
