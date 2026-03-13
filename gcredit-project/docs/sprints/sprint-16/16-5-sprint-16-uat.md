# Story 16.5: Sprint 16 UAT

Status: done

## Story
As a **Scrum Master**,
I want **comprehensive user acceptance testing of Issuer ownership isolation**,
So that **we confirm the RBAC changes work correctly before entering Phase 4 Pilot**.

## Acceptance Criteria
1. [x] All ownership guard scenarios tested (Issuer own/other, Admin any) ✅ S3-S6, R1-R6
2. [x] Template visibility correctly scoped per role ✅ S2, S7, R1-R4
3. [x] Badge issuance restricted to owned templates ✅ S3, S4, R6
4. [x] Template editing restricted to owned templates ✅ S5, S6
5. [x] Pilot seed data + smoke test PASS ✅ P1, P2
6. [x] No regressions from Sprint 15 (sidebar, dashboard, pagination) ✅ R7-R12
7. [x] All automated tests pass (target: ~1,860+ tests) ✅ 1,849 tests

---

## UAT Test Plan

> **测试分类说明**
> - 🤖 **自动化** — 已有 E2E/单元测试覆盖，通过 `npx jest` / `npx vitest` 验证
> - 📜 **脚本化** — 通过 API 脚本（PowerShell / curl）验证，无需 UI
> - 👁️ **手动** — 需要人工在浏览器中操作和观察
>
> **前提条件**
> 1. 后端运行：`cd backend && npm run start:dev`
> 2. 前端运行：`cd frontend && npm run dev`
> 3. 数据库已 seed：`cd backend && npx prisma db seed`（seed-uat 数据）
> 4. 前端地址：`http://localhost:5173`
> 5. 后端地址：`http://localhost:3000`
>
> **测试账号（密码统一：`Password123`）**
>
> | 角色 | 邮箱 | 备注 |
> |------|------|------|
> | ADMIN | admin@gcredit.com | 可见所有模板/徽章 |
> | ISSUER | issuer@gcredit.com | seed-uat 中唯一 Issuer，拥有 11 个模板 |
> | EMPLOYEE | employee@gcredit.com | 24 个 CLAIMED 徽章 |
> | EMPLOYEE | employee2@gcredit.com | 少量徽章 |

---

### Phase 1: 自动化测试验证 🤖（4 项）

已有测试套件直接运行验证。

| # | 检查项 | 命令 | 预期 | 结果 |
|---|--------|------|------|------|
| A1 | Backend 单元测试全通过 | `cd backend && npx jest --no-coverage` | ~1,000+ tests, 0 failures | ✅ 54 suites, 1000 tests, 0 failures |
| A2 | Frontend 测试全通过 | `cd frontend && npx vitest run` | ~850+ tests, 0 failures | ✅ 80 suites, 849 tests, 0 failures |
| A3 | Backend lint 无错误 | `cd backend && npx eslint src/` | 0 errors | ✅ 0 errors |
| A4 | Frontend lint 无错误 | `cd frontend && npx eslint src/` | 0 errors | ✅ 0 errors |

**Sprint 16 新增自动化测试覆盖的场景**（已包含在 A1/A2 中，无需重复测试）：

| Story | 测试文件 | 测试数 | 覆盖场景 |
|-------|---------|--------|----------|
| 16.1 | `badge-issuance.service.spec.ts` | 3 | Issuer own ✅, other 403, Admin bypass ✅ |
| 16.1 | `badge-issuance.e2e-spec.ts` | 4 | E2E: own 201, other 403, Admin A 201, Admin B 201 |
| 16.1 | `bulk-issuance.service.spec.ts` | (updated) | callerRole 签名更新 |
| 16.2 | `badge-templates.service.spec.ts` | 5 | creatorId filter: apply/skip/result/empty/search |
| 16.2 | `badge-templates.e2e-spec.ts` | 5 | Issuer-A/B 隔离, Admin 全量, empty, /all |
| 16.2 | `IssueBadgePage.test.tsx` | 1 | 空模板列表 empty state |
| 16.2 | `TemplateSelector.test.tsx` | 4 | 空状态/loading guard/非空/渲染 |
| 16.3 | `badge-templates-ownership.e2e-spec.ts` | 12 | PATCH update/status + DELETE: owner/other/admin |

**合计**：Sprint 16 新增 **34 个自动化测试**

---

### Phase 2: 脚本化 API 测试 📜（8 项）

通过 PowerShell 脚本调用 API 验证 F-1 RBAC 行为。需要 2 个 Issuer 用户的数据（seed-uat 只有 1 个 Issuer，需 pilot seed 或手动创建第二个 Issuer）。

> **⚠️ 注意**：seed-uat 只有 1 个 ISSUER (`issuer@gcredit.com`)，无法测试跨 Issuer 隔离。
> 选项：
> - A）先执行 Story 16.4 的 pilot seed（3 个 Issuer）
> - B）通过 API 脚本临时创建第 2 个 Issuer + 模板

