# Dev Prompt — Story 11.25: Cookie Auth Hardening

## Agent Activation

You are the Dev Agent (Amelia). Load `_bmad/bmm/agents/dev.md` persona.

**Story File:** `gcredit-project/docs/sprints/sprint-11/11-25-cookie-auth-hardening.md`  
**Branch:** `sprint-11/security-quality-hardening`  
**communication_language:** English (code comments and commits in English; Chinese in story file preserved as-is)

---

## Critical Context

### What Happened

Sprint 11 Story 11.6 migrated JWT authentication from `Authorization: Bearer` header to httpOnly cookies. The core auth path works correctly (`apiFetch` → `credentials: 'include'` → `JwtStrategy` cookie extraction → `setCookie` in Auth Controller).

However, a comprehensive audit on 2026-02-15 uncovered **8 issues** across 3 severity levels where the migration is incomplete or leaking. Left unfixed, these create functional auth failures (Teams 401), security leaks (tokens in response body), and architectural inconsistencies.

### Current Codebase State

- **Backend:** NestJS 11.x, Prisma 6.19.2, PostgreSQL 16, Port 3000
- **Frontend:** React 19 + Vite, React Query, Tailwind CSS, Port 5173
- **Tests:** BE 750 + FE 551 = 1,301 total (all passing)
- **TypeScript:** 0 errors (`npx tsc --noEmit`)
- **ESLint:** Clean (FE and BE)
- **Auth:** httpOnly cookies via `apiFetch` wrapper (`credentials: 'include'`); `JwtStrategy` reads `req.cookies.access_token` with `Authorization: Bearer` fallback

### Key Architecture Patterns

1. **API calls:** Frontend uses `apiFetch()` from `frontend/src/lib/apiFetch.ts` — never raw `fetch` or `axios`
2. **Cookie transport:** `Set-Cookie` in auth controller via `setAuthCookies()` — `access_token` (path `/api`, 15min), `refresh_token` (path `/api/auth`, 7d)
3. **Auth guard:** Global `JwtAuthGuard` on all routes; `@Public()` decorator opts out; `JwtStrategy` extracts token from cookie first, Bearer header fallback
4. **Cookie options:** `httpOnly: true, secure: isProduction, sameSite: 'lax'`
5. **State management:** Zustand `authStore` reads only `data.user` from auth responses — does NOT read token fields

---

## Task Execution Order (MUST follow in sequence)

### Task 1: Fix `JwtAuthGuard` Cookie Support in `@Public()` Routes (AC-C1) ~30min

**File:** `backend/src/common/guards/jwt-auth.guard.ts`

**Current code (L31-42):**
```typescript
if (isPublic) {
  // Still try to authenticate if a Bearer token is present (best-effort)
  const request = context.switchToHttp().getRequest<Request>();
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }
  }
  return true;
}
```

**Problem:** Only checks `Authorization` header; since frontend sends cookies (not Bearer headers), `req.user` is **always undefined** on `@Public()` routes, even for logged-in users.

**What to do:**
1. Add cookie token check alongside Bearer header check:
   ```typescript
   if (isPublic) {
     const request = context.switchToHttp().getRequest<Request>();
     const authHeader = request.headers.authorization;
     const cookieToken = request.cookies?.access_token;
     if (authHeader?.startsWith('Bearer ') || cookieToken) {
       // Let JwtStrategy handle extraction (cookie first, Bearer fallback)
       const result = super.canActivate(context);
       if (result instanceof Promise) {
         return result.then(() => true).catch(() => true);
       }
     }
     return true;
   }
   ```
2. Update the JSDoc comment to reflect cookie support
3. **Write unit tests** for `JwtAuthGuard`:
   - `@Public()` route + cookie token → `req.user` populated (best-effort), request passes
   - `@Public()` route + Bearer header → same behavior (backward compat)
   - `@Public()` route + no token → request passes, `req.user` undefined
   - `@Public()` route + invalid cookie → request passes, `req.user` undefined (no 401)
   - Non-public route + valid cookie → `super.canActivate()` called
4. Run `cd gcredit-project/backend; npx jest --forceExit` — all tests must pass

**AC:** `@Public()` routes correctly populate `req.user` when httpOnly cookie is present.

---

### Task 2: Fix `clearCookie()` Parameter Consistency (AC-M3) ~15min

**File:** `backend/src/modules/auth/auth.controller.ts`

**Current code (L108-109):**
```typescript
res.clearCookie('access_token', { path: '/api' });
res.clearCookie('refresh_token', { path: '/api/auth' });
```

