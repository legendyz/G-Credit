# Sprint 7 Pre-Development Checklist

**Sprint Start Date:** February 3, 2026 (Day 1)  
**Last Updated:** February 1, 2026  
**Purpose:** Ensure all prerequisites completed before Sprint 7 execution

---

## ✅ Completed Tasks (Today - Feb 1)

### **Product Owner (LegendZhu)**
- ✅ **Action #15:** Azure User.Read.All permission verified (G-Credit-Dev app)
  - Permission: User.Read.All (Application type)
  - Status: Granted for MSFT
  - Verified: Feb 1, 2026

### **Scrum Master (Bob)**
- ✅ **Action #1:** Story 0.2b created (Sprint 8 backlog)
- ✅ **Action #2:** Story 0.3 created (CSP Security Headers)
- ✅ **Action #3:** Story U.2b created (M365 Production Hardening)
- ✅ **Action #6:** backlog.md updated (7-day timeline, split stories)
- ✅ **Action #7:** sprint-tracking.md updated (7-day timeline, revised estimates)
- ✅ **Action #8:** Stories 9.1-9.5 estimates updated (meeting decisions)
- ✅ **Action #9:** Meeting minutes recorded (580 lines)
- ✅ **Action #10:** Sprint 8 tech debt backlog created
- ✅ **Action #16:** ADR-008 updated (User.Read.All permission added)
- ✅ **Additional:** Accessibility tools setup guide created
- ✅ **Additional:** M365 auto role detection implemented in U.2a

**Git Commits:** 10 commits pushed (8,000+ lines of documentation)

---

## ⏳ Remaining Tasks (Before Day 1 - Feb 3)

### **🎨 UX Designer (Amelia) - Action #11**
**Task:** Provide Login wireframe + ARIA specs  
**Estimated Time:** 2 hours  
**Deadline:** Before Day 1 (Feb 3)  
**Status:** ⏳ **TODO**

**Deliverables:**
- [ ] Login page wireframe (Figma/Excalidraw)
- [ ] Component layout:
  - [ ] Email input field
  - [ ] Password input field
  - [ ] Login button
  - [ ] Error message placement
  - [ ] Forgot password link position
- [ ] ARIA specifications:
  - [ ] `aria-label` for inputs
  - [ ] `aria-required="true"` for required fields
  - [ ] `aria-invalid="true"` for error states
  - [ ] `aria-describedby` for error messages
  - [ ] `role="alert"` for error notifications
- [ ] Basic color scheme (consistent with existing TimelineView)
- [ ] Font sizes and spacing

**Reference:** Story 0.2a requirements (6h MVP implementation)

**Priority:** HIGH - Blocks Story 0.2a on Day 3

---

### **🏗️ Software Architect (Amelia) - Action #12**
**Task:** Update Story 9.1 tech spec (AuditLog, enum)  
**Estimated Time:** 1 hour  
**Deadline:** Before Day 1 (Feb 3)  
**Status:** ⏳ **TODO**

**Deliverables:**
- [ ] AuditLog Prisma schema documented in Story 9.1
- [ ] BadgeStatus enum update (add REVOKED)
- [ ] API idempotency pattern example
- [ ] Database index recommendations
- [ ] TDD approach guidelines

**Current State:** Story 9.1 already has basic AuditLog schema in AC4  
**Remaining Work:** Add detailed implementation notes and TDD guidance

**Reference:** 
- EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md (Must-Fix Items)
- Story 9.1 AC3-AC4

**Priority:** HIGH - Developer starts this story on Day 1 morning

---

### **👨‍💻 Lead Developer (Amelia) - Action #13**
**Task:** Setup axe-core + eslint-plugin-jsx-a11y  
**Estimated Time:** 30 minutes  
**Deadline:** Day 1 morning (Feb 3, before Story 9.1 starts)  
**Status:** ⏳ **TODO**

**Deliverables:**
- [ ] Install npm packages:
  ```bash
  cd gcredit-project/frontend
  npm install --save-dev axe-core @axe-core/react eslint-plugin-jsx-a11y
  ```
- [ ] Update `eslint.config.js` with jsx-a11y plugin
- [ ] Create `src/lib/axe-setup.ts` with dev-mode configuration
- [ ] Update `src/main.tsx` to import axe-setup
- [ ] Verify `npm run lint` works
- [ ] Verify `npm run dev` shows axe violations in console

