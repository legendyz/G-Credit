# Dev Prompt: Story 13.1 — Azure AD SSO Strategy + Callback Endpoints

**Story:** 13.1  
**Sprint:** 13  
**Priority:** HIGH (🔴 Security-Critical)  
**Approach:** TDD — write tests first, then implement  
**Estimated:** 10-12h  
**Status:** ready-for-dev

---

## Objective

Implement Azure AD Single Sign-On using OAuth 2.0 Authorization Code Flow with PKCE. After this story, M365 users can authenticate via Azure AD, receive the same httpOnly JWT cookies as password login, and M365 users are **blocked** from using password login.

**Key principle:** SSO issues the same cookie pair (`access_token` + `refresh_token`) as password login. The frontend does NOT need to know which auth method was used.

---

## Current Architecture (What Already Exists)

### Auth Module (`src/modules/auth/`)
- **auth.controller.ts** — endpoints: `POST /api/auth/login`, `/register`, `/refresh`, `/logout`, `/profile`
- **auth.service.ts** — `login()` validates password + calls `m365SyncService.syncUserFromGraph()` for M365 users
- **strategies/jwt.strategy.ts** — the ONLY Passport strategy. Extracts JWT from `access_token` cookie (fallback: Bearer header)
- **auth.module.ts** — imports: `PrismaModule`, `PassportModule`, `EmailModule`, `M365SyncModule`, `JwtModule`

### Cookie Handling (`auth.controller.ts`)
```typescript
// setAuthCookies() — private method in AuthController
private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    ...this.getCookieOptions('/api'),
    maxAge: 15 * 60 * 1000,  // 15 min
  });
  res.cookie('refresh_token', refreshToken, {
    ...this.getCookieOptions('/api/auth'),
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  });
}

private getCookieOptions(path: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path,
  };
}
```

### JWT Payload Shape
```typescript
const payload = { sub: user.id, email: user.email, role: user.role };
```

### User Model (Prisma) — Relevant Fields
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  department    String?
  role          UserRole  @default(EMPLOYEE)
  azureId       String?   @unique   // ← Already exists! M365 Azure Object ID
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastSyncAt      DateTime?
  managerId     String?
  // ... (relations omitted)
  @@map("users")
}
```

**Important:** `azureId` field already exists with `@unique` index. No migration needed for 13.1.

### Existing M365 Integration
- **Graph Token Provider** (`src/microsoft-graph/services/graph-token-provider.service.ts`) — uses **Client Credentials** flow (`@azure/identity`) for app-only Graph API access
- **M365 Sync Service** (`src/m365-sync/m365-sync.service.ts`) — has `syncUserFromGraph()` for login-time mini-sync (used in password login already)
- **Env vars:** `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — for Graph API (Client Credentials)
- **New SSO env vars** (already in `.env`): `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET`, `AZURE_SSO_REDIRECT_URI`, `AZURE_SSO_SCOPES`

### Dual OAuth Coexistence
| Flow | Purpose | Library | Env Vars |
|------|---------|---------|----------|
| **Client Credentials** (existing) | App-only Graph API (email, Teams, sync) | `@azure/identity` | `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` |
| **Authorization Code + PKCE** (NEW) | User SSO login | `@azure/msal-node` | `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET` |

Both flows currently reuse the same App Registration (`ceafe2e0`), but MSAL and `@azure/identity` are separate libraries.

### Existing Password Login Flow (`auth.service.ts` → `login()`)
```
1. Find user by email (case-insensitive)
2. Check isActive
3. Check account lockout (lockedUntil)
4. Guard: empty passwordHash → reject (M365 users without local password)
5. bcrypt.compare(password, passwordHash)
6. If M365 user (user.azureId): call m365SyncService.syncUserFromGraph()
7. Generate JWT payload { sub, email, role } → sign access + refresh tokens
8. Store refresh token in DB
9. setAuthCookies() on Response
10. Return { user }
```

---

## What to Implement

### Task 1: Install `@azure/msal-node` + MSAL Configuration

