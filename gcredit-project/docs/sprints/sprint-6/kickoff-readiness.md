# Sprint 6 Kickoff Readiness Checklist

**Sprint:** Sprint 6 - Social Sharing & Widget Embedding  
**Epic:** Epic 7 - Badge Sharing & Social Proof  
**Status:** 🟡 PREPARATION IN PROGRESS  
**Target Kickoff Date:** TBD (after preparation complete + LegendZhu rest)  
**Sprint Duration:** 2.5-3 weeks  
**Total Effort:** 56-76 hours

---

## 📋 Strategic Decisions (COMPLETED ✅)

**Meeting:** Sprint 6 Strategy Adjustment Meeting (2026-01-29)  
**Documentation:** `docs/decisions/sprint-6-strategy-adjustment-meeting-2026-01-29.md`

**Confirmed Decisions:**
- ✅ Email Integration: Microsoft Graph API (not SMTP)
- ✅ Teams Integration: Full Adaptive Cards (not mock)
- ✅ LinkedIn: Deferred to Sprint 7
- ✅ Sprint Duration: 2.5-3 weeks acceptable
- ✅ Architecture: Unified Microsoft Graph module

---

## 🎯 Pre-Kickoff Preparation Tasks

### Phase 1: Architecture & Design (CURRENT PHASE)

**Status:** 🟡 IN PROGRESS

#### Winston (Architect) - Preparation Tasks

**1. ADR-008: Microsoft Graph Integration Strategy** ⏳
- **Priority:** HIGH (blocking for implementation)
- **Effort:** 30-45 minutes
- **Deliverable:** `docs/decisions/ADR-008-microsoft-graph-integration.md`
- **Content:**
  - OAuth 2.0 Client Credentials Flow architecture
  - Token management strategy (caching, refresh)
  - Error handling and retry logic (exponential backoff)
  - Fallback strategy (queue + retry)
  - Production migration path (Dev Subscription → Customer Tenant)
  - Security considerations (secret storage, token lifecycle)
  - Alternative approaches considered (SMTP, Webhooks)
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Sprint 6 kickoff

**2. Adaptive Card Design Templates** ⏳
- **Priority:** HIGH
- **Effort:** 1-2 hours
- **Deliverable:** 
  - `backend/src/microsoft-graph/teams/adaptive-cards/badge-notification.card.json`
  - Design documentation in `docs/sprints/sprint-6/adaptive-card-specs.md`
- **Content:**
  - Badge notification card structure (Hero image + Details + Actions)
  - Brand-consistent styling (G-Credit colors)
  - Action buttons: "View Badge", "Claim Now"
  - Mobile-responsive layout
  - Test card examples for different badge types
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Story 7.4 implementation

**3. Azure AD App Registration Guide** ⏳
- **Priority:** MEDIUM (nice-to-have for kickoff)
- **Effort:** 1 hour
- **Deliverable:** `docs/setup/azure-ad-app-setup.md`
- **Content:**
  - Step-by-step registration instructions
  - Required permissions list (Mail.Send, ChannelMessage.Send, etc.)
  - Admin consent process
  - Client Secret generation and storage best practices
  - Configuration checklist
  - Troubleshooting common issues
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Sprint 6 kickoff

**4. Microsoft Graph Module Architecture** ⏳
- **Priority:** HIGH
- **Effort:** 1 hour
- **Deliverable:** Architecture diagram + module structure spec
- **Content:**
  - Module dependency diagram
  - Service layer architecture
  - Token provider design
  - Error handling flow
  - Testing strategy (mock vs integration)
- **Status:** 🔲 Not Started
- **Blocker:** ADR-008 should be created first
- **Target Completion:** Before Sprint 6 kickoff

---

#### Sally (UX Designer) - Preparation Tasks

**1. Existing Pages UX Audit** ⏳
- **Priority:** HIGH
- **Effort:** 4-6 hours
- **Deliverable:** `docs/sprints/sprint-6/ux-audit-report.md`
- **Scope:**
  - Badge Wallet page (existing)
  - Badge Verification page (existing)
  - Badge Detail view (existing)
  - Identify UX improvements and inconsistencies
  - Document interaction patterns
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Sprint 6 kickoff

