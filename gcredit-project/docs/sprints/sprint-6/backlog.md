# Sprint 6 Backlog - Social Sharing & Widget Embedding

**Epic:** Epic 7 - Badge Sharing & Social Proof  
**Sprint:** Sprint 6  
**Duration:** 2.5-3 weeks  
**Total Effort:** 56-76 hours  
**Start Date:** TBD (after preparation + LegendZhu rest)  
**Team:** Winston (Architect), Amelia (Dev), Sally (UX Designer), Bob (Scrum Master)

---

## Sprint Goal

**Primary Objective:**  
Enable badge recipients to share their achievements via **email** and **Microsoft Teams**, with interactive notifications powered by Microsoft Graph API and Adaptive Cards. Implement embeddable badge widget for external websites and track sharing analytics.

**Success Criteria:**
- ✅ Badge recipients can share via email (Microsoft Graph API)
- ✅ Badge recipients receive Teams notifications with Adaptive Cards
- ✅ Embeddable widget works on external websites
- ✅ Sharing analytics tracked in database
- ✅ E2E test isolation issues resolved (TD-001)
- ✅ UX audit complete with improvement recommendations
- ✅ All features pass UAT

---

## Sprint Scope Summary

### IN SCOPE (Sprint 6)
- **4 Feature Stories:** 7.2 (Email), 7.3 (Widget), 7.4 (Teams), 7.5 (Analytics)
- **2 Technical Stories:** Azure AD Setup, Microsoft Graph Module
- **1 Technical Debt:** TD-001 (E2E Test Isolation)
- **UX Work:** Existing pages audit, Email/Teams/Widget design
- **UAT Preparation:** Full-role testing scripts

### OUT OF SCOPE (Deferred to Sprint 7)
- **Story 7.1:** LinkedIn Sharing (mock or real OAuth)
- **Advanced Features:** Email read receipts, Teams bot, Calendar integration

---

## Resource Requirements & Validation

**🔗 References:**
- [`docs/setup/infrastructure-inventory.md`](../../setup/infrastructure-inventory.md) - Existing Azure/Database resources
- ✅ **[`version-manifest.md`](./version-manifest.md)** - Sprint 6 dependency versions (CREATED: 2026-01-29)

**⚠️ Critical:** Before implementing any task, verify resources don't already exist to avoid duplication (Sprint 2 lesson learned).

### New Resources Required for Sprint 6

**📋 Version Reference:** See [version-manifest.md](./version-manifest.md) for exact dependency versions and installation commands.

| Task/Story | Required Resource | Status | Action | Notes |
|------------|------------------|--------|--------|-------|
| **Azure AD App Registration** | Azure AD Application | ❌ **CREATE** | Register new app in M365 Dev Subscription | First-time setup for Graph API |
| **Microsoft Graph Module** | npm: `@microsoft/microsoft-graph-client@3.0.7` | ❌ **INSTALL** | See version-manifest.md for command | New dependencies |
| **Microsoft Graph Module** | npm: `@azure/identity@4.13.0` | ❌ **INSTALL** | See version-manifest.md for command | OAuth token management |
| **Adaptive Cards** | npm: `adaptivecards@3.0.5` | ❌ **INSTALL** | See version-manifest.md for command | Teams card rendering |
| **BadgeShare Table** | PostgreSQL Table | ❌ **CREATE** | Prisma migration (Story 7.5) | New table for analytics |
| **Email Templates** | HTML template files | ❌ **CREATE** | Create in `backend/src/microsoft-graph/email/templates/` | Badge notification template |

### Existing Resources to Reuse

| Resource | Created In | Status | Usage in Sprint 6 |
|----------|-----------|--------|-------------------|
| **Azure Storage Account** | Sprint 0 | ✅ **EXISTS** | Use `gcreditdevstoragelz` for badge images |
| **Badges Container** | Sprint 0 | ✅ **EXISTS** | Use existing `badges` container |
| **PostgreSQL Database** | Sprint 0 | ✅ **EXISTS** | Add BadgeShare table via migration |
| **Badge Table** | Sprint 1 | ✅ **EXISTS** | Query for badge data |
| **Credential Table** | Sprint 2 | ✅ **EXISTS** | Query for issuance data |
| **Evidence Files Table** | Sprint 4 | ✅ **EXISTS** | Include in badge details |

### Environment Variables to Add

```bash
# Add to .env file (Sprint 6 setup)
AZURE_TENANT_ID=<from LegendZhu at kickoff>
AZURE_CLIENT_ID=<generated during Azure AD setup>
AZURE_CLIENT_SECRET=<generated during Azure AD setup>
AZURE_TENANT_DOMAIN=<yourdomain.onmicrosoft.com>
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
ENABLE_GRAPH_EMAIL=true
ENABLE_GRAPH_TEAMS=true
```

### Verification Checklist

Before Sprint 6 implementation:
- [ ] Reviewed `infrastructure-inventory.md` - no duplicate resources planned
- [ ] Confirmed Azure Storage Account exists and accessible
- [ ] Confirmed PostgreSQL connection works
- [ ] Prepared npm package installation plan
- [ ] Prepared .env.example template for new variables

After Sprint 6 completion:
- [ ] Update `infrastructure-inventory.md` with Azure AD App details
- [ ] Update `infrastructure-inventory.md` with new npm packages
- [ ] Update `infrastructure-inventory.md` with BadgeShare table schema
- [ ] Document all new environment variables

---

## Sprint Capacity Planning

### Team Availability (2.5-3 weeks)

| Team Member | Role | Capacity (hours) | Committed (hours) | Buffer (hours) | Utilization |
|-------------|------|-----------------|------------------|----------------|-------------|
| **Amelia** | Dev Lead | 100-120 | 56-76 | 44-44 | 56-63% |
| **Sally** | UX Designer | 37-45 | 19 | 18-26 | 42-51% |
| **Winston** | Architect | 12-15 | 5-10 | 7-5 | 33-67% |
| **Bob** | Scrum Master | 12-15 | 6-9 | 6-6 | 50-60% |
| **TOTAL** | | **161-195** | **86-114** | **75-81** | **53-58%** |

