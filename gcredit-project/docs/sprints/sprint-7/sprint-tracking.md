# Sprint 7 - Story Tracking (Development Progress)

**Sprint:** Sprint 7 - Badge Revocation & Complete Lifecycle UAT  
**Start Date:** February 3, 2026  
**End Date:** February 11, 2026  
**Duration:** 7 working days (extended from 5 days after Technical Review)  
**Status:** 🟢 Ready for Day 1  
**Development Mode:** Solo Developer (LegendZhu)

---

## 📊 Sprint Progress Overview

| Metric | Value | Status |
|--------|-------|--------|
| **Stories Completed** | 1/11 | 9% |
| **Hours Spent** | 0h | - |
| **Estimated Remaining** | 54.5h | - |
| **Sprint Capacity** | 56h (7 days × 8h) | - |
| **Buffer** | 1.5h (3% capacity buffer) | 🟢 Healthy |
| **Current Velocity** | - | TBD |
| **Sprint Status** | 🟢 ALL PREP COMPLETE | Day 1 starts Feb 3 |

---

## 🗓️ Sprint Timeline (7 Days)

**Day 1 (Feb 3):** Backend Foundation
- Story 9.1: Revoke API (7h) + axe-core setup (0.5h)

**Day 2 (Feb 4):** Revocation UX  
- Stories 9.2 (4h) + 9.3 (4h) + Design sync (15min)

**Day 3 (Feb 5):** Login & M365 Sync
- Story 0.2a: Login MVP (6h) + Story U.2a: M365 Sync MVP (6h) - 12h split across day

**Day 4 (Feb 6):** Revocation Polish
- Story 9.5: Admin UI (4.5h) + Story 9.4: Notifications (3.5h)

**Day 5-6 (Feb 7-10):** Complete UAT
- Story U.1: Complete Lifecycle UAT (10-12h over 2 days)

**Day 7 (Feb 11):** Bug Fixes & Wrap-Up
- Story U.3: Bug fixes (3-5h) + Buffer + Retrospective

---

## 📋 Story Execution Order & Status

### **Phase 1: Sprint Setup (Prerequisites)** ✅

#### ✅ Story 0.1: Create Sprint 7 Git Branch
- **Status:** ✅ COMPLETE (2026-01-31)
- **Effort:** 5 minutes
- **Priority:** CRITICAL
- **Branch Name:** `sprint-7/epic-9-revocation-lifecycle-uat`
- **Deliverables:**
  - ✅ Branch created and pushed to remote
  - ✅ Verified clean working tree
  - ✅ All planning documents on sprint branch
- **Commits:**
  - d9d0827: Sprint 7 planning documents initialization
  - fd163b6: Add Story 0.1 and finalize Git branch strategy
  - 87fcfc0: Create all 9 story files using user-story-template
  - 692a577: Update planning-summary with story files completion
  - e30beeb: Add kickoff-readiness checklist
- **Notes:** Planning 100% complete, ready for Day 1 development

---

### **Phase 2: Sprint Setup Part 2 (Day 3)** 🔵

#### 🔵 Story 0.2a: Simple Login & Navigation System (MVP)
- **Status:** 🔲 NOT STARTED
- **Effort:** 6h estimated (updated from 4h after Technical Review)
- **Priority:** CRITICAL
- **Story Points:** 4 → 6 (MVP scope)
- **Dependencies:** Stories 9.1-9.3 (core features ready for integration)
- **Story File:** [0-2-login-navigation.md](0-2-login-navigation.md)
- **Target Start:** February 5, 2026 (Day 3 Morning)
- **Target Completion:** February 5, 2026 (Day 3 Afternoon)
- **Deliverables:**
  - LoginPage component (basic accessibility)
  - Auth store (Zustand, NO token refresh in MVP)
  - Admin + Employee dashboards only
  - Protected routes with role guards
  - Top navigation layout
  - Test accounts for UAT
- **Acceptance Criteria:**
  - [ ] Login page with email/password + basic ARIA labels
  - [ ] Auth state in Zustand (no token refresh logic)
  - [ ] Admin + Employee dashboards (Manager/Issuer deferred to Sprint 8)
  - [ ] Protected routes redirect unauthenticated users
  - [ ] Logout functionality
  - [ ] Top nav layout (sidebar evaluated in UAT)