```bash
cd gcredit-project/backend
npm install @azure/msal-node
```

Create `src/modules/auth/config/azure-ad.config.ts`:
- Read from env: `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_CLIENT_SECRET`, `AZURE_SSO_REDIRECT_URI`, `AZURE_TENANT_ID`, `AZURE_SSO_SCOPES`
- Export a factory that creates MSAL `ConfidentialClientApplication` config
- Validate all required vars are present (warn if missing, don't crash — allow non-SSO deployments)

Update `.env.example` — SSO vars are already there (verified).

### Task 2: Create `AzureAdStrategy` (Passport Strategy)

**File:** `src/modules/auth/strategies/azure-ad.strategy.ts`

This is NOT a classic Passport strategy (no `passport-azure-ad` package). Instead, implement the OAuth flow manually using `@azure/msal-node`:

1. Create an injectable service `AzureAdSsoService` (or integrate into `AuthService`)
2. **`generateAuthUrl()`** — builds Azure AD authorize URL:
   - Scopes: `openid profile email User.Read`
   - Response type: `code`
   - PKCE: generate `codeVerifier` + `codeChallenge`
   - State: signed random string for CSRF protection
   - Return: `{ authUrl, codeVerifier, state }`
3. **`handleCallback(code, codeVerifier)`** — exchanges code for tokens:
   - Call MSAL `acquireTokenByCode({ code, scopes, redirectUri, codeVerifier })`
   - Extract from `AuthenticationResult`: `account.homeAccountId`, `idTokenClaims.oid`, `idTokenClaims.preferred_username`, `idTokenClaims.name`
   - Return: `AzureAdProfile { oid, email, displayName }`

### Task 3: SSO Login Redirect Endpoint

**Route:** `GET /api/auth/sso/login`  
**Decorator:** `@Public()`, `@Throttle({ default: { ttl: 60000, limit: 10 } })`

Flow:
1. Call `generateAuthUrl()`
2. Store `codeVerifier` + `state` — options:
   - **Option A (recommended):** Encode in a short-lived signed cookie (`sso_state`, httpOnly, 5min max-age)
   - **Option B:** Server-side session/cache (adds complexity)
3. Return `302 Redirect` to Azure AD authorize URL

### Task 4: SSO Callback Endpoint

**Route:** `GET /api/auth/sso/callback`  
**Decorator:** `@Public()`, `@Throttle({ default: { ttl: 60000, limit: 10 } })`

Flow:
1. Receive `code` + `state` from Azure AD query params
2. Validate `state` against stored state (from cookie or session) — prevent CSRF
3. Retrieve `codeVerifier` from stored state
4. Call `handleCallback(code, codeVerifier)` → get `AzureAdProfile { oid, email, displayName }`
5. Look up user by `azureId = oid`:
   - **Found + active:** Generate JWT tokens (same payload: `{ sub, email, role }`), set cookies, redirect to `FRONTEND_URL`
   - **Found + inactive:** Redirect to `/login?error=account_disabled`
   - **Not found:** Delegate to JIT provisioning (Story 13.2) — for NOW, return error: `/login?error=sso_no_account` (13.2 will replace this)
6. Update `lastLoginAt` on successful login
7. Error handling:
   - Invalid/expired code → redirect to `/login?error=sso_failed`
   - Azure AD denied (user cancelled) → redirect to `/login?error=sso_cancelled`
   - Missing oid claim → redirect to `/login?error=sso_invalid_token`

**On success redirect:** `{FRONTEND_URL}/sso/callback?success=true` (or just `FRONTEND_URL` — frontend detects auth via cookie presence)

### Task 5: Verify `azureId` Field

Already confirmed: `azureId String? @unique` exists in schema.prisma with `@@index([azureId])`.  
**No migration needed.** Just verify lookup works: `prisma.user.findUnique({ where: { azureId: oid } })`.

### Task 6: Update Auth Module Wiring

In `auth.module.ts`:
- Import `ConfigModule` (if not already)
- Register new `AzureAdSsoService` (or whatever you name it) in `providers`
- Add new SSO controller endpoints to `AuthController` (same controller, new methods)

### Task 7: Azure AD App Registration

Already configured by LegendZhu. Redirect URI `http://localhost:3000/api/auth/sso/callback` is set. Scopes `openid profile email User.Read` are configured.

**Document in:** `docs/setup/azure-ad-app-setup.md` (create if not exists) — brief note about SSO callback URI configuration.

### Task 8: Block Password Login for M365 Users (DEC-011-13)

**In `auth.service.ts` → `login()` method**, add a check **BEFORE** the `bcrypt.compare()` call:

```typescript
// Current flow (simplified):
// 1. Find user by email
// 2. Check isActive
// 3. Check lockout
// 4. Guard: empty passwordHash
// 5. bcrypt.compare() ← ADD CHECK BEFORE THIS

// ADD THIS — after lockout check, before empty passwordHash guard:
if (user.azureId) {
  throw new UnauthorizedException(
    'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
  );
}
```

**Current code context** (lines ~130-145 in auth.service.ts):
```typescript
    // 2.5. Check if account is locked
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Story 12.3a AC #32: Empty passwordHash guard (M365 users with no local password)
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
```

Insert the `azureId` check between the lockout check and the empty passwordHash guard.

**Note:** Use a **different error message** than "Invalid credentials" — the frontend should show a helpful message directing users to SSO. Consider returning a specific error code or message the frontend can detect.

### Task 9: Tests (TDD)

Write tests FIRST. Mock `@azure/msal-node` — never call Azure AD in tests.

#### Unit Tests: `azure-ad-sso.service.spec.ts`
1. `generateAuthUrl()` → returns valid URL with correct scopes, redirect_uri, state, PKCE challenge
2. `handleCallback()` happy path → returns `AzureAdProfile` with oid, email, displayName
3. `handleCallback()` with invalid code → throws appropriate error
4. `handleCallback()` with missing oid in claims → throws error
5. Configuration validation → warns when SSO env vars missing

#### Integration Tests: `auth.controller.sso.spec.ts` (or extend `auth.controller.spec.ts`)
6. `GET /api/auth/sso/login` → returns 302 redirect to Azure AD
7. `GET /api/auth/sso/callback` happy path (existing user with azureId) → sets cookies, redirects to frontend
8. `GET /api/auth/sso/callback` with non-existent azureId → redirects with error (until 13.2 adds JIT)
9. `GET /api/auth/sso/callback` with inactive user → redirects with account_disabled error
10. `GET /api/auth/sso/callback` invalid code → redirects with sso_failed error
11. `GET /api/auth/sso/callback` CSRF state mismatch → redirects with error

#### Unit Test: Password Login Block
12. `login()` with user that has `azureId` set → throws `UnauthorizedException` with SSO message (NOT "Invalid credentials")
13. `login()` with user that has `azureId = null` → proceeds normally (no regression)

#### Regression
14. All existing auth tests pass (run full `auth.service.spec.ts` + `auth.controller.spec.ts`)

---

## Environment Variables (Already Configured in `.env`)

```env
# Azure AD SSO (Sprint 13 - Authorization Code Flow)
AZURE_SSO_CLIENT_ID="ceafe2e0-73a9-46b6-a203-1005bfdda11f"
AZURE_SSO_CLIENT_SECRET="<your-client-secret>"
AZURE_SSO_REDIRECT_URI="http://localhost:3000/api/auth/sso/callback"
AZURE_SSO_SCOPES="openid profile email User.Read"

# Reuses existing tenant config:
AZURE_TENANT_ID="afc9fe8f-1d40-41fc-9906-e001e500926c"
```

---

## File Creation / Modification Map

| Action | File | Notes |
|--------|------|-------|
| **CREATE** | `src/modules/auth/config/azure-ad.config.ts` | MSAL config factory |
| **CREATE** | `src/modules/auth/services/azure-ad-sso.service.ts` | SSO flow logic (generateAuthUrl, handleCallback) |
| **CREATE** | `src/modules/auth/interfaces/azure-ad-profile.interface.ts` | `{ oid, email, displayName }` |
| **MODIFY** | `src/modules/auth/auth.controller.ts` | Add `GET /sso/login` + `GET /sso/callback` |
| **MODIFY** | `src/modules/auth/auth.service.ts` | Add `azureId` block in `login()` (Task 8) + add `ssoLogin()` method |
| **MODIFY** | `src/modules/auth/auth.module.ts` | Register `AzureAdSsoService` + `ConfigModule` |
| **CREATE** | `src/modules/auth/__tests__/azure-ad-sso.service.spec.ts` | Unit tests for SSO service |
| **MODIFY** | `src/modules/auth/__tests__/auth.controller.spec.ts` OR create new `auth.controller.sso.spec.ts` | Integration tests for SSO endpoints |
| **MODIFY** | existing `auth.service.spec.ts` | Add test for M365 user password login block |
| **CREATE** | `docs/setup/azure-ad-app-setup.md` | Documentation for Azure AD SSO setup |

---

## Patterns to Follow

### Decorator Pattern (from existing code)
```typescript
@Public()                                          // No JWT required
@Throttle({ default: { ttl: 60000, limit: 10 } }) // Rate limit
@Get('sso/login')
async ssoLogin(@Res() res: Response) { ... }
```

### Import Pattern
```typescript
import { Public } from '../../common/decorators/public.decorator';
```

### Error Logging Pattern
```typescript
this.logger.warn(`[SECURITY] SSO callback failed: ${error.message}`);
this.logger.log(`[SSO] User ${user.id} authenticated via Azure AD`);
```

### Cookie Pattern
Reuse `setAuthCookies()` from controller — SSO callback must go through the **controller** (not just service) to set cookies on the Response object.

---

## Critical Constraints

1. **Do NOT modify existing JWT payload shape** — `{ sub, email, role }` must stay the same
2. **Do NOT modify existing cookie names or paths** — `access_token` (path=/api) + `refresh_token` (path=/api/auth)
3. **Do NOT add `passport-azure-ad`** — use `@azure/msal-node` directly for cleaner control
4. **Do NOT call Azure AD in tests** — mock everything
5. **SSO callback MUST redirect** (302), not return JSON — browser-based OAuth flow
6. **PKCE is required** — Authorization Code Flow without PKCE is deprecated
7. **State parameter is required** — CSRF protection for OAuth callback
8. **M365 users with `azureId` MUST be blocked from password login** — different error message than "Invalid credentials"
9. **Frontend URL for redirects:** use `FRONTEND_URL` env var (`http://localhost:5173`)
10. **SSO should be optional** — if SSO env vars are missing, endpoints should return 503 (Service Unavailable), not crash the app

---

## Definition of Done

- [ ] `npm install @azure/msal-node` completed
- [ ] `GET /api/auth/sso/login` redirects to Azure AD with PKCE + state
- [ ] `GET /api/auth/sso/callback` exchanges code, finds user by azureId, sets JWT cookies, redirects to frontend
- [ ] If azureId not found → redirects to `/login?error=sso_no_account` (placeholder for 13.2 JIT)
- [ ] M365 users (having azureId) blocked from `POST /api/auth/login` password endpoint
- [ ] SSO config via env vars (no hardcoded values)
- [ ] All new code has unit + integration tests
- [ ] All existing auth tests pass (0 regression)
- [ ] No sensitive data in logs (no tokens, no secrets)
- [ ] Rate limiting on SSO endpoints

---

## Handoff Notes for Story 13.2

Story 13.2 (JIT User Provisioning) will replace the "sso_no_account" error path in the SSO callback with auto-user-creation logic. Design the callback to make this easy:
- Extract the "user not found" branch into a clearly separated section
- Pass the full `AzureAdProfile` to the JIT handler
- The JIT handler will create the user, then the callback continues with normal cookie-setting flow
