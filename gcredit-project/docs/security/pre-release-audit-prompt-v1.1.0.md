# Pre-Release Audit Prompt — G-Credit v1.1.0

## Audit Context

**Project:** G-Credit v1.1.0  
**Branch:** `sprint-11/security-quality-hardening` (pending merge to `main`)  
**Sprint:** Sprint 11 — 25/25 stories delivered (Security + Quality Hardening)  
**Tests:** BE 756 + FE 551 = 1,307 (all passing)  
**Trigger:** Sprint 11 fundamentally reworked auth (httpOnly cookies), input validation, API contracts, and security middleware. A targeted pre-release audit is warranted before tagging v1.1.0.

**Reference:** `project-context.md` (Single Source of Truth)

---

## Audit Scope — 3 Targeted Areas

This is NOT a full re-audit of the 6 original Sprint 10 assessments. Sprint 11 addressed those findings. This audit focuses on:

1. **Auth Flow Trace** — End-to-end verification of the httpOnly cookie migration
2. **API Surface Inventory** — Complete endpoint-auth-usage mapping
3. **Pre-Release Security Checklist** — Standard production readiness checks

---

## Audit 1: Auth Flow Trace (~1-2h)

### Objective
Walk every authentication path end-to-end, verifying cookie lifecycle, guard behavior, and token flow are consistent. Story 11.25 proved that gaps survived the original Story 11.6 migration — this audit ensures no further gaps remain.

### Paths to Trace

#### Path A: Standard User Login → API Calls → Refresh → Logout
```
Frontend login form → POST /api/auth/login (email+password)
  → AuthService.login() generates JWT pair
  → AuthController sets Set-Cookie: access_token (path=/api, 15min) + refresh_token (path=/api/auth, 7d)
  → Response body: { user: {...} } (NO tokens in body — verify M-4)
  → authStore saves user object + isAuthenticated=true
  → apiFetch('/api/badges/wallet') sends cookie automatically (credentials: 'include')
  → JwtStrategy extracts access_token from cookie → req.user populated
  → 15min later: access_token expires
  → authStore.validateSession() → GET /api/auth/profile returns 401
  → authStore retries: POST /api/auth/refresh (refresh_token sent via cookie path=/api/auth)
  → AuthController sets new cookie pair → returns { message: 'Token refreshed' }
  → POST /api/auth/logout
  → AuthController clears cookies (getCookieOptions match) → blacklists refresh token
```

**Verify:**
- [ ] `setCookie` and `clearCookie` use identical attributes (via `getCookieOptions()`)
- [ ] Response bodies of login/register/refresh contain NO token fields
- [ ] `authStore.ts` never reads `accessToken` or `refreshToken` from response bodies
- [ ] `authStore.ts` cleans up legacy `localStorage` tokens on logout (migration safety)
- [ ] `apiFetch` always sends `credentials: 'include'`
- [ ] No raw `fetch()` or `axios` calls bypass `apiFetch` in frontend `src/`

#### Path B: Public Route with Optional Auth
```
Unauthenticated user → GET /api/verify/:id
  → JwtAuthGuard checks IS_PUBLIC_KEY → true
  → Checks req.cookies.access_token and req.headers.authorization → neither present
  → Returns true (no auth attempt) → req.user = undefined
  → BadgeVerificationController.verifyBadge() executes without req.user

Authenticated user → GET /api/verify/:id  
  → JwtAuthGuard sees @Public() + cookie present
  → Calls super.canActivate() → JwtStrategy populates req.user
  → If token invalid → catch(() => true) → req.user stays undefined, request passes
```

**Verify:**
- [ ] `JwtAuthGuard` checks BOTH `request.cookies?.access_token` AND `authHeader?.startsWith('Bearer ')`
- [ ] Invalid cookie on `@Public()` route → request passes, no 401
- [ ] Unit tests cover: cookie auth, Bearer auth, no token, invalid cookie, invalid Bearer

#### Path C: Teams Server-to-Server Callback
```
Teams Adaptive Card → POST /api/teams/actions/claim-badge { claimToken: "..." }
  → @Public() → JwtAuthGuard skips auth
  → No req.user (Teams doesn't send cookies/JWT)
  → Controller validates claimToken via Prisma findUnique
  → One-time use: claimToken set to null after successful claim
```

