# Sprint 12 Kickoff Readiness Checklist

**Sprint:** Sprint 12  
**Epic:** Management UIs + Evidence Unification  
**Duration:** 2026-02-19 — TBD  
**Goal:** Complete the three core management UIs (Skill, User, Milestone) and unify the evidence system, giving admins full platform control through the browser.  
**Status:** 🟢 READY TO START  
**Last Updated:** 2026-02-19

---

## ✅ Planning Artifacts Complete

- [x] **Sprint Backlog Created** — `sprint-12/backlog.md` ✅
- [x] **Story Files Created** — All 9 stories have detailed files (12.1–12.9) ✅
- [x] **Version Manifest Created** — `sprint-12/version-manifest.md` ✅
- [x] **sprint-status.yaml Updated** — Sprint 12 = planning, 8 stories as backlog ✅
- [x] **UX/Architecture Review Complete** — Party Mode with Winston + Sally (2026-02-19) ✅
- [x] **Git Branch Created** — `sprint-12/management-uis-evidence` at `aad6a1a` ✅

---

## 🌿 Git Branch Setup (Story 0.1 — DONE)

**⚠️ COMPLETED — Branch created and pushed before any code changes.**

- [x] **Verify main branch up-to-date**
  ```bash
  git checkout main
  git pull origin main
  git status  # Clean
  ```

- [x] **Create Sprint branch**
  ```bash
  git checkout -b sprint-12/management-uis-evidence
  git push -u origin sprint-12/management-uis-evidence
  ```

- [x] **Verify branch in remote**
  ```
  * sprint-12/management-uis-evidence aad6a1a [origin/sprint-12/management-uis-evidence]
  ```

**Branch Name:** `sprint-12/management-uis-evidence`  
**Created By:** LegendZhu  
**Creation Date:** 2026-02-19  
**Base Commit:** `aad6a1a` (Phase 3 — all stories updated with review findings)

---

## 📦 Environment & Dependencies

### Backend Setup
- [ ] **Node.js version:** v20.20.0 LTS installed
- [ ] **npm packages up-to-date:** `cd backend && npm ci`
- [ ] **Prisma client generated:** `npx prisma generate`
- [ ] **Database migrations applied:** `npx prisma migrate dev`
- [ ] **Environment variables configured:** `.env` file complete
- [ ] **Health check passes:** `npm run start:dev` → `/health` returns 200

### Frontend Setup
- [ ] **Node.js version:** v20.20.0 LTS installed
- [ ] **npm packages up-to-date:** `cd frontend && npm ci`
- [ ] **Dev server starts:** `npm run dev` → Vite server running
- [ ] **Build succeeds:** `npm run build`

### New Dependencies (Sprint 12)
- [ ] `npm install @dnd-kit/core @dnd-kit/sortable` — drag-and-drop for CategoryTree (Story 12.1)

---

## ☁️ Azure Resources

### Existing Resources (Verify Access)
- [ ] **Azure Storage Account:** gcreditdevstoragelz — accessible
- [ ] **PostgreSQL Database:** gcredit-dev-db-lz — connection working
- [ ] **Blob Containers:** badges, evidence — accessible

### New Resources
**None required for Sprint 12.**

---

## 🧪 Testing Infrastructure

- [ ] **Test suite baseline:** Run `npm test` in backend + frontend
  - Backend: ~1,307 tests passing (v1.1.0 baseline)
  - Frontend: verify current count
- [ ] **Test isolation verified:** No changes to test infra this sprint
- [ ] **Coverage baseline:** `npm run test:cov` (target: >80% new code)

---

## 🔐 Permissions & Access

- [x] **Azure Portal Access:** Available
- [x] **Database Access:** Connection strings working
- [x] **Repository Access:** Can push to Sprint branch (verified)
- [x] **External APIs:** No new APIs this sprint

### Known Permission Issues
- ⚠️ **TD-006:** Teams Channel Permissions still pending (skipped tests) — not affected this sprint

---

## 📚 Documentation Review

- [x] **Sprint Backlog:** Reviewed [backlog.md](backlog.md)
- [x] **Lessons Learned:** 43 lessons reviewed during Phase 1 planning
- [x] **Technical Debt:** TD-009, TD-010, TD-016, TD-017 embedded into stories
- [x] **Architecture Decisions:** Party Mode Phase 2 — 19 architectural decisions documented in story files
- [x] **Design References:** [ui-design-direction.md](../../planning/ui-design-direction.md) + prototype HTML

---

## 🚨 Risks & Blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Evidence migration corrupts data | Medium | High | Reversible migration + backup, test on copy first |
| Skill tree performance (deep nesting) | Low | Medium | Limit to 3 levels (schema enforced) |
| API contract changes break frontend | Medium | Medium | Version API, update consumers in same PR |
| Scope creep from Phase 2 review | Medium | Low | Architect/UX can suggest but SM gates scope |

**Current Blockers:** None

---

## ✅ Kickoff Approval

- [x] **Scrum Master Approval:** All preparation complete
- [x] **Planning Phases Complete:** Phase 1 (framework) + Phase 2 (review) + Phase 3 (updates)
- [x] **Sprint Branch Ready:** `sprint-12/management-uis-evidence` tracking origin

**Status:** 🟢 **READY TO START**  
**Kickoff Date:** 2026-02-19  
**First Story:** 12.1 — Skill Category Management UI

---

## 🎯 Next Steps

1. ✅ **Story 0.1:** Create Git Branch — DONE
2. ⏭️ **Story 0.2:** Verify Environment Setup (run npm ci, prisma generate, install @dnd-kit)
3. ⏭️ **Story 12.1:** Skill Category Management UI (shared components + tree CRUD)

**Development Order:**
```
12.1 → 12.2 → 12.3/12.4 (parallel) → 12.5 → 12.6 → 12.7/12.8 (buffer) → 12.9 (UAT)
```

**UAT Timing:** Story 12.9 executes after all dev stories complete, before merge to main.

---

**Quick Checklist Summary:**
- ✅ Planning Artifacts: 6/6
- ✅ Git Branch: 3/3
- ⬜ Environment: 0/9 (verify at dev start)
- ⬜ Azure Resources: 0/3 (verify at dev start)
- ⬜ Testing Infrastructure: 0/3 (verify at dev start)
- ✅ Permissions: 4/4
- ✅ Documentation: 5/5
- ✅ Risks Assessed: 4 risks documented
- ✅ Kickoff Approval: 3/3

**Planning Progress:** 21/21 items complete  
**Environment Verification:** 15 items — to be checked when development begins
