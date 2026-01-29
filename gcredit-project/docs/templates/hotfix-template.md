# Hotfix Template

**Purpose:** Emergency production fix outside sprint cycle  
**Usage:** Critical production issues requiring immediate resolution  
**Version:** 1.0  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29

---

## 🚨 Incident Information

**Hotfix ID:** HOTFIX-YYYY-MM-DD-NNN (e.g., HOTFIX-2026-01-29-001)  
**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium  
**Status:** 🔴 Investigating | 🟡 In Progress | 🟢 Deployed | ✅ Closed  
**Production Environment:** [Dev | Staging | Production]

**Timeline:**
- **Discovered:** [YYYY-MM-DD HH:MM]
- **Fix Started:** [YYYY-MM-DD HH:MM]
- **Deployed:** [YYYY-MM-DD HH:MM]
- **Verified:** [YYYY-MM-DD HH:MM]
- **Total Duration:** [X hours Y minutes]

**Production Impact:**
- **Users Affected:** [Number/Percentage of users]
- **Services Down:** [List affected services/features]
- **Downtime:** [Duration if complete outage]
- **Data Loss:** [Yes/No - if yes, describe]

**Reported By:** [Name/Role]  
**Fixed By:** [Name/Role]  
**Verified By:** [Name/Role]

---

## 🔍 Root Cause Analysis (RCA)

### What Broke?
[Describe the symptom - what users experienced]

**Example:**
> Badge verification API (`GET /api/verify/:id`) returning 500 Internal Server Error. Users cannot verify their badges via public verification page.

### Why Did It Break?
[Identify the root cause - not just the symptom]

**Example:**
> Database query in `BadgeVerificationService.getVerificationDetails()` attempted to join with `evidence_files` table using incorrect foreign key. The column `badgeId` doesn't exist in `evidence_files` (correct column is `badge_id`).

### When Did It Start?
[Pinpoint when the issue was introduced]

**Example:**
> Introduced in commit `abc123f` on 2026-01-28 during Sprint 5. Went undetected because E2E tests don't cover verification page with evidence files.

### Why Wasn't It Caught Earlier?
[Identify gaps in testing/monitoring]

**Example:**
> - E2E tests only tested badges without evidence files
> - Staging environment had no evidence files in test data
> - Monitoring alerts not configured for public endpoints

---

## 🛠️ Fix Approach

### Minimal Change Principle ⚠️
[Describe the fix - emphasize MINIMAL change, no refactoring, no optimization]

**What Will We Change:**
[Specific file, function, line changes]

**Example:**
```typescript
// File: backend/src/badge-verification/badge-verification.service.ts
// Line 45

// ❌ BEFORE (broken):
.leftJoin('evidence_files', 'badges.badgeId', 'evidence_files.badgeId')

// ✅ AFTER (fixed):
.leftJoin('evidence_files', 'badges.id', 'evidence_files.badge_id')
```

### Why This Is Minimal?
[Justify why this is the smallest possible fix]

**Example:**
> This changes only the join condition (1 line). We are NOT refactoring the entire query builder logic, NOT adding error handling improvements, NOT optimizing performance. Those can be done later in a proper sprint story.

### Alternative Approaches Considered
[List other options and why rejected]

**Example:**
> - **Option 1:** Remove evidence files from verification page → Rejected (too drastic, hides feature)
> - **Option 2:** Refactor entire service to use Prisma relations → Rejected (too risky for hotfix, do in Sprint 6)
> - **Option 3:** Fix the join condition → ✅ **SELECTED** (minimal, low risk)

### Risk Assessment
[What could go wrong with this fix?]

**Risks:**
- 🟢 **Low:** Change is isolated, affects only one query
- 🟢 **Low:** No data migration required
- 🟢 **Low:** Can be rolled back in 2 minutes

**Mitigation:**
- Test on staging first
- Monitor error rates after deployment
- Keep previous version ready for rollback

---

## ✅ Testing Strategy

### Pre-Deployment Testing (Staging)

#### Unit Tests
- [ ] Existing unit tests still pass
- [ ] Add specific test for this bug (if time permits, otherwise add to Sprint N backlog)

