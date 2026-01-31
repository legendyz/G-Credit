# Epic 9 Feasibility Review - Executive Summary

**Developer:** Amelia, Lead Developer  
**Date:** January 31, 2026  
**Status:** 🚨 NOT FEASIBLE AS PLANNED

---

## Bottom Line

❌ **CANNOT fit Epic 9 (26 hours) into Day 1-2 (16 hours)**

**Critical Issues:**
1. **Math Problem:** 26h ÷ 16h = 162.5% capacity (62.5% overcommit)
2. **Hard Blocker:** Story 9.5 (Admin UI) cannot start until Day 3 (needs Story 0.2a Login)
3. **Design Blocker:** Story 9.3 (Wallet UI) needs 7 UX decisions before starting
4. **Architecture Debt:** +6 hours added for must-fix items (AuditLog, Open Badges compliance, etc.)

---

## Revised Story Estimates

| Story | Original | Revised | Delta | Reason |
|-------|----------|---------|-------|--------|
| 9.1 - Revoke API | 5h | **7h** | +2h | AuditLog table + enum refactoring |
| 9.2 - Verification | 3h | **4h** | +1h | Open Badges `/assertion` endpoint |
| 9.3 - Wallet UI | 3h | **4h** | +1h | API filtering + UX decisions |
| 9.4 - Notifications | 2h | **4h** | +2h | Template engine + queue integration |
| 9.5 - Admin UI | 4h | **4h** | 0h | (Blocked until Day 4) |
| **TOTAL** | **17h** | **23h** | **+6h** | |

---

## Recommended Solution: MVP Split

### ✅ MVP Scope (Day 1-2, 15 hours)

**Day 1: Backend Foundation**
- Story 9.1: Badge Revocation API (7h)
  - Create AuditLog table
  - Implement revocation endpoint
  - Authorization guards
  - Testing

**Day 2: Frontend Revocation Display**
- Story 9.2: Verification Page (4h)
  - Show revoked status on public page
  - Disable downloads
- Story 9.3: Wallet Display (4h)
  - Employee sees revoked badges
  - Collapsible history section

**MVP Deliverable:**
- ✅ Core revocation works (API functional)
- ✅ Employee sees revoked badges in wallet
- ✅ Public verification shows revoked status
- ⚠️ Admin must use API directly (no UI yet)
- ⚠️ No email notifications yet

### ✅ Polish Scope (Day 4, 8 hours)

**After Story 0.2a (Login) completes Day 3:**

**Day 4: Admin UI + Notifications**
- Story 9.5: Admin Revocation UI (4h)
  - Badge Management page updates
  - Revoke modal component
  - Integration testing
- Story 9.4: Email Notifications (3h)
  - Simplified: template literals
  - Fire-and-forget emails
- Integration Testing (1h)

**Final Deliverable:**
- ✅ Complete end-to-end revocation
- ✅ Admin UI for revoking
- ✅ Email notifications
- ✅ Ready for UAT Day 4

---

## Story Feasibility Ratings

### ✅ FEASIBLE (Can complete as planned)
- **Story 9.1 (API):** 90% confidence - clear requirements, no blockers
- **Story 9.2 (Verification):** 85% confidence - straightforward frontend work

### ⚠️ AT RISK (Possible but tight)
- **Story 9.3 (Wallet):** 70% confidence - needs UX decisions by Day 1 AM
- **Story 9.4 (Notifications):** 75% confidence - can simplify or defer

### ❌ NOT FEASIBLE (Day 1-2)
- **Story 9.5 (Admin UI):** 0% confidence Day 1-2 - hard dependency on Story 0.2a (Login)

---

## Critical Decisions Needed

### 1. PO Approval: MVP Split
**Question:** Approve splitting Epic 9 into MVP (Day 1-2) + Polish (Day 4)?
**Impact:** Admin must use API directly Days 1-3, gets UI Day 4
**Recommendation:** ✅ APPROVE - logical dependency on Login system

### 2. UX Decisions (7 needed)
**Deadline:** Feb 3, 09:00 AM (before Story 9.3 starts)
**Owner:** Product Owner + UX Designer
**Top Priority Decisions:**
- **Q1:** Wallet display pattern (tabs vs. collapsible section)
  - **Recommendation:** Collapsible "Badge History" section
- **Q3:** Show revocation reason to employee?
  - **Recommendation:** Yes, with categorized messaging
- **Q9:** Public verification page tone
  - **Recommendation:** "No Longer Valid" (not harsh "REVOKED")
- **Q10:** Privacy - show reason publicly?
  - **Recommendation:** Categorize (safe: "Expired", sensitive: "Contact issuer")

### 3. Simplification Options
**Story 9.4 (Notifications):** Use template literals instead of Handlebars?
- **Saves:** 1 hour
- **Cost:** Less maintainable, defer proper templates to Sprint 8
- **Recommendation:** ✅ Simplify for MVP

