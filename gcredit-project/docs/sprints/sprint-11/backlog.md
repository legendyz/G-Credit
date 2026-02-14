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
- [x] Account lockout mechanism implemented (防暴力破解) ✅ Wave 2
- [x] File upload magic-byte validation (防MIME欺骗) ✅ Wave 2
- [x] npm audit 0 HIGH vulnerabilities + Swagger production-hidden ✅ Wave 1
- [x] Badge visibility toggle (public/private) fully functional ✅ Wave 3
- [x] LinkedIn share tab integrated into BadgeShareModal ✅ Wave 3
- [x] JWT migrated to httpOnly cookies (防XSS token theft) ✅ Wave 2
- [x] Issuer email masked on public verification pages ✅ Wave 1
- [x] Log PII sanitized (GDPR compliance) ✅ Wave 2
- [x] Global HTML sanitization pipe active ✅ Wave 2
- [x] 3 core services have unit test coverage (badge-templates, issuance-criteria-validator, blob-storage) ✅ Wave 4
- [x] NestJS Logger added to all 22 services/controllers ✅ Wave 4
- [x] Paginated response format standardized (`PaginatedResponse<T>`) ✅ Wave 4
- [x] User Management navigation entry accessible ✅ Wave 1
- [x] All 1263 tests passing (0 regressions) ✅ Wave 5 — BE 722 + FE 541

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
| **P1 Security** | 11-13.5h | JWT httpOnly (6-8h↑), Email脱敏, PII清理, HTML清洗 |
| **P1 Code Quality** | 19-26h | 3 service tests, Logger, Dependencies, Design, Pagination |
| **P1 Features** | 7h | CSV Export, Skill UUID fix, 403 Page, ClaimPage fix |
| **P1 Tech Debt** | 4h | CI Chinese gate, CI console.log gate, Husky hooks |
| **P1 Nav Fix** | 0.5h | FEAT-008-P0 User Management nav |
| **TOTAL** | **53.5-67.5h** | Target: 62h |

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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** PRD Audit + Feature Audit P0-1  
**Dependencies:** None

**Quick Summary:** As an employee, I want to control whether each of my badges is publicly visible or private, so that I have ownership over my professional credential visibility.

**Key Deliverables:**
- [ ] Add `visibility` Prisma enum (`BadgeVisibility: PUBLIC | PRIVATE`) + `@default(PUBLIC)` — 与 `BadgeStatus` enum 风格一致 (Arch Review)
- [ ] Database migration + composite index `@@index([visibility, status])` + `@@index([recipientId, visibility])` (Arch Review)
- [ ] PATCH /api/badges/:id/visibility endpoint
- [ ] Wallet 卡片 toggle（Lucide `Globe`/`Lock` 图标，toast 反馈）+ Badge Detail Modal toggle — 双入口设计 (UX Review)
- [ ] Public verification page: PRIVATE badge 返回 404 ("Badge Not Available" 措辞)
- [ ] OB Assertion 端点不检查 visibility — PRIVATE badge 的 assertion URL 仍可访问（UUID 不可枚举，OB 2.0 合规要求）(Arch Review 方案B)
- [ ] Public profile: PRIVATE badges 不显示，但显示 "X badges hidden by the owner" 提示 (UX Review)
- [ ] ClaimSuccessModal 添加提示 "Your badge is publicly visible. You can change this anytime from your wallet." (UX Review)
- [ ] Unit + E2E tests for visibility logic
- [ ] Update API documentation

---

### Story 11.5: FEATURE-P0-2 — LinkedIn Share Tab in BadgeShareModal
**Priority:** 🔴 CRITICAL  
**Estimate:** 3-4h  
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit P0-2 + PRD ("viral growth engine")  
**Dependencies:** None

**Quick Summary:** As an employee, I want a LinkedIn sharing tab in the badge share modal, so that I can share my credentials on LinkedIn for professional visibility and viral platform growth.

