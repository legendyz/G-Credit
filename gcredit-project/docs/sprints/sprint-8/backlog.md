# Sprint 8 Backlog - Production-Ready MVP

**Sprint:** Sprint 8  
**Sprint Goal:** Production-Ready MVP with UX Excellence, Security Hardening & M365 Integration  
**Epic:** Epic 10 - Production-Ready MVP  
**Version:** v0.7.0 → v0.8.0  
**Start Date:** 2026-02-03  
**End Date:** 2026-02-14 (10 working days)  
**Created:** February 2, 2026  
**Planning Complete:** February 2, 2026  
**Status:** Planning Complete (Ready for Development)

---

## 🎯 Sprint Goal

**Primary Goal:** Transform v0.7.0 MVP into production-ready system with:
- ✨ **UX Excellence:** Role-specific dashboards, enhanced search, WCAG 2.1 AA accessibility, responsive design
- 🔒 **Security Hardening:** Production security (Helmet, CORS, rate limiting, IDOR fixes)
- 🔧 **Architecture Fixes:** Token rotation, JWT validation, template ownership
- 🌐 **M365 Integration:** Production-grade user sync (pagination, retry, audit)
- 🧪 **Test Reliability:** Fix E2E test isolation (TD-001)

**Success Criteria:**
- All 12 work items (9 stories + 3 tasks) complete with 100% acceptance criteria met
- Resolves 17 P1 technical debt items
- 100% WCAG 2.1 Level AA compliance (Story 8.3)
- E2E tests run reliably in parallel (Task 8.8)
- Version manifest locked (no version drift)
- 100% code review approval
- 100% UAT pass

---

## 📋 Sprint 8 Stories Overview

### Group A: UX & Accessibility (39h)
| Story ID | Title | SP | Effort | Priority | Key Features |
|----------|-------|-----|--------|----------|--------------||
| **8.1** | **Dashboard Homepage** | 5 | 9h | HIGH | Role-specific views, celebration feedback, 6 APIs |
| **8.2** | **Badge Search Enhancement** | 3 | 5.5h | MEDIUM | Debounced search, multi-select filters, DateRangePicker |
| **8.3** | **WCAG 2.1 Accessibility** | 5 | 8.5h | CRITICAL | Screen readers, keyboard nav, color contrast |
| **8.4** | **Analytics API** | 3 | 4.5h | HIGH | Backend endpoints for dashboards (caching, role-based) |
| **8.5** | **Responsive Design** | 3 | 5h | HIGH | Mobile-first (320px-2560px), 44×44px touch targets |
| **8.9** | **M365 Production Hardening** | 6 | 8.5h | MEDIUM | Pagination (1000+ users), retry, audit, deactivation sync |
| **8.10** | **Admin User Management Panel** | 6 | 11.5h | HIGH | User list, role assignment, deactivation, audit trail (UX+Arch fixes applied) |

**Group A Subtotal:** 31 SP / 52.5h

### Group B: Security & Infrastructure (20h)
| Task ID | Title | SP | Effort | Priority | Key Features |
|---------|-------|-----|--------|----------|--------------|
| **8.0** | **Sprint Setup** | 1 | 1.5h | CRITICAL | Dependency install, Prisma migration (MUST COMPLETE FIRST) |
| **8.6** | **Security Hardening** | 3 | 6h | CRITICAL | Helmet, CORS whitelist, rate limiting, IDOR fix |
| **8.7** | **Architecture Fixes** | 4 | 7h | HIGH | Token rotation, startup validation, ownership guards |
| **8.8** | **E2E Test Isolation** | 5 | 8h | CRITICAL | Schema isolation, test factories, parallel execution |

**Group B Subtotal:** 13 SP / 22.5h

### Group C: Legacy (Retained from Original Sprint 8)
| Story ID | Title | SP | Effort | Priority | Status |
|----------|-------|-----|--------|----------|--------|
| **0.2b** | **Auth Enhancements** | 3 | 5.75h | MEDIUM | Merged into Stories 8.3, 8.7 |
| **0.3** | **CSP Headers** | 1 | 1h | HIGH | Merged into Task 8.6 |

**Group C Note:** Stories 0.2b and 0.3 are retained for reference but their scope is consolidated into new stories.

