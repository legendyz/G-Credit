# Story 13.8: Manual UAT Plan — Browser-Based Testing

**Date:** 2026-02-26
**Tester:** LegendZhu (Product Owner)
**Environment:** Local dev — `localhost:3000` (backend) + `localhost:5173` (frontend)
**Branch:** `sprint-13/sso-session-management`

## Prerequisites

### Environment Setup
1. Run `cd c:\G_Credit\CODE\gcredit-project\backend && npm run seed:reset` to ensure fresh UAT data
2. Start backend: `cd c:\G_Credit\CODE\gcredit-project\backend && npm run start:dev`
3. Start frontend: `cd c:\G_Credit\CODE\gcredit-project\frontend && npm run dev`
4. Start Prisma Studio (database browser, used for M1.2 and M6.2 data verification):
   ```
   cd c:\G_Credit\CODE\gcredit-project\backend && npx prisma studio
   ```
   Opens a Web UI at `http://localhost:5555` — no additional installation required
5. Verify both running: open `http://localhost:5173/login` in browser

### Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@gcredit.com | Password123 | Local only |
| Issuer | issuer@gcredit.com | Password123 | Local only |
| Manager | manager@gcredit.com | Password123 | Local only |
| Employee | employee@gcredit.com | Password123 | Local only, 6 badges |
| Employee2 | employee2@gcredit.com | Password123 | Local only, 2 badges |
| SSO User | AdeleV@2wjh85.onmicrosoft.com | *(Azure AD)* | Not seeded — JIT provisioned on first SSO |

### Browser Requirements
- Use Chrome or Edge (DevTools → Application → Cookies for inspection)
- Clear cookies for `localhost` before starting
- Keep DevTools open (Console + Network tabs) for observation

---

## Seed Data Overview

Source: `c:\G_Credit\CODE\gcredit-project\backend\prisma\seed-uat.ts`
Reset command: `cd c:\G_Credit\CODE\gcredit-project\backend && npm run seed:reset`

### Users (5 local)

| Email | Role | Department | Job Title | Password | Manager |
|-------|------|------------|-----------|----------|---------|
| admin@gcredit.com | ADMIN | IT | IT Director | Password123 | — |
| issuer@gcredit.com | ISSUER | HR | HR Specialist | Password123 | — |
| manager@gcredit.com | MANAGER | Engineering | Engineering Manager | Password123 | — |
| employee@gcredit.com | EMPLOYEE | Engineering | Software Engineer | Password123 | manager |
| employee2@gcredit.com | EMPLOYEE | Development | Full-Stack Developer | Password123 | manager |

> **SSO user** (`AdeleV@2wjh85.onmicrosoft.com`) is **not seeded**. It is auto-created by JIT provisioning on first Azure AD login (Story 13.2). Seeding a fake `azureId` would cause a unique constraint conflict on real SSO login.

### Skill Categories (10 total, 3-level hierarchy)

| Level | Name | Color | System-Defined | Parent |
|-------|------|-------|----------------|--------|
| L1 | Technology | blue | Yes | — |
| L1 | Interpersonal Skills | amber | Yes | — |
| L1 | Business & Industry | emerald | Yes | — |
| L1 | Leadership & Management | violet | Yes | — |
| L2 | Programming Languages | blue | No | Technology |
| L2 | Cloud Platforms | blue | No | Technology |
| L2 | Communication | amber | No | Interpersonal Skills |
| L2 | Leadership | violet | No | Leadership & Management |
| L3 | Azure | blue | No | Cloud Platforms |
| L1 | Innovation | lime | No (user-defined, empty, deletable) | — |

### Skills (7)

| Name | Category | Level |
|------|----------|-------|
| TypeScript | Programming Languages (L2) | INTERMEDIATE |
| Docker | Azure (L3) | INTERMEDIATE |
| Vibe Coding | Programming Languages (L2) | INTERMEDIATE |
| Public Speaking | Communication (L2) | BEGINNER |
| Team Leadership | Leadership (L2) | EXPERT |
| Project Management | Leadership (L2) | ADVANCED |
| Negotiation | Communication (L2) | ADVANCED |

> **Negotiation** is unreferenced by any template — available for UAT skill-delete testing.

### Badge Templates (11)