**Verify:**
- [ ] `TeamsActionController` has `@Public()` on `claimBadge()` method
- [ ] No `@UseGuards(JwtAuthGuard)` or `@ApiBearerAuth()` on controller class
- [ ] `claimToken` has `@unique` constraint in Prisma schema
- [ ] claimToken is nullified after claim (`claimToken: null` in update)
- [ ] TD-017 tracked for future callback origin verification

#### Path D: Bearer Fallback (E2E Tests)
```
E2E test → createAndLoginUser() → POST /api/auth/login
  → extractCookieToken(response, 'access_token') parses Set-Cookie header
  → authRequest() sets Authorization: Bearer {token}
  → JwtStrategy: cookie check → none → Bearer fallback → token found → req.user populated
```

**Verify:**
- [ ] `JwtStrategy` extraction order: cookie first, Bearer second
- [ ] `extractCookieToken()` in test-setup.ts handles: array Set-Cookie, single string, missing header
- [ ] `authRequest` TODO comment documents planned migration to cookie auth

#### Path E: Registration Flow
```
POST /api/auth/register { displayName, email, password, employeeId }
  → AuthService.register() creates user + generates JWT pair
  → AuthController sets cookies + returns { user: {...} }
  → authStore saves user, isAuthenticated=true
```

**Verify:**
- [ ] Same cookie-setting logic as login (via shared `setAuthCookies()`)
- [ ] Response body contains `user` only, no tokens

### Auth Infrastructure Files to Inspect

| File | What to Check |
|------|--------------|
| `backend/src/common/guards/jwt-auth.guard.ts` | @Public() branch cookie+bearer check, catch-to-true |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | Cookie-first extraction, bearer fallback, JWT_SECRET validation |
| `backend/src/modules/auth/auth.controller.ts` | getCookieOptions(), setAuthCookies(), clearCookie() parity, response shapes |
| `backend/src/modules/auth/auth.service.ts` | Token generation, refresh token blacklisting |
| `backend/src/common/guards/roles.guard.ts` | ADMIN bypass, @Roles() metadata check |
| `frontend/src/lib/apiFetch.ts` | `credentials: 'include'`, no token injection |
| `frontend/src/stores/authStore.ts` | No token storage, validateSession flow, logout cleanup |
| `backend/test/helpers/test-setup.ts` | extractCookieToken(), authRequest() Bearer pattern |

---

## Audit 2: API Surface Inventory (~1-2h)

### Objective
Produce a complete inventory of every API endpoint, its auth requirement, rate limit, RBAC role, and whether it's actively used by the frontend. Identify orphan endpoints, missing auth, and authorization gaps.

### Pre-Collected Endpoint Inventory

> **NOTE:** This inventory was collected from controller source code. The auditor should VERIFY each entry against the actual running codebase, and flag any discrepancies.

#### Public Endpoints (12 endpoints, `@Public()`)

| # | Route | Method | Controller | Purpose | Rate Limit |
|---|-------|--------|-----------|---------|------------|
| 1 | `GET /` | GET | AppController | Hello/health | Global |
| 2 | `GET /health` | GET | AppController | Health check | Global |
| 3 | `GET /ready` | GET | AppController | Readiness probe | Global |
| 4 | `POST /api/auth/register` | POST | AuthController | Registration | 3/hour |
| 5 | `POST /api/auth/login` | POST | AuthController | Login | 5/min |
| 6 | `POST /api/auth/request-reset` | POST | AuthController | Password reset request | 3/5min |
| 7 | `POST /api/auth/reset-password` | POST | AuthController | Password reset | 5/5min |
| 8 | `POST /api/auth/refresh` | POST | AuthController | Token refresh | 10/min |
| 9 | `POST /api/auth/logout` | POST | AuthController | Logout | Global |
| 10 | `POST /api/badges/claim` | POST | BadgeIssuanceController | Claim badge by token | Global |
| 11 | `GET /api/badges/:id/assertion` | GET | BadgeIssuanceController | OB assertion JSON | Global |
| 12 | `GET /api/badges/:id/integrity` | GET | BadgeIssuanceController | Badge integrity check | Global |
| 13 | `GET /api/verify/:verificationId` | GET | BadgeVerificationController | Public verification | Global |
| 14 | `GET /api/badge-templates/criteria-templates` | GET | BadgeTemplatesController | Criteria template list | Global |
| 15 | `GET /api/badge-templates/criteria-templates/:key` | GET | BadgeTemplatesController | Criteria template detail | Global |
| 16 | `GET /api/badges/:badgeId/embed` | GET | WidgetEmbedController | Widget embed data | Global |
| 17 | `GET /api/badges/:badgeId/widget` | GET | WidgetEmbedController | Widget HTML | Global |
| 18 | `POST /api/teams/actions/claim-badge` | POST | TeamsActionController | Teams claim callback | Global |