**Problem:** `clearCookie` only passes `path` but omits `httpOnly`, `secure`, `sameSite`. Browsers require these attributes to **exactly match** those used in `setCookie` — otherwise the cookie is NOT cleared. In production (`secure: true`), logout will silently fail to clear cookies.

**What to do:**
1. Extract cookie option constants to avoid duplication with `setAuthCookies()`:
   ```typescript
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
2. Refactor `setAuthCookies()` to use `getCookieOptions()`:
   ```typescript
   private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
     res.cookie('access_token', accessToken, {
       ...this.getCookieOptions('/api'),
       maxAge: 15 * 60 * 1000,
     });
     res.cookie('refresh_token', refreshToken, {
       ...this.getCookieOptions('/api/auth'),
       maxAge: 7 * 24 * 60 * 60 * 1000,
     });
   }
   ```
3. Update `logout()` to use same options:
   ```typescript
   res.clearCookie('access_token', this.getCookieOptions('/api'));
   res.clearCookie('refresh_token', this.getCookieOptions('/api/auth'));
   ```
4. **Write/update unit tests** verifying `clearCookie` is called with full options
5. Run BE tests

**AC:** `clearCookie` parameters exactly match `setCookie` parameters. Logout works correctly under `secure: true`.

---

### Task 3: Remove Tokens from Login/Register/Refresh Response Body (AC-M4) ~30min

**Files:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.controller.ts`

**Current code — `auth.service.ts` `register()` L93-97:**
```typescript
return {
  accessToken,
  refreshToken,
  user: userProfile,
};
```

**Same pattern in `login()` L206-210 and `refreshAccessToken()` L406-409.**

**Problem:** The httpOnly cookie migration was designed to prevent JavaScript access to tokens. But the response body **still returns tokens** — an XSS vector that completely undermines httpOnly protection. The "Dual-write" comment in the controller confirms this is a conscious transition-period decision that should now be closed.

**Frontend impact:** Already verified — `authStore.ts` only reads `data.user` from login/register responses, and `refresh()` endpoint is called with empty POST body (cookie sent automatically). No frontend code reads `accessToken` or `refreshToken` from responses.

**What to do:**
1. In `auth.service.ts` — `register()` (around L93):
   - Change return value from `{ accessToken, refreshToken, user }` to `{ accessToken, refreshToken, user }` internally
   - **Do NOT remove tokens from service return** — the controller still needs them for `setAuthCookies()`
   
2. In `auth.controller.ts` — Restructure controller methods to separate cookie-setting from response:
   ```typescript
   // login()
   async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
     const result = await this.authService.login(dto);
     this.setAuthCookies(res, result.accessToken, result.refreshToken);
     // Only return user profile — tokens are in httpOnly cookies only
     return { user: result.user };
   }
   ```
   Apply same pattern to `register()` and `refresh()`.

3. Remove the `// Dual-write: body still returns tokens (transition period)` comment.

4. For `refresh()` — current return is `{ accessToken, refreshToken }`. Change to:
   ```typescript
   async refresh(...) {
     const result = await this.authService.refreshAccessToken(refreshToken);
     this.setAuthCookies(res, result.accessToken, result.refreshToken);
     return { message: 'Token refreshed' };
   }
   ```

5. **Write/update unit tests:**
   - Login response should contain `user` object but NOT `accessToken` or `refreshToken`
   - Register response same
   - Refresh response should NOT contain tokens
6. Run BE tests + verify FE login/register/refresh flow works (FE only reads `data.user`)

**AC:** `POST /auth/login`, `/auth/register`, `/auth/refresh` responses contain **no** token fields. Tokens only travel via `Set-Cookie` headers.

---

### Task 4: Migrate `VerifyBadgePage` from `axios` to `apiFetch` (AC-M5) ~20min

**File:** `frontend/src/pages/VerifyBadgePage.tsx`

