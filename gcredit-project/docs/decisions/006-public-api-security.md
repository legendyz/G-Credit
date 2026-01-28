# ADR-006: Public API Security Model

**ADR Number:** 006  
**Title:** Public API Security Model for Badge Verification  
**Date:** 2026-01-28  
**Status:** ✅ Accepted  
**Author(s):** Winston (Architect)  
**Deciders:** LegendZhu (Tech Lead), Winston (Architect)  
**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Related ADRs:** [ADR-005: Open Badges Integration](./005-open-badges-integration.md)

---

## Context

### Problem Statement

Sprint 5 introduces G-Credit's **first public API endpoints** (no authentication required) for badge verification. This creates a fundamental architectural shift from the current security model where **all API routes require JWT authentication**.

**Core Challenge:** Balance **accessibility** (external users must verify badges without G-Credit accounts) with **security** (prevent abuse, data leaks, and attacks).

**Specific Risks:**
1. **DDoS/Resource Exhaustion:** Unauthenticated endpoints vulnerable to flooding
2. **Data Scraping:** Automated tools could harvest all badge data
3. **Privacy Leaks:** Badge metadata might expose sensitive employee information
4. **CORS Exploitation:** Cross-origin requests could be weaponized
5. **Cache Poisoning:** Public cache could serve stale/malicious data

### Background

**Current Security Architecture (Sprint 0-4):**
```typescript
// Global JWT auth guard applied to all routes
app.useGlobalGuards(new JwtAuthGuard());

// All endpoints require valid JWT token
GET /api/badges → 401 Unauthorized (without token)
```

**New Requirements (Sprint 5):**
```typescript
// Public verification endpoints (no auth)
GET /verify/{verificationId} → 200 OK (HTML page)
GET /api/verify/{verificationId} → 200 OK (JSON-LD)
GET /badges/{id}/download/png → 200 OK (PNG file)
```

**Existing Security Measures:**
- JWT-based authentication (`@nestjs/jwt`)
- Role-based access control (RBAC) via `@Roles()` decorator
- Input validation via `class-validator`
- HTTPS enforcement (Azure App Service)
- Azure Application Insights monitoring

**Constraints:**
- Must remain Open Badges 2.0 compliant (public verification required)
- No authentication friction for external verifiers (HR departments, validators)
- Maintain security posture for authenticated routes
- Azure App Service deployment model (no WAF, no Azure Front Door in MVP)

**Stakeholders:**
- External verifiers (HR, recruiters) - need easy access
- Security team - need protection against abuse
- Badge recipients - need privacy protection
- System administrators - need monitoring and control

### Goals

1. **Selective Public Access:** Only verification endpoints public, all others protected
2. **Abuse Prevention:** Rate limiting to prevent DDoS and scraping
3. **Privacy Protection:** No sensitive data in public responses
4. **Auditability:** Log all public API access for security analysis
5. **Performance:** Public endpoints perform under load (1000 req/hr minimum)

---

## Decision

### Solution

Implement **four-layer security model** for public verification API:

#### Layer 1: Selective Authentication Bypass

Create `@Public()` decorator to mark specific routes as unauthenticated:

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Modify JWT auth guard to respect `@Public()`:

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true; // ✅ Skip JWT verification
    }
    
    return super.canActivate(context); // ❌ Require JWT
  }
}
```

**Apply to verification endpoints only:**

```typescript
@Controller('api/verify')
export class VerificationController {
  @Get(':verificationId')
  @Public() // ✅ This route bypasses JWT auth
  async verifyBadge(@Param('verificationId') id: string) {
    return this.verificationService.verifyBadge(id);
  }
}

@Controller('api/badges')
export class BadgesController {
  @Get()
  // ❌ No @Public() decorator - requires JWT
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.badgesService.findAll();
  }
}
```

#### Layer 2: Rate Limiting

Install and configure `@nestjs/throttler` for IP-based rate limiting:

**Installation:**
```bash
npm install @nestjs/throttler@^5.0.0
```

**Global Configuration:**
```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 3600000,  // 1 hour (in milliseconds)
      limit: 1000,   // 1000 requests per hour per IP
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // ✅ Apply globally
    },
  ],
})
export class AppModule {}
```

**Endpoint-Specific Overrides:**
```typescript
@Controller('api/verify')
export class VerificationController {
  @Get(':verificationId')
  @Public()
  @Throttle({ default: { limit: 1000, ttl: 3600000 } }) // 1000/hr
  async verifyBadge(@Param('verificationId') id: string) {
    // Verification logic
  }
  
