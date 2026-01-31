# Sprint 7 Kickoff Readiness Checklist

**Sprint:** Sprint 7 - Badge Revocation & Complete Lifecycle UAT  
**Epic:** Epic 9 - Badge Revocation  
**Status:** 🟢 READY TO START  
**Planning Completed:** January 31, 2026  
**Target Start Date:** February 3, 2026  
**Sprint Duration:** 5 days  
**Total Effort:** 31-43 hours (vs 60h capacity, 28-48% buffer)

---

## ✅ Sprint Planning Status

### Planning Completed (January 31, 2026)

**✅ ALL PLANNING TASKS COMPLETE**

- ✅ Sprint goal defined: 补齐Badge Revocation功能并完成完整生命周期的UAT验证
- ✅ Epic 9 stories decomposed (5 stories: 9.1-9.5)
- ✅ UAT stories created (3 stories: U.1-U.3)
- ✅ Git branch strategy defined
- ✅ Story 0.1 (Git branch) completed
- ✅ Time estimation: 31-43h vs 60h capacity
- ✅ Dependencies identified: No external blockers

**Planning Documentation (5 files, 4,305 lines):**
- ✅ [backlog.md](backlog.md) - 469 lines
- ✅ [version-manifest.md](version-manifest.md) - 372 lines  
- ✅ [uat-test-plan.md](uat-test-plan.md) - 675 lines
- ✅ [planning-summary.md](planning-summary.md) - 266 lines
- ✅ 9 story files - 2,874 lines (all using user-story-template.md)

**Git Status:**
- ✅ Branch created: `sprint-7/epic-9-revocation-lifecycle-uat`
- ✅ Branch pushed to remote
- ✅ All planning documents committed (4 commits)

---

## 📋 Pre-Kickoff Readiness Checklist

### 1. Sprint Planning Complete ✅

- [x] **Sprint Goal Defined**
  - Goal: 补齐Badge Revocation功能并完成完整生命周期的UAT验证
  - Success Criteria: Epic 9 100% complete + UAT executed + P0/P1 bugs fixed
  
- [x] **Stories Defined & Estimated**
  - 9 stories total (Story 0.1 + Stories 9.1-9.5 + Stories U.1-U.3)
  - Each story has complete file with AC, Technical Details, Test Plan
  - 31-43h estimated vs 60h capacity (28-48% buffer)

- [x] **Dependencies Identified**
  - No external blockers
  - All stories have clear dependency chain documented
  - Story 0.1 (Git branch) already complete ✅

---

### 2. Technical Environment Check 🔧

#### Backend Environment
- [ ] **Backend Server Running**
  ```powershell
  cd gcredit-project/backend
  npm run start:dev
  # Expected: http://localhost:3000 accessible
  ```
  
- [ ] **Database Connection Verified**
  ```powershell
  # Test Prisma connection
  npx prisma studio
  # Expected: Prisma Studio opens at http://localhost:5555
  ```

- [ ] **All Tests Passing**
  ```powershell
  npm test
  # Expected: 228/244 tests passing (16 Teams tests deferred as technical debt)
  ```

#### Frontend Environment
- [ ] **Frontend Dev Server Running**
  ```powershell
  cd gcredit-project/frontend
  npm run dev
  # Expected: http://localhost:5173 accessible
  ```

- [ ] **Frontend Tests Passing**
  ```powershell
  npm test
  # Expected: All tests pass
  ```

#### Git Repository
- [x] **Git Branch Verified**
  ```powershell
  git branch
  # Expected: * sprint-7/epic-9-revocation-lifecycle-uat
  ```
  **Status:** ✅ Verified (Story 0.1 complete)

- [ ] **Working Tree Clean**
  ```powershell
  git status
  # Expected: "nothing to commit, working tree clean"
  ```

---

### 3. Sprint 7 Backlog Review 📖

- [x] **Backlog Document Available**
  - File: [backlog.md](backlog.md) (469 lines)
  - Stories: 9 stories defined
  - Timeline: 5-day sprint breakdown
  
- [x] **Story Files Created**
  - All 9 story files created using user-story-template.md
  - Each story has: User Story, AC, Technical Details, Test Plan, DoD
  - Files: 0-1-git-branch.md, 9-1 through 9-5, U-1 through U-3

- [x] **UAT Test Plan Available**
  - File: [uat-test-plan.md](uat-test-plan.md) (675 lines)
  - 4 comprehensive test scenarios
  - Screen recording instructions
  - UAT report template

---

### 4. Definition of Done Review ✅

Each story must meet:
- [ ] **Code Complete**
  - All acceptance criteria met
  - No TypeScript/ESLint errors
  - Code follows project conventions

- [ ] **Testing Complete**
  - Unit tests >80% coverage
  - E2E tests written
  - Manual testing passed

- [ ] **Documentation Complete**
  - Code comments added
  - Story file updated with completion notes
  - API documentation updated (if applicable)

- [ ] **Code Review Complete**
  - Self-review done
  - PR description complete
  - Committed to sprint branch

---

### 5. Key Technical Decisions Review 🏗️