**Key Deliverables:**
- [ ] Add "LinkedIn" tab to BadgeShareModal — Tab 顺序: Email → LinkedIn → Teams → Widget (UX Review)
- [ ] 使用 LinkedIn Share URL API (`linkedin.com/sharing/share-offsite/?url=`)，`window.open()` 弹窗 (UX Review)
- [ ] 分享文案模板: 标题+描述+验证链接+hashtags，textarea 可编辑 (UX Review)
- [ ] 验证页需注入 Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) 以确保 LinkedIn 预览正确 (UX Review)
- [ ] 点击后按钮变"✓ LinkedIn opened"(disabled 5秒)，不关闭 Modal (UX Review)
- [ ] Track share events: `POST /api/analytics/track { type: 'SHARE', channel: 'LINKEDIN', badgeId }` (UX Review)
- [ ] LinkedIn 图标使用品牌色 `#0A66C2` SVG（其他 tab 保持 emoji，11.15 统一）(UX Review)
- [ ] Unit tests for URL generation logic

---

## 🟡 Phase 2: P1 Security (9-11.5h)

### Story 11.6: SEC-002 — JWT Migration to httpOnly Cookies
**Priority:** 🟡 HIGH  
**Estimate:** 6-8h ↑ (Arch Review: +`apiFetch()` wrapper for 51 fetch calls + ADR-010)  
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit HIGH  
**Dependencies:** None

**Quick Summary:** As a security engineer, I want JWT tokens stored in httpOnly cookies instead of localStorage, so that XSS attacks cannot steal authentication tokens.

**Key Deliverables:**
- [ ] **Sub-1 (1h):** Create `lib/apiFetch.ts` wrapper (`credentials: 'include'` + Content-Type) + batch replace 51 `fetch()` calls (Arch Review — CQ-008 minimal viable)
- [ ] **Sub-2 (2h):** Backend: Set-Cookie on login/refresh + JwtAuthGuard reads cookie first, Authorization header fallback (双写过渡期) (Arch Review)
- [ ] **Sub-3 (1h):** Frontend: remove localStorage token write + Vite proxy `cookieDomainRewrite: 'localhost'` (Arch Review)
- [ ] **Sub-4 (1h):** Access Token cookie path: `/api`, Refresh Token cookie path: `/api/auth` (Arch Review)
- [ ] Configure `SameSite=Lax` (NOT Strict — 邮件链接场景需要) + `Secure` flag (Arch Review)
- [ ] Update CORS configuration (already `credentials: true`, verify `Access-Control-Allow-Origin` not `*`)
- [ ] Update logout to clear cookies server-side
- [ ] **Sub-5 (1h):** Comprehensive auth flow E2E tests (双写期间 E2E 测试可暂不修改)
- [ ] **Sub-6 (1h):** Write ADR-010: JWT Token Transport Migration + update auth documentation (Arch Review 必须)

---

### Story 11.7: SEC-003 — Issuer Email Masking on Public Verification Pages
**Priority:** 🟡 MEDIUM  
**Estimate:** 30min  
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit MEDIUM  
**Dependencies:** None

**Quick Summary:** As a privacy-conscious issuer, I want my email address masked on public badge verification pages, so that my full email is not exposed to external viewers.

**Key Deliverables:**
- [ ] Apply existing `maskEmail()` utility to issuer email on verification response
- [ ] Verify public verification page shows masked email (e.g., j***@company.com) — 保留完整域名 (UX Review)
- [ ] Add privacy trust statement to VerifyBadgePage footer: "Personal information is partially hidden to protect privacy. Badge authenticity is verified by G-Credit's cryptographic signature." (UX Review)
- [ ] Unit test for email masking in verification context

---

### Story 11.8: SEC-004 — Log PII Sanitization (14+ Cleartext Emails)
**Priority:** 🟡 LOW  
**Estimate:** 2h  
**Status:** ✅ Done  
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
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Security Audit MEDIUM  
**Dependencies:** None

