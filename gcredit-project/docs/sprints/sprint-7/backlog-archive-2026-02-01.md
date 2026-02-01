# Sprint 7 Backlog (归档版本)

> ⚠️ **此文件为归档备份，已不再维护**
> 
> **归档原因:** 2026-02-01 Pre-UAT Review 后，发现原 backlog 结构无法清晰指导 Dev Agent 执行任务顺序。  
> 经 Scrum Master 和 Product Owner 协商，决定重构 backlog 为基于 Phase 的执行清单。
>
> **新 backlog 启用时间:** 2026-02-01  
> **当前活跃文件:** [backlog.md](backlog.md)  
> **归档 commit:** `0bd9f79` (Pre-UAT Review findings and Sprint 7 planning update)

---

## 📜 归档说明

### 为什么保留此备份？

1. **历史记录保存:** 记录 Sprint 7 在 Pre-UAT Review 之前的完整规划
2. **决策追溯:** 了解从「完整 Story 列表」到「Phase-based 执行清单」的演变
3. **参考价值:** 保留详细的 Story 定义、Acceptance Criteria、Capacity Planning 等原始信息

### 新旧 backlog 对比

| 项目 | 旧版 (此文件) | 新版 (backlog.md) |
|------|---------------|-------------------|
| **行数** | 563 行 | 242 行 |
| **结构** | Story 列表 + 详细 AC | Phase 执行清单 |
| **目的** | 完整规划文档 | Dev Agent 执行指南 |
| **维护状态** | ❌ 已归档 | ✅ 活跃维护 |

### 关键变更

- **删除的内容:** 详细的 Story AC、Capacity Planning、Technical Tasks、Risk Assessment
- **保留到新版:** Sprint Goal、核心 Task 定义、Deferred Items
- **新增到新版:** Phase A/B/C/D 执行顺序、技术参考链接、Sprint Timeline

---

## 📋 原 backlog 内容 (Sprint 7 - Pre-UAT Review)

**Sprint:** Sprint 7  
**Duration:** February 3-11, 2026 (7 working days) ← **UPDATED after Technical Review**  
**Team:** Amelia (Dev Agent) + LegendZhu  
**Epic:** Epic 9 - Badge Revocation + Complete Lifecycle UAT  
**Last Updated:** February 1, 2026 (Post-Technical Review Meeting)

---

## 🎯 Sprint Goal

**Primary Goal:** 补齐Badge Revocation功能并完成完整生命周期的UAT验证

**Success Criteria:**
- ✅ Epic 9 (Badge Revocation) 100% complete
- ✅ Complete badge lifecycle UAT executed and documented
- ✅ All P0/P1 bugs discovered in UAT are fixed
- ✅ Standardized UAT process established for future sprints
- ✅ User experience significantly improved

---

## 📋 User Stories

### Sprint Setup (Stories 0.1-0.2)

#### **Story 0.1:** [Git Branch Creation](0-1-git-branch.md) - **CRITICAL** - 5 min ✅ DONE
As a **Development Team**,  
I want **to create Sprint 7 Git branch before any code changes**,  
So that **we follow GitFlow strategy and avoid merge conflicts**.

**Acceptance Criteria:**
- Branch created: `sprint-7/epic-9-revocation-lifecycle-uat`
- Pushed to remote with upstream tracking
- All team members verified working on correct branch
- Main branch remains clean

**Status:** ✅ COMPLETE (2026-01-31)

---

#### **Story 0.2a:** [Simple Login & Navigation System (MVP)](0-2-login-navigation.md) - **CRITICAL** - 6h ← **RESTORED from deferred**

**Status:** ⏳ READY-FOR-DEV (Restored from deferred on 2026-02-01 per Pre-UAT Review findings)

As a **User (any role)**,  
I want **to log in to the system and navigate between features**,  
So that **I can access role-appropriate functionality and complete UAT testing**.

**Acceptance Criteria:**
- Simple login page (email + password, basic ARIA labels)
- Auth state management (Zustand, NO token refresh in MVP)
- Role-based dashboard after login (Admin + Employee only in MVP)
- Protected routes with authentication check
- Basic top navigation layout with logout
- Test accounts accessible (for UAT)

**Why Critical:** Without this, Story U.1 (Complete Lifecycle UAT) cannot test multi-role workflows.

---

#### **Story 0.2b:** Auth Enhancements - **Sprint 8** - 3h
- Token refresh interceptor with exponential backoff
- Full WCAG 2.1 AA compliance (NVDA/VoiceOver testing)
- Manager + Issuer dashboard layouts
- Cross-browser testing (Safari, Firefox)

