# Sprint 6 - Story Tracking (Agent-Assisted Development)

**Sprint:** Sprint 6 - Social Sharing & Widget Embedding  
**Start Date:** 2026-01-29 (Kickoff完成)  
**Status:** 🟢 In Progress  
**Development Mode:** Agent-Assisted (LegendZhu + Agent协作)

---

## 📊 Sprint Progress Overview

| Metric | Value | Status |
|--------|-------|--------|
| **Stories Completed** | 0/7 | 0% |
| **Hours Spent** | 0h | - |
| **Estimated Remaining** | 56-76h | - |
| **Current Velocity** | - | TBD |
| **Mid-Sprint Check** | Not reached | Trigger: 3.5 stories done |

---

## 📋 Story Execution Order & Status

### **Phase 1: Foundation (Prerequisites)** ✅

#### ✅ Story 0.0: Sprint 6 Kickoff & Azure AD Setup
- **Status:** ✅ COMPLETE (2026-01-29)
- **Effort:** ~2h
- **Deliverables:**
  - Azure AD App registered: `ceafe2e0-73a9-46b6-a203-1005bfdda11f`
  - Permissions granted: Mail.Send, TeamsActivity.Send, Channel.ReadBasic.All, User.Read.All
  - Client Secret generated and configured
  - Environment variables updated in .env
  - Kickoff meeting completed
- **Tests:** N/A (Infrastructure)
- **Notes:** Completed during Kickoff preparation

#### ⏳ Story 0.1: Create Sprint 6 Git Branch
- **Status:** 🔲 NOT STARTED
- **Effort:** 5 minutes
- **Dependencies:** None
- **Branch Name:** `sprint-6/epic-7-badge-sharing`
- **Tasks:**
  - [ ] Ensure on main branch and up to date
  - [ ] Create new branch: sprint-6/epic-7-badge-sharing
  - [ ] Verify branch created successfully
  - [ ] Push branch to remote
- **Commands:**
  ```bash
  # 1. Switch to main and pull latest
  git checkout main
  git pull origin main
  
  # 2. Create and switch to new branch
  git checkout -b sprint-6/epic-7-badge-sharing
  
  # 3. Push branch to remote
  git push -u origin sprint-6/epic-7-badge-sharing
  
  # 4. Verify current branch
  git branch
  ```
- **Success Criteria:**
  - On sprint-6/epic-7-badge-sharing branch
  - Branch pushed to remote
  - Ready for Sprint 6 development
- **Agent Command:** "Create Sprint 6 Git branch"

---

### **Phase 2: Core Infrastructure (Day 1-2)**

#### ⏳ Story 0.2: Install Sprint 6 Dependencies
- **Status:** 🔲 NOT STARTED
- **Effort:** 0.5h
- **Dependencies:** None
- **Tasks:**
  - [ ] Install @microsoft/microsoft-graph-client@3.0.7
  - [ ] Install @azure/identity@4.13.0
  - [ ] Install adaptivecards@3.0.5
  - [ ] Verify Prisma version (6.19.2)
  - [ ] Test installation successful
- **Success Criteria:**
  - All packages installed without errors
  - npm list shows correct versions
  - Prisma version verified
- **Agent Command:** "Install Sprint 6 dependencies and verify versions"

#### ⏳ Story 0.3: Create ADR-008 (Microsoft Graph Integration)
- **Status:** 🔲 NOT STARTED
- **Effort:** 1h
- **Dependencies:** None
- **Deliverable:** `docs/decisions/ADR-008-microsoft-graph-integration.md`
- **Content:**
  - OAuth 2.0 Client Credentials Flow
  - Token management strategy
  - Error handling (exponential backoff)
  - Production migration path
  - Security considerations
- **Success Criteria:**
  - ADR follows template format
  - All decision points documented
  - Alternatives considered section complete
- **Agent Command:** "Create ADR-008 for Microsoft Graph integration"

#### ⏳ Story 0.4: Microsoft Graph Module Foundation
- **Status:** 🔲 NOT STARTED
- **Effort:** 4-6h
- **Dependencies:** Story 0.2, 0.3
- **Deliverables:**
  - `backend/src/microsoft-graph/microsoft-graph.module.ts`
  - `backend/src/microsoft-graph/services/graph-token-provider.service.ts`
  - `backend/src/microsoft-graph/services/graph-email.service.ts`
  - `backend/src/microsoft-graph/services/graph-teams.service.ts`