**Notes:**
- 20-25% buffer for unplanned work, meetings, code reviews
- Amelia has largest buffer due to learning curve (Graph API first time)
- Sally's UX work front-loaded (Week 1)
- Winston and Bob in advisory/facilitation roles

### Weekly Breakdown

| Week | Focus Area | Hours | Key Deliverables |
|------|-----------|-------|------------------|
| **Week 1** | Foundation + Email | 28-35 | Azure AD setup, Graph module, Email sharing working |
| **Week 2** | Teams + Widget | 28-35 | Teams notifications, Widget embedding, Analytics |
| **Week 2.5-3** | Quality + UAT | 30-44 | E2E tests stable, UAT complete, Sprint review |

---

## Sprint Ceremonies Schedule

| Ceremony | Frequency | Day | Time | Duration | Participants | Location |
|----------|-----------|-----|------|----------|--------------|----------|
| **Sprint Planning** | Once | Day 0 (Kickoff) | TBD | 2 hours | Full team | TBD |
| **Daily Standup** | Daily | Mon-Fri | TBD | 15 min | Full team | TBD |
| **Backlog Refinement** | 2x/week | Wed, Fri | TBD | 30 min | Full team | TBD |
| **Mid-Sprint Check** | Once | Day 8-10 | TBD | 1 hour | Full team | TBD |
| **Sprint Review** | Once | Last day | TBD | 1.5 hours | Team + LegendZhu | TBD |
| **Sprint Retrospective** | Once | Last day | TBD | 1 hour | Full team | TBD |

**Daily Standup Format:**
- What did I complete yesterday?
- What will I work on today?
- Any blockers?
- Any risks or concerns?

**Mid-Sprint Check (New for Sprint 6):**
- Review progress vs. plan
- Adjust estimates if needed
- Identify early risks
- Ensure Azure AD setup successful

---

## Testing Strategy

### Unit Testing
**Target:** > 80% code coverage

**Key Areas:**
- GraphEmailService (mock Graph client)
- GraphTeamsService (mock Graph client)
- TokenProvider (mock Azure Identity)
- BadgeAnalyticsService (real database with test data)
- AdaptiveCardBuilder (schema validation)

**Tools:**
- Jest for test runner
- jest.mock() for Graph API client
- Supertest for API endpoint tests

### Integration Testing
**Environment:** Microsoft 365 Developer Subscription (E5)

**Test Scenarios:**
1. Send email to test user → Verify received in inbox
2. Send Teams notification to test channel → Verify appears in channel
3. Widget embed on test HTML page → Verify renders correctly
4. Analytics recording → Verify BadgeShare records created

**Test Script Organization (Lesson 13):**
- All Sprint 6 test scripts → `backend/test-scripts/sprint-6/`
- Email sharing tests → `test-email-sharing.ps1`
- Teams sharing tests → `test-teams-notifications.ps1`
- Widget embedding tests → `test-widget-embedding.ps1`
- Analytics tests → `test-sharing-analytics.ps1`
- **Do NOT place test scripts in backend root** (prevents clutter)

**Tools:**
- Real Graph API calls (not mocked)
- Test email addresses from M365 Dev Subscription
- Test Teams channel setup
- PowerShell for E2E test automation

### E2E Testing
**Critical User Flows:**
1. **Email Share Flow:**
   - User opens Badge Detail Modal
   - Clicks "Share" → Selects "Email"
   - Enters recipient email
   - Email sent successfully
   - Share recorded in analytics

2. **Teams Share Flow:**
   - User opens Badge Detail Modal
   - Clicks "Share" → Selects "Teams"
   - Selects team and channel
   - Teams notification sent with Adaptive Card
   - User clicks "View Badge" in Teams → Opens wallet

3. **Widget Embed Flow:**
   - User opens Badge Detail Modal
   - Clicks "Embed Widget"
   - Copies HTML snippet
   - Pastes in external website
   - Widget renders badge correctly
   - Click widget → Opens verification page

**E2E Test Fix (TD-001):**
- Wrap all E2E tests in database transactions
- Automatic rollback after each test
- Use test data factories
- No manual cleanup needed

### UAT Testing
**Timeline:** Last 3-4 days of Sprint 6

**Test Users:**
- LegendZhu (Project Lead)
- 2-3 external testers from M365 Dev Subscription

**UAT Scenarios:**
- Issue badge → Send email notification
- Issue badge → Send Teams notification
- View badge → Generate embed widget
- Verify all features work end-to-end

**UAT Success Criteria:**
- [ ] All critical flows completed without errors
- [ ] Email received and formatted correctly
- [ ] Teams notification appears with interactive buttons
- [ ] Widget embeds on external site
- [ ] Analytics tracking working
- [ ] No major bugs found

---

## Deployment Plan

### Environments

**Development (Current):**
- **URL:** `http://localhost:3000` (backend), `http://localhost:5173` (frontend)
- **Database:** Local PostgreSQL
- **Azure:** gcreditdevstoragelz storage account
- **M365:** Developer Subscription tenant
- **Deployment:** Manual (npm run dev)

**Staging (Post-Sprint 6):**
- **URL:** TBD (Azure App Service or similar)
- **Database:** Azure PostgreSQL
- **Azure:** Same storage account (dev environment)
- **M365:** Same Developer Subscription
- **Deployment:** Manual push after Sprint 6 complete

**Production (Future):**
- **URL:** TBD
- **Database:** Production PostgreSQL
- **Azure:** Customer's Azure resources
- **M365:** Customer's M365 tenant
- **Deployment:** Requires migration (zero code changes, config only)

### Sprint 6 Deployment Timeline

| Milestone | Date | Action |
|-----------|------|--------|
| **Azure AD Setup** | Day 1 | Amelia registers Azure AD App |
| **Dev Environment Ready** | Day 1-2 | Graph module installed, .env configured |
| **Email Feature Complete** | Day 5-7 | Story 7.2 deployed to dev |
| **Teams Feature Complete** | Day 10-12 | Story 7.4 deployed to dev |
| **All Features Complete** | Day 15-16 | All stories deployed to dev |
| **UAT Begin** | Day 16-17 | External testers access dev environment |
| **Sprint 6 Complete** | Day 18-21 | Code merged to main, Git tag created |

