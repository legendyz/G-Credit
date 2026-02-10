# G-Credit v1.0.0 — Re-UAT Test Plan (Round 2)

**Version:** 2.0  
**Created:** 2026-02-10  
**Sprint:** 10  
**Story:** 10.8 → Re-UAT after bug fixes  
**Tester(s):** LegendZhu (Product Owner)  
**Date(s):** _______________  
**Bug Fix Commit Range:** `65bee78` — `74bd9f3` (10 commits)

---

## 1. Re-UAT 目的

Story 10.8 修复了 Round 1 发现的 **7 个 bugs** + **3 个 UX 改进** + **2 个测试计划 URL 修正**。

本次 Re-UAT 目标：
1. 验证所有 7 个 bug 修复（BUG-002 ~ BUG-008）
2. 验证 3 个 UX 改进（UX-001 ~ UX-003）
3. 回归测试原本 PASS 的功能未被破坏
4. 确认达到 v1.0.0 发布标准

---

## 2. 环境准备

### 前置条件

```bash
# 1. 确保在 sprint-10/v1-release 分支，拉取最新代码
cd gcredit-project
git checkout sprint-10/v1-release
git pull

# 2. 安装依赖（如有更新）
cd backend && npm install
cd ../frontend && npm install

# 3. 数据库重置 + UAT Seed
cd ../backend
npm run seed:reset    # 重新 seed，确保干净数据

# 4. 启动后端
npm run start:dev
# 验证: http://localhost:3000/health → { "status": "ok" }  ⚠️ 注意：不是 /api/health

# 5. 启动前端
cd ../frontend
npm run dev
# 验证: http://localhost:5173 → Login 页面

# 6. (可选) 延长 Token 有效期
# 编辑 backend/.env: JWT_ACCESS_EXPIRES_IN="4h"
# 重启后端
```

### 测试账号（不变）

| 角色 | Email | 密码 | 可访问功能 |
|------|-------|------|-----------|
| Admin | admin@gcredit.com | password123 | 全功能 |
| Issuer | issuer@gcredit.com | password123 | Templates + 颁发 |
| Manager | manager@gcredit.com | password123 | Wallet + 撤销(同部门) |
| Employee | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | Wallet only |

---

## 3. 执行策略

### 执行顺序建议

按**依赖链**分 4 轮执行，每轮有 快速失败 gate：

| 轮次 | 范围 | 用例数 | 关联 Bug | Gate 条件 |
|------|------|--------|----------|----------|
| **Round A** | 基础设施 + 认证 + 导航 | 7 | BUG-002, BUG-007, TP-FIX | UAT-001~007 全部 PASS |
| **Round B** | Template CRUD + 颁发 | 8 | BUG-003, BUG-004, BUG-005 | UAT-008~015 全部 PASS |
| **Round C** | Wallet + 验证 + 分享 + 批量 + 撤销 | 15 | BUG-006, BUG-008, UX-001~003 | 无 FAIL |
| **Round D** | 全生命周期 + 移动端 | 5 | 综合回归 | UAT-034 PASS |

> ⚠️ 如果 Round A 出现 FAIL，立即停止并报告。Round A 的导航和认证是所有后续测试的基础。

---

## 4. 详细测试用例

### 状态说明

- 🔁 **RETEST** — Round 1 失败，本次必须验证
- 🔄 **UPGRADE** — Round 1 PARTIAL，本次应升级为 PASS
- ✅ **REGRESSION** — Round 1 已 PASS，回归确认
- ⏭️ **OPTIONAL** — 可选测试

---

### Round A: 基础设施 + 认证 + 导航 (7 cases)