| Name | Category | Status | Skills | Created By |
|------|----------|--------|--------|------------|
| Cloud Expert Certification | certification | ACTIVE | TypeScript, Docker, Vibe Coding | issuer |
| Leadership Excellence | achievement | ACTIVE | Team Leadership, Public Speaking | issuer |
| Innovation Champion | achievement | ACTIVE | — | admin |
| Security Specialist | certification | ACTIVE | — | admin |
| Team Player Award | participation | ACTIVE | Project Management | issuer |
| DevOps Engineer Certification | skill | ACTIVE | Docker, TypeScript | issuer |
| AI & Machine Learning Pioneer | skill | ACTIVE | Vibe Coding, TypeScript | admin |
| Mentor of the Year | achievement | ACTIVE | Team Leadership, Public Speaking, Project Management | issuer |
| Customer Success Champion | participation | ACTIVE | Public Speaking, Project Management | admin |
| Data Analytics Fundamentals (DRAFT) | skill | DRAFT | Vibe Coding | issuer |
| Legacy Compliance Training (ARCHIVED) | certification | ARCHIVED | — | admin |

### Badges (13)

| # | Template | Recipient | Status | Notes |
|---|----------|-----------|--------|-------|
| 1 | Cloud Expert | employee | CLAIMED | — |
| 2 | Leadership Excellence | employee | CLAIMED | — |
| 3 | Innovation Champion | employee | CLAIMED | — |
| 4 | Team Player Award | employee | CLAIMED | No expiry |
| 5 | Security Specialist | employee | PENDING | Awaiting claim |
| 6 | Cloud Expert | employee | REVOKED | Revoked by manager |
| 7 | Leadership Excellence | manager | CLAIMED | — |
| 8 | Innovation Champion | manager | CLAIMED | — |
| 9 | Security Specialist | manager | CLAIMED | Expired (expiresAt in past) |
| 10 | Team Player Award | admin | CLAIMED | No expiry |
| 11 | Cloud Expert | admin | PENDING | Awaiting claim |
| 12 | Cloud Expert | employee2 | CLAIMED | — |
| 13 | Team Player Award | employee2 | CLAIMED | No expiry |

### Other Data

| Entity | Count | Details |
|--------|-------|---------|
| Evidence Files | 3 | 2 FILE type (PDF) + 1 URL type |
| Badge Shares | 3 | 2 email + 1 Teams |
| Milestone Configs | 5 | First Badge (1), Badge Collector (5), Well-Rounded Learner (3 categories), Cloud Specialist (3 in Tech), Badge Master (10, inactive) |
| Milestone Achievements | 5 | employee (First Badge + Well-Rounded), manager (First Badge), admin (First Badge), employee2 (First Badge) |
| Audit Logs | 9 | Covering all action types |

---

## Phase M1: SSO — New User JIT Provisioning

**Stories covered:** 13.1, 13.2, 13.4
**AC:** 1.1, 1.4

### M1.1 — New M365 user first SSO login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `http://localhost:5173/login` | Login page loads with email/password form AND "Sign in with Microsoft" button |
| 2 | Click **"Sign in with Microsoft"** button | Browser redirects to `https://login.microsoftonline.com/...` (Azure AD login page) |
| 3 | Sign in as `AdeleV@2wjh85.onmicrosoft.com` with Azure AD credentials | Azure AD processes authentication, may show consent prompt on first login |
| 4 | If consent prompt appears, click **Accept** | Browser redirects back to `http://localhost:5173/sso/callback?success=true` |
| 5 | Wait for redirect to complete | Dashboard loads — user is logged in |
| 6 | Check top-right user info / profile area | Shows "Adele Vance" (or display name from Azure AD) |
| 7 | Open DevTools → Application → Cookies → `localhost` | `access_token` and `refresh_token` cookies exist, both `httpOnly` |
| 8 | Open a new tab → `http://localhost:3000/api/auth/profile` | Returns JSON with `email: "adelev@2wjh85.onmicrosoft.com"`, `role: "EMPLOYEE"`, `firstName/lastName` populated |

**Pass criteria:** User auto-created (JIT), dashboard accessible, correct role and profile.

### M1.2 — Verify JIT user in database

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Prisma Studio: `http://localhost:5555` (already started in Environment Setup step 4) | Prisma Studio Web UI opens, left sidebar shows all tables |
| 2 | Click **User** in the left table list | User table data loads, showing all user records |
| 3 | Click **Filter** button at top, add filter: `email` → `contains` → `adelev` → click **Apply** | Filtered results show only Adele's record |
| 4 | Check field: `azureId` | Non-empty, a real Azure AD UUID (written automatically by JIT) |
| 5 | Check field: `passwordHash` | Empty string `""` (SSO users have no local password) |
| 6 | Check field: `role` | `EMPLOYEE` (JIT default role) |
| 7 | Check field: `isActive` | `true` |
| 8 | Check field: `firstName`, `lastName` | Real name from Azure AD (e.g., "Adele", "Vance") |

