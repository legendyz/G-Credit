# Story 13.8 — UAT Retest (Failed Tests Only)

> **Date:** 2026-02-26  
> **Scope:** Retest T3.1–T3.4, T11.6, T12.2, T12.4 with corrected test parameters  
> **Backend:** `http://localhost:3000`  
> **Pre-condition:** Backend running, seed data intact from initial UAT run

---

## Important: Test Sequence

Execute in this EXACT order. Phase 11 must run before Phase 12 because T12.2 depends on T11.6 restoring the password.

**Before starting:** Employee password is currently `newPassword456` (changed during initial T11.3, never restored because T11.6 failed). The retest will restore it.

---

## RETEST: Phase 3 — SSO Endpoints (Environment Check)

> These tests verify SSO endpoint behavior. If Azure AD env vars are NOT configured, mark as **SKIP (environment)**, not FAIL.

### T3.1 — SSO Login Redirect Endpoint

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" \
  http://localhost:3000/api/auth/sso/login
```

**Expected (with Azure config):** HTTP 302, redirect to `https://login.microsoftonline.com/...`
**Expected (without Azure config):** HTTP 500 or 0 → mark **SKIP (environment)**

### T3.2 — SSO Callback Without Code

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback"
```

**Expected (with Azure config):** HTTP 302, redirect to `http://localhost:5173/login?error=sso_failed`
**Expected (without Azure config):** HTTP 500 or 0 → mark **SKIP (environment)**

### T3.3 — SSO Callback With Azure Error

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback?error=access_denied&error_description=User+cancelled"
```

**Expected (with Azure config):** HTTP 302, redirect to `http://localhost:5173/login?error=sso_cancelled`
**Expected (without Azure config):** HTTP 500 or 0 → mark **SKIP (environment)**

### T3.4 — SSO Callback With Invalid State

```bash
curl -s -w "\n%{http_code} %{redirect_url}" -o /dev/null \
  "http://localhost:3000/api/auth/sso/callback?code=fake_code&state=invalid_state"
```

**Expected (with Azure config):** HTTP 302, redirect to `http://localhost:5173/login?error=sso_failed`
**Expected (without Azure config):** HTTP 500 or 0 → mark **SKIP (environment)**

---

## RETEST: T11.6 — Restore Password (Fixed)

> Root cause: `password123` lacked uppercase. Fix: use `Password123` (meets policy: uppercase P + lowercase + digit).

**Step 1:** Login with current employee password (`newPassword456` — set during initial T11.3):

```bash
curl -s -c cookies-newpw.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"newPassword456"}'
```

**Expected:** HTTP 200 (confirms current password is `newPassword456`).

**Step 2:** Restore password to `Password123`:

```bash
curl -s -b cookies-newpw.txt \
  -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"newPassword456","newPassword":"Password123"}'
```

**Expected:** HTTP 200.

**Step 3:** Verify login with restored password:

```bash
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@gcredit.com","password":"Password123"}'
```

**Expected:** HTTP 200 (confirms restore succeeded).

---

## RETEST: T12.2 — Concurrent Sessions (Fixed)

> Root cause: Cascading from T11.6 — employee password wasn't restored.
> Fix: Use `employee2@gcredit.com` (unaffected account) instead of `employee@gcredit.com`.

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

# Verify admin session
curl -s -b cookies-s1.txt http://localhost:3000/api/auth/profile
# Expected: role === "ADMIN"

# Verify employee2 session
curl -s -b cookies-s2.txt http://localhost:3000/api/auth/profile
# Expected: role === "EMPLOYEE"
```

**Expected:** Both sessions return HTTP 200 independently. Admin profile shows `role=ADMIN`, employee2 profile shows `role=EMPLOYEE`. No cross-contamination.

---

## RETEST: T12.4 — Rate Limiting (Fixed Expectation)

> Root cause: NestJS `@Throttle({ default: { ttl: 60000, limit: 5 } })` allows 5 requests total per 60s window. The 5th request triggers 429, not the 6th.

**IMPORTANT:** Wait at least 60 seconds after any previous login attempts to ensure the rate limit window has expired.

```bash
# Wait for rate limit window to reset
sleep 65

# Send 6 rapid login attempts
for i in {1..6}; do
  curl -s -w "%{http_code}\n" -o /dev/null \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gcredit.com","password":"wrong"}'
done
```

**Expected:** First 4 return `401`. 5th and 6th return `429`.
**Pattern:** `401, 401, 401, 401, 429, 429`

---

## Retest Results

| Test ID | Description | Status | HTTP Code | Notes |
|---------|-------------|--------|-----------|-------|
| T3.1 | SSO redirect | | | SKIP if no Azure env |
| T3.2 | SSO callback no code | | | SKIP if no Azure env |
| T3.3 | SSO Azure error | | | SKIP if no Azure env |
| T3.4 | SSO invalid state | | | SKIP if no Azure env |
| T11.6 | Restore password | | | `Password123` (fixed) |
| T11.6-verify | Login with restored pw | | | Confirm restore worked |
| T12.2 | Concurrent sessions | | | Using `employee2` |
| T12.4 | Rate limiting | | | Expect 4×401 + 2×429 |

---

## Expected Final Overall Status

After retest, expected phase results:

| Phase | Status | Notes |
|-------|--------|-------|
| 1 | PASS | 914+ BE, 793 FE tests |
| 2 | PASS | All 4 roles + error cases |
| 3 | SKIP (env) | Azure AD not configured locally |
| 4 | PASS | Token lifecycle |
| 5 | PASS | Badge templates |
| 6 | PASS | Badge issuance |
| 7 | PASS | Public verification |
| 8 | PASS | Skills |
| 9 | PASS | Admin users |
| 10 | PASS | Milestones |
| 11 | PASS | Profile + password (fixed) |
| 12 | PASS | Edge cases (fixed) |
| 13 | PASS | API client cleanup |

**Expected: 12/13 PASS + 1 SKIP (environment) = 100% code coverage verified**