**Status:** Sprint 8 Backlog

---

#### **Story 0.3:** CSP Security Headers - **Sprint 8** - 1h
Content Security Policy headers configuration.

**Status:** Sprint 8 Backlog

---

### Epic 9: Badge Revocation (Stories 9.1-9.5)

#### **Story 9.1:** [Badge Revocation API](9-1-revoke-api.md) - **HIGH** - 7h ← **UPDATED (+2h)**
As an **Admin or Issuer**,  
I want **to revoke a badge with a documented reason**,  
So that **I can handle policy violations, errors, or expired credentials properly**.

**Acceptance Criteria:**
- API endpoint `POST /api/badges/:id/revoke` implemented
- Request body accepts revocation reason and optional notes
- Soft-delete pattern: Badge.status = REVOKED (not CLAIMED)
- AuditLog table created and entry logged
- REVOKED enum status added to Prisma schema
- API is idempotent (revoke already-revoked badge returns 200)
- Authorization: Only ADMIN or original issuer can revoke

---

#### **Story 9.2:** [Revoked Badge Status in Verification](9-2-verification-status.md) - **HIGH** - 4h
As an **External Verifier**,  
I want **to see when a badge has been revoked on the verification page**,  
So that **I know the badge is no longer valid**.

**Acceptance Criteria:**
- Public verification page shows REVOKED status clearly
- Revocation date and reason (if public-facing) displayed
- Visual treatment (red badge, warning icon)
- JSON-LD assertion reflects revoked status
- Open Badges 2.0 compliance maintained

---

#### **Story 9.3:** [Employee Wallet Revoked Badge Display](9-3-wallet-display.md) - **HIGH** - 4h
As an **Employee**,  
I want **to see which of my badges have been revoked in my wallet**,  
So that **I understand my current credential status**.

**Acceptance Criteria:**
- Revoked badges shown greyed out with red "REVOKED" banner overlay
- Badge detail modal shows revocation details
- Revoked badges cannot be shared (button disabled with tooltip)
- Download still available (for record keeping)
- Filter option: Show/hide revoked badges (optional)

---

#### **Story 9.4:** [Revocation Notifications](9-4-notifications.md) - **MEDIUM** - 2-3h
As an **Employee**,  
I want **to receive a notification when my badge is revoked**,  
So that **I'm aware of the change in my credential status**.

**Acceptance Criteria:**
- Email notification sent immediately on revocation
- Email includes revocation reason (if appropriate)
- Email template professional and empathetic
- Teams notification (if enabled)
- Notification logged in audit trail

---

#### **Story 9.5:** [Admin Revocation UI](9-5-admin-ui.md) - **HIGH** - 3-4h
As an **Admin**,  
I want **an intuitive UI to revoke badges with reason selection**,  
So that **I can quickly handle policy violations or errors**.

**Acceptance Criteria:**
- Revoke button/action in admin badge management
- Modal with reason dropdown (Policy Violation, Error, Expired, Other)
- Optional notes field
- Confirmation dialog with impact warning
- Success feedback after revocation
- Bulk revoke capability (nice-to-have)

---

### UAT Phase Stories (U.1-U.3)

#### **Story U.1:** [Complete Lifecycle UAT Execution](U-1-lifecycle-uat.md) - **CRITICAL** - 6-8h
As a **Product Owner**,  
I want **to execute complete badge lifecycle testing across all roles**,  
So that **I can verify the entire user experience works correctly**.

**Acceptance Criteria:**
- 4 test scenarios executed (Happy Path, Error Cases, Privacy, Integration)
- All 4 user roles tested (Admin, Issuer, Employee, External Verifier)
- Screen recordings captured for key workflows
- UAT Test Report document created
- Issue list prioritized (P0/P1/P2/P3)

---

#### **Story U.2a:** [M365 User Sync MVP](U-2-demo-seed.md) - **HIGH** - 6h ← **SPLIT from U.2**
As a **Developer**,  
I want **to sync users from Microsoft 365 organization for realistic UAT data**,  
So that **UAT testing uses actual organizational users instead of mock accounts**.

**Acceptance Criteria:**
- GraphUsersService calls Microsoft Graph `/users` API
- Role mapping via .env file (NOT YAML in Git)
- Production guard prevents accidental sync (NODE_ENV check)
- Hybrid mode: `npm run seed:demo` (local) OR `npm run seed:m365`
- Support <100 users
- Upsert pattern (safe to re-run)

**Status:** Deferred to Sprint 8 (UAT can use local seed data)

---

#### **Story U.2b:** M365 Sync Production Hardening - **Sprint 8** - 6h
- Pagination support for large organizations (1000+ users)
- Retry logic with exponential backoff
- Audit logging for compliance
- User deactivation sync