---

## 📊 Sprint Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Work Items** | 14 | 10 Stories + 4 Tasks |
| **Total Story Points** | 44 SP | Group A: 31 SP, Group B: 13 SP (Story 8.10 updated: 3→6 SP) |
| **Total Estimated Hours** | 75h | Group A: 52.5h, Group B: 22.5h (Story 8.10 updated: 5h→11.5h) |
| **Team Velocity** | 71h available | 10 days × 7.1h/day |
| **Capacity Buffer** | -4h (Over capacity) | Applied all UX+Arch fixes to Story 8.10 per user request |
| **Technical Debt Resolved** | 18 P1 items | UX: 7, SEC: 6 (added SEC-HIGH-003), ARCH: 4, TD: 1 |
| **New Dependencies** | 6 packages | Helmet, Throttler, Cache Manager, Axe, React Router (x2) |
| **Version Locks** | 2 critical | Prisma 6.19.2, React 19.2.3 |

---

## 🔗 Cross-References

- **Epic:** [Epic 10 - Production-Ready MVP](../epic-10/)
- **Previous Sprint:** [Sprint 7 Retrospective](../sprint-7/retrospective.md)
- **Version Control:** [Version Manifest](version-manifest.md)
- **Sprint Status:** [sprint-status.yaml](sprint-status.yaml)
- **Technical Debt:** [health-audit-report-2026-02-01.md](../../health-audit-report-2026-02-01.md)

---

## 📖 Story Details

### 🔧 Task 8.0: Sprint 8 Development Environment Setup
**File:** [8-0-sprint-setup.md](8-0-sprint-setup.md)  
**Story Points:** 1 | **Effort:** 1.5h | **Priority:** CRITICAL  
**Epic:** Epic 10 - Production-Ready MVP  
**Status:** ⚠️ MUST COMPLETE FIRST (Blocks all Sprint 8 work)

**Description:**
Set up development environment by installing new dependencies and creating Prisma migrations. This task MUST be completed on Day 1 morning before starting any other Sprint 8 work.

**Acceptance Criteria:**
1. ✅ **Backend Dependencies** - Install @nestjs/helmet, @nestjs/throttler, bcrypt@6.0.0
2. ✅ **Frontend Dependencies** - Install @axe-core/react, react-router, react-router-dom
3. ✅ **Prisma Migration** - Create M365SyncLog table + User.isActive field
4. ✅ **Version Manifest** - Update with all new packages
5. ✅ **Security Audit** - Zero high/critical vulnerabilities

**Key Tasks:**
- Install 5 new npm packages (backend: 3, frontend: 2)
- Create and run Prisma migration (`add-m365-sync-log`)
- Verify builds pass (backend + frontend)
- Update version-manifest.md

**Dependencies:**
- None (first task)

**Blocks:**
- Story 8.1 (needs react-router)
- Story 8.3 (needs @axe-core/react)
- Task 8.6 (needs @nestjs/helmet, @nestjs/throttler)
- Story 8.9 (needs Prisma migration)

**Assignment:**
- This task should be assigned to a developer on Day 1 morning
- Estimated completion: Before 11:00 AM Day 1

---

### ✨ Story 8.1: Dashboard Homepage
**File:** [8-1-dashboard-homepage.md](8-1-dashboard-homepage.md)  
**Story Points:** 5 | **Effort:** 9h | **Priority:** HIGH  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** UX-P1-001, UX-P1-002, UX-P1-003

**Description:**
Create role-specific dashboard homepages that serve as the default landing page after login, providing contextual information and quick actions for each user role.

**Acceptance Criteria:**
1. ✅ **Employee Dashboard** - Badge collection view with stats, celebration feedback on new badges
2. ✅ **Issuer Dashboard** - Template management, recent issuances, approval workflow
3. ✅ **Manager Dashboard** - Team badge analytics, skills matrix, approval queue
4. ✅ **Admin Dashboard** - System overview, user management, audit logs
5. ✅ **Navigation** - Dashboard set as default homepage post-login
6. ✅ **Performance** - Loading spinners, error boundaries, optimistic updates

**Dependencies:**
- Story 8.4 (Analytics API) - Provides backend endpoints
- Story 8.5 (Responsive Design) - Mobile/tablet layouts