**Current code (L20-21, L44):**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '../lib/apiConfig';
// ...
const response = await axios.get(`${API_BASE_URL}/verify/${verificationId}`);
```

**Problem:** Direct `axios` usage bypasses `apiFetch` wrapper — misses `credentials: 'include'`, and won't benefit from any future global interceptors (error handling, logging). This is the **only** file in the frontend that imports `axios`.

**What to do:**
1. Replace imports:
   ```typescript
   // Remove:
   import axios from 'axios';
   import { API_BASE_URL } from '../lib/apiConfig';
   // Add:
   import { apiFetch } from '../lib/apiFetch';
   ```

2. Replace the API call:
   ```typescript
   // Before:
   const response = await axios.get(`${API_BASE_URL}/verify/${verificationId}`);
   const apiData = response.data;

   // After:
   const response = await apiFetch(`/verify/${verificationId}`);
   if (!response.ok) {
     throw new Error(`Verification failed: ${response.status}`);
   }
   const apiData = await response.json();
   ```

3. Update error handling — `axios` throws on non-2xx, `apiFetch` returns the response. Adjust the `catch` block accordingly.

4. Check if `axios` is still used anywhere else in the frontend:
   ```bash
   grep -r "from 'axios'" gcredit-project/frontend/src/
   ```
   If `VerifyBadgePage` was the last consumer, consider removing `axios` from `package.json` dependencies (but only if no other file uses it).

5. **Update/verify tests** — ensure `VerifyBadgePage` tests pass with the new fetch call
6. Run `cd gcredit-project/frontend; npx vitest run`

**AC:** No `axios` import in `VerifyBadgePage.tsx`. Uses `apiFetch` with `credentials: 'include'`.

---

### Task 5: Teams Action Controller Auth Fix (AC-C2) ~1.5-2h

**File:** `backend/src/microsoft-graph/teams/teams-action.controller.ts`

**Current code (L44-45):**
```typescript
@Controller('api/teams/actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsActionController {
```

**Problem:** Teams Adaptive Card action callbacks are **server-to-server** HTTP calls from Microsoft Teams infrastructure to our backend. They do NOT carry browser cookies or user JWT tokens. With `@UseGuards(JwtAuthGuard)`, every Teams callback returns 401.

**Current Teams integration status:** The Teams module exists for badge notification cards (Story 7.4). The claim-badge action button in Teams cards triggers a POST to `/api/teams/actions/claim-badge`.

**What to do:**

1. **Evaluate current Teams integration completeness:** Check if Teams is configured to send any form of auth (Bot Framework token, webhook secret, etc.):
   ```bash
   grep -r "TEAMS_WEBHOOK_SECRET\|BOT_FRAMEWORK\|MICROSOFT_APP_ID" gcredit-project/backend/
   ```

2. **Recommended approach — `@Public()` + action token validation:**
   Since claim actions already use a `claimToken` parameter in the request body (validated by `BadgeIssuanceService.claimBadge()`), the security model is:
   - The `claimToken` is a one-time-use cryptographic token embedded in the Teams card
   - Knowing the `claimToken` is sufficient to authorize the claim action
   - This matches the existing `POST /api/badges/claim` public endpoint pattern
   
   Implementation:
   ```typescript
   @Controller('api/teams/actions')
   export class TeamsActionController {
     // Remove class-level @UseGuards(JwtAuthGuard) and @ApiBearerAuth()
     
     @Public()
     @Post('claim-badge')
     @HttpCode(HttpStatus.OK)
     @ApiOperation({ summary: 'Claim badge from Teams notification (public, token-validated)' })
     async claimBadge(@Body() dto: ClaimBadgeActionDto) {
       // claimToken in dto body provides authentication
       // BadgeIssuanceService.claimBadge() validates the one-time token
       ...
     }
   }
   ```

3. **Update Swagger documentation:** Replace `@ApiBearerAuth()` on the controller. Add descriptive note that this endpoint uses action token validation, not JWT auth.

4. **Add decorator metadata guard test** (following the pattern from Story 11.24 commit `2735e42`):
   ```typescript
   describe('Decorator metadata guards', () => {
     it('POST /claim-badge should be @Public()', () => {
       const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, TeamsActionController.prototype.claimBadge);
       expect(isPublic).toBe(true);
     });
   });
   ```

5. **Write/update integration test:**
   - POST `/api/teams/actions/claim-badge` without JWT → should succeed (not 401) if `claimToken` is valid
   - POST `/api/teams/actions/claim-badge` with invalid `claimToken` → appropriate error (400/404)
6. Run BE tests

**AC:** Teams "Claim Badge" callback works without JWT/cookie auth. Endpoint is protected by one-time claim token.

---

### Task 6: Test Code Cleanup (AC-L6, AC-L7) ~30min

**Files:**
- `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` (L118)
- `frontend/src/pages/BulkIssuancePage.test.tsx` (L52)
- `backend/test/helpers/test-setup.ts` (L131-153)

**What to do:**

1. **Remove `localStorage` token mocks** from frontend tests:
   - `BulkPreviewPage.test.tsx` L118: Remove `(window.localStorage.getItem as ...).mockReturnValue('test-token')` — this is dead code from the Bearer-header auth era
   - `BulkIssuancePage.test.tsx` L52: Same removal
   - Verify these tests still pass without the mock (they should — `apiFetch` uses cookies, not localStorage)

2. **E2E test helper — Bearer → Cookie (LOW PRIORITY, EVALUATE ONLY):**
   - `test-setup.ts` `authRequest()` (L131-153) uses `.set('Authorization', 'Bearer ...')` for all E2E tests
   - `JwtStrategy` has Bearer fallback, so E2E tests still work
   - **For this story:** Add a `// TODO: Migrate to cookie-based auth when Bearer fallback is removed` comment — do NOT refactor 90+ E2E tests now
   - Optionally: Add **one** E2E test that validates the cookie auth path (login via API → extract `Set-Cookie` → use cookie jar for subsequent requests) as a smoke test

