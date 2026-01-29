# Sprint 6 Kickoff Checklist (打印版)

**Sprint:** Sprint 6 - Social Sharing & Widget Embedding  
**Epic:** Epic 7 - Badge Sharing & Social Proof  
**Date:** _______________ (Kickoff Day)  
**Duration:** 2.5-3 weeks (56-76 hours)  
**Team:** Winston, Amelia, Sally, Bob

---

## ✅ Pre-Kickoff Verification (Before Meeting Starts)

### 📋 Documentation Ready

- [ ] **Sprint 6 Backlog** - All team members have read `backlog.md` (1,317 lines)
- [ ] **Version Manifest** - ✅ Created 2026-01-29 (`version-manifest.md`)
- [ ] **Kickoff Readiness** - All preparation tasks reviewed (`kickoff-readiness.md`)
- [ ] **UX Audit Report** - Sally's audit reviewed by team (`ux-audit-report.md`)
- [ ] **Email Template Specs** - Design approved (`email-template-specs.md`)
- [ ] **Adaptive Card Specs** - Teams card design approved (`adaptive-card-specs.md`)

### 🔧 Technical Environment

- [ ] **Local Dev Environment** - Backend + Frontend running normally
- [ ] **PostgreSQL** - Database connection verified
- [ ] **Azure Storage** - `gcreditdevstoragelz` accessible
- [ ] **Node.js v20.20.0** - Version confirmed
- [ ] **Prisma 6.19.2** - Version locked (NOT 7.x)

### 🔑 Azure Tenant Information (LegendZhu Provides)

- [x] **AZURE_TENANT_ID** = `afc9fe8f-1d40-41fc-9906-e001e500926c` ✅
- [x] **AZURE_TENANT_DOMAIN** = `2wjh85.onmicrosoft.com` ✅
- [x] **M365 Admin Account** = `M365DevAdmin@2wjh85.onmicrosoft.com` ✅
- [x] **Admin Consent Approval** - ✅ Granted for all permissions
- [x] **AZURE_CLIENT_ID** = `ceafe2e0-73a9-46b6-a203-1005bfdda11f` ✅
- [x] **AZURE_CLIENT_SECRET** - ✅ Generated and configured in .env

---

## 📊 Kickoff Meeting Agenda (2 hours)

### Part 1: Sprint Overview (30 minutes)

#### Sprint Goal Confirmation
- [ ] **Primary Objective:** Email + Teams sharing with Microsoft Graph API
- [ ] **Success Criteria:** All 4 feature stories + TD-001 + UX improvements
- [ ] **Out of Scope:** LinkedIn sharing (deferred to Sprint 7)

#### Team Capacity Review
- [ ] **Amelia (Dev):** 100-120 hours → 56-76 committed (56-63% utilization)
- [ ] **Sally (UX):** 37-45 hours → 19 committed (42-51% utilization)
- [ ] **Winston (Architect):** 12-15 hours → 5-10 committed (33-67% utilization)
- [ ] **Bob (Scrum Master):** 12-15 hours → 6-9 committed (50-60% utilization)

#### Velocity & Risk Assessment
- [ ] **Historical Velocity:** 2-3h/story (complex features)
- [ ] **Sprint 6 Estimate:** 8-10h/story (first-time Graph API integration)
- [ ] **Buffer:** 20-25% for learning curve
- [ ] **Key Risk:** Microsoft Graph API learning curve → Mitigated with ADR-008 + documentation

---

### Part 2: Story Walkthrough (45 minutes)

#### Story 7.2: Email Badge Sharing (HIGH Priority)
- [ ] **Effort:** 12-16 hours
- [ ] **Dependencies:** Azure AD setup → Graph module → Email service
- [ ] **Acceptance Criteria:** Email sent via Microsoft Graph, HTML template rendered
- [ ] **Blocker Check:** None identified

#### Story 7.4: Microsoft Teams Notifications (HIGH Priority)
- [ ] **Effort:** 14-18 hours
- [ ] **Dependencies:** Graph module → Teams service → Adaptive Card builder
- [ ] **Acceptance Criteria:** Teams notification with interactive card, action buttons work
- [ ] **Blocker Check:** Requires Teams channel for testing