**Technical Debt Resolved:**
- UX-P1-001: No homepage (users land on blank `/dashboard`)
- UX-P1-002: Minimal celebration (badge issuance feels transactional)
- UX-P1-003: No role-specific views

---

### 🔍 Story 8.2: Badge Search Enhancement
**File:** [8-2-badge-search-enhancement.md](8-2-badge-search-enhancement.md)  
**Story Points:** 3 | **Effort:** 5.5h | **Priority:** MEDIUM  
**Epic:** Epic 10 - Production-Ready MVP

**Description:**
Enhance badge search and filtering across Wallet, Management, and Catalog pages with debounced search, multi-select filters, and date range pickers.

**Acceptance Criteria:**
1. ✅ **Debounced Search** - 300ms debounce on text input
2. ✅ **Multi-Select Filters** - Status, category, issuer dropdowns
3. ✅ **Date Range Picker** - Issued date filtering
4. ✅ **Search Strategy** - Client-side (<50 badges), server-side (50+)
5. ✅ **URL Query Params** - Shareable filtered views

**Components:**
- `SearchInput` (debounced text input)
- `FilterChips` (multi-select badges)
- `DateRangePicker` (calendar component)

**Dependencies:**
- Story 8.5 (Responsive Design) - Mobile touch-friendly filters

---

### ♿ Story 8.3: WCAG 2.1 Accessibility
**File:** [8-3-wcag-accessibility.md](8-3-wcag-accessibility.md)  
**Story Points:** 5 | **Effort:** 8.5h | **Priority:** CRITICAL  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** UX-P1-004, UX-P1-005, UX-P1-006, UX-P1-007

**Description:**
Achieve WCAG 2.1 Level AA compliance across all pages with keyboard navigation, screen reader testing, and color contrast fixes.

**Acceptance Criteria:**
1. ✅ **Keyboard Navigation** - All interactive elements accessible via Tab/Enter/Space
2. ✅ **Screen Readers** - NVDA + JAWS testing with semantic HTML
3. ✅ **Color Contrast** - 4.5:1 for text, 3:1 for UI components
4. ✅ **Focus Management** - Visible focus indicators, focus traps in modals
5. ✅ **ARIA Labels** - Buttons, links, form fields properly labeled
6. ✅ **Automated Testing** - @axe-core/react integration (0 violations)

**Technical Debt Resolved:**
- UX-P1-004: No keyboard navigation
- UX-P1-005: No screen reader testing
- UX-P1-006: Color contrast violations (status badges)
- UX-P1-007: Missing ARIA labels

**Dependencies:**
- Applies to Stories 8.1, 8.2, 8.5

---

### 📊 Story 8.4: Analytics API
**File:** [8-4-analytics-api.md](8-4-analytics-api.md)  
**Story Points:** 3 | **Effort:** 4.5h | **Priority:** HIGH  
**Epic:** Epic 10 - Production-Ready MVP

**Description:**
Create backend analytics endpoints to power dashboard views with role-based access control and caching strategy.

**Acceptance Criteria:**
1. ✅ **System Overview API** - `GET /api/analytics/overview` (admin only)
2. ✅ **Badge Trends API** - `GET /api/analytics/trends` (time-series data)
3. ✅ **Top Performers API** - `GET /api/analytics/top-performers` (manager only)
4. ✅ **Skills Matrix API** - `GET /api/analytics/skills-matrix` (manager only)
5. ✅ **Recent Activity API** - `GET /api/analytics/recent-activity` (role-specific)

**Technical Implementation:**
- Role-based access guards (`@Roles()` decorator)
- Query optimization (indexed columns)
- Caching strategy (15-minute TTL for aggregations)

**Dependencies:**
- Used by Story 8.1 (Dashboard Homepage)

---

### 📱 Story 8.5: Responsive Design
**File:** [8-5-responsive-design.md](8-5-responsive-design.md)  
**Story Points:** 3 | **Effort:** 5h | **Priority:** HIGH  
**Epic:** Epic 10 - Production-Ready MVP

**Description:**
Implement mobile-first responsive design across all pages with breakpoints at 320px, 768px, 1024px, 1440px, 2560px.