| # | ID | 场景 | 类型 | 关联修复 | 关键验证点 | 预期 | Pass/Fail |
|---|-----|------|------|---------|-----------|------|-----------|
| 1 | UAT-001 | Health check | 🔁 | TP-FIX-1 | 访问 `http://localhost:3000/health`（⚠️ 不是 `/api/health`） | `{"status":"ok"}` HTTP 200 | |
| 2 | UAT-002 | API 文档 | 🔁 | TP-FIX-2 | 访问 `http://localhost:3000/api-docs`（⚠️ 不是 `/api/docs`） | Swagger UI 加载 | |
| 3 | UAT-003 | Admin 登录 Dashboard | 🔄 | BUG-002 | ①登录后看到 Dashboard ②导航栏高亮"Dashboard"而非"My Wallet" ③导航有"Dashboard"和"My Wallet"两个独立链接 | Dashboard 正确显示，导航高亮正确 | |
| 4 | UAT-004 | Employee 登录 | 🔄 | BUG-002 | ①登录后看到 Dashboard ②导航只显示 Dashboard + My Wallet ③无 admin 链接 | 限制视图正确 | |
| 5 | UAT-005 | 登出 | ✅ | — | 登出后 Token 清除，无法访问受保护页面 | 重定向到 /login | |
| 6 | UAT-006 | 修改密码 | 🔁 | BUG-007 | ①点击导航"Profile"进入 `/profile` ②看到两张 Card（Profile Info + Change Password）③修改密码 ④重新登录 ⑤测试后改回 password123 | 密码修改成功 | |
| 7 | UAT-007 | RBAC 阻止 Employee | 🔄 | — | Employee 访问 `/admin/badges/issue` 被重定向 | 访问被拒绝 | |

**🚦 Gate Check:** Round A 所有用例必须 PASS，否则停止后续测试并报告。

---

### Round B: Badge Template CRUD + 颁发 (8 cases)

| # | ID | 场景 | 类型 | 关联修复 | 关键验证点 | 预期 | Pass/Fail |
|---|-----|------|------|---------|-----------|------|-----------|
| 8 | UAT-008 | Admin 创建 DRAFT 模板 | 🔁 | BUG-003 | ①导航到"Badge Templates"页面 ②点击"Create Template" ③填写 name/description/category ④保存为 DRAFT | 模板创建成功，列表可见 | |
| 9 | UAT-009 | Admin 激活模板 | 🔁 | BUG-003 | ①在列表点模板的 status 操作（如 Activate 按钮） ②状态变 ACTIVE | 模板可用于颁发 | |
| 10 | UAT-010 | Admin 归档模板 | 🔁 | BUG-003 | ①将 ACTIVE 模板 Archive ②状态变 ARCHIVED | 模板不再可用于颁发 | |
| 11 | UAT-011 | 模板搜索 | 🔁 | BUG-003+005 | ①在 Templates 页面搜索框输入文字 ②按 category tab 过滤 ③文字可正常输入（不再有 BUG-005 输入无效问题） | 搜索过滤正常 | |
| 12 | UAT-012 | Issuer 颁发单个 Badge | 🔁 | BUG-004 | ①Issuer 登录 ②导航到 Issue Badge ③模板下拉有数据 ④**Recipient 下拉正常加载用户列表**（关键验证点）⑤选择后颁发 | 颁发成功 toast | |
| 13 | UAT-013 | 颁发后 Badge 状态 PENDING | 🔁 | BUG-004 | 在 Badge Management 查看刚颁发的 badge | 状态 = PENDING | |
| 14 | UAT-014 | Employee 认领 Badge | 🔁 | BUG-004 | ①Employee 登录 ②进 Wallet ③找到 PENDING badge ④Claim | 状态变 CLAIMED | |
| 15 | UAT-015 | OB 2.0 Assertion 格式 | 🔁 | BUG-004 | `GET /api/verification/{verificationId}/assertion` | JSON-LD 有 `@context`, `type: "Assertion"` | |

**🚦 Gate Check:** UAT-008 + UAT-012 是后续 Epic 5-9 测试的前置条件。如果失败则标记后续相关 case 为 BLOCKED。

---

### Round C: Wallet + 验证 + 分享 + 批量 + 撤销 (15 cases)