**Quick Summary:** As a security engineer, I want all user-submitted text fields globally sanitized for HTML/script injection, so that stored XSS attacks are prevented at the input layer.

**Key Deliverables:**
- [ ] Create `@SanitizeHtml()` class-transformer decorator using `sanitize-html` library (`allowedTags: []`) (Arch Review 方案A)
- [ ] Apply `@SanitizeHtml()` to all write-operation DTO string fields (badge names, descriptions, criteria text) (Arch Review)
- [ ] 仅对写操作 (POST/PUT/PATCH) 的 `@Body()` DTO 生效，GET `@Query()` 不加 (Arch Review)
- [ ] 用 `sanitize-html`（已在项目中），不用 DOMPurify（需 jsdom）(Arch Review)
- [ ] Create DTO checklist 确保所有写入 DTO 的 string 字段都覆盖 (Arch Review R-5)
- [ ] Unit tests for XSS payload rejection
- [ ] E2E test confirming sanitized output

---

## 🟡 Phase 3: P1 Code Quality (19-26h)

### Story 11.10: CQ-001 — badge-templates.service.ts Unit Tests
**Priority:** 🟡 HIGH  
**Estimate:** 4-6h  
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Code Quality Audit  
**Dependencies:** None

**Quick Summary:** As a frontend developer, I want all paginated API endpoints to return a consistent `PaginatedResponse<T>` format, so that pagination handling is uniform across the application.

**Key Deliverables:**
- [ ] Define `PaginatedResponse<T>` interface: `{ data: T[], meta: { total, page, limit, totalPages, hasNextPage, hasPreviousPage } }` (Arch Review)
- [ ] Create shared `createPaginatedResponse<T>()` utility (backend)
- [ ] Migrate 5 controllers to standardized format:
  - [ ] badge-templates.controller
  - [ ] badges.controller
  - [ ] users.controller (`users` → `data` key 名变更)
  - [ ] skills.controller
  - [ ] analytics.controller
- [ ] ⚠️ 前后端必须同一 PR 原子化修改，不可拆分部署 (Arch Review 条件)
- [ ] Update frontend API clients to consume new format (约5-8处)
- [ ] Update existing E2E tests for new response shape
- [ ] Document pagination contract in API docs

---

## 🟡 Phase 4: P1 Feature Fixes (7h)

### Story 11.17: FR26 — Analytics CSV Export
**Priority:** 🟡 MEDIUM  
**Estimate:** 3h  
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** PRD Audit + Feature Audit P1-5  
**Dependencies:** None

**Quick Summary:** As an HR administrator, I want to export analytics data as CSV, so that I can create custom reports in Excel for leadership presentations.

**Key Deliverables:**
- [ ] GET /api/analytics/export?format=csv endpoint
- [ ] Generate CSV with headers: Date, Metric, Value, Category
- [ ] Include badge issuance, claiming, verification, and sharing metrics
- [ ] Set proper Content-Type and Content-Disposition headers
- [ ] Add "Export CSV" button to Analytics Dashboard — 使用 PageTemplate `actions` slot，`variant="outline"` + Lucide `Download` 图标 (UX Review)
- [ ] 文件名格式: `gcredit-analytics-{YYYY-MM-DD}.csv` (UX Review)
- [ ] 下载交互: button loading 状态 → 浏览器直接下载 → toast.success (UX Review)
- [ ] Unit test for CSV generation logic

---

### Story 11.18: FEATURE-P1-6 — Verification Page: Skill UUID → Display Name
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Status:** ✅ Done  
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
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** Feature Audit  
**Dependencies:** None

**Quick Summary:** As a user, I want a clear "Access Denied" page when I lack permissions, so that I understand why I can't access a page and know what to do next.