- **Tasks:**
  - [ ] Create auth store (Zustand, simplified)
  - [ ] Create LoginPage with basic accessibility
  - [ ] Create ProtectedRoute component
  - [ ] Create Admin + Employee dashboard variants
  - [ ] Create top navigation layout
  - [ ] Update router
  - [ ] Basic unit tests + E2E tests
- **Why Critical:** Enables multi-role UAT testing in Story U.1. Without this, cannot test complete badge lifecycle.
- **MVP Notes:** 
  - No token refresh (acceptable for <1h UAT sessions)
  - Basic accessibility only (full WCAG 2.1 AA in Story 0.2b, Sprint 8)
  - Top nav only (sidebar deferred to Sprint 8)
- **Deferred to 0.2b:** Token refresh, full WCAG 2.1 AA, Manager/Issuer dashboards

---

### **Phase 3: Epic 9 - Badge Revocation (Day 1-2)** 🔵

#### 🔵 Story 9.1: Badge Revocation API
- **Status:** 🔲 NOT STARTED
- **Effort:** 7h estimated (updated from 5h - added AuditLog table + enum changes)
- **Priority:** HIGH
- **Story Points:** 5 → 7
- **Dependencies:** Story 0.1 ✅
- **Story File:** [9-1-revoke-api.md](9-1-revoke-api.md)
- **Target Start:** February 3, 2026 (Day 1 Morning)
- **Target Completion:** February 3, 2026 (Day 1)
- **Deliverables:**
  - **NEW:** AuditLog Prisma model creation
  - **NEW:** REVOKED enum added to BadgeStatus
  - Database migration (Badge revocation fields)
  - POST /api/badges/:id/revoke endpoint (idempotent)
  - Revocation service logic
  - Authorization rules (ADMIN, ISSUER only)
  - Audit logging in AuditLog table
  - Unit tests (15-20 tests, TDD approach)
  - E2E tests
- **Acceptance Criteria:**
  - [ ] AuditLog table created with proper schema
  - [ ] BadgeStatus enum includes REVOKED status
  - [ ] Badge status updated to REVOKED (not soft delete)
  - [ ] Revocation metadata recorded (date, reason, notes, revoker)
  - [ ] Authorization enforced (403 if unauthorized)
  - [ ] Audit log entry created in AuditLog table
  - [ ] API is idempotent (200 OK if already revoked)
- **Tasks:**
  - [ ] Create AuditLog Prisma model + migration
  - [ ] Update BadgeStatus enum (add REVOKED)
  - [ ] Create Badge revocation fields migration
  - [ ] Implement service layer (revoke logic + audit)
  - [ ] Create DTO with validation
  - [ ] Implement controller & guards
  - [ ] Write unit tests (TDD - tests first)
  - [ ] Write E2E tests
  - [ ] Manual API testing
- **Technical Review Updates:**
  - +2h for AuditLog infrastructure setup
  - TDD approach required (high risk story)
  - Index on revokedAt field for performance
- **Notes:** 

---

#### 🔵 Story 9.2: Revoked Badge Display in Verification Page
- **Status:** 🔲 NOT STARTED
- **Effort:** 4h estimated (updated from 3h - added reason categorization)
- **Priority:** HIGH
- **Story Points:** 3 → 4
- **Dependencies:** Story 9.1
- **Story File:** [9-2-verification-status.md](9-2-verification-status.md)
- **Target Start:** February 4, 2026 (Day 2 Morning)
- **Target Completion:** February 4, 2026 (Day 2)
- **Deliverables:**
  - Backend: Update verify API to return status + categorized reason
  - Frontend: RevokedBadgeAlert component
  - Verification page styling updates
  - Reason visibility logic (public vs private categories)
  - Disable Download/Share buttons for revoked badges
  - Unit tests (frontend + backend)
  - E2E test
- **Acceptance Criteria:**
  - [ ] Red alert banner displays "BADGE REVOKED"
  - [ ] Public reasons shown (Expired, Error, Duplicate)
  - [ ] Private reasons show generic message (Policy Violation, Fraud)
  - [ ] Revocation date displayed
  - [ ] Original badge details grayed out
  - [ ] Download and Share buttons disabled
- **Tasks:**
  - [ ] Backend: Update GET /verify/:id response with reason category
  - [ ] Backend: Add reason categorization logic
  - [ ] Frontend: Create RevokedBadgeAlert component
  - [ ] Frontend: Update VerifyBadgePage component
  - [ ] Styling (Tailwind CSS)
  - [ ] Unit tests
  - [ ] E2E test
