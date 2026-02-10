# G-Credit v1.0.0 — UAT Test Plan

**Version:** 1.0  
**Created:** 2026-02-10  
**Sprint:** 10  
**Story:** 10.6c  
**Tester(s):** _______________  
**Date(s):** _______________

---

## Environment Setup

### Prerequisites

- Node.js 20.x, PostgreSQL 16, pnpm/npm
- Backend `.env` configured (see `.env.example`)
- M365 Dev Tenant accessible (for email/Teams tests)

### Steps

1. **Database reset & seed:**
   ```bash
   cd gcredit-project/backend
   npm run seed:reset
   ```
2. **Start backend:**
   ```bash
   npm run start:dev
   # Verify: http://localhost:3000/api/health returns { status: "ok" }
   ```
3. **Start frontend:**
   ```bash
   cd gcredit-project/frontend
   npm run dev
   # Verify: http://localhost:5173 loads login page
   ```
4. **JWT Token expiry (optional):**
   - Default Access Token expiry is 15 minutes
   - For extended UAT sessions, edit `backend/.env`:
     ```
     JWT_ACCESS_EXPIRES_IN="4h"
     ```
   - Restart backend for change to take effect
5. **Verify test accounts:**
   - Log in with each of the 4 test accounts below to confirm successful login
6. **Browser requirements:**
   - Chrome latest (recommended)
   - Desktop: 1440×900, Mobile: 375×812

### Test Accounts

| Role | Email | Password | Accessible Features |
|------|-------|----------|---------------------|
| Admin | admin@gcredit.com | password123 | All features (templates, issuance, analytics, user mgmt, revocation) |
| Issuer | issuer@gcredit.com | password123 | Badge templates + single/bulk issuance |
| Manager | manager@gcredit.com | password123 | Badge wallet + revocation |
| Employee | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | Badge wallet only |

---

## Test Cases

### Epic 1: Infrastructure & Health (2 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-001 | Epic 1 | Health check endpoint | Backend running | 1. Open browser to `http://localhost:3000/health` | JSON response `{ "status": "ok" }` with HTTP 200 | |
| UAT-002 | Epic 1 | API documentation available | Backend running | 1. Open browser to `http://localhost:3000/api-docs` | Swagger UI loads with all API endpoints listed | |

### Epic 2: Authentication & User Management (5 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-003 | Epic 2 | Admin login shows admin dashboard | Seed data loaded | 1. Navigate to `/login` 2. Enter admin@gcredit.com / password123 3. Click Login | Redirected to Dashboard with Admin panel (badge count, user count, analytics cards) | |
| UAT-004 | Epic 2 | Employee login shows wallet only | Seed data loaded | 1. Navigate to `/login` 2. Enter M365DevAdmin@2wjh85.onmicrosoft.com / password123 3. Click Login | Redirected to Dashboard, only Wallet section visible, no admin navigation | |
| UAT-005 | Epic 2 | Logout clears session | Logged in as any user | 1. Click user menu / logout 2. Try to navigate to `/` | Token cleared, redirected to `/login`, cannot access protected pages | |
| UAT-006 | Epic 2 | Password change flow | Logged in as Admin | 1. Navigate to profile/password change 2. Enter current password 3. Enter new password 4. Submit 5. Logout 6. Login with new password | Password updated successfully, can login with new password. Reset to `password123` after test. | |
| UAT-007 | Epic 2 | RBAC blocks Employee from admin routes | Logged in as Employee | 1. Manually navigate to `/admin/badges/issue` in browser URL bar | Redirected away from admin page, access denied | |

### Epic 3: Badge Templates (4 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-008 | Epic 3 | Admin creates DRAFT template | Logged in as Admin | 1. Navigate to Badge Templates 2. Click "Create Template" 3. Fill name, description, category, image URL 4. Save as DRAFT | Template created with DRAFT status, visible in template list | |
| UAT-009 | Epic 3 | Admin activates template | DRAFT template exists | 1. Open DRAFT template from UAT-008 2. Change status to ACTIVE 3. Save | Template status changes to ACTIVE, available for badge issuance | |
| UAT-010 | Epic 3 | Admin archives template | ACTIVE template exists | 1. Open an ACTIVE template 2. Change status to ARCHIVED 3. Save | Template status changes to ARCHIVED, no longer available for issuance | |
| UAT-011 | Epic 3 | Template search by name/category | Multiple templates exist | 1. Navigate to Badge Templates 2. Type template name in search 3. Filter by category | Search results filter correctly, matching templates displayed | |

