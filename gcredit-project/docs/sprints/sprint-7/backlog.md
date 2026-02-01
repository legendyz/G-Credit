# Sprint 7 Backlog - Badge生命周期完整化 + UAT验证

**Sprint:** Sprint 7  
**Duration:** February 1-7, 2026 (Extended after Pre-UAT Review)  
**Team:** Amelia (Dev Agent) + LegendZhu  
**Epic:** Epic 9 - Badge Revocation + Complete Lifecycle UAT  
**Last Updated:** February 1, 2026 (Backlog Restructure)

---

## 🎯 Sprint Goal

**Primary Goal:** 补齐Badge Revocation功能并完成完整生命周期的UAT验证

**Success Criteria:**
- ✅ Epic 9 (Badge Revocation) 100% complete
- ✅ P0 Security/Architecture/UX defects fixed
- ✅ Complete badge lifecycle UAT executed and documented
- ✅ All P0/P1 bugs discovered in UAT are fixed

---

## 🚦 Sprint 7 Remaining Tasks (执行顺序)

> **Dev Agent 请按此顺序执行！** 这是 Sprint 7 剩余工作的唯一任务来源。

### ✅ Phase 0: Completed (Epic 9 Development)

| Story | Description | Status | Hours |
|-------|-------------|--------|-------|
| 0.1 | Git Branch Creation | ✅ Done | 5min |
| 9.1 | Badge Revocation API | ✅ Done | 5h |
| 9.2 | Verification Page Update | ✅ Done | 4.5h |
| 9.3 | Employee Wallet Display | ✅ Done | 4.5h |
| 9.4 | Revocation Email Notifications | ✅ Done | 2.5h |
| 9.5 | Admin Revocation UI | ✅ Done | 5.5h |

**Total Completed:** 22h | **Epic 9:** 100% Complete ✅

---

### ✅ Phase A: Security & Architecture P0 Fixes (3.25h) - COMPLETED

> ~~**优先级最高！** 这些是安全漏洞，必须在任何 UX 工作之前修复。~~ **✅ 已完成 2026-02-01**

#### Task A.1: SEC-P0-002 - 移除注册接口角色自定义 (1h) ✅

**问题:** 注册接口允许用户自定义角色，任何人可以注册为 ADMIN

**文件:**
- `backend/src/modules/auth/dto/register.dto.ts`
- `backend/src/modules/auth/auth.service.ts`

**修复步骤:**
1. ✅ 从 `RegisterDto` 移除 `role` 字段
2. ✅ 在 `auth.service.ts` 中硬编码 `role: UserRole.EMPLOYEE`

**验收标准:**
- [x] RegisterDto 不再包含 role 字段
- [x] 新注册用户始终为 EMPLOYEE 角色
- [x] 相关测试通过

**Commit:** `d7c19f7`

---

#### Task A.2: SEC-P0-001 - IDOR 修复: Teams Badge Claiming (1h) ✅

**问题:** `claimBadge` 方法从 DTO 获取 userId，可以以他人身份 claim badge

**文件:**
- `backend/src/microsoft-graph/teams/teams-action.controller.ts`

**修复步骤:**
1. ✅ 添加 `@CurrentUser() user` 参数到 `claimBadge` 方法
2. ✅ 使用 `user.userId` 替代 `dto.userId`

**验收标准:**
- [x] claimBadge 使用 JWT 中的用户 ID
- [x] 无法以他人身份 claim badge
- [x] 相关测试通过 (7 tests updated)

**Commits:** `d7c19f7`, `5f2ad7a` (test fix)

---

#### Task A.3: SEC-P0-003 - JWT Secret 启动校验 (15m) ✅

**问题:** JWT Secret 有硬编码回退值 `'default-secret'`，如果环境变量未设置会使用不安全的密钥

**文件:**
- `backend/src/modules/auth/strategies/jwt.strategy.ts`

**修复步骤:**
1. ✅ 移除 `|| 'default-secret'` 回退逻辑
2. ✅ 如果 `JWT_SECRET` 未设置或<32字符，抛出启动错误

**验收标准:**
- [x] 无 JWT_SECRET 时服务启动失败并显示明确错误
- [x] 有 JWT_SECRET 时服务正常启动

**Commit:** `d7c19f7`

---

#### Task A.4: ARCH-P0-002 - Badge Template findOne 状态检查 (1h) ✅