**Key Deliverables:**
- [ ] Create `AccessDeniedPage.tsx` — 复用 NotFoundPage 布局模式 (`min-h-[60vh]`, `text-neutral-*`, `bg-brand-600`) (UX Review)
- [ ] Display user's current role only，不显示所需角色（OWASP 安全建议）(UX Review)
- [ ] 图标使用 Lucide `ShieldAlert`，双按钮: "Go Back" (outline, `navigate(-1)`) + "Contact Admin" (primary, mailto) (UX Review)
- [ ] 移动端按钮纵向堆叠: `flex-col sm:flex-row gap-3` (UX Review)
- [ ] Route guard redirects to /403 instead of generic error
- [ ] 401 (未登录) 仍走现有 redirect 到 `/login`，403 (无权限) 走新页面 (UX Review)

---

### Story 11.20: FEATURE-P1-8 — ClaimPage Hardcoded UUID Fix
**Priority:** 🟡 MEDIUM  
**Estimate:** 1h  
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
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
**Status:** ✅ Done  
**Story Doc:** 📄 [Pending creation]  
**Source:** sprint-10/backlog.md + Feature Audit  
**Dependencies:** None

**Quick Summary:** As an admin, I want the User Management page accessible from both desktop sidebar and mobile navigation, so that I can manage users without manually entering the URL.

**Key Deliverables:**
- [ ] 统一导航标签为 "Users"：MobileNav "User Management" → "Users" (UX Review — 简洁且与其他 nav 项命名风格一致)
- [ ] Desktop Navbar 保持现有 "Users" 不变 (UX Review)
- [ ] Verify routing works correctly
- [ ] Visual consistency with other navigation items

---

## 📊 Stories Summary

| # | Story ID | Title | Priority | Est. | Source | Status |
|---|----------|-------|----------|------|--------|--------|
| 1 | 11.1 | SEC-001: Account Lockout | 🔴 | 2-3h | Security Audit | ✅ |
| 2 | 11.2 | SEC-005: File Upload Magic-Byte | 🔴 | 2-3h | Security Audit | ✅ |
| 3 | 11.3 | SEC-007+DEP-001: npm audit + Swagger | 🔴 | 30min | Security Audit | ✅ |
| 4 | 11.4 | FR19: Badge Visibility Toggle | 🔴 | 4-6h | PRD+Feature Audit | ✅ |
| 5 | 11.5 | LinkedIn Share Tab | 🔴 | 3-4h | Feature Audit | ✅ |
| 6 | 11.6 | SEC-002: JWT httpOnly Cookies | 🟡 | 6-8h | Security Audit | ✅ |
| 7 | 11.7 | SEC-003: Issuer Email Masking | 🟡 | 30min | Security Audit | ✅ |
| 8 | 11.8 | SEC-004: Log PII Sanitization | 🟡 | 2h | Security Audit | ✅ |
| 9 | 11.9 | SEC-006: HTML Sanitization Pipe | 🟡 | 2-3h | Security Audit | ✅ |
| 10 | 11.10 | CQ-001: badge-templates.service Tests | 🟡 | 4-6h | Code Quality Audit | ✅ |
| 11 | 11.11 | CQ-002: issuance-criteria-validator Tests | 🟡 | 3-4h | Code Quality Audit | ✅ |
| 12 | 11.12 | CQ-003: blob-storage.service Tests | 🟡 | 3-4h | Code Quality Audit | ✅ |
| 13 | 11.13 | CQ-004: NestJS Logger Integration | 🟡 | 2-3h | Code Quality Audit | ✅ |
| 14 | 11.14 | CQ-005: Remove Unused Dependencies | 🟢 | 15min | Code Quality Audit | ✅ |
| 15 | 11.15 | CQ-006: Design System Consistency | 🟡 | 2-3h | Code Quality+Feature | ✅ |
| 16 | 11.16 | CQ-007: Pagination Standardization | 🟡 | 4-6h | Code Quality Audit | ✅ |
| 17 | 11.17 | FR26: Analytics CSV Export | 🟡 | 3h | PRD+Feature Audit | ✅ |
| 18 | 11.18 | Verification Skill UUID→Name | 🟡 | 1h | Feature Audit | ✅ |
| 19 | 11.19 | 403 Access Denied Page | 🟡 | 2h | Feature Audit | ✅ |
| 20 | 11.20 | ClaimPage Hardcoded UUID Fix | 🟡 | 1h | Feature Audit | ✅ |
| 21 | 11.21 | CI Quality Gates (Chinese+console) | 🟡 | 2h | project-context.md | ✅ |
| 22 | 11.22 | Husky Pre-commit Hooks | 🟡 | 2h | project-context.md | ✅ |
| 23 | 11.23 | User Management Nav Fix | 🟡 | 30min | Backlog+Feature Audit | ✅ |
| | **TOTAL** | **23 stories** | | **53.5-67.5h** | | |

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

