# Sprint 11 Kickoff Readiness Checklist

**Sprint:** Sprint 11  
**Theme:** Security Hardening + Code Quality + Feature Polish  
**Duration:** Post-MVP Hardening Sprint  
**Goal:** 安全加固 + 代码质量提升 + 核心功能补全  
**Status:** 🟡 IN PREPARATION  
**Last Updated:** Sprint 11 Planning  

---

## ✅ Planning Artifacts Complete

- [x] **Sprint Backlog Created** — [backlog.md](backlog.md)
- [x] **Story Files Created** — All 23 stories ([11-1](11-1-sec-001-account-lockout.md) through [11-23](11-23-user-management-nav-fix.md))
- [x] **Version Manifest Created** — [version-manifest.md](version-manifest.md)
- [x] **sprint-status.yaml Updated** — Sprint 11 in-progress, all 23 stories as backlog
- [x] **UX/Architecture Review** — Assessed: Story 11.6 needs ADR-005, others self-review
- [x] **Git Branch Planned** — `sprint-11/security-quality-hardening`

---

## 🌿 Git Branch Setup (Story 0.1 - CRITICAL)

**⚠️ MUST BE COMPLETED BEFORE ANY CODE CHANGES**

- [ ] **Verify main branch up-to-date**
  ```bash
  git checkout main
  git pull origin main
  git status  # Should be clean
  ```

- [ ] **Create Sprint branch**
  ```bash
  git checkout -b sprint-11/security-quality-hardening
  git push -u origin sprint-11/security-quality-hardening
  git branch  # Verify current branch
  ```

**Branch Name:** `sprint-11/security-quality-hardening`

---

## 📦 Environment & Dependencies