- **Tests:**
  - [ ] Token provider unit tests (mock Azure Identity)
  - [ ] Service initialization tests
- **Success Criteria:**
  - Module imports successfully in AppModule
  - Token provider can authenticate
  - Services instantiate without errors
- **Agent Command:** "Create Microsoft Graph module foundation"

---

### **Phase 3: Feature Stories (Day 3-15)**

#### 📧 Story 7.2: Email Badge Sharing
- **Status:** 🔲 NOT STARTED
- **Priority:** HIGH
- **Effort:** 12-16h
- **Dependencies:** Story 0.4
- **Deliverables:**
  - Email service with Graph API integration
  - HTML email template (from email-template-specs.md)
  - API endpoint: POST /api/badges/:id/share/email
  - Email send functionality
- **Tests:**
  - [ ] Unit tests for email service (mock Graph client)
  - [ ] Integration test with real Graph API
  - [ ] E2E test: send email and verify delivery
- **Success Criteria:**
  - Email sent successfully via Microsoft Graph
  - HTML template renders correctly
  - Recipient receives formatted email
  - Share event tracked in analytics
- **Agent Command:** "Implement Story 7.2 - Email Badge Sharing"
- **Daily Standup Trigger:** After completion

---

#### 💬 Story 7.4: Microsoft Teams Notifications
- **Status:** 🔲 NOT STARTED
- **Priority:** HIGH
- **Effort:** 14-18h
- **Dependencies:** Story 0.4
- **Deliverables:**
  - Teams service with TeamsActivity.Send
  - Adaptive Card builder (from adaptive-card-specs.md)
  - API endpoint: POST /api/badges/:id/share/teams
  - Teams notification functionality
- **Tests:**
  - [ ] Unit tests for Teams service
  - [ ] Adaptive Card schema validation
  - [ ] Integration test with real Teams
  - [ ] E2E test: send notification and verify in Teams
- **Success Criteria:**
  - Teams notification sent successfully
  - Adaptive Card displays correctly
  - Action buttons work (View Badge, Claim Now)
  - Share event tracked
- **Agent Command:** "Implement Story 7.4 - Teams Notifications"
- **Daily Standup Trigger:** After completion

---

#### 🌐 Story 7.3: Embeddable Badge Widget
- **Status:** 🔲 NOT STARTED
- **Priority:** MEDIUM
- **Effort:** 10-14h
- **Dependencies:** None (independent)
- **Deliverables:**
  - Widget controller and service
  - API endpoint: GET /api/badges/:id/widget
  - HTML snippet generator
  - CORS configuration
  - Responsive widget design
- **Tests:**
  - [ ] Unit tests for widget generator
  - [ ] Integration test: widget renders on external page
  - [ ] E2E test: embed widget and verify display
  - [ ] Responsive design tests (mobile/desktop)
- **Success Criteria:**
  - HTML snippet generated correctly
  - Widget embeds on external website
  - Responsive on mobile and desktop
  - Click tracking works
- **Agent Command:** "Implement Story 7.3 - Embeddable Widget"
- **Daily Standup Trigger:** After completion
- **🎯 MID-SPRINT CHECK:** Trigger after this story (3 stories done)

---

#### 📊 Story 7.5: Sharing Analytics
- **Status:** 🔲 NOT STARTED
- **Priority:** LOW
- **Effort:** 8-12h
- **Dependencies:** Story 7.2, 7.4, 7.3
- **Deliverables:**
  - BadgeShare table (Prisma migration)
  - Analytics service
  - API endpoint: GET /api/badges/:id/analytics
  - Analytics dashboard endpoint
- **Tests:**
  - [ ] Unit tests for analytics service
  - [ ] Integration test: share events recorded
  - [ ] E2E test: verify analytics accuracy
  - [ ] Database migration test
- **Success Criteria:**
  - BadgeShare table created
  - All share events tracked (email/teams/widget)
  - Analytics API returns correct data
  - Basic dashboard shows share counts
