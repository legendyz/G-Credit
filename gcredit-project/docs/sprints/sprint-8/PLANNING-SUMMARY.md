# Sprint 8 Planning Summary

**Planning Date:** February 2, 2026  
**Scrum Master:** Bob  
**Sprint Duration:** 10 working days (Feb 3-14, 2026)  
**Sprint Goal:** Production-Ready MVP with UX Excellence, Security Hardening & M365 Integration  
**Status:** ✅ Planning Complete - Ready for Development

---

## 📋 Planning Checklist Status

| Section | Item | Status | Notes |
|---------|------|--------|-------|
| **1. Pre-Planning** | Review previous sprint | ✅ Complete | Sprint 7 (v0.7.0) - 100% UAT pass |
| | Gather resources | ✅ Complete | Technical debt report, PRD, ADRs |
| | Review lessons learned | ✅ Complete | Sprint 0 lessons (version drift, test isolation) |
| | Confirm DoD | ✅ Complete | Story-level + Sprint-level + Production-ready |
| **2. Sprint Goal** | Define sprint goal | ✅ Complete | Production-Ready MVP |
| **3. Epic Selection** | Choose epic | ✅ Complete | Epic 10 - Production-Ready MVP |
| **4. Story Decomposition** | Break down into stories | ✅ Complete | 12 work items (9 stories + 3 tasks) |
| | Map technical debt | ✅ Complete | 17 P1 items targeted |
| **5. Capacity Planning** | Calculate team capacity | ✅ Complete | 71h available (10 days × 7.1h/day) |
| | Estimate story points | ✅ Complete | 37 SP total |
| | Estimate hours | ✅ Complete | 62h estimated (9h buffer) |
| **6. Story File Creation** | Create story files | ✅ Complete | 8 new files (8-1 through 8-8) |
| | Update existing files | ⚠️ Pending | Stories 0.2b, U.2b need Sprint 8 context |
| **7. Sprint Status YAML** | Create sprint-status.yaml | ✅ Complete | All 12 stories tracked |
| **8. Story Prioritization** | Prioritize work items | ✅ Complete | 3 CRITICAL, 4 HIGH, 2 MEDIUM |
| **9. Version Manifest** | Run check-versions.ps1 | ⚠️ Failed | Script has encoding errors |
| | Create version-manifest.md | ✅ Complete | Manual npm list used instead |
| **10. Dependency Check** | Identify blockers | ✅ Complete | 3 risks identified, 0 blockers |
| **11. Risk Assessment** | Create risk register | ✅ Complete | 3 risks tracked in sprint-status.yaml |
| **12. Backlog Update** | Update backlog.md | ✅ Complete | Consolidated with new stories |
| **13. Final Validation** | Verify all files exist | ✅ Complete | 8 story files + 3 infrastructure files |
| | Verify cross-references | ✅ Complete | All links valid |
| | Mark planning complete | ✅ Complete | sprint-status.yaml updated |

---

## 🎯 Sprint 8 Overview

### Sprint Goal
Transform v0.7.0 MVP into production-ready system with:
- ✨ **UX Excellence:** Role-specific dashboards, enhanced search, WCAG 2.1 AA accessibility, responsive design
- 🔒 **Security Hardening:** Helmet, CORS, rate limiting, IDOR fixes
- 🔧 **Architecture Fixes:** Token rotation, JWT validation, template ownership
- 🌐 **M365 Integration:** Production-grade user sync (pagination, retry, audit)
- 🧪 **Test Reliability:** Fix E2E test isolation (TD-001)

### Work Items (14 Total)
- **10 Stories:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.9, 8.10, (0.2b, 0.3 consolidated)
- **4 Tasks:** 8.0 (Sprint Setup), 8.6, 8.7, 8.8
- **Total Story Points:** 44 SP (Story 8.10 updated: 3→6 SP)
- **Total Estimated Hours:** 75h (Story 8.10 updated: 5h→11.5h)
- **Team Capacity:** 71h (-4h over capacity, applied all UX+Arch fixes per user request)

---

## 📊 Sprint Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **Work Items** | 14 | All complete |
| **Story Points** | 44 SP | All complete |
| **Estimated Hours** | 75h | All complete |
| **Technical Debt Resolved** | 18 P1 items | All resolved (includes SEC-HIGH-003) |
| **WCAG Compliance** | Target 100% | Level AA |
| **E2E Test Pass Rate** | Current 36% (26/71) | Target 100% (71/71) |
| **Version Locks** | 2 critical | Maintained |

---

## 📖 Story Details