| # | 场景 | 方法 | 端点 | 角色 | 预期 | 结果 |
|---|------|------|------|------|------|------|
| S1 | Issuer-A 登录 | POST | `/api/auth/login` | ISSUER | 200 + cookie | ✅ 200 |
| S2 | Issuer-A 查看模板列表 | GET | `/api/badge-templates` | ISSUER-A | 仅返回自己创建的模板 | ✅ 2 templates, allOwned=True |
| S3 | Issuer-A 用自己模板颁发徽章 | POST | `/api/badges` | ISSUER-A | 201 Created | ✅ 201 |
| S4 | Issuer-A 用 Issuer-B 模板颁发 | POST | `/api/badges` | ISSUER-A | 403 Forbidden | ✅ 403 |
| S5 | Issuer-A 编辑自己模板 | PATCH | `/api/badge-templates/:id` | ISSUER-A | 200 OK | ✅ 200 |
| S6 | Issuer-A 编辑 Issuer-B 模板 | PATCH | `/api/badge-templates/:id` | ISSUER-A | 403 Forbidden | ✅ 403 |
| S7 | Admin 查看模板列表 | GET | `/api/badge-templates` | ADMIN | 所有模板均可见 | ✅ 10 templates, 5/5 pilot found |
| S8 | Admin 用任意模板颁发 | POST | `/api/badges` | ADMIN | 201 Created | ✅ 201 |

---

### Phase 3: 手动 UI 测试 👁️（12 项）

需要人工在浏览器中操作验证 UI 行为。

> **Pilot Seed 测试账号（密码统一：`Password123`）**
>
> | 角色 | 邮箱 | 拥有模板 |
> |------|------|----------|
> | ADMIN | `pilot-admin@gcredit.com` | 可见/操作所有模板 |
> | ISSUER-A | `issuer-a@pilot.gcredit.com` | Cloud Architecture Fundamentals, Agile Scrum Master |
> | ISSUER-B | `issuer-b@pilot.gcredit.com` | Data Privacy Compliance, Leadership Essentials |
> | ISSUER-C | `issuer-c@pilot.gcredit.com` | Python for Data Science |
> | EMPLOYEE | `emp01@pilot.gcredit.com` ~ `emp10@pilot.gcredit.com` | — |
>
> **原有 seed-uat 账号（也可用）：**
>
> | 角色 | 邮箱 | 备注 |
> |------|------|------|
> | ADMIN | `admin@gcredit.com` | 可见所有模板/徽章 |
> | ISSUER | `issuer@gcredit.com` | seed-uat 中唯一 Issuer，拥有 11 个模板 |
> | EMPLOYEE | `employee@gcredit.com` | 24 个 CLAIMED 徽章 |
> | EMPLOYEE | `employee2@gcredit.com` | 少量徽章 |

#### F-1 RBAC UI 验证（6 项）

**R1 — Issuer 模板列表只显示自己的模板**
1. 使用 Issuer-A 账号登录 `http://localhost:5173/login`
2. 访问 `http://localhost:5173/admin/templates`
3. ✅ 预期：模板列表仅显示 Issuer-A 创建的模板
4. 模板卡片数量与 API 返回一致

**R2 — Issuer Issue Badge 页面模板下拉只显示自己的**
1. 以 Issuer-A 身份访问 `http://localhost:5173/admin/badges/issue`
2. 点击 Template 下拉选择器
3. ✅ 预期：下拉列表仅包含 Issuer-A 自己的模板

**R3 — Issuer-C 模板下拉仅显示自己的 1 个模板**
1. 以 Issuer-C (`issuer-c@pilot.gcredit.com`) 登录
2. 访问 Issue Badge 页面 (`/admin/badges/issue`)
3. 点击 Template 下拉选择器
4. ✅ 预期：下拉列表仅包含 "Python for Data Science"（1 个模板），不包含其他 Issuer 的模板

**R4 — Admin 模板列表显示全部**
1. 使用 `admin@gcredit.com` 登录
2. 访问 `http://localhost:5173/admin/templates`
3. ✅ 预期：显示所有 Issuer 创建的模板

**R5 — Issuer Bulk Issuance 模板选择只显示自己的**
1. 以 Issuer-A 身份访问 Bulk Issuance 页面
2. 在模板自动补全搜索框中输入关键词
3. ✅ 预期：搜索结果仅包含 Issuer-A 自己的模板

**R6 — 模板所有权与颁发关联验证**
1. Issuer-A 从下拉选择自己的模板颁发徽章
2. ✅ 预期：徽章颁发成功
3. 在 Employee Wallet 中查看新徽章，确认模板信息正确

#### Regression 回归验证（6 项）

**R7 — 侧边栏导航正常**
1. 各角色登录，点击侧边栏每个链接
2. ✅ 预期：所有页面正常加载

