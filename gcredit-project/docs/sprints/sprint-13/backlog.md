# Sprint 13 Backlog

**Sprint Number:** Sprint 13  
**Sprint Goal:** Implement Azure AD SSO + Session Management hardening — enabling M365 enterprise login and robust session lifecycle for pilot deployment.  
**Target Version:** v1.3.0  
**Team Capacity:** Solo developer + AI agents  
**Sprint Lead:** LegendZhu  
**Branch:** `sprint-13/sso-session-management`

---

## Sprint Goal

Deliver enterprise-grade authentication (Azure AD SSO) and production-quality session management, making G-Credit pilot-ready for M365-integrated organizations. Secondary: unify remaining API client inconsistencies and remove dead dependencies.

**"M365 users can log in via SSO, sessions auto-expire on idle, and all API calls route through a resilient centralized client."**

**Success Criteria:**
- [ ] M365 users can log in via "Sign in with Microsoft" button (Azure AD OAuth 2.0 Authorization Code Flow)
- [ ] First-time SSO users automatically provisioned (JIT) with correct role/department from Graph API
- [ ] Returning SSO users get login-time mini-sync (profile/role/manager refresh)
- [ ] Login page shows dual entry: SSO button + password form (DEC-001 Option A)
- [ ] Password login preserved for non-M365 users (DEC-002: retain for pilot)
- [ ] Global 401 interceptor auto-refreshes tokens and retries failed requests
- [ ] Token refresh queue prevents parallel refresh storms (multiple 401s → single refresh)
- [ ] 30-minute idle timeout with 5-minute warning modal → auto logout
- [ ] `axios` dependency removed, all API calls go through `apiFetch()`
- [ ] All existing tests pass + new tests for Sprint 13 features

---

## Sprint Capacity

### Velocity Reference
| Sprint | Estimated | Actual | Accuracy | Type |
|--------|-----------|--------|----------|------|
| Sprint 9 | 51h | 37h | 73% | Bulk + TD |
| Sprint 10 | 63h | ~72h | 87% | Release |
| Sprint 11 | 60h | ~65h | 92% | Hardening (25 stories) |
| Sprint 12 | 67h | ~60h | 90% | Management UIs (8 stories) |
| **Sprint 13** | **50-60h** | TBD | Target: >85% | SSO + Session |

### Capacity Allocation
| Category | Hours (Est.) | Notes |
|----------|-------------|-------|
| **FR27: Azure AD SSO** | 20-28h | Backend strategy + endpoints + JIT + frontend login page |
| **FEAT-007: Session Management** | 16-20h | 401 interceptor + refresh queue + idle timeout + UI |
| **P1-3: API Client Cleanup** | 3-4h | Remove axios, inline → hooks migration |
| **UAT + Buffer** | 6-8h | Integration testing, edge cases |
| **TOTAL** | **45-60h** | |

---

## Wave Structure

### Wave 1: Azure AD SSO — Backend (Stories 13.1 — 13.3)
*Focus: OAuth 2.0 Authorization Code flow, JIT provisioning, login-time sync*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 13.1 | Azure AD SSO Strategy + Callback Endpoints | HIGH | 10-12h | — |
| 13.2 | JIT User Provisioning on First SSO Login | HIGH | 6-8h | 13.1 |
| 13.3 | Login-Time Mini-Sync for Returning SSO Users | HIGH | 4-6h | 13.1 |

**Parallelization:** 13.1 first (foundation), then 13.2 + 13.3 can be done sequentially (share same SSO callback logic).

### Wave 2: Azure AD SSO — Frontend (Story 13.4)
*Focus: Login page dual-entry UX, SSO callback handling*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 13.4 | Login Page Dual Entry + SSO Redirect Flow | HIGH | 6-8h | 13.1 |

**Note:** Can start frontend shell/layout before backend is complete, but integration requires 13.1 endpoints.

