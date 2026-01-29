# Sprint 6 Strategy Adjustment Meeting

**Date:** 2026-01-29  
**Duration:** 30 minutes  
**Type:** Strategic Planning Adjustment  
**Trigger:** M365 E5 Developer Subscription availability  
**Participants:**
- LegendZhu (Project Lead) - Decision Maker
- Bob (Scrum Master) - Facilitator
- Winston (Architect) - Technical Advisor
- Amelia (Dev) - Implementation Lead
- Sally (UX Designer) - Design Lead

---

## 📋 Meeting Context

### Background
During Epic 6 retrospective, Sprint 6 was planned with a hybrid implementation strategy:
- Stories 7.2, 7.3, 7.5: Production-ready implementation
- Stories 7.1, 7.4: Mock implementation (awaiting OAuth credentials)

### Trigger for This Meeting
LegendZhu obtained **Microsoft 365 Developer Subscription (E5)** from Visual Studio subscription, enabling:
- Azure AD App Registration capabilities
- Microsoft Graph API access
- Enterprise-grade Exchange Online
- Full Microsoft Teams environment
- 25 test users for development

This resource availability significantly changes the feasibility of implementing production-grade Email and Teams integrations.

---

## 🎯 Key Decisions Made

### Decision 1: Email Integration (Story 7.2)
**Original Plan:** outlook.com SMTP (personal account)  
**Decision:** ✅ **Upgrade to Microsoft Graph API**

**Rationale:**
- Developer Subscription provides enterprise-grade capabilities
- Microsoft Graph API offers better functionality and extensibility
- Unified OAuth 2.0 authentication with Teams integration
- Consistent architecture across M365 services
- Better error handling and monitoring

**Technical Impact:**
- Work effort: +3-4 hours
- Requires Azure AD App Registration
- Uses Client Credentials Flow (application-level auth)
- Scope required: `Mail.Send`

**Benefits:**
- Enterprise-grade email sending
- HTML rich email templates
- Better deliverability and tracking
- Future-proof for production migration

---

### Decision 2: Teams Integration (Story 7.4)
**Original Plan:** Mock webhook implementation  
**Decision:** ✅ **Full Microsoft Graph API + Adaptive Cards**

**Rationale:**
- Best user experience with interactive notifications
- Users can claim badges directly from Teams
- Production-ready implementation from Sprint 6
- Aligns with M365 capabilities available

**Technical Impact:**
- Work effort: +8-10 hours
- Requires Azure AD App Registration (shared with Email)
- Adaptive Card design and implementation
- Scope required: `ChannelMessage.Send`, `TeamsAppInstallation.ReadWriteSelfForUser`

**Benefits:**
- Interactive Teams notifications with action buttons
- Native Teams user experience
- Production-ready feature (not demo)
- Better engagement with badge recipients

---

### Decision 3: Sprint 6 Scope Adjustment
**Decision:** ✅ **LinkedIn (Story 7.1) descoped to Sprint 7**

**Rationale:**
- Focus Sprint 6 on Microsoft 365 ecosystem integration
- Consistent architecture (all Graph API)
- Manageable sprint scope (2.5-3 weeks)
- LinkedIn can be mock or real implementation in Sprint 7

**Impact:**
- Sprint 6 focused on 4 stories: 7.2, 7.3, 7.4, 7.5
- Total work effort remains manageable: 54-73 hours
- Sprint duration: 2.5-3 weeks (acceptable)

---

## 📊 Resource Assessment

### Microsoft 365 Developer Subscription (E5) Capabilities

**✅ Confirmed Capabilities:**
1. **Azure AD App Registration** - Full access for OAuth setup
2. **Microsoft Graph API** - All required endpoints available
3. **Exchange Online** - 25 user mailboxes, 10,000 messages/day limit
4. **Microsoft Teams** - Full environment with 25 test users
5. **Admin Permissions** - Global admin rights for configuration

**⚠️ Limitations:**
1. **Duration:** 90-day renewable subscription (auto-renews with activity)
2. **User Limit:** 25 test users maximum
3. **Environment:** Development/testing only (not for production use per terms)
4. **Data Persistence:** Not guaranteed long-term data retention

**✅ Production Migration Path:**
- Code is tenant-agnostic
- Configuration-driven architecture (.env file)
- Client switches only: Tenant ID, Client ID, Client Secret
- Zero code changes required for production deployment

**Conclusion:** Developer Subscription fully satisfies all Sprint 6 development needs.

---

## 🏗️ Technical Architecture

### Microsoft Graph Integration Module

**New Module Structure:**
```
backend/src/microsoft-graph/
├── microsoft-graph.module.ts
├── microsoft-graph.service.ts       # Core Graph client
├── email/
│   └── graph-email.service.ts       # Email service
├── teams/
│   ├── graph-teams.service.ts       # Teams service
│   └── adaptive-cards/
│       └── badge-notification.card.ts
└── config/
    └── graph.config.ts
```

