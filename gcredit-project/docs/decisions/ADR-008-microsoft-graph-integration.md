# ADR-008: Microsoft Graph Integration Strategy

**ADR Number:** 008  
**Status:** ✅ Accepted  
**Date:** 2026-01-29  
**Author:** Winston (Architect)  
**Deciders:** LegendZhu (Project Lead), Winston (Architect), Amelia (Dev)  
**Context:** Sprint 6 Strategy Adjustment Meeting (2026-01-29)

---

## Context and Problem Statement

G-Credit needs to implement email sharing and Microsoft Teams notifications for badge distribution in Sprint 6 (Epic 7). Originally planned with mock implementations (SMTP for email, webhook mock for Teams), the acquisition of **Microsoft 365 Developer Subscription (E5)** enables production-grade implementations using Microsoft Graph API.

**Key Questions:**
1. Should we use Microsoft Graph API or simpler alternatives (SMTP, webhooks)?
2. How do we architect a Graph API integration that's production-ready yet dev-environment friendly?
3. How do we ensure seamless migration from Developer Subscription to customer production tenants?
4. What authentication strategy best fits our application architecture?

---

## Decision Drivers

### Business Drivers
- **Production Readiness:** Deliver enterprise-grade features, not demos
- **User Experience:** Best-in-class email and Teams notifications
- **Future Extensibility:** Enable future M365 integrations (Calendar, OneDrive, etc.)
- **Migration Path:** Seamless transition from dev to production environments

### Technical Drivers
- **Unified Architecture:** Consistent authentication across M365 services
- **Security:** Industry-standard OAuth 2.0 authentication
- **Reliability:** Built-in retry, error handling, rate limiting
- **Testability:** Mock-friendly for unit tests, real API for integration tests

### Resource Constraints
- **Development Time:** Sprint 6 budget is 56-76 hours
- **Expertise:** Team has Graph API learning curve
- **Infrastructure:** Microsoft 365 Developer Subscription available (90-day renewable)

---

## Considered Options

### Option A: Microsoft Graph API (CHOSEN ✅)
**Implementation:**
- OAuth 2.0 Client Credentials Flow (application-level authentication)
- Microsoft Graph SDK for Node.js
- Unified module for Email + Teams
- Token provider with automatic refresh

**Pros:**
- ✅ Enterprise-grade reliability and features
- ✅ Unified authentication across M365 services
- ✅ Rich functionality (HTML emails, Adaptive Cards, read receipts)
- ✅ Official Microsoft SDK with excellent documentation
- ✅ Future-proof for additional M365 features
- ✅ Production-ready from Sprint 6

**Cons:**
- ⚠️ +11-15 hours development effort vs simpler options
- ⚠️ OAuth setup complexity (Azure AD App Registration)
- ⚠️ Learning curve for Graph API
- ⚠️ Requires M365 subscription (available)

---

### Option B: SMTP for Email + Webhook Mock for Teams
**Implementation:**
- outlook.com SMTP for email (personal account)
- Mock webhook endpoint for Teams
- Separate implementations

**Pros:**
- ✅ Simple implementation (~40 hours total)
- ✅ No OAuth complexity
- ✅ Faster development

**Cons:**
- ❌ Not production-ready (mocks + personal SMTP)
- ❌ Poor user experience (no Teams interactivity)
- ❌ Inconsistent architecture
- ❌ Requires rework for production
- ❌ Limited email features (plain SMTP)

---

### Option C: Third-Party Services (SendGrid, Slack)
**Implementation:**
- SendGrid for email
- Slack for notifications (instead of Teams)

**Pros:**
- ✅ Quick integration
- ✅ Good documentation

**Cons:**
- ❌ Not aligned with user's M365 ecosystem
- ❌ Additional cost (SendGrid paid plans)
- ❌ Slack ≠ Teams (different user base)
- ❌ Another external dependency

---

## Decision Outcome

**Chosen Option:** **Option A - Microsoft Graph API** with unified module architecture.

### Rationale

1. **Production-First Philosophy:** Deliver real features, not demos
2. **M365 Ecosystem Alignment:** User has Developer Subscription, production customers likely use M365
3. **Unified Architecture:** One OAuth flow for Email + Teams + future features
4. **Quality Investment:** +11-15 hours buys enterprise-grade implementation
5. **Extensibility:** Enables future features (Calendar invites, OneDrive storage, SharePoint integration)

