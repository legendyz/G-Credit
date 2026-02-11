# Security Audit Report — G-Credit v1.0.0

**Date:** 2026-02-11
**Auditor:** Developer Agent (Amelia)
**Scope:** Post-MVP Security Audit (Audit Plan §5)
**Status:** Complete
**Classification:** P0 — Pre-production blocking audit

---

## Executive Summary

G-Credit v1.0.0 has a **solid security foundation**: global JWT + RBAC guards, parameterized queries (no raw SQL), startup secret validation, Helmet headers, CORS whitelist, rate limiting, CSRF-safe API design, and IDOR protection on sensitive endpoints. However, **several gaps require remediation** before pilot/production deployment.

### Risk Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **HIGH** | 2 | Token storage in localStorage; no account lockout |
| **MEDIUM** | 3 | File upload mimetype bypass; issuer email PII leak; sanitize-html inconsistency |
| **LOW** | 4 | PII in logs; Swagger exposed in prod; lodash vuln; no custom exception filter |
| **INFO** | 2 | Assertion public by design; widget name exposure acceptable |

---

## 5.1 OWASP Top 10 Assessment

| # | Vulnerability | Status | Finding |
|---|--------------|--------|---------|
| A01 | Broken Access Control | ✅ PASS | Global `JwtAuthGuard` + `RolesGuard` via `APP_GUARD`. IDOR checks on badges, bulk sessions, evidence. ADMIN bypasses role checks by design. |
| A02 | Cryptographic Failures | ✅ PASS | JWT_SECRET validated ≥32 chars at startup. Weak/default values rejected. bcrypt (10 rounds) for passwords. Refresh token rotation with DB-backed revocation. |
| A03 | Injection | ✅ PASS | Prisma ORM only — parameterized queries. 3 raw SQL calls are all `SELECT 1` health checks with zero user input. CSV injection prevention strips `= + - @ \t \r` prefixes. |
| A04 | Insecure Design | ⚠️ PARTIAL | Registration correctly blocks role assignment (always `EMPLOYEE`). Employee cannot revoke own badge. However: no account lockout after failed logins. |
| A05 | Security Misconfiguration | ⚠️ PARTIAL | Helmet configured with strict CSP, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`. CORS whitelist rejects `*`. **But:** Swagger at `/api-docs` accessible without auth in all environments. |
| A06 | Vulnerable Components | ⚠️ PARTIAL | See §5.6 below — lodash prototype pollution (moderate), brace-expansion DoS (high), axios DoS (high). |
| A07 | Auth Failures | ⚠️ PARTIAL | Per-endpoint `@Throttle` on auth routes (login: 5/min, register: 3/hr). But no application-level brute-force protection (failed attempt counting, account lockout). |
| A08 | Data Integrity | ✅ PASS | Badge assertions use SHA-256 integrity hash. Revocation status checked on verification. Badge baking uses PNG metadata embedding. |
| A09 | Logging Failures | ⚠️ PARTIAL | `[AUDIT]` tagged logs for register, login, logout, password reset, token rotation. AuditLog/UserAuditLog/UserRoleAuditLog tables in DB. **Gap:** No centralized audit service — inline logging in services. |
| A10 | SSRF | ✅ PASS | No server-side URL fetching from user input. Azure Blob URLs constructed from config, not user-supplied. Image URLs stored as metadata only. |

---

## 5.2 Authentication Security

| Check | Status | Detail |
|-------|--------|--------|
| JWT secret ≥256 bits | ✅ | `validateJwtSecret()` in `main.ts` L14-72 — blocks startup if <32 chars or weak value |
| Refresh token rotation | ✅ | Implemented (ARCH-P1-001). Old token revoked, new issued on each refresh. Reuse of revoked token logged as `[SECURITY]` |
| Token revocation | ✅ | Stored in DB with `isRevoked` flag. Checked on every refresh attempt |
| Password reset single-use | ✅ | `resetToken.used` checked, then atomically set `used: true` in Prisma `$transaction` |
| Password reset expiry | ✅ | 1-hour TTL (`Date.now() + 60 * 60 * 1000`) |
| Email enumeration prevention | ✅ | `requestPasswordReset()` returns same response regardless of email existence |
| Registration role escalation | ✅ | DTO has no `role` field — all new users get `EMPLOYEE`. SEC-HIGH-003 fix verified. |
| **Brute force / account lockout** | ❌ MISSING | Comment in `auth.service.ts` L87: "Rate limiting deferred to Phase 2". Failed login is logged but no attempt counter, no lockout. HTTP-level `@Throttle(5/min)` exists but is per-IP, not per-account. |

### Finding SEC-001: No Account Lockout (HIGH)

**Risk:** An attacker can attempt 5 passwords/minute indefinitely against a known email. With distributed IPs, the ThrottlerGuard is bypassed entirely.

**Recommendation:** Implement failed attempt counter per email. Lock account after 5 consecutive failures for 15 minutes. Log lockout events. Can be done in `auth.service.ts` login flow with a DB field `failedAttempts` + `lockedUntil` on User model.

---

## 5.3 Authorization Security

| Check | Status | Detail |
|-------|--------|--------|
| Every endpoint has guards | ✅ | `JwtAuthGuard` + `RolesGuard` + `ThrottlerGuard` registered globally via `APP_GUARD` |
| IDOR — badge access | ✅ | `GET /api/badges/:id` checks `recipientId` or `issuerId` match. Returns 404 (not 403) to prevent existence leak |
| IDOR — bulk issuance sessions | ✅ | `loadSession()` validates `session.issuerId === currentUserId`. Logs IDOR attempts. UUIDs used (not sequential) |
| IDOR — evidence download | ✅ | Ownership check: `badge.recipientId === userId` or `ADMIN`. SAS tokens 5-min read-only |
| Admin endpoints restricted | ✅ | `admin-users.controller` and `m365-sync.controller` use class-level `@Roles(ADMIN)` |
| Bulk issuance ownership | ✅ | Per-session validation in all methods (`getPreviewData`, `confirmBulkIssuance`, `getErrorReportCsv`) |

### Public Endpoints Inventory

All `@Public()` routes verified intentionally public:

| Endpoint | Purpose | Risk Assessment |
|----------|---------|----------------|
| `GET /health`, `GET /ready` | Health probes | ✅ Safe — no internal details exposed |
| `POST /api/auth/register` | Registration | ✅ Throttled (3/hr), no role assignment |
| `POST /api/auth/login` | Login | ⚠️ Throttled (5/min) but no account lockout |
| `POST /api/auth/request-reset` | Password reset | ✅ No email enumeration |
| `POST /api/auth/reset-password` | Reset with token | ✅ Single-use, 1hr expiry |
| `POST /api/auth/refresh` | Token refresh | ✅ Rotation implemented |
| `POST /api/auth/logout` | Logout | ✅ Token revocation |
| `GET /api/verify/:verificationId` | Badge verification | ⚠️ PII exposure (see SEC-003) |
| `POST /api/badges/:id/claim` | Claim badge | ✅ Requires valid claimToken |
| `GET /api/badges/:id/assertion` | Open Badges 2.0 | ℹ️ By design — see note below |
| `GET /api/badges/:id/integrity` | Integrity check | ✅ Hash verification only |
| `GET /api/badges/:badgeId/embed` | Widget data | ✅ Minimal data, CLAIMED only |
| `GET /api/badge-templates/criteria-templates` | Criteria list | ✅ Static data |

**Note on assertion endpoint:** `GET /api/badges/:id/assertion` returns full assertion JSON for any valid badge UUID. This is **intentional for Open Badges 2.0 hosted verification** (spec requires public accessibility). Badge UUIDs are random (v4 UUID), making enumeration infeasible. Accepted risk.

---

## 5.4 Data Security

| Check | Status | Detail |
|-------|--------|--------|
| No secrets in source code | ✅ | All credentials loaded from env via `ConfigService`. No hardcoded API keys, passwords, or tokens in `.ts` files. |
| `.env` in `.gitignore` | ✅ | Confirmed at `.gitignore` L42. Also ignores `.env.development.local`, `.env.production.local`, etc. |
| DB connection SSL | ⚠️ VERIFY | Not auditable from code — depends on `DATABASE_URL` in `.env`. Ensure `?sslmode=require` in production connection string. |
| Azure Blob SAS expiry | ✅ | Evidence SAS tokens: 5-minute, read-only. Generated via `generateBlobSASQueryParameters` with `BlobSASPermissions.parse('r')`. |
| PII not in logs | ⚠️ PARTIAL | See SEC-004 below |
| Badge assertions don't leak PII | ⚠️ PARTIAL | Recipient name exposed. Email masked in verification but exposed in assertion. See SEC-003. |

### Finding SEC-002: Frontend Token Storage in localStorage (HIGH)

**Location:** `frontend/src/stores/authStore.ts` L91-93

```typescript
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