**Key Technical Decisions:**
1. **Authentication:** OAuth 2.0 Client Credentials Flow (application auth)
2. **Token Management:** Automatic refresh with TokenProvider service
3. **Error Handling:** Retry mechanism with exponential backoff
4. **Fallback Strategy:** Queue failed notifications for retry
5. **Configuration:** Environment-driven (.env management)
6. **Testing:** Mock Graph API calls for unit tests

---

### Microsoft Graph API Scopes Required

**Application Permissions (Daemon App):**
- `Mail.Send` - Send emails on behalf of the application
- `ChannelMessage.Send` - Post messages to Teams channels
- `TeamsAppInstallation.ReadWriteSelfForUser` - Bot installation
- `User.Read` - Read basic user information

**Admin Consent:** Required (LegendZhu has global admin rights)

---

### Adaptive Card Design

**Teams Badge Notification Structure:**
- **Hero Section:** Badge image + badge name
- **Details Section:** Issuer name, issue date, description
- **Actions:** 
  - "View Badge" button → Links to badge wallet
  - "Claim Now" button → Direct claim URL with token

**Design Principles:**
- Brand consistency with G-Credit visual identity
- Mobile-responsive layout
- Actionable buttons for user engagement
- Clear call-to-action

---

## 📅 Updated Sprint 6 Scope

### IN SCOPE

**Feature Stories:**
1. ✅ **Story 7.2:** Email Sharing (Microsoft Graph API)
   - Effort: 7-9 hours
   - Implementation: Graph API `/me/sendMail`
   - HTML rich email templates
   
2. ✅ **Story 7.3:** Embeddable Widget
   - Effort: 6-8 hours
   - No change from original plan
   
3. ✅ **Story 7.4:** Teams Notifications (Adaptive Cards)
   - Effort: 8-10 hours
   - Implementation: Graph API + Adaptive Cards
   - Interactive notifications with claim buttons
   
4. ✅ **Story 7.5:** Sharing Analytics
   - Effort: 4-6 hours
   - BadgeShare table with platform tracking

**Technical Infrastructure:**
5. ✅ **Azure AD App Setup**
   - Effort: 2-3 hours
   - App registration, permissions, secrets management
   
6. ✅ **Microsoft Graph Module**
   - Effort: 3-4 hours
   - Core service, authentication, token management

**Technical Debt:**
7. ✅ **TD-001:** E2E Test Isolation Fix
   - Effort: 8-10 hours
   - Database transaction wrapper, test data factory

**UX & Quality:**
8. ✅ **UX Audit & Specs**
   - Effort: 12-17 hours (Sally)
   - Existing pages audit
   - Email/Teams/Widget interaction specs
   - Adaptive Card visual design
   
9. ✅ **UAT Preparation**
   - Effort: 6-9 hours
   - Full-role UAT scripts
   - Test user recruitment

**Total Sprint 6 Effort:** 56-76 hours

---

### OUT OF SCOPE (Deferred to Sprint 7)

**Descoped Stories:**
1. 🔜 **Story 7.1:** LinkedIn Sharing
   - Reason: Focus on M365 ecosystem first
   - Future: Can implement mock or real LinkedIn OAuth in Sprint 7
   
**Future Enhancements:**
2. 🔜 Advanced Adaptive Card features (forms, input fields)
3. 🔜 Performance optimizations
4. 🔜 Azure AD SSO (Epic 13 - originally Phase 3)

---

## 🎯 Action Items

### Immediate Actions (Today/Tomorrow)

**Winston (Architect):**
1. [ ] Create ADR-008: Microsoft Graph Integration Strategy
   - Document OAuth architecture
   - Token management strategy
   - Error handling and retry logic
   - Production migration path

2. [ ] Design Adaptive Card templates
   - Badge notification card structure
   - Claim action buttons
   - Brand-consistent styling

3. [ ] Create Azure AD App Registration guide
   - Step-by-step setup instructions
   - Required permissions list
   - Configuration checklist

**Amelia (Dev):**
1. [ ] Set up Azure AD App in Developer Subscription
   - Register application
   - Configure OAuth permissions
   - Generate Client ID and Secret
   - Store credentials in .env securely

2. [ ] Create Microsoft Graph module skeleton
   - Module structure
   - Basic authentication service
   - Token provider implementation

**Sally (UX Designer):**
1. [ ] Conduct UX audit of existing pages
   - Badge Wallet review
   - Verification page review
   - Document UX improvements

2. [ ] Design email HTML template
   - Badge sharing email layout
   - Brand-consistent styling
   - Responsive design

3. [ ] Design Adaptive Card visual style
   - G-Credit brand colors
   - Icon and imagery guidelines
   - Button styling

**Bob (Scrum Master):**
1. [x] Record meeting decisions (this document)
2. [ ] Create updated Sprint 6 backlog
3. [ ] Update Sprint 6 planning documents
4. [ ] Schedule Sprint 6 kickoff (when LegendZhu ready)

---

### Before Sprint 6 Kickoff

