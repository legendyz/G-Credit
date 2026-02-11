# Sprint 11 Backlog

**Sprint:** Sprint 11  
**Duration:** 2026-02-12 to 2026-02-28 (2 weeks)  
**Target Version:** v1.1.0  
**Sprint Type:** Post-MVP Hardening (Security + Code Quality + Feature補全)  
**Branch:** `sprint-11/security-quality-hardening`

---

## 🎯 Sprint Goal

**"安全加固 + 代码质量提升 + 核心功能补全 — 让 v1.0 变为 Pilot-Ready"**

Harden security posture, improve code quality and test coverage, and complete core features required for pilot deployment — making v1.0 truly production-ready for the first L&D program pilot.

**Success Criteria:**
- [ ] Account lockout mechanism implemented (防暴力破解)
- [ ] File upload magic-byte validation (防MIME欺骗)
- [ ] npm audit 0 HIGH vulnerabilities + Swagger production-hidden
- [ ] Badge visibility toggle (public/private) fully functional
- [ ] LinkedIn share tab integrated into BadgeShareModal
- [ ] JWT migrated to httpOnly cookies (防XSS token theft)
- [ ] Issuer email masked on public verification pages
- [ ] Log PII sanitized (GDPR compliance)
- [ ] Global HTML sanitization pipe active
- [ ] 3 core services have unit test coverage (badge-templates, issuance-criteria-validator, blob-storage)
- [ ] NestJS Logger added to all 22 services/controllers
- [ ] Paginated response format standardized (`PaginatedResponse<T>`)
- [ ] User Management navigation entry accessible
- [ ] All 1061+ tests passing (0 regressions)

---

## 📊 Sprint Capacity

### Team Composition
- **Developers:** 1 AI agent (full-time equivalent)
- **Total Capacity:** 60h (based on velocity analysis)

### Capacity Allocation
| Category | Hours (Est.) | Notes |
|----------|-------------|-------|
| **P0 Security** | 5-6.5h | SEC-001, SEC-005, SEC-007+DEP-001 |
| **P0 Features** | 7-10h | FR19 (Badge Visibility), LinkedIn Share Tab |
| **P1 Security** | 9-11.5h | JWT httpOnly, Email脱敏, PII清理, HTML清洗 |
| **P1 Code Quality** | 19-26h | 3 service tests, Logger, Dependencies, Design, Pagination |
| **P1 Features** | 7h | CSV Export, Skill UUID fix, 403 Page, ClaimPage fix |
| **P1 Tech Debt** | 4h | CI Chinese gate, CI console.log gate, Husky hooks |
| **P1 Nav Fix** | 0.5h | FEAT-008-P0 User Management nav |
| **TOTAL** | **51.5-65.5h** | Target: 60h |

### Velocity Reference
| Sprint | Estimated | Actual | Accuracy | Type |
|--------|-----------|--------|----------|------|
| Sprint 7 | 41-47h | 38.5h | 82-93% | Feature (Epic 9) |
| Sprint 8 | 76h | 80h | 95% | Production-Ready (Epic 10) |
| Sprint 9 | 51h | 37h | 73% | Bulk + TD (Epic 8) |
| Sprint 10 | 63h | ~72h | 87% | Release (12 stories) |
| **Sprint 11** | **60h** | TBD | Target: >85% | Hardening |

---

## 📋 Backlog Sources

This sprint's tasks come from multiple Post-MVP sources (no traditional epic structure):

| Source | Reference Document |
|--------|-------------------|
| Security Audit | `docs/security/security-audit-2026-02.md` |
| Code Quality Audit | `docs/development/code-quality-audit-2026-02.md` |
| PRD Compliance Audit | `docs/planning/prd-compliance-matrix.md` |
| Feature & UX Audit | `docs/planning/feature-completeness-audit-2026-02.md` |
| Architecture Audit | `docs/architecture/architecture-compliance-audit-2026-02.md` |
| Candidate List (PM) | `docs/planning/sprint-11-candidate-list.md` |
| MVP Backlog (遗留) | `docs/sprints/sprint-10/backlog.md` |

---

## 🔴 Phase 1: P0 — Pilot Blockers (12-16.5h)