**Risk:** `localStorage` is accessible to any JavaScript on the page. If any XSS vulnerability exists (e.g., unsanitized user content in badge descriptions), both access and refresh tokens can be stolen. This enables full account takeover.

**Mitigating factors:**
- Helmet CSP restricts script sources to `'self'`
- `ValidationPipe` with `whitelist: true` strips unexpected input
- React's default JSX escaping prevents most render-based XSS

**Recommendation:** Migrate to httpOnly secure cookies for refresh tokens. Access token can remain in memory (not localStorage) with short TTL. This is a Phase 2 consideration given CSP mitigations, but should be addressed before production with external users.

### Finding SEC-003: PII Exposure on Public Verification (MEDIUM)

**Location:** `backend/src/badge-verification/badge-verification.service.ts`

The public `GET /api/verify/:verificationId` endpoint exposes:

| Data | Status | Risk |
|------|--------|------|
| Recipient full name | Exposed | Low — expected for badge verification |
| Recipient email | **Masked** (`j***@example.com`) | ✅ Properly handled |
| **Issuer email** | **Exposed unmasked** | ⚠️ Leaks issuer PII to anonymous visitors |
| **Issuer full name** | Exposed | Low — expected for verification |
| **Revoker name** | Exposed (if revoked) | Low |
| Evidence blob URLs | Exposed | Low — SAS required for actual download |