### Rollback Plan

**If Email/Teams Integration Fails:**
1. Revert to previous main branch
2. Disable Graph API features via feature flags
3. Use mock implementations temporarily
4. Debug and fix in hotfix branch

**If Database Migration Fails:**
1. Rollback Prisma migration
2. Revert to previous schema
3. Fix migration script
4. Re-run migration

**Feature Flags:**
```bash
# Can disable Graph API if needed
ENABLE_GRAPH_EMAIL=false
ENABLE_GRAPH_TEAMS=false
```

---

## Story Details

### Story 7.2: Email Sharing via Microsoft Graph API

**As a** badge recipient  
**I want to** share my badge via email  
**So that** I can showcase my achievement to employers, colleagues, or on professional networks

**Priority:** HIGH  
**Effort:** 7-9 hours  
**Dependencies:** Azure AD App Registration, Microsoft Graph Module  
**Assignee:** Amelia (Dev)

#### Technical Implementation (Updated for Microsoft Graph)

**Backend Changes:**

1. **Microsoft Graph Email Service**
   - Create `GraphEmailService` in `microsoft-graph/email/` module
   - Implement `sendBadgeNotification()` method
   - Use Graph API endpoint: `POST /me/sendMail`
   - HTML email template rendering
   - Error handling with retry logic

2. **Email Template Service**
   - Create `EmailTemplateService` for HTML rendering
   - Badge email template with G-Credit branding
   - Responsive design (mobile + desktop)
   - Include badge image, name, issuer, claim button
   - **⚠️ CRITICAL:** Configure `nest-cli.json` to copy HTML templates (Lesson 14)
     ```json
     {
       "compilerOptions": {
         "assets": ["**/*.prisma", "**/*.html"],
         "watchAssets": true
       }
     }
     ```

3. **REST API Endpoint**
   - `POST /api/badges/:badgeId/share/email`
   - Request body: `{ recipientEmail: string, message?: string }`
   - Validate badge ownership (user can only share their own badges)
   - **Validate badge image URL before sending** (Lesson 14: External Resource Reliability)
   - Call GraphEmailService
   - **Error handling: Try-catch, log failures but don't throw** (Lesson 14: Don't block operations)
   - Return success/error response

**Frontend Changes:**

1. **Share Button Component**
   - Add "Share via Email" button to Badge Detail page
   - Modal dialog for email input (recipient, optional message)
   - Form validation (valid email format)
   - Loading state during send
   - Success/error toast notifications

2. **Email Preview (Optional)**
   - Show preview of email before sending
   - Inline email template rendering

**Database Changes:**
- Use existing `BadgeShare` table (Story 7.5)
- Record email shares: `platform='email'`, `sharedAt`, `recipientEmail`

**Testing:**
- Unit tests: GraphEmailService (mocked Graph client)
- Integration tests: Send test email to Developer Subscription user
- E2E tests: Full share flow from frontend
- **Manual verification:** Preview email HTML (Lesson 14: Visual debugging)
- **Error scenario tests:** Graph API failures don't block badge operations (Lesson 14)

**Lessons Learned Applied (from Lesson 14 - Email Integration):**
- ✅ Configure nest-cli.json for HTML template assets
- ✅ Validate badge image URLs before sending (prevent broken images)
- ✅ Error handling: Log failures, don't throw (graceful degradation)
- ✅ Dev vs Prod environment switching (M365 Dev Subscription vs customer tenant)
- ✅ Use try-catch to isolate Graph API failures

**Acceptance Criteria:**
- [ ] User can share badge via email from Badge Detail page
- [ ] Email sent successfully via Microsoft Graph API
- [ ] Email contains badge image, name, issuer, claim button
- [ ] Email is responsive (mobile + desktop tested)
- [ ] Email share recorded in BadgeShare table
- [ ] Error handling tested (invalid email, API failures)
- [ ] Integration test passes with real Graph API

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration test passes with M365 Dev Subscription
- [ ] E2E test passes
- [ ] Sally approves email design
- [ ] Documentation updated (API docs, README)
- [ ] Merged to sprint-6 branch

---

### Story 7.3: Embeddable Badge Widget

**As a** badge recipient  
**I want to** embed my badge on external websites  
**So that** I can display my credentials on my personal website, portfolio, or LinkedIn profile

**Priority:** MEDIUM  
**Effort:** 6-8 hours  
**Dependencies:** None (independent story)  
**Assignee:** Amelia (Dev)

#### Technical Implementation (No changes from original plan)

**Backend Changes:**

1. **Widget Embedding API**
   - `GET /api/badges/:badgeId/widget` - Returns HTML snippet
   - `GET /api/badges/:badgeId/embed` - Returns JSON for client-side rendering
   - Public API (no authentication required)
   - CORS configured for cross-origin embedding

2. **Widget Configuration Options**
   - Size: `small` (100x100), `medium` (200x200), `large` (300x300)
   - Theme: `light`, `dark`, `auto`
   - Show details: `true` (badge name + issuer), `false` (image only)

**Frontend Changes:**

1. **Widget Generator Page**
   - New page: `/badges/:badgeId/embed`
   - Preview widget with different size/theme options
   - Copy HTML snippet button
   - Copy iframe code button
   - Instructions for embedding

2. **Embeddable Widget Component**
   - Standalone React component (can run outside main app)
   - Fetch badge data from API
   - Render badge image + details
   - Click opens badge verification page

**Database Changes:**
- Use existing `BadgeShare` table
- Record widget embeds: `platform='widget'`, `sharedAt`

**Testing:**
- Unit tests: Widget API endpoints
- Integration tests: Embed widget on test HTML page
- E2E tests: Widget generator flow
- Cross-browser testing: Chrome, Firefox, Safari, Edge
- Responsive testing: Mobile, tablet, desktop