### Wave 3: Session Management (Stories 13.5 — 13.7)
*Focus: 401 interceptor, token refresh queue, idle timeout*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 13.5 | Global 401 Interceptor + Token Refresh Queue | HIGH | 8-10h | — |
| 13.6 | Idle Timeout with Warning Modal | HIGH | 6-8h | — |
| 13.7 | API Client Cleanup (Remove axios + Inline Migrations) | MEDIUM | 3-4h | 13.5 |

**Parallelization:** 13.5 and 13.6 are independent — can run in parallel. 13.7 depends on 13.5 (interceptor must exist before finalizing client).

### Wave 4: Integration Testing + UAT (Story 13.8)
*Focus: End-to-end SSO flow, session lifecycle, regression*

| # | Story | Priority | Est | Depends On |
|---|-------|----------|-----|------------|
| 13.8 | Sprint 13 Integration Testing + UAT | HIGH | 6-8h | 13.1–13.7 all complete |

---

## User Stories

### Wave 1: Azure AD SSO — Backend

#### Story 13.1: Azure AD SSO Strategy + Callback Endpoints
**Priority:** HIGH  
**Estimate:** 10-12h  
**Status:** Done  

**As a** system administrator,  
**I want** M365 users to authenticate via Azure AD Single Sign-On,  
**So that** employees can log in with their existing corporate credentials without a separate password.

**Acceptance Criteria:**
1. New `AzureAdStrategy` registered in Passport using `@azure/msal-node` (Authorization Code Flow with PKCE)
2. `GET /api/auth/sso/login` redirects to Azure AD authorize URL with scopes: `openid profile email User.Read`
3. `GET /api/auth/sso/callback` exchanges authorization code for tokens, validates `id_token`
4. On successful callback, extracts `oid` (Azure Object ID), `email`, `displayName` from token claims
5. Looks up user by `azureId` field in database — if found, issues httpOnly JWT cookies (same `setAuthCookies()` as password login)
6. If `azureId` not found, delegates to JIT provisioning (Story 13.2)
7. SSO configuration via environment variables: `AZURE_SSO_CLIENT_ID`, `AZURE_SSO_REDIRECT_URI`, `AZURE_SSO_SCOPES`
8. All existing password-based login tests remain passing (no regression)
9. New tests: SSO callback happy path, invalid code, expired token, missing oid claim
10. Azure AD App Registration updated: redirect URI added, `openid`/`profile`/`email` scopes configured

**Technical Notes:**
- Existing `GraphTokenProviderService` uses **Client Credentials** flow (app-only). SSO needs **Authorization Code** flow (user-delegated). Both coexist — different OAuth grants for different purposes.
- Reuse existing `setAuthCookies()` helper from `auth.service.ts` for consistent cookie handling.
- Consider MSAL Confidential Client Application (`@azure/msal-node`) for server-side code exchange.
- Azure Tenant: `2wjh85.onmicrosoft.com` (ID: `afc9fe8f-1d40-41fc-9906-e001e500926c`).
- May reuse same App Registration `ceafe2e0-73a9-46b6-a203-1005bfdda11f` or create a dedicated SSO app — TBD during implementation.

**References:**
- ADR-011 Decisions: DEC-011-10 (login-time mini-sync), DEC-011-12 (JIT provisioning), DEC-011-13 (temp passwords replaced)
- PO Decision DEC-004: FR27 executes before FEAT-008 → confirmed (FEAT-008 already done)

---

#### Story 13.2: JIT User Provisioning on First SSO Login
**Priority:** HIGH  
**Estimate:** 6-8h  
**Status:** Done  

**As a** new M365 employee logging in for the first time,  
**I want** my account to be automatically created when I sign in with Microsoft,  
**So that** I don't need to register separately or wait for an admin to add me.

**Acceptance Criteria:**
1. When SSO callback finds no user with matching `azureId`, automatically create user record:
   - `azureId = token.oid`
   - `email = token.preferred_username` or `token.email`
   - `firstName`, `lastName` from token claims
   - `passwordHash = ''` (SSO-only user, cannot use password login)
   - `isActive = true`
   - Default `role = 'EMPLOYEE'`