**LegendZhu (Project Lead):**
1. [ ] Provide Developer Subscription details:
   - Tenant ID
   - Tenant domain (e.g., yourdomain.onmicrosoft.com)
   - Admin access confirmation

2. [ ] Decide Sprint 6 start date
   - Recommended: After 1 day rest from Sprint 5
   - Duration: 2.5-3 weeks

**Team:**
1. [ ] Review ADR-008 when published
2. [ ] Review Azure AD setup guide
3. [ ] Prepare local development environment for Graph API testing

---

## 📊 Sprint 6 Updated Timeline

**Duration:** 2.5-3 weeks (56-76 hours)

**Phases:**
- **Week 1:** 
  - Azure AD setup
  - Microsoft Graph module development
  - Email integration (Story 7.2)
  - E2E test fixes (TD-001)
  
- **Week 2:**
  - Teams integration (Story 7.4)
  - Embeddable widget (Story 7.3)
  - Sharing analytics (Story 7.5)
  
- **Week 2.5-3:**
  - Integration testing
  - UX refinements
  - UAT preparation
  - Documentation
  - Sprint review and retrospective

---

## 💡 Key Success Factors

**Technical:**
1. ✅ Microsoft Graph module is reusable for future M365 features
2. ✅ Configuration-driven architecture enables easy production migration
3. ✅ Adaptive Cards provide best-in-class user experience
4. ✅ Unified OAuth across Email and Teams

**Business:**
1. ✅ Production-ready features (not mock/demo)
2. ✅ Better user engagement through Teams notifications
3. ✅ Enterprise-grade email capabilities
4. ✅ Focused scope on M365 ecosystem

**Process:**
1. ✅ UX Designer embedded from start (not end-stage validation)
2. ✅ Architecture decisions made before coding (ADR-008)
3. ✅ Realistic scope with buffer time
4. ✅ Clear descoping rationale (LinkedIn deferred)

---

## 🔄 Comparison: Before vs After

| Aspect | Original Sprint 6 Plan | Updated Sprint 6 Plan |
|--------|----------------------|----------------------|
| **Email** | outlook.com SMTP | Microsoft Graph API ✅ |
| **Teams** | Mock webhook | Graph API + Adaptive Cards ✅ |
| **LinkedIn** | Mock OAuth | Deferred to Sprint 7 🔜 |
| **Duration** | 2 weeks | 2.5-3 weeks ✅ |
| **Total Effort** | 43-60h | 56-76h (+13-16h) |
| **Production Ready** | 3/5 stories | 4/4 stories ✅ |
| **External Deps** | LinkedIn approval pending | Zero blocking dependencies ✅ |

---

## 📝 Meeting Notes

**Winston (Architect) - Key Insights:**
- "Developer Subscription is perfect for our development needs - 100% capability match"
- "Unified Microsoft Graph architecture gives us consistency and future extensibility"
- "Production migration will be seamless - just config changes, no code changes"

**Amelia (Dev) - Implementation Confidence:**
- "Microsoft Graph SDK has excellent documentation and examples"
- "Client Credentials Flow is straightforward to implement"
- "Adaptive Cards designer available online for preview and testing"

**Sally (UX Designer) - Design Considerations:**
- "Teams notifications need to match G-Credit brand identity"
- "Email templates should be responsive (mobile and desktop)"
- "Adaptive Cards have design constraints - need to review Microsoft guidelines"

**LegendZhu (Project Lead) - Strategic Decisions:**
- Prioritized quality over speed (chose full implementations vs mocks)
- Accepted scope adjustment (LinkedIn deferral) to maintain quality
- Approved extended timeline (2.5-3 weeks) for proper implementation

---

## ✅ Decisions Summary

1. ✅ **Email Integration:** Microsoft Graph API (not SMTP)
2. ✅ **Teams Integration:** Full Adaptive Cards (not mock)
3. ✅ **LinkedIn:** Deferred to Sprint 7
4. ✅ **Sprint Duration:** 2.5-3 weeks
5. ✅ **Architecture:** Unified Microsoft Graph module
6. ✅ **Total Effort:** 56-76 hours (manageable)

**All decisions confirmed by LegendZhu.**

---

## 📎 Related Documents

**To Be Created:**
- [ ] ADR-008: Microsoft Graph Integration Strategy (Winston)
- [ ] Azure AD App Setup Guide (Winston)
- [ ] Sprint 6 Backlog (Updated) (Bob)
- [ ] Adaptive Card Design Specs (Sally)
- [ ] Email Template Design (Sally)

**Reference Documents:**
- Epic 7 Definition: `docs/planning/epics.md` (Stories 7.1-7.5)
- Sprint 5 Retrospective: `docs/sprints/sprint-5/retrospective.md`
- Project Context: `project-context.md`

---

**Meeting Status:** ✅ Complete  
**Next Step:** Winston creates ADR-008, Amelia sets up Azure AD App  
**Sprint 6 Kickoff:** To be scheduled by LegendZhu  

**Recorded By:** Bob (Scrum Master)  
**Document Version:** 1.0  
**Last Updated:** 2026-01-29
