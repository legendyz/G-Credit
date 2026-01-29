# Sprint 6 - Social Sharing & Widget Embedding

**Epic:** Epic 7 - Badge Sharing & Social Proof  
**Status:** 🟢 Ready for Kickoff  
**Duration:** 2.5-3 weeks  
**Effort:** 56-76 hours  
**Start Date:** TBD (awaiting kickoff after LegendZhu rest)  
**Team:** Winston (Architect), Amelia (Dev), Sally (UX Designer), Bob (Scrum Master)

---

## 📋 Quick Navigation

### 🎯 Start Here
- **New to Sprint 6?** → Read [Sprint Goal](#sprint-goal) below
- **Ready for Kickoff?** → Use [kickoff-checklist-printable.md](./kickoff-checklist-printable.md)
- **Starting Day 1?** → See [Quick Start Guide](#day-1-quick-start-guide)
- **Need to check versions?** → See [version-manifest.md](./version-manifest.md)

### 📚 Core Documents
| Document | Purpose | Lines | Status |
|----------|---------|-------|--------|
| **[backlog.md](./backlog.md)** | Complete Sprint 6 plan | 1,317 | ✅ Complete |
| **[version-manifest.md](./version-manifest.md)** | Dependency versions | 385 | ✅ Created 2026-01-29 |
| **[kickoff-checklist-printable.md](./kickoff-checklist-printable.md)** | Kickoff meeting agenda | 385 | ✅ Ready for print |
| **[kickoff-readiness.md](./kickoff-readiness.md)** | Preparation tasks | 441 | ✅ Complete |

### 🎨 Design Documents
| Document | Purpose | Lines | Owner |
|----------|---------|-------|-------|
| **[ux-audit-report.md](./ux-audit-report.md)** | Existing pages UX audit | 1,181 | Sally |
| **[email-template-specs.md](./email-template-specs.md)** | Email template design | 844 | Sally |
| **[adaptive-card-specs.md](./adaptive-card-specs.md)** | Teams card design | 612 | Winston + Sally |

---

## 🎯 Sprint Goal

### Primary Objective
Enable badge recipients to share their achievements via **email** and **Microsoft Teams**, with interactive notifications powered by Microsoft Graph API and Adaptive Cards. Implement embeddable badge widget for external websites and track sharing analytics.

### Success Criteria
- ✅ Badge recipients can share via email (Microsoft Graph API)
- ✅ Badge recipients receive Teams notifications with Adaptive Cards
- ✅ Embeddable widget works on external websites
- ✅ Sharing analytics tracked in database
- ✅ E2E test isolation issues resolved (TD-001)
- ✅ UX audit complete with improvement recommendations
- ✅ All features pass UAT

---

## 🏗️ Sprint Scope

### ✅ IN SCOPE
**Feature Stories (4):**
- **Story 7.2:** Email Badge Sharing (12-16h)
- **Story 7.3:** Embeddable Badge Widget (10-14h)
- **Story 7.4:** Microsoft Teams Notifications (14-18h)
- **Story 7.5:** Sharing Analytics (8-12h)

**Technical Stories (2):**
- Azure AD App Registration (4-6h)
- Microsoft Graph Module (8-12h)

**Technical Debt (1):**
- TD-001: E2E Test Isolation Fix (6-8h)

**UX Work:**
- Existing pages audit ✅ Complete
- Email/Teams/Widget design ✅ Complete
- Share button implementation (Sprint 6)

### ❌ OUT OF SCOPE (Deferred to Sprint 7)
- Story 7.1: LinkedIn Sharing
- Advanced features: Email read receipts, Teams bot, Calendar integration

---

## 🚀 Day 1 Quick Start Guide

### Prerequisites Checklist
Before starting Sprint 6:
- [ ] Node.js v20.20.0 installed
- [ ] npm 10.8.2 installed
- [ ] Local dev environment running (backend + frontend)
- [ ] PostgreSQL connection verified
- [ ] Azure Storage accessible (`gcreditdevstoragelz`)
- [ ] Prisma 6.19.2 confirmed (NOT 7.x)

### Step 1: Install Sprint 6 Dependencies (Amelia)
```bash
# Navigate to backend
cd c:\G_Credit\CODE\gcredit-project\backend

# Install Microsoft Graph dependencies
npm install @microsoft/microsoft-graph-client@3.0.7 @azure/identity@4.13.0 adaptivecards@3.0.5

# Verify installation
npm list @microsoft/microsoft-graph-client @azure/identity adaptivecards --depth=0

# CRITICAL: Verify Prisma version (must be 6.19.2)
npx prisma --version
```

**📖 Reference:** See [version-manifest.md](./version-manifest.md) for detailed installation instructions

### Step 2: Azure AD App Registration (Amelia + LegendZhu)
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Click "New registration"
3. Name: `G-Credit-Dev`
4. Supported account types: Single tenant
5. Redirect URI: (leave empty for now)
6. Click "Register"
7. Note down:
   - Application (client) ID → `AZURE_CLIENT_ID`
   - Directory (tenant) ID → `AZURE_TENANT_ID`
8. Go to "API permissions" → Add permissions:
   - Microsoft Graph → Application permissions
   - Add: `Mail.Send`, `ChannelMessage.Send`
9. Click "Grant admin consent"
10. Go to "Certificates & secrets" → New client secret:
    - Description: `G-Credit Dev Secret`
    - Expires: 24 months
    - Click "Add"
    - Copy secret value → `AZURE_CLIENT_SECRET` (save immediately!)

### Step 3: Configure Environment Variables (Amelia)
```bash
# Add to backend/.env file
AZURE_TENANT_ID=<from Step 2>
AZURE_CLIENT_ID=<from Step 2>
AZURE_CLIENT_SECRET=<from Step 2>
AZURE_TENANT_DOMAIN=<yourcompany.onmicrosoft.com>
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
ENABLE_GRAPH_EMAIL=true
ENABLE_GRAPH_TEAMS=true
```

### Step 4: Create ADR-008 (Winston)
**Document:** `docs/decisions/ADR-008-microsoft-graph-integration.md`

**Key Decision Points:**
- OAuth 2.0 Client Credentials Flow architecture
- Token management strategy (caching, refresh)
- Error handling and retry logic (exponential backoff)
- Fallback strategy (queue + retry)
- Production migration path
- Security considerations

**Estimated Time:** 30-45 minutes

**📖 Template:** See existing ADRs in `docs/decisions/` for format

### Step 5: Team Alignment (All)
- [ ] Daily Standup time scheduled: _______________
- [ ] Mid-Sprint Check scheduled (Day 8-10): _______________
- [ ] Sprint tracking board set up
- [ ] Communication channels confirmed

---

## 📊 Sprint 6 Architecture Overview

### New Components (To Be Built)

```
backend/src/
├── microsoft-graph/           # NEW MODULE
│   ├── microsoft-graph.module.ts
│   ├── services/
│   │   ├── graph-token-provider.service.ts   # OAuth token management
│   │   ├── graph-email.service.ts            # Email sharing
│   │   └── graph-teams.service.ts            # Teams notifications
│   ├── email/
│   │   └── templates/
│   │       └── badge-notification.html        # Email template
│   └── teams/
│       └── adaptive-cards/
│           └── badge-notification.card.json   # Adaptive Card template
├── badge-share/              # NEW MODULE
│   ├── badge-share.module.ts
│   ├── badge-share.controller.ts
│   ├── badge-share.service.ts
│   └── entities/
│       └── badge-share.entity.ts              # Analytics tracking
└── widget/                   # NEW MODULE
    ├── widget.module.ts
    ├── widget.controller.ts
    └── widget.service.ts
```

### Database Changes

**New Table: BadgeShare** (Prisma migration)
```prisma
model BadgeShare {
  id          String   @id @default(uuid())
  badgeId     String
  shareType   String   // 'email' | 'teams' | 'widget'
  sharedBy    String
  sharedTo    String?  // recipient email or Teams channel
  sharedAt    DateTime @default(now())
  metadata    Json?    // additional tracking data
  
  badge       Badge    @relation(fields: [badgeId], references: [id])
}
```

### Integration Flow

```
User clicks "Share" button
         ↓
Badge Detail Modal → Share Dialog
         ↓
    ┌────┴────┬────────────┐
    ↓         ↓            ↓
  Email     Teams       Widget
    ↓         ↓            ↓
Graph API Graph API  HTML Snippet
    ↓         ↓            ↓
Analytics Analytics   Analytics
```

---

## 🧪 Testing Strategy

### Unit Testing (Target: >80% coverage)
- **GraphEmailService** - Mock Graph client
- **GraphTeamsService** - Mock Graph client
- **TokenProvider** - Mock Azure Identity
- **BadgeAnalyticsService** - Real database with test data
- **AdaptiveCardBuilder** - Schema validation

### Integration Testing (M365 Dev Subscription)
- Send email to test user → Verify received
- Send Teams notification → Verify in channel
- Widget embed on test page → Verify renders
- Analytics recording → Verify database records

### E2E Testing (Critical Focus)
**TD-001 Fix:** Wrap all E2E tests in database transactions
- Automatic rollback after each test
- Use test data factories
- No manual cleanup needed

**Test Organization:**
```
backend/test-scripts/sprint-6/
├── test-email-sharing.ps1
├── test-teams-notifications.ps1
├── test-widget-embedding.ps1
└── test-sharing-analytics.ps1
```

**⚠️ DO NOT place test scripts in backend root** (Sprint 5 Lesson)

### UAT Testing (Last 3-4 days)
- **Test Users:** LegendZhu + 2-3 external testers
- **Scenarios:** Email sharing, Teams notifications, Widget embedding
- **Success:** All critical flows work end-to-end without errors

---

## 🔑 Key Resources & Links

### Documentation References
- **Sprint Planning Checklist:** `docs/templates/sprint-planning-checklist.md`
- **User Story Template:** `docs/templates/user-story-template.md`
- **ADR Template:** `docs/templates/adr-template.md`
- **Infrastructure Inventory:** `docs/setup/infrastructure-inventory.md`
- **Lessons Learned:** `docs/lessons-learned/lessons-learned.md`

### External Resources
- **Microsoft Graph API:** https://docs.microsoft.com/en-us/graph/
- **Graph SDK (JavaScript):** https://github.com/microsoftgraph/msgraph-sdk-javascript
- **Azure Identity:** https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity
- **Adaptive Cards:** https://adaptivecards.io/
- **Adaptive Card Designer:** https://adaptivecards.io/designer/

### Azure Portal Links
- **Azure AD:** https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade
- **App Registrations:** https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps
- **M365 Admin Center:** https://admin.microsoft.com/

---

## ⚠️ Known Issues & Workarounds

### Issue 1: Backend Security Vulnerabilities (6 total)
- **Status:** Non-blocking for Sprint 6
- **Details:** lodash (Prototype Pollution) + tar (Path Traversal)
- **Impact:** Development dependencies only, not production
- **Action:** Monitor, will address in Sprint 7+
- **Reference:** See [version-manifest.md](./version-manifest.md) for details

### Issue 2: Prisma Version Lock
- **Current:** 6.19.2 (locked)
- **Do NOT upgrade to:** Prisma 7.x
- **Reason:** Breaking changes in Prisma 7
- **Action:** Always verify version after `npm install`
- **Reference:** Sprint 0 Lesson 1

### Issue 3: Microsoft Graph Rate Limiting
- **Risk:** 429 Too Many Requests during testing
- **Mitigation:** Implement exponential backoff (ADR-008)
- **Action:** Use test throttling in E2E tests

---

## 📅 Sprint 6 Ceremonies

### Daily Standup
- **Time:** TBD (15 minutes)
- **Days:** Monday - Friday
- **Format:** Yesterday / Today / Blockers

### Backlog Refinement
- **Frequency:** 2x/week (Wednesday, Friday)
- **Duration:** 30 minutes

### Mid-Sprint Check
- **Date:** TBD (Day 8-10)
- **Duration:** 1 hour
- **Agenda:** Progress review, estimate adjustments, risk assessment

### Sprint Review
- **Date:** TBD (Last day)
- **Duration:** 1.5 hours
- **Attendees:** Team + LegendZhu
- **Demo:** Email sharing, Teams notifications, Widget embedding

### Sprint Retrospective
- **Date:** TBD (After Review)
- **Duration:** 1 hour
- **Format:** Start-Stop-Continue + Action items

---

## 🎯 Definition of Done

### Code Quality
- [ ] All unit tests passing (>80% coverage)
- [ ] E2E tests stable (TD-001 fixed)
- [ ] TypeScript compilation with 0 errors
- [ ] ESLint/Prettier formatting applied
- [ ] No console.log or debug code left

### Feature Completeness
- [ ] Email sharing working via Microsoft Graph
- [ ] Teams notifications with Adaptive Cards working
- [ ] Widget embedding on external site working
- [ ] Analytics tracking all share events
- [ ] All acceptance criteria met

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests passing (real Graph API)
- [ ] E2E tests passing (database isolation)
- [ ] UAT completed with LegendZhu approval
- [ ] No critical bugs in backlog

### Documentation
- [ ] ADR-008 created (Microsoft Graph Integration)
- [ ] README.md updated with new features
- [ ] API documentation updated (Swagger)
- [ ] Test scripts documented
- [ ] Inline code comments for complex logic

### Infrastructure
- [ ] Azure AD App registered and configured
- [ ] Environment variables documented in .env.example
- [ ] BadgeShare table migrated to database
- [ ] infrastructure-inventory.md updated

### Sprint Artifacts
- [ ] sprint-6/summary.md created
- [ ] sprint-6/retrospective.md created
- [ ] project-context.md updated
- [ ] Git tag created (v0.6.0)
- [ ] Branch merged to main

---

## 📞 Team Contacts & Roles

### Winston (Architect)
- **Responsibilities:** ADR-008, Module architecture, Technical guidance
- **Key Deliverables:** ADR-008, Microsoft Graph module design
- **Availability:** Advisory role (12-15h total)

### Amelia (Dev Lead)
- **Responsibilities:** Implementation, Azure AD setup, Testing
- **Key Deliverables:** All 7 stories implemented, tests passing
- **Availability:** Primary developer (100-120h capacity)

### Sally (UX Designer)
- **Responsibilities:** Email template, Adaptive Card design, UX improvements
- **Key Deliverables:** Final email template, Teams card visuals, Share button UI
- **Availability:** Design support (37-45h capacity)

### Bob (Scrum Master)
- **Responsibilities:** Sprint facilitation, ceremony scheduling, blocker removal
- **Key Deliverables:** Sprint tracking, retrospective, documentation
- **Availability:** Process support (12-15h total)

### LegendZhu (Project Lead)
- **Responsibilities:** Azure admin, UAT approval, strategic decisions
- **Required Actions:** Provide Azure tenant info, approve UAT, final sign-off
- **Availability:** As needed for blockers and approvals

---

## 🛠️ Troubleshooting & FAQ

### Q: Prisma version shows 7.x after npm install?
**A:** Downgrade immediately:
```bash
npm install -D prisma@6.19.2 @prisma/client@6.19.2
npx prisma --version  # Verify 6.19.2
```

### Q: Microsoft Graph API returns 401 Unauthorized?
**A:** Check:
1. Azure AD app registered correctly
2. Admin consent granted
3. Client secret not expired
4. Environment variables correct
5. Token provider working

### Q: Adaptive Card not showing in Teams?
**A:** Verify:
1. Card JSON schema valid (use Adaptive Card Designer)
2. Teams channel exists and bot has access
3. Graph API permissions include ChannelMessage.Send
4. Card version is 1.4 (supported by Teams)

### Q: E2E tests interfering with each other?
**A:** TD-001 fix should resolve this:
- Wrap each test in database transaction
- Use test data factories
- Automatic rollback after test

### Q: Email not received?
**A:** Check:
1. Graph API permissions include Mail.Send
2. Recipient email valid
3. Check spam folder
4. Verify email template rendering
5. Check Graph API logs

### Q: Widget not rendering on external site?
**A:** Check:
1. CORS configured correctly
2. Badge endpoint accessible
3. JavaScript console for errors
4. Widget HTML snippet copied correctly

---

## 🎊 Sprint 6 Success Metrics

### Quantitative Metrics
- **Stories Completed:** Target 7/7 (100%)
- **Test Coverage:** Target >80%
- **Test Pass Rate:** Target 100%
- **Time Estimation Accuracy:** Target 90-110%
- **Bugs Found:** Target <5 critical bugs

### Qualitative Metrics
- **Code Quality:** Clean, maintainable, documented
- **Team Velocity:** Stable or improved from Sprint 5
- **UAT Satisfaction:** LegendZhu approval with minimal feedback
- **Documentation Quality:** Complete, accurate, helpful

### Learning Objectives
- **Microsoft Graph API:** Team proficient in Graph SDK
- **Azure AD:** Team understands OAuth 2.0 flows
- **Adaptive Cards:** Team can create interactive Teams cards
- **E2E Test Isolation:** TD-001 fix becomes standard practice

---

## 📚 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-29 | Initial creation | Bob (Scrum Master) |

---

## ✅ Quick Status Check

Before starting any work, verify:
- [ ] ✅ All preparation documents reviewed
- [ ] ✅ Version manifest created (2026-01-29)
- [ ] ✅ Azure tenant info ready
- [ ] ✅ Team aligned on Sprint goal
- [ ] ✅ Day 1 tasks clear
- [ ] ✅ Lessons learned reviewed

**Status:** 🟢 READY FOR KICKOFF

---

**Need help?** Reference the appropriate document above or ask Bob (Scrum Master).

**Ready to start?** Follow the [Day 1 Quick Start Guide](#day-1-quick-start-guide).

**Questions during Sprint?** Check [Troubleshooting & FAQ](#troubleshooting--faq).