**Audit tasks:**
- [ ] Verify each endpoint SHOULD be public (intentional access without auth)
- [ ] Check that public POST endpoints have adequate rate limiting
- [ ] Check that public GET endpoints don't expose sensitive data
- [ ] `POST /api/auth/logout` is `@Public()` — verify this is intentional (needs refresh token cookie, not JWT)
- [ ] `POST /api/badges/claim` is `@Public()` — verify claim token validation provides adequate protection

#### Authenticated Endpoints (no specific role required)

| Route | Method | Controller | Purpose |
|-------|--------|-----------|---------|
| `GET /api/auth/profile` | GET | AuthController | Get own profile |
| `PATCH /api/auth/profile` | PATCH | AuthController | Update own profile |
| `POST /api/auth/change-password` | POST | AuthController | Change own password |
| `POST /api/badges/:id/claim` | POST | BadgeIssuanceController | Claim badge by ID |
| `GET /api/badges/my-badges` | GET | BadgeIssuanceController | My badges |
| `GET /api/badges/wallet` | GET | BadgeIssuanceController | Badge wallet |
| `GET /api/badges/:id` | GET | BadgeIssuanceController | Badge detail |
| `GET /api/badges/:id/similar` | GET | BadgeIssuanceController | Similar badges |
| `POST /api/badges/:id/report` | POST | BadgeIssuanceController | Report badge issue |
| `GET /api/badges/:id/download/png` | GET | BadgeIssuanceController | Download baked badge |
| `GET /api/badge-templates` | GET | BadgeTemplatesController | Template list |
| `GET /api/badge-templates/:id` | GET | BadgeTemplatesController | Template detail |
| `GET /api/skills` | GET | SkillsController | Skill list |
| `GET /api/skills/search` | GET | SkillsController | Skill search |
| `GET /api/skills/:id` | GET | SkillsController | Skill detail |
| `GET /api/skill-categories` | GET | SkillCategoriesController | Category list |
| `GET /api/skill-categories/flat` | GET | SkillCategoriesController | Flat category list |
| `GET /api/skill-categories/:id` | GET | SkillCategoriesController | Category detail |
| `GET /api/milestones/achievements` | GET | MilestonesController | My achievements |
| `GET /api/badges/:badgeId/evidence` | GET | EvidenceController | Badge evidence |
| `GET /api/badges/:badgeId/evidence/:fileId/download` | GET | EvidenceController | Download evidence |
| `GET /api/badges/:badgeId/evidence/:fileId/preview` | GET | EvidenceController | Preview evidence |
| `POST /api/badges/:badgeId/share/teams` | POST | TeamsSharingController | Share to Teams |
| `GET /api/badges/:badgeId/analytics/shares` | GET | BadgeAnalyticsController | Share analytics |
| `GET /api/badges/:badgeId/analytics/shares/history` | GET | BadgeAnalyticsController | Share history |
| `POST /api/badges/:badgeId/share/linkedin` | POST | BadgeAnalyticsController | Share to LinkedIn |
| `POST /api/badges/share/email` | POST | BadgeSharingController | Share by email |
| `GET /profile` | GET | AppController | Profile (requires @Roles) |