**Acceptance Criteria:**
1. ✅ **Mobile (320-767px)** - Single column, hamburger menu, card stacking
2. ✅ **Tablet (768-1023px)** - 2-column grid, collapsible sidebar
3. ✅ **Desktop (1024-1439px)** - 3-column grid, persistent sidebar
4. ✅ **Wide (1440-2559px)** - 4-column grid, expanded content
5. ✅ **Ultra-Wide (2560px+)** - Max-width constraint (1920px)
6. ✅ **Touch Targets** - Minimum 44×44px for mobile buttons

**Components:**
- `MobileNav` (hamburger menu)
- Responsive grid utilities
- Touch-friendly button sizing

**Dependencies:**
- Applies to Stories 8.1, 8.2, 8.3

---

### 🔒 Task 8.6: Security Hardening
**File:** [8-6-security-hardening.md](8-6-security-hardening.md)  
**Story Points:** 3 | **Effort:** 6h | **Priority:** CRITICAL  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** SEC-P1-001, SEC-P1-002, SEC-P1-003, SEC-P1-004, SEC-P1-005

**Description:**
Production security implementation with Helmet (CSP headers), CORS whitelist, rate limiting, and IDOR vulnerability fixes.

**Acceptance Criteria:**
1. ✅ **Helmet Middleware** - CSP, HSTS, X-Frame-Options headers
2. ✅ **CORS Whitelist** - Frontend origin only (no wildcards)
3. ✅ **Rate Limiting** - @nestjs/throttler (10 req/min login, 100 req/min general)
4. ✅ **IDOR Fix** - Evidence download authorization check
5. ✅ **bcrypt Upgrade** - v5.1.1 → v6.0.0 (security patch - COMPLETED in Story 8.0)

**Technical Debt Resolved:**
- SEC-P1-001: No CSP headers
- SEC-P1-002: Permissive CORS (`origin: true`)
- SEC-P1-003: No rate limiting
- SEC-P1-004: IDOR vulnerability (evidence download)
- SEC-P1-005: Outdated bcrypt version

**Dependencies:**
- Consolidates Story 0.3 (CSP Headers)

---

### 🔧 Task 8.7: Architecture Fixes
**File:** [8-7-architecture-fixes.md](8-7-architecture-fixes.md)  
**Story Points:** 4 | **Effort:** 7h | **Priority:** HIGH  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** ARCH-P1-001, ARCH-P1-003, ARCH-P1-004

**Description:**
Architectural improvements including refresh token rotation, startup JWT validation, and template ownership enforcement.

**Acceptance Criteria:**
1. ✅ **Token Rotation** - Refresh token invalidation on use (ADR-008)
2. ✅ **Startup Validation** - JWT secret validation (fail-fast on misconfiguration)
3. ✅ **Template Ownership** - Guards prevent cross-tenant access
4. ✅ **Frontend Integration** - Token refresh interceptor with exponential backoff

**Technical Debt Resolved:**
- ARCH-P1-001: No refresh token rotation (security risk)
- ARCH-P1-003: Weak JWT validation (missing startup checks)
- ARCH-P1-004: Template ownership not enforced

**Dependencies:**
- Blocks Story 0.2b (Auth Enhancements) frontend integration

---

### 🧪 Task 8.8: E2E Test Isolation
**File:** [8-8-e2e-test-isolation.md](8-8-e2e-test-isolation.md)  
**Story Points:** 5 | **Effort:** 8h | **Priority:** CRITICAL  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** TD-001 (45/71 E2E tests failing in parallel)

**Description:**
Fix test isolation issues causing 45/71 E2E tests to fail when run in parallel using schema-based isolation strategy.

**Acceptance Criteria:**
1. ✅ **Schema Isolation** - Each test suite gets dedicated schema (`test_suite_<uuid>`)
2. ✅ **Test Factories** - Reusable data generators (UserFactory, BadgeFactory)
3. ✅ **Parallel Execution** - All 71 tests pass in parallel (`--max-workers=4`)
4. ✅ **Cleanup Strategy** - Post-test schema deletion
5. ✅ **Documentation** - Test isolation guide in /docs/testing/

**Technical Debt Resolved:**
- TD-001: Test isolation failures (45/71 tests fail in parallel)

**Dependencies:**
- Blocks CI/CD reliability