**Acceptance Criteria:**
- [ ] User can generate embed code from badge detail page
- [ ] Widget displays badge image and details correctly
- [ ] Widget works in iframe and standalone HTML
- [ ] Widget supports 3 sizes and 3 themes
- [ ] Widget click opens verification page in new tab
- [ ] Widget records share in BadgeShare table
- [ ] Widget works cross-origin (CORS configured)
- [ ] Widget is responsive on mobile

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration test with test HTML page
- [ ] E2E test passes
- [ ] Sally approves widget design
- [ ] Documentation updated (embedding guide)
- [ ] Merged to sprint-6 branch

---

### Story 7.4: Microsoft Teams Notifications with Adaptive Cards

**As a** badge issuer  
**I want to** send badge notifications to Microsoft Teams  
**So that** recipients are notified in their preferred collaboration tool

**Priority:** HIGH  
**Effort:** 8-10 hours  
**Dependencies:** Azure AD App Registration, Microsoft Graph Module, Adaptive Card Templates  
**Assignee:** Amelia (Dev)

#### Technical Implementation (Updated for Microsoft Graph + Adaptive Cards)

**Backend Changes:**

1. **Microsoft Graph Teams Service**
   - Create `GraphTeamsService` in `microsoft-graph/teams/` module
   - Implement `sendBadgeNotification()` method
   - Use Graph API endpoint: `POST /teams/{teamId}/channels/{channelId}/messages`
   - Adaptive Card rendering from template
   - Error handling with retry logic

2. **Adaptive Card Builder**
   - Create `BadgeNotificationCardBuilder` in `teams/adaptive-cards/`
   - Build Adaptive Card JSON from badge data
   - Support interactive actions: "View Badge", "Claim Now"
   - Follow design specs from `adaptive-card-specs.md`

3. **REST API Endpoint**
   - `POST /api/badges/:badgeId/share/teams`
   - Request body: `{ teamId: string, channelId: string }`
   - Validate badge ownership
   - Call GraphTeamsService with Adaptive Card
   - Return success/error response

**Frontend Changes:**

1. **Teams Share Button**
   - Add "Share to Teams" button to Badge Detail page
   - Modal dialog for Teams channel selection
   - Team/Channel picker (fetch from Graph API)
   - Loading state during send
   - Success/error toast notifications

2. **Teams Configuration (Admin)**
   - Admin page for configuring default Teams channel
   - Store team/channel IDs in database

**Database Changes:**
- Use existing `BadgeShare` table
- Record Teams shares: `platform='teams'`, `sharedAt`, `metadata` (team/channel IDs)

**Adaptive Card Design:**
- Follow `adaptive-card-specs.md` template
- Badge image, name, issuer, recipient, issue date
- Two action buttons: "View Badge" (wallet URL), "Claim Now" (claim URL)
- Responsive for mobile Teams app

**Testing:**
- Unit tests: GraphTeamsService, AdaptiveCardBuilder (mocked)
- Integration tests: Send to test Teams channel in M365 Dev Subscription
- E2E tests: Full share flow from frontend
- Manual test: Verify Adaptive Card appears correctly, buttons work

**Acceptance Criteria:**
- [ ] User can share badge to Teams channel from Badge Detail page
- [ ] Teams notification sent successfully via Microsoft Graph API
- [ ] Notification uses Adaptive Card (not plain text)
- [ ] Adaptive Card shows badge image, name, issuer, details
- [ ] "View Badge" button opens wallet page
- [ ] "Claim Now" button opens claim page (if applicable)
- [ ] Adaptive Card is responsive (mobile Teams tested)
- [ ] Teams share recorded in BadgeShare table
- [ ] Error handling tested (invalid channel, API failures)
- [ ] Integration test passes with real Graph API

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration test passes with M365 Dev Subscription
- [ ] E2E test passes
- [ ] Sally approves Adaptive Card design
- [ ] Documentation updated (API docs, Teams setup guide)
- [ ] Merged to sprint-6 branch

---

### Story 7.5: Sharing Analytics

**As a** badge issuer  
**I want to** track how badges are shared  
**So that** I can measure engagement and the reach of our credentials

**Priority:** MEDIUM  
**Effort:** 4-6 hours  
**Dependencies:** None (but used by Stories 7.2-7.4)  
**Assignee:** Amelia (Dev)

#### Technical Implementation (No changes from original plan)

**Backend Changes:**

1. **BadgeShare Table** (New)
   ```prisma
   model BadgeShare {
     id          String   @id @default(uuid())
     badgeId     String
     badge       Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
     
     platform    String   // 'email', 'teams', 'widget', 'linkedin' (future)
     sharedAt    DateTime @default(now())
     sharedBy    String   // User ID who shared
     
     // Platform-specific metadata
     recipientEmail String? // For email shares
     metadata       Json?   // For Teams (team/channel), Widget (referrer URL)
     
     @@index([badgeId, platform])
     @@index([sharedAt])
   }
   ```

2. **Analytics Service**
   - Create `BadgeAnalyticsService`
   - Method: `recordShare(badgeId, platform, metadata)`
   - Method: `getShareStats(badgeId)` - Returns share counts by platform
   - Method: `getShareHistory(badgeId, limit)` - Returns recent shares

3. **REST API Endpoints**
   - `GET /api/badges/:badgeId/analytics/shares` - Get share statistics
   - `GET /api/badges/:badgeId/analytics/shares/history` - Get share history
   - Protected: Only badge issuer or recipient can view

**Frontend Changes:**

1. **Analytics Dashboard (Badge Detail)**
   - Show share counts by platform (Email: 5, Teams: 3, Widget: 12)
   - Share history timeline (last 10 shares)
   - Charts: Share trends over time (optional, future enhancement)

2. **Admin Analytics Page**
   - Aggregate analytics across all badges
   - Most shared badges
   - Platform distribution (pie chart)

**Database Migration:**
- Run Prisma migration to create `BadgeShare` table
- Add indexes for performance

**Testing:**
- Unit tests: BadgeAnalyticsService
- Integration tests: Record and retrieve share stats
- E2E tests: Verify analytics display on frontend