## ✅ Architect & UX Review Conditions (2026-02-13)

**Architect Review:** APPROVED WITH CONDITIONS ([arch-review-result.md](arch-review-result.md))  
**UX Review:** APPROVED WITH CONDITIONS ([ux-review-result.md](ux-review-result.md))

### 必须满足的条件（已整合到上方 Story Deliverables 中）

| # | 条件 | 来源 | 相关 Story |
|---|------|------|-----------|
| C-1 | Story 11.6 估时调至 6-8h，包含 `apiFetch()` 包装器子任务 | Architect | 11.6 ✅ |
| C-2 | Story 11.6 完成时提交 ADR-010 (JWT Token Transport Migration) | Architect | 11.6 ✅ |
| C-3 | Story 11.4 明确 PRIVATE badge OB assertion 可访问（方案B） | Architect | 11.4 ✅ |
| C-4 | Story 11.16 前后端同一 PR 原子化修改 | Architect | 11.16 ✅ |
| C-5 | Story 11.4 双入口 toggle（Wallet 卡片 + Detail Modal），默认 PUBLIC | UX | 11.4 ✅ |
| C-6 | Story 11.5 验证页需 OG meta tags 以支持 LinkedIn 预览 | UX | 11.5 ✅ |
| C-7 | Story 11.7 验证页添加隐私信任声明 | UX | 11.7 ✅ |

### 新发现的风险

| # | 风险 | 影响 | 缓解 |
|---|------|------|------|
| R-1 | Story 11.6 与 CQ-008 (51 fetch calls) 隐藏耦合 | 估时不足 | 在 11.6 中创建 `apiFetch()` 包装器 ✅ |
| R-2 | Story 11.9 DTO 装饰器可能遗漏字段 | 未受保护 | 创建 DTO checklist ✅ |
| R-3 | Vite proxy 需要 cookie 配置调整 (11.6) | Dev 环境 cookie 不生效 | 11.6 story doc 中明确 ✅ |

### 需要新增的 ADR

| ADR | 标题 | 关联 Story | 必要性 |
|-----|------|-----------|--------|
| ADR-010 | JWT Token Transport: localStorage → httpOnly Cookie | 11.6 | 🔴 必须 |
| ADR-011 | Global Input Sanitization Strategy | 11.9 | 🟡 推荐 |

---

## � Sprint Progress

### Wave 1 — Quick Wins + Security Foundation ✅ (2026-02-14)
**Stories:** 11.3, 11.14, 11.23, 11.7, 11.20 (5/23 complete)  
**Commits:** `da97c2b..86f85df` (9 commits)  
**Code Review:** APPROVED ([wave-1-code-review.md](wave-1-code-review.md))  
**Tests:** BE 537 (+3) | FE 527 (0 regressions) = **1064 total**