### Group A: UX & Accessibility (52.5h, 31 SP)

1. **Story 8.1: Dashboard Homepage** (9h, 5 SP, HIGH)
   - File: [8-1-dashboard-homepage.md](sprint-8/8-1-dashboard-homepage.md)
   - Role-specific views, celebration feedback, 6 APIs
   - Resolves: UX-P1-001, UX-P1-002, UX-P1-003

2. **Story 8.2: Badge Search Enhancement** (5.5h, 3 SP, MEDIUM)
   - File: [8-2-badge-search-enhancement.md](sprint-8/8-2-badge-search-enhancement.md)
   - Debounced search, multi-select filters, DateRangePicker

3. **Story 8.3: WCAG 2.1 Accessibility** (8.5h, 5 SP, CRITICAL)
   - File: [8-3-wcag-accessibility.md](sprint-8/8-3-wcag-accessibility.md)
   - Screen readers, keyboard nav, color contrast, @axe-core/react
   - Resolves: UX-P1-004, UX-P1-005, UX-P1-006, UX-P1-007

4. **Story 8.4: Analytics API** (4.5h, 3 SP, HIGH)
   - File: [8-4-analytics-api.md](sprint-8/8-4-analytics-api.md)
   - Backend endpoints for dashboards (caching, role-based)

5. **Story 8.5: Responsive Design** (5h, 3 SP, HIGH)
   - File: [8-5-responsive-design.md](sprint-8/8-5-responsive-design.md)
   - Mobile-first (320px-2560px), 44×44px touch targets

6. **Story 8.9: M365 Production Hardening** (8.5h, 6 SP, MEDIUM)
   - File: [U-2b-m365-hardening.md](sprint-8/U-2b-m365-hardening.md)
   - Pagination (1000+ users), retry, audit, deactivation sync

7. **Story 8.10: Admin User Management Panel** (11.5h, 6 SP, HIGH) ⭐ **UPDATED**
   - File: [8-10-user-management-panel.md](sprint-8/8-10-user-management-panel.md)
   - Admin UI for dynamic role management (no more .env editing)
   - Applied all UX + Architecture fixes (keyboard nav, ARIA, responsive, optimistic locking, hybrid pagination, M365 transaction boundaries)
   - Resolves: SEC-HIGH-003 (Role self-assignment vulnerability)
   - Dependencies: Task 8.0 (Prisma), Story 8.1 (Admin nav), Story 8.9 (M365 coordination)

### Group B: Security & Infrastructure (22.5h, 13 SP)

8. **Task 8.0: Sprint 8 Development Environment Setup** (1.5h, 1 SP, CRITICAL)
   - File: [8-0-sprint-setup.md](sprint-8/8-0-sprint-setup.md)
   - ⚠️ **MUST COMPLETE FIRST - Day 1 Morning**
   - Install dependencies (Helmet, Throttler, Cache Manager, Axe, React Router, date-fns)
   - Create Prisma migration (M365SyncLog + User.isActive + User management fields)
   - Blocks: Stories 8.1, 8.3, 8.9, 8.10, Task 8.6

9. **Task 8.6: Security Hardening** (6h, 3 SP, CRITICAL)
   - File: [8-6-security-hardening.md](sprint-8/8-6-security-hardening.md)
   - Helmet, CORS whitelist, rate limiting, IDOR fix
   - Resolves: SEC-P1-001, SEC-P1-002, SEC-P1-003, SEC-P1-004, SEC-P1-005

10. **Task 8.7: Architecture Fixes** (7h, 4 SP, HIGH)
   - File: [8-7-architecture-fixes.md](sprint-8/8-7-architecture-fixes.md)
   - Token rotation, startup validation, ownership guards
   - Resolves: ARCH-P1-001, ARCH-P1-003, ARCH-P1-004

11. **Task 8.8: E2E Test Isolation** (8h, 5 SP, CRITICAL)
   - File: [8-8-e2e-test-isolation.md](sprint-8/8-8-e2e-test-isolation.md)
   - Schema isolation, test factories, parallel execution
   - Resolves: TD-001 (45/71 tests failing in parallel)

---

## 🔗 Key Files Created