**Recommendation:** Apply the same `maskEmail()` function to issuer email on the verification endpoint. Issuer name exposure is acceptable for verification trust.

### Finding SEC-004: Email Addresses in Plaintext Logs (LOW)

**Locations:** 14+ instances across auth, email, admin-users, badge-issuance, badge-sharing services.

Examples:
- `auth.service.ts` L57: `[AUDIT] User registered: ${user.email}`
- `auth.service.ts` L110: `Successful login: ${user.email}`
- `graph-email.service.ts` L126: `Sending email: ${subject} → ${toEmails.join(', ')}`
- `admin-users.service.ts` L416: `User ${result.email} ${action} by admin`

**Risk:** If logs are shipped to external monitoring (Datadog, Azure Monitor, etc.), email PII is stored unencrypted in third-party systems. GDPR concern.

**Recommendation (Phase 2):** Replace email with userId in non-audit logs. For `[AUDIT]`-tagged entries, consider structured logging with PII fields marked for redaction. Low priority given current deployment scope (internal pilot).

---

## 5.5 Input Validation

| Check | Status | Detail |
|-------|--------|--------|
| All DTOs have class-validator decorators | ✅ | 38 DTO files found. Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` strips unknown properties. |
| File upload validates type & size | ⚠️ PARTIAL | See SEC-005 below |
| CSV upload sanitization (ARCH-C1) | ✅ | `csv-validation.service.ts` strips `= + - @ \t \r` prefixes, applies `sanitize-html` to text fields |
| HTML/XSS sanitization on text fields | ⚠️ PARTIAL | `sanitize-html` only in CSV flow. Other user text inputs (badge template name/description, profile fields) are NOT sanitized server-side. React's JSX escaping provides frontend protection. |
| URL validation on badge image URLs | ✅ | Stored as Azure Blob URLs constructed server-side, not from user input |
| Email format validation | ✅ | `@IsEmail()` on all email DTO fields |

### Finding SEC-005: File Upload Mimetype Bypass (MEDIUM)

**Affected endpoints:**
- `POST /api/badge-templates` — image upload (5MB, jpg/png/gif/webp)
- `POST /api/evidence/:badgeId` — evidence upload (10MB, pdf/png/jpg/docx)
- `POST /api/bulk-issuance/upload` — CSV upload (100KB)

**Issue:** All three endpoints validate file type using `file.mimetype` — a value set by the client's `Content-Type` header. No magic-byte (file signature) validation is performed. An attacker can upload a malicious file (e.g., executable, polyglot) with a spoofed MIME type.

**Risk:** Moderate. Files are stored in Azure Blob Storage (not executed server-side), and SAS-token URLs have 5-minute expiry. The primary risk is stored XSS if a browser renders a "badge image" that's actually HTML/SVG with embedded JavaScript.

**Recommendation:** Add `file-type` npm package for magic-byte validation. Verify actual file content matches declared MIME type before accepting upload. Priority: P1 (before production).

### Finding SEC-006: Inconsistent HTML Sanitization (MEDIUM)

**Issue:** `sanitize-html` is used only in the CSV bulk-issuance flow (3 fields: `narrativeJustification`, `badgeTemplateId`, `evidenceUrl`). Other user-provided text fields — badge template `name`, `description`, `criteria`, user profile `firstName`/`lastName` — are not server-side sanitized.

**Risk:** If React's built-in JSX escaping is bypassed (e.g., `dangerouslySetInnerHTML`, or rendering in non-React contexts like email templates), stored XSS is possible.

**Mitigating factors:** React JSX escaping handles most render scenarios. CSP `script-src: 'self'` blocks inline scripts.

**Recommendation (P2):** Add a global sanitization pipe or interceptor for all string inputs. Not critical while React + CSP are in place, but adds defense-in-depth.

---

## 5.6 Dependency Security

### Backend (`npm audit`)

| Package | Severity | Vulnerability | Status |
|---------|----------|---------------|--------|
| `lodash` 4.17.21 | Moderate | Prototype Pollution in `_.unset` / `_.omit` (GHSA-xxjr-mmjv-4gpg) | Transitive dep via `@nestjs/config`, `@nestjs/swagger`. **ADR-002 accepted risk.** `node-emoji` has lodash 4.17.23 (patched). |
| `lodash` 4.17.21 | Moderate | (Same — 2 instances) | Fix available via `npm audit fix` |
| `@isaacs/brace-expansion` 5.0.0 | High | Uncontrolled Resource Consumption (GHSA-7h2j-956f-4vf2) | Fix available via `npm audit fix` |

**Total: 4 vulnerabilities (3 moderate, 1 high)**

### Frontend (`npm audit`)

| Package | Severity | Vulnerability | Status |
|---------|----------|---------------|--------|
| `axios` ≤1.13.4 | High | DoS via `__proto__` key in `mergeConfig` (GHSA-43fc-jf86-j433) | Fix available via `npm audit fix` |

**Total: 1 vulnerability (1 high)**

### Recommendations

| Action | Package | Priority |
|--------|---------|----------|
| Run `npm audit fix` | Backend: `@isaacs/brace-expansion` | P1 — do before pilot |
| Run `npm audit fix` | Frontend: `axios` | P1 — do before pilot |
| Accept risk | Backend: `lodash` 4.17.21 | P3 — transitive dep, ADR-002. NestJS controls usage. Monitor for NestJS update that bumps lodash. |

---

## 5.7 Production Readiness Security Checklist

| Check | Status | Detail |
|-------|--------|--------|
| Error responses don't expose stack traces | ✅ | NestJS default exception filter returns `{ statusCode, message, error }` — no stack traces in production (`NODE_ENV=production`). No custom filter needed unless specific format required. |
| Helmet headers configured | ✅ | Full CSP, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (manual). |
| Rate limiting on all public endpoints | ✅ | Global `ThrottlerGuard` (60/min default). Auth endpoints have per-route overrides (3-10/min). Bulk upload: 10/5min. |
| CORS whitelist restrictive | ✅ | Reads `ALLOWED_ORIGINS` env var. Explicitly rejects `*` with credentials. Logs blocked origins. |
| No debug endpoints exposed | ⚠️ PARTIAL | See SEC-007 below |
| Health check doesn't expose internals | ✅ | `GET /health` returns `{ status, timestamp, version }`. `GET /ready` returns `{ status, database, storage }` — just up/down booleans. |
| `NODE_ENV=production` enforced | ⚠️ VERIFY | Must ensure production deployment sets `NODE_ENV=production` to enable `upgradeInsecureRequests` CSP and suppress stack traces. |

### Finding SEC-007: Swagger Docs Exposed in Production (LOW)

**Location:** `main.ts` L279

```typescript
SwaggerModule.setup('api-docs', app, document, { ... });
```

**Issue:** `/api-docs` endpoint is registered unconditionally — accessible in all environments including production. Exposes full API schema, endpoint list, DTO shapes, and authentication requirements.

**Risk:** Low — no secrets exposed, but gives attackers a complete API map.

**Recommendation:** Conditionally enable Swagger only in development:
```typescript
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api-docs', app, document, { ... });
}
```

---

## Consolidated Findings

### P0 — Must Fix Before Pilot

| ID | Severity | Finding | Effort |
|----|----------|---------|--------|
| SEC-001 | HIGH | No account lockout after failed login attempts | 2-3h |
| SEC-005 | MEDIUM | File upload MIME type bypass — no magic-byte validation | 2-3h |

### P1 — Should Fix Before Production

| ID | Severity | Finding | Effort |
|----|----------|---------|--------|
| SEC-002 | HIGH | JWT tokens stored in localStorage (XSS-stealable) | 4-6h |
| SEC-003 | MEDIUM | Issuer email exposed unmasked on public verification | 30min |
| SEC-006 | MEDIUM | HTML sanitization only in CSV flow — not applied globally | 2-3h |
| DEP-001 | HIGH | `npm audit fix` — brace-expansion (backend) + axios (frontend) | 30min |

### P2 — Fix When Convenient

| ID | Severity | Finding | Effort |
|----|----------|---------|--------|
| SEC-004 | LOW | Email PII in plaintext logs (14+ locations) | 2h |
| SEC-007 | LOW | Swagger `/api-docs` accessible in production | 15min |

### Accepted Risk

| ID | Severity | Finding | Justification |
|----|----------|---------|---------------|
| DEP-002 | MODERATE | lodash 4.17.21 prototype pollution | ADR-002. Transitive dep via NestJS. Not directly used. |
| INFO-001 | INFO | Public assertion endpoint (no ownership check) | Open Badges 2.0 spec requirement. UUID enumeration infeasible. |
| INFO-002 | INFO | Issuer name on widget embed | Acceptable — public badge context. |

---

## Security Controls Summary (What's Working Well)

1. **Global guard architecture** — `APP_GUARD` pattern ensures no endpoint accidentally lacks auth/RBAC/throttling
2. **Startup secret validation** — Application refuses to start with weak JWT secrets
3. **Refresh token rotation** — Proper implementation with DB-backed revocation and reuse detection
4. **IDOR protection** — Consistent ownership validation on badges, bulk sessions, evidence
5. **Input validation** — Global `ValidationPipe` with strict settings (`whitelist`, `forbidNonWhitelisted`)
6. **CSP + Helmet** — Comprehensive security headers including script-src restriction
7. **CORS** — Whitelist-based, rejects wildcard, logs blocked origins
8. **CSV injection prevention** — Dangerous prefix stripping + sanitize-html
9. **No raw SQL** — Prisma ORM exclusively (3 raw calls are parameterless `SELECT 1`)
10. **Password security** — bcrypt, complexity requirements, enum-safe reset flow

---

## Appendix: Files Reviewed

| Category | Files |
|----------|-------|
| Auth | `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`, 6 DTOs |
| Controllers | 18 controllers — all verified for guard usage |
| Security config | `main.ts` (Helmet, CORS, ValidationPipe, Swagger), `app.module.ts` (global guards, throttle) |
| File upload | `badge-templates.controller.ts`, `evidence.controller.ts`, `bulk-issuance.controller.ts`, `csv-validation.service.ts` |
| Data access | `badge-issuance.service.ts`, `bulk-issuance.service.ts`, `evidence.service.ts`, `badge-verification.service.ts` |
| Frontend | `authStore.ts`, `apiConfig.ts`, API client files |
| Infrastructure | `schema.prisma`, `storage.service.ts`, `.env.example`, `.gitignore` |
| Dependencies | `npm audit` output for both backend and frontend |

---

*End of Security Audit Report*