| Story | Title | Result |
|-------|-------|--------|
| 11.3 | npm audit + Swagger conditional | ✅ 0 HIGH vulns, Swagger prod-hidden |
| 11.14 | Remove keyv, framer-motion | ✅ Removed, tailwindcss-animate kept |
| 11.23 | Nav label → "Users" | ✅ MobileNav unified |
| 11.7 | Issuer email masking | ✅ + privacy trust statement added |
| 11.20 | ClaimPage UUID fix | ✅ POST /badges/claim route added |
### Wave 2 — Security Hardening ✅ (2026-02-14)
**Stories:** 11.1, 11.2, 11.8, 11.9, 11.6 (10/23 complete)
**Commits:** `553a03c..59d6938` (13 commits: 5 feature + 4 CI fixes + style + docs + review fix + lesson)
**Code Review:** APPROVED ([wave-2-code-review.md](wave-2-code-review.md))
**Tests:** BE 580 (+43) | FE 526 (-1, auth migration) = **1106 total**
**Note:** 4 CI failures before green (Lesson 40 — local checks must mirror CI)

| Story | Title | Result |
|-------|-------|--------|
| 11.1 | Account Lockout | ✅ 5 failures → 30min lock, unified error msg |
| 11.2 | File Upload Magic-Byte | ✅ Custom validator, JPEG/PNG/WebP/PDF/DOCX |
| 11.8 | Log PII Sanitization | ✅ 25+ emails → maskEmailForLog/user.id |
| 11.9 | @SanitizeHtml Decorator | ✅ 10+ DTOs, sanitize-html allowedTags:[] |
| 11.6 | JWT httpOnly Cookies | ✅ apiFetch wrapper, Set-Cookie, dual-read, ADR-010 |

### Wave 3 — Core Features ✅ (2026-02-14)
**Stories:** 11.4, 11.5, 11.18, 11.19 (14/23 complete)
**Commits:** `784d92c..a4b81df` (2 commits: 1 feature + 1 fix)
**Code Review:** APPROVED ([wave-3-code-review.md](wave-3-code-review.md))
**Tests:** BE 586 (+6) | FE 541 (+15) = **1127 total**

| Story | Title | Result |
|-------|-------|--------|
| 11.4 | Badge Visibility Toggle | ✅ Prisma enum, PATCH API, dual-entry toggle (Wallet+Modal), ClaimSuccessModal hint, PRIVATE→404 on verify, OB assertion unaffected (C-3) |
| 11.5 | LinkedIn Share Tab | ✅ 4th tab (Email→LinkedIn→Teams→Widget), SVG #0A66C2, share analytics, OG meta tags, "✓ opened" 5s state |
| 11.18 | Skill UUID→Name | ✅ Backend skill.findMany resolution, frontend {id,name} rendering |
| 11.19 | 403 Access Denied Page | ✅ AccessDeniedPage + /access-denied route, ProtectedRoute redirect, ShieldAlert icon, dual button |
### Wave 4 — Code Quality ✅ (2026-02-14)
**Stories:** 11.13, 11.10, 11.11, 11.12, 11.16 (19/23 complete)
**Commits:** `a541e60..0419d68` (7 commits: 1 logger + 3 test suites + 1 pagination + 2 lint fixes)
**Code Review:** APPROVED ([wave-4-code-review.md](wave-4-code-review.md))
**Tests:** BE 718 (+132) | FE 541 (0 regressions) = **1259 total**
**Note:** Lesson 35 recurrence — new spec files bypassed lint (fixed in commits ad50a9b/0419d68)

| Story | Title | Result |
|-------|-------|--------|
| 11.13 | NestJS Logger Integration | ✅ 22 files (13 controllers + 9 services) all have Logger, 0 console.log in production code |
| 11.10 | badge-templates.service Tests | ✅ 773-line spec, ~40 test cases, all 8 public methods + validateSkillIds covered |
| 11.11 | issuance-criteria-validator Tests | ✅ 672-line spec, ~55 test cases, all validation rules + templates covered, pure logic (no mocks) |
| 11.12 | blob-storage.service Tests | ✅ 453-line spec, ~30 test cases, Azure SDK/sharp/magic-bytes fully mocked |
| 11.16 | Pagination Standardization | ✅ PaginatedResponse<T> + createPaginatedResponse(), 5 endpoints migrated, all FE consumers + tests updated, C-4 atomic |

