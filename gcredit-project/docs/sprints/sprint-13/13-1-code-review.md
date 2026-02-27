# Code Review: Story 13.1 — Azure AD SSO Strategy + Callback Endpoints

**Story:** 13.1  
**Sprint:** 13  
**Commit:** `687127d feat(auth): implement Azure AD SSO strategy + callback endpoints (Story 13.1)`  
**Risk Level:** 🔴 HIGH (Security-critical OAuth flow)  
**Review Method:** TDD + AI Review + Self-review  

---

## Summary of Changes

**16 files changed, 1,914 insertions(+), 152 deletions(-)**  
**36 tests: 13 controller SSO + 12 SSO service + 11 auth service (modified)**  
**All 896 tests pass (48/48 suites, 0 regressions)**

### New Files (6)
| File | Lines | Purpose |
|------|-------|---------|
| `src/modules/auth/config/azure-ad.config.ts` | 102 | MSAL ConfidentialClientApplication factory + SSO config |
| `src/modules/auth/services/azure-ad-sso.service.ts` | 121 | OAuth flow: `generateAuthUrl()` (PKCE + state) + `handleCallback()` (token exchange) |
| `src/modules/auth/interfaces/azure-ad-profile.interface.ts` | 11 | `{ oid, email, displayName }` interface |
| `src/modules/auth/__tests__/azure-ad-sso.service.spec.ts` | 275 | 12 unit tests for SSO service |
| `src/modules/auth/__tests__/auth.controller.sso.spec.ts` | 298 | 13 integration tests for SSO endpoints |
| `docs/setup/azure-ad-app-setup.md` | +73 | SSO section added to Azure AD setup guide |

### Modified Files (4 production, 2 config, 4 docs)
| File | Delta | Purpose |
|------|-------|---------|
| `auth.controller.ts` | +157 | `GET /sso/login` + `GET /sso/callback` endpoints |
| `auth.service.ts` | +118 | `ssoLogin()` method + `azureId` password block in `login()` |
| `auth.module.ts` | +10 | Register `AzureAdConfigService`, `AzureAdSsoService`, `ConfigModule` |
| `auth.service.spec.ts` | +309/−152 | Rework M365 tests → azureId block tests + new `ssoLogin()` tests |
| `package.json` | +1 | `@azure/msal-node` dependency |
| `.env.example` | +9 | SSO env vars documented |

---

## Review Checklist

### 🔒 A. Security (Critical — OAuth + Auth)

- [ ] **A1. PKCE Implementation:** Verify `generateAuthUrl()` generates proper PKCE — `codeVerifier` is cryptographically random (32 bytes), `codeChallenge` is SHA-256 of verifier, method is `S256` (not plain).
- [ ] **A2. State / CSRF Protection:** Verify `state` is random (16 bytes hex), stored in httpOnly cookie, validated in callback before token exchange. State mismatch → redirect with error (not 200).
- [ ] **A3. SSO State Cookie Security:** `sso_state` cookie: httpOnly=true, sameSite=lax, path=/api/auth/sso, maxAge=5min. **Question:** Should `secure=true` be enforced even in dev? (Currently: only in production via `NODE_ENV`).
- [ ] **A4. Token Exchange:** MSAL `acquireTokenByCode()` receives code + codeVerifier + scopes + redirectUri. No tokens are logged. No raw `id_token` is stored.
- [ ] **A5. Claim Extraction:** `oid` claim is required (throws if missing). Email falls back `preferred_username → email`. Both are validated before use.
- [ ] **A6. M365 Password Login Block (DEC-011-13):** Users with `azureId` set are blocked from `POST /api/auth/login` **before** `bcrypt.compare()`. Error message is distinct from "Invalid credentials" — exposes auth method. **Question:** Is the distinct error message an acceptable information disclosure? (Standard: "Invalid credentials" hides auth method from attackers; SSO message reveals the user is M365-managed.)
- [ ] **A7. Cookie Clearing:** `sso_state` cookie is cleared in ALL code paths (success, error, exception). Verify `clearSsoCookie()` is called before every redirect.
- [ ] **A8. Rate Limiting:** Both SSO endpoints have `@Throttle({ default: { ttl: 60000, limit: 10 } })`. Verify this is appropriate (10/min for SSO login redirect is generous).
- [ ] **A9. PII in Logs:** Check all `logger.log/warn/error` calls — no tokens, secrets, or full emails in logs. Verify `oid` logging is acceptable (Azure Object ID, not PII).
- [ ] **A10. SSO Optional / Graceful Degradation:** When SSO env vars are missing, `AzureAdConfigService.isConfigured()` returns false → endpoints return 503. App does NOT crash on startup without SSO vars.

