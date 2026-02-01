# Architecture Review Retrospective: Sprint 1-2

**Document Type:** Post-Implementation Architecture Review  
**Review Date:** 2026-02-01  
**Reviewer:** Winston (System Architect Agent)  
**Sprints Covered:** Sprint 1 (JWT Auth) + Sprint 2 (Badge Templates)  
**Status:** UAT Pre-Readiness Assessment

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Issues Found** | 9 |
| **P0 (UAT Blockers)** | 2 |
| **P1 (Sprint 8 Backlog)** | 4 |
| **P2 (Future Improvements)** | 3 |

### Risk Assessment
⚠️ **Moderate Risk** - Two P0 issues require immediate attention before UAT. Overall architecture is sound but has authorization and security gaps that could expose sensitive endpoints.

---

## Sprint 1 Findings (JWT Authentication & User Management)

### Issue 1.1: Missing Token Rotation on Refresh
**Severity:** P1 (Sprint 8 Backlog)  
**Location:** [auth.service.ts](../../../backend/src/modules/auth/auth.service.ts#L234-L280)

**Description:**  
The `refreshAccessToken()` method generates a new access token but does **not** rotate the refresh token. This means the same refresh token can be reused indefinitely until expiration (7 days), increasing the attack window if a token is compromised.

**Current Behavior:**
```typescript
// Only generates new access token, reuses existing refresh token
const accessToken = this.jwtService.sign(newPayload);
return { accessToken };
```

**Recommendation:**
Implement refresh token rotation:
1. Generate new refresh token on each refresh
2. Invalidate the old refresh token (mark `isRevoked = true`)
3. Return both new tokens to client
4. Consider implementing a grace period (e.g., 30s) for concurrent requests

**References:**
- OWASP Token Security Guidelines
- RFC 6749 Section 10.4 (Refresh Token Rotation)

---

### Issue 1.2: Register Endpoint Allows Role Assignment
**Severity:** P0 (UAT BLOCKER)  
**Location:** [auth.service.ts](../../../backend/src/modules/auth/auth.service.ts#L44-L47)

**Description:**  
The `/auth/register` endpoint accepts a `role` parameter and directly assigns it to new users. This is a **critical privilege escalation vulnerability** - anyone can register as ADMIN.

**Current Behavior:**
```typescript
role: (dto.role as UserRole) || UserRole.EMPLOYEE,
```

**Attack Vector:**
```bash
curl -X POST /auth/register \
  -d '{"email":"attacker@evil.com","password":"xxx","role":"ADMIN"}'
```

**Immediate Fix Required:**
1. Remove `role` field from `RegisterDto`
2. Always default new registrations to `EMPLOYEE`
3. Only allow role changes via admin-only endpoints

**Impact:** Any user can gain admin access to the system.

---

### Issue 1.3: No Rate Limiting on Auth Endpoints
**Severity:** P1 (Sprint 8 Backlog)  
**Location:** [auth.controller.ts](../../../backend/src/modules/auth/auth.controller.ts)

**Description:**  
Authentication endpoints (`/login`, `/register`, `/request-reset`) have no rate limiting. This exposes the system to:
- Brute force attacks on passwords
- Credential stuffing attacks
- Account enumeration via timing attacks

**Recommendation:**
1. Install `@nestjs/throttler` module
2. Apply rate limits:
   - `/login`: 5 attempts per 15 minutes per IP
   - `/register`: 3 accounts per hour per IP
   - `/request-reset`: 3 requests per hour per email

---

### Issue 1.4: JWT Secret Fallback to Hardcoded Value
**Severity:** P1 (Sprint 8 Backlog)  
**Location:** [jwt.strategy.ts](../../../backend/src/modules/auth/strategies/jwt.strategy.ts#L17)

**Description:**  
JWT strategy has a fallback to `'default-secret'` if `JWT_SECRET` env var is missing. In production, this could lead to:
- Predictable token signatures
- Token forgery attacks

**Current Behavior:**
```typescript
secretOrKey: config.get<string>('JWT_SECRET') || 'default-secret',
```

**Recommendation:**
1. Throw startup error if `JWT_SECRET` is not set
2. Require minimum secret length (32 characters)
3. Add environment validation in `main.ts`

---

### Issue 1.5: Insufficient Password Validation
**Severity:** P2 (Future Improvement)  
**Location:** [register.dto.ts, reset-password.dto.ts]

**Description:**  
Password validation appears to rely only on DTO decorators. Should verify:
- Minimum length (8+ characters)
- Complexity requirements (uppercase, lowercase, number, special char)
- Not matching email
- Not in common password lists

**Recommendation:**
Add comprehensive password validation service or use `zxcvbn` library for password strength checking.

---

## Sprint 2 Findings (Badge Template Management)

### Issue 2.1: Public GET Endpoints Lack Authorization Check for Draft Templates
**Severity:** P0 (UAT BLOCKER)  
**Location:** [badge-templates.controller.ts](../../../backend/src/badge-templates/badge-templates.controller.ts#L46-L59)

**Description:**  
While `findAll()` correctly filters to `ACTIVE` only, the `findOne()` endpoint at `GET /badge-templates/:id` has **no authorization check** and no `@Public()` decorator inconsistency.

Analysis of current state:
- `GET /badge-templates` - Public, filters ACTIVE only ✅
- `GET /badge-templates/all` - Requires ADMIN/ISSUER ✅
- `GET /badge-templates/:id` - **No @Public(), No @Roles(), inherits global JwtAuthGuard**

**Problem:** The `findOne()` method doesn't check if template status is ACTIVE. An authenticated user (even EMPLOYEE) can view DRAFT and ARCHIVED templates by guessing IDs.

**Current Behavior (Line 120-128):**
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get a single badge template by ID' })
async findOne(@Param('id') id: string) {
  return this.badgeTemplatesService.findOne(id);  // No status check!
}
```

**Recommendation:**
1. For public access: Add `@Public()` decorator AND filter `status = ACTIVE` in service
2. For admin access: Keep auth required but add role check for non-ACTIVE templates

---

### Issue 2.2: N+1 Query Pattern in findOne
**Severity:** P2 (Future Improvement)  
**Location:** [badge-templates.service.ts](../../../backend/src/badge-templates/badge-templates.service.ts#L170-L210)

**Description:**  
The `findOne()` method executes two separate queries:
1. `findUnique()` for the template
2. `findMany()` for skills if `skillIds` exists

**Current Pattern:**
```typescript
const badgeTemplate = await this.prisma.badgeTemplate.findUnique({...});
// ...
if (badgeTemplate.skillIds && badgeTemplate.skillIds.length > 0) {
  skills = await this.prisma.skill.findMany({...});  // Second query
}
```

**Impact:** Low for single template fetches, but this pattern in list views would cause N+1 problems.

**Recommendation:**
Consider a single query with raw SQL join if skills are frequently needed, or add caching for skill data.

---

### Issue 2.3: No Ownership Check on Template Update/Delete
**Severity:** P1 (Sprint 8 Backlog)  
**Location:** [badge-templates.controller.ts](../../../backend/src/badge-templates/badge-templates.controller.ts#L203-L280)

**Description:**  
`PATCH /badge-templates/:id` and `DELETE /badge-templates/:id` only check for `ADMIN` or `ISSUER` role, but don't verify if the current user is the template creator or an admin.

**Current State:**
- `PATCH`: Allows ADMIN/ISSUER to update ANY template
- `DELETE`: Requires ADMIN only (good), but ISSUER should be able to delete their own

**Recommendation:**
1. ISSUER can only update/delete templates where `createdBy === userId`
2. ADMIN can update/delete any template
3. Add ownership check in service layer

---

### Issue 2.4: Badge Template Index Coverage
**Severity:** P2 (Future Improvement)  
**Location:** [schema.prisma](../../../backend/prisma/schema.prisma#L100-L108)

**Description:**  
Current indexes are good but missing potential query patterns:

**Existing Indexes:**
```prisma
@@index([category])
@@index([status])
@@index([createdAt])
@@index([createdBy])
@@index([category, status])     // ✅ Good composite
@@index([status, createdAt])    // ✅ Good composite
```

**Missing Index:**
- `@@index([name])` - For search by name (case-insensitive search may not use this, but partial matches would benefit)
- Consider full-text search index if PostgreSQL for better name/description search

**Note:** Current indexes are adequate for MVP. Monitor query performance in production.

---

## Recommendations Summary

### Immediate Fixes (P0 - Before UAT)

| ID | Issue | Fix | Effort |
|----|-------|-----|--------|
| 1.2 | Role Assignment on Register | Remove `role` from RegisterDto, hardcode EMPLOYEE | 30 min |
| 2.1 | Draft Template Exposure | Add status check in `findOne()` or add proper @Public + filter | 1 hour |

### Sprint 8 Backlog (P1)

| ID | Issue | User Story | Effort |
|----|-------|-----------|--------|
| 1.1 | Token Rotation | "As security admin, I want refresh tokens rotated on each use" | 3 hours |
| 1.3 | Rate Limiting | "As security admin, I want auth endpoints rate-limited" | 4 hours |
| 1.4 | JWT Secret Validation | "As DevOps, I want app to fail fast if JWT_SECRET missing" | 1 hour |
| 2.3 | Ownership Check | "As issuer, I can only modify my own templates" | 2 hours |

### Future Improvements (P2)

| ID | Issue | Notes |
|----|-------|-------|
| 1.5 | Password Validation | Add after security audit, low user impact for internal tool |
| 2.2 | N+1 Query | Monitor performance, optimize if needed |
| 2.4 | Index Coverage | Add if search becomes slow |

---

## Architecture Validation Checklist

### JWT Authentication (Sprint 1)

| Check | Status | Notes |
|-------|--------|-------|
| JWT token generation | ✅ Pass | Using @nestjs/jwt with proper payload |
| Token validation | ✅ Pass | JwtStrategy validates signature and expiry |
| Refresh token storage | ✅ Pass | Database-backed with revocation support |
| Refresh token rotation | ⚠️ Missing | Not implemented - P1 |
| Password hashing | ✅ Pass | bcrypt with 10 rounds |
| Role included in token | ✅ Pass | Payload includes role for RBAC |
| Token blacklisting | ✅ Pass | `isRevoked` flag in RefreshToken table |

### RBAC Implementation (Sprint 1)

| Check | Status | Notes |
|-------|--------|-------|
| Global JwtAuthGuard | ✅ Pass | Applied via APP_GUARD in AppModule |
| Global RolesGuard | ✅ Pass | Applied via APP_GUARD in AppModule |
| @Roles decorator | ✅ Pass | Properly checks against user.role |
| ADMIN bypass | ✅ Pass | ADMIN has access to all endpoints |
| Public endpoint support | ✅ Pass | @Public() decorator excludes from auth |
| Role hierarchy | ⚠️ Partial | Only ADMIN bypass, no MANAGER > EMPLOYEE |

### Badge Template Architecture (Sprint 2)

| Check | Status | Notes |
|-------|--------|-------|
| CRUD endpoints | ✅ Pass | All basic operations implemented |
| Role-based access | ⚠️ Partial | Missing ownership checks - P1 |
| Azure Blob integration | ✅ Pass | BlobStorageService properly implemented |
| Image validation | ✅ Pass | Size, format, dimension checks |
| Skill validation | ✅ Pass | Validates skillIds exist before create |
| Pagination | ✅ Pass | Offset-based with meta info |
| Filtering | ✅ Pass | Status, category, skill, search support |
| Status transitions | ✅ Pass | DRAFT → ACTIVE → ARCHIVED |

### Data Model (Prisma Schema)

| Check | Status | Notes |
|-------|--------|-------|
| User model | ✅ Pass | All required fields, proper indexes |
| RefreshToken model | ✅ Pass | Cascade delete, proper indexes |
| BadgeTemplate model | ✅ Pass | Good structure, adequate indexes |
| Foreign key constraints | ✅ Pass | Proper relations defined |
| Audit fields | ✅ Pass | createdAt/updatedAt on all models |
| Soft delete support | ✅ Pass | status field for templates, isRevoked for tokens |

### Security Best Practices

| Check | Status | Notes |
|-------|--------|-------|
| SQL injection prevention | ✅ Pass | Prisma ORM parameterizes queries |
| XSS prevention | ✅ Pass | NestJS default sanitization |
| CSRF protection | ⚠️ N/A | Token-based auth, no cookies |
| Rate limiting | ❌ Missing | Not implemented - P1 |
| Environment variable validation | ❌ Missing | Allows default secrets - P1 |
| Sensitive data logging | ⚠️ Partial | Some console.log with user data |

---

## Conclusion

The Sprint 1-2 implementation demonstrates solid foundational architecture with proper use of NestJS patterns, Prisma ORM, and Azure integration. However, **two P0 issues must be resolved before UAT**:

1. **Critical Security Gap:** Remove role parameter from registration endpoint
2. **Data Exposure:** Add status filtering to single template endpoint

The remaining P1 items should be prioritized for Sprint 8 to strengthen security posture before production deployment.

---

*Document generated by Winston (Architect Agent) on 2026-02-01*
