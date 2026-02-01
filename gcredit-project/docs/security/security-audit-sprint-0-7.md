# Security Audit Report: Sprint 0-7

**Audit Date:** 2026-02-01  
**Auditor:** Winston (AI Security Analyst)  
**Scope:** G-Credit Digital Badge Platform (Backend + Frontend)  
**Classification:** Internal - Confidential

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical (CVSS 9.0+) | 0 | - |
| 🟠 High (CVSS 7.0-8.9) | 5 | Requires immediate attention |
| 🟡 Medium (CVSS 4.0-6.9) | 6 | Track for Sprint 8 |
| 🟢 Low (CVSS 0.1-3.9) | 3 | Tech debt backlog |
| ⚪ Info | 2 | Accepted risk / Enhancement |

**Overall Risk Rating:** **MEDIUM-HIGH**

The G-Credit platform has a solid security foundation with global JWT authentication, RBAC guards, and proper input validation. However, several significant vulnerabilities were discovered that require remediation before production deployment.

### Key Findings Summary

1. **IDOR Vulnerabilities (P0)** - Two endpoints allow users to act on behalf of others
2. **Missing Security Headers** - Helmet not implemented despite documentation
3. **Overly Permissive CORS** - `origin: true` allows all origins
4. **Token Storage** - Tokens stored in localStorage (XSS vulnerable)
5. **Dependency Vulnerabilities** - 22 High severity in backend (AWS SDK, bcrypt)

---

## 1. Dependency Vulnerabilities

### Backend (`npm audit`)

| Total | Critical | High | Moderate | Low |
|-------|----------|------|----------|-----|
| 25 | 0 | 22 | 3 | 0 |

#### High Severity Dependencies