**Acceptance Criteria:**
- [ ] BadgeShare table created and migrated
- [ ] recordShare() called by Stories 7.2, 7.3, 7.4
- [ ] Badge detail page shows share counts by platform
- [ ] Badge detail page shows share history (last 10)
- [ ] Only badge owner/issuer can view analytics
- [ ] API endpoints tested and documented

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Database migration tested
- [ ] Documentation updated
- [ ] Merged to sprint-6 branch

---

### Technical Story: Azure AD App Registration & Configuration

**Goal:** Set up Azure AD App in Microsoft 365 Developer Subscription for OAuth authentication

**Priority:** CRITICAL (Blocking Stories 7.2, 7.4)  
**Effort:** 2-3 hours  
**Assignee:** Amelia (Dev) with Winston guidance  
**Prerequisites:** LegendZhu provides Tenant ID and Domain at Sprint kickoff

#### Tasks

1. **Register Azure AD Application**
   - Navigate to Azure Portal → Azure Active Directory → App Registrations
   - Click "New registration"
   - Name: "G-Credit Badge Platform"
   - Supported account types: "Single tenant"
   - No redirect URI needed (daemon app)

2. **Configure API Permissions**
   - Add Application permissions (not Delegated):
     - `Mail.Send` - Send emails
     - `ChannelMessage.Send` - Post to Teams channels
     - `TeamsAppInstallation.ReadWriteSelfForUser` - Bot installation
     - `User.Read` - Read user info (optional)
   - Click "Grant admin consent" (requires Global Admin)

3. **Generate Client Secret**
   - Navigate to "Certificates & secrets"
   - Click "New client secret"
   - Description: "G-Credit Backend Secret - Sprint 6"
   - Expires: 6 months (renewable)
   - Copy secret value immediately (only shown once)

4. **Configure Environment Variables**
   - Update `.env` file:
     ```bash
     AZURE_TENANT_ID=<tenant-guid>
     AZURE_CLIENT_ID=<app-client-id>
     AZURE_CLIENT_SECRET=<secret-value>
     AZURE_TENANT_DOMAIN=gcreditdev.onmicrosoft.com
     GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
     ```
   - Update `.env.example` with placeholders

5. **Test Authentication**
   - Create test script to acquire OAuth token
   - Call Graph API `/me` endpoint to verify
   - Log success/failure

6. **Document Credentials**
   - Store credentials securely (1Password, Azure Key Vault, etc.)
   - Document in `docs/setup/azure-ad-app-setup.md`
   - Include rotation procedure

**Acceptance Criteria:**
- [ ] Azure AD App registered successfully
- [ ] All required permissions granted and consented
- [ ] Client Secret generated and stored securely
- [ ] .env file configured with credentials
- [ ] Authentication test passes (token acquired)
- [ ] Setup guide documented

**Definition of Done:**
- [ ] App registered and configured
- [ ] Test authentication successful
- [ ] Credentials documented securely
- [ ] Winston reviews configuration
- [ ] Setup guide published

---

### Technical Story: Microsoft Graph Module Implementation

**Goal:** Create reusable Microsoft Graph module for Email and Teams services

**Priority:** HIGH (Blocking Stories 7.2, 7.4)  
**Effort:** 3-4 hours  
**Assignee:** Amelia (Dev)  
**Dependencies:** Azure AD App Registration complete

#### Tasks

1. **Module Structure Setup**
   ```
   backend/src/microsoft-graph/
   ├── microsoft-graph.module.ts
   ├── microsoft-graph.service.ts
   ├── config/
   │   ├── graph.config.ts
   │   └── graph-config.service.ts
   ├── auth/
   │   ├── token-provider.service.ts
   │   └── token-cache.service.ts
   ├── email/
   │   ├── graph-email.service.ts
   │   └── email-template.service.ts
   ├── teams/
   │   ├── graph-teams.service.ts
   │   └── adaptive-cards/
   │       └── badge-notification.card.ts
   └── common/
       ├── graph-error-handler.ts
       └── graph-rate-limiter.ts
   ```

2. **Core Microsoft Graph Service**
   - Install dependencies: `@microsoft/microsoft-graph-client`, `@azure/identity`
   - Create `MicrosoftGraphService` (base client)
   - Initialize Graph client with OAuth credentials
   - Singleton pattern (one client instance)

3. **Token Provider Service**
   - Implement OAuth 2.0 Client Credentials Flow
   - Token acquisition using Azure Identity SDK
   - In-memory token caching (55-minute TTL)
   - Automatic token refresh before expiration
   - Thread-safe token management

4. **Error Handling Utilities**
   - Create `GraphErrorHandler` class
   - Retry logic with exponential backoff
   - Handle 401, 429, 500, 502, 503 errors
   - Respect Retry-After header (429 responses)
   - Max 3 retry attempts

5. **Configuration Service**
   - Load Azure AD credentials from .env
   - Validate configuration on startup (fail-fast)
   - Support environment-specific overrides

6. **Unit Tests (Mocked)**
   - Mock Graph client
   - Test token acquisition
   - Test error handling
   - Test retry logic

**Acceptance Criteria:**
- [ ] Module structure created per ADR-008
- [ ] Token provider acquires access token successfully
- [ ] Token caching works (subsequent calls use cached token)
- [ ] Error handler retries on transient errors (429, 500)
- [ ] Configuration validates on startup
- [ ] Unit tests pass (>80% coverage)

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration test with real token acquisition
- [ ] Winston reviews architecture
- [ ] Documentation updated
- [ ] Merged to sprint-6 branch

---

### Technical Debt: TD-001 - E2E Test Isolation Fix

**Issue:** E2E tests interfere with each other due to shared database state

**Priority:** HIGH  
**Effort:** 8-10 hours  
**Assignee:** Amelia (Dev)  
**Reference:** `docs/sprints/sprint-5/TECHNICAL-DEBT.md` TD-001

#### Problem Statement

Current E2E tests use the same test database without proper isolation:
- Tests create records that persist across test runs
- Sequential tests depend on order (flaky)
- Cleanup is manual and incomplete
- Hard to debug test failures

#### Solution (Database Transaction Wrapper)

