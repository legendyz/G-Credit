# Story 13.8 — Agent-Executable UAT Plan (API-Based)

> **Sprint:** 13 — Azure AD SSO + Session Management  
> **Version:** v1.3.0  
> **Branch:** `sprint-13/sso-session-management`  
> **Backend:** `http://localhost:3000`  
> **Frontend:** `http://localhost:5173`  
> **Date Generated:** 2026-02-02

---

## Overview

This UAT plan is designed to be executed automatically by a dev agent using API calls (curl/PowerShell).
It covers all Sprint 13 acceptance criteria across stories 13.1–13.7 plus regression testing.

**Scope:**
- AC#1: SSO Flow E2E (Stories 13.1–13.4)
- AC#2: Session Management E2E (Stories 13.5–13.6) — partial (API-testable parts only)
- AC#3: Regression — automated test suites + CRUD smoke tests
- AC#4: Edge Cases — API-testable subset

**Out of Scope (requires browser/manual):**
- Azure AD redirect flow (real Azure tenant interaction)
- Idle timeout visual modal (browser-only)
- Multi-tab token refresh race conditions (browser-only)

---

## Pre-Conditions

### 1. Environment Setup

```powershell
# Ensure backend is running
cd c:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
# Backend should be at http://localhost:3000

# Ensure frontend is built (for build regression check)
cd c:\G_Credit\CODE\gcredit-project\frontend
npm run build
```

### 2. Seed Database

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm run seed:reset
```

### 3. Test Accounts (from seed-uat.ts)

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| ADMIN    | admin@gcredit.com        | password123   |
| ISSUER   | issuer@gcredit.com       | password123   |
| MANAGER  | manager@gcredit.com      | password123   |
| EMPLOYEE | employee@gcredit.com     | password123   |
| EMPLOYEE | employee2@gcredit.com    | password123   |

### 4. Known Test Data IDs (from seed)

```
Template 1: 00000000-0000-4000-a000-000100000001
Badge 1:    00000000-0000-4000-a000-000200000001
Verify 1:   00000000-0000-4000-a000-000300000001
```

---

## Execution Instructions for Agent

- Use `curl` or PowerShell `Invoke-RestMethod` for all API calls
- The backend uses **httpOnly cookies** for auth — use `-c` (cookie jar) / `-b` (send cookies) flags with curl
- Base URL: `http://localhost:3000`
- All API endpoints are prefixed with `/api/`
- **Record result** of each test: `PASS` / `FAIL` with response status and body excerpt
- **Stop and report** on first FAIL within a section (continue with other sections)

---

## PHASE 1: Automated Test Suite Regression (AC#3)

### T1.1 — Backend Test Suite

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm test 2>&1
```

**Expected:** All tests pass (baseline: 914+ tests). Document count and any failures.
**Pass Criteria:** 0 new failures. 28 skipped tests (TD-006: Teams permissions) are expected.

### T1.2 — Frontend Test Suite

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend
npm test -- --run 2>&1
```

**Expected:** All tests pass (baseline: 793 tests across 77 files). Document count and any failures.
**Pass Criteria:** 0 new failures.

### T1.3 — Backend Lint + Build

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npx tsc --noEmit 2>&1
```

**Expected:** 0 errors.

### T1.4 — Frontend Lint + Build

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend
npm run build 2>&1
```

**Expected:** Build succeeds with 0 errors (warnings acceptable).

---

## PHASE 2: Authentication API Testing (AC#1 — Password Login)

### T2.1 — Password Login (ADMIN)

```bash
curl -s -c cookies-admin.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'
```

**Expected:** HTTP 200, response body contains `{ "user": { "email": "admin@gcredit.com", "role": "ADMIN", ... } }`
**Verify:** No `accessToken` or `refreshToken` in response body (httpOnly cookies only — Story 11.25).
**Verify:** Cookie jar contains `access_token` and `refresh_token` cookies.

### T2.2 — Password Login (EMPLOYEE)

```bash
curl -s -c cookies-employee.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"password123"}'
```