3. **Swagger auth documentation update:**
   - In `backend/src/main.ts` (L272-280), add `.addCookieAuth()` alongside existing `.addBearerAuth()`:
     ```typescript
     .addBearerAuth(
       { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter your JWT token' },
       'JWT-auth',
     )
     .addCookieAuth('access_token', {
       type: 'apiKey',
       in: 'cookie',
       name: 'access_token',
       description: 'httpOnly JWT cookie (set automatically by login/register)',
     })
     ```
   - Do NOT mass-replace `@ApiBearerAuth()` across all controllers — that would be a large scope change. Just add the alternative in Swagger config.

4. Run full test suite (BE + FE)

**AC:** No `localStorage` token mocks remain in frontend tests. Swagger documents cookie auth option.

---

## Post-Implementation Checklist

After ALL 6 tasks are complete:

1. **TypeScript check:** `cd gcredit-project/backend; npx tsc --noEmit` — 0 errors
2. **TypeScript check (FE):** `cd gcredit-project/frontend; npx tsc --noEmit -p tsconfig.app.json` — 0 errors
3. **Backend tests:** `cd gcredit-project/backend; npx jest --forceExit` — all pass
4. **Frontend tests:** `cd gcredit-project/frontend; npx vitest run` — all pass
5. **ESLint BE:** `cd gcredit-project/backend; npm run lint` — clean
6. **ESLint FE:** `cd gcredit-project/frontend; npm run lint` — clean
7. **Commit:** Single commit with message:
   ```
   feat(Story-11.25): Cookie Auth Hardening — complete httpOnly migration

   Critical:
   - C-1: JwtAuthGuard @Public() routes now check cookie token (best-effort user identification)
   - C-2: Teams Action Controller switched to @Public() + claim token validation

   Medium:
   - M-3: clearCookie() parameters match setCookie() (httpOnly, secure, sameSite, path)
   - M-4: Login/register/refresh responses no longer leak tokens in body
   - M-5: VerifyBadgePage migrated from axios to apiFetch

   Low:
   - L-6: Removed localStorage token mocks from frontend tests
   - L-7: E2E test cookie migration documented as TODO
   - L-8: Swagger addCookieAuth() added alongside addBearerAuth()
   ```
8. **Mark story as complete** in the story file: `Status: done`

---

## Key File References

| File | Purpose |
|------|---------|
| `project-context.md` | 📖 Single Source of Truth — read first |
| `gcredit-project/docs/sprints/sprint-11/11-25-cookie-auth-hardening.md` | Story file with full issue details |
| `backend/src/common/guards/jwt-auth.guard.ts` | Task 1: @Public() cookie support |
| `backend/src/modules/auth/auth.controller.ts` | Task 2 + 3: clearCookie fix + token removal |
| `backend/src/modules/auth/auth.service.ts` | Task 3: service return values |
| `frontend/src/pages/VerifyBadgePage.tsx` | Task 4: axios → apiFetch |
| `frontend/src/lib/apiFetch.ts` | Reference: apiFetch wrapper with `credentials: 'include'` |
| `frontend/src/stores/authStore.ts` | Reference: confirm it only reads `data.user` (no token fields) |
| `backend/src/microsoft-graph/teams/teams-action.controller.ts` | Task 5: Teams auth fix |
| `backend/src/main.ts` | Task 6: Swagger addCookieAuth() |
| `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` | Task 6: localStorage mock cleanup |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | Task 6: localStorage mock cleanup |
| `backend/test/helpers/test-setup.ts` | Task 6: E2E auth helper (evaluate only) |

## Important Constraints

- **DO NOT** change Prisma schema — all fixes are at guard/controller/component level
- **DO NOT** refactor all E2E tests to cookie auth — too large a scope. Add TODO comment only.
- **DO NOT** mass-replace `@ApiBearerAuth()` decorators across all controllers — just add `addCookieAuth()` to Swagger config
- **DO NOT** break existing 1,301 tests
- **DO** keep Bearer fallback in `JwtStrategy` — E2E tests and potential API consumers depend on it
- **DO** use `apiFetch` for any new/modified frontend API calls (never raw `fetch` or `axios`)
- **DO** follow existing code patterns and add Story/AC traceability comments