- **UX Decision:** Show public reasons only to external verifiers (Product Owner approved)
- **Notes:**

---

#### 🔵 Story 9.3: Employee Wallet Display for Revoked Badges
- **Status:** 🔲 NOT STARTED
- **Effort:** 5.5h estimated
- **Priority:** HIGH
- **Story Points:** 3
- **Dependencies:** Story 9.1
- **Story File:** [9-3-wallet-display.md](9-3-wallet-display.md)
- **Target Start:** February 4, 2026 (Day 2 Morning)
- **Target Completion:** February 4, 2026 (Day 2)
- **Deliverables:**
  - Backend: Update my-badges API
  - Frontend: BadgeCard status display
  - Badge wallet filter UI (Active/Revoked/All)
  - BadgeDetailsModal revocation section
  - Unit tests + E2E test
- **Acceptance Criteria:**
  - [ ] Revoked badges show red "REVOKED" badge overlay
  - [ ] Badge card grayed out or red border
  - [ ] Status filter works (Active/Revoked/All)
  - [ ] Default filter shows Active badges only
  - [ ] Download/Share disabled for revoked badges
- **Tasks:**
  - [ ] Backend: Update GET /api/badges/my-badges
  - [ ] Frontend: Update BadgeCard component
  - [ ] Frontend: Add filter UI (tabs)
  - [ ] Frontend: Update BadgeDetailsModal
  - [ ] Unit tests
  - [ ] E2E test
- **Notes:**

---

#### 🔵 Story 9.4: Badge Revocation Notifications
- **Status:** 🔲 NOT STARTED
- **Effort:** 4h estimated
- **Priority:** MEDIUM
- **Story Points:** 2
- **Dependencies:** Story 9.1
- **Story File:** [9-4-notifications.md](9-4-notifications.md)
- **Target Start:** February 4, 2026 (Day 2)
- **Target Completion:** February 4, 2026 (Day 2)
- **Deliverables:**
  - Email template (HTML + plain text)
  - NotificationsService.sendBadgeRevokedEmail()
  - Async email sending integration
  - Unit tests + E2E test
- **Acceptance Criteria:**
  - [ ] Email sent on badge revocation
  - [ ] Email contains badge name, date, reason, notes
  - [ ] Email links to wallet page
  - [ ] Email sending does not block API response (async)
  - [ ] Retry logic for failed sends
- **Tasks:**
  - [ ] Create email template
  - [ ] Implement sendBadgeRevokedEmail()
  - [ ] Integrate with BadgesService
  - [ ] Unit tests
  - [ ] Send test emails
- **Notes:**

---

#### 🔵 Story 9.5: Admin Badge Revocation UI
- **Status:** 🔲 NOT STARTED
- **Effort:** 6h estimated
- **Priority:** HIGH
- **Story Points:** 4
- **Dependencies:** Story 9.1
- **Story File:** [9-5-admin-ui.md](9-5-admin-ui.md)
- **Target Start:** February 4, 2026 (Day 2 Afternoon)
- **Target Completion:** February 4, 2026 (Day 2)
- **Deliverables:**
  - RevokeBadgeModal component
  - Badge Management page integration
  - Reason dropdown + notes textarea
  - Success/error toast notifications
  - Unit tests + E2E test
- **Acceptance Criteria:**
  - [ ] Revoke button visible on Badge Management page
  - [ ] Modal opens with form (reason + notes)
  - [ ] API integration works
  - [ ] Badge status updates in table after revoke
  - [ ] Authorization enforced (Admin/Issuer only)
- **Tasks:**
  - [ ] Create RevokeBadgeModal component
  - [ ] Update Badge Management page
  - [ ] API client function
  - [ ] Styling
  - [ ] Unit tests
  - [ ] E2E test
- **Notes:**

---

### **Phase 4: UAT Phase (Day 3-5)** 🔵