**Audit tasks:**
- [ ] `GET /api/badges/:id` — any auth user can access ANY badge? Must verify service-level ownership check
- [ ] `GET /api/badges/:id/download/png` — same concern: service-level authZ?
- [ ] `POST /api/badges/:badgeId/share/teams` — any auth user can share any badge? Check ownership
- [ ] `GET /api/badges/:badgeId/analytics/shares` — any auth user can see any badge's share analytics?
- [ ] `POST /api/badges/share/email` — any auth user can share any badge?
- [ ] `GET /api/badges/:badgeId/evidence` — any auth user can access any badge's evidence?
- [ ] `/profile` in AppController — has @Roles but uses EMPLOYEE,MANAGER,ISSUER,ADMIN (i.e., all roles) — redundant with auth?

#### Role-Protected Endpoints

| Role | Endpoints |
|------|----------|
| **ADMIN only** | `/api/admin/users/*` (5), `/api/admin/milestones/*` (4), `/api/admin/m365-sync/*` (4), `/api/analytics/system-overview`, `/api/analytics/skills-distribution`, `/api/analytics/recent-activity`, `/api/analytics/export`, `/admin-only` |
| **ADMIN + ISSUER** | `/api/badge-templates` CRUD (create/update/delete, findAllAdmin), `/api/skills` CRUD (create/update/delete), `/api/skill-categories` CRUD (create/update), `/api/badges` (issue, bulk, recipients), `/api/bulk-issuance/*` (5), `/api/badges/:badgeId/evidence` (upload) |
| **ADMIN + MANAGER** | `/api/analytics/top-performers` |
| **ADMIN + ISSUER + MANAGER** | `/api/badges/issued`, `/api/badges/:id/visibility`, `/api/badges/:id/revoke`, `/api/analytics/issuance-trends` |
| **ADMIN only (delete)** | `/api/skill-categories/:id` DELETE |

**Audit tasks:**
- [ ] Verify no endpoint is missing `@Roles()` that should have it
- [ ] Verify ADMIN bypass is correct in RolesGuard (ADMIN can access everything)
- [ ] Check `PATCH /api/badges/:id/visibility` — should badge OWNER (EMPLOYEE) also be able to toggle?
- [ ] Check `POST /api/badges/:id/revoke` — MANAGER can revoke? Verify business logic

#### Frontend → Backend Call Map

**Audit task:** For each authenticated endpoint above, verify the frontend actually calls it via `apiFetch`. Identify any endpoints with zero frontend consumers (dead endpoints). Search `frontend/src/` for each route pattern.

Key routes to verify:
- [ ] `GET /api/dashboard/*` — used by dashboard hooks
- [ ] `GET /api/badges/wallet` — used by WalletPage/BadgeWallet
- [ ] `POST /api/badges` — used by IssueBadgePage
- [ ] `POST /api/bulk-issuance/*` — used by BulkIssuance flow
- [ ] `GET /api/analytics/*` — used by AnalyticsPage
- [ ] `POST /api/badges/share/email` — used by BadgeShareModal
- [ ] `GET /api/admin/users` — used by UserManagement
- [ ] `GET /api/milestones/achievements` — used by MilestonesPage/WalletPage

### Known Findings to Investigate

| # | Finding | Severity | Notes |
|---|---------|----------|-------|
| F-1 | `BadgeTemplatesController.findAll()` has comment "Public endpoint" but **NO `@Public()`** | Low/Clarity | Auth-protected in practice. Intentional? Fix comment or add `@Public()`. |
| F-2 | No controllers use `@ApiCookieAuth()` — Swagger only shows Bearer | Low/Docs | `addCookieAuth()` added to Swagger config but no per-controller decorator |
| F-3 | Redundant explicit `@UseGuards(JwtAuthGuard, RolesGuard)` alongside global APP_GUARD | Info | Not harmful, but inconsistent style. Some controllers use it, others don't. |
| F-4 | Several sharing/analytics endpoints lack `@Roles()` — any authenticated user can access | Review | Intentional? Badge owner should share, but should any user see any badge's share analytics? |
| F-5 | CORS allows requests with no `origin` header | Review | Needed for Postman/mobile? Security implications in production? |

---

## Audit 3: Pre-Release Security Checklist (~30min-1h)

### Production Readiness Checks