2. Immediately after creation, invoke `syncUserFromGraph(userId)` to populate:
   - Department, job title from Graph API `GET /users/{azureId}`
   - Manager relationship from `GET /users/{azureId}/manager`
   - Role derivation from Security Group membership (Admin/Issuer groups)
3. Issue httpOnly JWT cookies after sync completes
4. If Graph API sync fails (e.g., permission issue), user is still created with default role — sync retries on next login
5. Support `INITIAL_ADMIN_EMAIL` env var (DEC-005): if JIT-provisioned user's email matches, set `role = 'ADMIN'` (bootstrap mechanism)
6. Tests: JIT happy path, JIT with sync failure fallback, admin bootstrap via env var, duplicate azureId prevention

**Technical Notes:**
- Reuse existing `M365SyncService.syncSingleUser()` logic (already calls Graph API for profile + memberOf + manager).
- ADR-011 DEC-011-12: "First SSO login → azureId not in DB → JIT create → syncUserFromGraph() → return JWT."
- Must handle race condition: two simultaneous first-logins for same azureId → use DB unique constraint on `azureId`.

---

#### Story 13.3: Login-Time Mini-Sync for Returning SSO Users
**Priority:** HIGH  
**Estimate:** 4-6h  
**Status:** Done  

**As a** returning M365 user,  
**I want** my profile, role, and manager to update automatically each time I log in via SSO,  
**So that** organizational changes (department move, promotion, new manager) are reflected in G-Credit.

**Acceptance Criteria:**
1. On SSO callback with existing `azureId` match, invoke `syncUserFromGraph(userId)` before issuing JWT
2. Parallel Graph API calls for efficiency: `GET /users/{azureId}`, `GET /users/{azureId}/memberOf`, `GET /users/{azureId}/manager`
3. Update user fields: `firstName`, `lastName`, `department`, `jobTitle`, `managerId`, `role` (if Security Group membership changed)
4. If mini-sync fails, still allow login with stale data (graceful degradation)
5. `lastLoginAt` updated on every SSO login
6. Tests: mini-sync updates department, mini-sync updates role from group change, mini-sync failure still logs in

**Technical Notes:**
- ADR-011 DEC-011-10/11: "On every login/token-refresh, perform single-user sync."
- Reuse `M365SyncService.syncSingleUser()` — same function used by JIT and manual sync.
- Consider adding `lastSyncedAt` timestamp to user model if not already present (for debugging/audit).

---

### Wave 2: Azure AD SSO — Frontend

#### Story 13.4: Login Page Dual Entry + SSO Redirect Flow
**Priority:** HIGH  
**Estimate:** 6-8h  
**Status:** Done  

**As a** user visiting the login page,  
**I want** to see both a "Sign in with Microsoft" button and a traditional email/password form,  
**So that** I can use my preferred authentication method.

**Acceptance Criteria:**
1. Login page displays prominent "Sign in with Microsoft" button (Microsoft brand guidelines: logo + text, white/dark variants)
2. Email/password form remains below SSO button with visual separator ("or sign in with email")
3. Clicking SSO button redirects to `GET /api/auth/sso/login` (backend handles Azure AD redirect)
4. SSO callback page (`/auth/sso/callback`) handles redirect, reads auth state, navigates to dashboard
5. Auth store updated: `loginViaSSO()` action that detects SSO callback and calls `validateSession()`
6. Loading state shown during SSO redirect/callback flow
7. Error handling: Azure AD login denied, callback error, network failure — all show user-friendly messages
8. Native `<input>` elements on LoginPage replaced with shadcn/ui `<Input>` component (P2-6 fix included)
9. Responsive: SSO button full-width on mobile, centered on desktop
10. Tests: SSO button renders, SSO redirect triggered, callback success, callback error, password login still works

**Technical Notes:**
- PO Decision DEC-001: Option A (dual entry) for pilot phase.
- PO Decision DEC-002: Password login retained for pilot.
- Microsoft SSO button should follow [Microsoft identity branding guidelines](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps).
- Fix P2-6 (native `<input>` → shadcn `<Input>`) as part of LoginPage rewrite.

