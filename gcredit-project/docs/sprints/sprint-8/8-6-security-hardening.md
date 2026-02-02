# Task 8.6: Security Hardening

**Task ID:** Task 8.6  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Sprint 8  
**Priority:** HIGH  
**Estimated Hours:** 6h  
**Status:** backlog  
**Created:** 2026-02-02

---

## Context

This task consolidates all P1 security technical debt and production security hardening, including:
- Story 0.3 (CSP Headers) from original Sprint 8
- SEC-P1-001~005 from technical-debt-from-reviews.md
- Production-ready security configuration

**Technical Debt Resolution:**
- SEC-P1-001: IDOR in evidence upload
- SEC-P1-002: Missing Helmet middleware
- SEC-P1-003: Overly permissive CORS
- SEC-P1-004: Missing rate limiting
- SEC-P1-005: Dependency vulnerabilities

**Reference:** technical-debt-from-reviews.md, Story 0.3

---

## Objectives

**As a** Security Engineer,  
**I want** production-grade security hardening across the platform,  
**So that** the application is protected against common web vulnerabilities.

---

## Acceptance Criteria

### AC1: Helmet Middleware & CSP Headers (SEC-P1-002, Story 0.3)
**Given** the backend is running  
**When** I check HTTP response headers  
**Then** I see security headers configured:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://graph.microsoft.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Installation:**
```bash
npm install @nestjs/helmet
```

**Implementation:**
```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://graph.microsoft.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
```

### AC2: CORS Configuration (SEC-P1-003)
**Given** the frontend is running  
**When** I make API requests  
**Then** CORS is configured securely:

```typescript
// main.ts
app.enableCors({
  origin: [
    'http://localhost:5173',      // Dev frontend
    'https://gcredit.example.com' // Production frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 3600
});
```

**❌ OLD (Insecure):**
```typescript
app.enableCors({ origin: true }); // Allows ALL origins
```

### AC3: Rate Limiting (SEC-P1-004)
**Given** an attacker attempts brute force  
**When** they make excessive requests  
**Then** rate limiting blocks them:

**Installation:**
```bash
npm install @nestjs/throttler
```

**Configuration:**
```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Time window (seconds)
      limit: 10     // Max requests per ttl
    })
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
```

**Per-Endpoint Overrides:**
```typescript
// auth.controller.ts
@Throttle(5, 60) // 5 attempts per minute for login
@Post('login')
async login(@Body() dto: LoginDto) {...}

@Throttle(3, 300) // 3 attempts per 5 minutes for password reset
@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {...}
```

### AC4: Evidence Upload Authorization Fix (SEC-P1-001)
**Given** I am an ISSUER  
**When** I try to upload evidence to a badge I didn't issue  
**Then** I receive 403 Forbidden:

```typescript
// badge-evidence.controller.ts
@Post(':badgeId/evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ISSUER, Role.ADMIN)
async uploadEvidence(
  @Param('badgeId') badgeId: string,
  @CurrentUser() user: User,
  @UploadedFile() file: Express.Multer.File
) {
  // FIXED: Check badge ownership
  const badge = await this.badgeService.findOne(badgeId);
  if (user.role !== Role.ADMIN && badge.issuedById !== user.id) {
    throw new ForbiddenException('You can only upload evidence for badges you issued');
  }

  return this.evidenceService.uploadEvidence(badgeId, file, user.id);
}
```

**Test Cases:**
- ✅ Issuer uploads to own badge → 200 OK
- ❌ Issuer uploads to another issuer's badge → 403 Forbidden
- ✅ Admin uploads to any badge → 200 OK

### AC5: Dependency Security Updates (SEC-P1-005)
**Given** the project has dependency vulnerabilities  
**When** I run security audit  
**Then** HIGH/CRITICAL vulnerabilities are addressed:

```bash
# Audit
npm audit --audit-level=high

# Note: bcrypt 6.0.0 upgrade deferred to Sprint 9
# Reason: Installation fails on Windows, needs compatibility testing
# Current bcrypt@5.1.1 is secure (no critical vulnerabilities)
# Tracking: Create TD-Sprint9-001

# Fix other updates if needed
npm audit fix
```

**Vulnerability Assessment:**
- `bcrypt@5.1.1` → DEFERRED to Sprint 9 (moderate severity, no critical risk)
- `@aws-sdk/*` → Update if vulnerabilities found (run npm audit to check)
- Focus: Ensure zero HIGH/CRITICAL vulnerabilities (MODERATE acceptable)

