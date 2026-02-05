# Sprint 9 - Kickoff Readiness Checklist

**Sprint:** Sprint 9  
**Duration:** 2026-02-06 to 2026-02-20 (2 weeks)  
**Target Version:** v0.9.0  
**Sprint Goal:** Epic 8 Bulk Badge Issuance + Tech Debt Cleanup

**Status:** ⏳ IN PREPARATION  
**Last Updated:** 2026-02-05  
**Kickoff Meeting:** 2026-02-06 09:00 AM

---

## 🎯 Overview

This document tracks readiness for Sprint 9 kickoff. All items marked ✅ must be completed before Sprint officially starts. Items marked ⚠️ require attention. Items marked ❌ are blockers.

**Kickoff Criteria:** 100% of CRITICAL items complete, ≥90% of HIGH items complete.

---

## ✅ Section 1: Planning Artifacts (MANDATORY)

### 1.1 Core Planning Documents
- [ ] **Sprint Backlog** - CRITICAL
  - File: `sprint-9/backlog.md`
  - Contains: Sprint goal, capacity plan, story summaries, TD tasks
  - Status: ⏳ Created, pending team review
  
- [ ] **Story Files (4 files)** - CRITICAL
  - `sprint-9/8-1-csv-template-validation.md` ✅
  - `sprint-9/8-2-csv-upload-parsing.md` ✅
  - `sprint-9/8-3-bulk-preview-ui.md` ✅
  - `sprint-9/8-4-batch-processing-phase1.md` ✅
  - All BMAD-optimized format with AC, tasks, testing standards
  
- [ ] **Technical Debt Plan** - HIGH
  - File: `sprint-9/technical-debt-tasks.md`
  - Contains: TD-015 (Phase 1+2), TD-014, TD-013
  - Total effort: 13h (16% of sprint capacity)
  
- [ ] **Version Manifest** - HIGH
  - File: `sprint-9/version-manifest.md`
  - Contains: All dependency versions, special notes (Prisma lock)
  - Verified: Node 20.18.3, React 19.2.0, NestJS 11.1.12
  
- [ ] **Kickoff Readiness** - MEDIUM
  - File: `sprint-9/kickoff-readiness.md` (this file)
  - Contains: 10-section comprehensive checklist
  
### 1.2 Sprint Status Tracking
- [ ] **sprint-status.yaml Updated** - CRITICAL
  - Epic 8 status: `backlog` → `in-progress` ✅
  - Stories 8.1-8.4 status: `backlog` (ready to start)
  - Sprint 9 metadata comment added
  
### 1.3 Reference Documentation
- [ ] **Epic 8 Design Document** - HIGH
  - Location: `docs/planning/epic-8-bulk-badge-issuance.md`
  - Contains: Feature requirements, architecture, UI/UX specs
  - Status: ⏳ To be verified

---

## 🔧 Section 2: Git Branch (Story 0.1 - CRITICAL)

### 2.1 Sprint Branch Creation
- [x] **Create Sprint Branch** - CRITICAL (Story 0.1) ✅ DONE 2026-02-06
  - Branch name: `sprint-9/epic-8-bulk-issuance-td-cleanup`
  - Base branch: `main`
  - Command: `git checkout -b sprint-9/epic-8-bulk-issuance-td-cleanup`
  
- [x] **Verify Main Branch Clean** - CRITICAL ✅
  - No uncommitted changes
  - All Sprint 8 merged: `git log --oneline -5`
  - Tag v0.8.0 exists: `git tag -l v0.8.0`
  
- [ ] **Branch Protection Rules** - HIGH
  - Require PR before merge to `main`
  - Require 1 approval (peer review)
  - Require CI tests pass
  