### Story 11.1: SEC-001 — Account Lockout (Failed Login Counter + Lock)
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit  
**Dependencies:** None

**Quick Summary:** As a system administrator, I want failed login attempts tracked and accounts temporarily locked after repeated failures, so that brute-force attacks are prevented.

**Key Deliverables:**
- [ ] Track failed login attempts per user (counter + last attempt timestamp)
- [ ] Lock account after 5 consecutive failures (30-minute lockout)
- [ ] Return generic error message (no account existence disclosure)
- [ ] Auto-unlock after lockout period expires
- [ ] Unit tests for lockout logic
- [ ] Update auth documentation

---

### Story 11.2: SEC-005 — File Upload Magic-Byte Validation
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit  
**Dependencies:** None

**Quick Summary:** As a security engineer, I want uploaded files validated by magic bytes (not just MIME type/extension), so that MIME-type spoofing attacks are blocked.

**Key Deliverables:**
- [ ] Add magic-byte validation to file upload interceptor
- [ ] Validate JPEG (FF D8 FF), PNG (89 50 4E 47), WebP signatures
- [ ] Reject files where extension/MIME doesn't match magic bytes
- [ ] Unit tests for each file type + spoofed file rejection
- [ ] Update file upload documentation

---

### Story 11.3: SEC-007 + DEP-001 — npm Audit Fix + Swagger Conditional Loading
**Priority:** 🔴 CRITICAL  
**Estimate:** 30min  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit  
**Dependencies:** None

**Quick Summary:** As a DevOps engineer, I want npm HIGH vulnerabilities fixed and Swagger UI hidden in production, so that known vulnerabilities are patched and API documentation isn't publicly exposed.

**Key Deliverables:**
- [ ] Run `npm audit fix` to resolve 2 HIGH vulnerabilities
- [ ] Conditionally load SwaggerModule only when `NODE_ENV !== 'production'`
- [ ] Verify no regression in existing tests

---

### Story 11.4: FR19 — Badge Visibility Toggle (Public/Private Control)
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-6h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** PRD Audit + Feature Audit P0-1  
**Dependencies:** None

**Quick Summary:** As an employee, I want to control whether each of my badges is publicly visible or private, so that I have ownership over my professional credential visibility.

**Key Deliverables:**
- [ ] Add `visibility` field to Badge model (PUBLIC/PRIVATE, default: PUBLIC)
- [ ] Database migration for new field
- [ ] PATCH /api/badges/:id/visibility endpoint
- [ ] Update badge wallet UI with toggle switch per badge
- [ ] Public verification page respects visibility setting (404 for private)
- [ ] Employee profile page filters private badges from public view
- [ ] Unit + E2E tests for visibility logic
- [ ] Update API documentation

---

### Story 11.5: FEATURE-P0-2 — LinkedIn Share Tab in BadgeShareModal
**Priority:** 🔴 CRITICAL  
**Estimate:** 3-4h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit P0-2 + PRD ("viral growth engine")  
**Dependencies:** None

**Quick Summary:** As an employee, I want a LinkedIn sharing tab in the badge share modal, so that I can share my credentials on LinkedIn for professional visibility and viral platform growth.

**Key Deliverables:**
- [ ] Add "LinkedIn" tab to BadgeShareModal
- [ ] Generate LinkedIn share URL with pre-filled title/description/verification link
- [ ] One-click share button opening LinkedIn share dialog
- [ ] Preview of how the share will appear
- [ ] Track share events in analytics
- [ ] Unit tests for URL generation logic

---

## 🟡 Phase 2: P1 Security (9-11.5h)

### Story 11.6: SEC-002 — JWT Migration to httpOnly Cookies
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit HIGH  
**Dependencies:** None

**Quick Summary:** As a security engineer, I want JWT tokens stored in httpOnly cookies instead of localStorage, so that XSS attacks cannot steal authentication tokens.