#### Manual Testing (Critical Paths)
- [ ] **Test the fix works:**
  - [ ] Verify badge WITH evidence files (the broken case)
  - [ ] Verify badge WITHOUT evidence files (ensure no regression)
  - [ ] Verify with 0, 1, 3 evidence files

- [ ] **Test nothing else broke (regression):**
  - [ ] Badge issuance still works
  - [ ] Badge claim still works
  - [ ] Badge wallet still shows badges
  - [ ] Other API endpoints respond normally

- [ ] **Test rollback works:**
  - [ ] Deploy previous version to staging
  - [ ] Verify system still functional
  - [ ] Redeploy fix

#### Load Testing (if applicable)
- [ ] Verify fix doesn't degrade performance
- [ ] Check response times for verification endpoint

### Post-Deployment Monitoring (Production)
- [ ] Error rate on `/api/verify/:id` (expect: drops to 0%)
- [ ] Response time for verification endpoint (expect: <500ms)
- [ ] Successful verification count (expect: increases)
- [ ] Monitor for 30 minutes after deployment

---

## 🚀 Deployment Plan

### Pre-Deployment Checklist
- [ ] Fix tested on local environment
- [ ] Fix tested on staging environment
- [ ] Rollback plan prepared (see below)
- [ ] Stakeholders notified (if major impact)
- [ ] Monitoring dashboard open

### Deployment Window
**Planned Deployment:** [YYYY-MM-DD HH:MM] (e.g., 2026-01-29 14:00 UTC)  
**Deployment Duration:** [Estimated: 5 minutes]  
**Deployed By:** [Name]

### Deployment Steps
```bash
# 1. Backup current version tag
git tag hotfix-backup-$(date +%Y%m%d-%H%M%S)

# 2. Create hotfix branch
git checkout -b hotfix/verification-api-500-error main

# 3. Make the fix (minimal change only)
# [Edit files]

# 4. Commit with descriptive message
git add .
git commit -m "hotfix: Fix verification API 500 error with evidence files

- Fixed incorrect join column in BadgeVerificationService
- Changed badges.badgeId to badges.id
- Changed evidence_files.badgeId to evidence_files.badge_id

Fixes: HOTFIX-2026-01-29-001
Related: #[issue-number]"

# 5. Push and create PR (even for hotfix, require minimal review if possible)
git push origin hotfix/verification-api-500-error

# 6. Merge to main (fast-track approval)
# 7. Tag the hotfix
git tag -a v0.5.1-hotfix.1 -m "Hotfix: Verification API 500 error"
git push origin v0.5.1-hotfix.1

# 8. Deploy to production
# [Your deployment process]
```

### Rollback Plan 🔄
**If deployment fails or introduces new issues:**

```bash
# Option 1: Revert to previous version (fastest)
git revert HEAD
git push origin main
# Redeploy

# Option 2: Roll back to previous tag
git checkout v0.5.0
# Redeploy

# Estimated rollback time: 2 minutes
```

**Rollback Trigger Conditions:**
- Error rate on verification endpoint > 5%
- Response time > 2 seconds
- New errors appear in logs
- Stakeholder requests rollback

### Post-Deployment Verification
- [ ] **Immediate (0-5 min):**
  - [ ] Verification endpoint returns 200 OK
  - [ ] Test badge with evidence files loads successfully
  - [ ] Error logs show no new 500 errors

- [ ] **Short-term (5-30 min):**
  - [ ] Monitor error rate (expect: 0%)
  - [ ] Monitor response time (expect: <500ms)
  - [ ] Check user reports (expect: no new complaints)

- [ ] **Confirmation (30+ min):**
  - [ ] All metrics stable
  - [ ] No rollback needed
  - [ ] Hotfix declared successful ✅

---

## 📝 Post-Mortem (Complete within 24 hours)

### Lessons Learned

#### What Went Well ✅
- [What worked during incident response]

**Example:**
> - Bug isolated quickly (15 minutes)
> - Fix was straightforward (1-line change)
> - Staging environment caught the issue before production impact