---

### 🌐 Story 8.9: M365 Production Hardening
**File:** [U-2b-m365-hardening.md](U-2b-m365-hardening.md) *(renamed to Story 8.9)*  
**Story Points:** 6 | **Effort:** 8.5h | **Priority:** MEDIUM  
**Epic:** Epic 10 - Production-Ready MVP

**Description:**
Production-grade M365 user sync with pagination (1000+ users), retry logic, audit logging, and deactivation sync.

**Acceptance Criteria:**
1. ✅ **Pagination** - Handle 1000+ users via Graph API pagination
2. ✅ **Retry Logic** - Exponential backoff (ADR-008) for transient failures
3. ✅ **Audit Logging** - M365SyncLog table tracks all syncs
4. ✅ **Deactivation Sync** - Deleted M365 users → `User.isActive = false`
5. ✅ **Error Recovery** - Partial success handling (continue on individual failures)

**Dependencies:**
- Story U.2a (Sprint 7) must be complete
- Prisma migrations: M365SyncLog table + User.isActive field

---

### 👥 Story 8.10: Admin User Management Panel ✅ DONE
**File:** [8-10-user-management-panel.md](8-10-user-management-panel.md)  
**Story Points:** 6 | **Effort:** 11.5h | **Priority:** HIGH  
**Epic:** Epic 10 - Production-Ready MVP  
**Resolves:** SEC-HIGH-003 (Role self-assignment security vulnerability)
**Completed:** 2026-02-03

**Description:**
Admin UI to manage user roles dynamically without editing configuration files. Addresses security audit finding by removing role self-assignment on registration.

**Acceptance Criteria:**
1. ✅ **User List Page** - Paginated table with search, filters (role, status), sorting
2. ✅ **Edit User Role** - Admin can change any user's role (cannot change own role)
3. ✅ **User Deactivation** - Admin can activate/deactivate users (affects login, not badges)
4. ✅ **Audit Trail** - All role changes logged to UserRoleAuditLog table
5. ✅ **Role Priority** - Manually-set roles preserved during M365 sync (roleSetManually flag)
6. ✅ **Security** - Admin-only access (RBAC guards), confirmation dialogs for sensitive actions

**Implementation Summary:**
- **Backend:** AdminUsersModule with 4 API endpoints (list, get, update-role, update-status)
- **Frontend:** AdminUserManagementPage, UserListTable, EditRoleDialog, DeactivateUserDialog
- **Database:** Prisma migration 20260203153938_add_user_management
  - User fields: roleSetManually, roleUpdatedAt, roleUpdatedBy, roleVersion, lastSyncAt
  - New model: UserRoleAuditLog with cascade delete
- **Tests:** 29 backend tests, 18+ frontend component tests
- **WCAG:** Focus trap in dialogs, 4.5:1 contrast for role badges, 44×44px touch targets
- **Commits:** 438b1a1 (feat), 06d3fbf (verify)
- **CI:** Pending GitHub Actions verification (service degraded)

**Dependencies:**
- Task 8.0 (Sprint Setup) - ✅ Prisma migration capability
- Story 8.1 (Dashboard) - ✅ Admin navigation link

**Technical Debt Resolved:**
- SEC-HIGH-003: Role self-assignment on registration (security audit finding)

---

## 🎯 Sprint 8 Success Criteria (Definition of Done)

### Story-Level DoD
- [ ] All acceptance criteria met with 100% completion
- [ ] Unit tests written and passing (≥80% coverage for new code)
- [ ] E2E tests written and passing (critical user flows)
- [ ] Code review approved by at least 1 team member
- [ ] Documentation updated (API docs, README, architecture diagrams)
- [ ] No regressions from Sprint 7 (all UAT scenarios still pass)

### Sprint-Level DoD
- [ ] All 12 work items (9 stories + 3 tasks) completed
- [ ] Resolves 17 P1 technical debt items
- [ ] 100% WCAG 2.1 Level AA compliance verified (Story 8.3)
- [ ] E2E tests run reliably in parallel (Task 8.8)
- [ ] Version manifest locked (no version drift)
- [ ] 100% UAT pass for all new features
- [ ] Deployed to dev environment and validated
- [ ] Sprint retrospective completed