**Expected:** HTTP 200, `user.role === "EMPLOYEE"`.

### T2.3 — Password Login (ISSUER)

```bash
curl -s -c cookies-issuer.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"issuer@gcredit.com","password":"password123"}'
```

**Expected:** HTTP 200, `user.role === "ISSUER"`.

### T2.4 — Password Login (MANAGER)

```bash
curl -s -c cookies-manager.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@gcredit.com","password":"password123"}'
```

**Expected:** HTTP 200, `user.role === "MANAGER"`.

### T2.5 — Invalid Login (Wrong Password)

```bash
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"wrong_password"}'
```

**Expected:** HTTP 401 (Unauthorized).

### T2.6 — Invalid Login (Non-existent User)

```bash
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"password123"}'
```

**Expected:** HTTP 401 (Unauthorized).

---

## PHASE 3: SSO Endpoint Verification (AC#1 — SSO)

> Note: Full SSO flow requires browser + Azure AD. These tests verify the API endpoints exist and respond correctly.

### T3.1 — SSO Login Redirect Endpoint

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" \
  http://localhost:3000/api/auth/sso/login
```

**Expected:** HTTP 302 redirect to `https://login.microsoftonline.com/...` (Azure AD authorize URL).
**Verify:** Response sets `sso_state` cookie (httpOnly, 5min max-age).
**ENV NOTE:** Requires `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` in `.env`. If not configured, HTTP 500 or 0 is expected — mark as SKIP (environment) not FAIL.

### T3.2 — SSO Callback Without Code (Error)

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback"
```

**Expected:** HTTP 302 redirect to `http://localhost:5173/login?error=sso_failed` (missing code/state).

### T3.3 — SSO Callback With Azure Error

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback?error=access_denied&error_description=User+cancelled"
```

**Expected:** HTTP 302 redirect to `http://localhost:5173/login?error=sso_cancelled`.

### T3.4 — SSO Callback With Invalid State

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback?code=fake_code&state=invalid_state"
```

**Expected:** HTTP 302 redirect to `http://localhost:5173/login?error=sso_failed` (no sso_state cookie or state mismatch).

---

## PHASE 4: Token Refresh & Session (AC#2 — API-Testable)

### T4.1 — Refresh Token Endpoint

```bash
# Login first to get cookies
curl -s -c cookies-refresh.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'

# Now refresh using cookies
curl -s -b cookies-refresh.txt -c cookies-refresh.txt \
  -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json"
```

**Expected:** HTTP 200, `{ "message": "Token refreshed" }`.
**Verify:** New `access_token` and `refresh_token` cookies are set.

### T4.2 — Refresh Without Token (Unauthorized)

```bash
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json"
```

**Expected:** HTTP 401 (no refresh token provided).

### T4.3 — Profile Access (Authenticated)

```bash
curl -s -b cookies-admin.txt \
  http://localhost:3000/api/auth/profile
```

**Expected:** HTTP 200, returns user profile with fields: `id`, `email`, `firstName`, `lastName`, `role`, `department`, etc.
**Verify:** `email === "admin@gcredit.com"`, `role === "ADMIN"`.

### T4.4 — Profile Access (Unauthenticated)

```bash
curl -s -w "\n%{http_code}" \
  http://localhost:3000/api/auth/profile
```

**Expected:** HTTP 401 (no cookies).

### T4.5 — Logout

```bash
# Login fresh for logout test
curl -s -c cookies-logout.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"password123"}'

# Logout
curl -s -b cookies-logout.txt -c cookies-logout.txt \
  -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json"
```

**Expected:** HTTP 200. Cookies `access_token` and `refresh_token` are cleared.

### T4.6 — Profile After Logout (Should Fail)

```bash
curl -s -w "\n%{http_code}" -b cookies-logout.txt \
  http://localhost:3000/api/auth/profile
```

**Expected:** HTTP 401 (cookies were cleared by logout).

---

## PHASE 5: CRUD Regression — Badge Templates (AC#3)