**R8 — Dashboard 复合视图正常**
1. ADMIN 登录，查看 Dashboard
2. ✅ 预期：4 个标签页正常切换，数据加载

**R9 — 模板分页正常**
1. 访问模板列表，翻页、切换页数
2. ✅ 预期：分页控件工作正常

**R10 — Wallet 无限滚动正常**
1. 使用 `employee@gcredit.com` 登录，访问 Wallet
2. 滚动到底部
3. ✅ 预期：自动加载下一批徽章

**R11 — 徽章验证公开页面**
1. 复制一个徽章的验证链接（或访问 `/verify/:hash`）
2. 在无登录状态的浏览器窗口打开
3. ✅ 预期：页面正常显示徽章详情（验证状态、颁发者、接收者、日期、criteria）

**R12 — 登录/登出流程**
1. 登录 → 操作 → 点击 Sign Out
2. ✅ 预期：Cookie 清除，跳转到登录页

---

### Phase 4: Pilot 就绪验证 📜🤖（2 项）

| # | 场景 | 类型 | 预期 | 结果 |
|---|------|------|------|------|
| P1 | Pilot seed 脚本运行 | 📜 脚本 | `npx ts-node prisma/seed-pilot.ts` 无错误完成 | ✅ 14 users, 5 templates, 16 badges seeded |
| P2 | Smoke test 全通过 | 📜 脚本 | `pilot-smoke-test.ps1` 8/8 PASS | ✅ 8/8 PASS |

---

### 测试阶段总结

| Phase | 类型 | 测试数 | 执行方式 |
|-------|------|--------|----------|
| Phase 1 | 🤖 自动化 | 4 | `jest` + `vitest` + `eslint` |
| Phase 2 | 📜 脚本化 API | 8 | PowerShell 脚本 |
| Phase 3 | 👁️ 手动 UI | 12 | 浏览器人工操作 |
| Phase 4 | 📜 Pilot 就绪 | 2 | seed + smoke 脚本 |
| **合计** | | **26** | |

---

## Tasks / Subtasks
- [x] Task 1: Phase 1 — 运行自动化测试 (A1-A4) ✅ 1849 tests, 0 failures
- [x] Task 2: Phase 2 — 执行脚本化 API 测试 (S1-S8) ✅ 8/8 PASS
- [x] Task 3: Phase 3 — 执行手动 UI 测试 (R1-R12) ✅ 12/12 PASS (2026-03-13)
- [x] Task 4: Phase 4 — Pilot 就绪验证 (P1-P2) ✅ seed + smoke 8/8 PASS
- [x] Task 5: 修复发现的问题 — 修复 2 个 timezone 测试 bug (cf95563) + 3 个 smoke-test.ps1 脚本 bug
- [x] Task 6: 记录测试结果

## Dev Notes
### References
- Sprint 15 UAT: 36/36 PASS (baseline)
- Sprint 15 Retrospective Action Items applied
- Sprint 16 新增 34 个自动化测试

### 执行顺序建议
1. 先跑 Phase 1（自动化）— 快速发现回归问题
2. 再跑 Phase 2（脚本化 API）— 验证核心 RBAC 逻辑
3. 然后 Phase 3（手动 UI）— 验证用户体验
4. 最后 Phase 4（Pilot 就绪）— 依赖 Story 16.4 完成

### 关于 seed-uat 数据的限制
seed-uat 只有 1 个 ISSUER，无法测试跨 Issuer 隔离场景（S2-S6, R1-R3）。
解决方案：
- **推荐**：先完成 Story 16.4（创建 pilot seed，包含 3 个 Issuer）
- **替代**：通过 API 或 Prisma Studio 手动创建第 2 个 Issuer + 模板

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Completion Notes
- **2026-03-05**: Phase 1 (A1-A4), Phase 2 (S1-S8), Phase 4 (P1-P2) 全部通过
- A1 发现 2 个 timezone 测试 bug，已修复 (`cf95563`)
- pilot-smoke-test.ps1 发现 3 个 PS 脚本 bug（`//` 运算符、`$pid` 保留变量、verify 响应结构），已修复
- Phase 3 (R1-R12) ✅ 12/12 PASS (2026-03-13 用户手动执行)
- UAT 期间发现并修复: useFormGuard 导航 bug、Issue Badge 模板清除按钮、Sync Roles 按钮样式、R11 QR码预期修正

### File List
- `backend/src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts` — timezone fix
- `backend/src/badge-sharing/services/email-template.service.spec.ts` — timezone fix
- `gcredit-project/scripts/pilot-smoke-test.ps1` — 3 bug fixes
- `gcredit-project/docs/sprints/sprint-16/16-5-sprint-16-uat.md` — results recorded

## Retrospective Notes
- 测试日期数据使用 `T12:00:00Z`（UTC 正午）可避免所有时区问题
- PowerShell 中避免使用 `$pid`（进程 ID 保留变量）