#### 🔵 Story U.2: Demo Seed Data Creation
- **Status:** 🔲 NOT STARTED
- **Effort:** 3.5h estimated
- **Priority:** HIGH
- **Story Points:** 3
- **Dependencies:** Story 0.1
- **Story File:** [U-2-demo-seed.md](U-2-demo-seed.md)
- **Target Start:** February 5, 2026 (Day 3 Afternoon)
- **Target Completion:** February 5, 2026 (Day 3 Evening)
- **Deliverables:**
  - seed-demo.ts script
  - seed-reset.ts script
  - package.json scripts (npm run seed:demo, seed:reset)
  - 4 test users (Admin, Issuer, Manager, Employee)
  - 5 badge templates
  - 10+ badges (various statuses: ISSUED, CLAIMED, REVOKED)
- **Acceptance Criteria:**
  - [ ] Script runs in <60 seconds
  - [ ] All 4 users created with test credentials
  - [ ] All 5 templates created
  - [ ] 10+ badges with diverse statuses
  - [ ] Idempotent (can run multiple times)
- **Tasks:**
  - [ ] Design data structure
  - [ ] Write seed-demo.ts
  - [ ] Write seed-reset.ts
  - [ ] Add package.json scripts
  - [ ] Test script
  - [ ] Update documentation
- **Notes:** Must complete before Story U.1 (UAT execution)

---

#### 🔵 Story U.1: Complete Badge Lifecycle UAT Execution
- **Status:** 🔲 NOT STARTED
- **Effort:** 8h estimated (full day)
- **Priority:** CRITICAL
- **Story Points:** 6
- **Dependencies:** Stories 9.1-9.5, 0.2, U.2
- **Story File:** [U-1-lifecycle-uat.md](U-1-lifecycle-uat.md)
- **Target Start:** February 6, 2026 (Day 4, Full Day)
- **Target Completion:** February 6, 2026 (Day 4 EOD)
- **Deliverables:**
  - Scenario 1: Happy Path (8 steps, 26 min, recorded)
  - Scenario 2: Error Handling (6 cases, recorded)
  - Scenario 3: Security & Privacy (5 cases, recorded)
  - Scenario 4: Integration Points (3 cases, recorded)
  - UAT report (filled out with all findings)
  - Bug GitHub Issues created
- **Acceptance Criteria:**
  - [ ] All 4 scenarios executed fully
  - [ ] All steps documented (pass/fail)
  - [ ] Screen recordings uploaded (4 videos minimum)
  - [ ] UAT report completed
  - [ ] All bugs documented in GitHub Issues
- **Tasks:**
  - [ ] Setup: Load demo seed data
  - [ ] Execute Scenario 1 (record video)
  - [ ] Execute Scenario 2 (record video)
  - [ ] Execute Scenario 3 (record video)
  - [ ] Execute Scenario 4 (record video)
  - [ ] Document bugs
  - [ ] Fill out UAT report
  - [ ] Upload videos
- **Notes:** See [uat-test-plan.md](uat-test-plan.md) for detailed scenarios

---

#### 🔵 Story U.3: UAT Issue Resolution and Bug Fixes
- **Status:** 🔲 NOT STARTED
- **Effort:** 6-16h estimated (variable based on bugs found)
- **Priority:** VARIABLE (depends on bug severity)
- **Story Points:** 2-8 (TBD after UAT)
- **Dependencies:** Story U.1
- **Story File:** [U-3-bug-fixes.md](U-3-bug-fixes.md)
- **Target Start:** February 7, 2026 (Day 5)
- **Target Completion:** February 7, 2026 (Day 5)
- **Deliverables:**
  - All P0 bugs fixed
  - P1 bugs fixed (time permitting)
  - P2/P3 bugs backlogged
  - Regression tests added
  - Manual smoke test passed
  - CHANGELOG.md updated
- **Acceptance Criteria:**
  - [ ] All P0 bugs fixed and verified
  - [ ] P1 bugs fixed OR moved to Sprint 8
  - [ ] P2/P3 bugs documented and backlogged
  - [ ] Regression testing complete
  - [ ] Bug fix documentation complete
- **Tasks:**
  - [ ] Will be determined after UAT (Story U.1)
  - [ ] Bug tracking workflow followed
  - [ ] Fix bugs with regression tests
  - [ ] Manual re-testing
  - [ ] Documentation updates
- **Notes:** Scope will be updated after Story U.1 completes

---

## 🎯 Sprint 7 Success Metrics