**Key Deliverables:**
- [ ] Set access token in httpOnly cookie on login/refresh
- [ ] Set refresh token in httpOnly cookie (separate, stricter path)
- [ ] Configure SameSite=Strict and Secure flags
- [ ] Update frontend to remove localStorage token handling
- [ ] Update API calls to use credentials: 'include' (cookies sent automatically)
- [ ] Update CORS configuration for cookie-based auth
- [ ] Update logout to clear cookies server-side
- [ ] Comprehensive auth flow E2E tests
- [ ] Update auth documentation + ADR

---

### Story 11.7: SEC-003 — Issuer Email Masking on Public Verification Pages
**Priority:** 🟡 MEDIUM  
**Estimate:** 30min  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit MEDIUM  
**Dependencies:** None

**Quick Summary:** As a privacy-conscious issuer, I want my email address masked on public badge verification pages, so that my full email is not exposed to external viewers.

**Key Deliverables:**
- [ ] Apply existing `maskEmail()` utility to issuer email on verification response
- [ ] Verify public verification page shows masked email (e.g., j***@company.com)
- [ ] Unit test for email masking in verification context

---

### Story 11.8: SEC-004 — Log PII Sanitization (14+ Cleartext Emails)
**Priority:** 🟡 LOW  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit LOW  
**Dependencies:** None

**Quick Summary:** As a compliance officer, I want all PII (emails, names) sanitized in application logs, so that logs don't contain cleartext personal data (GDPR compliance).

**Key Deliverables:**
- [ ] Identify all 14+ log statements containing cleartext email addresses
- [ ] Create log sanitization utility (mask email, truncate name)
- [ ] Replace all PII in log statements with sanitized versions
- [ ] Ensure error stack traces don't leak PII
- [ ] Unit tests for sanitization utility

---

### Story 11.9: SEC-006 — Global HTML Sanitization Pipe
**Priority:** 🟡 MEDIUM  
**Estimate:** 2-3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit MEDIUM  
**Dependencies:** None

**Quick Summary:** As a security engineer, I want all user-submitted text fields globally sanitized for HTML/script injection, so that stored XSS attacks are prevented at the input layer.

**Key Deliverables:**
- [ ] Install DOMPurify (or similar) for server-side HTML sanitization
- [ ] Create NestJS global validation pipe for string sanitization
- [ ] Apply to all DTO string fields (badge names, descriptions, criteria text)
- [ ] Preserve legitimate formatting (if any markdown fields exist)
- [ ] Unit tests for XSS payload rejection
- [ ] E2E test confirming sanitized output

---

## 🟡 Phase 3: P1 Code Quality (19-26h)

### Story 11.10: CQ-001 — badge-templates.service.ts Unit Tests
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a developer, I want comprehensive unit tests for badge-templates.service.ts (386 lines, 0 tests), so that this core module has regression protection.

**Key Deliverables:**
- [ ] Create `badge-templates.service.spec.ts`
- [ ] Test all CRUD operations (create, find, update, delete, search)
- [ ] Test criteria template management
- [ ] Test image upload integration logic
- [ ] Test error handling paths
- [ ] Target: >80% line coverage for this service

---

### Story 11.11: CQ-002 — issuance-criteria-validator.service.ts Unit Tests
**Priority:** 🟡 HIGH  
**Estimate:** 3-4h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a developer, I want unit tests for issuance-criteria-validator.service.ts (358 lines, complex validation, 0 tests), so that criteria validation logic is verified.

**Key Deliverables:**
- [ ] Create `issuance-criteria-validator.service.spec.ts`
- [ ] Test all validation rule types
- [ ] Test edge cases (empty criteria, malformed input, boundary values)
- [ ] Test error messaging accuracy
- [ ] Target: >80% line coverage

---

### Story 11.12: CQ-003 — blob-storage.service.ts Unit Tests
**Priority:** 🟡 HIGH  
**Estimate:** 3-4h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a developer, I want unit tests for blob-storage.service.ts (346 lines, critical infrastructure, 0 tests), so that Azure Blob Storage operations have regression protection.

**Key Deliverables:**
- [ ] Create `blob-storage.service.spec.ts`
- [ ] Mock Azure SDK (`@azure/storage-blob`) interactions
- [ ] Test upload, download, delete, list operations
- [ ] Test error handling (network failures, auth errors, missing containers)
- [ ] Test SAS token generation
- [ ] Target: >80% line coverage