#### Database Schema Changes
```prisma
model Badge {
  // NEW FIELDS FOR REVOCATION:
  revokedAt       DateTime?
  revokedBy       String?      // FK to User.id
  revocationReason String?     // Enum or text
  revocationNotes  String?     // Max 1000 chars
  
  revoker         User?        @relation(fields: [revokedBy], references: [id])
}

enum BadgeStatus {
  ISSUED
  CLAIMED
  REVOKED  // NEW
}
```

**Migration Required:** Yes (Story 9.1)
- Add 4 new columns to Badge table
- Update BadgeStatus enum
- Test migration on local DB first

#### New API Endpoints
- `POST /api/badges/:id/revoke` - Revoke badge with reason (Story 9.1)
- Updates to existing endpoints:
  - `GET /verify/:verificationId` - Show revoked status (Story 9.2)
  - `GET /api/badges/my-badges` - Include revoked badges (Story 9.3)

#### New Frontend Components
- `RevokeBadgeModal.tsx` - Admin revocation UI (Story 9.5)
- Badge wallet updates for revoked display (Story 9.3)
- Verification page revoked status styling (Story 9.2)

---

### 6. Risk Assessment & Mitigation 🚨

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UAT discovers many P0 bugs | Medium | High | 17-29h buffer allocated for Story U.3 |
| Database migration issues | Low | Medium | Test migration locally, have rollback script |
| Revoked badge display complexity | Low | Medium | Reuse existing components, wireframes provided |
| Time overrun on UAT | Medium | Medium | Prioritize P0/P1, defer P2/P3 to Sprint 8 |

**Buffer Strategy:**
- 31-43h estimated vs 60h capacity = 17-29h buffer (28-48%)
- If bugs exceed buffer, defer P1 bugs to Sprint 8
- Story U.3 has variable scope (2-8 points) to absorb unknowns

---

### 7. Resource Verification 🔧

#### No New Dependencies Required
- [x] All Sprint 7 features use existing packages
- [x] Prisma 6.19.2 locked (no upgrade needed)
- [x] version-manifest.md created with complete snapshot

#### Azure Resources (Existing)
- [x] PostgreSQL Flexible Server: `gcredit-test-db-server`
- [x] Storage Account: `gcredittest2026storage`
- [x] Resource Group: `gcredit-test-rg`
- [x] No new Azure resources needed

#### Credentials Verified
- [ ] Database connection string in `.env`
- [ ] Azure Storage connection string in `.env`
- [ ] JWT secret configured

---

### 8. Communication & Tracking 📊