### T5.1 — List Active Templates

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/badge-templates"
```

**Expected:** HTTP 200, returns paginated list with `data` array of templates, `meta` object with pagination.
**Verify:** All returned templates have status `ACTIVE`.

### T5.2 — List All Templates (Admin)

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/badge-templates/all"
```

**Expected:** HTTP 200, includes templates in all statuses (ACTIVE, DRAFT, ARCHIVED).

### T5.3 — Get Single Template

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/badge-templates/00000000-0000-4000-a000-000100000001"
```

**Expected:** HTTP 200, returns template details with `id`, `name`, `category`, `status`, etc.

### T5.4 — List Templates (Unauthorized)

```bash
curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/badge-templates"
```

**Expected:** HTTP 401 (global JwtAuthGuard).

---

## PHASE 6: CRUD Regression — Badge Issuance (AC#3)

### T6.1 — Get My Badges (Employee)

```bash
curl -s -b cookies-employee.txt \
  "http://localhost:3000/api/badges/my-badges"
```

**Expected:** HTTP 200, returns `data` array of badges belonging to the employee.

### T6.2 — Get Wallet (Employee)

```bash
curl -s -b cookies-employee.txt \
  "http://localhost:3000/api/badges/wallet"
```

**Expected:** HTTP 200, returns badges with `data`, `meta`, and `dateGroups`.

### T6.3 — Get Badge By ID

```bash
curl -s -b cookies-employee.txt \
  "http://localhost:3000/api/badges/00000000-0000-4000-a000-000200000001"
```

**Expected:** HTTP 200, badge details (or 404 if badge doesn't belong to this user).
**Note:** Badge-to-user relationship depends on seed data. Record actual result.

### T6.4 — Get Issued Badges (Issuer)

```bash
curl -s -b cookies-issuer.txt \
  "http://localhost:3000/api/badges/issued"
```

**Expected:** HTTP 200, returns paginated list of badges issued by the issuer.

### T6.5 — Get Recipients (Issuer)

```bash
curl -s -b cookies-issuer.txt \
  "http://localhost:3000/api/badges/recipients"
```

**Expected:** HTTP 200, returns array of user objects available as badge recipients.

### T6.6 — Get Recipients (Employee — Forbidden)

```bash
curl -s -w "\n%{http_code}" -b cookies-employee.txt \
  "http://localhost:3000/api/badges/recipients"
```

**Expected:** HTTP 403 (Forbidden — EMPLOYEE role cannot access recipients).

---

## PHASE 7: CRUD Regression — Public Verification (AC#3)

### T7.1 — Verify Badge (Public — No Auth)

```bash
curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/verify/00000000-0000-4000-a000-000300000001"
```

**Expected:** HTTP 200, returns Open Badges 2.0 assertion JSON-LD with `@context`, `type: "Assertion"`, `verificationStatus`.
**Verify:** Response headers include `X-Verification-Status` (valid/expired/revoked).
**Verify:** Response headers include `Cache-Control`.

### T7.2 — Verify Badge (Non-existent ID)

```bash
curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/verify/00000000-0000-0000-0000-000000000000"
```

**Expected:** HTTP 404 (Badge not found).

---

## PHASE 8: CRUD Regression — Skills (AC#3)

### T8.1 — List All Skills

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/skills"
```

**Expected:** HTTP 200, returns array of skills with `id`, `name`, `category`, etc.

### T8.2 — Search Skills

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/skills/search?q=typescript"
```

**Expected:** HTTP 200, returns matching skills.

### T8.3 — Get Single Skill

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/skills/a0a00001-0001-4001-a001-000000000001"
```

**Expected:** HTTP 200, returns TypeScript skill details.

---

## PHASE 9: CRUD Regression — Admin Users (AC#3)

### T9.1 — List Users (Admin)

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/admin/users?page=1&limit=25"
```

**Expected:** HTTP 200, returns paginated user list with `data`, `meta`.
**Verify:** Contains at least 5 users (admin, issuer, manager, employee, employee2).

### T9.2 — Get Single User (Admin)

```bash
# First get a user ID from T9.1 response, or use seed data
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/admin/users"
```

Then use the first user's ID:

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/admin/users/{USER_ID_FROM_T9.1}"
```