**Pass criteria:** JIT-created user has correct `azureId`, empty `passwordHash`, active status.

---

## Phase M2: SSO — Returning User Profile Sync

**Stories covered:** 13.1, 13.3
**AC:** 1.2

### M2.1 — Returning M365 user SSO login with mini-sync

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out from current session (if logged in) | Redirected to login page |
| 2 | Click **"Sign in with Microsoft"** again | Azure AD may auto-sign-in (session cached) or show picker |
| 3 | Select `AdeleV@2wjh85.onmicrosoft.com` | Callback processes → dashboard loads |
| 4 | Check Network tab for any `/api/auth/sso/callback` response | 302 redirect to `http://localhost:5173/sso/callback?success=true` |
| 5 | Check backend terminal logs | Should show `[SSO] SSO callback success` and mini-sync log message |

**Pass criteria:** Returning user login succeeds, mini-sync triggered (observable in backend logs).

---

## Phase M3: SSO User Password Login Block

**Stories covered:** 13.1 (AC #11, DEC-011-13)
**AC:** 1.4

### M3.1 — SSO user tries password login form

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out from SSO session | Redirected to login page |
| 2 | In the email/password form, enter `AdeleV@2wjh85.onmicrosoft.com` and any password (e.g., `Test1234`) | — |
| 3 | Click **Login** (or press Enter) | Error message: **"This account is managed by Microsoft 365. Please use 'Sign in with Microsoft'."** |
| 4 | Verify user is NOT logged in | Still on login page, no cookies set |

**Pass criteria:** Password login rejected with SSO-specific message, not generic "invalid credentials".

---

## Phase M4: Idle Timeout — Warning Modal

**Stories covered:** 13.6
**AC:** 2.1, 2.2

> **Shortcut Tip:** To avoid waiting 25 minutes, temporarily modify `c:\G_Credit\CODE\gcredit-project\frontend\src\config\session.ts`:
> - `IDLE_TIMEOUT_MS: 2 * 60 * 1000` (2 minutes)
> - `IDLE_WARNING_MS: 1 * 60 * 1000` (1 minute warning)
> - Remember to revert after testing!

### M4.1 — Warning modal appears on idle

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `employee@gcredit.com` / `Password123` | Dashboard loads |
| 2 | **Do nothing** — don't move mouse or press keys | Wait for warning period |
| 3 | After (timeout - warningBefore) idle time (default: 25 min, or 1 min with shortcut) | **Warning modal appears** with countdown timer showing seconds remaining |
| 4 | Observe countdown | Timer decrements in real-time (5:00 → 4:59 → ...) |

**Pass criteria:** Warning modal auto-appears after idle period, shows live countdown.

### M4.2 — "Continue Working" resets timer

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While warning modal is visible, click **"Continue Working"** (or similar button) | Modal closes |
| 2 | Observe | User remains logged in, dashboard still functional |
| 3 | Navigate to any page (e.g., My Badges) | Page loads normally — session is active |
| 4 | **Do nothing** again | Warning modal should appear again after another idle period |

**Pass criteria:** "Continue Working" dismisses modal and resets the idle timer.

### M4.3 — Auto-logout on full timeout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `employee@gcredit.com` / `Password123` | Dashboard loads |
| 2 | **Do nothing** — wait for warning modal to appear | Modal appears with countdown |
| 3 | **Do NOT click anything** — let countdown reach 0:00 | — |
| 4 | Observe after countdown expires | Browser redirects to `http://localhost:5173/login?reason=idle_timeout` |
| 5 | Check login page | Should show message indicating session expired due to inactivity |
| 6 | Check DevTools → Cookies | `access_token` and `refresh_token` cookies cleared |

**Pass criteria:** Auto-logout after full timeout, redirect to login with idle reason, cookies cleared.

---

## Phase M5: Multi-Tab Token Refresh

**Stories covered:** 13.5
**AC:** 2.4

### M5.1 — Multiple tabs open, single refresh

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `admin@gcredit.com` / `Password123` | Dashboard loads in Tab 1 |
| 2 | Open Tab 2: `http://localhost:5173/admin/users` | Admin users page loads (uses same cookies) |
| 3 | Open Tab 3: `http://localhost:5173/admin/templates` | Templates page loads |
| 4 | Wait for access token to expire (15 min) OR manually delete `access_token` cookie in DevTools | — |
| 5 | In Tab 1, navigate to any page or trigger an API call (e.g., refresh dashboard) | API call triggers 401 → token refresh → API retries successfully |
| 6 | Quickly switch to Tab 2 and trigger an API call | Should succeed without a second refresh (token already refreshed by Tab 1) |
| 7 | Check Network tab in any tab | Only ONE `/api/auth/refresh` call visible across all tabs (refresh queue deduplication) |

**Pass criteria:** Multiple tabs share a single token refresh — no race condition, no duplicate refresh calls.

---

## Phase M6: Badge E2E Flow

**Stories covered:** Regression (Sprints 1–12)
**AC:** 3.4

### M6.1 — Badge issuance → claim → verify

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `issuer@gcredit.com` / `Password123` | Dashboard loads |
| 2 | Navigate to **Badge Management** → click **Issue New Badge** button | Issue badge form appears |
| 3 | Set recipient to `employee2@gcredit.com`, fill required fields | — |
| 4 | Submit issuance | Success message, badge appears as PENDING |
| 5 | Log out | — |
| 6 | Login as `employee2@gcredit.com` / `Password123` | Dashboard loads |
| 7 | Navigate to **My Badges** or **Pending** section | The newly issued badge appears with PENDING status |
| 8 | Click on the pending badge → **Claim** | Badge status changes to CLAIMED |
| 9 | Note the verification URL (or badge ID) | — |
| 10 | Open verification URL in an **incognito/private** window | Public verification page shows badge as VALID/CLAIMED |

**Pass criteria:** Full lifecycle: issue → claim → verify works end-to-end.

### M6.2 — Badge share (if UI available)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | While logged in as `employee2@gcredit.com`, navigate to claimed badge detail | Badge detail page |
| 2 | Look for **Share** button or option | Share options visible (email, Teams, widget) |
| 3 | Click Share → select "Email" → enter a test email | Share recorded |
| 4 | Open Prisma Studio: `http://localhost:5555` | Web UI opens |
| 5 | Click **BadgeShare** table in the left sidebar | All badge share records displayed |
| 6 | View the latest record (sort by `sharedAt` descending) | `platform` = `email`, `sharedBy` = employee2's user ID, `recipientEmail` = the email you entered |

**Pass criteria:** Share flow creates BadgeShare record (email delivery not required for UAT).

---

## Phase M7: Screenshot Capture

**Purpose:** Document key flows for UAT evidence

Capture screenshots of these states:

| # | Screen | When |
|---|--------|------|
| 1 | Login page — dual entry (email form + Microsoft SSO button) | Phase M1 step 1 |
| 2 | Azure AD consent prompt (if shown) | Phase M1 step 3 |
| 3 | Dashboard after SSO login (showing Adele Vance) | Phase M1 step 5-6 |
| 4 | SSO password block error message | Phase M3 step 3 |
| 5 | Idle timeout warning modal with countdown | Phase M4 step 3-4 |
| 6 | Login page after idle auto-logout (with idle_timeout reason) | Phase M4.3 step 4-5 |
| 7 | Badge detail / verification page | Phase M6 step 10 |

Save screenshots to: `c:\G_Credit\CODE\_bmad-output\playwright-sessions\screenshots\sprint-13-uat\`

---

## Results Tracker

| Phase | Test | Result | Notes |
|-------|------|--------|-------|
| M1.1 | SSO new user JIT login | ☐ PASS / ☐ FAIL | |
| M1.2 | JIT user DB verification | ☐ PASS / ☐ FAIL | |
| M2.1 | Returning user mini-sync | ☐ PASS / ☐ FAIL | |
| M3.1 | SSO user password block | ☐ PASS / ☐ FAIL | |
| M4.1 | Idle warning modal appears | ☐ PASS / ☐ FAIL | |
| M4.2 | Continue Working resets timer | ☐ PASS / ☐ FAIL | |
| M4.3 | Auto-logout on timeout | ☐ PASS / ☐ FAIL | |
| M5.1 | Multi-tab single refresh | ☐ PASS / ☐ FAIL | |
| M6.1 | Badge issue → claim → verify | ☐ PASS / ☐ FAIL | |
| M6.2 | Badge share | ☐ PASS / ☐ FAIL / ☐ SKIP | |
| M7 | Screenshots captured | ☐ DONE | |

**Overall:** ☐ PASS (all critical tests green) / ☐ FAIL (issues listed below)

### Issues Found
*(Document any issues here during testing)*

| # | Phase | Description | Severity | Action |
|---|-------|-------------|----------|--------|
| | | | | |