---

### Story 11.13: CQ-004 — NestJS Logger Integration (22 Services/Controllers)
**Priority:** 🟡 MEDIUM  
**Estimate:** 2-3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** Story 11.8 (SEC-004, PII sanitization — Logger should use sanitized output)

**Quick Summary:** As a DevOps engineer, I want all 22 services and controllers using NestJS's built-in Logger instead of console.log, so that logs are structured, leveled, and production-ready.

**Key Deliverables:**
- [ ] Add `private readonly logger = new Logger(ClassName.name)` to 22 modules
- [ ] Replace all `console.log/error/warn` with `this.logger.log/error/warn`
- [ ] Ensure consistent log format with context labels
- [ ] Verify log levels are appropriate (debug/log/warn/error)
- [ ] No functional regressions

---

### Story 11.14: CQ-005 — Remove Unused Dependencies
**Priority:** 🟢 LOW  
**Estimate:** 15min  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a developer, I want unused npm dependencies removed, so that the dependency tree is clean and install times are shorter.

**Key Deliverables:**
- [ ] Remove `keyv` (unused)
- [ ] Remove `framer-motion` (unused)
- [ ] Remove `tailwindcss-animate` (unused)
- [ ] Verify no import references remain
- [ ] Verify build + tests pass after removal

---

### Story 11.15: CQ-006 — Frontend Design System Consistency (Inline → Tailwind)
**Priority:** 🟡 MEDIUM  
**Estimate:** 2-3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit + Feature Audit P1-1  
**Dependencies:** None

**Quick Summary:** As a frontend developer, I want inline styles migrated to Tailwind CSS classes, so that the design system is consistent and maintainable.

**Key Deliverables:**
- [ ] Audit all inline `style={}` usages in React components
- [ ] Convert to Tailwind utility classes where applicable
- [ ] Ensure visual parity (no UI regressions — screenshot comparison)
- [ ] Document any exceptions where inline styles are necessary

---

### Story 11.16: CQ-007 — Paginated Response Format Standardization
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a frontend developer, I want all paginated API endpoints to return a consistent `PaginatedResponse<T>` format, so that pagination handling is uniform across the application.

**Key Deliverables:**
- [ ] Define `PaginatedResponse<T>` interface: `{ data: T[], meta: { total, page, limit, totalPages } }`
- [ ] Create shared pagination utility (backend)
- [ ] Migrate 5 controllers to standardized format:
  - [ ] badge-templates.controller
  - [ ] badges.controller
  - [ ] users.controller
  - [ ] skills.controller
  - [ ] analytics.controller
- [ ] Update frontend API clients to consume new format
- [ ] Update existing E2E tests for new response shape
- [ ] Document pagination contract in API docs

---

## 🟡 Phase 4: P1 Feature Fixes (7h)

### Story 11.17: FR26 — Analytics CSV Export
**Priority:** 🟡 MEDIUM  
**Estimate:** 3h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** PRD Audit + Feature Audit P1-5  
**Dependencies:** None

**Quick Summary:** As an HR administrator, I want to export analytics data as CSV, so that I can create custom reports in Excel for leadership presentations.

**Key Deliverables:**
- [ ] GET /api/analytics/export?format=csv endpoint
- [ ] Generate CSV with headers: Date, Metric, Value, Category
- [ ] Include badge issuance, claiming, verification, and sharing metrics
- [ ] Set proper Content-Type and Content-Disposition headers
- [ ] Add "Export CSV" button to Analytics Dashboard
- [ ] Unit test for CSV generation logic

---

### Story 11.18: FEATURE-P1-6 — Verification Page: Skill UUID → Display Name
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit  
**Dependencies:** None

**Quick Summary:** As a badge verifier, I want skill names displayed instead of UUIDs on the public verification page, so that credentials appear trustworthy and professional.

**Key Deliverables:**
- [ ] Join skill names in verification endpoint response (replace UUID array with name array)
- [ ] Update verification page frontend to render skill names
- [ ] Unit test for skill name resolution

---