| # | ID | 场景 | 类型 | 关联修复 | 关键验证点 | 预期 | Pass/Fail |
|---|-----|------|------|---------|-----------|------|-----------|
| 16 | UAT-016 | Employee Wallet 时间线 | 🔁 | BUG-002 | ①点击"My Wallet"导航 ②跳转到 `/wallet`（不再停留在 Dashboard）③时间线展示 | Wallet 页面正常打开 | |
| 17 | UAT-017 | Badge 详情 Modal | 🔁 | BUG-002 | 在 Wallet 点击 badge 卡片查看详情 | 详情显示完整信息 | |
| 18 | UAT-018 | Evidence 文件查看 | 🔁 | BUG-002 | 在 badge 详情点击 evidence 链接 | 链接可打开 | |
| 19 | UAT-019 | 公开验证页面 | 🔁 | BUG-002 | ①无痕浏览器 ②`/verify/{verificationId}` ③不需登录 | Badge 验证信息显示 | |
| 20 | UAT-020 | Baked Badge PNG 下载 | 🔁 | BUG-002 | 验证页面下载 badge PNG | PNG 文件含 OB 元数据 | |
| 21 | UAT-021 | JSON-LD Assertion API | 🔁 | BUG-002 | `GET /api/verification/{verificationId}/assertion` | 有效 JSON-LD | |
| 22 | UAT-022 | Email 分享 Badge | 🔁 | BUG-002 | ①Employee 在 badge 详情点 Share ②邮件发送 | 邮件发送成功 | |
| 23 | UAT-023 | 分享 Analytics 记录 | 🔁 | BUG-002 | Admin Analytics 中查看分享记录 | share event 有记录 | |
| 24 | UAT-024 | 嵌入式 Widget HTML | ⏭️ | — | `GET /api/badges/{id}/embed` | 可选 — 可能需要 live server | |
| 25 | UAT-025 | 下载 CSV 模板 | 🔄 | UX-001 | ①下载 CSV ②**验证 CSV 内是否已预填选中的 templateId** ③是否有 copy-to-clipboard 按钮 | CSV 下载正确 + UX 改进 | |
| 26 | UAT-026 | 上传 CSV + 确认 | 🔁 | BUG-008 | ①上传有效 CSV ②**首次上传即成功**（不再超时）③预览 → 确认 | 全流程成功，无 P2028 错误 | |
| 27 | UAT-027 | 上传无效 CSV 报错 | 🔄 | UX-002 | ①上传含错误行的 CSV ②**有效行可以单独确认发送**（显示 X of Y）③错误行有清晰提示 | 错误报告正确 + 部分确认 | |
| 28 | UAT-028 | Manager 撤销 Badge | 🔁 | BUG-006 | ①Manager 登录 ②导航栏有"Badge Management" ③进入 Badge Management ④找到**同部门** CLAIMED badge ⑤撤销 | 撤销成功（仅同部门） | |
| 29 | UAT-029 | 撤销后验证页面 | 🔁 | BUG-006 | `/verify/{verificationId}` 显示 REVOKED 状态 | 撤销日期 + 原因可见 | |
| 30 | UAT-030 | 撤销后 Wallet 显示 | 🔁 | BUG-006 | Employee Wallet 中 revoked badge 灰色显示 | 分享禁用 | |

---

### Round D: 全生命周期 + 移动端 + Dashboard (5 cases)

| # | ID | 场景 | 类型 | 关联修复 | 关键验证点 | 预期 | Pass/Fail |
|---|-----|------|------|---------|-----------|------|-----------|
| 31 | UAT-031 | Admin Dashboard 统计 | 🔄 | UX-003 | ①Dashboard 卡片都正确显示数据 ②**所有 summary 卡片都可点击跳转**（不再只有部分可点） | 全部卡片可点击 | |
| 32 | UAT-032 | Badge 搜索 | 🔁 | BUG-005 | ①Badge Management 搜索框 ②**输入文字正常接受**（不再有 BUG-005 输入丢失问题）③过滤生效 | 搜索功能正常 | |
| 33 | UAT-033 | Admin 用户管理 | ✅ | — | 用户列表 + 角色变更 | 回归确认 | |
| 34 | UAT-034 | 完整生命周期 | 🔁 | 综合 | **关键回归测试：** ①Admin 创建 ACTIVE 模板 ②Issuer 颁发 ③Employee 认领 ④分享 ⑤Manager 撤销 ⑥验证页面显示 REVOKED | 全链路 PASS | |
| 35 | UAT-035 | 移动端全流程 | ⏭️ | — | Chrome DevTools 375×812 手机视图 | 可选 | |