**Status:** Sprint 8 Backlog

---

#### **Story U.3:** [UAT Issue Resolution](U-3-bug-fixes.md) - **VARIABLE** - TBD
As a **Development Team**,  
I want **to fix all P0 and P1 issues found during UAT**,  
So that **the user experience meets quality standards**.

**Acceptance Criteria:**
- All P0 (blocker) issues fixed
- All P1 (high priority) issues fixed
- Regression testing completed
- UAT re-test confirms fixes
- P2/P3 issues documented in backlog

---

## ⏱️ Capacity Planning (原始版本)

### Sprint Timeline (7 days) - UPDATED AFTER TECHNICAL REVIEW

**Day 1 (Feb 3): Backend Foundation**
- Story 9.1: Badge Revocation API (7h - TDD approach)
- Axe-core accessibility setup (0.5h)
- **Total: 7.5h**

**Day 2 (Feb 4): Frontend Development**
- Design sync meeting (15min)
- Story 9.2: Verification Update (4h)
- Story 9.3: Wallet UI Update (4h)
- Story 0.2a: Login MVP START (2h of 6h)
- **Total: 10.25h**

**Day 3 (Feb 5): Auth & Data**
- Story 0.2a: Login MVP COMPLETE (4h remaining)
- Story U.2a: M365 Sync MVP (6h) - **DEFERRED**
- **Total: 4h** (M365 deferred)

**Day 4 (Feb 6): Integration**
- Story 9.5: Admin Revocation UI (4h)
- Story 9.4: Revocation Notifications (3h)
- Integration testing (1h)
- **Total: 8h**

**Day 5 (Feb 7): UAT Day 1**
- Story U.1: Complete UAT Phase 1 (8h)
- **Total: 8h**

**Day 6 (Feb 8): UAT Day 2 & Bug Fixes**
- Story U.1: Complete UAT Phase 2 (4h)
- Story U.3: Bug Fixes START (4h of 8h)
- **Total: 8h**

**Day 7 (Feb 9): Finalization & Buffer**
- Story U.3: Bug Fixes COMPLETE (4h remaining)
- Sprint Retrospective (1h)
- Documentation updates (1h)
- Production readiness checklist (1h)
- Buffer for overflow (1h)
- **Total: 8h**

### Total Estimated Effort

| Category | Stories | Estimated Hours | Notes |
|----------|---------|-----------------|-------|
| **Sprint Setup** | 0.1, 0.2a | 5 min + 6h | Login MVP |
| **Epic 9 Stories** | 9.1-9.5 | 22h | +3h from review |
| **M365 Sync MVP** | U.2a | ~~6h~~ | **DEFERRED** |
| **UAT Execution** | U.1 | 12h | 2-day UAT |
| **Bug Fixes** | U.3 | 8h | TBD based on UAT |
| **Risk Mitigation** | Axe-core, meetings | 1.25h | Accessibility |
| **Total** | 10 stories | **~48h** | After deferral |

---

## 📊 Risk Assessment (原始版本)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **UAT discovers major UX issues** | Medium | High | Buffer time allocated, prioritization framework ready |
| **Database migration complexity** | Low | Medium | Simple schema addition, no data migration needed |
| **Revoked badge display complexity** | Low | Medium | Can reuse existing badge card components |
| **Email template issues** | Low | Low | Reuse existing notification templates |
| **Performance with revoked badges** | Low | Medium | Database indexes on status field |

---

## ✅ Definition of Done (原始版本)

**Story-Level DoD:**
- [ ] Code implemented and passing linting
- [ ] Unit tests written and passing (>80% coverage)
- [ ] API endpoints documented in Swagger
- [ ] Frontend component responsive on desktop/tablet/mobile
- [ ] Code reviewed (self-review or peer)
- [ ] Manual testing completed
- [ ] Story file updated with completion notes

**Sprint-Level DoD:**
- [ ] All Epic 9 stories (9.1-9.5) complete
- [ ] Complete lifecycle UAT executed and documented
- [ ] All P0 and P1 issues fixed
- [ ] Regression testing passed
- [ ] Demo seed data script working
- [ ] Sprint retrospective completed
- [ ] Documentation updated
- [ ] Code merged to main branch
- [ ] Git tag created (v0.7.0)

---

**原文件创建:** January 31, 2026  
**最后更新:** February 1, 2026 (Post-Technical Review Meeting)  
**归档日期:** February 1, 2026  
**归档原因:** Backlog restructure for Phase-based execution  
**归档人:** Bob (Scrum Master)
