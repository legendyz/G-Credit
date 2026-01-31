# Sprint 7 - Complete Badge Lifecycle UAT Plan

**Sprint:** Sprint 7  
**Test Phase:** Complete Lifecycle UAT  
**Date:** February 5, 2026 (Day 3)  
**Duration:** 6-8 hours  
**Tester:** LegendZhu (Product Owner) + Amelia (Dev Agent)  
**Purpose:** Verify complete badge lifecycle from Admin creation to External verification, including new Revocation feature

---

## 🎯 UAT Objectives

1. **Verify Complete User Flows** - Test entire badge lifecycle across all 4 user roles
2. **Validate Revocation Feature** - Ensure Epic 9 (Badge Revocation) works correctly
3. **Identify UX Issues** - Find friction points, confusing UI, and usability problems
4. **Document Bugs** - Create prioritized list of issues for immediate fixing
5. **Capture User Experience** - Record videos to see actual usage patterns

---

## 🧪 Test Scenarios Overview

| Scenario | Focus Area | Roles Tested | Duration |
|----------|-----------|--------------|----------|
| **Scenario 1** | Happy Path - Complete Lifecycle | All 4 roles | 2-3h |
| **Scenario 2** | Error Cases & Edge Cases | All 4 roles | 1-2h |
| **Scenario 3** | Privacy & Security | Employee, External | 1h |
| **Scenario 4** | Integration Points | Admin, Employee | 1-2h |

**Total Estimated Time:** 6-8 hours

---

## 📋 Pre-UAT Setup Checklist

