# Sprint 7 Developer Context Guide

> **📍 How to use this file:**  
> Reference this guide when starting ANY Story in Sprint 7 to ensure you follow all architectural and UX decisions made during planning.

---

## 🎯 Quick Start for Any Sprint 7 Story

When starting a new story, follow this pattern:

```
1. Read your story file (e.g., 9-2-verification-status.md)
2. Check "Key Decisions" section below for story-specific guidance
3. Reference related docs as needed
4. Execute [DS] Dev Story workflow
```

---

## 📚 Essential Sprint 7 Context Documents

### **Core Planning Documents:**
1. **`sprint-planning.md`** (4,305 lines)
   - Complete Sprint 7 scope (11 stories)
   - All acceptance criteria
   - Story dependencies and sequencing

2. **`sprint-7-technical-review-meeting.md`** (5,800 lines)
   - 18 technical decisions
   - Architecture discussions
   - UX decisions (reason categorization, accessibility)
   - Story splitting rationale (MVP vs Enhancement)

3. **`sprint-tracking.md`** (547 lines)
   - 7-day timeline
   - Story execution order
   - Daily coordination requirements

### **UX Specifications:**
4. **`login-ux-spec.md`** (500+ lines)
   - Login page wireframes (desktop + mobile)
   - Complete ARIA implementation guide
   - Visual design system (colors, typography, spacing)
   - Keyboard navigation specs
   - For Stories: 0.2a

### **Architecture Guides:**
5. **`9-1-revoke-api.md`** - Architect Notes (500+ lines)
   - TDD implementation guide (Phase 1/2/3)
   - 15-20 unit test examples
   - Performance optimization notes
   - For Stories: 9.1 (already complete), reference for 9.2-9.5

---

## 🔑 Key Decisions by Story

### **Story 9.1: Badge Revocation API** ✅ COMPLETE
- **TDD Mandatory:** Write tests FIRST, then implementation
- **Authorization:** Only Manager role can revoke
- **Idempotency:** Repeated revoke returns 200 OK
- **Audit Logging:** Create AuditLog entry for every revocation
- **Reference:** Section "ARCHITECT NOTES" in 9-1-revoke-api.md

---

### **Story 9.2: Revoked Badge Verification Display** 🔵 NEXT
- **Reason Categorization:** Public reasons (Expired, Error) vs Private reasons (Policy, Fraud)
- **Public Display:** Show specific reason for public categories only
- **Private Display:** Show generic "This badge has been revoked" for private categories
- **Visual Design:** Red alert banner, warning icon, ARIA role="alert"
- **Disabled Actions:** Hide/disable Download and Share buttons
- **Reference:** 
  - Technical Review Decision #3 (reason display policy)
  - Story file section "⚠️ UX DESIGN DECISION"

**Key Implementation Notes:**
```typescript
// Backend: Categorize reason
const publicReasons = ['Expired', 'Issued in Error', 'Duplicate'];
const isPublicReason = publicReasons.includes(revocationReason);

// Frontend: Conditional display
{isPublicReason ? reason : 'This badge has been revoked'}
```

---

### **Story 9.3: Employee Wallet Revoked Display** 🔵 PENDING
- **Visual Distinction:** Gray out revoked badges, add "REVOKED" label
- **Sorting:** Revoked badges at bottom of list
- **No Share:** Disable share functionality for revoked badges
- **Filter Option:** "Show active only" toggle
- **Reference:** Technical Review Decision #4

---

### **Story 9.4: Revocation Notifications** 🔵 PENDING
- **Email Template:** Use existing notification service
- **Recipients:** Badge recipient + manager (if applicable)
- **Content:** Reason (if public), revocation date, issuer contact
- **Timing:** Send immediately after revocation
- **Reference:** Technical Review Decision #5

---

### **Story 9.5: Admin Revocation UI** 🔵 PENDING
- **Batch Operations:** Revoke multiple badges at once
- **Reason Dropdown:** Pre-defined categories + "Other" option
- **Confirmation Modal:** Prevent accidental revocations
- **Audit Trail:** Show who revoked what when
- **Reference:** Technical Review Decision #6

---

### **Story 0.2a: Login & Navigation MVP** 🔵 DAY 3
- **MVP Scope:** Basic ARIA only, no token refresh, Admin + Employee dashboards only
- **Deferred to 0.2b:** Full WCAG 2.1 AA, Manager/Issuer dashboards, token refresh
- **UX Spec:** Complete wireframes in `login-ux-spec.md`
- **Accessibility:** 4 rules enabled in axe-core (MVP), 7+ in Sprint 8
- **Reference:** 
  - Technical Review Decision #11 (story splitting)
  - Technical Review Decision #18 (accessibility MVP scope)
  - login-ux-spec.md (complete visual + ARIA guide)

**Key Implementation Notes:**
- Auth store: Zustand (simplified, no refresh logic)
- LoginPage: See ASCII wireframes in login-ux-spec.md
- ARIA attributes: 15+ attributes specified in spec
- Top nav layout only (sidebar deferred to Sprint 8)

---

### **Story U.2a: M365 Sync Basic Test** 🔵 DAY 3
- **Auto Role Detection:** M365 org structure determines Manager/Employee roles
- **Graph API:** `/users/{id}/directReports` endpoint
- **Role Logic:** Has direct reports = Manager, No direct reports = Employee
- **PO Coordination Required:** 2-3 real M365 user emails for testing
- **MVP Scope:** Basic sync only, advanced features in U.2b
- **Reference:** 
  - Technical Review Decision #14 (auto role detection)
  - Technical Review Decision #11 (story splitting)