**Approach:**
1. Wrap each E2E test in a database transaction
2. Rollback transaction after test completes (automatic cleanup)
3. Create test data factory for consistent test data
4. Ensure tests can run in parallel

**Implementation:**

1. **Transaction Wrapper Utility**
   ```typescript
   // test/utils/transaction-wrapper.ts
   export async function runInTransaction(testFn: () => Promise<void>) {
     const prisma = new PrismaClient();
     await prisma.$transaction(async (tx) => {
       try {
         await testFn();
       } finally {
         // Transaction auto-rolls back after test
       }
     });
   }
   ```

2. **Test Data Factory**
   ```typescript
   // test/factories/badge.factory.ts
   export class BadgeFactory {
     static async create(overrides = {}) {
       return prisma.badge.create({
         data: {
           name: 'Test Badge',
           description: 'Test Description',
           ...overrides
         }
       });
     }
   }
   ```

3. **Update E2E Tests**
   - Wrap all tests in `runInTransaction()`
   - Use test factories instead of hardcoded data
   - Remove manual cleanup code

**Testing:**
- Run E2E tests multiple times (ensure consistent results)
- Run tests in parallel (no conflicts)
- Verify database is clean after test suite

**Acceptance Criteria:**
- [ ] Transaction wrapper utility created
- [ ] Test data factories created for all models
- [ ] All E2E tests updated to use transaction wrapper
- [ ] Tests pass consistently (10 consecutive runs)
- [ ] Tests can run in parallel (no conflicts)
- [ ] Database is clean after test suite
- [ ] Test execution time improved (parallelization)

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] All E2E tests refactored
- [ ] Tests pass consistently
- [ ] Documentation updated (testing guide)
- [ ] Winston reviews approach
- [ ] Merged to sprint-6 branch

---

## UX Design Work

### Sally's Tasks (10-14 hours total)

**1. Existing Pages UX Audit** (4-6 hours)
- Badge Wallet page review
- Badge Verification page review
- Badge Detail page review
- Identify UX inconsistencies and improvements
- Document findings in `docs/sprints/sprint-6/ux-audit-report.md`

**2. Email HTML Template Design** (3-4 hours)
- Badge notification email layout
- G-Credit branding (logo, colors, typography)
- Responsive design (mobile + desktop)
- Call-to-action buttons
- Deliverable: HTML template + design specs

**3. Teams Adaptive Card Visual Design** (3-4 hours)
- Review Winston's Adaptive Card template
- Define G-Credit brand application within Teams constraints
- Icon and imagery guidelines
- Preview in Teams Adaptive Card Designer
- Deliverable: Visual design mockup + style guide

**4. Embeddable Widget Interaction Specs** (2-3 hours)
- Widget embedding examples
- Widget customization options (theme, size)
- Responsive behavior
- Loading/error states
- Deliverable: Widget interaction specs document

**Acceptance Criteria:**
- [ ] UX audit complete with actionable recommendations
- [ ] Email template design approved by LegendZhu
- [ ] Adaptive Card design approved by LegendZhu
- [ ] Widget specs documented
- [ ] All designs follow G-Credit brand guidelines

---

## UAT Preparation Work

### Bob's Tasks (6-9 hours)

**1. UAT Test Scripts** (3-4 hours)
- Create role-based test scripts:
  - Badge Issuer: Issue badge → Verify email/Teams sent
  - Badge Recipient: Claim badge → Share via email/Teams/widget
  - External Viewer: Verify badge → View embedded widget
- Document expected results for each scenario
- Create UAT checklist

**2. Test User Recruitment** (1-2 hours)
- Recruit 3-5 test users (M365 Dev Subscription users)
- Brief users on UAT goals
- Schedule UAT sessions (1-2 hours each)

**3. UAT Environment Setup** (2-3 hours)
- Configure test Teams channels
- Prepare test email addresses
- Create test badge data
- Verify all features work in staging

**Acceptance Criteria:**
- [ ] UAT scripts created for all roles
- [ ] Test users recruited and briefed
- [ ] UAT environment ready
- [ ] UAT scheduled (after Sprint 6 feature complete)

---

## Sprint Milestones

### Week 1: Foundation + Email
- **Days 1-2:** Azure AD setup, Microsoft Graph module implementation
- **Days 3-5:** Story 7.2 (Email Sharing) + Story 7.5 (Analytics table)
- **Deliverable:** Email sharing works with real Graph API

### Week 2: Teams + Widget
- **Days 6-8:** Story 7.4 (Teams Notifications + Adaptive Cards)
- **Days 9-10:** Story 7.3 (Embeddable Widget)
- **Deliverable:** Teams and Widget features complete

### Week 2.5-3: Quality + UAT
- **Days 11-12:** TD-001 (E2E Test Isolation)
- **Days 13-14:** Integration testing, bug fixes
- **Days 15-16:** UAT with test users
- **Days 17-18:** UAT feedback fixes, Sprint Review, Retrospective
- **Deliverable:** Sprint 6 complete, all stories pass UAT

---

## Definition of Ready (Story Level)

A story is ready to start when:
- [ ] Acceptance criteria clearly defined
- [ ] Dependencies identified and unblocked
- [ ] Technical design reviewed by Winston
- [ ] UX design approved by Sally (if applicable)
- [ ] Assignee confirmed and available
- [ ] Test strategy defined

---

## Definition of Done (Sprint Level)

Sprint 6 is complete when:
- [ ] All 4 feature stories implemented and merged
- [ ] All 2 technical stories complete
- [ ] TD-001 resolved (E2E tests stable)
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass (real Graph API)
- [ ] All E2E tests pass (stable, no flakes)
- [ ] Sally's UX audit complete with recommendations documented
- [ ] UAT completed by 3+ test users
- [ ] All UAT blockers resolved
- [ ] Code reviewed and merged to main
- [ ] Documentation updated (API docs, README, setup guides)
- [ ] Sprint Review conducted
- [ ] Sprint Retrospective conducted
- [ ] sprint-status.yaml updated

---

## Risk Management

### High Risks

