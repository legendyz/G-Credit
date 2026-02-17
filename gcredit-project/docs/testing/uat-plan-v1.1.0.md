# G-Credit v1.1.0 — 全面用户验收测试 (UAT) 计划

> **版本:** v1.1.0  
> **日期:** 2026-02-15  
> **范围:** 全系统 UAT（非仅 Sprint 11），涵盖所有功能模块、安全加固、角色权限  
> **前置条件:** Sprint 11 全部 25 个 Story 已完成，1,307 测试通过，Pre-Release Audit 所有条件已解决

---

## 目录

1. [环境准备](#1-环境准备)
2. [测试数据注入](#2-测试数据注入)
3. [测试账户](#3-测试账户)
4. [UAT 测试用例](#4-uat-测试用例)
   - [TC-01: 认证与安全](#tc-01-认证与安全)
   - [TC-02: Dashboard（仪表盘）](#tc-02-dashboard仪表盘)
   - [TC-03: Badge Template 管理](#tc-03-badge-template-管理)
   - [TC-04: Badge 发放（单个）](#tc-04-badge-发放单个)
   - [TC-05: Badge 认领](#tc-05-badge-认领)
   - [TC-06: Badge Wallet（我的徽章）](#tc-06-badge-wallet我的徽章)
   - [TC-07: Badge 分享](#tc-07-badge-分享)
   - [TC-08: 公开验证与嵌入](#tc-08-公开验证与嵌入)
   - [TC-09: Badge 撤销](#tc-09-badge-撤销)
   - [TC-10: 批量发放](#tc-10-批量发放)
   - [TC-11: 管理员用户管理](#tc-11-管理员用户管理)
   - [TC-12: Analytics 分析](#tc-12-analytics-分析)
   - [TC-13: 技能与分类管理](#tc-13-技能与分类管理)
   - [TC-14: 里程碑系统](#tc-14-里程碑系统)
   - [TC-15: Evidence（凭证文件）](#tc-15-evidence凭证文件)
   - [TC-16: 角色权限矩阵验证](#tc-16-角色权限矩阵验证)
   - [TC-17: 安全加固验证](#tc-17-安全加固验证)
5. [UAT 结果记录表](#5-uat-结果记录表)

---

## 1. 环境准备

### 1.1 前置条件

| 项目 | 要求 |
|------|------|
| Node.js | v20+ |
| PostgreSQL | v16 |
| Git branch | `sprint-11/security-quality-hardening` (或合并后的 `main`) |
| Azure Storage | 配置好连接（或使用 mock） |

### 1.2 启动后台 (Backend)

> **已有开发环境？** 步骤 2-4 可跳过（依赖已安装、.env 已配置、迁移已执行）。  
> 只需执行 **步骤 1 → 5 → 6** 即可。

```powershell
# 1. 进入后台目录
cd c:\G_Credit\CODE\gcredit-project\backend

# 2. 安装依赖（已有开发环境可跳过）
npm install

# 3. 配置环境变量（已有开发环境可跳过）
cp .env.example .env
# 编辑 .env，确保以下关键配置正确：
#   DATABASE_URL="postgresql://postgres:password@localhost:5432/gcredit"
#   JWT_SECRET="<至少32字符的安全密钥>"
#   JWT_REFRESH_SECRET="<至少32字符的安全密钥>"
#   NODE_ENV="development"
#   PORT=3000
#   PLATFORM_URL="http://localhost:5173"
#   FRONTEND_URL="http://localhost:5173"

# 4. 执行数据库迁移（已有开发环境可跳过）
npx prisma migrate deploy

# 5. 注入 UAT 测试数据 ⚠️ 必须执行 — 清空数据库并注入干净的测试数据
npm run seed:reset

# 6. 启动开发服务器
npm run start:dev
```

**验证后台启动：**

```powershell
# 健康检查
curl http://localhost:3000/health
# 期望返回: { "status": "ok", ... }

# 就绪检查（含数据库连接）
curl http://localhost:3000/ready
# 期望返回: { "status": "ready", "database": "connected", ... }

# Swagger API 文档
# 浏览器打开: http://localhost:3000/api-docs
```

### 1.3 启动前台 (Frontend)

> **已有开发环境？** 步骤 2 可跳过，只需 **步骤 1 → 3**。

```powershell
# 1. 进入前台目录
cd c:\G_Credit\CODE\gcredit-project\frontend

# 2. 安装依赖（已有开发环境可跳过）
npm install

# 3. 启动开发服务器
npm run dev
```

**验证前台启动：**
- 浏览器打开 `http://localhost:5173`
- 应看到登录页面
- 开发者工具 Console 无红色错误

---

## 2. 测试数据注入

### 2.1 自动注入（推荐）

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend

# 完整重置：清空数据库 + 执行迁移 + 注入 UAT 数据
npm run seed:reset

# 仅注入（已有迁移的情况下）
npm run seed:uat
```

### 2.2 注入数据概览

`seed:reset` / `seed:uat` 执行后会创建以下数据：

#### 用户（5 个）

| 角色 | 邮箱 | 部门 |
|------|------|------|
| ADMIN | `admin@gcredit.com` | IT |
| ISSUER | `issuer@gcredit.com` | HR |
| MANAGER | `manager@gcredit.com` | Engineering |
| EMPLOYEE | `M365DevAdmin@2wjh85.onmicrosoft.com` | Development |
| EMPLOYEE | `employee@gcredit.com` | Engineering |

> **所有账户密码：** `password123`

#### Badge 模板（9 个，全部 ACTIVE）

| 模板名 | 类别 | 有效期 |
|--------|------|--------|
| Cloud Expert Certification | Technical | 365 天 |
| Leadership Excellence | Leadership | 730 天 |
| Innovation Champion | Innovation | 365 天 |
| Security Specialist | Security | 365 天 |
| Team Player Award | Teamwork | 永久 |
| DevOps Engineer Certification | Technical | 365 天 |
| AI & Machine Learning Pioneer | Technical | 365 天 |
| Mentor of the Year | Leadership | 永久 |
| Customer Success Champion | Teamwork | 365 天 |

#### Badges（11 个）

| # | 模板 | 持有人 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | Cloud Expert | employee | CLAIMED | 含 evidence |
| 2 | Leadership | employee | CLAIMED | |
| 3 | Innovation | employee | CLAIMED | 含 evidence |
| 4 | Team Player | employee | CLAIMED | 无过期 |
| 5 | Security Specialist | employee | PENDING | 待认领 |
| 6 | Cloud Expert | employee | REVOKED | 已撤销 |
| 7 | Leadership | manager | CLAIMED | |
| 8 | Innovation | manager | CLAIMED | |
| 9 | Security Specialist | manager | CLAIMED | 已过期 |
| 10 | Team Player | admin | CLAIMED | |
| 11 | Cloud Expert | admin | PENDING | 用于认领测试 |

#### 其他数据

- **技能分类：** 5 个一级 + 4 个二级
- **技能：** 7 个（TypeScript, Azure Cloud, Docker, etc.）
- **里程碑配置：** 2 个（First Badge: 1 枚, Badge Collector: 5 枚）
- **证据文件：** 2 个（badge1, badge3 的 PDF）
- **审计日志：** 3 条（badge6 的 ISSUED → CLAIMED → REVOKED）

#### 验证 URL（公开访问）

| 状态 | URL |
|------|-----|
| CLAIMED | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000001` |
| PENDING | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000005` |
| REVOKED | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000006` |
| EXPIRED | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000009` |

### 2.3 手动补充数据（可选）

如需额外测试数据，可通过 Swagger (`/api-docs`) 或 curl 手动创建：

```powershell
# 登录获取 cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@gcredit.com","password":"password123"}'

# 使用 cookie 调用 API（示例：创建用户）
curl -b cookies.txt http://localhost:3000/api/admin/users
```

---

## 3. 测试账户

| 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|
| **ADMIN** | `admin@gcredit.com` | `password123` | 全功能访问，用户管理，系统分析 |
| **ISSUER** | `issuer@gcredit.com` | `password123` | 模板管理，发放 badge，发放分析 |
| **MANAGER** | `manager@gcredit.com` | `password123` | 查看部门 badge，撤销，团队分析 |
| **EMPLOYEE** | `employee@gcredit.com` | `password123` | 个人 wallet，认领，分享，个人资料 |
| **EMPLOYEE** | `M365DevAdmin@2wjh85.onmicrosoft.com` | `password123` | M365 集成测试用 |

---

## 4. UAT 测试用例

### TC-01: 认证与安全

> **测试账户：** 所有角色  
> **覆盖范围：** 登录、登出、密码修改、Cookie 安全、速率限制

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 1.1 | 打开 `http://localhost:5173/login` | 显示登录页面，无控制台错误 | |
| 1.2 | 输入 `admin@gcredit.com` / `password123`，点击登录 | 跳转到 Dashboard，显示 Admin 视图 | |
| 1.3 | 打开浏览器 DevTools → Application → Cookies | 看到 `access_token` cookie（httpOnly: true, path: /api） | |
| 1.4 | 刷新页面 | 仍保持登录状态（cookie 自动携带） | |
| 1.5 | 点击登出 | 跳转回登录页面，cookie 被清除 | |
| 1.6 | 用 `employee@gcredit.com` 登录 | 显示 Employee Dashboard（无管理菜单） | |
| 1.7 | 手动输入 URL `http://localhost:5173/admin/users` | 显示 Access Denied 页面或重定向 | |
| 1.8 | 登出后直接访问 `http://localhost:5173/wallet` | 重定向到登录页面 | |
| 1.9 | 用错误密码登录 5 次以上 | 返回错误提示（速率限制或账户锁定） | |
| 1.10 | 登录后进入 Profile 页面，修改 firstName/lastName | 保存成功，页面显示更新后的名字 | |
| 1.11 | 修改密码：旧密码正确 + 新密码 | 修改成功 | |
| 1.12 | 用新密码重新登录 | 登录成功 | |

---

### TC-02: Dashboard（仪表盘）

> **测试账户：** 每个角色分别测试

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 2.1 | EMPLOYEE 登录 → Dashboard | 显示：获得 badge 数量、最近活动、里程碑进度 | |
| 2.2 | ISSUER 登录 → Dashboard | 显示：Employee 视图 + Issuer 数据（发放统计） | |
| 2.3 | MANAGER 登录 → Dashboard | 显示：Employee 视图 + Manager 数据（团队统计） | |
| 2.4 | ADMIN 登录 → Dashboard | 显示：所有视图数据（系统总览） | |
| 2.5 | 检查 Dashboard 数据与注入数据一致性 | badge 计数、用户数等与 seed 数据一致 | |

---

### TC-03: Badge Template 管理

> **测试账户：** ADMIN, ISSUER

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 3.1 | ADMIN 登录 → Admin → Templates 列表 | 显示 9 个 seed 模板（可看到所有状态） | |
| 3.2 | 点击 "New Template" | 打开创建表单 | |
| 3.3 | 填写模板：名称 "UAT Test Badge"、描述、上传图片、选技能、设有效期 365 天 | 创建成功，列表中出现新模板（状态 DRAFT） | |
| 3.4 | 编辑模板：将状态改为 ACTIVE | 保存成功 | |
| 3.5 | EMPLOYEE 登录 → 查看模板列表 (`/api/badge-templates`) | 只能看到 ACTIVE 模板，看不到 DRAFT | |
| 3.6 | ISSUER 登录 → 创建模板 | 创建成功 | |
| 3.7 | ISSUER 尝试编辑 ADMIN 创建的模板 | 应被拒绝（只能编辑自己创建的） | |
| 3.8 | ADMIN 编辑 ISSUER 创建的模板 | 编辑成功（ADMIN 可编辑任何模板） | |
| 3.9 | 删除模板（Archive） | 模板状态变为 ARCHIVED | |
| 3.10 | EMPLOYEE 尝试访问模板管理页面 | Access Denied | |

---

### TC-04: Badge 发放（单个）

> **测试账户：** ADMIN, ISSUER

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 4.1 | ADMIN 登录 → Admin → Badges → Issue Badge | 显示发放表单 | |
| 4.2 | 选择模板（如 "Team Player Award"） | 模板信息加载 | |
| 4.3 | 搜索收件人 `employee@gcredit.com` | 列表中出现该用户 | |
| 4.4 | 发放 badge | 成功提示，badge 状态为 PENDING | |
| 4.5 | 查看 Badge Management 列表 | 新发放的 badge 出现在列表中 | |
| 4.6 | ISSUER 登录 → 发放 badge 给 manager | 成功 | |
| 4.7 | EMPLOYEE 尝试发放 badge | 页面不可访问 / Access Denied | |
| 4.8 | MANAGER 尝试发放 badge | Access Denied（Manager 不能发放） | |

---

### TC-05: Badge 认领

> **测试账户：** EMPLOYEE, 未登录用户

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 5.1 | EMPLOYEE 登录 → Wallet | 应看到 PENDING 状态的 badge（badge5: Security Specialist） | |
| 5.2 | 点击 Claim 按钮 | badge 状态变为 CLAIMED | |
| 5.3 | 通过 claimToken URL 认领（未登录） | 无需登录，输入 claim token 即可认领 | |
| 5.4 | 对 ADMIN 的 PENDING badge（badge11）进行认领测试 | ADMIN 登录后可认领 | |
| 5.5 | 尝试认领已 CLAIMED 的 badge | 应显示错误（已被认领） | |
| 5.6 | 尝试认领已 REVOKED 的 badge | 应显示错误 | |

---

### TC-06: Badge Wallet（我的徽章）

> **测试账户：** EMPLOYEE

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 6.1 | EMPLOYEE 登录 → Wallet (`/wallet`) | 显示时间线视图，含所有已收到的 badge | |
| 6.2 | 检查 badge 列表 | 应显示：4 CLAIMED + 1 PENDING + 1 REVOKED = 6 个 badge | |
| 6.3 | 点击某个 badge 查看详情 | 显示模板名称、发放者、状态、日期、技能标签 | |
| 6.4 | 切换 badge 可见性：PUBLIC → PRIVATE | 切换成功，UI 状态更新 | |
| 6.5 | 再次切换回 PUBLIC | 切换成功 | |
| 6.6 | 查看过期 badge | 显示 EXPIRED 标记（badge9 仅 manager 可见） | |
| 6.7 | 下载 badge PNG（已 CLAIMED 的 badge） | 下载 PNG 文件，包含嵌入的 assertion | |

---

### TC-07: Badge 分享

> **测试账户：** EMPLOYEE

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 7.1 | 查看 badge 详情 → 点击 "Share via Email" | 弹出邮件分享对话框 | |
| 7.2 | 填写收件人邮箱，发送分享 | 成功提示（如未配置 Graph API → 返回适当错误） | |
| 7.3 | 点击 "Share on LinkedIn" | 打开 LinkedIn 分享窗口（新标签页）| |
| 7.4 | 检查分享分析 → GET `/api/badges/:badgeId/analytics/shares` | 显示分享次数统计 | |
| 7.5 | 用另一个账户（如 manager）尝试分享 employee 的 badge | 应返回 403 Forbidden（F-NEW-1 修复验证） | |
| 7.6 | Widget 嵌入 → 访问 `/badges/:badgeId/embed` 页面 | 显示可嵌入的 badge widget | |

---

### TC-08: 公开验证与嵌入

> **测试账户：** 无需登录

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 8.1 | 访问 CLAIMED badge 验证 URL | 显示：badge 有效，绿色状态，OB 2.0 数据 |  |
|    | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000001` | | |
| 8.2 | 访问 PENDING badge 验证 URL | 显示：PENDING 状态标记 | |
|    | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000005` | | |
| 8.3 | 访问 REVOKED badge 验证 URL | 显示：已撤销，红色警告 | |
|    | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000006` | | |
| 8.4 | 访问 EXPIRED badge 验证 URL | 显示：已过期标记 | |
|    | `http://localhost:5173/verify/00000000-0000-4000-a000-000300000009` | | |
| 8.5 | 访问不存在的验证 ID | 显示 404 或 "Badge not found" | |
| 8.6 | API: `GET /api/badges/:id/assertion` | 返回 Open Badges 2.0 JSON-LD assertion | |
| 8.7 | API: `GET /api/badges/:id/integrity` | 返回完整性校验结果（hash 验证） | |
| 8.8 | Widget: `GET /api/badges/:badgeId/embed` | 返回 embed JSON 数据 | |
| 8.9 | Widget: `GET /api/badges/:badgeId/widget` | 返回 HTML snippet | |

---

### TC-09: Badge 撤销

> **测试账户：** ADMIN, ISSUER, MANAGER

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 9.1 | ADMIN 登录 → Badge 管理 → 选择一个 CLAIMED badge → 撤销 | 输入撤销原因，badge 状态变为 REVOKED | |
| 9.2 | 验证撤销后的 badge 不再在持有人 wallet 中显示为有效 | 显示 REVOKED 状态 | |
| 9.3 | 验证审计日志中有撤销记录 | 记录包含 actorId、原因、时间 | |
| 9.4 | ISSUER 撤销自己发放的 badge | 成功 | |
| 9.5 | ISSUER 尝试撤销别人发放的 badge | 应被拒绝 | |
| 9.6 | MANAGER 撤销部门内 badge | 成功 | |
| 9.7 | EMPLOYEE 尝试撤销 badge | 无撤销入口 / 403 Forbidden | |
| 9.8 | 尝试撤销已经 REVOKED 的 badge | 应显示错误 | |

---

### TC-10: 批量发放

> **测试账户：** ADMIN, ISSUER

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 10.1 | ADMIN 登录 → Admin → Bulk Issuance | 显示批量发放页面 | |
| 10.2 | 下载 CSV 模板 | 下载包含必要列的 CSV 文件 | |
| 10.3 | 填写 CSV（3-5 行有效数据） | | |
| 10.4 | 上传 CSV | 返回 preview session（显示有效行/错误行） | |
| 10.5 | 查看 Preview 页面 | 显示解析结果，有效行标绿，错误行标红 | |
| 10.6 | 确认发放 | 批量创建 badges，全部状态为 PENDING | |
| 10.7 | 上传含错误的 CSV（邮箱格式错、不存在用户） | 预览中显示错误详情 | |
| 10.8 | 下载错误报告 | CSV 格式的错误报告 | |
| 10.9 | EMPLOYEE 尝试访问批量发放 | Access Denied | |
| 10.10 | 快速连续上传 11 次 | 第 11 次应被速率限制拒绝（10 次/5 分钟） | |

---

### TC-11: 管理员用户管理

> **测试账户：** ADMIN

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 11.1 | ADMIN 登录 → Admin → Users | 显示用户列表（5 个 seed 用户） | |
| 11.2 | 搜索 "employee" | 过滤显示匹配用户 | |
| 11.3 | 点击用户查看详情 | 显示完整用户信息 | |
| 11.4 | 修改 employee 角色为 ISSUER | 成功，角色立即更新 | |
| 11.5 | 用该 employee 重新登录 | 现在可以访问 ISSUER 功能 | |
| 11.6 | 将角色改回 EMPLOYEE | 成功 | |
| 11.7 | 停用 employee 账户 | 账户被停用 | |
| 11.8 | 用被停用的账户尝试登录 | 登录失败（账户已停用） | |
| 11.9 | 重新激活账户 | 激活成功 | |
| 11.10 | 修改用户部门 | 成功保存 | |
| 11.11 | ISSUER 尝试访问用户管理 | Access Denied | |
| 11.12 | MANAGER 尝试访问用户管理 | Access Denied | |

---

### TC-12: Analytics 分析

> **测试账户：** ADMIN, ISSUER, MANAGER

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 12.1 | ADMIN 登录 → Analytics 页面 | 显示系统总览（用户数、badge 数、模板数） | |
| 12.2 | 查看发放趋势图 | 显示时间维度的发放数据 | |
| 12.3 | 查看 Top Performers | 显示徽章最多的用户排名 | |
| 12.4 | 查看技能分布 | 显示各技能类别的分布图 | |
| 12.5 | 查看近期活动 | 显示系统活动流 | |
| 12.6 | 导出 CSV | 下载 analytics CSV 文件 | |
| 12.7 | ISSUER 访问 Analytics | 只看到自己发放相关的趋势 | |
| 12.8 | MANAGER 访问 Analytics | 只看到 top performers（团队维度） | Pass (by design) — Manager 团队分析通过 Manager Dashboard 首页提供（Top Performers + Revocation Alerts），无需单独 Analytics 页面 |
| 12.9 | EMPLOYEE 访问 Analytics 页面 | Access Denied | |

---

### TC-13: 技能与分类管理

> **测试账户：** ADMIN, ISSUER, EMPLOYEE

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 13.1 | ADMIN 登录 → API: `GET /api/skill-categories` | 返回树形层级分类（5 个一级 + 子分类） | |
| 13.2 | 创建新分类 `POST /api/skill-categories` | 创建成功 | |
| 13.3 | 创建新技能 `POST /api/skills` | 创建成功，关联到分类 | |
| 13.4 | EMPLOYEE 查看技能列表 `GET /api/skills` | 成功（只读） | |
| 13.5 | EMPLOYEE 尝试创建技能 | 403 Forbidden | |
| 13.6 | ISSUER 创建技能 | 成功 | |
| 13.7 | ISSUER 尝试删除分类 | 403 Forbidden（仅 ADMIN 可删除分类） | |
| 13.8 | ADMIN 删除分类 | 成功 | |
| 13.9 | 搜索技能 `GET /api/skills/search?q=Azure` | 返回匹配结果 | |

---

### TC-14: 里程碑系统

> **测试账户：** ADMIN, EMPLOYEE

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 14.1 | ADMIN → API: `GET /api/admin/milestones` | 返回 2 个 seed 里程碑配置 | |
| 14.2 | 创建新里程碑 `POST /api/admin/milestones` | 成功 | |
| 14.3 | EMPLOYEE → `GET /api/milestones/achievements` | 返回已达成的里程碑列表 | |
| 14.4 | 验证 employee（4 个 CLAIMED badge）触发了 "First Badge" 里程碑 | achievement 记录存在 | |
| 14.5 | EMPLOYEE 尝试创建里程碑 | 403 Forbidden | |

---

### TC-15: Evidence（凭证文件）

> **测试账户：** ADMIN, ISSUER, EMPLOYEE

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| 15.1 | ISSUER → 上传 evidence 文件到 badge: `POST /api/badges/:badgeId/evidence` | 上传成功（≤10MB） | |
| 15.2 | 查看 badge evidence 列表 | 显示已上传的文件 | |
| 15.3 | 下载 evidence 文件 | 获取 SAS URL 并下载 | |
| 15.4 | 预览 evidence 文件 | 获取预览 SAS URL | |
| 15.5 | 上传超过 10MB 的文件 | 应被拒绝 | |
| 15.6 | EMPLOYEE 查看自己 badge 的 evidence | 成功 | |

---

### TC-16: 角色权限矩阵验证

> **目的：** 系统性验证每个角色的访问边界

分别用 4 个角色登录，按以下矩阵验证：

| 功能 | EMPLOYEE | MANAGER | ISSUER | ADMIN |
|------|----------|---------|--------|-------|
| Dashboard（个人） | ✅ | ✅ | ✅ | ✅ |
| Dashboard（团队） | ❌ 403 | ✅ | ❌ 403 | ✅ |
| Dashboard（发放） | ❌ 403 | ❌ 403 | ✅ | ✅ |
| Dashboard（系统） | ❌ 403 | ❌ 403 | ❌ 403 | ✅ |
| Wallet | ✅ | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ | ✅ |
| Template 管理 | ❌ | ❌ | ✅ | ✅ |
| 发放 Badge | ❌ | ❌ | ✅ | ✅ |
| 批量发放 | ❌ | ❌ | ✅ | ✅ |
| 撤销 Badge | ❌ | ✅ 部门 | ✅ 本人 | ✅ 全部 |
| 用户管理 | ❌ | ❌ | ❌ | ✅ |
| Analytics | ❌ | ✅ 部分 | ✅ 部分 | ✅ 全部 |
| 里程碑管理 | ❌ | ❌ | ❌ | ✅ |
| 技能管理（创建） | ❌ | ❌ | ✅ | ✅ |
| 技能分类（删除） | ❌ | ❌ | ❌ | ✅ |

每格标注实际结果（Pass/Fail）。

---

### TC-17: 安全加固验证

> **覆盖范围：** Sprint 11 安全加固 + Pre-release audit 全部修复确认

| # | 步骤 | 预期结果 | Pass/Fail |
|---|------|----------|-----------|
| **Cookie 安全** | | | |
| 17.1 | 登录后检查 `access_token` cookie 属性 | httpOnly=true, path=/api, sameSite=lax | |
| 17.2 | 检查 `refresh_token` cookie 属性 | httpOnly=true, path=/api/auth, sameSite=lax | |
| 17.3 | 验证 response body 中不包含 token | body 只有 `{ user: {...} }`，无 token 字段 | |
| **安全 Headers** | | | |
| 17.4 | 检查 Response Headers: `X-Frame-Options` | DENY | |
| 17.5 | 检查 `Content-Security-Policy` | 包含 `default-src 'self'`, `frame-ancestors 'none'` | |
| 17.6 | 检查 `X-Content-Type-Options` | nosniff | |
| 17.7 | 检查 `Referrer-Policy` | no-referrer | |
| **速率限制** | | | |
| 17.8 | 60 秒内发送 61 个 API 请求 | 第 61 个返回 429 Too Many Requests | |
| 17.9 | 登录接口快速尝试 6 次 | 第 6 次返回 429（5 次/分钟限制） | |
| **F-NEW-1 修复验证** | | | |
| 17.10 | MANAGER 登录，尝试 `POST /api/badges/{employee的badgeId}/share/linkedin` | 返回 403 Forbidden（非 badge 所有者） | |
| 17.11 | EMPLOYEE 登录，分享自己的 badge | 成功（201） | |
| **F-NEW-2 修复验证** | | | |
| 17.12 | 检查 Swagger 文档中 `GET /api/badge-templates` | 描述为 "auth required via global guard"（非 "public"） | |
| **CORS** | | | |
| 17.13 | 从 `http://localhost:5173` 发送 API 请求 | 成功（允许的 origin） | |
| 17.14 | 从其他 origin 发送请求（可用 curl 模拟 `Origin: http://evil.com`） | 被 CORS 拦截 | |
| **输入验证** | | | |
| 17.15 | 发送包含额外字段的 POST 请求 | 额外字段被 whitelist 过滤 | |
| 17.16 | 发送缺少必填字段的请求 | 返回 400 + 详细验证错误 | |

---

## 5. UAT 结果记录表

| 测试组 | 用例数 | Pass | Fail | Skip | 备注 |
|--------|--------|------|------|------|------|
| TC-01: 认证与安全 | 12 | | | | |
| TC-02: Dashboard | 5 | | | | |
| TC-03: Template 管理 | 10 | | | | |
| TC-04: Badge 发放 | 8 | | | | |
| TC-05: Badge 认领 | 6 | | | | |
| TC-06: Badge Wallet | 7 | | | | |
| TC-07: Badge 分享 | 6 | | | | |
| TC-08: 公开验证与嵌入 | 9 | | | | |
| TC-09: Badge 撤销 | 8 | | | | |
| TC-10: 批量发放 | 10 | | | | |
| TC-11: 用户管理 | 12 | | | | |
| TC-12: Analytics | 9 | | | | |
| TC-13: 技能管理 | 9 | | | | |
| TC-14: 里程碑 | 5 | | | | |
| TC-15: Evidence | 6 | | | | |
| TC-16: 权限矩阵 | 15 项 | | | | |
| TC-17: 安全加固 | 16 | | | | |
| **总计** | **153** | | | | |

### UAT 通过标准

- **PASS:** 所有 153 个用例全部通过
- **CONDITIONAL PASS:** ≤3 个 FAIL 且均为非阻塞性问题（UI 文案、样式），无安全/数据问题
- **FAIL:** 任何安全类（TC-01, TC-16, TC-17）用例失败，或 >3 个功能类用例失败

### 签署

| 角色 | 姓名 | 日期 | 判定 |
|------|------|------|------|
| 测试执行者 | | | PASS / CONDITIONAL PASS / FAIL |
| 产品负责人 | | | APPROVED / REJECTED |

---

*文档结束 — G-Credit v1.1.0 UAT Plan*