**问题:** `findOne()` 方法不检查模板状态，任何用户可以通过 ID 访问 DRAFT 模板

**文件:**
- `backend/src/badge-templates/badge-templates.service.ts`
- `backend/src/badge-templates/badge-templates.controller.ts`

**修复步骤:**
1. ✅ 修改 `findOne()` 添加用户角色参数
2. ✅ 非 ADMIN/ISSUER 用户只能访问 ACTIVE 状态模板
3. ✅ 更新 controller 传递用户角色

**验收标准:**
- [x] EMPLOYEE 无法访问 DRAFT 模板
- [x] ADMIN/ISSUER 可以访问所有状态模板
- [x] 返回通用404避免信息泄露

**Commit:** `d7c19f7`

---

#### Phase A 完成状态 ✅

```
完成时间: 2026-02-01
提交记录: d7c19f7 (fixes), 5f2ad7a (test update)
测试状态: 250/266 passed (4 pre-existing DI failures unrelated to P0)
构建状态: ✅ npm run build PASS
```

**Phase A 已完成，可继续 Phase B**

---

#### Pre-existing Test Failures (Non-blocking)

以下4个测试文件存在DI配置问题，与P0修复无关：
- `graph-teams.service.spec.ts` - Mock setup issue
- `teams-badge-notification.service.spec.ts` - Array index error  
- `teams-sharing.controller.spec.ts` - Error handling mock
- `badge-issuance-teams.integration.spec.ts` - Missing providers

**建议:** 在 Story U.3 Bug Fix 阶段修复

---

### 🟠 Phase B: UX P0 Fixes + Login (12h)

> **在 Phase A 完成后执行。** 包含登录页面和 UX 缺陷修复。

#### Story 0.2a: Simple Login & Navigation System (4h)

**User Story:** As a User (any role), I want to log in to the system and navigate between features, So that I can access role-appropriate functionality and complete UAT testing.

**文件:**
- `frontend/src/pages/LoginPage.tsx` (新建)
- `frontend/src/App.tsx` (更新路由)
- `frontend/src/stores/authStore.ts` (新建, Zustand)

**验收标准:**
- [ ] 登录页面 (email + password)
- [ ] Auth state management (Zustand)
- [ ] 登录成功后跳转到 dashboard
- [ ] 受保护路由检查
- [ ] 基本 ARIA labels
- [ ] 登出功能

**Link:** [0-2-login-navigation.md](0-2-login-navigation.md)

---

#### Task B.2: UX-P0-002 - 替换 alert() 为 toast (2h)

**问题:** 使用浏览器 `alert()` 显示错误，用户体验差

**文件:**
- `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx`
- `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx`

**修复步骤:**
1. 导入 `toast` from 'sonner'
2. 将所有 `alert()` 替换为 `toast.error()`

**验收标准:**
- [ ] 所有 alert() 已替换
- [ ] 错误通过 toast 显示
- [ ] Toast 样式一致

---

#### Task B.3: UX-P0-003 - 添加表单 labels (2h)

**问题:** 表单输入缺少 labels，违反 A11y 标准

**文件:**
- `frontend/src/components/TimelineView/TimelineView.tsx`
- `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`

**修复步骤:**
1. 为每个 `<select>` / `<input>` 添加 `<label>`
2. 使用 `htmlFor` 关联 label 和 input
3. 如需隐藏可使用 `sr-only` class

**验收标准:**
- [ ] 所有表单控件有 label
- [ ] Screen reader 可识别表单用途
- [ ] 无 A11y 警告

---

#### Task B.4: UX-P0-004 - Badge Claiming 庆祝反馈 (4h)

**问题:** Badge claiming 成功后没有视觉反馈

**文件:**
- `frontend/src/components/ClaimSuccessModal.tsx` (新建)
- 或修改现有 claim 流程组件

**实现:**
```tsx
<Dialog open={claimSuccess}>
  <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
  <h2>Congratulations!</h2>
  <p>You've earned the {badge.name} badge!</p>
  <Button>View in Wallet</Button>
</Dialog>
```

**验收标准:**
- [ ] Claim 成功显示庆祝 modal
- [ ] 绿色 checkmark 图标
- [ ] "View in Wallet" 按钮
- [ ] 动画效果

---

#### Phase B 完成检查