**Expected:** HTTP 200, returns detailed user info.

### T9.3 — List Users (Employee — Forbidden)

```bash
curl -s -w "\n%{http_code}" -b cookies-employee.txt \
  "http://localhost:3000/api/admin/users"
```

**Expected:** HTTP 403 (Admin role required).

### T9.4 — Filter Users by Role

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/admin/users?roleFilter=ISSUER"
```

**Expected:** HTTP 200, all returned users have `role === "ISSUER"`.

### T9.5 — Search Users

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/admin/users?search=employee"
```

**Expected:** HTTP 200, returns users matching "employee" in name or email.

---

## PHASE 10: CRUD Regression — Milestones (AC#3)

### T10.1 — List Milestone Configs (Admin)

```bash
curl -s -b cookies-admin.txt \
  "http://localhost:3000/api/milestones/admin/milestones"
```

**Expected:** HTTP 200, returns array of milestone configurations.

### T10.2 — Get My Achievements (Employee)

```bash
curl -s -b cookies-employee.txt \
  "http://localhost:3000/api/milestones/milestones/achievements"
```

**Expected:** HTTP 200, returns array of milestone achievements for the employee.

### T10.3 — List Milestones (Employee — Forbidden)

```bash
curl -s -w "\n%{http_code}" -b cookies-employee.txt \
  "http://localhost:3000/api/milestones/admin/milestones"
```

**Expected:** HTTP 403 (Admin role required).

---

## PHASE 11: Profile Update & Change Password (AC#3)

### T11.1 — Update Profile

```bash
curl -s -b cookies-employee.txt \
  -X PATCH http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -d '{"firstName":"UpdatedFirst","lastName":"UpdatedLast"}'
```

**Expected:** HTTP 200, returns updated profile.
**Verify:** `firstName === "UpdatedFirst"`.

### T11.2 — Verify Profile Update

```bash
curl -s -b cookies-employee.txt \
  http://localhost:3000/api/auth/profile
```

**Expected:** HTTP 200, `firstName === "UpdatedFirst"`, `lastName === "UpdatedLast"`.

### T11.3 — Change Password

```bash
curl -s -b cookies-employee.txt \
  -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"password123","newPassword":"NewPass456"}'
```

**Expected:** HTTP 200.
**Note:** Password must meet policy: uppercase + lowercase + digit. `NewPass456` satisfies all rules.

### T11.4 — Login With New Password

```bash
curl -s -c cookies-newpw.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"NewPass456"}'
```

**Expected:** HTTP 200, login succeeds with new password.

### T11.5 — Login With Old Password (Should Fail)

```bash
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"password123"}'
```

**Expected:** HTTP 401 (old password no longer valid).

### T11.6 — Restore Original Password

```bash
curl -s -b cookies-newpw.txt \
  -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"NewPass456","newPassword":"Password123"}'
```

**Expected:** HTTP 200 (restore for subsequent tests).
**Note:** `Password123` meets policy (uppercase P + lowercase + digit). Seed used `password123` (no uppercase) via direct bcrypt insert, bypassing DTO validation.

---

## PHASE 12: Edge Cases — API-Testable (AC#4)

### T12.1 — Rapid Login/Logout Cycles (State Corruption Check)

```bash
# Rapid cycle 1
curl -s -c cookies-rapid.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'
curl -s -b cookies-rapid.txt -c cookies-rapid.txt \
  -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json"

# Rapid cycle 2
curl -s -c cookies-rapid.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'
curl -s -b cookies-rapid.txt -c cookies-rapid.txt \
  -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json"

# Rapid cycle 3 — verify clean login
curl -s -c cookies-rapid.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'

# Verify profile access works (no state corruption)
curl -s -b cookies-rapid.txt \
  http://localhost:3000/api/auth/profile
```

**Expected:** HTTP 200 on final profile call. No state corruption after rapid cycles.