### 2.2 Git Workflow Reminders
- [ ] **Daily Commits** - HIGH
  - Commit at end of each day
  - Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`
  
- [ ] **Feature Branches** - MEDIUM
  - Optional: Create sub-branches for each story
  - Pattern: `sprint-9/story-8.1-csv-template`
  - Merge to sprint branch, not directly to main

---

## 💻 Section 3: Development Environment

### 3.1 Local Setup Verification
- [ ] **Node.js Version** - CRITICAL
  - Required: v20.18.3 LTS
  - Check: `node --version`
  - Install: https://nodejs.org/ (if needed)
  
- [ ] **Backend Dependencies** - CRITICAL
  - Location: `gcredit-project/backend/`
  - Command: `npm install`
  - Verify: No errors, package-lock.json unchanged
  
- [ ] **Frontend Dependencies** - CRITICAL
  - Location: `gcredit-project/frontend/`
  - Command: `npm install`
  - Verify: No errors, package-lock.json unchanged
  
- [ ] **Prisma Client** - CRITICAL
  - Generate: `npx prisma generate`
  - Sync: `npx prisma db push` (dev only)
  - Verify: No schema drift
  
### 3.2 Environment Configuration
- [ ] **Backend `.env` File** - CRITICAL
  - Required vars:
    - `DATABASE_URL` (PostgreSQL connection)
    - `JWT_SECRET`
    - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
    - ~~`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`~~ **[REMOVED]** Not needed for MVP
  
- [ ] **Frontend `.env` File** - CRITICAL
  - Required vars:
    - `VITE_API_BASE_URL` (backend URL)
  
- [ ] ~~**Redis Connection**~~ - **[DEFERRED TO TD-016]**
  - ~~Verify Azure Redis Cache connection~~
  - ~~Test: `redis-cli PING`~~
  - **MVP Decision**: Story 8.4 uses synchronous processing (max 20 badges), no Redis needed
  
### 3.3 Development Servers
- [ ] **Backend Server Starts** - CRITICAL
  - Command: `npm run start:dev`
  - Verify: Listens on http://localhost:3000
  - Check: `/api/health` returns 200
  
- [ ] **Frontend Server Starts** - CRITICAL
  - Command: `npm run dev`
  - Verify: Listens on http://localhost:5173
  - Check: Homepage loads without errors

---

## ☁️ Section 4: Azure Resources (Phase 1 - MVP)

### 4.1 Database
- [ ] **PostgreSQL Connection** - CRITICAL
  - Service: Azure Database for PostgreSQL - Flexible Server
  - Version: 16.6
  - Dev database: `gcredit-dev`
  - Verify: Backend connects without errors
  
- [ ] **Database Migrations** - HIGH
  - Pending migrations: 0 (Sprint 8 complete)
  - New migrations in Sprint 9:
    - `add-bulk-issuance-session` (Story 8.2)
    - `add-bulk-issuance-job` (Story 8.4)
  - Strategy: Run migrations during story development
  
### 4.2 Azure Services
- [ ] **Azure Communication Services (Email)** - CRITICAL
  - GraphEmailService configured
  - Test: Send test email via Swagger `/api/email/test`
  - Expected: Email received within 2 minutes
  
- [ ] **Azure Blob Storage** - HIGH
  - Badge image storage working
  - Test: Upload test badge image
  - Verify: Image accessible via public URL
  
- [ ] **Azure Redis Cache** - **[DEFERRED TO TD-016]**
  - **MVP Decision**: Not needed for Story 8.4 synchronous processing
  - **Phase 2**: Create when TD-016 triggered (post-MVP validation)
  - **Cost Saving**: $12/month during MVP phase
  
### 4.3 Azure AD B2C (Optional for Sprint 9)
- [ ] **Authentication** - MEDIUM
  - Status: JWT auth working (Phase 1)
  - Azure AD B2C: Deferred to Epic 13
  - Sprint 9: No changes to auth required

---

## 🧪 Section 5: Testing Infrastructure

### 5.1 Test Suite Baseline
- [ ] **Backend Unit Tests** - CRITICAL
  - Run: `npm run test` (in backend/)
  - Expected: 349 tests passing
  - Coverage: >80%
  
- [ ] **Frontend Component Tests** - CRITICAL
  - Run: `npm run test` (in frontend/)
  - Expected: 328 tests passing
  - Coverage: >75%
  
- [ ] **E2E Tests** - CRITICAL
  - Run: `npm run test:e2e` (in backend/)
  - Expected: 199 tests passing
  - Coverage: >90% critical paths
  
### 5.2 Test Environment
- [ ] **Test Database** - HIGH
  - Separate test DB: `gcredit-test`
  - Seeded with test data
  - Verify: E2E tests don't pollute dev DB
  
- [ ] **Test Users** - HIGH
  - 3 roles: Issuer, Employee, Admin
  - Test credentials documented
  - Verify: Can login with each role

---

## 🔑 Section 6: Access & Permissions

### 6.1 Team Access
- [ ] **Git Repository** - CRITICAL
  - All developers have push access
  - SSH keys configured (or HTTPS credentials)
  - Verify: Can push to feature branches
  
- [ ] **Azure Portal** - HIGH
  - Dev team has Contributor role
  - Can view resources, not delete
  - Can restart services if needed
  
- [ ] **Database Access** - MEDIUM
  - DBA credentials available
  - Direct DB access for debugging (use with caution)
  
### 6.2 Third-Party Services
- [ ] **npm Registry** - CRITICAL
  - Can install packages without errors
  - No proxy issues
  
- [ ] **GitHub Actions (CI/CD)** - HIGH
  - Workflows running correctly
  - Secrets configured
  - Verify: Last workflow passed

---

## 📚 Section 7: Documentation & Knowledge Transfer

### 7.1 Architecture Understanding
- [ ] **Badge Issuance Flow** - HIGH
  - Team understands: BadgeClass → BadgeInstance → Email
  - Review: `docs/architecture/badge-issuance-flow.md`
  
- [ ] **Bulk Issuance Design** - HIGH
  - Review Epic 8 design document
  - Understand: CSV → Validation → Preview → Batch Processing
  - Key pattern: Session-based workflow (30 min expiry)
  
### 7.2 Lessons Learned Review
- [ ] **Sprint 8 Retrospective** - HIGH
  - File: `docs/sprints/sprint-8/retrospective.md`
  - Key lessons:
    1. Test-driven development prevents regressions
    2. Code reviews catch edge cases early
    3. Incremental tasks improve estimation accuracy
  
- [ ] **Top 3 Lessons Applied to Sprint 9** - MEDIUM
  - Lesson 1: Bundle size monitoring from Story 1 (Sprint 6)
    - Action: TD-013 addresses this proactively
  - Lesson 2: Avoid over-engineering (Sprint 4)
    - Action: Story 8.4 Phase 1 MVP only (no advanced features)
  - Lesson 3: Parallel test execution (Sprint 8)
    - Action: Maintain test suite optimization
  
### 7.3 Technical Debt Context
- [ ] **TD Prioritization** - HIGH
  - Review: `docs/sprints/technical-debt-from-reviews.md`
  - Understand: TD-015 (ESLint), TD-014 (Email), TD-013 (Bundle)
  - Rationale: Prevent P2 → P1 escalation
  
- [ ] **TD Integration with Stories** - MEDIUM
  - TD-013 before Story 8.3 (prevent bundle bloat)
  - TD-014 before Story 8.4 (unified email system)
  - TD-015 parallel with stories (independent)

---

## ⚠️ Section 8: Risk Review

### 8.1 Known Risks (from Sprint Backlog)
- [ ] ~~**Redis Dependency for Story 8.4**~~ - **[RESOLVED]**
  - **Resolution**: MVP simplified to synchronous processing (no Redis)
  - **Impact**: 20-badge limit acceptable for pilot users
  - **Upgrade Path**: TD-016 when validated
  
- [ ] **20-Badge Limit User Acceptance** - MEDIUM
  - **Risk**: Users may expect unlimited batch size
  - **Mitigation**: Clear messaging in UI about MVP limit
  - **Validation**: Gather feedback in Sprint 9 demo and retrospective
  - **Action**: Document feedback for TD-016 decision point
  
- [ ] **Email Rate Limits** - MEDIUM
  - Status: ⏳ To be researched on Day 1
  - Mitigation: Batch processing with delays
  - Action: Check Azure Communication Services limits
  
- [ ] **Test RUser Messaging** - HIGH
  - Update bulk issuance UI to clearly show "MVP限制：最多20个徽章"
  - Document in demo script (30 min)
  
- [ ] **Feedback Collection** - MEDIUM
  - Add simple survey after bulk issuance: "Was 20-badge limit sufficient?"
  - Track usage metrics: batch sizes, frequency (Sprint 10 review)
  
### 8.2 Risk Mitigation Actions
- [ ] **Day 1 Risk Validation** - CRITICAL
  - Redis connection test (30 min)
  - Email rate limit research (30 min)
  - Document findings in Daily Notes
  
- [ ] **Risk Escalation Path** - HIGH
  - Blocker identified → Notify Scrum Master immediately
  - Scrum Master escalates to Tech Lead if needed
  - Document in sprint retrospective

---

## 🤝 Section 9: Team Readiness

### 9.1 Sprint Kickoff Ceremony
- [ ] **Meeting Scheduled** - CRITICAL
  - Date/Time: 2026-02-06 09:00 AM
  - Duration: 2 hours
  - Attendees: Full dev team, Scrum Master, Product Owner
  - Agenda:
    1. Sprint Goal review (15 min)
    2. Story walkthrough (30 min)
    3. TD plan discussion (15 min)
    4. Task assignment (30 min)
    5. Environment setup verification (15 min)
    6. Q&A (15 min)
  
### 9.2 Communication Channels
- [ ] **Daily Standup Schedule** - HIGH
  - Time: 09:30 AM daily
  - Duration: 15 minutes
  - Format: Asynchronous (Slack) or Sync (Teams call)
  
- [ ] **Issue Tracking** - MEDIUM
  - Tool: GitHub Issues or Azure DevOps (TBD)
  - Alternative: File-based (sprint-9/daily-notes.md)
  
- [ ] **Code Review Process** - HIGH
  - PRs reviewed within 24 hours
  - 1 approval required before merge
  - Reviewer checklist available
  
### 9.3 Availability & Capacity
- [ ] **Team Member Availability** - CRITICAL
  - Developer 1: 40h available (no vacation)
  - Developer 2: 40h available (no vacation)
  - Total capacity: 80h confirmed
  
- [ ] **Scrum Master Availability** - HIGH
  - Available for blockers escalation
  - Daily standup attendance
  - Mid-sprint check-in (Day 6)

---

## ✅ Section 10: Final Approval & Sign-Off

### 10.1 Pre-Kickoff Checklist Summary
- [ ] **Planning Artifacts:** __ / 5 complete (Target: 5/5)
- [ ] **Git Branch Setup:** __ / 3 complete (Target: 3/3)
- [ ] **Dev Environment:** __ / 9 complete (Target: 9/9)
- [ ] **Azure Resources:** __ / 7 complete (Target: 6/7 minimum)
- [ ] **Testing:** __ / 4 complete (Target: 4/4)
- [ ] **Access & Permissions:** __ / 4 complete (Target: 4/4)
- [ ] **Documentation:** __ / 7 complete (Target: 6/7 minimum)
- [ ] **Risk Review:** __ / 5 complete (Target: 4/5 minimum)
- [ ] **Team Readiness:** __ / 6 complete (Target: 5/6 minimum)
- [ ] **UX/Arch Review:** ✅ **COMPLETED** (2 P0 issues identified, +6h fixes)

**Overall Status:** ⏳ __% Complete (Target: ≥90% for kickoff)
~~Redis connection verified~~ **[REMOVED]** Not needed for MVP
- [ ] Team capacity confirmed (80h)
- [ ] Story 8.4 MVP scope understood (20-badge limit

### 10.2 Go/No-Go Decision

#### Critical Items (Must be 100%)
- [ ] Git branch created from clean main
- [ ] Backend + frontend dependencies installed
- [ ] All baseline tests passing (876 tests)
- [ ] ~~Redis connection verified~~ **[REMOVED]** Not needed for MVP
- [ ] Team capacity confirmed (80h)
- [ ] Story 8.4 MVP scope understood (20-badge limit)
- [x] **UX/Arch P0 issues fixed** ✅ (6h critical fixes COMPLETED 2026-02-05)
  - ✅ ARCH-C1: CSV Injection Prevention (24 tests added)
  - ✅ ARCH-C2: Session IDOR Validation (17 tests added)
  - ✅ UX-P0-1: Progress Indicator Component
  - ✅ UX-P0-2: Template Example Row Prefix
  - ✅ UX-P0-3: Error Correction Workflow

#### High Items (Must be ≥90%)
- [ ] All planning artifacts created
- [ ] Azure services accessible
- [ ] Documentation reviewed
- [ ] UX/Arch P1 recommendations documented for dev integration

#### Medium Items (Nice-to-have, can defer)
- [ ] Issue tracking tool configured
- [ ] Test users documented
- [ ] Epic 8 design doc finalized

---

### 10.3 Sign-Off

**Sprint 9 Kickoff Approval:**

- [ ] **Scrum Master (Bob):** _______________ (Date: _________)
  - Confirms: Planning complete, capacity realistic, risks identified

- [ ] **Tech Lead:** _______________ (Date: _________)
  - Confirms: Technical readiness, architecture sound, dependencies available

- [ ] **Development Team:** _______________ (Date: _________)
  - Confirms: Environment setup, story understanding, questions answered

- [ ] **Product Owner:** _______________ (Date: _________)
  - Confirms: Sprint goal aligns with product vision, priorities clear

---

### 10.4 Kickoff Decision

**Status:** ⏳ PENDING VERIFICATION  

**If GO:**
- ✅ Sprint 9 officially starts: 2026-02-06
- ✅ Move this file to `APPROVED` status
- ✅ Begin Story 0.1: Git branch creation

**If NO-GO:**
- ❌ Address blockers before starting sprint
- ❌ Reschedule kickoff meeting
- ❌ Document blockers in "Issues" section below

---

## 🚨 Issues & Blockers

### Open Issues
_(To be filled during kickoff preparation)_

| ID | Issue | Severity | Owner | ETA |
|----|-------|----------|-------|-----|
| 1 | TBD | - | - | - |

### Resolved Issues
| ID | Issue | Resolution | Resolved By | Date |
|----|-------|------------|-------------|------|
| - | - | - | - | - |

---

## 📝 Kickoff Meeting Notes

### Pre-Meeting Actions
- [ ] Share this checklist with team 24h before kickoff
- [ ] Team members review planning docs before meeting
- [ ] Prepare demo environment for story walkthrough

### During Meeting
- [ ] Record key decisions
- [ ] Document action items with owners
- [ ] Clarify any ambiguities in stories

### Post-Meeting Actions
- [ ] Finalize task assignments
- [ ] Update this checklist to APPROVED
- [ ] Create Day 1 work plan
- [ ] Archive kickoff meeting notes

---

## 🎓 Appendix: Sprint 6 Success Pattern & Sprint 9 MVP Simplification

**Why This Format?**  
Sprint 6 was the most successful sprint to date (100% story completion, 0 major bugs). Key success factors integrated into this checklist:

1. **Story 0.1 Git Branch as CRITICAL:** Prevented merge conflicts
2. ~~**Redis Verification Before Code:**~~ **[Sprint 9: Deferred]** Avoided mid-sprint blockers by simplifying to sync processing
3. **Daily Test Runs:** Caught regressions early
4. **TD Work Parallel to Features:** Maintained velocity without sacrificing quality

**Lessons Applied:**
- ✅ Git branch setup elevated to Story 0.1 (CRITICAL priority)
- ✅ ~~Redis connection test added to Section 3 (Day 1 requirement)~~ **[REMOVED]** MVP doesn't need Redis
- ✅ Test suite baseline verification in Section 5
- ✅ TD integration guidance in Section 7

**Sprint 9 MVP Simplification Benefits:**
- ✅ **Reduced Complexity**: No Redis setup/config on Day 1 (save 1-2 hours)
- ✅ **Faster Delivery**: Story 8.4 reduced from 8h → 4h
- ✅ **Cost Optimization**: Save $12/month Azure Redis during MVP
- ✅ **Lean Validation**: Test core workflow before adding infrastructure
- ✅ **Clear Upgrade Path**: TD-016 documented for Phase 2 when validated

---

**Document Owner:** Scrum Master (Bob)  
**Review Frequency:** Updated during Sprint 9 Planning, reviewed at kickoff  
**Template Source:** Enhanced sprint-planning-checklist.md v1.5 Section 13  
**Last Updated:** 2026-02-05 (Sprint 9 Planning)

---

**KICKOFF STATUS:** ⏳ PENDING APPROVAL (Target: 2026-02-06 09:00 AM)