### Story Files (10 Total)
0. [8-0-sprint-setup.md](sprint-8/8-0-sprint-setup.md) ⚠️ **FIRST TASK**
1. [8-1-dashboard-homepage.md](sprint-8/8-1-dashboard-homepage.md)
2. [8-2-badge-search-enhancement.md](sprint-8/8-2-badge-search-enhancement.md)
3. [8-3-wcag-accessibility.md](sprint-8/8-3-wcag-accessibility.md)
4. [8-4-analytics-api.md](sprint-8/8-4-analytics-api.md)
5. [8-5-responsive-design.md](sprint-8/8-5-responsive-design.md)
6. [8-6-security-hardening.md](sprint-8/8-6-security-hardening.md)
7. [8-7-architecture-fixes.md](sprint-8/8-7-architecture-fixes.md)
8. [8-8-e2e-test-isolation.md](sprint-8/8-8-e2e-test-isolation.md)
9. [8-10-user-management-panel.md](sprint-8/8-10-user-management-panel.md) ⭐ **NEW** (Updated with all UX+Arch fixes)

### Infrastructure Files (3)
1. [version-manifest.md](sprint-8/version-manifest.md) - Dependency version locks
2. [sprint-status.yaml](sprint-8/sprint-status.yaml) - Daily tracking YAML
3. [backlog.md](sprint-8/backlog.md) - Updated with new stories

### Existing Files (Retained)
1. [0-2b-auth-enhancements.md](sprint-8/0-2b-auth-enhancements.md) - Consolidated into 8.3, 8.7
2. [0-3-csp-headers.md](sprint-8/0-3-csp-headers.md) - Consolidated into 8.6
3. [U-2b-m365-hardening.md](sprint-8/U-2b-m365-hardening.md) - Now Story 8.9

---

## 🚨 Risks & Mitigations

| Risk ID | Description | Impact | Probability | Mitigation |
|---------|-------------|--------|-------------|------------|
| **RISK-8-001** | E2E test isolation may exceed 8h estimate | HIGH | MEDIUM | Allocate 2h buffer from sprint capacity |
| **RISK-8-002** | WCAG testing may reveal additional issues | MEDIUM | MEDIUM | Prioritize critical violations first |
| **RISK-8-003** | M365 pagination depends on Prisma migration | MEDIUM | LOW | Test migration in dev environment first |

---

## 📦 New Dependencies (Sprint 8)

### Backend
```bash
npm install @nestjs/helmet@^1.1.0          # Task 8.6: CSP headers
npm install @nestjs/throttler@^5.0.0      # Task 8.6: Rate limiting
npm install bcrypt@^6.0.0                 # SEC-P1-005: Security patch
```

### Frontend
```bash
npm install @axe-core/react@^4.11.0       # Story 8.3: Accessibility testing
npm install react-router@latest           # Story 8.1: Dashboard routing
npm install react-router-dom@latest       # Story 8.1: DOM bindings
```

### Locked Versions (DO NOT UPGRADE)
```bash
prisma@6.19.2                             # Locked until ADR decision
@prisma/client@6.19.2                     # Locked (matches prisma)
```

---

## 🎯 Technical Debt Resolution

### P1 Items Resolved (17 Total)

**UX (7 items):**
- UX-P1-001: No homepage → Story 8.1
- UX-P1-002: Minimal celebration → Story 8.1
- UX-P1-003: No role-specific views → Story 8.1
- UX-P1-004: No keyboard navigation → Story 8.3
- UX-P1-005: No screen reader testing → Story 8.3
- UX-P1-006: Color contrast violations → Story 8.3
- UX-P1-007: Missing ARIA labels → Story 8.3

**Security (5 items):**
- SEC-P1-001: No CSP headers → Task 8.6
- SEC-P1-002: Permissive CORS → Task 8.6
- SEC-P1-003: No rate limiting → Task 8.6
- SEC-P1-004: IDOR vulnerability → Task 8.6
- SEC-P1-005: Outdated bcrypt → Task 8.6

**Architecture (4 items):**
- ARCH-P1-001: No token rotation → Task 8.7
- ARCH-P1-003: Weak JWT validation → Task 8.7
- ARCH-P1-004: Template ownership not enforced → Task 8.7

**Testing (1 item):**
- TD-001: Test isolation failures → Task 8.8

---

## ✅ Definition of Done

### Story-Level DoD
- [ ] All acceptance criteria met (100% completion)
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] E2E tests written and passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No regressions from Sprint 7

### Sprint-Level DoD
- [ ] All 12 work items completed
- [ ] Resolves 17 P1 technical debt items
- [ ] 100% WCAG 2.1 Level AA compliance
- [ ] E2E tests run reliably in parallel
- [x] Version manifest locked
- [ ] 100% UAT pass
- [ ] Deployed to dev environment
- [ ] Sprint retrospective completed