#### Story 7.3: Embeddable Badge Widget (MEDIUM Priority)
- [ ] **Effort:** 10-14 hours
- [ ] **Dependencies:** Badge endpoint working → Widget generator → CORS config
- [ ] **Acceptance Criteria:** HTML snippet generated, widget embeds on external site
- [ ] **Blocker Check:** None identified

#### Story 7.5: Sharing Analytics (LOW Priority)
- [ ] **Effort:** 8-12 hours
- [ ] **Dependencies:** BadgeShare table migration → Analytics service → Dashboard
- [ ] **Acceptance Criteria:** Share events tracked, basic analytics visible
- [ ] **Blocker Check:** None identified

#### Technical Stories
- [ ] **Azure AD App Registration** (4-6 hours) - Amelia + LegendZhu
- [ ] **Microsoft Graph Module** (8-12 hours) - Winston + Amelia
- [ ] **TD-001: E2E Test Isolation** (6-8 hours) - Amelia

#### UX Improvements (Optional - Scope Flexibility)
- [ ] **Add Share Button to Badge Detail Modal** - CRITICAL for Sprint 6
- [ ] **Mobile Date Sidebar** - Nice-to-have
- [ ] **Grid View Enhancements** - Deferred if time constrained

---

### Part 3: Day 1 Action Items (30 minutes)

#### Immediate Tasks (Today - Day 1)

**Amelia:**
- [ ] **Task 1:** Install Sprint 6 dependencies (see version-manifest.md)
  ```bash
  cd backend
  npm install @microsoft/microsoft-graph-client@3.0.7 @azure/identity@4.13.0 adaptivecards@3.0.5
  ```
- [ ] **Task 2:** Verify Prisma version (must be 6.19.2, NOT 7.x)
  ```bash
  npx prisma --version
  ```
- [ ] **Task 3:** Register Azure AD Application (with LegendZhu)
  - Go to Azure Portal → Azure Active Directory → App registrations → New registration
  - Name: "G-Credit-Dev"
  - Required permissions: Mail.Send, ChannelMessage.Send
  - Generate client secret → Save to .env

**Winston:**
- [ ] **Task 1:** Create ADR-008: Microsoft Graph Integration Strategy (30-45 min)
  - OAuth 2.0 Client Credentials Flow
  - Token management strategy
  - Error handling and retry logic
  - Production migration path

**Sally:**
- [ ] **Task 1:** Finalize Email Template mockup (if needed)
- [ ] **Task 2:** Prepare Teams Adaptive Card visual review

**Bob:**
- [ ] **Task 1:** Schedule Daily Standup time: ______________
- [ ] **Task 2:** Schedule Mid-Sprint Check (Day 8-10): ______________
- [ ] **Task 3:** Set up Sprint tracking board

---

### Part 4: Lessons Learned Review (15 minutes)

#### Sprint 0 Lesson 1: Version Drift
- [ ] **Reviewed:** Prisma 7 incident (1 hour debugging)
- [ ] **Mitigation:** Version manifest created ✅
- [ ] **Action:** Always verify Prisma version after `npm install`

#### Sprint 2 Lesson: Resource Duplication
- [ ] **Reviewed:** Almost created duplicate Azure Storage Account
- [ ] **Mitigation:** Resource checklist in backlog.md ✅
- [ ] **Action:** Check infrastructure-inventory.md before creating resources

#### Sprint 5 Lesson: Test Organization
- [ ] **Reviewed:** Test scripts should be in test-scripts/sprint-6/
- [ ] **Mitigation:** Folder structure prepared
- [ ] **Action:** Do NOT put test scripts in backend root

#### Cross-Sprint Pattern: Timeline-Based Testing
- [ ] **Reviewed:** Proven effective in Sprint 4-5
- [ ] **Action:** Use for complex Graph API scenarios

---

## 🚀 Sprint 6 Ceremonies Schedule (Agent-Assisted Development Mode)

### Daily Standup (Story-Based Checkpoints)
- **Trigger:** After each story completion
- **Duration:** 5-10 minutes (lightweight)
- **Format:** 
  - ✅ Story completed: [Story ID + Title]
  - ✅ Tests passing: [Yes/No + Count]
  - ⚠️ Issues encountered: [Blockers or learnings]
  - ➡️ Next story: [Story ID + Title]
- **Agent Role:** Verify DoD, update tracking, suggest next steps

