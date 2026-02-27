# Story 13.1: Azure AD SSO Strategy + Callback Endpoints

Status: done

## Story

As a **system administrator**,
I want M365 users to authenticate via Azure AD Single Sign-On,
So that employees can log in with their existing corporate credentials without a separate password.

## Context

- Existing auth: JWT in httpOnly cookies (access 15min, refresh 7d), password-based login via `AuthController`
- Existing Graph integration: `GraphTokenProviderService` uses **Client Credentials** flow (app-only, `@azure/identity`)
- SSO requires **Authorization Code** flow (user-delegated) — separate OAuth grant, both coexist
- Azure Tenant: `2wjh85.onmicrosoft.com` (ID: `afc9fe8f-1d40-41fc-9906-e001e500926c`)
- App Registration: `ceafe2e0-73a9-46b6-a203-1005bfdda11f` (may reuse or create dedicated SSO app)
- ADR-011 Decisions: DEC-011-10 (login-time mini-sync), DEC-011-12 (JIT provisioning)
- PO Decision DEC-004: FR27 executes now (FEAT-008 already done in Sprint 12)

## Acceptance Criteria

1. [x] New `AzureAdSsoService` implements SSO flow using `@azure/msal-node` directly (Authorization Code Flow with PKCE)
2. [x] `GET /api/auth/sso/login` redirects to Azure AD authorize URL with scopes: `openid profile email User.Read`
3. [x] `GET /api/auth/sso/callback` exchanges authorization code for tokens, validates `id_token`
4. [x] On successful callback, extracts `oid` (Azure Object ID), `email`, `displayName` from token claims
5. [x] Looks up user by `azureId` field — if found, issues httpOnly JWT cookies (reuse `setAuthCookies()`)
6. [x] If `azureId` not found, delegates to JIT provisioning (Story 13.2)
7. [x] SSO configuration via env vars: `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_REDIRECT_URI`, `AZURE_SSO_SCOPES`
8. [x] All existing password-based login tests pass (0 regression)
9. [x] New tests: SSO callback happy path, invalid code, expired token, missing oid claim
10. [x] Azure AD App Registration updated: redirect URI added, `openid`/`profile`/`email` scopes configured
11. [x] M365 users (having `azureId`) are blocked from password login — response: "Please use Sign in with Microsoft" (DEC-011-13 enforcement)

## Tasks / Subtasks