### Epic 4: Badge Issuance (4 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-012 | Epic 4 | Issuer issues single badge via UI | Logged in as Issuer, ACTIVE templates exist | 1. Navigate to `/admin/badges/issue` 2. Select template from dropdown 3. Select recipient from dropdown 4. Optionally add evidence URL 5. Click "Issue Badge" | Success toast "Badge issued successfully!", redirected to badge management page | |
| UAT-013 | Epic 4 | Verify badge status is PENDING after issuance | Badge issued in UAT-012 | 1. Navigate to badge management 2. Find the badge issued in UAT-012 | Badge shows status PENDING | |
| UAT-014 | Epic 4 | Employee claims badge | PENDING badge exists for Employee | 1. Login as Employee 2. Navigate to Wallet 3. Find PENDING badge 4. Click Claim | Badge status changes to CLAIMED, claimedAt timestamp set | |
| UAT-015 | Epic 4 | Open Badges 2.0 assertion format | CLAIMED badge exists | 1. Call `GET /api/verification/{verificationId}/assertion` | JSON-LD response with `@context: "https://w3id.org/openbadges/v2"`, `type: "Assertion"`, valid structure | |

### Epic 5: Employee Badge Wallet (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-016 | Epic 5 | Employee views wallet timeline | Logged in as Employee, has badges | 1. Navigate to `/wallet` | Timeline view shows badges in reverse chronological order with badge images, names, dates | |
| UAT-017 | Epic 5 | Badge detail modal | Employee has CLAIMED badges | 1. In wallet, click on a badge | Detail modal/view shows: template name, description, issuer, issued date, claimed date, status, evidence | |
| UAT-018 | Epic 5 | Evidence file view | Badge with evidence exists | 1. Open badge detail 2. Click on evidence link/file | Evidence URL opens or file downloads correctly | |

### Epic 6: Badge Verification (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-019 | Epic 6 | Public verification page (no login required) | CLAIMED badge exists | 1. Open an incognito/private browser window 2. Navigate to `/verify/{verificationId}` | Verification page loads without login, shows badge details, recipient, issuer, status | |
| UAT-020 | Epic 6 | Baked badge PNG download | CLAIMED badge exists | 1. On verification page, click "Download Badge" | PNG file downloads with embedded Open Badges metadata | |
| UAT-021 | Epic 6 | JSON-LD assertion via API | CLAIMED badge exists | 1. Call `GET /api/verification/{verificationId}/assertion` via browser or curl | Valid JSON-LD with `@context`, `type: "Assertion"`, badge details | |

### Epic 7: Badge Sharing (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-022 | Epic 7 | Email share badge | Logged in as Employee, CLAIMED badge | 1. Open badge detail 2. Click "Share via Email" 3. Enter recipient: `M365DevAdmin@2wjh85.onmicrosoft.com` 4. Send | Success toast, email received in Outlook with badge details and verification link | |
| UAT-023 | Epic 7 | Sharing analytics recorded | Badge shared in UAT-022 | 1. Login as Admin 2. Navigate to Analytics 3. Check sharing statistics | Share event recorded with platform "email", timestamp visible in analytics | |
| UAT-024 | Epic 7 | Embeddable widget HTML | CLAIMED badge exists | 1. Call `GET /api/badges/{id}/embed` or use widget feature | Returns embeddable HTML snippet with badge image and verification link | |

> **SKIP:** TD-006 — Teams `ChannelMessage.Send` permission not approved by tenant admin. Email sharing validated as alternative. 4 Teams integration tests remain skipped.