### 🏗️ B. Architecture & Design

- [ ] **B1. Dual OAuth Coexistence:** Client Credentials flow (Graph API) and Authorization Code flow (SSO) are cleanly separated. MSAL and `@azure/identity` don't conflict.
- [ ] **B2. Service Layer Separation:** `AzureAdConfigService` (config) → `AzureAdSsoService` (OAuth flow) → `AuthService.ssoLogin()` (user lookup + JWT). Clean responsibility boundaries.
- [ ] **B3. `ssoLogin()` Return Type:** Returns union `{ accessToken, refreshToken, user } | { error: string }`. The controller checks `'error' in loginResult`. **Question:** Is this union pattern preferable over throwing exceptions? (Exception-based would be more consistent with `login()` which throws `UnauthorizedException`.)
- [ ] **B4. JIT Provisioning Placeholder:** `ssoLogin()` returns `{ error: 'sso_no_account' }` when user not found. Story 13.2 will replace this. Verify the branch point is clear and easy to extend.
- [ ] **B5. Module Wiring:** `AuthModule` now registers `AzureAdConfigService`, `AzureAdSsoService`, and imports `ConfigModule`. Verify no circular dependencies.
- [ ] **B6. Login-Time Mini-Sync in SSO Path:** `ssoLogin()` calls `m365SyncService.syncUserFromGraph()` — same as old password login path. Verify sync rejection returns error (not throws).

### 🧪 C. Test Coverage

- [ ] **C1. SSO Service Tests (12 tests):** Happy path, PKCE, state uniqueness, email lowercase, fallback email claim, missing oid, missing email, MSAL error propagation, ServiceUnavailable when not configured.
- [ ] **C2. Controller SSO Tests (13 tests):** Login redirect 302, sso_state cookie set with HttpOnly, 503 when not configured, callback happy path (cookies + redirect), sso_no_account, account_disabled, invalid code, missing oid → sso_invalid_token, access_denied → sso_cancelled, generic Azure error → sso_failed, state mismatch, missing cookie, missing code.
- [ ] **C3. Auth Service Tests (modified):** Password login block for azureId users (4 tests), regression test for local user login, `ssoLogin()` tests (8 tests: happy path, not found, inactive, lookup by azureId, lastLoginAt update, mini-sync trigger, sync rejection, no passwordHash in response, JWT payload, refresh token stored).
- [ ] **C4. Test Isolation:** All Azure AD / MSAL calls are mocked. No real network calls in tests. `ConfigService` is mocked for SSO config.
- [ ] **C5. Regression:** All 860+ existing tests still pass. M365 mini-sync tests in `login()` were correctly reworked since M365 users now go through SSO (not password login).
- [ ] **C6. Missing Test Cases:** Consider whether these edge cases are covered:
  - [ ] Corrupted `sso_state` cookie (non-JSON) → ✅ Tested (line ~240 in controller — JSON.parse catch)
  - [ ] Concurrent SSO logins (two tabs) → Not tested (stateless per-request, should be fine)
  - [ ] Token exchange timeout → Not explicitly tested (MSAL error propagation covers this)

### 📐 D. Code Quality