**Risk 1: Microsoft Graph API Learning Curve**
- **Impact:** HIGH (delays Stories 7.2, 7.4)
- **Probability:** MEDIUM
- **Mitigation:** Winston created comprehensive ADR-008, Amelia starts with simple email test
- **Contingency:** Pair programming with Winston if blocked

**Risk 2: Azure AD App Registration Issues**
- **Impact:** CRITICAL (blocks all Graph API work)
- **Probability:** LOW
- **Mitigation:** Winston's setup guide, Amelia has Global Admin access
- **Contingency:** Winston takes over if Amelia blocked

**Risk 3: Adaptive Cards Design Constraints**
- **Impact:** MEDIUM (may limit UX design)
- **Probability:** MEDIUM
- **Mitigation:** Sally previews in Teams Adaptive Card Designer early
- **Contingency:** Simplify card design if needed, maintain core functionality

### Medium Risks

**Risk 4: E2E Test Refactoring Scope Creep**
- **Impact:** MEDIUM (TD-001 takes longer than 10h)
- **Probability:** MEDIUM
- **Mitigation:** Time-box to 12 hours max, defer complete solution if needed
- **Contingency:** Partial fix (most critical tests only)

**Risk 5: UAT Test User Availability**
- **Impact:** MEDIUM (delays UAT)
- **Probability:** LOW
- **Mitigation:** Recruit users early, schedule sessions in advance
- **Contingency:** Bob and Winston conduct UAT if external users unavailable

---

## Dependencies

### External Dependencies
- **Microsoft 365 Developer Subscription:** Available ✅
- **Azure AD Tenant Access:** LegendZhu has Global Admin ✅
- **Test Teams Environment:** Available in M365 Dev Subscription ✅

### Internal Dependencies
- **ADR-008:** Complete ✅
- **Adaptive Card Specs:** Complete ✅
- **Sprint 6 Kickoff Readiness:** In progress ⏳

### Story Dependencies
- Stories 7.2, 7.4 depend on: Azure AD setup + Microsoft Graph module
- Story 7.2, 7.3, 7.4 depend on: Story 7.5 (BadgeShare table)
- UX work must complete before feature UAT

---

## Velocity Tracking

**Team Capacity:**
- Amelia (Dev): 40 hours/week × 2.5-3 weeks = 100-120 hours
- Sally (UX): 15 hours/week × 2.5-3 weeks = 37-45 hours
- Winston (Architect): 5-10 hours (guidance, reviews)
- Bob (Scrum Master): 5-8 hours (facilitation, UAT)

**Sprint Commitment:** 56-76 hours  
**Buffer:** 44-44 hours (Amelia has capacity buffer)  
**Confidence:** HIGH (realistic scope after descoping LinkedIn)

**Velocity Targets:**
- Week 1: 20-25 hours (Foundation + Email)
- Week 2: 20-25 hours (Teams + Widget)
- Week 2.5-3: 16-26 hours (Testing + UAT)

---

## Sprint-Level Definition of Done

**⚠️ CRITICAL:** These items MUST be completed before Sprint 6 is considered "Done"

🔗 **Complete Checklist Reference:** [sprint-completion-checklist-template.md](../../templates/sprint-completion-checklist-template.md)

### 1. 功能交付 (Feature Delivery)

- [ ] **All 4 Feature Stories Complete** (7.2, 7.3, 7.4, 7.5)
  - [ ] Story 7.2: Email Sharing (Microsoft Graph API)
  - [ ] Story 7.3: Embeddable Widget
  - [ ] Story 7.4: Teams Notifications (Adaptive Cards)
  - [ ] Story 7.5: Sharing Analytics
- [ ] **All 2 Technical Stories Complete**
  - [ ] Azure AD App Registration & Configuration
  - [ ] Microsoft Graph Module Implementation
- [ ] **TD-001 Resolved** (E2E Test Isolation Fix)
- [ ] **All Acceptance Criteria Met** for each story
- [ ] **No Critical Bugs** remaining (P0/P1 bugs resolved)

### 2. 测试质量 (Testing Quality)

- [ ] **Unit Test Coverage > 80%**
  - [ ] GraphEmailService: > 80%
  - [ ] GraphTeamsService: > 80%
  - [ ] BadgeAnalyticsService: > 80%
  - [ ] TokenProvider: > 80%
- [ ] **All Integration Tests Pass** (with real Microsoft Graph API)
  - [ ] Email sending to M365 Dev Subscription user
  - [ ] Teams notification to test channel
  - [ ] Widget rendering on test HTML page
- [ ] **All E2E Tests Pass** (stable, no flakes)
  - [ ] Email share flow (frontend → backend → Graph API → inbox)
  - [ ] Teams share flow (frontend → backend → Graph API → Teams)
  - [ ] Widget embed flow (generate → copy → paste → render)
- [ ] **E2E Tests Isolated** (TD-001 fix verified)
  - [ ] Tests run in transactions
  - [ ] No cross-test contamination
  - [ ] Can run in parallel without conflicts

### 3. 代码质量 (Code Quality)

- [ ] **All Code Reviewed**
  - [ ] Winston reviewed architectural decisions
  - [ ] Peer review completed for all PRs
  - [ ] No unresolved review comments
- [ ] **Code Style Consistent**
  - [ ] ESLint passes with no errors
  - [ ] Prettier formatting applied
  - [ ] TypeScript strict mode enabled
- [ ] **No Known Security Issues**
  - [ ] No secrets in code (use .env)
  - [ ] OAuth credentials stored securely
  - [ ] Input validation for all API endpoints
  - [ ] CORS configured correctly
- [ ] **Commit Messages Follow Standard** (Pattern 6 from Lessons-Learned)
  - [ ] Format: `Sprint 6 Story 7.x: Brief description`
  - [ ] Bullet points for multiple changes
  - [ ] Meaningful messages (not "fix bug" or "update")
  - [ ] Present tense ("Add feature" not "Added feature")

### 4. Git管理 (Git Management)

- [ ] **Code Merged to Main**
  - [ ] All feature branches merged to sprint-6 branch
  - [ ] sprint-6 branch merged to main
  - [ ] All merge conflicts resolved
  - [ ] CI/CD pipeline passes
