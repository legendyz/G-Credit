# Story 15.14: Mid-Sprint UAT — 手动测试计划

**文档用途：** 详细手动测试步骤指引（56 个测试用例）  
**测试范围：** Sidebar + Dashboard Tabs + Route Integrity + Responsive  
**前置条件：** Story 15.1, 15.2, 15.3 全部 done 且已推送  

---

## 目录

1. [环境准备](#1-环境准备)
2. [测试账户准备](#2-测试账户准备)
3. [Section A: Sidebar Navigation (12 tests)](#3-section-a-sidebar-navigation)
4. [Section B: Dashboard Tabs (10 tests)](#4-section-b-dashboard-tabs)
5. [Section C: Route Integrity (10 tests)](#5-section-c-route-integrity)
6. [Section D: Responsive (4 tests)](#6-section-d-responsive)
7. [结果记录模板](#7-结果记录模板)

---

## 1. 环境准备

### 1.1 启动后端

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
```

等待看到 `🚀 Application is running on: http://localhost:3000` 后继续。

### 1.2 启动前端

```powershell
cd C:\G_Credit\CODE\gcredit-project\frontend
npm run dev
```

等待看到 `Local: http://localhost:5173/` 后继续。

### 1.3 运行 UAT Seed

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
npx ts-node prisma/seed-uat.ts
```

确认输出：`✅ 5 users created/updated`

### 1.4 浏览器准备

- 使用 Chrome
- 准备至少 2 个浏览器窗口（一个正常模式、一个 Incognito）交替登录
- 打开 DevTools → Network 标签（用于检查 API 调用）
- 推荐安装 Chrome DevTools 的 Responsive 模式（用于 Section D）

---

## 2. 测试账户准备

### 2.1 现有 Seed 账户

| # | Email | 密码 | Role | isManager | 覆盖组合 |
|---|-------|------|------|-----------|----------|
| 1 | employee@gcredit.com | Password123 | EMPLOYEE | false | ✅ Combo 1 |
| 2 | manager@gcredit.com | Password123 | EMPLOYEE | true | ✅ Combo 2 |
| 3 | issuer@gcredit.com | Password123 | ISSUER | false | ✅ Combo 3 |
| 4 | admin@gcredit.com | Password123 | ADMIN | false | ✅ Combo 5 |

### 2.2 缺失的组合 & 准备步骤

Seed 数据缺少 **ISSUER+isManager** (Combo 4) 和 **ADMIN+isManager** (Combo 6)。需要在测试前通过 Admin 界面调整：

#### Combo 4: ISSUER + isManager = true

1. 用 `admin@gcredit.com / Password123` 登录
2. 进入 Users 管理页（`/admin/users`）
3. 找到 `issuer@gcredit.com`，确认 role = ISSUER
4. 找到 `employee2@gcredit.com`，编辑其 Manager 为 `Demo Issuer`
5. Logout → 用 `issuer@gcredit.com` 登录
6. 此时 issuer 有 1 个 subordinate → `isManager = true`
7. 测试完 Combo 4 后，**恢复**：把 employee2 的 Manager 改回 `Team Manager`

#### Combo 6: ADMIN + isManager = true

1. 用 `admin@gcredit.com / Password123` 登录 
2. 进入 Users 管理页（`/admin/users`）
3. 找到 `manager@gcredit.com`，编辑其 Manager 为 `Admin User`
4. Logout → 重新用 `admin@gcredit.com` 登录
5. 此时 admin 有 1 个 subordinate → `isManager = true`
6. 测试完 Combo 6 后，**恢复**：把 manager 的 Manager 清空

> **替代方案：** 如果 Admin 页面不支持编辑 Manager 字段，可直接用 Prisma Studio：
> ```powershell
> cd C:\G_Credit\CODE\gcredit-project\backend
> npx prisma studio
> ```
> 在 `User` 表中直接修改 `managerId` 字段。

---

## 3. Section A: Sidebar Navigation

**测试方法：** 登录后观察左侧侧边栏中出现的导航分组和链接。

### 权限组与链接对照表

| 组 | 组标题 | 包含链接 |
|----|--------|---------|
| base | _(无标题)_ | Dashboard, Wallet |
| team | Team | Team Badges |
| issuance | Issuance | Templates, Badges, Bulk Issue, Analytics |
| admin | Admin | Users, Categories, Skills, Milestones |

---

### A1-A4: EMPLOYEE + isManager=false

**账户：** `employee@gcredit.com / Password123`

**步骤：**
1. 打开 `http://localhost:5173/login`
2. 输入 `employee@gcredit.com` / `Password123`
3. 点击 Sign In
4. 等待跳转到 Dashboard

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A1 | Base 组可见 | 侧边栏显示 "Dashboard" 和 "Wallet" 两个链接 | 直接观察侧边栏 | |
| A2 | Team 组隐藏 | 侧边栏中 **没有** "Team" 标题和 "Team Badges" 链接 | 确认无此项 | |
| A3 | Issuance 组隐藏 | 侧边栏中 **没有** "Issuance" 标题及其下属链接 | 确认无此项 | |
| A4 | Admin 组隐藏 | 侧边栏中 **没有** "Admin" 标题及其下属链接 | 确认无此项 | |

**完成后：** 点击侧边栏底部的 **Sign Out** 退出。

---

### A5-A6: EMPLOYEE + isManager=true

**账户：** `manager@gcredit.com / Password123`

**步骤：**
1. 登录 `manager@gcredit.com`
2. 等待跳转到 Dashboard

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A5 | Team 组可见 | 侧边栏显示 "Team" 标题和 "Team Badges" 链接 | 直接观察 | |
| A6 | Issuance 组隐藏 | 侧边栏中 **没有** "Issuance" 标题及其下属链接 | 确认无此项 | |

> 此账户同时应有 Base 组（Dashboard, Wallet），可顺带确认。

**完成后：** Sign Out。

---

### A7-A8: ISSUER + isManager=false

**账户：** `issuer@gcredit.com / Password123`

**步骤：**
1. 登录 `issuer@gcredit.com`
2. 等待跳转到 Dashboard

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A7 | Issuance 组可见 | 侧边栏显示 "Issuance" 标题，包含：Templates, Badges, Bulk Issue, Analytics | 逐项确认 4 个链接 | |
| A8 | Team 组隐藏 | 侧边栏中 **没有** "Team" 标题和 "Team Badges" 链接 | 确认无此项 | |

**完成后：** Sign Out。

---

### A9: ISSUER + isManager=true

**账户：** `issuer@gcredit.com / Password123`（需先完成 [§2.2 Combo 4 准备](#combo-4-issuer--ismanager--true)）

**步骤：**
1. 确认已按 §2.2 设置 employee2 的 Manager 为 Demo Issuer
2. 登录 `issuer@gcredit.com`

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A9 | Team + Issuance 组都可见 | 侧边栏同时显示 "Team" 组（Team Badges）和 "Issuance" 组（4 个链接） | 观察两个组 | |

**完成后：** Sign Out。恢复 employee2 的 Manager 为 Team Manager。

---

### A10-A11: ADMIN + isManager=false

**账户：** `admin@gcredit.com / Password123`

**步骤：**
1. 登录 `admin@gcredit.com`（确认 admin 没有任何 subordinate，即未做 Combo 6 准备）
2. 等待跳转到 Dashboard

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A10 | Issuance + Admin 组可见 | 侧边栏显示 "Issuance" 组（4 链接）+ "Admin" 组（4 链接） | 逐项确认 | |
| A11 | Team 组隐藏 | 侧边栏中 **没有** "Team" 标题和 "Team Badges" 链接 | 确认无此项 | |

**完成后：** Sign Out。

---

### A12: ADMIN + isManager=true

**账户：** `admin@gcredit.com / Password123`（需先完成 [§2.2 Combo 6 准备](#combo-6-admin--ismanager--true)）

**步骤：**
1. 确认已按 §2.2 设置 manager 的 Manager 为 Admin User
2. 登录 `admin@gcredit.com`

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| A12 | 全部 4 组可见 | 侧边栏显示 Base(2) + Team(1) + Issuance(4) + Admin(4) = 共 11 个链接 | 逐项确认全部 | |

**完成后：** Sign Out。恢复 manager 的 Manager 字段。

---

## 4. Section B: Dashboard Tabs

**测试方法：** 登录后观察 Dashboard 页面的标签页数量、标签名称、默认选中、和内容区。

### Tab 对照表

| Tab ID | Tab 标签名 | 内容组件 | 可见条件 |
|--------|-----------|---------|---------|
| my-badges | My Badges | EmployeeDashboard | 所有用户 |
| team | Team Overview | ManagerDashboard | isManager = true |
| issuance | Issuance | IssuerDashboard | ISSUER 或 ADMIN |
| admin | Administration | AdminDashboard | ADMIN |

---

### B1-B3: EMPLOYEE + isManager=false

**账户：** `employee@gcredit.com / Password123`

**步骤：**
1. 登录并等待 Dashboard 加载
2. 观察 Dashboard 顶部的标签栏

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B1 | 默认标签 | "My Badges" 标签处于选中状态（高亮） | 观察标签栏 | |
| B2 | 标签数量 | 仅 **1** 个标签："My Badges" | 确认无其他标签 | |
| B3 | 标签内容 | EmployeeDashboard 内容渲染（显示 badge 卡片/统计） | 观察内容区 | |

**完成后：** Sign Out。

---

### B4-B5: EMPLOYEE + isManager=true

**账户：** `manager@gcredit.com / Password123`

**步骤：**
1. 登录并等待 Dashboard 加载

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B4 | 标签数量 | **2** 个标签："My Badges" 和 "Team Overview" | 观察标签栏 | |
| B5 | Team 标签内容 | 点击 "Team Overview" 标签 → 显示 ManagerDashboard 内容（团队统计、subordinate 列表） | 点击 Team Overview 标签 | |

**附加检查：**
- [ ] 点击 "Team Overview" 后，"My Badges" 内容隐藏但不消失（切回 "My Badges" 时立即显示，无重新加载闪烁）
- [ ] 默认选中的是 "My Badges"，不是 "Team Overview"

**完成后：** Sign Out。

---

### B6: ISSUER + isManager=false

**账户：** `issuer@gcredit.com / Password123`

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B6 | 标签数量 | **2** 个标签："My Badges" 和 "Issuance" | 观察标签栏 | |

**附加检查：**
- [ ] 点击 "Issuance" → 显示 IssuerDashboard 内容
- [ ] 默认选中 "My Badges"

---

### B7: ISSUER + isManager=true

**账户：** `issuer@gcredit.com / Password123`（需 Combo 4 准备）

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B7 | 标签数量 | **3** 个标签："My Badges"、"Team Overview"、"Issuance" | 观察标签栏 | |

---

### B8: ADMIN + isManager=false

**账户：** `admin@gcredit.com / Password123`

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B8 | 标签数量 | **3** 个标签："My Badges"、"Issuance"、"Administration" | 观察标签栏 | |

**附加检查：**
- [ ] 点击 "Administration" → 显示 AdminDashboard 内容

---

### B9: ADMIN + isManager=true

**账户：** `admin@gcredit.com / Password123`（需 Combo 6 准备）

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B9 | 标签数量 | **4** 个标签：全部显示 | 确认 4 个标签都存在 | |

---

### B10: 所有用户默认 Tab

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| B10 | 默认 Tab 一致性 | 任何角色登录后，默认选中的 Tab 都是 "My Badges" | 在 B1-B9 过程中确认 | |

---

## 5. Section C: Route Integrity

**测试方法：** 用 **ADMIN+isManager=true** 账户（Combo 6，最高权限）点击侧边栏每个链接，验证页面正确加载且无 404。

**账户：** `admin@gcredit.com / Password123`（Combo 6 准备后）

**步骤：** 依次点击侧边栏中的每个导航链接：

| # | 侧边栏链接 | 点击后 URL | 预期页面 | PASS/FAIL |
|---|-----------|-----------|---------|-----------|
| C1 | Dashboard | `/` | Dashboard 标签页视图（4 tabs） | |
| C2 | Wallet | `/wallet` | Badge Wallet 时间线 | |
| C3 | Team Badges | `/admin/badges` | Badge Management 页面 | |
| C4 | Templates | `/admin/templates` | Badge Template 列表页 | |
| C5 | Badges | `/admin/badges` | Badge Management 页面 | |
| C6 | Bulk Issue | `/admin/bulk-issuance` | Bulk Issuance 页面 | |
| C7 | Analytics | `/admin/analytics` | Analytics Dashboard 页面 | |
| C8 | Users | `/admin/users` | User Management 页面 | |
| C9 | Categories | `/admin/skills/categories` | Skill Category 管理页 | |
| C10 | Skills | `/admin/skills` | Skill 管理页 | |

> **注意：** "Team Badges" 和 "Badges" 都指向 `/admin/badges`，这是预期行为（不同组中的同一路由）。

**每个路由检查清单：**
- 页面正常加载（无白屏、无报错）
- URL 栏显示正确路径
- 侧边栏对应链接高亮（active state：左侧 3px 蓝色边框 + 浅色背景）
- DevTools Console 中无红色报错

**附加路由测试 — Milestones：**

| # | 操作 | 预期 | PASS/FAIL |
|---|------|------|-----------|
| C10b | 点击 Milestones | `/admin/milestones` → Milestone 管理页 | |

> 注：UAT story 文件中 C10 是 Milestones，但导航配置中 Skills 和 Milestones 是分开的。以上表格覆盖全部 11 个链接。

---

## 6. Section D: Responsive

**测试方法：** 使用 Chrome DevTools Device Mode (F12 → Toggle Device Toolbar)

**账户：** `admin@gcredit.com / Password123`（Combo 6，可看到全部 UI 元素）

---

### D1: Desktop (1280px)

**步骤：**
1. 将浏览器窗口拉宽到 ≥1280px
2. 观察侧边栏和 Dashboard

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| D1a | 侧边栏可见 | 左侧侧边栏始终可见，展开状态 | 观察 | |
| D1b | 折叠功能 | 点击侧边栏右侧的 Rail 条（或 hover 到 Rail 上后点击）→ 侧边栏折叠为图标模式；再次点击展开 | 测试折叠/展开 | |
| D1c | 折叠后 Tooltip | 折叠状态下，hover 到图标上显示对应的导航文字 Tooltip | Hover 到 Dashboard 图标 | |
| D1d | Dashboard Tabs | 标签栏水平排列，居中对齐 | 观察 Dashboard 标签栏 | |

---

### D2: Tablet (768px)

**步骤：**
1. 打开 DevTools → Device Toolbar
2. 设置宽度为 768px

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| D2 | 侧边栏行为 | 侧边栏折叠或作为抽屉（drawer）模式 | 观察侧边栏是否自动收起 | |

---

### D3: Mobile (375px)

**步骤：**
1. 设置 Device Toolbar 为 iPhone SE (375px) 或手动设置宽度 375px

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| D3a | 侧边栏隐藏 | 侧边栏默认隐藏，页面顶部显示 hamburger (≡) 按钮 | 观察 | |
| D3b | Hamburger 打开 | 点击 hamburger → 侧边栏以 drawer 形式从左侧滑出 | 点击 hamburger | |
| D3c | Dashboard Tabs 滚动 | Dashboard 标签栏可水平滑动（4 个 tab 可能超出屏幕宽度） | 用手指/鼠标左右滑动标签栏 | |
| D3d | 滚动条隐藏 | 标签栏水平滚动时不显示滚动条（滚动条被 CSS 隐藏） | 滑动时观察 | |
| D3e | Fade 渐变 | 标签栏边缘有 fade 渐变效果，提示用户可以继续滚动 | 观察标签栏边缘 | |

---

### D4: Mobile Drawer 内容

**步骤：**（继续 375px 宽度，保持 ADMIN+isManager=true 登录）

1. 点击 hamburger 打开 drawer

**验证：**

| # | 检查项 | 预期结果 | 操作 | PASS/FAIL |
|---|--------|---------|------|-----------|
| D4a | Drawer 分组正确 | Drawer 中显示当前用户角色对应的全部可见组（ADMIN+manager → 4 组 11 链接） | 逐项检查 | |
| D4b | Drawer 导航 | 点击 Drawer 中的链接 → 页面跳转 + Drawer 自动关闭 | 点击 "Wallet" | |
| D4c | 用户信息 | Drawer 底部显示用户名和头像首字母 | 观察 | |
| D4d | Sign Out | 点击 "Sign Out" → 退出登录，跳转到 Login 页面 | 点击 Sign Out | |

---

## 7. 结果记录模板

测试完成后，将结果填入 `15-14-mid-sprint-uat.md` 的 UAT Results 表格中。

### 快速 Checklist（可在测试时使用）

**建议测试顺序（最小化登录切换次数）：**

| 轮次 | 账户 | 测试项 |
|------|------|--------|
| 1 | employee@gcredit.com | A1-A4, B1-B3 |
| 2 | manager@gcredit.com | A5-A6, B4-B5 |
| 3 | issuer@gcredit.com | A7-A8, B6 |
| 4 | _(准备 Combo 4)_ → issuer@gcredit.com | A9, B7 |
| 5 | _(恢复 Combo 4)_ → admin@gcredit.com | A10-A11, B8 |
| 6 | _(Combo 5 路由测试)_ admin@gcredit.com | C1-C10b（部分，无 Team） |
| 7 | _(准备 Combo 6)_ → admin@gcredit.com | A12, B9, B10, C1-C10b（含 Team） |
| 8 | admin@gcredit.com (375px) | D1-D4 |
| 9 | _(恢复 Combo 6)_ | 清理数据 |

### 预估时间

| Section | 测试数 | 预估时间 |
|---------|-------|---------|
| 账户准备 | — | 15 min |
| A: Sidebar | 12 | 25 min |
| B: Dashboard | 10 | 20 min |
| C: Routes | 11 | 15 min |
| D: Responsive | 4 (含子项) | 15 min |
| 结果记录 | — | 10 min |
| **合计** | **37 主项 + 19 子项 = 56** | **~100 min** |

---

## 附录：Deep-Link 测试（可选）

如果时间允许，额外测试 URL 直接深度链接：

| 操作 | 预期 |
|------|------|
| 浏览器直接访问 `http://localhost:5173/?tab=issuance`（ADMIN 登录） | Dashboard 页面打开，Issuance 标签选中 |
| 浏览器直接访问 `http://localhost:5173/?tab=team`（EMPLOYEE+isManager 登录） | Team Overview 标签选中 |
| 浏览器直接访问 `http://localhost:5173/?tab=admin`（EMPLOYEE 登录） | 无 admin 权限 → 回退到 "My Badges" |
| 浏览器直接访问 `http://localhost:5173/?tab=nonsense` | 未知 tab → 回退到 "My Badges" |

---

## 附录：Sidebar 折叠状态持久化测试（可选）

| 操作 | 预期 |
|------|------|
| 折叠侧边栏 → 刷新页面 (F5) | 侧边栏保持折叠状态（Cookie 持久化，DEC-15-04） |
| 展开侧边栏 → 导航到其他页面 | 侧边栏保持展开状态 |