  @Get(':verificationId/assertion')
  @Public()
  @Throttle({ default: { limit: 500, ttl: 3600000 } }) // 500/hr (stricter)
  async getAssertion(@Param('verificationId') id: string) {
    // JSON-LD assertion
  }
}
```

**Rate Limit Response:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706529600
Retry-After: 3600

{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "ThrottlerException"
}
```

#### Layer 3: CORS Configuration

Configure CORS to allow cross-origin verification while preventing abuse:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ CORS for public API
  app.enableCors({
    origin: '*',  // Allow all origins (Open Badges requirement)
    methods: ['GET', 'HEAD', 'OPTIONS'], // Read-only operations
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,  // No cookies/auth headers needed
    maxAge: 86400,  // Cache preflight for 24 hours
  });
  
  await app.listen(3000);
}
bootstrap();
```

**Verification-Specific CORS:**
```typescript
@Controller('api/verify')
export class VerificationController {
  @Get(':verificationId')
  @Public()
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET')
  @Header('Access-Control-Max-Age', '86400')
  async verifyBadge(@Param('verificationId') id: string) {
    // Verification logic
  }
}
```

#### Layer 4: Data Privacy & Response Sanitization

**Privacy Protection Rules:**

1. **No Email Addresses in Public Responses:**
```typescript
// ❌ BAD: Expose recipient email
{
  "recipient": "john.doe@company.com"
}

// ✅ GOOD: Hash recipient email
{
  "recipient": {
    "type": "email",
    "hashed": true,
    "identity": "sha256$e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "salt": "random-salt-value"
  }
}
```

2. **No Internal IDs or UUIDs:**
```typescript
// ❌ BAD: Expose internal database IDs
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "templateId": "uuid-internal"
}

// ✅ GOOD: Use verification IDs or omit
{
  "verificationId": "public-verification-id",
  "badge": "https://g-credit.com/api/badge-templates/public-template-id"
}
```

3. **Conditional Data Exposure (Privacy Settings):**
```typescript
async verifyBadge(verificationId: string): Promise<VerificationResponse> {
  const badge = await this.prisma.badge.findUnique({
    where: { verificationId },
    include: { recipient: true, template: true }
  });
  
  return {
    badgeName: badge.template.name,
    recipientName: badge.privacy === 'PUBLIC' 
      ? badge.recipient.name 
      : 'Identity Protected', // ✅ Respect privacy
    issuerName: 'G-Credit',
    issuedAt: badge.issuedAt,
    status: badge.status,
    // ❌ Never include: recipient.email, recipient.userId
  };
}
```

4. **Error Message Sanitization:**
```typescript
// ❌ BAD: Leak internal errors
throw new NotFoundException(`Badge not found in table badges_v2 with ID ${id}`);

// ✅ GOOD: Generic error messages
throw new NotFoundException('Badge not found');