### T12.2 — Concurrent Sessions (Different Users)

```bash
# Login as admin
curl -s -c cookies-s1.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'

# Login as employee2 (separate cookie jar — avoids cascade from T11 password change)
curl -s -c cookies-s2.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee2@gcredit.com","password":"password123"}'

# Verify both sessions independently
curl -s -b cookies-s1.txt http://localhost:3000/api/auth/profile
# Expected: role === "ADMIN"

curl -s -b cookies-s2.txt http://localhost:3000/api/auth/profile
# Expected: role === "EMPLOYEE"
```

**Expected:** Both sessions are independent. Admin sees ADMIN profile, employee2 sees EMPLOYEE profile.

### T12.3 — Double Refresh (Refresh Token Reuse)

```bash
curl -s -c cookies-dbl.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gcredit.com","password":"password123"}'

# First refresh — should succeed
curl -s -b cookies-dbl.txt -c cookies-dbl.txt \
  -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json"

# Second refresh with updated cookies — should also succeed
curl -s -b cookies-dbl.txt -c cookies-dbl.txt \
  -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json"
```

**Expected:** Both refreshes succeed (HTTP 200). Token rotation works correctly.

### T12.4 — Rate Limiting (Login)

```bash
# Send 6 rapid login attempts (limit is 5/min)
for i in {1..6}; do
  curl -s -w "%{http_code}\n" -o /dev/null \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gcredit.com","password":"wrong"}'
done
```

**Expected:** First 4 return 401 (wrong password). 5th onward returns 429 (Too Many Requests).
**Note:** NestJS `@Throttle({ default: { ttl: 60000, limit: 5 } })` means 5 total requests per 60s window — the 5th request hits the threshold and triggers 429.

---

## PHASE 13: Story 13.7 — API Client Cleanup Verification (AC#3)

> These tests verify that the migrated API client layer (apiFetch → apiFetchJson) works correctly for all endpoint categories.

### T13.1 — Badge Visibility Toggle

```bash
# Get an employee badge first
BADGE_RESPONSE=$(curl -s -b cookies-employee.txt "http://localhost:3000/api/badges/my-badges")
# Extract first badge ID from response (agent should parse JSON)

# Toggle visibility (use actual badge ID)
curl -s -b cookies-employee.txt \
  -X PATCH "http://localhost:3000/api/badges/{BADGE_ID}/visibility" \
  -H "Content-Type: application/json" \
  -d '{"visibility":"PRIVATE"}'
```

**Expected:** HTTP 200, badge visibility updated.

### T13.2 — Badge Report Issue

```bash
curl -s -b cookies-employee.txt \
  -X POST "http://localhost:3000/api/badges/{BADGE_ID}/report" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Testing report functionality","category":"other"}'
```

**Expected:** HTTP 200 or 201.

### T13.3 — Active Templates Only

```bash
curl -s -b cookies-employee.txt \
  "http://localhost:3000/api/badge-templates?status=ACTIVE"
```

**Expected:** HTTP 200, all returned templates have `status === "ACTIVE"`.

---

## UAT Results Template

After executing all phases, record results in this format:

| Phase | Test ID | Description | Status | HTTP Code | Notes |
|-------|---------|-------------|--------|-----------|-------|
| 1 | T1.1 | Backend tests | | | X/Y pass |
| 1 | T1.2 | Frontend tests | | | X/Y pass |
| 1 | T1.3 | Backend build | | | |
| 1 | T1.4 | Frontend build | | | |
| 2 | T2.1 | Login ADMIN | | | |
| 2 | T2.2 | Login EMPLOYEE | | | |
| 2 | T2.3 | Login ISSUER | | | |
| 2 | T2.4 | Login MANAGER | | | |
| 2 | T2.5 | Invalid password | | | |
| 2 | T2.6 | Non-existent user | | | |
| 3 | T3.1 | SSO redirect | | | |
| 3 | T3.2 | SSO callback no code | | | |
| 3 | T3.3 | SSO Azure error | | | |
| 3 | T3.4 | SSO invalid state | | | |
| 4 | T4.1 | Token refresh | | | |
| 4 | T4.2 | Refresh no token | | | |
| 4 | T4.3 | Profile authenticated | | | |
| 4 | T4.4 | Profile unauthenticated | | | |
| 4 | T4.5 | Logout | | | |
| 4 | T4.6 | Profile after logout | | | |
| 5 | T5.1 | List active templates | | | |
| 5 | T5.2 | List all templates | | | |
| 5 | T5.3 | Get single template | | | |
| 5 | T5.4 | Templates unauthorized | | | |
| 6 | T6.1 | My badges | | | |
| 6 | T6.2 | Wallet | | | |
| 6 | T6.3 | Badge by ID | | | |
| 6 | T6.4 | Issued badges | | | |
| 6 | T6.5 | Recipients (issuer) | | | |
| 6 | T6.6 | Recipients (forbidden) | | | |
| 7 | T7.1 | Verify badge (public) | | | |
| 7 | T7.2 | Verify non-existent | | | |
| 8 | T8.1 | List skills | | | |
| 8 | T8.2 | Search skills | | | |
| 8 | T8.3 | Get single skill | | | |
| 9 | T9.1 | List users (admin) | | | |
| 9 | T9.2 | Get user detail | | | |
| 9 | T9.3 | List users (forbidden) | | | |
| 9 | T9.4 | Filter by role | | | |
| 9 | T9.5 | Search users | | | |
| 10 | T10.1 | List milestones | | | |
| 10 | T10.2 | My achievements | | | |
| 10 | T10.3 | Milestones (forbidden) | | | |
| 11 | T11.1 | Update profile | | | |
| 11 | T11.2 | Verify profile update | | | |
| 11 | T11.3 | Change password | | | |
| 11 | T11.4 | Login new password | | | |
| 11 | T11.5 | Login old password | | | |
| 11 | T11.6 | Restore password | | | |
| 12 | T12.1 | Rapid login/logout | | | |
| 12 | T12.2 | Concurrent sessions | | | |
| 12 | T12.3 | Double refresh | | | |
| 12 | T12.4 | Rate limiting | | | |
| 13 | T13.1 | Visibility toggle | | | |
| 13 | T13.2 | Report issue | | | |
| 13 | T13.3 | Active templates | | | |

---

## Summary Checklist

- [ ] PHASE 1: Automated test suites (BE + FE) — 0 regressions
- [ ] PHASE 2: Password login — all 4 roles + error cases
- [ ] PHASE 3: SSO endpoints — redirect, callback errors
- [ ] PHASE 4: Token lifecycle — refresh, profile, logout
- [ ] PHASE 5: Badge templates — CRUD + auth
- [ ] PHASE 6: Badge issuance — wallet, issued, recipients
- [ ] PHASE 7: Public verification — Open Badges 2.0
- [ ] PHASE 8: Skills — list, search, get
- [ ] PHASE 9: Admin users — CRUD + RBAC
- [ ] PHASE 10: Milestones — configs + achievements
- [ ] PHASE 11: Profile & password — update + change
- [ ] PHASE 12: Edge cases — rapid cycles, concurrency, rate limits
- [ ] PHASE 13: API client cleanup verification

**Overall Status:** _____ / 13 phases passed

---

## Notes for Agent

1. **Cookie management is critical** — use separate cookie jar files per user/session.
2. **Parse JSON responses** — extract IDs from list endpoints for use in detail endpoints.
3. **Sequence matters** — Phase 11 modifies employee password, so T11.6 must restore it. Restored password is `Password123` (not original `password123`).
4. **Rate limiting** (T12.4) may affect subsequent tests — wait 60s after that test.
5. **SSO tests** (Phase 3) only verify endpoint behavior. If Azure AD env vars are not configured, mark as SKIP (environment), not FAIL.
6. **Report badge (T13.2)** endpoint may not exist — if 404, note as "endpoint not implemented" not a failure.
7. If backend is not running, start it first: `cd backend && npm run start:dev`.