- [ ] **Git Tag Created**
  - [ ] Tag name: `v0.6.0`
  - [ ] Tag message: "Sprint 6: Social Sharing & Widget Embedding"
  - [ ] Tag pushed to remote
- [ ] **No Uncommitted Changes**
  - [ ] Working directory clean
  - [ ] No WIP commits on main

### 5. 文档更新 (Documentation Updates)

- [ ] **project-context.md Updated** ⚠️ **MOST CRITICAL**
  - [ ] Current Status updated (Sprint 6 complete)
  - [ ] Sprint 6 section added with:
    - Stories completed (7.2-7.5)
    - Technical work (Azure AD + Graph Module + TD-001)
    - Key metrics (stories, hours, tests)
  - [ ] Implemented Features section updated:
    - Microsoft Graph Email integration
    - Teams Adaptive Cards
    - Embeddable widget
    - Sharing analytics
  - [ ] Next Steps updated (Sprint 7 planning)
  
- [ ] **CHANGELOG.md Updated**
  - [ ] Version 0.6.0 section added
  - [ ] All features documented
  - [ ] All bug fixes documented
  - [ ] Technical debt resolved documented
  - [ ] Breaking changes noted (if any)
  
- [ ] **README.md Updated**
  - [ ] Status badges updated (Sprint 0-6 complete)
  - [ ] Roadmap table updated (Sprint 6 complete)
  - [ ] Tech stack updated (Microsoft Graph, Adaptive Cards)
  - [ ] "Last Updated" date updated
  
- [ ] **infrastructure-inventory.md Updated** ⚠️ **CRITICAL**
  - [ ] Azure AD Application added
  - [ ] Microsoft Graph npm packages added
  - [ ] BadgeShare table schema documented
  - [ ] New environment variables documented
  - [ ] Resource usage notes updated
  
- [ ] **API Documentation Updated**
  - [ ] New endpoints documented (share/email, share/teams, widget)
  - [ ] Request/response schemas updated
  - [ ] Authentication requirements noted
  - [ ] Examples provided
  
- [ ] **Sprint 6 Summary Created**
  - [ ] `docs/sprints/sprint-6/sprint-summary.md`
  - [ ] Includes: goals, achievements, metrics, challenges, lessons
  
- [ ] **Sprint 6 Retrospective Created**
  - [ ] `docs/sprints/sprint-6/retrospective.md`
  - [ ] Includes: what went well, what didn't, action items
  - [ ] Team feedback captured
  
- [ ] **GitHub Release Created**
  - [ ] Release v0.6.0 on GitHub
  - [ ] Release notes from CHANGELOG
  - [ ] Tag linked correctly

### 6. UAT验收 (UAT Acceptance)

- [ ] **LegendZhu UAT Complete**
  - [ ] All critical flows tested end-to-end
  - [ ] Email sharing works (sent and received)
  - [ ] Teams notifications work (sent and visible)
  - [ ] Widget embedding works (renders correctly)
  - [ ] Analytics tracking verified
  - [ ] No major issues found
  - [ ] Formal approval received

### 7. Sprint仪式完成 (Sprint Ceremonies Complete)

- [ ] **Sprint Review Conducted**
  - [ ] Demo presented to LegendZhu
  - [ ] Features showcased
  - [ ] Feedback collected
  - [ ] Meeting notes recorded
  
- [ ] **Sprint Retrospective Conducted**
  - [ ] What went well discussed
  - [ ] What didn't go well discussed
  - [ ] Action items identified
  - [ ] Retrospective document created

### 8. 准备下一Sprint (Prepare Next Sprint)

- [ ] **Backlog Grooming Complete**
  - [ ] Sprint 7 backlog reviewed
  - [ ] Stories estimated
  - [ ] Dependencies identified
  
- [ ] **Technical Debt Documented**
  - [ ] Any new technical debt from Sprint 6 recorded
  - [ ] TD-002, TD-003, etc. created if needed
  - [ ] Prioritization discussed
  
- [ ] **Team Capacity Confirmed**
  - [ ] Team availability for Sprint 7 confirmed
  - [ ] Vacation/PTO noted
  - [ ] Capacity planning updated

---

**Sprint 6 Status Tracking:**

| Category | Items | Completed | Progress |
|----------|-------|-----------|----------|
| Feature Delivery | 7 | 0 | 0% |
| Testing Quality | 9 | 0 | 0% |
| Code Quality | 6 | 0 | 0% |
| Git Management | 4 | 0 | 0% |
| Documentation | 11 | 0 | 0% |
| UAT Acceptance | 6 | 0 | 0% |
| Sprint Ceremonies | 4 | 0 | 0% |
| Next Sprint Prep | 3 | 0 | 0% |
| **TOTAL** | **50** | **0** | **0%** |

**Last Updated:** 2026-01-29 (Pre-Sprint 6 Kickoff)

---

## References

### Strategic Planning
- [Sprint 6 Strategy Adjustment Meeting](../../decisions/sprint-6-strategy-adjustment-meeting-2026-01-29.md)
- [Sprint 6 Kickoff Readiness Checklist](./kickoff-readiness.md)
- [Epic 7 Definition](../../planning/epics.md)

### Technical Design
- [ADR-008: Microsoft Graph Integration Strategy](../../decisions/ADR-008-microsoft-graph-integration.md)
- [Adaptive Card Design Specifications](./adaptive-card-specs.md)
- [Technical Debt: TD-001](../sprint-5/TECHNICAL-DEBT.md)

### Process Documents
- [Sprint Completion Checklist Template](_bmad/bmm/resources/templates/sprint-completion-checklist-template.md)
- [BMAD Methodology](/_bmad/bmm/README.md)

---

**Backlog Status:** ✅ Ready for Sprint Kickoff  
**Next Action:** LegendZhu approves and confirms Sprint 6 start date  
**Last Updated:** 2026-01-29

---

**Prepared By:** Bob (Scrum Master)  
**Reviewed By:** Winston (Architect), Sally (UX Designer)  
**Approved By:** [Pending LegendZhu]