| Package | CVSS | Advisory | Root Cause | Fix Available |
|---------|------|----------|------------|---------------|
| fast-xml-parser | 7.5 | GHSA-37qj-frw5-hhjh | DoS via numeric entities | ✅ Update AWS SDK |
| tar | 8.8 | GHSA-r6q2-hw4h-h46w | Symlink poisoning (via bcrypt) | ✅ bcrypt@6.0.0 |
| tar | 8.2 | GHSA-34x7-hfp2-rc4v | Hardlink path traversal | ✅ bcrypt@6.0.0 |
| @aws-sdk/* (17 pkgs) | 7.5 | Indirect via fast-xml-parser | Transitive dependency | ✅ npm audit fix |

**Root Causes:**
1. `bcrypt@5.x` → `@mapbox/node-pre-gyp` → `tar@<=7.5.6` (3 vulnerabilities)
2. `@aws-sdk/client-sesv2` → `fast-xml-parser` (1 vulnerability cascades to 17 packages)

**Remediation:**
```bash
# Fix bcrypt chain (BREAKING: major version)
npm install bcrypt@6.0.0

# Fix AWS SDK chain
npm update @aws-sdk/client-sesv2
npm audit fix
```

#### Moderate Severity (Risk Accepted)

| Package | CVSS | Advisory | Status |
|---------|------|----------|--------|
| lodash | 6.5 | GHSA-xxjr-mmjv-4gpg | ✅ **ADR-002 Accepted** |

**Reference:** [002-lodash-security-risk-acceptance.md](../decisions/002-lodash-security-risk-acceptance.md)

- Lodash Prototype Pollution via `_.unset` and `_.omit`
- Indirect dependency through `@nestjs/config` and `@nestjs/swagger`
- Fix requires downgrading to incompatible versions
- **Risk accepted for MVP phase** - re-evaluate before production

### Frontend (`npm audit`)

| Total | Critical | High | Moderate | Low |
|-------|----------|------|----------|-----|
| 0 | 0 | 0 | 0 | 0 |

✅ **Frontend dependencies are clean**

---

## 2. OWASP Top 10 Findings

### A01: Broken Access Control 🔴

#### Finding 1: IDOR in Teams Badge Claiming (HIGH)

**Location:** [teams-action.controller.ts](../../backend/src/badge-sharing/controllers/teams-action.controller.ts)

**Vulnerability:** The `claimBadge` endpoint accepts `userId` from the request body instead of extracting it from the authenticated JWT token.

```typescript
// VULNERABLE CODE
@Post('claim-badge')
async claimBadge(@Body() dto: ClaimBadgeActionDto) {
  // dto.userId can be ANY user ID - attacker controlled!
  if (badge.recipientId !== dto.userId) {
    throw new ForbiddenException();
  }
}
```

**Attack Scenario:**
1. Attacker authenticates as User A
2. Attacker discovers User B has an unclaimed badge (badge-123)
3. Attacker sends POST `/api/teams/claim-badge` with `{"badgeId": "badge-123", "userId": "user-b-id"}`
4. Badge is claimed by User B, bypassing proper authorization

**CVSS:** 8.1 (High) - AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N

**Remediation:**
```typescript
@Post('claim-badge')
async claimBadge(@Body() dto: ClaimBadgeActionDto, @CurrentUser() user: User) {
  // Use authenticated user's ID from JWT
  if (badge.recipientId !== user.userId) {
    throw new ForbiddenException();
  }
}
```

---

#### Finding 2: IDOR in Evidence Upload (HIGH)

**Location:** [badge-evidence.controller.ts](../../backend/src/badge-evidence/badge-evidence.controller.ts)

**Vulnerability:** Any ISSUER can upload evidence to ANY badge, not just badges they issued.

```typescript
@Post()
@Roles(UserRole.ADMIN, UserRole.ISSUER)
async uploadEvidence(@Param('badgeId') badgeId: string, ...) {
  // No ownership check - any ISSUER can upload to any badge
  return this.evidenceService.uploadEvidence(badgeId, file, req.user.userId);
}
```

**CVSS:** 7.1 (High) - AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L

**Remediation:** Add ownership verification in `EvidenceService.uploadEvidence()`:
```typescript
if (badge.issuerId !== uploadedBy && userRole !== 'ADMIN') {
  throw new ForbiddenException('Only the badge issuer can upload evidence');
}
```

---

#### Finding 3: Open Registration with Role Assignment (HIGH)

**Location:** [register.dto.ts](../../backend/src/auth/dto/register.dto.ts), [auth.service.ts](../../backend/src/auth/auth.service.ts)

**Vulnerability:** Users can self-assign privileged roles (ADMIN, ISSUER) during registration.

```typescript
// register.dto.ts - Allows role in registration
@IsIn(['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'])
role?: string;

// auth.service.ts - Uses role directly
role: (dto.role as UserRole) || UserRole.EMPLOYEE,
```

**CVSS:** 8.6 (High) - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

**Remediation:** Remove role from RegisterDto. Role assignment should only be allowed by ADMIN users through a separate endpoint.

---

#### Finding 4: Inconsistent DELETE Authorization (MEDIUM)

**Location:** [skills.controller.ts](../../backend/src/skills/skills.controller.ts)

| Resource | DELETE Authorization |
|----------|---------------------|
| Skill Categories | `@Roles(ADMIN)` ✅ |
| Skills | `@Roles(ADMIN, ISSUER)` ⚠️ |

**Risk:** ISSUERs can delete skills that may be linked to badge templates, potentially breaking existing badges.

**CVSS:** 5.3 (Medium)

---

### A02: Cryptographic Failures 🟡

#### Finding 5: Default JWT Secret Fallback (HIGH)

**Location:** [jwt.strategy.ts](../../backend/src/auth/jwt.strategy.ts)

```typescript
secretOrKey: config.get<string>('JWT_SECRET') || 'default-secret',
```

**Risk:** If `JWT_SECRET` environment variable is not set, the application uses a hardcoded, predictable secret that could allow token forgery.

**CVSS:** 8.2 (High) - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

**Remediation:** Fail on startup if JWT_SECRET is missing:
```typescript
const jwtSecret = config.get<string>('JWT_SECRET');
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

#### Finding 6: Password Policy Incomplete (MEDIUM)

**Location:** [register.dto.ts](../../backend/src/auth/dto/register.dto.ts)

Current policy: 8+ chars, uppercase, lowercase, number  
Missing: Special character requirement

**CVSS:** 4.0 (Medium)

**Remediation:**
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
  message: 'Password must contain uppercase, lowercase, number, and special character',
})
```

---

### A03: Injection 🟢

#### SQL Injection: **NOT FOUND** ✅

- All database operations use Prisma ORM with parameterized queries
- Only raw query found: `$queryRaw\`SELECT 1\`` in health check (no user input)

#### XSS: **POTENTIAL RISK** 🟡

**Location:** [BadgeEmbedPage.tsx](../../frontend/src/pages/BadgeEmbedPage.tsx#L157)

```typescript
<div dangerouslySetInnerHTML={{ __html: widgetHtml.html }} />
```

**Analysis:** Widget HTML is generated server-side from database values (badge name, issuer name). Input is validated on creation but not sanitized on output.

**Risk:** If an attacker can inject HTML into badge name during creation, it will be rendered.

**CVSS:** 5.4 (Medium) - Requires authenticated attacker to create malicious badge

**Mitigation:** The server-side widget generator should HTML-escape user content:
```typescript
const escapedName = badge.badgeName.replace(/[<>&"']/g, char => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
}[char]));
```

---

### A04: Insecure Design 🟡

#### Finding 7: Token Storage in localStorage (MEDIUM)

**Location:** Multiple frontend files

```typescript
// Found in 6 files:
localStorage.getItem('accessToken')
```

**Risk:** Tokens stored in localStorage are vulnerable to XSS attacks. Any injected script can steal the token.

**CVSS:** 5.0 (Medium)

**Better Alternatives:**
1. HttpOnly cookies (requires backend changes)
2. Memory-only storage with refresh token in HttpOnly cookie
3. BFF (Backend-For-Frontend) pattern

**Note:** This is a common pattern for SPAs and may be acceptable given other XSS mitigations are in place.

---

### A05: Security Misconfiguration 🔴

#### Finding 8: Missing Helmet Middleware (HIGH)

**Location:** [main.ts](../../backend/src/main.ts)

**Issue:** Helmet is documented in DEPLOYMENT.md but NOT implemented in code.

**Missing Security Headers:**
- `X-Frame-Options` (clickjacking)
- `X-Content-Type-Options` (MIME sniffing)
- `X-XSS-Protection` (XSS filter)
- `Content-Security-Policy` (XSS, injection)
- `Strict-Transport-Security` (HTTPS enforcement)

**CVSS:** 7.5 (High)

**Remediation:**
```bash
npm install helmet
```
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

#### Finding 9: Overly Permissive CORS (HIGH)

**Location:** [main.ts](../../backend/src/main.ts#L62)

```typescript
app.enableCors({
  origin: true, // Allows ALL origins!
  credentials: true,
});
```

**Risk:** Any website can make authenticated requests to the API.

**CVSS:** 7.4 (High)

**Remediation:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://gcredit.company.com',
  ],
  credentials: true,
});
```

---

### A07: Identification and Authentication Failures 🟡

#### Finding 10: Missing Rate Limiting (MEDIUM)

**Location:** [auth.controller.ts](../../backend/src/auth/auth.controller.ts)

```typescript
// TODO: Log failed attempt for rate limiting (Task 2.3.9)
```

**Risk:** Brute force attacks on login, registration, and password reset endpoints.

**CVSS:** 5.3 (Medium)

**Remediation:**
```bash
npm install @nestjs/throttler
```
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 attempts per minute
@Post('login')
async login() { ... }
```

---

## 3. Authentication Security Assessment

### ✅ Strengths

| Control | Implementation | Status |
|---------|----------------|--------|
| JWT Token Auth | `@nestjs/jwt` + `passport-jwt` | ✅ Implemented |
| Password Hashing | bcrypt with 10 salt rounds | ✅ Secure |
| Access Token Expiry | 15 minutes (configurable) | ✅ Good |
| Refresh Token Expiry | 7 days (configurable) | ✅ Good |
| Refresh Token Storage | Database with revocation flag | ✅ Good |
| Password Reset | Cryptographic token, 1-hour expiry, single-use | ✅ Secure |
| Email Enumeration | Same response regardless of email existence | ✅ Protected |

### ⚠️ Weaknesses

| Control | Issue | Priority |
|---------|-------|----------|
| JWT Secret | Falls back to hardcoded default | P0 |
| Rate Limiting | Not implemented | P1 |
| Token Storage | localStorage (XSS vulnerable) | P2 |
| Password Policy | No special character requirement | P2 |
| CSRF | Not implemented (acceptable for JWT in header) | Info |

---

## 4. Authorization Pattern Review

### ✅ Architecture Strengths

1. **Global Guards** - JwtAuthGuard and RolesGuard applied globally via APP_GUARD
2. **Secure by Default** - All routes require authentication unless explicitly marked `@Public()`
3. **RBAC Hierarchy** - 4-tier roles: ADMIN > ISSUER > MANAGER > EMPLOYEE
4. **ADMIN Bypass** - ADMIN has implicit access to all resources
5. **Service-Layer Authorization** - Additional ownership checks in services

### ⚠️ Authorization Issues Found

| Endpoint | Issue | Severity |
|----------|-------|----------|
| POST `/api/teams/claim-badge` | IDOR - userId from body | HIGH |
| POST `/api/badges/:badgeId/evidence` | IDOR - any ISSUER can upload | HIGH |
| POST `/auth/register` | Role self-assignment | HIGH |
| DELETE `/api/skills/:id` | ISSUER can delete (inconsistent with categories) | MEDIUM |
| GET `/api/badges/:id/similar` | No ownership check | LOW |

### Endpoint Authorization Matrix

| Controller | Auth Endpoints | Public Endpoints | Issues |
|------------|----------------|------------------|--------|
| Auth | 8 | 6 (login, register, etc.) | 1 (role assignment) |
| Badges | 12 | 2 (verify, widget) | 2 (IDOR) |
| Skills | 6 | 0 | 1 (inconsistent DELETE) |
| Templates | 6 | 0 | 0 |
| Evidence | 4 | 0 | 1 (IDOR) |
| Widget | 2 | 2 | 0 |

---

## 5. Recommendations

### P0: Critical - Must Fix Before UAT

| # | Issue | Location | Effort | Action |
|---|-------|----------|--------|--------|
| 1 | IDOR in Teams badge claiming | teams-action.controller.ts | 1h | Use @CurrentUser() instead of DTO userId |
| 2 | Role self-assignment on registration | register.dto.ts, auth.service.ts | 1h | Remove role from RegisterDto |
| 3 | JWT secret fallback | jwt.strategy.ts | 15m | Throw error if JWT_SECRET not configured |

### P1: High - Fix in Sprint 8

| # | Issue | Location | Effort | Action |
|---|-------|----------|--------|--------|
| 4 | IDOR in evidence upload | badge-evidence.controller.ts | 1h | Add ownership check in service |
| 5 | Missing Helmet | main.ts | 30m | Install and configure helmet |
| 6 | Overly permissive CORS | main.ts | 30m | Whitelist specific origins |
| 7 | Missing rate limiting | auth endpoints | 2h | Implement @nestjs/throttler |
| 8 | Dependency vulnerabilities | package.json | 2h | Update bcrypt, AWS SDK |

### P2: Medium - Track as Tech Debt

| # | Issue | Location | Effort | Action |
|---|-------|----------|--------|--------|
| 9 | Inconsistent DELETE authorization | skills.controller.ts | 30m | Restrict to ADMIN or add validation |
| 10 | Password policy incomplete | register.dto.ts | 15m | Add special character requirement |
| 11 | Token storage in localStorage | frontend | 4h+ | Consider httpOnly cookie approach |
| 12 | XSS in widget HTML | widget-embed.controller.ts | 1h | HTML-escape user content |

### Risk Acceptance (Documented)

| # | Issue | Justification | Review Date |
|---|-------|---------------|-------------|
| A1 | lodash vulnerability | ADR-002: Moderate severity, dev environment only | Before production |
| A2 | CSRF protection | JWT in Authorization header (not cookie), CSRF risk is minimal | Before production |

---

## 6. Compliance Notes

### Security Standards Alignment

| Standard | Relevant Controls | Status |
|----------|-------------------|--------|
| OWASP Top 10 2021 | A01-A10 | Partial (see findings) |
| NIST 800-53 | AC-2, IA-2, IA-5, SC-8 | Partial |
| SOC 2 Type II | CC6.1-CC6.8 | Not evaluated |

### Recommended Pre-Production Checks

- [ ] Penetration testing by third party
- [ ] Security code review of authentication module
- [ ] Infrastructure security assessment (Azure)
- [ ] API rate limiting stress test
- [ ] Token storage decision (localStorage vs cookies)

---

## 7. Appendix

### A. npm audit Output Summary (Backend)

```
25 vulnerabilities (3 moderate, 22 high)

Packages requiring review:
  bcrypt        5.0.1 - 5.1.1  (HIGH - tar chain)
  @aws-sdk/*    3.894.0+       (HIGH - fast-xml-parser)
  lodash        4.0.0 - 4.17.21 (MODERATE - accepted)
```

### B. Files Reviewed

**Backend:**
- src/main.ts
- src/app.module.ts
- src/auth/*.ts
- src/common/guards/*.ts
- src/common/decorators/*.ts
- src/badges/controllers/*.ts
- src/badge-sharing/controllers/*.ts
- src/badge-evidence/*.ts
- src/skills/*.ts

**Frontend:**
- src/lib/badgesApi.ts
- src/pages/BadgeEmbedPage.tsx
- src/components/BadgeDetailModal/*.tsx
- src/hooks/useWallet.ts

### C. Tools Used

- npm audit (dependency scanning)
- Manual code review (OWASP patterns)
- grep/semantic search (vulnerability patterns)

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-01  
**Next Review:** Before Sprint 8 UAT (2026-02-15)
