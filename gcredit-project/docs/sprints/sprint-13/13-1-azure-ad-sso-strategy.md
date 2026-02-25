# Story 13.1: Azure AD SSO Strategy + Callback Endpoints

Status: backlog

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

1. [ ] New `AzureAdStrategy` registered in Passport using `@azure/msal-node` (Authorization Code Flow with PKCE)
2. [ ] `GET /api/auth/sso/login` redirects to Azure AD authorize URL with scopes: `openid profile email User.Read`
3. [ ] `GET /api/auth/sso/callback` exchanges authorization code for tokens, validates `id_token`
4. [ ] On successful callback, extracts `oid` (Azure Object ID), `email`, `displayName` from token claims
5. [ ] Looks up user by `azureId` field — if found, issues httpOnly JWT cookies (reuse `setAuthCookies()`)
6. [ ] If `azureId` not found, delegates to JIT provisioning (Story 13.2)
7. [ ] SSO configuration via env vars: `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_REDIRECT_URI`, `AZURE_SSO_SCOPES`
8. [ ] All existing password-based login tests pass (0 regression)
9. [ ] New tests: SSO callback happy path, invalid code, expired token, missing oid claim
10. [ ] Azure AD App Registration updated: redirect URI added, `openid`/`profile`/`email` scopes configured

## Tasks / Subtasks

- [ ] Task 1: Install `@azure/msal-node` + configure MSAL Confidential Client (AC: #1, #7)
  - [ ] Add `@azure/msal-node` to backend dependencies
  - [ ] Create `AzureAdConfig` — reads `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET`, `AZURE_SSO_REDIRECT_URI`, `AZURE_TENANT_ID`
  - [ ] Update `.env.example` with new SSO env vars
  - [ ] Register MSAL `ConfidentialClientApplication` in NestJS module
- [ ] Task 2: Create `AzureAdStrategy` (Passport strategy) (AC: #1)
  - [ ] Location: `src/modules/auth/strategies/azure-ad.strategy.ts`
  - [ ] Implement Authorization Code Flow with PKCE
  - [ ] Validate `id_token` claims: `oid`, `preferred_username`, `name`
  - [ ] Extract user info from token to `AzureAdProfile` interface
- [ ] Task 3: SSO login redirect endpoint (AC: #2)
  - [ ] `GET /api/auth/sso/login` → generate PKCE code verifier + challenge
  - [ ] Build Azure AD authorize URL with `response_type=code`, `scope`, `redirect_uri`, `code_challenge`
  - [ ] Store `code_verifier` in session/state param (signed, short-lived)
  - [ ] Return 302 redirect to Azure AD
- [ ] Task 4: SSO callback endpoint (AC: #3, #4, #5, #6)
  - [ ] `GET /api/auth/sso/callback` — receive `code` + `state` from Azure AD
  - [ ] Exchange code for tokens via MSAL `acquireTokenByCode()`
  - [ ] Validate state/nonce to prevent CSRF
  - [ ] Extract `oid`, `email`, `displayName` from `id_token` claims
  - [ ] Lookup user by `azureId` field in DB
  - [ ] If found: issue JWT cookies via `setAuthCookies()`, redirect to frontend
  - [ ] If not found: delegate to JIT provisioning (Story 13.2), then redirect
  - [ ] Error handling: Azure AD denied, invalid code, expired token → redirect to `/login?error=sso_failed`
- [ ] Task 5: Add `azureId` field to User model if not present (AC: #5)
  - [ ] Check Prisma schema for `azureId` on User model
  - [ ] If missing: add optional `azureId String? @unique` field + migration
  - [ ] Ensure M365 sync already populates this field (verify)
- [ ] Task 6: Update Auth Module wiring (AC: #1)
  - [ ] Register `AzureAdStrategy` in `AuthModule`
  - [ ] Add SSO routes to `AuthController`
  - [ ] Mark SSO endpoints as `@Public()` (no JWT required)
  - [ ] Add rate limiting via `@Throttle()` on SSO endpoints
- [ ] Task 7: Update Azure AD App Registration (AC: #10)
  - [ ] Add redirect URI: `http://localhost:3000/api/auth/sso/callback` (dev)
  - [ ] Add scopes: `openid`, `profile`, `email`, `User.Read`
  - [ ] Document in `docs/setup/azure-ad-app-setup.md`
- [ ] Task 8: Tests (AC: #8, #9)
  - [ ] Unit tests: AzureAdStrategy validate(), token extraction
  - [ ] Integration tests: SSO callback happy path (mocked MSAL)
  - [ ] Integration tests: invalid code → error response
  - [ ] Integration tests: expired token → error response
  - [ ] Regression: all existing auth tests pass

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

### Risk: Lesson 43 — API Response Contract Changes
SSO adds new endpoints but does NOT modify existing response contracts. However, any changes to User model fields must be verified against E2E test helpers.