**Reference:** 
- accessibility-tools-setup.md (complete guide)
- Sprint 7 timeline shows 0.5h on Day 1

**Priority:** HIGH - Must complete before any Story 0.2a work

---

## 📋 Additional Reminders (Not Action Items)

### **For Developer (Day 2 - Feb 4)**
- [ ] **Action #14:** Schedule 15-min design sync meeting with UX Designer
  - Time: Day 2 morning or afternoon
  - Topics: Review Login wireframe, discuss any UX questions
  - Attendees: Developer + UX Designer

### **For Product Owner (Day 3 - Feb 5)**
**Before Story U.2a implementation:**
- [ ] Prepare Admin and Issuer email list for .env configuration
- [ ] Verify M365 organizational structure (Manager-Employee relationships)
- [ ] Available for 15-min M365 sync kickoff call
- [ ] Review first sync output to confirm role assignments

---

## 🚨 Critical Path Check

### **Can Sprint 7 Start Without These Tasks?**

| Task | Blocks Day 1? | Blocks Day 2? | Blocks Day 3? | Can Defer? |
|------|--------------|---------------|---------------|------------|
| **Action #11 (Login wireframe)** | ❌ No | ❌ No | ✅ **YES** | No |
| **Action #12 (Story 9.1 tech spec)** | ✅ **YES** | ❌ No | ❌ No | No |
| **Action #13 (axe-core setup)** | ⚠️ Partial | ❌ No | ❌ No | Yes (15min) |

**Analysis:**
- ✅ **Day 1 can start** if Action #12 is completed (or Story 9.1 has sufficient detail)
- ✅ **Action #13 can be done Day 1 morning** (only 30 minutes)
- ⚠️ **Action #11 must be done before Day 3** (Story 0.2a starts Day 3)

---

## 📊 Completion Status

**Today (Feb 1) - Bob's Work:**
- ✅ 10/10 planned tasks completed (100%)
- ✅ 2 additional enhancements completed
- ✅ Total: 8,000+ lines of documentation

**Remaining (Before Feb 3):**
- ⏳ 3 tasks remaining (3.5 hours total)
- ⏳ Owners: UX Designer (2h), Architect (1h), Developer (0.5h)

**Overall Readiness:**
- 📊 **90% Complete** (13/16 action items done)
- 🎯 **Sprint 7 can start on Feb 3** if remaining tasks completed Feb 2

---

## 🗓️ Recommended Schedule (Feb 2)

### **Morning (Feb 2):**
- **Architect (Amelia):** Complete Action #12 (1 hour)
  - Update Story 9.1 with AuditLog details
  - Document TDD approach

### **Afternoon (Feb 2):**
- **UX Designer (Amelia):** Complete Action #11 (2 hours)
  - Create Login wireframe
  - Document ARIA specifications

### **Day 1 Morning (Feb 3):**
- **Developer (Amelia):** Complete Action #13 (30 minutes)
  - Setup axe-core tools
  - Verify configuration

---

## ✅ Sign-Off Checklist (Day 1 Morning - Feb 3)

Before starting Story 9.1 development, verify:

- [ ] Story 9.1 has complete AuditLog technical specification
- [ ] Story 9.1 has TDD approach documented
- [ ] axe-core and accessibility tools installed
- [ ] `npm run lint` passes with accessibility rules
- [ ] Login wireframe available (for Day 3 reference)
- [ ] All team members have pulled latest sprint branch
- [ ] Product Owner aware of Sprint 7 start

**If all checked:** ✅ Sprint 7 Day 1 can proceed!

---

## 📞 Contact & Escalation

**If tasks not completed by Feb 3:**
- UX Designer delay → Contact Product Owner to prioritize or defer Story 0.2a
- Architect delay → Developer can start Story 9.2 instead (Day 1 afternoon)
- Developer delay → Setup can be done Day 1 first 30 minutes

**Scrum Master Responsibility:**
- Check task completion status Feb 2 EOD
- Send reminder to task owners if needed
- Adjust Sprint 7 Day 1 plan if delays occur

---

**Created By:** Bob (Scrum Master)  
**Date:** February 1, 2026  
**Last Review:** February 1, 2026  
**Next Review:** February 2, 2026 EOD