---

### Wave 3: Session Management

#### Story 13.5: Global 401 Interceptor + Token Refresh Queue
**Priority:** HIGH  
**Estimate:** 8-10h  
**Status:** Done  

**As a** user with an active session,  
**I want** the app to automatically refresh my session when it expires mid-use,  
**So that** I don't lose my work or get unexpectedly logged out while working.

**Acceptance Criteria:**
1. `apiFetch()` enhanced with 401 response interceptor:
   - On 401 → automatically call `POST /api/auth/refresh`
   - On refresh success → retry the original request with new cookies
   - On refresh failure → call `authStore.logout()` + redirect to `/login`
2. Token refresh queue implemented:
   - If 3+ concurrent API calls all receive 401, only 1 refresh request is sent
   - Other calls wait (queued) for the refresh to complete
   - After refresh completes, all queued calls are retried
   - If refresh fails, all queued calls are rejected
3. Infinite retry loop prevention: max 1 retry per request (don't retry a retried request)
4. `POST /api/auth/refresh` and `POST /api/auth/logout` are excluded from interception (avoid circular refresh)
5. React Query `queryClient` default `retry` config updated to work with interceptor (avoid double-retry)
6. Tests: single 401 → refresh → retry, concurrent 401s → single refresh → all retry, refresh failure → logout, no infinite loop, excluded paths

**Technical Notes:**
- Pattern: Promise-based refresh queue. First 401 caller initiates refresh; subsequent callers get same Promise.
- Reference implementations: axios interceptor pattern, but adapted for native `fetch()` wrapper.
- This directly resolves FEAT-007 items #1 (Global 401 Interceptor) and #4 (Token Refresh Queue).

---

#### Story 13.6: Idle Timeout with Warning Modal
**Priority:** HIGH  
**Estimate:** 6-8h  
**Status:** Done  

**As a** security-conscious organization,  
**I want** user sessions to automatically log out after 30 minutes of inactivity,  
**So that** unattended workstations don't pose a security risk.

**Acceptance Criteria:**
1. Idle detection tracks: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`, `visibilitychange`
2. Any tracked activity resets the 30-minute idle timer
3. At 25 minutes idle (5 min remaining), warning modal appears:
   - "Your session will expire in 5 minutes due to inactivity"
   - "Continue Working" button resets timer
   - Countdown display (5:00 → 0:00)
4. At 30 minutes idle → auto logout + redirect to `/login` with message "Session expired due to inactivity"
5. Timer pauses when tab is hidden (`document.hidden`), resumes when tab becomes visible — but total hidden time still counts
6. Idle timeout only active when user is authenticated (`isAuthenticated === true`)
7. Configurable timeout values via constants (easy to change for different environments)
8. Tests: idle timer fires at 30 min, activity resets timer, warning shows at 25 min, continue button resets, auto-logout at 30 min, unauthenticated users unaffected

**Technical Notes:**
- Implement as custom hook `useIdleTimeout()` used in `App.tsx` or `ProtectedRoute`.
- Consider `requestIdleCallback` as alternative to event listeners for efficiency.
- This resolves FEAT-007 item #3 (Idle Timeout Auto Logout).

---

#### Story 13.7: API Client Cleanup (Remove axios + Inline Migrations)
**Priority:** MEDIUM  
**Estimate:** 3-4h  
**Status:** Backlog  

**As a** developer maintaining the codebase,  
**I want** a single, consistent API client pattern across all pages,  
**So that** every API call benefits from the 401 interceptor and cookie handling automatically.

**Acceptance Criteria:**
1. `axios` removed from `frontend/package.json` and `package-lock.json`
2. No remaining `import axios` or `require('axios')` in any frontend file
3. Pages that call `apiFetch()` inline (not through API lib + hooks) are migrated:
   - Identify remaining inline `apiFetch` calls in page components
   - Create missing API lib functions where needed
   - Convert page components to use `useQuery`/`useMutation` hooks where appropriate
4. All API lib files (`*Api.ts`) confirmed to use `apiFetch()` / `apiFetchJson()`
5. No remaining `localStorage.getItem('accessToken')` or `localStorage.getItem('refreshToken')` in API-calling code (all legacy)
6. Tests: all existing tests pass, no `axios` import in test files

**Technical Notes:**
- This resolves Feature Audit P1-3 (API Client Unification).
- Also removes Feature Audit P1-8 fix if any remaining `localStorage` token reads exist.
- Should be done AFTER Story 13.5 (interceptor) so all migrated calls benefit from 401 handling.

---

### Wave 4: Integration Testing + UAT

#### Story 13.8: Sprint 13 Integration Testing + UAT
**Priority:** HIGH  
**Estimate:** 6-8h  
**Status:** Backlog  

**As a** product owner,  
**I want** end-to-end verification of SSO login and session management,  
**So that** I can be confident the system is pilot-ready for M365 users.

**Acceptance Criteria:**
1. **SSO Flow E2E:**
   - [ ] New M365 user clicks "Sign in with Microsoft" → redirected to Azure AD → grants consent → JIT provisioned → lands on dashboard with correct role
   - [ ] Returning M365 user logs in via SSO → profile synced → dashboard shows updated info
   - [ ] Non-M365 user logs in via email/password → works as before (no regression)
2. **Session Management E2E:**
   - [ ] User idle for 25 min → warning modal appears → "Continue Working" resets timer
   - [ ] User idle for 30 min → auto-logged out → redirect to login with message
   - [ ] Access token expires mid-session → 401 interceptor refreshes → user doesn't notice
   - [ ] Multiple tabs open → token refresh queue prevents race conditions
3. **Regression:**
   - [ ] All 855+ backend tests pass (0 regressions)
   - [ ] All 738+ frontend tests pass (0 regressions)
   - [ ] CRUD operations for badges, templates, skills, users, milestones all functional
   - [ ] Badge issuance → claim → share → verify flow works end-to-end
4. **Edge Cases:**
   - [ ] Azure AD consent revoked → graceful error on next SSO attempt
   - [ ] SSO user with `passwordHash = ''` cannot use password login form
   - [ ] M365 sync after SSO login updates Security Group role correctly

---

## PO Decisions Applied in This Sprint

| Decision | Resolution | Applied In |
|----------|-----------|------------|
| DEC-001 | **Option A: Dual Entry** (SSO + password) for pilot | Story 13.4 |
| DEC-002 | **Retain password login** for pilot phase | Story 13.4 (form preserved) |
| DEC-003 | Already resolved — Sprint 12 Story 12.3 | N/A |
| DEC-004 | **FR27 executes** (FEAT-008 already done in Sprint 12) | Stories 13.1-13.3 |
| DEC-005 | **Env var bootstrap** (`INITIAL_ADMIN_EMAIL`) | Story 13.2 |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Azure AD App Registration permissions may need admin consent | Blocks SSO callback | Pre-verify permissions in Azure Portal before development |
| MSAL token caching complexity | Delays Story 13.1 | Use stateless code exchange (no token cache needed for server-side) |
| `apiFetch` interceptor may break existing page patterns | Regressions in existing pages | Story 13.5 includes thorough testing of all existing API patterns |
| Idle timeout interferes with long-running operations (e.g., bulk issuance) | User logged out during 20s bulk processing | Reset timer on API activity, not just UI events |

---

## Definition of Done (Sprint Level)

- [ ] All 8 stories completed and tested
- [ ] All existing tests pass (BE + FE, 0 regressions)
- [ ] New tests cover all acceptance criteria
- [ ] Pre-push hook passes (`npm run lint` + `npm run build` + core tests)
- [ ] Code committed to `sprint-13/sso-session-management` branch
- [ ] PR created for merge to main
- [ ] CHANGELOG.md updated for v1.3.0
- [ ] Sprint retrospective notes captured

---

**Created:** 2026-02-25  
**Created By:** SM Agent (Bob)