### Backend Setup
- [ ] `cd gcredit-project/backend && npm install`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate dev` (apply any pending)
- [ ] `.env` file complete
- [ ] `npm run start:dev` → `/health` returns 200
- [ ] `npm test` → 534+ tests passing

### Frontend Setup
- [ ] `cd gcredit-project/frontend && npm install`
- [ ] `npm run dev` → Vite server running
- [ ] `npm test` → 527+ tests passing

### New Dependencies to Install (During Sprint)
| Package | Story | Command | When |
|---------|-------|---------|------|
| cookie-parser | 11.6 | `npm install cookie-parser @types/cookie-parser` | Wave 3 |
| husky | 11.22 | `npm install -D husky` (root) | Wave 5 |
| lint-staged | 11.22 | `npm install -D lint-staged` (root) | Wave 5 |

### Dependencies to Remove (During Sprint)
| Package | Story | Command | When |
|---------|-------|---------|------|
| keyv | 11.14 | `npm uninstall keyv` (backend) | Wave 1 |
| framer-motion | 11.14 | `npm uninstall framer-motion` (frontend) | Wave 1 |
| tailwindcss-animate | 11.14 | `npm uninstall tailwindcss-animate` (frontend) | Wave 1 |

---

## ☁️ Azure Resources

### Existing Resources (No Changes Needed)
- [x] **Azure Storage Account:** gcreditdevstoragelz — accessible
- [x] **PostgreSQL Database:** gcredit-dev-db-lz — connection working
- [x] **Blob Containers:** badges, evidence — accessible
- [x] **Azure AD / Entra ID:** Configured for auth

### New Resources: **None required** ✅

---

## 🗃️ Database Migrations (During Sprint)

| Story | Migration Name | Changes | Wave |
|-------|---------------|---------|------|
| 11.1 | AddAccountLockout | `failedLoginAttempts Int @default(0)`, `lockedUntil DateTime?` on User | 2 |
| 11.4 | AddBadgeVisibility | `BadgeVisibility` enum, `visibility BadgeVisibility @default(PUBLIC)` on Badge | 4 |

---

## 🧪 Testing Infrastructure

- [ ] **Backend baseline:** `npm test` — target 534+ passing
- [ ] **Frontend baseline:** `npm test` — target 527+ passing
- [ ] **Combined baseline:** 1061+ total tests
- [ ] **ESLint:** `npm run lint` → 0 errors, 0 warnings (both projects)
- [ ] **TypeScript:** `npx tsc --noEmit` → clean (both projects)

### Testing Notes for Sprint 11
- Stories 11.10-12 add 3 new test suites (badge-templates, issuance-criteria-validator, blob-storage)
- Target: +150-200 new tests from testing stories
- TDD approach for Stories 11.1, 11.2, 11.6 (security-critical)

---

## 🔐 Permissions & Access

- [x] **Azure Portal Access:** ✅
- [x] **Database Access:** Connection strings working
- [x] **Repository Access:** Push access confirmed
- [ ] **TD-006 (Teams Permissions):** ⚠️ External dependency — PO to contact Teams admin (not a sprint task)

---

## 📚 Documentation Review

- [x] **Sprint 11 Candidate List:** Reviewed and consumed into backlog
- [x] **Lessons Learned:** Reviewed (#28-#39, 13 cross-sprint patterns, 22 common pitfalls)
- [x] **Coding Standards:** 7 rules confirmed (Tailwind 4, ESLint 0/0, etc.)
- [x] **project-context.md:** Current (v1.0.0, Sprint 10 complete)
- [x] **Infrastructure Inventory:** Reviewed, no new resources needed

---

## 📋 Code Review Strategy

| Risk Level | Stories | Method |
|-----------|---------|--------|
| 🔴 HIGH | 11.1, 11.2, 11.6 | TDD + AI Review |
| 🟡 MEDIUM | 11.4, 11.8, 11.9, 11.16 | AI Review + Self |
| 🟢 LOW | All others | Self-review |

---

## 🚨 Risks & Blockers

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Story 11.6 JWT migration scope creep | Medium | High | ADR-005 first, strict scope (49 localStorage refs cataloged) |
| Prisma migration conflicts (2 migrations) | Low | Medium | Sequential execution, test rollback |
| Cookie-based auth browser compatibility | Low | Medium | Keep Bearer fallback (dual extraction) |
| Test cascade from pagination change | Medium | Medium | Budget extra time (Lesson 36) |

**Current Blockers:** None

---

## 🎯 Sprint 11 Execution Order (5 Waves)

### Wave 1 — Quick Wins (Day 1): ~4h
11.3, 11.14, 11.23, 11.7

### Wave 2 — Core Security (Days 1-2): ~8-11h
11.1, 11.2, 11.9

### Wave 3 — Complex Security + Cross-cutting (Days 2-4): ~14-19h
11.6 (ADR first!), 11.8, 11.16

### Wave 4 — Tests + Features (Days 4-6): ~17-22h
11.10, 11.11, 11.12, 11.13, 11.4, 11.5

### Wave 5 — Polish + DX (Days 6-7): ~9-12h
11.15, 11.17-11.20, 11.21, 11.22

---

## ✅ Kickoff Approval

- [ ] **Scrum Master Approval:** All preparation complete
- [ ] **Product Owner Informed:** Sprint scope and goal communicated
- [ ] **Developer Ready:** Environment verified, stories understood

**Status:** 🟡 **AWAITING KICKOFF**

---

## Quick Checklist Summary

- ✅ Planning Artifacts: 6/6
- ⬜ Git Branch: 0/2 (pre-kickoff)
- ⬜ Environment: 0/5 (verify at kickoff)
- ✅ Azure Resources: 4/4 (no new needed)
- ⬜ Testing Infrastructure: 0/5 (verify at kickoff)
- ✅ Permissions: 3/4 (TD-006 external)
- ✅ Documentation: 5/5
- ✅ Risks Assessed: 4 identified with mitigations
- ⬜ Kickoff Approval: 0/3

---

## 🔄 Sprint Closure Reminders (From S22)

- **DoD verification:** Per-story (not batch at end)
- **Merge strategy:** PR from `sprint-11/security-quality-hardening` → `main`
- **Version tag:** v1.1.0 (security hardening release)
- **Docs to update at close:** project-context.md, CHANGELOG.md, lessons-learned.md, story completion notes