**Post-Update:**
- [ ] Re-run `npm audit` → 0 high/critical vulnerabilities
- [ ] Run all tests → 100% pass rate
- [ ] Update `package-lock.json`

---

## Tasks / Subtasks

### Task 1: Helmet & CSP Configuration (AC1) - 1h
- [ ] Install `@nestjs/helmet@^1.1.0`
- [ ] Configure CSP directives in `main.ts`
- [ ] Test with dev frontend (Vite)
- [ ] Test with production build
- [ ] Verify no console CSP violations
- [ ] Write tests (3 tests: headers present, CSP rules, compatibility)

### Task 2: CORS Configuration (AC2) - 0.5h
- [ ] Update `main.ts` with whitelist origins
- [ ] Add environment variable `ALLOWED_ORIGINS`
- [ ] Test cross-origin requests
- [ ] Test preflight OPTIONS requests
- [ ] Write tests (4 tests: allowed origin, blocked origin, credentials, methods)

### Task 3: Rate Limiting (AC3) - 1.5h
- [ ] Install `@nestjs/throttler@^5.0.0`
- [ ] Configure global rate limits (10 req/min)
- [ ] Add custom limits to auth endpoints
  - [ ] Login: 5 req/min
  - [ ] Register: 3 req/hour
  - [ ] Password reset: 3 req/5min
- [ ] Test rate limit behavior (429 status code)
- [ ] Write tests (6 tests: global limit, per-endpoint limits, reset behavior)

### Task 4: Evidence Upload Authorization (AC4) - 1h
- [ ] Update `badge-evidence.controller.ts`
- [ ] Add ownership check in service layer
- [ ] Extract authorization logic to reusable guard (optional)
- [ ] Write unit tests (5 tests: owner success, non-owner fail, admin bypass)
- [ ] Write E2E tests (3 tests)

### Task 5: Dependency Security Audit (AC5) - 2h
- [ ] Run `npm audit` and document vulnerabilities
- [ ] Update `bcrypt` to 6.x
  - [ ] Test password hashing still works
  - [ ] Run auth E2E tests
- [ ] Update `@aws-sdk/*` packages
  - [ ] Test Azure Blob operations
  - [ ] Run evidence upload tests
- [ ] Run `npm audit fix --force`
- [ ] Verify all tests pass after updates
- [ ] Update `package-lock.json`
- [ ] Document changes in version-manifest.md

---

## Testing Strategy

### Security Testing
- [ ] **OWASP ZAP Scan:**
  - [ ] Run baseline scan on dev environment
  - [ ] Fix all HIGH/MEDIUM issues
  
- [ ] **Manual Penetration Testing:**
  - [ ] IDOR attempts (evidence upload, badge access)
  - [ ] CORS bypass attempts
  - [ ] Rate limit bypass attempts
  - [ ] XSS attempts (CSP should block)

### Automated Testing
- [ ] **Unit Tests:** 18 tests (helmet, CORS, rate limiting, authorization)
- [ ] **E2E Tests:** 10 tests (security headers, rate limiting, IDOR)
- [ ] **Total:** 28 tests

---

## Dev Notes

### Security Best Practices Applied
- **Defense in Depth:** Multiple layers (CSP, CORS, rate limiting, authorization)
- **Principle of Least Privilege:** Only authorized users can access resources
- **Secure Defaults:** Restrictive CORS, aggressive CSP

### Environment Variables
```env
# .env.production
ALLOWED_ORIGINS=https://gcredit.example.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=10
```

### Performance Impact
- **Helmet:** Negligible (<1ms overhead)
- **CORS:** No overhead (happens at preflight)
- **Rate Limiting:** ~2ms overhead per request (in-memory store)

---

## Definition of Done

- [ ] All 5 Acceptance Criteria met
- [ ] 28 tests passing (unit + E2E)
- [ ] Helmet headers present on all responses
- [ ] CORS whitelist enforced
- [ ] Rate limiting active on auth endpoints
- [ ] Evidence upload authorization enforced
- [ ] npm audit shows 0 HIGH/CRITICAL vulnerabilities
- [ ] OWASP ZAP scan shows no HIGH issues
- [ ] Code review complete
- [ ] Security hardening documented in README
- [ ] Task notes updated with completion details

---

## Dependencies

**Blocked By:**
- None (can start immediately)

**Blocks:**
- Production deployment (must be done before go-live)

---

## References

- technical-debt-from-reviews.md (SEC-P1-001~005)
- Story 0.3: CSP Headers (original Sprint 8)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Helmet Documentation](https://helmetjs.github.io/)
- [@nestjs/throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