### Production-Ready DoD
- [ ] Security audit passed
- [ ] Performance testing completed (dashboard <2s load)
- [ ] Accessibility audit passed (axe-core 0 violations)
- [ ] Mobile testing completed
- [ ] Browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Error monitoring configured

---

## 📅 Sprint Timeline

**Sprint Start:** Monday, February 3, 2026  
**Sprint End:** Friday, February 14, 2026  
**Sprint Duration:** 10 working days (excludes Feb 8-9 weekend)  

**Key Milestones:**
- **Day 1 (Feb 3):** Sprint kickoff, Story 8.8 (test isolation) begins
- **Day 3 (Feb 5):** Task 8.6 (security) + Task 8.7 (architecture) begin
- **Day 5 (Feb 7):** Story 8.3 (WCAG) + Story 8.4 (analytics) begin
- **Day 8 (Feb 10):** Story 8.1 (dashboard) + Story 8.5 (responsive) begin
- **Day 10 (Feb 12):** Story 8.2 (search) + Story 8.9 (M365) begin
- **Day 12 (Feb 14):** Sprint review + retrospective

---

## 📚 References

- **Epic:** [Epic 10 - Production-Ready MVP](../epic-10/)
- **Previous Sprint:** [Sprint 7 Retrospective](../sprint-7/retrospective.md)
- **Technical Debt:** [Health Audit Report (Feb 1, 2026)](../../health-audit-report-2026-02-01.md)
- **Version Control:** [Version Manifest](version-manifest.md)
- **Sprint Status:** [sprint-status.yaml](sprint-status.yaml)
- **Backlog:** [backlog.md](backlog.md)
- **Planning Checklist:** [@_bmad/bmm/workflows/sprint-planning-checklist.md](@_bmad/bmm/workflows/sprint-planning-checklist.md)

---

## 🔄 Next Steps

### ⚠️ CRITICAL: Day 1 Morning (First 2 Hours)

**Task 8.0: Sprint Setup - MUST COMPLETE FIRST**
- **Assignee:** Dev Agent / Development Team
- **Time:** 1.5h
- **File:** [8-0-sprint-setup.md](sprint-8/8-0-sprint-setup.md)

**Actions:**
1. Install backend dependencies (30 min)
   ```bash
   cd gcredit-project/backend
   npm install @nestjs/helmet@^1.1.0
   npm install @nestjs/throttler@^5.0.0
   npm install bcrypt@^6.0.0
   npm audit --audit-level=high
   ```

2. Install frontend dependencies (20 min)
   ```bash
   cd gcredit-project/frontend
   npm install @axe-core/react@^4.11.0
   npm install react-router@latest react-router-dom@latest
   npm audit --audit-level=high
   ```

3. Create Prisma migration (30 min)
   ```bash
   cd gcredit-project/backend
   # Update prisma/schema.prisma (add M365SyncLog model + User.isActive)
   npx prisma migrate dev --name add-m365-sync-log
   npx prisma migrate status
   ```

4. Update version-manifest.md (10 min)
5. Verify builds (10 min)

**Success Criteria:**
- ✅ All dependencies installed
- ✅ Prisma migration applied
- ✅ Builds pass (backend + frontend)
- ✅ Zero high/critical vulnerabilities

---

### Sprint Kickoff (Day 1, After Setup Complete)

**Sprint Kickoff Meeting (30 min):**
1. Review planning summary with team (5 min)
2. Confirm Task 8.0 complete (2 min)
3. Assign story owners (10 min)
4. Review priorities: Task 8.8 (test isolation) starts after setup (10 min)
5. Q&A (3 min)

**Ongoing Ceremonies:**
- **Daily Standups:** Every morning, 9:00 AM (15 min)
- **Sprint Review:** Friday, Feb 14, 2:00 PM (1h)
- **Sprint Retrospective:** Friday, Feb 14, 3:30 PM (1h)

---

## ⚠️ Important Notes

### Version Lock Reminder
- **Prisma 6.19.2** is intentionally locked (Prisma 7 has breaking changes)
- Do NOT upgrade without ADR approval

### Test Isolation Priority
- Task 8.8 (E2E test isolation) is **CRITICAL** and should start Day 1
- Blocks CI/CD reliability and all future testing

### WCAG Compliance
- Story 8.3 requires NVDA + JAWS screen reader testing
- Install screen readers before starting development

### Dependency Management
- All new dependencies must be added to version-manifest.md
- Run `npm audit` after installing new packages

---

**Prepared By:** Bob (Scrum Master)  
**Date:** February 2, 2026  
**Status:** ✅ Planning Complete - Ready for Development  
**Version:** Sprint 8 v1.0