**When Starting Story U.2a:**
- Notify Product Owner 30 minutes BEFORE implementation
- PO will provide: 2-3 M365 user emails, verify org structure
- Test both scenarios: user with direct reports, user without

---

### **Story U.1: Complete Lifecycle UAT** 🔵 DAY 5-6
- **Full Workflow:** Create template → Issue badge → Employee views → Revoke → Verify revoked
- **Multi-Role:** Test as Admin, Manager, Employee
- **Duration:** 10-12 hours over 2 days
- **Dependencies:** All other stories (9.1-9.5, 0.2a, U.2a) must be complete
- **Reference:** Technical Review Decision #7 (comprehensive UAT scope)

---

### **Story U.3: Bug Fixes from UAT** 🔵 DAY 7
- **Reactive Story:** Address bugs discovered in U.1
- **Time-boxed:** 3-5 hours maximum
- **Priority:** Critical bugs only (P0/P1)
- **Defer:** Non-critical bugs to Sprint 8 backlog
- **Reference:** Technical Review Decision #8

---

## 🚨 Critical Technical Decisions (All Stories)

### **Decision #11: Story Splitting Strategy**
- MVP scope in Sprint 7 (Stories ending in 'a': 0.2a, U.2a)
- Enhanced scope deferred to Sprint 8 (Stories ending in 'b': 0.2b, U.2b)
- Focus on core functionality first, polish later

### **Decision #14: M365 Auto Role Detection**
- Manager role: Has direct reports in M365 org structure
- Employee role: No direct reports in M365 org structure
- NO manual role assignment in database
- Graph API `/users/{id}/directReports` determines role automatically

### **Decision #16: TDD Required for High-Risk Stories**
- Story 9.1: MANDATORY TDD (already complete)
- Other stories: TDD recommended but not mandatory
- Test coverage >80% required for all stories

### **Decision #18: Accessibility MVP Scope**
- Sprint 7: Basic ARIA labels (4 rules enabled in axe-core)
- Sprint 8: Full WCAG 2.1 AA compliance (color-contrast, keyboard nav, focus management)
- ESLint jsx-a11y configured with 7 rules (error level)

---

## 🛠️ Technical Stack Reference

**Backend:**
- NestJS 11.0.1, Prisma ORM, PostgreSQL
- Microsoft Graph API (M365 sync)
- Azure AD OAuth 2.0

**Frontend:**
- React 19.2.3, Vite 7.2.4
- Tailwind CSS 4.1.18, Zustand 5.0.10
- axe-core 4.11.1 (accessibility testing)

**Testing:**
- Jest (unit + E2E)
- ESLint jsx-a11y 6.10.2
- Test coverage target: >80%

---

## 📅 Coordination Points

### **Day 3 (Stories 0.2a + U.2a):**
- **Required:** Product Owner participation for M365 sync testing
- **Timing:** Notify PO 30 minutes before starting Story U.2a
- **PO Provides:** 2-3 M365 user emails, verify org structure
- **Developer:** Test auto role detection with real M365 data

### **Day 5-6 (Story U.1):**
- **Duration:** 10-12 hours comprehensive UAT
- **Dependencies:** All features complete (9.1-9.5, 0.2a, U.2a)
- **Multi-Role Testing:** Admin, Manager, Employee workflows
- **Output:** Bug list for Story U.3

---

## 📖 How to Reference During Development

### **Before Starting Any Story:**
1. ✅ Read your story file completely
2. ✅ Check "Key Decisions by Story" section above
3. ✅ Reference linked documents (technical review, UX specs)
4. ✅ Note any PO coordination requirements

### **During Implementation:**
1. ✅ Follow acceptance criteria precisely
2. ✅ Refer to Architect Notes (for Stories 9.x)
3. ✅ Refer to UX specs (for Story 0.2a)
4. ✅ Check technical decisions when making choices

### **Before Completing Story:**
1. ✅ All acceptance criteria met
2. ✅ Tests written and passing (>80% coverage)
3. ✅ ESLint passing (no warnings)
4. ✅ TypeScript compiles (no errors)
5. ✅ Quality gates passed

---

## 🎬 Simple Activation Pattern for Each Story

**Generic activation command:**
```
请阅读 gcredit-project/docs/sprints/sprint-7/{story-file}.md，
参考 DEVELOPER-CONTEXT.md 中该story的关键决策，
然后执行你的 [DS] Execute Dev Story workflow
```

**Example for Story 9.2:**
```
请阅读 gcredit-project/docs/sprints/sprint-7/9-2-verification-status.md，
参考 DEVELOPER-CONTEXT.md 中Story 9.2的关键决策，
然后执行你的 [DS] Execute Dev Story workflow
```

---

## ✅ Sprint 7 Success Criteria

**Sprint Complete When:**
- ✅ All 11 stories done (acceptance criteria met)
- ✅ All tests passing (>80% coverage)
- ✅ Complete lifecycle UAT successful
- ✅ Critical bugs fixed (Story U.3)
- ✅ Code quality gates passed
- ✅ Sprint retrospective completed

---

**Last Updated:** February 1, 2026  
**Maintained By:** Bob (Scrum Master)  
**Status:** 🟢 Active - Reference for all Sprint 7 development