- **Agent Command:** "Implement Story 7.5 - Sharing Analytics"
- **Daily Standup Trigger:** After completion

---

### **Phase 4: Technical Debt & Polish (Day 16-18)**

#### 🐛 TD-001: E2E Test Isolation Fix
- **Status:** 🔲 NOT STARTED
- **Priority:** MEDIUM
- **Effort:** 6-8h
- **Dependencies:** Can be done anytime
- **Deliverables:**
  - Database transaction wrapper for E2E tests
  - Test data factories
  - Automatic rollback mechanism
  - Updated test documentation
- **Tests:**
  - [ ] All E2E tests run in isolation
  - [ ] No test interference
  - [ ] Automatic cleanup works
  - [ ] Test execution time acceptable
- **Success Criteria:**
  - E2E tests can run in any order
  - No manual cleanup needed
  - Tests pass consistently (100%)
  - Test suite runs <5 minutes
- **Agent Command:** "Fix TD-001 - E2E Test Isolation"
- **Daily Standup Trigger:** After completion

---

#### 🎨 UX-001: Add Share Button to Badge Detail Modal
- **Status:** 🔲 NOT STARTED
- **Priority:** HIGH (needed for Sprint 6 features)
- **Effort:** 2-3h
- **Dependencies:** Story 7.2, 7.4, 7.3
- **Deliverables:**
  - Share button in BadgeDetailModal component
  - Share options modal (Email/Teams/Widget)
  - UI integration with backend APIs
- **Tests:**
  - [ ] Component unit tests
  - [ ] Integration test: share options work
  - [ ] E2E test: full share flow
- **Success Criteria:**
  - Share button visible in Badge Detail Modal
  - Share options modal opens correctly
  - All three share methods work from UI
  - UX matches design specs
- **Agent Command:** "Implement UX-001 - Share Button"
- **Daily Standup Trigger:** After completion

---

## 📅 Sprint Milestones

| Milestone | Trigger | Estimated Date | Status |
|-----------|---------|----------------|--------|
| **Kickoff Complete** | All prep done | 2026-01-29 | ✅ |
| **Dependencies Installed** | Story 0.2 done | Day 1 | 🔲 |
| **ADR-008 Complete** | Story 0.3 done | Day 1 | 🔲 |
| **Graph Module Ready** | Story 0.4 done | Day 2-3 | 🔲 |
| **Email Sharing Working** | Story 7.2 done | Day 5-7 | 🔲 |
| **Teams Notifications Working** | Story 7.4 done | Day 10-12 | 🔲 |
| **🎯 Mid-Sprint Check** | 3.5 stories done | Day 10-12 | 🔲 |
| **Widget Embedding Working** | Story 7.3 done | Day 13-15 | 🔲 |
| **Analytics Tracking** | Story 7.5 done | Day 16-17 | 🔲 |
| **All Tests Passing** | TD-001 + all stories | Day 18-20 | 🔲 |
| **Sprint Review Ready** | DoD 100% | Day 20-21 | 🔲 |

---

## 🎯 Daily Standup Template

**After each story completion, report:**

```markdown
### Daily Standup - [Date] - Story [X.X] Complete

**✅ Completed Story:**
- Story ID: [X.X]
- Story Title: [Title]
- Time Spent: [Xh]
- Tests: [X unit + Y integration + Z E2E]
- Test Pass Rate: [100%]

**🔍 Issues Encountered:**
- [List any blockers, learnings, or challenges]
- [Or write "None" if smooth]

**➡️ Next Story:**
- Story ID: [X.X]
- Story Title: [Title]
- Estimated Effort: [Xh]

**📊 Sprint Progress:**
- Stories: [X/7] (X%)
- Hours: [Xh/56-76h] (X%)
- Velocity: [Xh/story]
```

---

## 🎯 Next Action

**Status:** 🟢 Sprint 6 Ready to Start  
**Next Task:** Story 0.2 - Install Sprint 6 Dependencies

**Agent Command:**
```
"开始Story 0.2：安装Sprint 6依赖包"
```

---

**Last Updated:** 2026-01-29 (Kickoff)  
**Next Update:** After Story 0.2 completion