### Story 11.19: FEATURE-P1-4 — 403 Access Denied Page
**Priority:** 🟡 MEDIUM  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit  
**Dependencies:** None

**Quick Summary:** As a user, I want a clear "Access Denied" page when I lack permissions, so that I understand why I can't access a page and know what to do next.

**Key Deliverables:**
- [ ] Create `AccessDeniedPage.tsx` component with Shadcn UI styling
- [ ] Display user's current role and required role
- [ ] Provide "Go Back" and "Contact Admin" actions
- [ ] Route guard redirects to /403 instead of generic error
- [ ] Visual consistency with existing 404 page

---

### Story 11.20: FEATURE-P1-8 — ClaimPage Hardcoded UUID Fix
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit  
**Dependencies:** None

**Quick Summary:** As a developer, I want hardcoded UUIDs removed from ClaimPage, so that the component works dynamically with any badge.

**Key Deliverables:**
- [ ] Replace hardcoded UUID with route parameter or prop
- [ ] Verify claim flow works end-to-end with dynamic badge IDs
- [ ] Unit test for dynamic ID handling

---

## 🟡 Phase 5: P1 Tech Debt + Nav Fix (4.5h)

### Story 11.21: TD-023 + TD-024 — CI Quality Gates (Chinese Characters + console.log)
**Priority:** 🟡 MEDIUM  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** project-context.md  
**Dependencies:** Story 11.13 (CQ-004 — Logger migration should complete first, so console.log scan doesn't trigger on remaining legitimate uses)

**Quick Summary:** As a CI engineer, I want automated CI gates that block Chinese characters and console.log statements in source code, so that code quality is enforced at the pipeline level.

**Key Deliverables:**
- [ ] Add CI step: grep for Chinese characters ([\u4E00-\u9FFF]) in src/, fail on match
- [ ] Add CI step: grep for console.log/error/warn in src/ (exclude *.spec.ts, *.test.ts), fail on match
- [ ] Exclude legitimate uses (e.g., NestJS Logger internals)
- [ ] Test CI gates with intentional violations
- [ ] Update CI documentation

---

### Story 11.22: TD-025 — Husky Pre-commit Hooks
**Priority:** 🟡 MEDIUM  
**Estimate:** 2h  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** project-context.md  
**Dependencies:** None

**Quick Summary:** As a developer, I want pre-commit hooks that run ESLint and related checks on staged files, so that quality issues are caught before code is committed.

**Key Deliverables:**
- [ ] Install husky + lint-staged
- [ ] Configure pre-commit hook: ESLint on staged .ts/.tsx files
- [ ] Configure pre-commit hook: Prettier check on staged files
- [ ] Configure pre-commit hook: Chinese character check on staged files
- [ ] Document setup in README (developer onboarding)

---

### Story 11.23: FEAT-008-P0 — User Management Navigation Entry Fix
**Priority:** 🟡 HIGH  
**Estimate:** 30min  
**Status:** 🔴 Not Started  
**Story Doc:** 📄 [Pending creation]  
**Source:** sprint-10/backlog.md + Feature Audit  
**Dependencies:** None

**Quick Summary:** As an admin, I want the User Management page accessible from both desktop sidebar and mobile navigation, so that I can manage users without manually entering the URL.

**Key Deliverables:**
- [ ] Add "User Management" link to desktop sidebar navigation (ADMIN role only)
- [ ] Add "User Management" link to mobile hamburger menu (ADMIN role only)
- [ ] Verify routing works correctly
- [ ] Visual consistency with other navigation items

---

## 📊 Stories Summary

| # | Story ID | Title | Priority | Est. | Source | Status |
|---|----------|-------|----------|------|--------|--------|
| 1 | 11.1 | SEC-001: Account Lockout | 🔴 | 2-3h | Security Audit | 🔴 |
| 2 | 11.2 | SEC-005: File Upload Magic-Byte | 🔴 | 2-3h | Security Audit | 🔴 |
| 3 | 11.3 | SEC-007+DEP-001: npm audit + Swagger | 🔴 | 30min | Security Audit | 🔴 |
| 4 | 11.4 | FR19: Badge Visibility Toggle | 🔴 | 4-6h | PRD+Feature Audit | 🔴 |
| 5 | 11.5 | LinkedIn Share Tab | 🔴 | 3-4h | Feature Audit | 🔴 |
| 6 | 11.6 | SEC-002: JWT httpOnly Cookies | 🟡 | 4-6h | Security Audit | 🔴 |
| 7 | 11.7 | SEC-003: Issuer Email Masking | 🟡 | 30min | Security Audit | 🔴 |
| 8 | 11.8 | SEC-004: Log PII Sanitization | 🟡 | 2h | Security Audit | 🔴 |
| 9 | 11.9 | SEC-006: HTML Sanitization Pipe | 🟡 | 2-3h | Security Audit | 🔴 |
| 10 | 11.10 | CQ-001: badge-templates.service Tests | 🟡 | 4-6h | Code Quality Audit | 🔴 |
| 11 | 11.11 | CQ-002: issuance-criteria-validator Tests | 🟡 | 3-4h | Code Quality Audit | 🔴 |
| 12 | 11.12 | CQ-003: blob-storage.service Tests | 🟡 | 3-4h | Code Quality Audit | 🔴 |
| 13 | 11.13 | CQ-004: NestJS Logger Integration | 🟡 | 2-3h | Code Quality Audit | 🔴 |
| 14 | 11.14 | CQ-005: Remove Unused Dependencies | 🟢 | 15min | Code Quality Audit | 🔴 |
| 15 | 11.15 | CQ-006: Design System Consistency | 🟡 | 2-3h | Code Quality+Feature | 🔴 |
| 16 | 11.16 | CQ-007: Pagination Standardization | 🟡 | 4-6h | Code Quality Audit | 🔴 |
| 17 | 11.17 | FR26: Analytics CSV Export | 🟡 | 3h | PRD+Feature Audit | 🔴 |
| 18 | 11.18 | Verification Skill UUID→Name | 🟡 | 1h | Feature Audit | 🔴 |
| 19 | 11.19 | 403 Access Denied Page | 🟡 | 2h | Feature Audit | 🔴 |
| 20 | 11.20 | ClaimPage Hardcoded UUID Fix | 🟡 | 1h | Feature Audit | 🔴 |
| 21 | 11.21 | CI Quality Gates (Chinese+console) | 🟡 | 2h | project-context.md | 🔴 |
| 22 | 11.22 | Husky Pre-commit Hooks | 🟡 | 2h | project-context.md | 🔴 |
| 23 | 11.23 | User Management Nav Fix | 🟡 | 30min | Backlog+Feature Audit | 🔴 |
| | **TOTAL** | **23 stories** | | **51.5-65.5h** | | |

---

## 📐 Recommended Execution Order

Stories should be executed in dependency-aware order:

### Wave 1: Quick Wins + Security Foundation (Day 1-2)
1. **11.3** SEC-007+DEP-001 — npm audit + Swagger (30min, zero-risk)
2. **11.14** CQ-005 — Remove unused deps (15min, zero-risk)
3. **11.23** FEAT-008-P0 — Nav fix (30min, independent)
4. **11.7** SEC-003 — Email masking (30min, independent)
5. **11.20** FEATURE-P1-8 — ClaimPage UUID fix (1h, independent)
6. **11.1** SEC-001 — Account lockout (2-3h, auth module)

### Wave 2: Security Hardening (Day 3-5)
7. **11.2** SEC-005 — File upload magic-byte (2-3h)
8. **11.8** SEC-004 — Log PII sanitization (2h, needed before Logger)
9. **11.9** SEC-006 — HTML sanitization pipe (2-3h)
10. **11.6** SEC-002 — JWT httpOnly cookies (4-6h, largest security change)

### Wave 3: Core Features (Day 5-7)
11. **11.4** FR19 — Badge visibility toggle (4-6h, DB migration + UI)
12. **11.5** LinkedIn share tab (3-4h, frontend-heavy)
13. **11.18** Verification skill UUID→Name (1h)
14. **11.19** 403 Access Denied page (2h)

### Wave 4: Code Quality (Day 7-10)
15. **11.13** CQ-004 — NestJS Logger integration (2-3h, after PII sanitization)
16. **11.10** CQ-001 — badge-templates.service tests (4-6h)
17. **11.11** CQ-002 — issuance-criteria-validator tests (3-4h)
18. **11.12** CQ-003 — blob-storage.service tests (3-4h)
19. **11.16** CQ-007 — Pagination standardization (4-6h)

### Wave 5: Polish & CI (Day 10-12)
20. **11.15** CQ-006 — Design system consistency (2-3h)
21. **11.17** FR26 — Analytics CSV export (3h)
22. **11.21** CI quality gates (2h, after Logger migration)
23. **11.22** Husky pre-commit hooks (2h)

---

## 🎯 Definition of Done

### Story-Level DoD
Each story must meet:
- [ ] All acceptance criteria in story doc satisfied
- [ ] All existing tests pass (0 regressions from 1061 baseline)
- [ ] New tests written where applicable
- [ ] ESLint: 0 errors + 0 warnings (both frontend + backend)
- [ ] Code reviewed (SM acceptance)

### Sprint-Level DoD
Reference: [sprint-completion-checklist-template.md](../templates/sprint-completion-checklist-template.md)

- [ ] **project-context.md updated** (status, Sprint 11, implemented features, next actions)
- [ ] **Sprint retrospective created** (`docs/sprints/sprint-11/retrospective.md`)
- [ ] **CHANGELOG.md updated** (frontend + backend)
- [ ] **Code merged to main + Git tag** (v1.1.0)
- [ ] **All tests passing** (target: 1100+ tests, 0 regressions)
- [ ] **npm audit:** 0 HIGH/CRITICAL vulnerabilities

---

## 🚧 Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| JWT httpOnly migration breaks existing auth flows | Medium | High | Thorough E2E testing, keep localStorage fallback initially |
| Pagination standardization breaks frontend consumers | Medium | Medium | Update frontend clients in same story, test each endpoint |
| Badge visibility migration affects existing data | Low | Medium | Default all existing badges to PUBLIC (non-breaking) |
| Context switching overhead (23 stories, diverse topics) | Medium | Medium | Wave-based execution, batch related stories |

---

## 📌 Explicitly NOT in Sprint 11

| Item | Reason | Target |
|------|--------|--------|
| CQ-008: HTTP Client unification (51 fetch) | P2, large refactor | Sprint 12 |
| CQ-009: Large component splitting | P2, 8-12h | Sprint 12 |
| CQ-010/011: Additional test coverage | P2, 24-36h | Sprint 12-13 |
| FEAT-008: User Management enhancements | P1, manual add + M365 sync UI | Sprint 12 |
| FR27: Azure AD SSO | P3, 16-24h | Sprint 12 |
| PROD: Production deployment | Depends on SSO | Sprint 12 |
| TD-006: Teams channel permissions | External blocker | When admin approves |
| UX-001~009: UI polish items | P2 | Sprint 12+ |
| FEAT-001~006: Backlog features | Phase 2 | Deferred |

> **⚠️ 依赖关系说明 (FEAT-008 ↔ FR27):**
> M365 同步创建的用户 `passwordHash` 为空（代码注释: *"Empty - user will authenticate via SSO"*），
> 在当前 JWT 密码登录体系下这些用户**无法登录**。Sprint 12 规划时需决定：
> - **方案 A:** 先做 FR27 (SSO) → M365 用户通过 Azure AD 登录（推荐，架构一致）
> - **方案 B:** FEAT-008 中为 M365 同步用户生成临时密码 + password reset 邮件 → 用现有密码登录
> - **执行顺序:** 若选方案 A，则 FR27 → FEAT-008；若选方案 B，则 FEAT-008 可独立先行

---

## 📌 Action Items (Non-Development)

- [ ] **PO (LegendZhu):** Contact IT admin for Teams ChannelMessage.Send permission (TD-006)
- [ ] **PO:** Confirm pilot program timeline — influences Sprint 12 priority
- [ ] **SM:** Create story docs as development progresses (via [CS] workflow)

---

**Last Updated:** 2026-02-12  
**Status:** Planning Complete — Ready for Story Creation  
**Created By:** SM Agent (Bob)