**2. Email HTML Template Design** ⏳
- **Priority:** HIGH (needed for Story 7.2)
- **Effort:** 3-4 hours
- **Deliverable:** 
  - HTML email template mockup
  - `docs/sprints/sprint-6/email-template-specs.md`
- **Content:**
  - Badge sharing email layout
  - G-Credit branding (logo, colors, typography)
  - Responsive design (mobile + desktop)
  - Call-to-action buttons
  - Social proof elements
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Story 7.2 implementation

**3. Teams Adaptive Card Visual Design** ⏳
- **Priority:** HIGH (needed for Story 7.4)
- **Effort:** 3-4 hours
- **Deliverable:** Visual design mockup + style guide
- **Content:**
  - Adaptive Card visual style (within Microsoft constraints)
  - G-Credit brand colors adaptation
  - Icon and imagery guidelines
  - Button styling and action design
  - Preview in Teams Adaptive Card Designer
- **Status:** 🔲 Not Started
- **Blocker:** Winston's Adaptive Card template structure
- **Dependencies:** Should review Winston's card JSON structure first
- **Target Completion:** Before Story 7.4 implementation

**4. Embeddable Widget Interaction Specs** ⏳
- **Priority:** MEDIUM
- **Effort:** 2-3 hours
- **Deliverable:** `docs/sprints/sprint-6/widget-interaction-specs.md`
- **Content:**
  - Widget embedding examples (HTML snippet)
  - Widget customization options (theme, size)
  - Responsive behavior
  - Loading states
  - Error states
- **Status:** 🔲 Not Started
- **Blocker:** None
- **Target Completion:** Before Story 7.3 implementation

---

#### Bob (Scrum Master) - Preparation Tasks

**1. Sprint 6 Backlog Creation** ⏳
- **Priority:** HIGH (blocking for kickoff)
- **Effort:** 1-2 hours
- **Deliverable:** `docs/sprints/sprint-6/backlog.md`
- **Content:**
  - Updated Epic 7 stories with Microsoft Graph approach
  - Story 7.2: Email Sharing (Microsoft Graph Mail API)
  - Story 7.4: Teams Notifications (Graph + Adaptive Cards)
  - Story 7.3: Embeddable Widget (no change)
  - Story 7.5: Sharing Analytics (no change)
  - Technical stories: Azure AD setup, Microsoft Graph module
  - TD-001: E2E Test Isolation Fix
  - Acceptance criteria for each story
  - Updated effort estimates (56-76h total)
- **Status:** 🔲 Not Started
- **Blocker:** ADR-008 should be reviewed first
- **Target Completion:** Before Sprint 6 kickoff

**2. Sprint 6 Project Structure Setup** ⏳
- **Priority:** MEDIUM
- **Effort:** 15 minutes
- **Tasks:**
  - Create `docs/sprints/sprint-6/` directory
  - Initialize sprint status tracking files
  - Prepare sprint-status.yaml template
- **Status:** ✅ PARTIALLY DONE (directory created, files in progress)
- **Target Completion:** Before Sprint 6 kickoff

**3. Sprint 6 Kickoff Meeting Agenda** ⏳
- **Priority:** MEDIUM
- **Effort:** 30 minutes
- **Deliverable:** `docs/sprints/sprint-6/kickoff-agenda.md`
- **Content:**
  - Sprint goals review
  - Story walkthrough
  - Technical architecture overview
  - M365 credentials handover
  - Team capacity confirmation
  - Sprint timeline and milestones
- **Status:** 🔲 Not Started
- **Target Completion:** 1 day before kickoff

---

### Phase 2: Pre-Kickoff Dependencies

**Status:** 🟡 AWAITING KICKOFF DECISION

#### LegendZhu (Project Lead) - Information Needed at Kickoff

**1. Microsoft 365 Developer Subscription Details** 🔑
- **When Needed:** At Sprint 6 Kickoff (not now)
- **Information Required:**
  - **Tenant ID** (GUID format)
  - **Tenant Domain** (e.g., `yourdomain.onmicrosoft.com`)
  - **Global Admin Confirmation** (yes/no)