#### Environment & Secrets
- [ ] `.env` files in `.gitignore` — **CONFIRMED** (7 patterns)
- [ ] No hardcoded secrets in source — **CONFIRMED** (test fixtures only)
- [ ] `JWT_SECRET` startup validation ≥32 chars, rejects weak values — **CONFIRMED**
- [ ] `JWT_REFRESH_SECRET` startup validation — **CONFIRMED**
- [ ] Verify `NODE_ENV=production` is set in deployment config
- [ ] Verify `ALLOWED_ORIGINS` is set to production domain(s) only (not localhost)

#### Swagger
- [ ] Swagger disabled in production (`NODE_ENV !== 'production'` gate) — **CONFIRMED**
- [ ] `/api-docs` returns 404 in production — verify in deployed environment

#### HTTP Security Headers (Helmet)
- [ ] CSP: `default-src 'self'`, `script-src 'self'`, `frame-ancestors 'none'` — **CONFIRMED**
- [ ] X-Frame-Options: DENY — **CONFIRMED**
- [ ] Referrer-Policy: no-referrer — **CONFIRMED**
- [ ] Permissions-Policy: geolocation=(), camera=(), etc. — **CONFIRMED**
- [ ] Verify `upgrade-insecure-requests` enabled in production — **CONFIRMED** (code-level)
- [ ] Check `connect-src` whitelist: only `self`, `graph.microsoft.com`, `*.blob.core.windows.net`

#### Cookie Security
- [ ] `httpOnly: true` on both cookies — **CONFIRMED**
- [ ] `secure: true` in production (`isProduction` check) — **CONFIRMED** (code-level)
- [ ] `sameSite: 'lax'` — **CONFIRMED**
- [ ] `clearCookie` attributes match `setCookie` — **CONFIRMED** (shared `getCookieOptions()`)

#### Rate Limiting
- [ ] Global rate limit: 60 req/min — **CONFIRMED**
- [ ] Auth endpoints have stricter limits — **CONFIRMED** (3-10 per endpoint)
- [ ] Bulk upload endpoint rate-limited — **CONFIRMED** (configurable via env)
- [ ] No endpoint explicitly disabled rate limiting except `GET /auth/profile` (via `@SkipThrottle()`)

#### Input Validation
- [ ] `ValidationPipe` global with `whitelist: true`, `forbidNonWhitelisted: true` — **CONFIRMED**
- [ ] `@SanitizeHtml()` on all write-facing DTO string fields — verify completeness
- [ ] Missing `@SanitizeHtml()` on any DTO: check `register.dto.ts`, `login.dto.ts`, `update-profile.dto.ts`, `change-password.dto.ts`, `claim-badge-action.dto.ts`

#### CORS
- [ ] `credentials: true` — **CONFIRMED**
- [ ] Wildcard `*` filtered out — **CONFIRMED** (logged as warning)
- [ ] Origin-less requests allowed — **REVIEW** needed for production
- [ ] Production `ALLOWED_ORIGINS` should only contain the deployment domain

#### Dependencies
- [ ] `npm audit` — 0 HIGH/CRITICAL vulnerabilities (last checked Sprint 11 Story 11.3)
- [ ] Re-run `cd gcredit-project/backend && npm audit` and `cd gcredit-project/frontend && npm audit`

#### File Upload Security
- [ ] Magic-byte validation (JPEG/PNG/GIF/WebP/PDF) — **CONFIRMED** (Story 11.2)
- [ ] File size limits — verify Multer config
- [ ] Uploaded files stored in Azure Blob (not local filesystem)

---

## Output Format

The auditor should produce ONE markdown file: `gcredit-project/docs/security/pre-release-audit-v1.1.0.md` with:

1. **Audit Summary** — overall risk assessment (GREEN/YELLOW/RED)
2. **Auth Flow Trace Results** — path-by-path verification with pass/fail
3. **API Surface Inventory** — complete endpoint table with findings
4. **Security Checklist** — item-by-item pass/fail
5. **Findings** — any new issues discovered, with severity (BLOCKER/MAJOR/MINOR/INFO)
6. **Recommendations** — actionable items for v1.1.0 release or v1.2.0 backlog
7. **Verdict** — RELEASE / RELEASE WITH CONDITIONS / HOLD

If any BLOCKER findings are discovered, create story files in `gcredit-project/docs/sprints/sprint-11/` for immediate remediation.