### Definition of Done (Sprint Level)
- [ ] All 10 stories completed (100%)
- [ ] Story 0.2 (Login & Navigation) complete - UAT prerequisite
- [ ] Epic 9 (Badge Revocation) 100% complete
- [ ] Complete lifecycle UAT executed with login system
- [ ] All P0/P1 bugs fixed
- [ ] Test coverage maintained >80%
- [ ] All story files updated with completion notes
- [ ] sprint-status.yaml created
- [ ] Sprint 7 retrospective completed

### Test Metrics Target
- **Unit Tests:** Maintain >80% coverage
- **E2E Tests:** All new features covered
- **UAT Pass Rate:** Target >90% first-time pass
- **Bug Fix Rate:** All P0 fixed, 80%+ P1 fixed

### Time Tracking
- **Estimated:** 37-53h
- **Capacity:** 60h
- **Buffer:** 7-23h (12-38%)
- **Actual:** [TBD during sprint]

**Note:** Story 0.2 (Login & Navigation, 4-6h) added after kickoff. Required for complete UAT testing.

---

## 📝 Daily Progress Notes

### Day 1 (February 3, 2026) - Backend Foundation
**Target:** Stories 9.1, 9.2  
**Planned Hours:** 9.5h  
**Actual Hours:** [TBD]

**Morning Session:**
- [ ] Story 9.1: Badge Revocation API (5h)
  - Database migration
  - Service layer implementation
  - Tests

**Afternoon Session:**
- [ ] Story 9.2: Verification Status Display (4.5h)
  - Backend API updates
  - Frontend component
  - Tests

**Notes:**

---

### Day 2 (February 4, 2026) - Frontend & Notifications
**Target:** Stories 9.3, 9.4, 9.5  
**Planned Hours:** 15.5h  
**Actual Hours:** [TBD]

**Morning Session:**
- [ ] Story 9.3: Wallet Display (5.5h)
  - Backend API
  - Frontend filtering
  - Tests

**Afternoon Session:**
- [ ] Story 9.4: Notifications (4h)
  - Email templates
  - Integration
- [ ] Story 9.5: Admin UI (6h)
  - Modal component
  - Integration
  - Tests

**Notes:**

---

### Day 3 (February 5, 2026) - UI Foundation + UAT Prep
**Target:** Stories 9.5 (complete), 0.2, U.2  
**Planned Hours:** 2h + 4-6h + 3.5h = 9.5-11.5h  
**Actual Hours:** [TBD]

**Morning Session:**
- [ ] Story 9.5: Admin UI (complete, 2h remaining)
- [ ] Story 0.2: Login & Navigation System (4-6h)
  - Auth store
  - LoginPage
  - Dashboard
  - Protected routes
  - Tests

**Afternoon Session:**
- [ ] Story U.2: Demo Seed Data (3.5h)
  - Create script
  - Test data
  - Verify

**Notes:**

---

### Day 4 (February 6, 2026) - Complete Lifecycle UAT
**Target:** Story U.1  
**Planned Hours:** 8h  
**Actual Hours:** [TBD]

**Full Day:**
- [ ] Story U.1: Complete Lifecycle UAT (8h)
  - Execute all 4 scenarios with login system
  - Test multi-role workflows
  - Record videos
  - Document bugs
  - Create GitHub Issues

**Notes:**

---

### Day 5 (February 7, 2026) - Bug Fixes & Sprint Completion
**Target:** Story U.3, Sprint Closeout  
**Planned Hours:** 6-16h (bug fixes) + 4h (closeout)  
**Actual Hours:** [TBD]

**Full Day:**
- [ ] Story U.3: Fix P0/P1 bugs from UAT
- [ ] Regression testing
- [ ] Manual smoke test
- [ ] Sprint documentation
- [ ] Create sprint-status.yaml
- [ ] Sprint retrospective

**Notes:**

---

## 🏁 Sprint Completion Checklist

When all stories are done:
- [ ] All 10 stories marked COMPLETE (including Story 0.2)
- [ ] All story files updated with completion notes
- [ ] sprint-status.yaml created
- [ ] Sprint 7 completion report created
- [ ] Sprint 7 retrospective completed
- [ ] lessons-learned.md updated
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] Git: Merge sprint branch to main
- [ ] Git: Create release tag v0.7.0
- [ ] Git: Create GitHub Release

---

**Last Updated:** 2026-01-31 (Story 0.2 added after kickoff)  
**Maintained By:** LegendZhu  
**Status:** 🟡 Ready to Start