- [x] Task 1: Install `@azure/msal-node` + configure MSAL Confidential Client (AC: #1, #7)
  - [x] Add `@azure/msal-node` to backend dependencies
  - [x] Create `AzureAdConfig` — reads `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET`, `AZURE_SSO_REDIRECT_URI`, `AZURE_TENANT_ID`
  - [x] Update `.env.example` with new SSO env vars
  - [x] Register MSAL `ConfidentialClientApplication` in NestJS module
- [x] Task 2: Create `AzureAdSsoService` (MSAL SSO service) (AC: #1)
  - [x] Location: `src/modules/auth/services/azure-ad-sso.service.ts`
  - [x] Implement Authorization Code Flow with PKCE
  - [x] Validate `id_token` claims: `oid`, `preferred_username`, `name`
  - [x] Extract user info from token to `AzureAdProfile` interface
- [x] Task 3: SSO login redirect endpoint (AC: #2)
  - [x] `GET /api/auth/sso/login` → generate PKCE code verifier + challenge
  - [x] Build Azure AD authorize URL with `response_type=code`, `scope`, `redirect_uri`, `code_challenge`
  - [x] Store `code_verifier` in session/state param (signed, short-lived)
  - [x] Return 302 redirect to Azure AD
- [x] Task 4: SSO callback endpoint (AC: #3, #4, #5, #6)
  - [x] `GET /api/auth/sso/callback` — receive `code` + `state` from Azure AD
  - [x] Exchange code for tokens via MSAL `acquireTokenByCode()`
  - [x] Validate state/nonce to prevent CSRF
  - [x] Extract `oid`, `email`, `displayName` from `id_token` claims
  - [x] Lookup user by `azureId` field in DB
  - [x] If found: issue JWT cookies via `setAuthCookies()`, redirect to frontend
  - [x] If not found: return error `sso_no_account` (JIT provisioning in Story 13.2)
  - [x] Error handling: Azure AD denied, invalid code, expired token → redirect to `/login?error=sso_failed`
- [x] Task 5: Add `azureId` field to User model if not present (AC: #5)
  - [x] Check Prisma schema for `azureId` on User model — already exists with @unique
  - [x] No migration needed — field already present
  - [x] Ensure M365 sync already populates this field (verified)
- [x] Task 6: Update Auth Module wiring (AC: #1)
  - [x] Register `AzureAdConfigService` and `AzureAdSsoService` in `AuthModule`
  - [x] Add SSO routes to `AuthController`
  - [x] Mark SSO endpoints as `@Public()` (no JWT required)
  - [x] Add rate limiting via `@Throttle()` on SSO endpoints
- [x] Task 7: Update Azure AD App Registration (AC: #10)
  - [x] Redirect URI already configured: `http://localhost:3000/api/auth/sso/callback`
  - [x] Scopes already configured: `openid`, `profile`, `email`, `User.Read`
  - [x] Documented in `docs/setup/azure-ad-app-setup.md`
- [x] Task 8: Block password login for M365 users (AC: #11)
  - [x] In `AuthService.login()`: after lockout check, check `user.azureId`
  - [x] If `user.azureId` is set → reject with: "This account is managed by Microsoft 365. Please use 'Sign in with Microsoft'."
  - [x] Check runs BEFORE `bcrypt.compare()` — no password comparison for SSO-only users
  - [x] Existing `if (!user.passwordHash)` guard still active for JIT users without azureId
- [x] Task 9: Tests (AC: #8, #9, #11)
  - [x] Unit tests: AzureAdSsoService generateAuthUrl(), handleCallback()
  - [x] Integration tests: SSO callback happy path (mocked MSAL)
  - [x] Integration tests: invalid code → error redirect
  - [x] Integration tests: missing oid → sso_invalid_token redirect
  - [x] Unit test: M365 user (has azureId) attempts password login → rejected with SSO message
  - [x] Unit test: ssoLogin() happy path, no-account, disabled, mini-sync
  - [x] Regression: all 896 existing tests pass (0 failures)

## Dev Notes

### Architecture Patterns
- **Dual OAuth coexistence:** Client Credentials (Graph API emails/Teams) + Authorization Code (SSO user login). Different trust models — app-only vs user-delegated.
- **MSAL Confidential Client:** Server-side code exchange. No token cache needed (stateless per-request). PKCE recommended for added security.
- **Cookie-first auth:** SSO callback issues same httpOnly cookies as password login. Frontend doesn't distinguish auth method.

### Key References
- ADR-008: Microsoft Graph Integration
- ADR-011: User Management Architecture (DEC-011-10 through DEC-011-13)
- `backend/src/modules/auth/auth.service.ts` — `setAuthCookies()` helper
- `backend/src/microsoft-graph/services/graph-token-provider.service.ts` — existing Client Credentials flow
- `backend/src/m365-sync/m365-sync.service.ts` — `syncSingleUser()` for mini-sync

### Testing Standards
- Follow existing auth test patterns in `auth.service.spec.ts` (511 lines)
- Mock MSAL `acquireTokenByCode()` — don't call Azure AD in tests
- Use `extractCookieToken()` helper for cookie-based assertions (Lesson 43)

### M365 Password Deprecation (DEC-011-13)
- **Before SSO:** M365 Sync assigns `DEFAULT_USER_PASSWORD` (temp solution for testing)
- **After SSO:** M365 users authenticate only via Azure AD → password login blocked
- Story 13.1 blocks password login for `azureId` users (Task 8)
- Story 13.2 removes `DEFAULT_USER_PASSWORD` from sync code + clears existing temp passwords (migration)
- Login flow priority: `azureId` check → `passwordHash` empty check → `bcrypt.compare()`

### Risk: Lesson 43 — API Response Contract Changes
SSO adds new endpoints but does NOT modify existing response contracts. However, any changes to User model fields must be verified against E2E test helpers.

## Dev Agent Record

### Implementation Plan
- TDD approach: write failing tests per task, then implement, then refactor
- Follow dev-prompt task sequence: Tasks 1-9
- Use `@azure/msal-node` for Authorization Code Flow with PKCE
- Reuse existing `setAuthCookies()` for SSO cookie issuance
- Mock MSAL in all tests — no real Azure AD calls

### Debug Log
- `azureId` field already exists in Prisma schema with `@unique` + `@@index` — no migration needed
- `.env.example` already had SSO env vars from Sprint 13 planning
- Implemented SSO service as `AzureAdSsoService` (not Passport strategy) — `@azure/msal-node` used directly for cleaner OAuth control
- State + codeVerifier stored in httpOnly `sso_state` cookie (5min TTL, path=/api/auth/sso)
- Updated 5 existing auth.service.spec.ts tests that used M365 user + password login (now blocked by azureId check)
- All 896 tests pass, 48/48 suites, 0 regressions

### Completion Notes
- Story 13.1 fully implemented: Azure AD SSO backend (OAuth 2.0 Auth Code Flow + PKCE)
- 2 new SSO endpoints: `GET /api/auth/sso/login` (redirect) + `GET /api/auth/sso/callback` (token exchange)
- M365 users blocked from password login with specific SSO message (DEC-011-13)
- 36 new/updated tests across 3 test files (13 controller SSO, 12 SSO service unit, 11 auth service updates)
- SSO callback returns `sso_no_account` for unknown azureId — ready for Story 13.2 JIT provisioning
- No sensitive data logged (tokens/secrets excluded from all log output)

## File List

### New Files
- `backend/src/modules/auth/config/azure-ad.config.ts` — AzureAdConfigService (MSAL ConfidentialClient factory)
- `backend/src/modules/auth/services/azure-ad-sso.service.ts` — AzureAdSsoService (generateAuthUrl, handleCallback)
- `backend/src/modules/auth/interfaces/azure-ad-profile.interface.ts` — AzureAdProfile interface
- `backend/src/modules/auth/__tests__/azure-ad-sso.service.spec.ts` — SSO service unit tests (12 tests)
- `backend/src/modules/auth/__tests__/auth.controller.sso.spec.ts` — SSO controller integration tests (13 tests)

### Modified Files
- `backend/package.json` — Added `@azure/msal-node` dependency
- `backend/src/modules/auth/auth.module.ts` — Registered AzureAdConfigService, AzureAdSsoService, ConfigModule
- `backend/src/modules/auth/auth.controller.ts` — Added SSO endpoints (sso/login, sso/callback), injected AzureAdSsoService + ConfigService
- `backend/src/modules/auth/auth.service.ts` — Added azureId password block (Task 8), added ssoLogin() method
- `backend/src/modules/auth/auth.service.spec.ts` — Updated M365 tests for azureId block, added ssoLogin() tests
- `gcredit-project/docs/setup/azure-ad-app-setup.md` — Added SSO configuration section
- `gcredit-project/docs/sprints/sprint-status.yaml` — Updated 13-1 status

## Change Log

| Date | Change | Tasks |
|------|--------|-------|
| 2026-02-25 | Story started — implementation begins | — |
| 2026-02-25 | Full implementation complete: SSO endpoints, M365 password block, 36 tests | Tasks 1-9 |
| 2026-02-25 | Code review fix: updated AC #1 and Task 2 wording — AzureAdSsoService (not Passport strategy) per review Note 1 | — |