```powershell
# 运行前端测试
cd gcredit-project/frontend
npm test

# 验证编译通过
npm run build
```

**Phase B 完成后:** 通知 SM，继续 Phase C

---

### 🟢 Phase C: UAT Execution (8h)

> **在 Phase A + B 完成后执行。**

#### Story U.1: Complete Lifecycle UAT Execution (8h)

**User Story:** As a Product Owner, I want to execute complete badge lifecycle testing across all roles, So that I can verify the entire user experience works correctly.

**测试场景:**
1. **Happy Path:** Login → Create Template → Issue Badge → Claim → Verify → Revoke
2. **Error Cases:** Invalid login, unauthorized actions, validation errors
3. **Privacy:** Public/private badge settings
4. **Integration:** Email notifications, Teams actions

**验收标准:**
- [ ] 4 test scenarios executed
- [ ] All 4 user roles tested
- [ ] Screen recordings captured
- [ ] UAT Test Report created
- [ ] Issue list prioritized (P0/P1/P2/P3)

**Link:** [U-1-lifecycle-uat.md](U-1-lifecycle-uat.md)

---

### ⏸️ Phase D: Bug Fixes (TBD)

#### Story U.3: UAT Issue Resolution (Variable)

**触发条件:** 在 UAT (Phase C) 中发现 P0/P1 bugs

**验收标准:**
- [ ] All P0 issues fixed
- [ ] All P1 issues fixed
- [ ] Regression testing completed

**Link:** [U-3-bug-fixes.md](U-3-bug-fixes.md)

---

## 📊 Sprint 7 Execution Summary

| Phase | Tasks | Effort | Status | Dependency |
|-------|-------|--------|--------|------------|
| **Phase 0** | Stories 0.1, 9.1-9.5 | 22h | ✅ Done | - |
| **Phase A** | Security P0 (4 tasks) | 3.25h | ⏳ Ready | - |
| **Phase B** | UX P0 + Login (4 tasks) | 12h | ⏳ Blocked | Phase A |
| **Phase C** | UAT (Story U.1) | 8h | ⏳ Blocked | Phase B |
| **Phase D** | Bug Fixes (Story U.3) | TBD | ⏳ Blocked | Phase C |
| **Total** | | **45-50h** | | |

---

## 📋 Deferred to Sprint 8

| Item | Type | Effort | Reason |
|------|------|--------|--------|
| Story 0.2b | Auth Enhancements | 3h | Token refresh, WCAG compliance |
| Story 0.3 | CSP Security Headers | 1h | Not UAT blocker |
| Story U.2a | M365 User Sync | 6h | UAT can use local seed data |
| Story U.2b | M365 Sync Hardening | 6h | Requires U.2a |
| P1 Tech Debt | 17 items | ~39.5h | Post-UAT priority |

**详细 Sprint 8 计划见:** [technical-debt-from-reviews.md](technical-debt-from-reviews.md)

---

## 📚 Reference Documents

### Sprint 7 Documents
- [p0-fix-execution-plan.md](p0-fix-execution-plan.md) - 技术实现参考
- [technical-debt-from-reviews.md](technical-debt-from-reviews.md) - 完整技术债务清单
- [sprint-status.yaml](sprint-status.yaml) - Sprint 状态追踪

### Review Documents
- [Security Audit](../../security/security-audit-sprint-0-7.md)
- [Architecture Review](../sprint-1/architecture-review-retrospective.md)
- [UX Audit](../ux-audit-sprint-1-4.md)

### Story Files
- [0-2-login-navigation.md](0-2-login-navigation.md) - Login Story 详情
- [U-1-lifecycle-uat.md](U-1-lifecycle-uat.md) - UAT Story 详情
- [U-3-bug-fixes.md](U-3-bug-fixes.md) - Bug Fix Story 详情

---

## 📅 Sprint Timeline

```
Feb 1 (Today)  ─→  Phase A: Security P0 (3.25h)
                   │
Feb 2          ─→  Phase B: UX P0 + Login (12h)
                   │
Feb 3-5        ─→  Phase C: UAT Execution (8h)
                   │
Feb 6-7        ─→  Phase D: Bug Fixes + Sprint Completion
```

---

**Backlog Created:** January 31, 2026  
**Last Restructured:** February 1, 2026 (清晰执行顺序)  
**Owner:** Bob (Scrum Master)