// ✅ Internal logging (not in response)
this.logger.error(`Verification failed: badge ${id} not found in database`, {
  verificationId,
  requestIp: request.ip,
  timestamp: new Date()
});
```

#### Layer 5: Monitoring & Alerting

**Application Insights Integration:**

```typescript
// src/verification/verification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TelemetryClient } from 'applicationinsights';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly telemetry = new TelemetryClient();
  
  async verifyBadge(verificationId: string, ip: string) {
    // ✅ Log all verification attempts
    this.telemetry.trackEvent({
      name: 'BadgeVerification',
      properties: {
        verificationId,
        ip,
        timestamp: new Date().toISOString(),
      },
    });
    
    // ✅ Track suspicious patterns
    const recentRequests = await this.getRecentRequestsFromIP(ip);
    if (recentRequests > 100) {
      this.telemetry.trackTrace({
        message: 'Potential abuse detected',
        severity: 2, // Warning
        properties: { ip, requestCount: recentRequests },
      });
    }
    
    // Verification logic...
  }
}
```

**Alert Rules (Azure Application Insights):**

1. **High Rate Limit Hit Rate:**
   - Trigger: >100 429 responses in 5 minutes
   - Action: Email security team

2. **Unusual Traffic Pattern:**
   - Trigger: Single IP makes >500 requests in 10 minutes
   - Action: Log for manual review

3. **Error Spike:**
   - Trigger: >50 verification errors in 1 minute
   - Action: Page on-call engineer

### Rationale

**Why @Public() Decorator (vs. Separate App Instance)?**

1. **Simpler Deployment:** Single NestJS app (not two separate services)
2. **Shared Code:** Verification service can reuse badges service
3. **Easier Maintenance:** One codebase, one deployment pipeline
4. **Cost Efficiency:** One Azure App Service instance
5. **NestJS Best Practice:** Decorator pattern aligns with framework philosophy

**Why IP-Based Rate Limiting (vs. Token-Based)?**

1. **No Auth Required:** Public endpoints can't use API keys/tokens
2. **Simple Implementation:** `@nestjs/throttler` works out-of-box
3. **Effective for MVP:** 1000 req/hr sufficient for expected traffic
4. **Industry Standard:** Same approach used by GitHub API, Twitter API (public endpoints)

**Why 1000 Requests/Hour Limit?**

1. **Legitimate Use Case:** HR verifying 10-20 badges = 20 requests
2. **Buffer for Peaks:** Conference day with 50 badge shares = 200 requests
3. **Scraping Prevention:** 1000 req/hr makes full database scrape impossible (85,000 badges = 85 hours)
4. **Azure App Service Limits:** B1 tier handles 1000 req/hr easily

**Why CORS Allow All Origins (vs. Whitelist)?**

1. **Open Badges Requirement:** Verification must work from any domain
2. **Unknown Platforms:** Can't predict where badges will be shared (LinkedIn, personal sites, etc.)
3. **Read-Only API:** GET requests only, no state modification
4. **No Credentials:** No cookies or auth headers needed

### Alternatives Considered

#### Alternative 1: API Gateway with WAF (Azure Front Door)

- **Description:** Use Azure Front Door as reverse proxy with Web Application Firewall
- **Pros:**
  - Enterprise-grade DDoS protection
  - Geographic traffic management
  - Advanced rate limiting (per-URL, per-header)
  - Bot detection and filtering
- **Cons:**
  - **High Cost:** $35/month base + $0.01/GB traffic (adds $50-100/month)
  - **Complexity:** Requires separate Azure resource, routing rules
  - **Overkill for MVP:** Internal credential system, not public SaaS
  - **Delayed ROI:** Cost not justified until 10,000+ employees
- **Reason for Rejection:** Over-engineering for Sprint 5; revisit at 10K+ users

#### Alternative 2: Separate Public API Subdomain

- **Description:** Deploy public endpoints to `verify.g-credit.com`, main API at `api.g-credit.com`
- **Pros:**
  - Physical network separation
  - Independent scaling for public traffic
  - Easier to apply different security policies
  - Clear architectural boundary
- **Cons:**
  - **Two App Services:** Doubles hosting cost ($30/month → $60/month)
  - **Code Duplication:** Verification service must be duplicated or extracted to library
  - **Complex Deployment:** Two deployment pipelines, two CI/CD configs
  - **Database Sharing:** Still queries same PostgreSQL (not true isolation)
- **Reason for Rejection:** Cost and complexity not justified for 5% of API traffic

#### Alternative 3: API Key for Third-Party Platforms

- **Description:** Issue API keys to Credly, Badgr, validators for programmatic access
- **Pros:**
  - Better tracking of platform-specific traffic
  - Can revoke abusive platforms
  - Higher rate limits for trusted platforms
- **Cons:**
  - **Breaks Public Verification:** Individuals can't verify badges in resumes
  - **Onboarding Friction:** Every platform needs manual API key issuance
  - **Not Open Badges Compliant:** Specification requires public verification
  - **Support Burden:** Managing API keys, documenting usage
- **Reason for Rejection:** Violates core requirement of public accessibility

#### Alternative 4: OAuth2 with Public Client

- **Description:** Use OAuth2 Device Code flow for temporary access tokens
- **Pros:**
  - More granular access control
  - Can track individual verifiers
  - Revocable tokens
- **Cons:**
  - **User Friction:** Multi-step auth flow to verify one badge
  - **Not Open Badges Standard:** Specification expects simple HTTPS GET
  - **Poor UX:** HR manager verifying resume badge shouldn't need OAuth
  - **Mobile Incompatibility:** Device code flow clunky on mobile
- **Reason for Rejection:** Too much friction for simple verification use case

---

## Consequences

### Positive Consequences

1. **Open Badges Compliance:**
   - Meets IMS Global "hosted verification" requirement
   - No authentication friction for external verifiers
   - Badges validate on Open Badges Validator

2. **Security Maintained:**
   - Only 3 endpoints public (all others JWT-protected)
   - Rate limiting prevents DDoS and scraping
   - No sensitive data exposed (emails hashed, privacy settings respected)

3. **Developer Experience:**
   - `@Public()` decorator simple to use and understand
   - Rate limiting transparent (no code changes needed)
   - CORS configuration centralized

4. **Operational Simplicity:**
   - Single application deployment (not two separate services)
   - Existing Azure Application Insights monitoring works
   - No new infrastructure required (no WAF, no separate subdomain)

5. **Cost Efficiency:**
   - No additional Azure resources ($0 incremental cost)
   - App Service B1 tier sufficient for 1000 req/hr
   - Rate limiting prevents resource exhaustion

### Negative Consequences

1. **Increased Attack Surface:**
   - New unauthenticated endpoints vulnerable to attacks
   - **Mitigation:** Rate limiting, monitoring, security logging
   - **Acceptance:** Risk acceptable for Open Badges compliance

2. **Rate Limiting False Positives:**
   - Legitimate users behind corporate NAT may share IP (hit limit faster)
   - **Mitigation:** Monitor 429 error rates, adjust limits if needed
   - **Future:** Implement CAPTCHA for 429 responses (Epic 7)

3. **No Geographic Rate Limiting:**
   - Can't block traffic from specific countries/regions
   - **Mitigation:** Azure Application Insights tracks geographic data
   - **Future:** Add Azure Front Door if abuse from specific regions

4. **CORS Wildcard Security:**
   - `origin: '*'` allows any website to call API
   - **Mitigation:** Read-only endpoints, no state modification
   - **Acceptance:** Required for Open Badges compliance

5. **Privacy Relies on Application Logic:**
   - No database-level privacy enforcement (just `privacy` enum)
   - **Mitigation:** Integration tests verify privacy rules
   - **Risk:** Developer could accidentally expose email in new endpoint

### Risks

#### Risk 1: Credential Stuffing Attacks

- **Description:** Attackers try to enumerate valid verificationIds
- **Probability:** Medium (verificationIds are UUIDs, hard to guess)
- **Impact:** Low (no sensitive data even if found)
- **Mitigation:**
  - Use UUIDv4 (2^122 possible values, unguessable)
  - Rate limiting prevents brute-force enumeration
  - Log suspicious sequential ID requests

#### Risk 2: DDoS Bypass via Distributed IPs

- **Description:** Attacker uses botnet to bypass per-IP rate limiting
- **Probability:** Low (requires significant resources)
- **Impact:** High (could overwhelm App Service)
- **Mitigation:**
  - Azure App Service auto-scaling (up to 10 instances)
  - Application Insights alerts on traffic spikes
  - Manual IP blocking in Azure App Service (if detected)
  - **Escalation:** Add Azure Front Door if attack sustained

#### Risk 3: Cache Poisoning

- **Description:** Attacker tricks CDN/cache to serve malicious responses
- **Probability:** Very Low (no CDN in MVP architecture)
- **Impact:** Medium (could serve incorrect badge status)
- **Mitigation:**
  - Correct `Cache-Control` headers (see ADR-007)
  - No intermediary caches in MVP (direct App Service access)
  - **Future:** If CDN added, implement signed URLs

#### Risk 4: Privacy Regulation Violations (GDPR)

- **Description:** Public API exposes personal data without consent
- **Probability:** Low (email hashed, privacy settings enforced)
- **Impact:** High (legal penalties, reputation damage)
- **Mitigation:**
  - All recipient emails hashed (SHA-256 + salt)
  - Privacy enum respected (`PUBLIC` vs. `PRIVATE`)
  - Data minimization (only necessary fields in response)
  - Audit log for all verifications (GDPR Article 30)

---

## Implementation

### Changes Required

#### Backend (NestJS)

- [ ] **Public Decorator**
  - [ ] Create `src/common/decorators/public.decorator.ts`
  - [ ] Modify `src/common/guards/jwt-auth.guard.ts`
  - [ ] Add unit tests for guard logic

- [ ] **Rate Limiting**
  - [ ] Install `@nestjs/throttler@^5.0.0`
  - [ ] Configure `ThrottlerModule` in `app.module.ts`
  - [ ] Apply `ThrottlerGuard` globally
  - [ ] Add endpoint-specific `@Throttle()` decorators

- [ ] **CORS Configuration**
  - [ ] Update `main.ts` with CORS settings
  - [ ] Add verification-specific CORS headers

- [ ] **Privacy Sanitization**
  - [ ] Create `sanitizeVerificationResponse()` utility
  - [ ] Implement email hashing in verification service
  - [ ] Add privacy checks to all public endpoints

- [ ] **Monitoring & Logging**
  - [ ] Add Application Insights event tracking
  - [ ] Implement IP-based request counting
  - [ ] Create alert rules for suspicious patterns

#### Testing

- [ ] **Unit Tests (10 tests)**
  - [ ] `@Public()` decorator applied correctly
  - [ ] JWT guard skips public routes
  - [ ] Rate limiting enforced per IP
  - [ ] Privacy sanitization removes sensitive data
  - [ ] Email hashing produces consistent results

- [ ] **E2E Tests (8 tests)**
  - [ ] Public route accessible without token
  - [ ] Authenticated route returns 401 without token
  - [ ] Rate limit returns 429 after 1000 requests
  - [ ] CORS headers present in response
  - [ ] No email addresses in public API response

- [ ] **Security Tests (5 tests)**
  - [ ] SQL injection attempts fail
  - [ ] XSS payloads sanitized
  - [ ] Brute-force verificationId enumeration blocked
  - [ ] Large payload requests rejected

#### Documentation

- [ ] **Developer Guides**
  - [ ] Document `@Public()` decorator usage
  - [ ] Rate limiting configuration guide
  - [ ] CORS troubleshooting guide
  - [ ] Security best practices for public endpoints

- [ ] **Operational Runbooks**
  - [ ] How to adjust rate limits
  - [ ] How to block abusive IPs
  - [ ] How to investigate traffic anomalies
  - [ ] Incident response for API abuse

### Migration Path

**Phase 1: Deploy @Public() Decorator (Sprint 5 Day 1)**

1. Create and test `@Public()` decorator in local environment
2. Modify JWT guard to respect decorator
3. Unit test guard behavior (public vs. authenticated routes)
4. Deploy to staging for validation

**Phase 2: Enable Rate Limiting (Sprint 5 Day 2)**

1. Install `@nestjs/throttler` package
2. Configure global rate limiting (1000 req/hr)
3. Test rate limit enforcement locally
4. Deploy to staging
5. Monitor 429 response rates for 24 hours

**Phase 3: CORS Configuration (Sprint 5 Day 3)**

1. Update `main.ts` with CORS settings
2. Test cross-origin requests from test domain
3. Validate with CORS testing tools
4. Deploy to staging

**Phase 4: Privacy Sanitization (Sprint 5 Day 4)**

1. Implement email hashing in verification service
2. Add privacy checks to public endpoints
3. Create integration tests for privacy rules
4. Code review for accidental data leaks
5. Deploy to staging

**Phase 5: Production Deployment (Sprint 5 Day 7)**

1. Final security audit of all public endpoints
2. Deploy to production during low-traffic window
3. Monitor Application Insights for 1 hour post-deployment
4. Test verification URLs from external network
5. Document any issues in retrospective

### Rollback Plan

If severe security issue discovered post-deployment:

1. **Immediate:** Disable public routes via feature flag
```typescript
if (process.env.PUBLIC_API_ENABLED !== 'true') {
  throw new ForbiddenException('Public API temporarily disabled');
}
```

2. **Short-term:** Revert deployment to previous version (Sprint 4 state)

3. **Fix:** Address security issue in hotfix branch

4. **Re-deploy:** After security review approval

---

## References

### Security Standards

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) - API security best practices
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html) - DDoS prevention
- [W3C CORS Specification](https://www.w3.org/TR/cors/) - Cross-origin resource sharing

### NestJS Documentation

- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication) - Framework security
- [NestJS Rate Limiting](https://docs.nestjs.com/security/rate-limiting) - Throttler module
- [NestJS Guards](https://docs.nestjs.com/guards) - Authentication guards

### Related ADRs

- [ADR-005: Open Badges Integration](./005-open-badges-integration.md) - Why public API needed
- [ADR-007: Baked Badge Storage](./007-baked-badge-storage.md) - Cache strategy for public assets

### Internal Documents

- [Sprint 5 Backlog](../sprints/sprint-5/backlog.md) - Public API security configuration guide
- [Security Notes](../security/security-notes.md) - Security policies
- [Infrastructure Inventory](../setup/infrastructure-inventory.md) - Azure resources

---

**Decision Status:** ✅ **ACCEPTED**  
**Implementation Sprint:** Sprint 5 (2026-01-29 to 2026-02-07)  
**Security Review:** Required before production deployment  
**Review Date:** 2026-02-07 (Sprint 5 Retrospective)  
**Last Updated:** 2026-01-28  
**Document Owner:** Winston (Architect)