### Trade-offs Accepted

- **Increased Sprint Scope:** +11-15 hours development effort (mitigated by descoping LinkedIn to Sprint 7)
- **OAuth Complexity:** Initial setup overhead (mitigated by Winston's setup guide)
- **Learning Curve:** Graph API familiarization (mitigated by excellent Microsoft documentation)

---

## Technical Architecture

### Module Structure

```
backend/src/microsoft-graph/
├── microsoft-graph.module.ts          # NestJS module definition
├── microsoft-graph.service.ts         # Core Graph API client
├── config/
│   ├── graph.config.ts                # Configuration schema
│   └── graph-config.service.ts        # ConfigService integration
├── auth/
│   ├── token-provider.service.ts      # OAuth token management
│   └── token-cache.service.ts         # In-memory token caching
├── email/
│   ├── graph-email.service.ts         # Email sending service
│   ├── email-template.service.ts      # HTML template rendering
│   └── templates/
│       └── badge-notification.html    # Badge email template
├── teams/
│   ├── graph-teams.service.ts         # Teams messaging service
│   └── adaptive-cards/
│       ├── badge-notification.card.ts # Adaptive Card builder
│       └── card-actions.service.ts    # Action URL generation
└── common/
    ├── graph-error-handler.ts         # Error handling & retry
    └── graph-rate-limiter.ts          # Rate limit management
```

### Authentication Flow: OAuth 2.0 Client Credentials

**Why Client Credentials Flow?**
- Application sends emails/Teams messages on its own behalf (not on behalf of a specific user)
- No user interaction required (daemon/background service)
- Long-lived access suitable for server-side applications

**Flow Diagram:**
```
┌─────────────┐                ┌──────────────┐
│  G-Credit   │                │  Azure AD    │
│  Backend    │                │  (Microsoft) │
└──────┬──────┘                └──────┬───────┘
       │                              │
       │ 1. Request Token             │
       │    (Client ID + Secret)      │
       ├─────────────────────────────>│
       │                              │
       │ 2. Validate Credentials      │
       │    + Check Permissions       │
       │                              │
       │ 3. Return Access Token       │
       │<─────────────────────────────┤
       │    (expires in 60 min)       │
       │                              │
       │ 4. Call Graph API            │
       │    (Bearer Token)            │
       │                              │
       │ 5. Auto-refresh before       │
       │    expiration                │
       │                              │
```

**Token Management Strategy:**
- **Cache tokens in memory** (singleton service)
- **Refresh 5 minutes before expiration** (proactive refresh)
- **Fallback to on-demand refresh** if cache miss
- **Thread-safe token acquisition** (prevent race conditions)

### Configuration Schema

**Environment Variables (`.env`):**
```bash
# Microsoft Graph API Configuration
AZURE_TENANT_ID=<tenant-guid>
AZURE_CLIENT_ID=<client-guid>
AZURE_CLIENT_SECRET=<secret-value>
AZURE_TENANT_DOMAIN=yourdomain.onmicrosoft.com

# Graph API Endpoints
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# Feature Flags
ENABLE_GRAPH_EMAIL=true
ENABLE_GRAPH_TEAMS=true

# Retry Configuration
GRAPH_RETRY_MAX_ATTEMPTS=3
GRAPH_RETRY_DELAY_MS=1000
GRAPH_RATE_LIMIT_PER_MINUTE=30
```

**Configuration Validation:**
- Validate on application startup (fail-fast)
- Throw descriptive errors if credentials missing
- Support environment-specific overrides (dev, staging, prod)

---

## API Design

### Email Service Interface

```typescript
// graph-email.service.ts
export class GraphEmailService {
  /**
   * Send badge notification email via Microsoft Graph API
   */
  async sendBadgeNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeId: string;
    badgeName: string;
    badgeImageUrl: string;
    issuerName: string;
    claimUrl: string;
  }): Promise<EmailSendResult>;

  /**
   * Send HTML email with custom template
   */
  async sendEmail(params: {
    to: string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
    attachments?: Attachment[];
  }): Promise<EmailSendResult>;
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: GraphError;
}
```

**Graph API Endpoint:**
- `POST https://graph.microsoft.com/v1.0/users/{userId}/sendMail`
- Or `POST https://graph.microsoft.com/v1.0/me/sendMail` (application context)

**Required Permission:** `Mail.Send` (Application)

---

### Teams Service Interface

```typescript
// graph-teams.service.ts
export class GraphTeamsService {
  /**
   * Send badge notification to Teams channel using Adaptive Card
   */
  async sendBadgeNotification(params: {
    teamId: string;
    channelId: string;
    badgeId: string;
    badgeName: string;
    badgeImageUrl: string;
    issuerName: string;
    recipientName: string;
    claimUrl: string;
  }): Promise<TeamsSendResult>;

  /**
   * Send custom Adaptive Card to Teams channel
   */
  async sendAdaptiveCard(params: {
    teamId: string;
    channelId: string;
    card: AdaptiveCard;
  }): Promise<TeamsSendResult>;
}

interface TeamsSendResult {
  success: boolean;
  messageId?: string;
  error?: GraphError;
}
```

**Graph API Endpoint:**
- `POST https://graph.microsoft.com/v1.0/teams/{teamId}/channels/{channelId}/messages`

**Required Permissions:**
- `ChannelMessage.Send` (Application)
- `TeamsAppInstallation.ReadWriteSelfForUser` (for bot installation)

---

### Adaptive Card Structure

**Badge Notification Card:**
```json
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "Container",
      "items": [
        {
          "type": "Image",
          "url": "${badgeImageUrl}",
          "size": "Medium",
          "horizontalAlignment": "Center"
        },
        {
          "type": "TextBlock",
          "text": "🎉 New Badge Earned!",
          "weight": "Bolder",
          "size": "Large",
          "horizontalAlignment": "Center"
        },
        {
          "type": "TextBlock",
          "text": "${badgeName}",
          "weight": "Bolder",
          "size": "Medium",
          "wrap": true
        },
        {
          "type": "FactSet",
          "facts": [
            {"title": "Issued By:", "value": "${issuerName}"},
            {"title": "Recipient:", "value": "${recipientName}"},
            {"title": "Issued On:", "value": "${issueDate}"}
          ]
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View Badge",
      "url": "${badgeWalletUrl}"
    },
    {
      "type": "Action.OpenUrl",
      "title": "Claim Now",
      "url": "${claimUrl}",
      "style": "positive"
    }
  ]
}
```

**Design Principles:**
- **Visual Hierarchy:** Badge image prominent, actions clear
- **Brand Consistency:** Use G-Credit colors in template (via theme)
- **Mobile-Responsive:** Adaptive Cards auto-adjust to Teams mobile app
- **Actionable:** Two clear CTAs (View + Claim)

---

## Error Handling Strategy

### Error Categories

**1. Authentication Errors (401)**
- **Cause:** Invalid/expired token, missing permissions
- **Handling:** Re-authenticate, cache bust, retry once
- **Logging:** Error + tenant ID (no secrets)

**2. Rate Limiting (429)**
- **Cause:** Too many requests
- **Handling:** Exponential backoff with Retry-After header
- **Logging:** Warn + retry attempt count

**3. Resource Not Found (404)**
- **Cause:** Invalid team/channel ID, user not found
- **Handling:** No retry, return error to caller
- **Logging:** Error + resource ID

**4. Server Errors (500, 502, 503)**
- **Cause:** Microsoft service issues
- **Handling:** Retry with exponential backoff (max 3 attempts)
- **Logging:** Error + request ID from response

**5. Validation Errors (400)**
- **Cause:** Invalid request payload
- **Handling:** No retry, fix code
- **Logging:** Error + request payload (sanitized)

### Retry Logic

```typescript
class GraphErrorHandler {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 3;
    const baseDelay = options.baseDelay || 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === maxAttempts;
        
        if (!isRetryable || isLastAttempt) {
          throw error;
        }
        
        const delay = this.calculateBackoff(attempt, baseDelay, error);
        await this.sleep(delay);
      }
    }
  }
  
  private calculateBackoff(attempt: number, baseDelay: number, error: any): number {
    // Honor Retry-After header if present (rate limiting)
    if (error.statusCode === 429 && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after']) * 1000;
    }
    
    // Exponential backoff: 1s, 2s, 4s
    return baseDelay * Math.pow(2, attempt - 1);
  }
  
  private isRetryableError(error: any): boolean {
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.statusCode);
  }
}
```

### Fallback Strategy

**Degradation Path:**
1. **Primary:** Microsoft Graph API (real-time sending)
2. **Fallback:** Queue notification for retry (BullMQ)
3. **Ultimate Fallback:** Log error, alert admin, manual intervention

**Queue Implementation (Future Enhancement):**
- Use BullMQ (already in project for other features)
- Store failed notifications with retry metadata
- Worker processes queue with exponential backoff
- Max retry: 3 attempts over 24 hours
- After max retry: Move to dead-letter queue + alert

---

## Production Migration Path

### Development Environment (Current)
**Microsoft 365 Developer Subscription (E5):**
- Tenant ID: `<dev-tenant-guid>`
- Domain: `gcreditdev.onmicrosoft.com` (example)
- Users: 25 test users
- Limitations: 90-day renewable, dev/test only

### Production Environment (Future)
**Customer's M365 Tenant:**
- Tenant ID: `<customer-tenant-guid>`
- Domain: `customer.com`
- Users: Customer's employees
- Licensing: Customer's M365 subscription

### Migration Checklist

**Zero Code Changes Required - Configuration Only:**

1. **Azure AD App Registration** (in customer tenant)
   - Register new app in customer's Azure AD
   - Configure same permissions (Mail.Send, ChannelMessage.Send)
   - Grant admin consent
   - Generate new Client ID and Secret

2. **Update Environment Variables:**
   ```bash
   # OLD (Dev Subscription)
   AZURE_TENANT_ID=<dev-tenant-guid>
   AZURE_CLIENT_ID=<dev-client-guid>
   AZURE_CLIENT_SECRET=<dev-secret>
   AZURE_TENANT_DOMAIN=gcreditdev.onmicrosoft.com
   
   # NEW (Production)
   AZURE_TENANT_ID=<customer-tenant-guid>
   AZURE_CLIENT_ID=<customer-client-guid>
   AZURE_CLIENT_SECRET=<customer-secret>
   AZURE_TENANT_DOMAIN=customer.com
   ```

3. **Test in Staging Environment:**
   - Deploy to staging with production credentials
   - Test email sending
   - Test Teams notifications
   - Verify permissions work correctly

4. **Production Deployment:**
   - Deploy application with updated .env
   - Monitor first few notifications
   - Verify no authentication errors

**Key Design Principle:** Tenant-agnostic code ensures seamless migration.

---

## Testing Strategy

### Unit Tests (Mocked)
**Scope:** Test business logic without real Graph API calls

**Approach:**
```typescript
// Mock Graph API client
jest.mock('@microsoft/microsoft-graph-client');

describe('GraphEmailService', () => {
  it('should send badge notification email', async () => {
    const mockClient = {
      api: jest.fn().mockReturnValue({
        post: jest.fn().mockResolvedValue({ id: 'msg-123' })
      })
    };
    
    const service = new GraphEmailService(mockClient);
    const result = await service.sendBadgeNotification({...});
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
  });
});
```

### Integration Tests (Real API)
**Scope:** Test against real Microsoft Graph API in dev environment

**Setup:**
- Use Microsoft 365 Developer Subscription
- Test tenant with 25 test users
- Dedicated test Teams channel

**Test Cases:**
1. Send email to test user
2. Send Teams notification to test channel
3. Test error handling (invalid recipient)
4. Test rate limiting (burst requests)

### E2E Tests
**Scope:** Test full badge issuance → notification flow

**Scenarios:**
1. Issue badge → Verify email sent + Teams notification
2. Claim badge → Verify notification received
3. Share badge → Verify email sent

**Approach:**
- Use test user accounts from Dev Subscription
- Verify notifications received (check test inbox/Teams)
- Assert on notification content

---

## Security Considerations

### Credential Storage
- **NEVER commit secrets to Git** (.env in .gitignore)
- **Use environment variables** for all sensitive config
- **Rotate Client Secrets** every 90 days (best practice)
- **Principle of Least Privilege:** Request only needed permissions

### Token Security
- **Store tokens in memory only** (no disk persistence)
- **Never log tokens** (redact in logs)
- **Use HTTPS for all API calls** (enforced by Graph API)
- **Validate token expiration** before each use

### Application Permissions Audit
**Requested Permissions:**
- `Mail.Send` - Send emails as application
- `ChannelMessage.Send` - Post to Teams channels
- `TeamsAppInstallation.ReadWriteSelfForUser` - Bot installation
- `User.Read` - Read basic user info

**Justification:**
- All permissions necessary for feature implementation
- No excessive permissions requested
- Admin consent required (security checkpoint)

### Data Privacy
- **No user data stored** (except email in Badge model)
- **Notification content is badge metadata** (not sensitive)
- **Comply with GDPR** (user consent for email notifications)
- **Audit trail:** Log notification events (who, what, when)

---

## Performance Considerations

### Rate Limiting
**Microsoft Graph API Limits:**
- **Mail.Send:** ~1,500 requests per minute per tenant
- **Teams Messages:** ~20 messages per 5 seconds per app
- **Token Acquisition:** ~100 requests per minute per tenant

**Our Implementation:**
- Rate limit to 30 requests/minute (conservative)
- Queue notifications if burst exceeds limit
- Monitor usage via Azure Portal metrics

### Caching Strategy
**Token Caching:**
- In-memory cache (singleton service)
- Cache duration: 55 minutes (token valid for 60 min)
- Proactive refresh 5 min before expiration

**Configuration Caching:**
- Load .env once at startup
- No runtime config reloads (requires restart)

### Latency Optimization
- **Async/await pattern:** Non-blocking I/O
- **Parallel notifications:** Send email + Teams simultaneously
- **Timeout handling:** 10-second timeout per request
- **Connection pooling:** Reuse HTTP connections

---

## Monitoring and Observability

### Metrics to Track
1. **Success Rate:** % of notifications sent successfully
2. **Latency:** P50, P95, P99 for send operations
3. **Error Rate:** % of failed notifications by error type
4. **Retry Rate:** % of notifications that required retry
5. **Token Refresh Rate:** How often tokens are refreshed

### Logging Strategy
**Log Levels:**
- **INFO:** Notification sent successfully (message ID, recipient)
- **WARN:** Retry attempted (attempt #, delay)
- **ERROR:** Failed after retries (error type, details)
- **DEBUG:** Token acquired, API request details

**Log Format:**
```json
{
  "timestamp": "2026-01-29T10:30:45Z",
  "level": "INFO",
  "service": "microsoft-graph",
  "operation": "sendEmail",
  "messageId": "msg-123",
  "recipient": "user@example.com",
  "duration_ms": 234
}
```

### Alerting
**Alert Conditions:**
- Error rate > 5% over 10 minutes
- Token acquisition failures
- Rate limit errors (429) consistently
- Service unavailable (503) for > 5 minutes

---

## Dependencies

### NPM Packages
```json
{
  "@microsoft/microsoft-graph-client": "^3.0.0",
  "@azure/identity": "^4.0.0",
  "adaptive-cards": "^3.0.0"
}
```

### NestJS Modules
- `@nestjs/config` - Environment configuration
- `@nestjs/common` - Dependency injection
- `@nestjs/axios` - HTTP client (fallback)

### External Services
- **Azure AD:** Authentication and authorization
- **Microsoft Graph API:** Email and Teams operations
- **Microsoft 365 Developer Subscription:** Dev/test environment

---

## Alternatives Considered in Detail

### Why Not AWS SES for Email?
- ✅ Cheaper at scale
- ❌ Not integrated with M365 ecosystem
- ❌ Different auth mechanism (AWS IAM vs Azure AD)
- ❌ Inconsistent with Teams integration

### Why Not Twilio SendGrid?
- ✅ Easier to set up
- ❌ Additional cost (~$15/month for 40K emails)
- ❌ Another vendor to manage
- ❌ Not aligned with user's M365 investment

### Why Not Teams Webhooks?
- ✅ Simpler than Graph API (no OAuth)
- ❌ No interactive buttons (Adaptive Cards require Graph API)
- ❌ Webhooks are channel-specific (hard to manage)
- ❌ No sender identity (appears as webhook, not app)

### Why Not Delegated Permissions (User Auth)?
- ✅ More granular permissions
- ❌ Requires user login flow (not suitable for daemon app)
- ❌ Token expires when user session ends
- ❌ Doesn't fit background notification use case

---

## Future Enhancements

### Phase 1 (Sprint 6 - Current)
- ✅ Email sending via Graph API
- ✅ Teams Adaptive Cards with basic actions
- ✅ OAuth 2.0 Client Credentials authentication
- ✅ Error handling and retry logic

### Phase 2 (Post-Sprint 6)
- 📅 **Calendar Integration:** Send calendar invites for credential events
- 📊 **Rich Analytics:** Track email open rates, Teams engagement
- 🔔 **Read Receipts:** Track when users view emails
- 📎 **Attachments:** Attach PDF certificates to emails

### Phase 3 (Future Epics)
- 🔐 **Azure AD SSO:** Single sign-on for G-Credit (Epic 13)
- 📁 **OneDrive Storage:** Store badge PDFs in user's OneDrive
- 📧 **Email Templates Library:** Multiple branded templates
- 🤖 **Teams Bot:** Interactive bot for badge management

### Phase 4 (Advanced Features)
- 📊 **Power BI Integration:** Badge analytics dashboards
- 🔄 **SharePoint Integration:** Badge library in SharePoint
- 📱 **Mobile Push Notifications:** Via Microsoft Intune
- 🌐 **Multi-Tenant Support:** Support multiple customer tenants

---

## Success Criteria

**Sprint 6 Success:**
- ✅ Email notifications sent successfully via Graph API
- ✅ Teams notifications with Adaptive Cards working
- ✅ Zero authentication errors in integration tests
- ✅ Error handling tested (401, 429, 500)
- ✅ Code review passed (security, architecture)
- ✅ Documentation complete (setup guide, API docs)

**Production Readiness:**
- ✅ Migration path documented and tested
- ✅ Security audit passed (no hardcoded secrets)
- ✅ Performance benchmarks met (< 2s latency P95)
- ✅ Monitoring and alerting configured
- ✅ UAT completed by LegendZhu

---
## Validation & Metrics

### Success Metrics

**Performance Metrics:**
- Email delivery success rate: **> 99%**
- Teams notification delivery rate: **> 98%**
- Token acquisition latency: **< 500ms (P95)**
- Graph API call latency: **< 2s (P95)**
- Error rate: **< 1%**

**Quality Metrics:**
- Unit test coverage: **> 80%**
- Integration test pass rate: **100%**
- E2E test pass rate: **100%**
- Security audit score: **A grade**

**Business Metrics:**
- Badge share rate: **> 30%** (recipients share within 7 days)
- Email click-through rate: **> 15%**
- Teams notification engagement: **> 20%**

### Review Schedule

**Initial Review:** 2026-03-15 (6 weeks after Sprint 6 completion)  
**Purpose:** Evaluate metrics, assess production readiness, identify improvements

**Periodic Review:** Quarterly (every 3 months)  
**Review Triggers:**
- Error rate exceeds 5% for 3 consecutive days
- Major security vulnerability discovered
- Microsoft Graph API major version update
- Performance degrades below SLA targets

**Review Checklist:**
- [ ] All success metrics met?
- [ ] Any production incidents?
- [ ] Token management working correctly?
- [ ] Error handling effective?
- [ ] Migration to production tenant tested?
- [ ] Documentation still accurate?

---
## References

### Microsoft Documentation
- [Microsoft Graph API Overview](https://learn.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 Client Credentials Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)
- [Send Mail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Teams Channel Messages API](https://learn.microsoft.com/en-us/graph/api/channel-post-messages)
- [Adaptive Cards Documentation](https://adaptivecards.io/)

### Internal Documentation
- [Sprint 6 Strategy Adjustment Meeting Notes](./sprint-6-strategy-adjustment-meeting-2026-01-29.md)
- [Sprint 6 Kickoff Readiness Checklist](../sprints/sprint-6/kickoff-readiness.md)
- [Epic 7 Definition](../planning/epics.md)

### Related ADRs
- ADR-001: Database Selection (Prisma + PostgreSQL)
- ADR-002: Authentication Strategy (JWT)
- ADR-005: Open Badges Integration Strategy
- ADR-006: Public API Security Pattern

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-29 | 1.0 | Initial creation | Winston |

---

## Update History

| Date | Author | Change | Reason |
|------|--------|--------|--------|
| 2026-01-29 | Winston | Initial draft and acceptance | Sprint 6 Strategy Adjustment Meeting decision |
| 2026-01-29 | Winston | Added Validation & Metrics section | Template compliance (adr-template.md) |
| 2026-01-29 | Winston | Added Update History table | Template compliance (adr-template.md) |

---

**ADR Status:** ✅ Accepted  
**Implementation Target:** Sprint 6 (Stories 7.2, 7.4)  
**Review Status:** Pending LegendZhu approval  
**Next Action:** Amelia implements microsoft-graph module

---

**Author:** Winston (Architect)  
**Reviewers:** LegendZhu (Project Lead), Amelia (Dev), Bob (Scrum Master)  
**Last Updated:** 2026-01-29