### Mid-Sprint Check
- **Trigger:** After 50% stories completed (3.5-4 stories done)
- **Duration:** 30-45 minutes
- **Agenda:** 
  - Progress review (velocity vs estimates)
  - Time spent analysis
  - Remaining stories risk assessment
  - Technical debt check
  - Adjust scope if needed

### Sprint Review
- **Trigger:** All 7 stories + TD-001 completed and tested
- **Duration:** 1 hour
- **Agenda:**
  - Demo all features end-to-end
  - Verify DoD checklist (100%)
  - Document lessons learned
  - Update project-context.md
  - Prepare for Sprint 7

### Sprint Retrospective
- **Trigger:** Immediately after Sprint Review
- **Duration:** 30-45 minutes
- **Format:** 
  - What went well (Start)
  - What didn't work (Stop)
  - What to improve (Continue)
  - Update lessons-learned.md
  - Action items for next sprint

---

## 📋 Quick Reference - Critical Commands

### Version Verification
```bash
# Check Node.js version (must be v20.20.0)
node --version

# Check Prisma version (must be 6.19.2, NOT 7.x)
npx prisma --version

# Check installed packages
npm list @microsoft/microsoft-graph-client @azure/identity adaptivecards --depth=0
```

### Security Audit
```bash
# Frontend (should be 0 vulnerabilities)
cd frontend
npm audit --production

# Backend (6 known vulnerabilities, non-blocking)
cd backend
npm audit --production
```

### Quick Test
```bash
# Backend unit tests
cd backend
npm run test

# E2E tests (after TD-001 fix)
npm run test:e2e
```

---

## ⚠️ Known Issues & Workarounds

### Issue 1: Backend Security Vulnerabilities (6 total)
- **Status:** Non-blocking for Sprint 6
- **Impact:** Development dependencies only
- **Action:** Monitor, will address in Sprint 7+

### Issue 2: Microsoft Graph Rate Limiting
- **Risk:** 429 Too Many Requests during testing
- **Mitigation:** Implement exponential backoff (ADR-008)
- **Action:** Use test throttling in E2E tests

---

## ✅ Definition of Done (Sprint 6)

### Code Quality
- [ ] All unit tests passing (>80% coverage)
- [ ] E2E tests stable (TD-001 fixed)
- [ ] TypeScript compilation with 0 errors
- [ ] ESLint/Prettier formatting applied

### Feature Completeness
- [ ] Email sharing working via Microsoft Graph
- [ ] Teams notifications with Adaptive Cards working
- [ ] Widget embedding on external site working
- [ ] Analytics tracking all share events
- [ ] UAT completed with LegendZhu approval

### Documentation
- [ ] ADR-008 created (Microsoft Graph Integration)
- [ ] README.md updated with new features
- [ ] API documentation updated
- [ ] Test scripts documented in test-scripts/sprint-6/

### Infrastructure
- [ ] Azure AD App registered and configured
- [ ] Environment variables documented in .env.example
- [ ] BadgeShare table migrated to database
- [ ] Infrastructure-inventory.md updated

### Sprint Artifacts
- [ ] Sprint summary.md created
- [ ] Sprint retrospective.md created
- [ ] project-context.md updated
- [ ] Git tag created (v0.6.0)

---

## 📞 Contact Information

**LegendZhu (Project Lead)**
- Azure Admin: Tenant ID, Client credentials
- UAT Approval: Final sign-off

**Team Support**
- Winston: Architecture questions, ADRs
- Amelia: Implementation blockers, technical issues
- Sally: UX/Design questions, template reviews
- Bob: Process questions, ceremony scheduling

---

## 🎯 Success Criteria - Quick Checklist

At Sprint 6 end, we should be able to:

- [ ] **Send badge via email** → Recipient receives formatted email with badge details
- [ ] **Send badge to Teams** → Teams channel shows Adaptive Card notification
- [ ] **Generate widget** → Copy HTML snippet, embed on website, badge displays
- [ ] **View analytics** → Dashboard shows share counts (email/teams/widget)
- [ ] **All tests pass** → Unit, integration, E2E tests stable
- [ ] **UAT approved** → LegendZhu confirms all features work

---

**Print this checklist and use it during Kickoff meeting!**

**Kickoff Date:** _______________  
**Sprint End Date:** _______________  
**Team Signatures:**
- Winston: _______________
- Amelia: _______________
- Sally: _______________
- Bob: _______________