### Wave 5 — Polish & CI ✅ (2026-02-14)
**Stories:** 11.15, 11.17, 11.21, 11.22 (23/23 complete — **Sprint 11 DONE**)
**Commits:** `4d0fc84..2d452e5` (4 commits: 1 design system + 1 CSV export + 1 CI gates + 1 Husky)
**Code Review:** APPROVED ([wave-5-code-review.md](wave-5-code-review.md))
**Tests:** BE 722 (+4) | FE 541 (0 regressions) = **1263 total**

| Story | Title | Result |
|-------|-------|--------|
| 11.15 | Design System Consistency | ✅ 86→12 inline styles (remaining: dynamic/Recharts only), App.css deleted, 3 major components migrated to Tailwind |
| 11.17 | Analytics CSV Export | ✅ GET /api/analytics/export, 4-section RFC 4180 CSV, BOM, PageTemplate actions Export button, toast UX, 4 new tests |
| 11.21 | CI Quality Gates | ✅ ESLint no-console (BE+FE), CI Chinese char grep (both jobs), 1 Chinese fix (方案B→Option B), ErrorBoundary eslint-disable |
| 11.22 | Husky Pre-commit Hooks | ✅ Root package.json (husky+lint-staged), pre-commit (lint-staged+Chinese check), pre-push (full CI mirror per Lesson 40), README docs |

---

## �🚧 Sprint Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| ~~JWT httpOnly migration breaks existing auth flows~~ | ~~Medium~~ | ~~High~~ | ✅ Resolved Wave 2 — dual-read strategy, E2E passing |
| ~~Pagination standardization breaks frontend consumers~~ | ~~Medium~~ | ~~Medium~~ | ✅ Resolved Wave 4 — 5 endpoints + all FE consumers migrated atomically (C-4) |
| ~~Badge visibility migration affects existing data~~ | ~~Low~~ | ~~Medium~~ | ✅ Resolved Wave 3 — @default(PUBLIC), all existing badges auto-PUBLIC |
| ~~Context switching overhead (23 stories, diverse topics)~~ | ~~Medium~~ | ~~Medium~~ | ✅ Resolved — Wave-based execution completed all 23 stories across 5 waves |

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

## 📋 Sprint 12 待决策清单 (PO Decision Required)

以下设计问题需在 Sprint 12 规划前由 PO 决策：

### DEC-001: 登录页 UX 方案
**背景:** SSO 接入后，系统将同时存在两类用户（M365 导入 + 手工创建），需决定登录页交互方式。

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| **A. 双入口** | SSO 按钮 + 邮箱密码表单并列 | 改动最小，两类用户都能登录 | 用户可能选错入口 |
| **B. SSO 优先** | SSO 为主入口，密码登录折叠隐藏 | 引导统一体验 | 手工用户不易找到密码入口 |
| **C. 统一 SSO** | 取消密码登录，所有用户走 Azure AD | 体验统一，安全性最高 | 需所有用户在 Azure AD 中存在 |
| **D. 智能路由** | 输入邮箱后自动判断走 SSO 或密码 | 用户无感知 | 暴露邮箱是否存在（安全隐患） |

**SM 建议:** 方案 A 起步（pilot 阶段兜底），长期迁移到方案 C。

### DEC-002: 是否保留密码登录
**背景:** SSO 上线后，密码登录是保留（作为兜底/外部用户入口）还是计划下线？
- 保留 → 需长期维护两套认证逻辑
- 下线 → 手工创建的用户需迁移到 Azure AD

**SM 建议:** Pilot 阶段保留，GA 时评估下线。

### DEC-003: 手工创建用户的长期定位
**背景:** 手工创建用户（register）在 SSO 全面上线后的定位？
- **临时方案:** 后续全部迁移为 Azure AD 用户，register 功能关闭
- **长期并存:** 保留给外部合作伙伴/非 M365 租户用户