### Production-Ready Checklist
- [ ] Security audit passed (Helmet, CORS, rate limiting - Task 8.6)
- [ ] Performance testing completed (dashboard load times <2s)
- [ ] Accessibility audit passed (axe-core 0 violations)
- [ ] Mobile testing completed (iPhone, Android, tablet)
- [ ] Browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Error monitoring configured (logging, alerts)

---

## 📝 Technical Debt Deferred to Future Sprints

### Sprint 9+ Lower Priority Items

1. **TD-001: Open Badges 2.0 Full Compliance** (4 SP, Sprint 9)
   - Update Badge JSON-LD to Open Badges 2.0 spec
   - Add `credentialStatus` property with revocation status endpoint
   - Implement `StatusList2021Credential` for batch revocation checks
   - **Why Deferred:** Not required for MVP (internal system), external verifiers rare

2. **TD-002: Baked Badge Revocation Overlay** (2 SP, Sprint 9)
   - Server-side image manipulation with Sharp library
   - Add red "REVOKED" overlay to baked badge PNG
   - Cache revoked badge images
   - **Why Deferred:** Sprint 7 shows revocation in UI (adequate), edge case

3. **TD-003: Server-Side Badge Filtering** (2 SP, Sprint 9)
   - Update `GET /api/badges/my-badges` with `?status` query param
   - Filter badges on backend (not frontend)
   - Add pagination support (limit/offset)
   - **Why Deferred:** Frontend filtering works for MVP (<100 badges expected)

4. **Functional Password Reset** (3 SP, Sprint 9)
   - Email service integration (SendGrid/Mailgun)
   - Password reset token generation with time limits
   - Reset password page
   - Security: Rate limiting, token expiration

5. **M365 Incremental Sync** (4 SP, Sprint 10+)
   - Delta Query API integration
   - Only sync changed users (not full sync)
   - Reduces API calls by 90%+
   - Scheduled cron job (daily 3 AM)

6. **Admin UI for M365 Sync Logs** (3 SP, Sprint 10+)
   - View M365SyncLog table in Admin Dashboard
   - Filter by date, status, user count
   - Retry failed syncs manually

7. **Multi-Factor Authentication** (5 SP, Sprint 11+)
   - TOTP support (Google Authenticator)
   - SMS backup (Twilio integration)
   - Recovery codes
   - MFA enforcement policies

8. **Session Management UI** (2 SP, Sprint 10+)
   - View active sessions
   - Logout from all devices
   - Session timeout configuration

---

## 📚 References & Documentation

- **Epic:** [Epic 10 - Production-Ready MVP](../epic-10/)
- **Previous Sprint:** [Sprint 7 Retrospective](../sprint-7/retrospective.md)
- **Technical Debt:** [Health Audit Report (Feb 1, 2026)](../../health-audit-report-2026-02-01.md)
- **Version Control:** [Version Manifest](version-manifest.md)
- **Sprint Status:** [sprint-status.yaml](sprint-status.yaml)
- **Architecture Reviews:**
  - EPIC-9-ARCHITECTURE-REVIEW-AMELIA.md
  - EPIC-9-UX-REVIEW-AMELIA.md
  - EPIC-9-DEVELOPER-FEASIBILITY-REVIEW.md
- **ADRs:**
  - ADR-008: Error Handling & Retry Strategy
  - ADR-001: Dependency Management

---

## 📊 Sprint Burndown (To Be Updated Daily)

| Day | Stories Complete | Tasks Complete | Remaining Hours | Notes |
|-----|------------------|----------------|-----------------|-------|
| Day 0 | 0/9 | 0/3 | 62h | Sprint kickoff |
| Day 1 | | | | |
| Day 2 | | | | |
| Day 3 | | | | |
| Day 4 | | | | |
| Day 5 | | | | Weekend |
| Day 6 | | | | Weekend |
| Day 7 | | | | |
| Day 8 | | | | |
| Day 9 | | | | |
| Day 10 | 9/9 ✅ | 3/3 ✅ | 0h | Sprint complete |

---

**Created By:** Bob (Scrum Master)  
**Planning Complete:** February 2, 2026  
**Last Updated:** February 2, 2026  
**Status:** ✅ Planning Complete - Ready for Development