### Epic 8: Bulk Issuance (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-025 | Epic 8 | Download CSV template | Logged in as Issuer | 1. Navigate to `/admin/bulk-issuance` 2. Click "Download Template" | CSV file downloads with correct headers (recipientEmail, templateId, evidenceUrl, expiresIn) | |
| UAT-026 | Epic 8 | Upload valid CSV, preview, confirm | Valid CSV prepared (≤20 rows) | 1. Upload CSV 2. Review preview table 3. Click "Confirm Issuance" | Preview shows all rows, confirmation processes badges, success summary displayed | |
| UAT-027 | Epic 8 | Upload invalid CSV shows errors | CSV with invalid data | 1. Upload CSV with invalid emails/templateIds 2. Review error report | Error report displayed with row numbers, field names, error descriptions | |

### Epic 9: Badge Revocation (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-028 | Epic 9 | Manager revokes a badge | Logged in as Manager, CLAIMED badge exists | 1. Navigate to badge management 2. Find a CLAIMED badge 3. Click "Revoke" 4. Select reason, add notes 5. Confirm | Badge status changes to REVOKED, revokedAt timestamp set, audit log entry created | |
| UAT-029 | Epic 9 | Revoked badge verification page | Badge revoked in UAT-028 | 1. Navigate to `/verify/{verificationId}` for the revoked badge | Verification page shows REVOKED status with revocation date and reason | |
| UAT-030 | Epic 9 | Revoked badge in wallet | Badge revoked in UAT-028 | 1. Login as badge owner 2. Navigate to Wallet | Revoked badge displayed with grey/disabled styling, sharing disabled | |

### Epic 10: Production Features (3 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-031 | Epic 10 | Admin Dashboard statistics | Logged in as Admin, seed data loaded | 1. Navigate to Dashboard | Dashboard shows badge count, user count, recent activity, trend charts with real data | |
| UAT-032 | Epic 10 | Badge search functionality | Multiple badges exist | 1. Navigate to badge search 2. Search by recipient name 3. Filter by status/template | Search returns matching badges, filters work correctly | |
| UAT-033 | Epic 10 | Admin User Management | Logged in as Admin | 1. Navigate to Admin User Management 2. View user list 3. Change a user's role | User list displays with roles, role change saves successfully | |

### Cross-Epic: Full Lifecycle (2 cases)

| ID | Epic | Scenario | Pre-condition | Steps | Expected Result | Pass/Fail |
|----|------|----------|---------------|-------|-----------------|-----------|
| UAT-034 | Cross | Full badge lifecycle | Seed data loaded | 1. Login as Admin, create template (ACTIVE) 2. Login as Issuer, issue badge to Employee 3. Login as Employee, claim badge 4. Share badge via email to `M365DevAdmin@2wjh85.onmicrosoft.com` 5. Open verification page in incognito 6. Login as Manager, revoke the badge 7. Re-check verification page | Each step succeeds. After revocation, verification page shows REVOKED status. Email received in Outlook. | |
| UAT-035 | Cross | Mobile full flow | Chrome DevTools mobile viewport (375×812) | 1. Navigate to `/login` on mobile viewport 2. Login as Employee 3. Navigate to Wallet 4. View badge detail 5. Share badge | All pages render correctly on mobile, hamburger menu works, touch targets adequate, no horizontal scroll | |

---

## Summary

| Epic | Test Cases | IDs |
|------|-----------|-----|
| Epic 1: Infrastructure | 2 | UAT-001 to UAT-002 |
| Epic 2: Authentication | 5 | UAT-003 to UAT-007 |
| Epic 3: Templates | 4 | UAT-008 to UAT-011 |
| Epic 4: Issuance | 4 | UAT-012 to UAT-015 |
| Epic 5: Wallet | 3 | UAT-016 to UAT-018 |
| Epic 6: Verification | 3 | UAT-019 to UAT-021 |
| Epic 7: Sharing | 3 | UAT-022 to UAT-024 |
| Epic 8: Bulk Issuance | 3 | UAT-025 to UAT-027 |
| Epic 9: Revocation | 3 | UAT-028 to UAT-030 |
| Epic 10: Production | 3 | UAT-031 to UAT-033 |
| Cross-Epic | 2 | UAT-034 to UAT-035 |
| **Total** | **35** | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Scrum Master | | | |
| Product Owner | | | |