**SM 建议:** 取决于 G-Credit 是否只面向内部员工。若纯内部，建议迁移后关闭。

### DEC-004: FEAT-008 与 FR27 的执行顺序
**背景:** 已在依赖关系说明中列出，需 PO 最终拍板。
- **FR27 先行** → M365 用户自然可登录，FEAT-008 做 UI 增强即可
- **FEAT-008 先行** → 需额外实现临时密码生成 + password reset 邮件

**SM 建议:** FR27 先行（方案 A），避免临时密码的额外开发和安全审计成本。

### DEC-005: Admin 初始化机制（Bootstrap 问题）
**背景:** M365 同步创建的用户全部默认为 EMPLOYEE 角色（`role: 'EMPLOYEE'`）。当前的 Admin 用户完全依赖 seed 脚本硬编码（`admin@gcredit.com`），无生产级的 Admin bootstrap 机制。如果统一走 M365 导入，“第一个 Admin 从哪里来？”

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| **A. Seed 脚本** | 部署时运行 seed 创建初始 Admin | 简单，当前已有 | 仅适合开发/UAT，非生产级 |
| **B. 环境变量** | `INITIAL_ADMIN_EMAIL=xxx`，M365 同步时匹配设为 ADMIN | 配置简单，生产可用 | 仅解决首次部署，不可扩展 |
| **C. Azure AD Group 映射** | 读取 M365 Security Group（如 "G-Credit Admins"）自动设 Admin | 企业级，可扩展，与组织 IT 对齐 | 开发量较大，需 Graph API 权限 |
| **D. CLI 提权工具** | `npx promote-admin --email xxx` 一次性命令 | 直接简单 | 手动操作，无审计记录 |

**关联:** Decision #14（M365 auto role detection via directReports）设计了 Manager 角色自动检测，但 Admin bootstrap 未设计。

**SM 建议:** 短期方案 B（Sprint 12），长期方案 C（Phase 2）。

### DEC-006: Badge 邮件分享送达率问题
**背景:** Badge 邮件分享发送给外部收件人时，多次被收件方邮件服务器安全策略拦截。原因：发件域名 `2wjh85.onmicrosoft.com` 是 M365 开发者租户默认域名，未配置 SPF/DKIM/DMARC 认证记录，外部邮件服务器判定为可疑。非系统代码问题，是域名/邮件信誉问题。

| 方案 | 描述 | 改动范围 | 效果 |
|------|------|---------|------|
| **A. 自定义域名 + SPF/DKIM/DMARC** | M365 租户添加企业域名，配置邮件认证 DNS 记录 | IT admin 操作，代码仅改 `GRAPH_EMAIL_FROM` | 根本解决，外部送达率大幅提升 |
| **B. SendGrid/Mailgun** | 外部收件人走专业邮件服务，内部仍用 Graph API | 新增 Service + 分流逻辑 | 高送达率，Free Tier 100封/天 |
| **C. 不依赖邮件** | 增强“复制链接”“下载图片”“二维码”等替代分享方式 | 前端 UI 增强 | 规避邮件问题，但用户体验变化 |
| **D. 混合策略** | 内部用 Graph API，外部用 SendGrid + 复制链接兜底 | 后端分流 + 前端兜底 | 最佳平衡 |

**短期行动（无需写代码）:**
- [ ] IT admin 配置自定义域名 + SPF/DKIM/DMARC
- [ ] 确认前端 Badge 分享页是否已有“复制链接”按钮作为兜底

**SM 建议:** 短期方案 A（IT admin 操作，无开发成本），中期方案 D（Sprint 12+）。

---

**Last Updated:** 2026-02-14 (Sprint 11 COMPLETE — 23/23 stories delivered across 5 waves)  
**Status:** ✅ COMPLETE — All 23 stories delivered, Sprint DoD pending (project-context.md, retrospective, CHANGELOG, merge, tag)  
**Created By:** SM Agent (Bob)