#### Daily Self-Check Questions (Solo Developer)
1. **What did I complete yesterday?** (Story #, hours spent)
2. **What will I work on today?** (Story #, planned hours)
3. **Any blockers or risks?** (Dependencies, unknowns)

#### Progress Tracking
- **sprint-tracking.md** (to be created Day 1)
  - Real-time story status updates
  - Actual time vs estimated time
  - Development notes and decisions
  
- **sprint-status.yaml** (to be created Day 5)
  - Final sprint summary
  - Test results
  - Technical debt documentation

#### Sprint Success Metrics
- **Story Completion:** 9/9 stories done (100%)
- **Test Coverage:** Maintain >80% unit test coverage
- **UAT Pass Rate:** Target >90% scenarios passing first time
- **Bug Fix Rate:** All P0 bugs fixed, 80%+ P1 bugs fixed

---

### 9. Sprint 6 Lessons Applied 🎓

**Lesson 20:** Unit tests don't catch all integration issues
- ✅ **Applied:** Added formal UAT phase (Story U.1, 8 hours)
- ✅ **Applied:** UAT test plan with 4 comprehensive scenarios

**Lesson 21:** Story files missing caused confusion
- ✅ **Applied:** All 9 story files created upfront (2,874 lines)
- ✅ **Applied:** Each story uses standardized template

**Lesson 22:** Manual testing found 15 bugs unit tests missed
- ✅ **Applied:** Story U.3 allocated for bug fixes (6-16h buffer)
- ✅ **Applied:** Demo seed data script (Story U.2) for efficient testing

**Lesson 23:** Tailwind CSS issues on modals
- ✅ **Applied:** Documented inline styles workaround in Story 9.5

---

### 10. Immediate Next Steps (Kickoff Actions) 🚀

**When kickoff begins (February 3, 2026):**

#### Step 1: Verify Environment (15 min)
```powershell
# 1. Check git branch
git branch
# Expected: * sprint-7/epic-9-revocation-lifecycle-uat

# 2. Pull latest changes
git pull

# 3. Start backend
cd gcredit-project/backend
npm run start:dev
# Verify: http://localhost:3000/api/health returns OK

# 4. Start frontend (new terminal)
cd gcredit-project/frontend
npm run dev
# Verify: http://localhost:5173 loads login page

# 5. Verify database
cd gcredit-project/backend
npx prisma studio
# Verify: Prisma Studio opens, can see tables
```

#### Step 2: Create Sprint Tracking File (10 min)
- Create `sprint-tracking.md` based on Sprint 6 template
- Initialize with all 9 stories in "NOT STARTED" status
- Set up progress metrics table

#### Step 3: Begin Story 9.1 Development (Day 1)
- Review [9-1-revoke-api.md](9-1-revoke-api.md)
- Create database migration
- Implement revocation API endpoint
- Write unit tests

---

## 📊 Sprint 7 Timeline Overview

**Day 1 (Feb 3):**
- ✅ Story 0.1: Git Branch (DONE)
- 🔵 Story 9.1: Revoke API (5h)
- 🔵 Story 9.2: Verification Status (4.5h)

**Day 2 (Feb 4):**
- 🔵 Story 9.3: Wallet Display (5.5h)
- 🔵 Story 9.4: Notifications (4h)
- 🔵 Story 9.5: Admin UI (6h)

**Day 3 (Feb 5):**
- 🔵 Story U.2: Demo Seed Data (3.5h, morning)
- 🔵 Story U.1: Complete Lifecycle UAT (8h, full day with recording)

**Day 4-5 (Feb 6-7):**
- 🔵 Story U.3: UAT Bug Fixes (6-16h)
- 🔵 Regression Testing
- 🔵 Sprint 7 Completion

---

## ✅ Readiness Confirmation

**By checking all boxes below, Sprint 7 is ready to start:**

- [x] ✅ Sprint planning 100% complete (all 5 planning docs created)
- [x] ✅ Git branch created and pushed to remote
- [x] ✅ All 9 story files created with complete details
- [x] ✅ UAT test plan created (675 lines, 4 scenarios)
- [x] ✅ Version manifest created (no new dependencies)
- [ ] ⏳ Backend environment verified (pending kickoff)
- [ ] ⏳ Frontend environment verified (pending kickoff)
- [ ] ⏳ Database connection verified (pending kickoff)
- [ ] ⏳ Working tree clean (pending kickoff)

**Planning Status:** ✅ 100% COMPLETE  
**Environment Status:** ⏳ PENDING VERIFICATION  
**Ready to Start:** 🟡 ALMOST (environment check needed)

---

## 📝 Kickoff Meeting Agenda (15 min)

### 1. Sprint Goal Review (2 min)
- Goal: Complete Badge Revocation + Execute Complete Lifecycle UAT
- Success: Epic 9 done + UAT passed + P0/P1 bugs fixed

### 2. Story Walkthrough (5 min)
- Epic 9: Stories 9.1-9.5 (Badge Revocation)
- UAT Phase: Stories U.1-U.3 (Testing & Bug Fixes)
- Demo Story 0.1 (Git branch) already complete ✅

### 3. Technical Architecture (3 min)
- Database changes: 4 new Badge fields
- New API: POST /api/badges/:id/revoke
- Frontend components: RevokeBadgeModal, wallet updates, verification styling

### 4. UAT Preparation (2 min)
- Story U.2: Demo seed data script
- Story U.1: Screen recording setup
- Bug triage strategy (P0/P1/P2/P3)

### 5. Environment Verification (3 min)
- Run through environment checklist (Section 2)
- Verify backend, frontend, database all working
- Confirm git branch active

**Post-Kickoff:** Immediately begin Story 9.1 development

---

## 📚 Reference Documents

### Sprint 7 Planning Documents
- [backlog.md](backlog.md) - Sprint 7 backlog (469 lines)
- [version-manifest.md](version-manifest.md) - Dependency snapshot (372 lines)
- [uat-test-plan.md](uat-test-plan.md) - UAT scenarios (675 lines)
- [planning-summary.md](planning-summary.md) - Planning summary (266 lines)

### Sprint 7 Story Files (9 files, 2,874 lines)
- [0-1-git-branch.md](0-1-git-branch.md) - Git branch creation (DONE)
- [9-1-revoke-api.md](9-1-revoke-api.md) - Badge Revocation API
- [9-2-verification-status.md](9-2-verification-status.md) - Verification page revoked status
- [9-3-wallet-display.md](9-3-wallet-display.md) - Employee wallet revoked badges
- [9-4-notifications.md](9-4-notifications.md) - Revocation email notifications
- [9-5-admin-ui.md](9-5-admin-ui.md) - Admin revocation UI
- [U-1-lifecycle-uat.md](U-1-lifecycle-uat.md) - Complete lifecycle UAT
- [U-2-demo-seed.md](U-2-demo-seed.md) - Demo seed data script
- [U-3-bug-fixes.md](U-3-bug-fixes.md) - UAT bug fixes

### Template References
- [user-story-template.md](../../templates/user-story-template.md) - Story file format
- [sprint-planning-checklist.md](../../templates/sprint-planning-checklist.md) - Planning workflow

### Previous Sprint References
- [Sprint 6 Retrospective](../sprint-6/sprint-6-retrospective.md) - Lessons learned
- [Sprint 6 Completion Report](../sprint-6/sprint-6-completion-report.md) - Final metrics

---

**Prepared By:** Bob (Scrum Master)  
**Prepared Date:** January 31, 2026  
**Planning Completed:** 100% ✅  
**Ready for Kickoff:** February 3, 2026 (after environment verification)

---

🎉 **Sprint 7 Planning Complete - Ready for Kickoff!**