- [ ] **D1. Error Messages:** Redirect errors use consistent codes: `sso_failed`, `sso_cancelled`, `sso_no_account`, `sso_invalid_token`, `account_disabled`. Frontend will need to map these.
- [ ] **D2. Code Duplication:** `ssoLogin()` duplicates JWT generation + refresh token storage logic from `login()`. Consider extracting a shared `issueTokensAndLogin()` helper. **Note:** This is acceptable for now — Story 13.2 will extend `ssoLogin()`, so premature extraction could complicate JIT.
- [ ] **D3. TypeScript Strictness:** `eslint-disable` for `@typescript-eslint/no-unsafe-assignment` in test files. Acceptable for test mocks. Verify no eslint-disable in production code.
- [ ] **D4. Cookie JSON Serialization:** `sso_state` cookie stores JSON string. Verify it's properly URL-encoded/decoded in the cookie roundtrip (supertest uses `encodeURIComponent`).
- [ ] **D5. Config Initialization:** `AzureAdConfigService` initializes in constructor (not `onModuleInit`). This means it runs synchronously during DI. Verify this doesn't cause issues if env vars are loaded asynchronously.

### 📖 E. Documentation

- [ ] **E1. azure-ad-app-setup.md:** SSO section added with redirect URI, delegated permissions, env vars, and dual OAuth architecture table.
- [ ] **E2. .env.example:** SSO variables (`AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET`, `AZURE_SSO_REDIRECT_URI`, `AZURE_SSO_SCOPES`, `INITIAL_ADMIN_EMAIL`) documented.
- [ ] **E3. sprint-status.yaml:** Story moved from `backlog` → `review`.

---

## Specific Code Sections to Examine

### 1. SSO Callback Flow (auth.controller.ts, lines ~175-310)
The most complex new code. Review the full error handling cascade:
```
Azure error params → state validation → cookie retrieval → JSON parse → 
state match → MSAL token exchange → ssoLogin() → cookie set → redirect
```
Verify every branch ends with `clearSsoCookie()` + redirect.

### 2. Password Login Block (auth.service.ts, lines ~143-149)
```typescript
// Story 13.1 AC #11 / DEC-011-13: Block password login for M365 users
if (user.azureId) {
  throw new UnauthorizedException(
    'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
  );
}
```
Positioned after lockout check, before empty passwordHash guard. Verify ordering is correct.

### 3. ssoLogin() method (auth.service.ts, lines ~600-700)
New method with union return type. Key flows:
- User not found → `{ error: 'sso_no_account' }`
- User inactive → `{ error: 'account_disabled' }`  
- Sync rejected → `{ error: 'sso_failed' }`
- Success → `{ accessToken, refreshToken, user }`

### 4. MSAL Config (azure-ad.config.ts)
Constructor-time initialization. Graceful failure when env vars missing. MSAL logger only logs errors, PII logging disabled.

---

## Questions for Review Decision

1. **[A6] Information Disclosure:** The M365 password block message reveals the user is M365-managed. Accept this for UX (user knows to use SSO button) or change to generic "Invalid credentials" for security?

2. **[B3] Error Return Pattern:** `ssoLogin()` returns `{ error: string }` instead of throwing. This diverges from `login()` which throws `UnauthorizedException`. Should we standardize? (Recommendation: keep as-is — controller needs to redirect, not return 401 JSON.)

3. **[D2] Token Issuance Duplication:** JWT generation code duplicated between `login()` and `ssoLogin()`. Extract now or defer to Story 13.2?

---

## Review Verdict Template

After review, mark one:

- [ ] **✅ APPROVED** — No critical issues. Proceed to SM acceptance.
- [x] **⚠️ APPROVED WITH NOTES** — Minor issues noted but not blocking. Fix in next commit.
- [ ] **🔄 CHANGES REQUESTED** — Issues must be fixed before merge. List blocker items below.

**Reviewer Notes:**
> Final status synced from `13-1-code-review-result.md` (2026-02-25 re-review).
> 
> - AC #1 / Task 2 wording mismatch has been resolved in story doc (AzureAdSsoService + direct MSAL flow).
> - No blocker found; implementation remains acceptable for SM acceptance.
> - Non-blocking follow-ups remain: A6 information disclosure tradeoff, optional edge-case hardening tests.