#### What Could Be Improved ⚠️
- [What didn't work well]

**Example:**
> - E2E tests don't cover all badge verification scenarios
> - No monitoring alerts for public endpoint errors
> - Evidence files not in staging test data

#### Root Cause Category
- [ ] Code bug (logic error, typo)
- [ ] Configuration error
- [ ] Infrastructure issue
- [ ] Third-party service failure
- [ ] Data corruption
- [ ] Other: [Specify]

### Preventive Measures

#### Immediate Actions (Sprint N)
- [ ] Add E2E test for verification with evidence files
- [ ] Add monitoring alert for public endpoint errors
- [ ] Populate staging with realistic test data (including evidence)

#### Long-term Actions (Future Sprints)
- [ ] Review all database joins for similar issues
- [ ] Improve code review checklist (focus on join conditions)
- [ ] Add automated schema validation tests

### Follow-up Stories

#### Create User Stories in Sprint N+1:
- [ ] **Story:** Add comprehensive E2E tests for verification page (4h)
- [ ] **Story:** Configure monitoring alerts for public endpoints (2h)
- [ ] **Story:** Improve staging data seeding scripts (2h)

### Knowledge Sharing
- [ ] Update `docs/lessons-learned/lessons-learned.md`
- [ ] Share in team retrospective
- [ ] Update `docs/development/common-pitfalls.md` (if pattern identified)

---

## 📊 Incident Metrics

### Resolution Time Breakdown
| Phase | Duration | Target | Status |
|-------|----------|--------|--------|
| Detection → Acknowledgment | [X min] | <10 min | ✅/⚠️/❌ |
| Acknowledgment → Diagnosis | [X min] | <30 min | ✅/⚠️/❌ |
| Diagnosis → Fix Ready | [X min] | <1 hour | ✅/⚠️/❌ |
| Fix Ready → Deployed | [X min] | <30 min | ✅/⚠️/❌ |
| **Total Time to Resolution** | **[X hours Y min]** | **<2 hours** | ✅/⚠️/❌ |

### Impact Assessment
- **Severity Level:** [1-5, where 5 = critical]
- **Business Impact:** [Revenue loss, reputation, user trust]
- **Technical Debt Created:** [Any shortcuts taken that need cleanup]

---

## 🔗 Related Documents

- **Related Issue:** [Link to GitHub issue]
- **Related PR:** [Link to Pull Request]
- **Monitoring Dashboard:** [Link to production monitoring]
- **Incident Chat Log:** [Link to Slack thread / Teams conversation]
- **Sprint Backlog:** [Link to sprint where follow-up stories added]

---

## 📋 Hotfix Checklist Summary

**Before Fix:**
- [ ] Incident severity assessed
- [ ] Root cause identified
- [ ] Fix approach decided (minimal change)
- [ ] Stakeholders notified

**During Fix:**
- [ ] Fix implemented (minimal change only)
- [ ] Tested on staging
- [ ] Rollback plan ready
- [ ] Deployed to production
- [ ] Post-deployment verified

**After Fix:**
- [ ] Monitoring confirms fix works
- [ ] Post-mortem completed (within 24h)
- [ ] Preventive measures identified
- [ ] Follow-up stories created
- [ ] Lessons learned documented

---

**Tips for Effective Hotfixes:**

1. **Speed vs Quality Trade-off:**
   - Hotfix = Fix the problem NOW with minimal change
   - Proper fix = Can be done later in sprint with full testing

2. **Minimal Change Principle:**
   - Don't refactor
   - Don't optimize
   - Don't add features
   - Just fix the specific bug

3. **Testing Priority:**
   - Fix works ✅ (highest priority)
   - Nothing else broke ✅ (critical)
   - Rollback works ✅ (safety net)

4. **Communication:**
   - Notify stakeholders immediately (severity, impact, ETA)
   - Update status as you progress
   - Confirm resolution after deployment

5. **Learn and Improve:**
   - Every hotfix is a learning opportunity
   - Always complete post-mortem
   - Create follow-up stories to prevent recurrence

---

**Template Version:** 1.0  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29  
**Maintained By:** G-Credit Development Team  
**Review Frequency:** After each hotfix (continuous improvement)
