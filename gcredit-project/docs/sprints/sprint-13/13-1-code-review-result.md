# Code Review Result: Story 13.1 — Azure AD SSO Strategy + Callback Endpoints

**Story:** 13.1  
**Sprint:** 13  
**Review Date:** 2026-02-25  
**Reviewer:** Dev Agent (Amelia)  
**Scope:** Backend SSO flow, security controls, test coverage, architecture alignment

---

## Verdict

- [ ] ✅ **APPROVED**
- [x] ⚠️ **APPROVED WITH NOTES**
- [ ] 🔄 **CHANGES REQUESTED**

**Decision:** Implementation is functionally complete and test-backed for Story 13.1. No blocker found for moving forward, with a few follow-up notes listed below.

---

## Re-review Update (Post-fix)

**Re-review Date:** 2026-02-25  
**Scope of recheck:** dev follow-up fixes and comments

- Verified the documented fix in story file:
  - AC #1 wording updated from Passport `AzureAdStrategy` to `AzureAdSsoService` + direct MSAL flow.
  - Task 2 wording aligned accordingly.
- No production code changes were introduced in this follow-up; changes are documentation alignment only.
- Previous functional/security assessment remains valid.

**Re-review conclusion:** The prior mismatch note on AC wording is **resolved**.

---

## Evidence Reviewed

### Story + Review Basis
- `docs/sprints/sprint-13/13-1-azure-ad-sso-strategy.md`
- `docs/sprints/sprint-13/13-1-code-review.md`

### Production Code
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/config/azure-ad.config.ts`
- `backend/src/modules/auth/services/azure-ad-sso.service.ts`
- `backend/src/modules/auth/auth.module.ts`

### Tests
- `backend/src/modules/auth/__tests__/azure-ad-sso.service.spec.ts`
- `backend/src/modules/auth/__tests__/auth.controller.sso.spec.ts`
- `backend/src/modules/auth/auth.service.spec.ts`

### Config / Docs / Status
- `backend/.env.example`
- `docs/setup/azure-ad-app-setup.md`
- `docs/sprints/sprint-status.yaml`

### Runtime Validation
Executed targeted tests:

```powershell
cd gcredit-project/backend
npm test -- src/modules/auth/__tests__/azure-ad-sso.service.spec.ts src/modules/auth/__tests__/auth.controller.sso.spec.ts src/modules/auth/auth.service.spec.ts
```

Result: **3 suites passed, 67 tests passed, 0 failed**.

---

## Review Findings by Checklist

## A) Security (Critical)

- **A1 PKCE:** PASS  
  `generateAuthUrl()` uses random `codeVerifier` (32 bytes, base64url), SHA-256 challenge, `S256`.

- **A2 State/CSRF:** PASS  
  Random state is generated, stored in `sso_state` cookie, and strictly validated in callback before token exchange.

- **A3 SSO cookie flags:** PASS (with note)  
  `httpOnly`, `sameSite=lax`, `path=/api/auth/sso`, `maxAge=5m` are set. `secure` is enabled only in production.

- **A4 Token exchange hygiene:** PASS  
  `acquireTokenByCode()` uses code + verifier + scopes + redirect URI; tokens are not logged or persisted.

- **A5 Claim extraction:** PASS  
  `oid` is mandatory; email fallback is `preferred_username` then `email`; missing required claims fail closed.

- **A6 M365 password block:** PASS (policy note)  
  `azureId` users are blocked before `bcrypt.compare()`. Message is explicit and user-friendly, but reveals auth method.

- **A7 Cookie clearing in all callback paths:** PASS  
  `clearSsoCookie()` is called in all early-return branches, success branch, and catch branch.

- **A8 Rate limiting:** PASS  
  Both SSO endpoints are throttled (`10/min`).

- **A9 PII logging:** PASS  
  No token/secret logging observed; SSO logs include `oid` and error category only.

- **A10 Graceful degradation when unconfigured:** PASS  
  Missing SSO env vars leave service unconfigured and endpoints return 503 instead of crashing app startup.

## B) Architecture & Design

- **B1 Dual OAuth coexistence:** PASS  
  Graph app-only flow and SSO auth-code flow are separated by service/config boundaries.

- **B2 Layering and separation:** PASS  
  `AzureAdConfigService` (config), `AzureAdSsoService` (OAuth flow), `AuthService.ssoLogin()` (user/JWT) are cleanly separated.

- **B3 `ssoLogin()` error pattern:** PASS (design note)  
  Union return type is intentionally used for redirect-oriented controller behavior.

- **B4 JIT handoff:** PASS  
  Clear branch exists (`sso_no_account`) for Story 13.2 integration.

- **B5 Module wiring:** PASS  
  Providers/imports are correctly registered in `AuthModule`, no obvious circular dependency.

- **B6 Mini-sync in SSO path:** PASS  
  `ssoLogin()` invokes `syncUserFromGraph()` and returns controlled error on rejection.

## C) Test Coverage

- **C1 SSO service tests:** PASS  
  PKCE, state, claims validation, error paths, and unconfigured service are covered.

- **C2 Controller SSO tests:** PASS  
  Happy path, cookie behavior, callback error branches, state mismatch, missing params/cookie are covered.

- **C3 Auth service tests:** PASS  
  `azureId` password block and `ssoLogin()` flows are covered.

- **C4 Isolation:** PASS  
  Azure/MSAL behavior is mocked; no external network calls in these tests.

- **C5 Regression:** PASS (sampled)  
  Story-specific suites pass locally (3 suites, 67 tests).

- **C6 Edge cases:** PARTIAL (non-blocking)
  - Corrupted state cookie: covered
  - Concurrent multi-tab SSO login: not explicitly covered
  - Token exchange timeout: indirectly via generic MSAL error propagation

## D) Code Quality

- **D1 Error code consistency:** PASS  
  Redirect error codes are consistent (`sso_failed`, `sso_cancelled`, `sso_no_account`, `sso_invalid_token`, `account_disabled`).

- **D2 Duplication in token issuance:** PASS (defer)  
  Duplication exists between `login()` and `ssoLogin()`; acceptable short-term given Story 13.2 extension point.

- **D3 TypeScript strictness:** PASS  
  `eslint-disable` usage is test-local; no inappropriate disable found in reviewed production paths.

- **D4 Cookie JSON roundtrip:** PASS  
  Current controller/tests handle JSON payload and expected decoding behavior correctly.

- **D5 Config initialization timing:** PASS (monitor)  
  Constructor-time initialization is acceptable with current env loading model.

## E) Documentation

- **E1 Setup doc updates:** PASS  
  SSO setup section is present with redirect URI, delegated permissions, and architecture explanation.

- **E2 Env variables documented:** PASS  
  Required SSO env vars are documented in `.env.example`.

- **E3 Story status:** PASS  
  Story `13-1-azure-ad-sso-strategy` is set to `review` in `sprint-status.yaml`.

---

## Notes / Follow-ups (Non-blocking)

1. **AC wording vs implementation shape**  
  ✅ **Resolved in re-review.** Story AC #1 and Task 2 now match actual implementation (`AzureAdSsoService` + direct MSAL flow).

2. **Information disclosure tradeoff (A6)**  
   Explicit message for M365 users improves UX but reveals account auth mode. Keep as-is if product/security accepts this tradeoff; otherwise normalize to generic credential error.

3. **Optional hardening**  
   Consider adding an integration test for concurrent SSO tab scenarios and an explicit token-timeout simulation case.

---

## Final Recommendation

Proceed to SM acceptance for Story 13.1 with **Approved With Notes** status. No blocker requiring code change was identified in this review pass.