- **Usage:** Amelia will use this to register Azure AD App
- **Security:** Will be stored in `.env` file (not committed to Git)
- **Status:** ⏰ DEFERRED TO KICKOFF

**2. Sprint 6 Start Date Decision** 📅
- **When Needed:** After preparation tasks complete
- **Options:**
  - Start immediately after prep (if you're rested)
  - Start after 1-2 days rest from Sprint 5
  - Start on specific date
- **Sprint Duration:** 2.5-3 weeks from start date
- **Status:** ⏰ PENDING YOUR DECISION

---

### Phase 3: Post-Kickoff Initial Setup

**Status:** ⏸️ WILL START AFTER KICKOFF

#### Amelia (Dev) - Initial Implementation Tasks

**1. Azure AD App Registration** ☁️
- **Priority:** CRITICAL (blocking for all Graph API work)
- **Effort:** 1-2 hours
- **When:** Immediately after Sprint 6 kickoff
- **Prerequisites:** 
  - LegendZhu provides Tenant ID and Domain
  - Winston's Azure AD setup guide available
- **Deliverable:**
  - Registered Azure AD App
  - Client ID generated
  - Client Secret generated (stored securely)
  - OAuth permissions configured and consented
  - `.env.example` template updated
- **Status:** ⏸️ WAITING FOR KICKOFF

**2. Microsoft Graph Module Skeleton** 🏗️
- **Priority:** HIGH
- **Effort:** 2-3 hours
- **When:** After Azure AD App registration
- **Deliverable:**
  - `backend/src/microsoft-graph/` module structure
  - `MicrosoftGraphModule` and base service
  - Token provider with authentication flow
  - Basic error handling
  - Unit test setup (mocked)
- **Status:** ⏸️ WAITING FOR KICKOFF

**3. Local Development Environment Setup** 💻
- **Priority:** HIGH
- **Effort:** 1 hour
- **When:** After Azure AD App registration
- **Tasks:**
  - Configure `.env` with Azure AD credentials
  - Install `@microsoft/microsoft-graph-client` SDK
  - Test authentication flow
  - Verify Mail.Send and ChannelMessage.Send permissions
- **Status:** ⏸️ WAITING FOR KICKOFF

---

## 📊 Readiness Tracking

### Overall Preparation Status

| Phase | Status | Progress | Target Date |
|-------|--------|----------|-------------|
| Strategic Decisions | ✅ Complete | 100% | 2026-01-29 |
| Architecture & Design | 🟡 In Progress | 0% | Before Kickoff |
| Pre-Kickoff Dependencies | 🟡 Pending | 0% | At Kickoff |
| Post-Kickoff Setup | ⏸️ Not Started | 0% | After Kickoff |

### Task Completion Checklist

**Critical Path (Must Complete Before Kickoff):**
- [ ] ADR-008: Microsoft Graph Integration Strategy (Winston) - **BLOCKING**
- [ ] Sprint 6 Backlog Creation (Bob) - **BLOCKING**
- [ ] Adaptive Card Design Templates (Winston)
- [ ] Email HTML Template Design (Sally)
- [ ] Existing Pages UX Audit (Sally)

**Nice-to-Have Before Kickoff:**
- [ ] Azure AD App Registration Guide (Winston)
- [ ] Microsoft Graph Module Architecture (Winston)
- [ ] Teams Adaptive Card Visual Design (Sally)
- [ ] Embeddable Widget Interaction Specs (Sally)
- [ ] Sprint 6 Kickoff Meeting Agenda (Bob)

**Deferred to Kickoff:**
- [ ] LegendZhu provides M365 Developer Subscription details
- [ ] LegendZhu confirms Sprint 6 start date

**Post-Kickoff (Day 1):**
- [ ] Amelia registers Azure AD App
- [ ] Amelia creates Microsoft Graph module skeleton
- [ ] Amelia configures local development environment

---

## 🚦 Kickoff Gate Criteria

Sprint 6 is ready to kickoff when ALL of the following are true:

### Technical Readiness
- ✅ ADR-008 created and reviewed
- ✅ Sprint 6 backlog finalized
- ✅ Adaptive Card template structure defined
- ✅ Email template design complete
- ✅ UX audit of existing pages complete

### Resource Readiness
- ✅ LegendZhu has rested from Sprint 5
- ✅ LegendZhu provides M365 Developer Subscription details
- ✅ Team capacity confirmed (Winston, Amelia, Sally available)

### Process Readiness
- ✅ Sprint status tracking files initialized
- ✅ sprint-6 branch ready to create
- ✅ Sprint kickoff meeting scheduled

---

## 📅 Estimated Timeline

**Current Date:** 2026-01-29 (Sprint 5 closeout complete)

**Preparation Phase:**
- **Duration:** 1-2 days
- **Tasks:** Architecture & Design (Winston + Sally + Bob)
- **Effort:** ~10-15 hours of preparation work

**Rest Period:**
- **Duration:** User decides (0-2 days)
- **Purpose:** Recovery from Sprint 5

**Kickoff Date:**
- **Target:** TBD by LegendZhu
- **Recommended:** After preparation complete + rest

**Sprint 6 Duration:**
- **Duration:** 2.5-3 weeks from kickoff
- **End Date:** ~3 weeks after kickoff
- **Total Effort:** 56-76 hours

---

## 🎯 Success Criteria

**Sprint 6 will be considered "ready to start" when:**

1. ✅ **All critical preparation tasks complete**
   - ADR-008 published
   - Backlog finalized
   - Design artifacts ready

2. ✅ **LegendZhu is ready**
   - Rested from Sprint 5
   - Available for kickoff meeting
   - Can provide M365 credentials

3. ✅ **Team is ready**
   - Winston available for architecture guidance
   - Amelia available for Azure AD setup
   - Sally available for UX embedding

4. ✅ **Documentation complete**
   - Meeting notes recorded (✅ Done)
   - ADR-008 created
   - Sprint 6 backlog created

---

## 📝 Notes

**Key Decisions from Strategy Meeting (2026-01-29):**
- Microsoft Graph API chosen over SMTP for email
- Full Adaptive Cards implementation for Teams (not mock)
- LinkedIn descoped to Sprint 7
- Sprint duration extended to 2.5-3 weeks to accommodate increased scope

**Resource Acquisition:**
- Microsoft 365 Developer Subscription (E5) available
- 25 test users, full Graph API access, renewable 90-day term
- Production migration path is configuration-only (no code changes)

**Technical Approach:**
- Unified microsoft-graph module for Email + Teams
- OAuth 2.0 Client Credentials Flow (application-level auth)
- Token provider service for automatic refresh
- Adaptive Cards for interactive Teams notifications

---

## 📎 Related Documents

**Strategic Planning:**
- [Sprint 6 Strategy Adjustment Meeting Notes](../decisions/sprint-6-strategy-adjustment-meeting-2026-01-29.md) ✅
- [ADR-008: Microsoft Graph Integration Strategy](../decisions/ADR-008-microsoft-graph-integration.md) ⏳

**Sprint Planning:**
- [Sprint 6 Backlog](./backlog.md) ⏳
- [Epic 7 Definition](../../planning/epics.md)

**Design Artifacts:**
- [Adaptive Card Specifications](./adaptive-card-specs.md) ⏳
- [Email Template Specifications](./email-template-specs.md) ⏳
- [UX Audit Report](./ux-audit-report.md) ⏳

**Setup Guides:**
- [Azure AD App Setup Guide](../../setup/azure-ad-app-setup.md) ⏳

---

**Status:** 🟡 PREPARATION IN PROGRESS  
**Next Action:** Winston creates ADR-008  
**Kickoff Decision:** Awaiting LegendZhu confirmation  
**Last Updated:** 2026-01-29

---

**Prepared By:** Bob (Scrum Master)  
**Reviewed By:** LegendZhu (Project Lead)  
**Document Version:** 1.0