### Environment Setup
- [ ] Frontend dev server running (`npm run dev` at http://localhost:5173)
- [ ] Backend dev server running (`npm run start:dev` at http://localhost:3000)
- [ ] PostgreSQL database connected and seeded
- [ ] Azure Blob Storage accessible
- [ ] Email service configured (Ethereal or Azure Communication Services)
- [ ] Browser DevTools open (check console errors)

### Demo Data Setup
- [ ] Run demo seed script: `npm run seed:demo`
- [ ] Verify 3 admin accounts created
- [ ] Verify 5 employee accounts created
- [ ] Verify 10 badge templates created
- [ ] Verify 20 badges in various states (ISSUED, CLAIMED, REVOKED)

### Recording Tools
- [ ] OBS Studio or Loom installed and configured
- [ ] Screen recording started
- [ ] Audio recording enabled (for narration)

### Test Accounts
```
Admin Account:
- Email: admin@gcredit.com
- Password: Admin123!

Issuer Account:
- Email: issuer@gcredit.com
- Password: Issuer123!

Employee Account 1:
- Email: john.doe@company.com
- Password: Employee123!

Employee Account 2:
- Email: jane.smith@company.com
- Password: Employee123!
```

---

## 🧪 Scenario 1: Happy Path - Complete Badge Lifecycle

**Objective:** Verify that a badge can successfully go through its entire lifecycle from creation to revocation

**Duration:** 2-3 hours

### Step 1.1: Badge Template Creation (Admin)

**Login as Admin** (admin@gcredit.com)

1. Navigate to Badge Templates page
2. Click "Create New Template"
3. Fill in template details:
   - **Name:** "SQL Database Expert"
   - **Category:** "Technical Skills"
   - **Description:** "Demonstrates proficiency in SQL database design and optimization"
   - **Criteria:** "Complete advanced SQL course + Build database project"
   - **Skills:** Add "SQL", "Database Design", "Performance Tuning"
   - **Expiration:** None
4. Upload badge image (use test image from `test-images/`)
5. Click "Create Template"

**Expected Results:**
- ✅ Template created successfully
- ✅ Success message displayed
- ✅ Template appears in template catalog
- ✅ Image uploaded to Azure Blob Storage
- ✅ Template status = ACTIVE

**Record:**
- [ ] Screenshot of created template
- [ ] Console errors (if any)
- [ ] Time taken: _____ minutes

---

### Step 1.2: Badge Issuance (Admin)

**Stay logged in as Admin**

1. Navigate to "Issue Badge" page
2. Select template: "SQL Database Expert"
3. Search and select recipient: john.doe@company.com
4. Add evidence/justification: "Completed SQL Course on 2026-01-15"
5. Optional: Attach evidence file (PDF certificate)
6. Click "Issue Badge"

**Expected Results:**
- ✅ Badge issued successfully
- ✅ Badge status = ISSUED (PENDING claim)
- ✅ Email notification sent to john.doe@company.com
- ✅ Badge appears in "Issued Badges" admin dashboard
- ✅ Audit log entry created

**Verify Email Notification:**
- [ ] Open Ethereal inbox for john.doe@company.com
- [ ] Email received with badge details
- [ ] "Claim Your Badge" button present
- [ ] Claim link valid and working

**Record:**
- [ ] Screenshot of issuance confirmation
- [ ] Screenshot of email notification
- [ ] Email delivery time: _____ seconds
- [ ] Console errors (if any)

---

### Step 1.3: Badge Claiming (Employee)

**Logout and login as Employee** (john.doe@company.com)

1. Check email for badge notification
2. Click "Claim Your Badge" link in email
3. Review badge details on claim page
4. Click "Claim Badge" button

**Expected Results:**
- ✅ Redirected to badge wallet
- ✅ Badge status updated to CLAIMED
- ✅ Badge appears in wallet with full details
- ✅ Claim timestamp recorded

**Badge Detail Inspection:**
- [ ] Open badge detail modal
- [ ] Verify badge image displays correctly
- [ ] Verify issuer information shown
- [ ] Verify issue date displayed
- [ ] Verify evidence files accessible (if attached)
- [ ] Verify Open Badges 2.0 assertion available

**Record:**
- [ ] Screenshot of badge in wallet
- [ ] Screenshot of badge detail modal
- [ ] Time from issuance to claim: _____ minutes

---

### Step 1.4: Badge Sharing (Employee)

**Stay logged in as Employee** (john.doe@company.com)

1. Open badge detail modal for "SQL Database Expert"
2. Click "Share" tab

**Test Email Sharing:**
- [ ] Click "Share via Email"
- [ ] Enter recipient email: test-recipient@example.com
- [ ] Add optional message: "Check out my new SQL badge!"
- [ ] Click "Send"
- [ ] Verify success message
- [ ] Verify share event tracked in analytics

**Test LinkedIn Sharing:**
- [ ] Click "Share to LinkedIn"
- [ ] Verify LinkedIn OAuth flow initiated (or mock)
- [ ] Verify badge details pre-filled

**Test Widget Embedding:**
- [ ] Click "Embed Widget"
- [ ] Copy iframe code
- [ ] Verify preview shows badge correctly
- [ ] Test different widget sizes (small, medium, large)

**Expected Results:**
- ✅ Email share successful
- ✅ LinkedIn share link generated
- ✅ Widget iframe code valid
- ✅ Share analytics recorded (check Story 7.5 endpoints)

**Record:**
- [ ] Screenshot of share modal
- [ ] Screenshot of sent email
- [ ] Widget iframe code copied
- [ ] Console errors (if any)

---

### Step 1.5: Badge Verification (External Viewer)

**Logout or use incognito mode (no authentication)**

1. Get badge verification URL from badge detail modal or email
2. Navigate to verification URL: `http://localhost:3000/verify/{verificationId}`

**Expected Results:**
- ✅ Verification page loads without authentication
- ✅ Badge details displayed (name, description, criteria)
- ✅ Issuer information shown
- ✅ Recipient email masked (j***@company.com)
- ✅ Issue date displayed
- ✅ Status badge shows "VALID" in green
- ✅ Badge image displays correctly
- ✅ Open Badges 2.0 assertion available for download

**Test JSON-LD Assertion:**
- [ ] Click "Download JSON-LD" button
- [ ] Verify JSON file downloaded
- [ ] Open JSON file and verify structure
- [ ] Verify all required Open Badges 2.0 fields present

**Record:**
- [ ] Screenshot of verification page
- [ ] Screenshot of JSON-LD assertion
- [ ] Verification page load time: _____ seconds

---

### Step 1.6: Badge Revocation (Admin) ✨ NEW

**Login as Admin** (admin@gcredit.com)

1. Navigate to "Issued Badges" admin dashboard
2. Find the "SQL Database Expert" badge issued to john.doe@company.com
3. Click "Revoke" button

**Revocation Modal:**
- [ ] Modal appears with revocation form
- [ ] Reason dropdown available with options:
  - Policy Violation
  - Issued in Error
  - Expired
  - Other
- [ ] Select reason: "Issued in Error"
- [ ] Add notes: "Wrong recipient selected during bulk import"
- [ ] Click "Confirm Revocation"

**Expected Results:**
- ✅ Badge revoked successfully
- ✅ Success message displayed
- ✅ Badge status updated to REVOKED
- ✅ Revocation notification email sent to john.doe@company.com
- ✅ Audit log entry created with reason and notes

**Record:**
- [ ] Screenshot of revocation modal
- [ ] Screenshot of success confirmation
- [ ] Console errors (if any)

---

### Step 1.7: Post-Revocation Employee View (Employee)

**Login as Employee** (john.doe@company.com)

1. Navigate to badge wallet
2. Locate "SQL Database Expert" badge

**Expected Results:**
- ✅ Badge shown in wallet (not hidden)
- ✅ Visual indicator of revocation (greyed out, red badge, or "REVOKED" label)
- ✅ Badge detail modal shows revocation details
- ✅ Revocation reason displayed (if appropriate)
- ✅ Revocation date shown
- ✅ **Share button disabled** (revoked badges cannot be shared)
- ✅ Download still available (for employee's records)

**Test Sharing Restriction:**
- [ ] Try to click "Share" button
- [ ] Verify button is disabled or shows error message
- [ ] Verify tooltip explains why sharing is disabled

**Email Notification:**
- [ ] Check john.doe@company.com inbox
- [ ] Verify revocation notification received
- [ ] Email explains revocation with appropriate tone
- [ ] Email includes revocation reason (if public)

**Record:**
- [ ] Screenshot of revoked badge in wallet
- [ ] Screenshot of badge detail showing revocation
- [ ] Screenshot of revocation email

---

### Step 1.8: Post-Revocation Verification (External Viewer)

**Logout or use incognito mode**

1. Navigate to same verification URL used in Step 1.5

**Expected Results:**
- ✅ Verification page still loads (badge not deleted)
- ✅ Status badge shows "REVOKED" in red
- ✅ Revocation date displayed
- ✅ Warning message: "This badge has been revoked and is no longer valid"
- ✅ Revocation reason shown (if public-facing)
- ✅ Badge image still visible (but marked as revoked)
- ✅ JSON-LD assertion updated with revoked status

**Test JSON-LD Assertion:**
- [ ] Download JSON-LD file
- [ ] Verify `revoked` field = true
- [ ] Verify `revokedAt` timestamp present
- [ ] Verify `revocationReason` included

**Record:**
- [ ] Screenshot of revoked verification page
- [ ] Screenshot of updated JSON-LD
- [ ] Compare with original JSON-LD from Step 1.5

---

### Scenario 1 Summary

**Total Time Taken:** _____ hours

**Checkpoints Passed:** ____ / 50

**Issues Found:**
| Priority | Description | Screenshot | Assigned To |
|----------|-------------|------------|-------------|
| P0       |             |            |             |
| P1       |             |            |             |
| P2       |             |            |             |

---

## 🧪 Scenario 2: Error Cases & Edge Cases

**Objective:** Test error handling, validation, and edge cases

**Duration:** 1-2 hours

### Test 2.1: Revoke Already-Revoked Badge

**Login as Admin**

1. Find a badge that was already revoked
2. Click "Revoke" button again

**Expected Results:**
- ✅ Error message: "Badge is already revoked"
- ✅ No duplicate revocation entries in audit log
- ✅ Graceful error handling (no crash)

---

### Test 2.2: Claim Revoked Badge

**As Employee:**

1. Get claim link for a revoked badge (from old email)
2. Try to claim the badge

**Expected Results:**
- ✅ Error message: "This badge has been revoked and cannot be claimed"
- ✅ User redirected or shown error page
- ✅ Badge status remains REVOKED

---

### Test 2.3: Share Revoked Badge

**As Employee:**

1. Navigate to revoked badge detail
2. Try to access share functionality

**Expected Results:**
- ✅ Share button disabled
- ✅ Tooltip explains: "Revoked badges cannot be shared"
- ✅ No share API calls made

---

### Test 2.4: Authorization Checks

**As non-owner Employee (jane.smith@company.com):**

1. Try to access admin revocation UI (direct URL manipulation)
2. Try to API call to revoke badge not owned by user

**Expected Results:**
- ✅ 403 Forbidden error
- ✅ User redirected to home or error page
- ✅ Security audit log entry created

---

### Test 2.5: Badge Without Image

**As Admin:**

1. Create badge template without uploading image
2. Issue badge from that template
3. Verify badge displays with placeholder image

---

### Test 2.6: Very Long Revocation Notes

**As Admin:**

1. Revoke badge with 1000+ character notes
2. Verify text is stored correctly
3. Verify display truncation on UI

---

### Scenario 2 Summary

**Issues Found:**
| Priority | Description | Screenshot | Fix Estimate |
|----------|-------------|------------|--------------|
|          |             |            |              |

---

## 🔒 Scenario 3: Privacy & Security

**Objective:** Verify privacy controls and security measures

**Duration:** 1 hour

### Test 3.1: Public/Private Badge Toggle

**As Employee:**

1. Open badge detail
2. Toggle privacy setting from Public to Private
3. Verify verification URL becomes inaccessible (or shows "Private Badge")

---

### Test 3.2: Email Masking on Public Pages

**As External Viewer:**

1. Visit verification page for public badge
2. Verify email is masked (e.g., j***@company.com)
3. Verify no full email exposed in HTML source or API responses

---

### Test 3.3: Evidence File Access Control

**As External Viewer:**

1. Try to access evidence file URL directly (without SAS token)
2. Verify access denied

**As Badge Owner:**

1. Access evidence file from badge detail
2. Verify SAS token generated
3. Verify token expires after 5 minutes

---

### Test 3.4: Revocation Reason Privacy

**As Admin:**

1. Revoke badge with sensitive reason
2. Verify reason visibility control:
   - Admin can see full reason
   - Employee sees reason (if allowed)
   - External viewer sees generic message or nothing

---

### Scenario 3 Summary

**Security Issues Found:**
| Priority | Issue | Impact | Fix Needed |
|----------|-------|--------|------------|
|          |       |        |            |

---

## 🔗 Scenario 4: Integration Points

**Objective:** Test external service integrations

**Duration:** 1-2 hours

### Test 4.1: Email Notification Delivery

**Test all email types:**
- [ ] Badge issuance notification
- [ ] Badge claim confirmation
- [ ] Badge share notification
- [ ] Badge revocation notification

**Verify:**
- ✅ Email delivered within 30 seconds
- ✅ Email HTML renders correctly
- ✅ All links functional
- ✅ Images load correctly
- ✅ Responsive on mobile email clients

---

### Test 4.2: Microsoft Graph API Integration

**If enabled:**

- [ ] Teams notification sent on badge issuance
- [ ] Adaptive Card displays correctly in Teams
- [ ] "Claim Badge" action button works
- [ ] Email sending via Microsoft Graph

---

### Test 4.3: Azure Blob Storage

**Test image operations:**
- [ ] Badge image upload
- [ ] Badge image retrieval (public URL)
- [ ] Evidence file upload
- [ ] Evidence file download with SAS token

---

### Test 4.4: Analytics Tracking

**Verify events tracked:**
- [ ] Badge shared via email
- [ ] Badge shared to LinkedIn
- [ ] Widget embed code generated
- [ ] Verification page visited
- [ ] Badge revoked

**Check analytics endpoint:**
- [ ] GET /api/badges/{id}/analytics returns correct data
- [ ] Share count increments
- [ ] View count increments

---

### Scenario 4 Summary

**Integration Issues:**
| Service | Issue | Status |
|---------|-------|--------|
|         |       |        |

---

## 📊 UAT Test Report Template

### Executive Summary

**Test Date:** February 5, 2026  
**Tester:** LegendZhu + Amelia  
**Total Test Time:** _____ hours

**Overall Result:** ✅ PASS / ⚠️ PASS WITH ISSUES / ❌ FAIL

---

### Test Scenarios Summary

| Scenario | Result | Issues Found | Time Taken |
|----------|--------|--------------|------------|
| 1. Complete Lifecycle | | | |
| 2. Error Cases | | | |
| 3. Privacy & Security | | | |
| 4. Integration Points | | | |

---

### Issues Summary

#### P0 - Blocker (Must fix immediately)
1. [ ] Issue description
   - **Impact:** [description]
   - **Steps to Reproduce:** [steps]
   - **Expected:** [expected]
   - **Actual:** [actual]
   - **Screenshot:** [link]

#### P1 - High Priority (Fix in Sprint 7)
1. [ ] Issue description
   ...

#### P2 - Medium Priority (Fix in Sprint 8)
1. [ ] Issue description
   ...

#### P3 - Low Priority (Backlog)
1. [ ] Issue description
   ...

---

### User Experience Observations

**What Worked Well:**
- 

**Friction Points:**
- 

**Confusing UI Elements:**
- 

**Missing Feedback/Guidance:**
- 

---

### Recommendations

1. **Immediate Fixes (P0/P1):**
   - 

2. **UX Improvements:**
   - 

3. **Future Enhancements:**
   - 

---

### Screen Recordings

- [ ] Complete lifecycle flow: [link to video]
- [ ] Revocation workflow: [link to video]
- [ ] Error handling: [link to video]

---

### Sign-Off

- [ ] **Developer:** Amelia - All P0 issues fixed
- [ ] **Product Owner:** LegendZhu - UAT approved
- [ ] **Ready for Merge:** Yes / No

---

**UAT Completed:** ________  
**Re-test Date (if needed):** ________  
**Final Approval:** ________

---

## 📚 References

- [Sprint 7 Backlog](backlog.md)
- [Epic 9 Stories](9-1-revoke-api.md) (and 9.2-9.5)
- [Sprint 6 Manual Testing Guide](../sprint-6/manual-testing-guide.md)
- [Open Badges 2.0 Specification](https://www.imsglobal.org/spec/ob/v2p0/)

---

**Document Owner:** Bob (Scrum Master)  
**Created:** January 31, 2026  
**Sprint:** Sprint 7 - Day 3 execution