---

## 5. Re-UAT 通过标准

| 指标 | 标准 |
|------|------|
| PASS 数量 | ≥ 30 / 33 (排除 OPTIONAL) |
| FAIL 数量 | **= 0** |
| PARTIAL | 允许 ≤ 3（仅限 UX 细节，非功能缺陷） |
| SKIP | 仅 UAT-024 (embed) 和 UAT-035 (mobile) 可 SKIP |
| P0 Bug 未修复 | **不允许 — 自动判定 NOT PASSED** |
| P1 Bug 未修复 | **不允许 — 自动判定 NOT PASSED** |
| 新发现 Bug | P0/P1 → NOT PASSED; P2 以下 → 记录到 Post-MVP |

---

## 6. 与 Round 1 对比预期

| 指标 | Round 1 | Round 2 预期 |
|------|---------|-------------|
| PASS | 2 (5.7%) | ≥ 30 (85.7%) |
| PARTIAL | 7 (20.0%) | ≤ 3 (8.6%) |
| FAIL | 25 (71.4%) | 0 (0%) |
| SKIP | 1 (2.9%) | 2 (5.7%) |
| Unique Bugs | 7 | 0 (target) |

---

## 7. 结果报告格式

完成测试后，请按以下格式提供结果：

```
## Re-UAT Round 2 Results

### Round A: 基础设施 + 认证
UAT-001: PASS/FAIL — [备注]
UAT-002: PASS/FAIL — [备注]
UAT-003: PASS/FAIL — [备注]
UAT-004: PASS/FAIL — [备注]
UAT-005: PASS/FAIL — [备注]
UAT-006: PASS/FAIL — [备注]
UAT-007: PASS/FAIL — [备注]
🚦 Gate A: PASS/FAIL

### Round B: Template CRUD + 颁发
UAT-008: PASS/FAIL — [备注]
UAT-009: PASS/FAIL — [备注]
UAT-010: PASS/FAIL — [备注]
UAT-011: PASS/FAIL — [备注]
UAT-012: PASS/FAIL — [备注]
UAT-013: PASS/FAIL — [备注]
UAT-014: PASS/FAIL — [备注]
UAT-015: PASS/FAIL — [备注]
🚦 Gate B: PASS/FAIL

### Round C: Wallet + 验证 + 分享 + 批量 + 撤销
UAT-016 ~ UAT-030: [逐个填写]

### Round D: 全生命周期
UAT-031 ~ UAT-035: [逐个填写]

### Summary
- PASS: __/35
- PARTIAL: __/35
- FAIL: __/35
- SKIP: __/35
- 新发现 Bug: [描述]

### Verdict: ✅ PASSED / ❌ NOT PASSED
```

---

## 8. 特别注意事项

### BUG-006 Manager 撤销 — 设计变更

Round 1 时 Manager 无法撤销 badge。**现在的设计决定**（PO 已确认）：

> Manager 只能撤销**同部门** recipient 的 badge。跨部门撤销属于 Post-MVP (FEAT-004)。

测试 UAT-028 时，请确保用 Manager 账号撤销的是**同部门**员工的 badge。如果目标 badge 的 recipient 不在 Manager 同部门，预期会被拒绝（403）。

### TP-FIX — URL 修正

| 用例 | Round 1 错误 URL | Round 2 正确 URL |
|------|---------|---------|
| UAT-001 | `/api/health` | `/health` |
| UAT-002 | `/api/docs` | `/api-docs` |

### UX-001/002/003 — Story 10.8 已修复

| UX ID | 描述 | 修复 commit |
|-------|------|------------|
| UX-001 | CSV 模板预填 templateId + copy 按钮 | `6709b22` |
| UX-002 | 部分有效 CSV 允许确认发送 (X of Y) | `6709b22` |
| UX-003 | Dashboard 所有 summary 卡片可点击 | `6709b22` |

---

**预计测试时间:** 60-90 分钟（按 Round A→D 顺序执行）