**Story 9.2 (Verification):** Defer `/assertion` endpoint to Sprint 8?
- **Saves:** 1 hour
- **Cost:** Not Open Badges 2.0 compliant yet
- **Recommendation:** ⚠️ Defer if time-constrained

---

## Must-Fix Architecture Items

**Before Sprint 7 starts:**
1. ✅ Resolve soft-delete pattern: Use REVOKED enum (not just revokedAt flag)
2. ✅ Create AuditLog table (add to Story 9.1 estimate)
3. ✅ Make API idempotent (return 200 OK if already revoked, not 400)
4. ⚠️ Add `/assertion` endpoint (Open Badges compliance) - can defer
5. ⚠️ Add template rendering to EmailService - simplified for MVP
6. ⚠️ Connect to Bull queue - simplified for MVP

**Items 4-6 can be simplified or deferred to Sprint 8**

---

## UAT Impact Assessment

**Q11: What's MINIMUM for UAT on Day 4?**

### Must-Have ✅
1. Admin can revoke badge (via API or UI)
2. Employee sees revoked badge in wallet
3. Public verification shows revoked status

### Nice-to-Have ⚠️ (Can defer)
- Email notifications (Story 9.4)
- Admin UI (Story 9.5) - can use API for UAT if needed
- Open Badges 2.0 compliance

**UAT Can Proceed:** ✅ YES with MVP scope (Stories 9.1, 9.2, 9.3)

---

## Dependency Chain

```
CRITICAL PATH:

Story 9.1 (API) [Day 1]
  ↓
Stories 9.2, 9.3 [Day 2] ← Parallel
  ↓
Story 0.2a (Login) [Day 3]
  ↓
Stories 9.4, 9.5 [Day 4] ← Parallel
  ↓
UAT Testing [Day 4 PM]

BLOCKERS:
❌ Story 9.5 blocked by Story 0.2a (Login system)
⚠️ Story 9.3 blocked by UX decisions
⚠️ All stories depend on 9.1 being stable
```

---

## Risk Mitigation

### High Risk: Story 9.1 bugs block all other stories
**Mitigation:**
- Comprehensive unit + E2E tests (included in 7h)
- Manual API testing with Thunder Client
- Test authorization matrix (12 scenarios)

### Medium Risk: UX decisions delay Story 9.3
**Mitigation:**
- Use designer's recommendations
- Get async PO approval
- Fallback: implement simple tabs, refine Sprint 8

### Low Risk: Email notifications fail
**Mitigation:**
- Fire-and-forget pattern (doesn't block revocation)
- Test with Ethereal (dev SMTP)
- UAT can proceed without emails

---

## Action Items

### Immediate (Jan 31)
1. ✅ Developer feasibility review complete
2. 🔲 PO reviews UX decisions (30m)
3. 🔲 PO approves MVP split
4. 🔲 Update [sprint-tracking.md](sprint-tracking.md) with revised timeline

### Day 1 AM (Feb 3, before 09:00)
1. 🔲 PO makes final UX decisions (Q1, Q3, Q9, Q10)
2. 🔲 Developer starts Story 9.1 (API)

### Day 1 PM (Feb 3)
1. 🔲 Story 9.1 complete + tested
2. 🔲 Begin Story 9.2

### Day 2 (Feb 4)
1. 🔲 Story 9.2 complete (AM)
2. 🔲 Story 9.3 complete (PM)
3. 🔲 MVP scope done ✅

### Day 4 (Feb 6, after Login complete)
1. 🔲 Story 9.5 (Admin UI)
2. 🔲 Story 9.4 (Notifications)
3. 🔲 Integration testing
4. 🔲 UAT testing

---

## Conclusion

**Original Plan:** Epic 9 complete Day 1-2 ❌ NOT FEASIBLE

**Recommended Plan:** Epic 9 MVP (Day 1-2) + Polish (Day 4) ✅ FEASIBLE

**UAT Impact:** NONE - MVP provides complete revocation flow for testing

**Sprint Impact:** Epic 9 completes Day 4 (still on schedule for Day 4 UAT)

---

**Status:** 🚨 Awaiting PO approval for timeline adjustment

**Next Steps:**
1. PO reviews [EPIC-9-DEVELOPER-FEASIBILITY-REVIEW.md](EPIC-9-DEVELOPER-FEASIBILITY-REVIEW.md)
2. PO reviews [EPIC-9-UX-REVIEW-AMELIA.md](EPIC-9-UX-REVIEW-AMELIA.md) 
3. PO approves MVP split + makes UX decisions
4. Development begins Feb 3, 08:00 AM

---

**Prepared by:** Amelia, Lead Developer  
**Reviewed by:** [Awaiting PO, UX Designer, Architect]  
**Date:** January 31, 2026
