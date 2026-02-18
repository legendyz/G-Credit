# G-Credit Sprint 11 — UAT 测试计划

**测试类型:** User Acceptance Test (UAT)  
**Sprint:** Sprint 11 — Security & Quality Hardening  
**版本:** v1.1.0 (pending)  
**分支:** `sprint-11/security-quality-hardening`  
**创建日期:** 2026-02-14  
**测试范围:** Sprint 11 全部 23 个故事涉及的功能变更  
**前置条件:** 既有 Sprint 7 UAT（27 场景）全部通过  

---

## Phase 0: 环境启动与数据注入

### Step 0.1: 安装依赖（首次或依赖变更后执行）

```powershell
# 后端依赖安装
cd C:\G_Credit\CODE\gcredit-project\backend
npm install

# 前端依赖安装
cd C:\G_Credit\CODE\gcredit-project\frontend
npm install
```

### Step 0.2: 数据库迁移 + 注入测试数据

```powershell
# 进入后端目录
cd C:\G_Credit\CODE\gcredit-project\backend

# 方式 A: 全新数据库（推荐首次使用）— 重置数据库 + 自动注入 UAT seed
npm run seed:reset

# 方式 B: 已有数据库，仅追加/更新 UAT 测试数据（upsert 安全）
npx prisma migrate deploy          # 确保 schema 最新
npm run seed:uat                   # 注入 seed-uat.ts 测试数据
```

> **seed:reset** = `prisma migrate reset --force --skip-seed && ts-node prisma/seed-uat.ts`  
> **seed:uat** = `ts-node prisma/seed-uat.ts`（upsert 模式，可重复运行）  
> 注入后将创建 5 个用户、5 个模板、11 个徽章、技能分类、里程碑等完整测试数据集。

### Step 0.3: 启动后端

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
```

等待控制台输出：
```
[Nest] PID - LOG [NestApplication] Nest application successfully started
[Nest] PID - LOG Application is running on: http://localhost:3000
```

验证：浏览器访问 `http://localhost:3000/health` → 返回 `{ "status": "ok", ... }`

### Step 0.4: 启动前端

```powershell
cd C:\G_Credit\CODE\gcredit-project\frontend
npm run dev
```

等待控制台输出：
```
  VITE v7.2.4  ready in XXXms

  ➜  Local:   http://localhost:5173/
```

验证：浏览器访问 `http://localhost:5173` → 显示登录页面

### Step 0.5: 验证登录

使用 admin 账号 (`admin@gcredit.com` / `password123`) 登录，确认进入 Dashboard。

---

## 测试方法说明

| 标记 | 含义 | 说明 |
|------|------|------|
| 🖐️ 手动 | Manual Testing | 需要视觉验证的 UI/UX 相关场景，通过浏览器操作 |
| 🤖 脚本 | Script Testing | 可用 PowerShell/curl 脚本自动化的 API/后端场景 |
| 🔀 混合 | Manual + Script | UI 入口手动触发 + 脚本验证后端数据/响应 |

---

## 前提条件

### 环境
- Backend 运行在 `localhost:3000`（`NODE_ENV=development`）
- Frontend 运行在 `localhost:5173`
- PostgreSQL 数据库已 seed（admin/issuer/manager/employee 账号就绪）
- Azure Blob Storage 可用（或 mock）

### 测试账号（seed-uat.ts 注入）

| 变量 | 角色 | 邮箱 | 密码 | 用途 |
|------|------|------|------|------|
| `admin` | ADMIN | admin@gcredit.com | password123 | 安全测试、管理功能、CSV导出、用户管理 |
| `issuer` | ISSUER | issuer@gcredit.com | password123 | 颁发徽章、模板管理 |
| `manager` | MANAGER | manager@gcredit.com | password123 | 团队视图 |
| `employee` | EMPLOYEE | M365DevAdmin@2wjh85.onmicrosoft.com | password123 | 认领、分享、LinkedIn、可见性、Widget（真实 M365 用户） |
| `employee2` | EMPLOYEE | employee@gcredit.com | password123 | **账户锁定测试专用**（避免锁定影响其他测试流程） |

---

## 一、安全功能验证（P0 — 最高优先级）

### UAT-S01: 账户锁定机制 (Story 11.1)
**方式:** 🔀 混合 — 手动尝试前 3 次观察 UI 反馈 + 脚本完成第 4-5 次及锁定验证  
**测试账号:** `employee2` (employee@gcredit.com) — 专用于锁定测试，避免影响主流程

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 浏览器打开登录页，输入 employee@gcredit.com + 错误密码，点击登录 | 显示"Invalid credentials"，无特殊提示 | 🖐️ |
| 2 | 重复错误登录，连续 5 次 | 每次均显示"Invalid credentials"（安全设计：不暴露锁定状态） | 🖐️ |
| 3 | 锁定后用正确密码登录 | 仍显示"Invalid credentials"（账户已锁定 30 分钟，但错误信息统一，不泄露锁定状态） | 🖐️ |
| 4 | 脚本验证：`POST /api/auth/login` 锁定后返回 `401 Unauthorized` | Response body 为 `{"message":"Invalid credentials","statusCode":401}` | 🤖 |
| 5 | 脚本验证：DB 查询 `lockedUntil` 字段 | 确认值为当前时间 + 30分钟 | 🤖 |
| 6 | 等待锁定过期（或 DB 手动设 `lockedUntil = null, failedLoginAttempts = 0`） | 正确密码可正常登录 | 🤖 |
| 7 | 登录成功后，DB 查询 `failedLoginAttempts` | 字段归零为 0 | 🤖 |

> **安全说明:** 后端对「用户不存在」「账户停用」「账户锁定」「密码错误」四种情况统一返回 `401 Invalid credentials`，防止攻击者通过不同错误信息探测账户状态。锁定时长为 30 分钟（`LOCKOUT_DURATION_MINUTES = 30`）。

**脚本建议:** `uat-s01-account-lockout.ps1` — 循环发 5 次错误请求 → 验证 401 → 查询 DB lockedUntil → 清除锁定 → 验证恢复

---

### UAT-S02: 文件上传安全 — Magic-Byte 验证 (Story 11.2)
**方式:** 🔀 混合 — 手动上传正常文件观察 UI + 脚本验证伪造文件被拒绝

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 创建模板页，上传正常 .jpg 图片 | 上传成功，预览显示 | 🖐️ |
| 2 | 上传正常 .png 图片 | 上传成功 | 🖐️ |
| 3 | 上传 .webp 图片 | 上传成功 | 🖐️ |
| 4 | 脚本：构造一个 .txt 文件重命名为 .jpg，发送到模板上传端点 | 返回 400，提示文件类型不匹配 | 🤖 |
| 5 | 脚本：构造 .exe 伪装成 .png 发送到证据上传端点 | 返回 400 | 🤖 |
| 6 | 脚本：上传正常 PDF 到证据端点 | 上传成功 | 🤖 |

**脚本建议:** `uat-s02-magic-byte.ps1` — 准备测试文件（test-images/ 目录已有），逐个 POST 验证 200/400

---

### UAT-S03: Swagger 生产环境隔离 (Story 11.3)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 开发模式：访问 `http://localhost:3000/api` | Swagger UI 正常加载 | 🤖 |
| 2 | 设置 `NODE_ENV=production` 启动后端 | `/api` 返回 404（或无 Swagger 页面） | 🤖 |

**脚本建议:** 启动两次后端（dev/prod），分别 curl 验证状态码

---

### UAT-S04: httpOnly Cookie 认证 (Story 11.6)
**方式:** 🖐️ 手动 — Cookie 行为需要在浏览器 DevTools 中观察

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 打开浏览器 DevTools → Application → Cookies | 登录前无 `access_token` cookie | 🖐️ |
| 2 | 登录 admin 账号 | 登录成功，DevTools 显示 `access_token` cookie，属性：`HttpOnly=true`, `SameSite=Lax`, `Path=/` | 🖐️ |
| 3 | 检查 DevTools → Application → Local Storage | **不应**有 `accessToken` 或 `refreshToken` 条目 | 🖐️ |
| 4 | 刷新页面 (F5) | 仍然保持登录状态（Cookie 自动携带） | 🖐️ |
| 5 | 打开新标签页访问 `localhost:5173` | 同样已登录（同源 Cookie 共享） | 🖐️ |
| 6 | 点击"退出登录" | Cookie 被清除，跳转到登录页 | 🖐️ |
| 7 | 刷新页面 | 仍在登录页（Cookie 确实清除） | 🖐️ |

**不建议脚本：** Cookie 的 HttpOnly/SameSite 属性必须在浏览器中验证

---

### UAT-S05: 验证页面 PII 脱敏 (Story 11.7)
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 颁发一个徽章给 employee | 获得 verificationId | 🤖 |
| 2 | 打开公开验证页面 `localhost:5173/verify/{verificationId}` | 页面加载，显示徽章信息 | 🖐️ |
| 3 | 检查页面上颁发者信息 | 邮箱显示为 `a***n@gcredit.test` 格式（非完整邮箱） | 🖐️ |
| 4 | 脚本：`GET /api/verify/{id}` 检查 JSON 响应 | `issuerEmail` 字段为掩码格式 | 🤖 |

---

### UAT-S06: 日志 PII 脱敏 (Story 11.8)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 登录操作后查看后端控制台日志 | 无明文邮箱地址（应为 `a***n@...` 或 userId） | 🤖 |
| 2 | 触发密码重置请求 | 日志中无明文邮箱、无 JWT token 原文 | 🤖 |
| 3 | 上传 CSV 批量颁发 | 日志中 CSV 邮箱列表被脱敏 | 🤖 |

**脚本建议:** `uat-s06-log-sanitization.ps1` — 操作后 `Select-String` 搜索后端输出中的 `@` 模式

---

### UAT-S07: XSS 防护 — HTML 消毒 (Story 11.9)
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 创建模板，名称输入 `<script>alert(1)</script>Test` | 保存成功，名称显示为 `Test`（script 标签被清除） | 🖐️ |
| 2 | 模板描述输入 `<img onerror=alert(1) src=x>描述内容` | 保存后描述仅显示"描述内容"（恶意标签被清除） | 🖐️ |
| 3 | 脚本：POST 创建模板，body 含 XSS payload | 返回的 name/description 已清洗 | 🤖 |
| 4 | 查看保存后的模板详情页面 | 无弹窗、无异常渲染 | 🖐️ |

---

## 二、P0 功能验证

### UAT-F01: 徽章可见性控制 (Story 11.4)
**方式:** 🖐️ 手动 — 需要验证 Wallet 卡片和 Modal 两个 UI 入口

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Employee 登录，进入 Wallet 页面 | 已认领徽章显示，默认标记为 PUBLIC | 🖐️ |
| 2 | 在 Wallet 卡片上找到可见性 toggle | 有 PUBLIC/PRIVATE 切换控件 | 🖐️ |
| 3 | 切换为 PRIVATE | 卡片上标记更新为 PRIVATE | 🖐️ |
| 4 | 点击徽章打开 Detail Modal | Modal 中也有可见性 toggle，显示 PRIVATE | 🖐️ |
| 5 | 在 Modal 中切换回 PUBLIC | 关闭 Modal 后，卡片标记也更新为 PUBLIC | 🖐️ |
| 6 | 将徽章设为 PRIVATE | 切换成功 | 🖐️ |
| 7 | 用另一浏览器（未登录）打开该徽章的验证页面 | 显示 404 / "徽章不可用" | 🖐️ |
| 8 | 将徽章改回 PUBLIC | 验证页面恢复正常 | 🖐️ |
| 9 | 脚本：PRIVATE 徽章的 OB Assertion 端点 `GET /api/badges/:id/assertion` | 仍返回 200（OB 2.0 合规，不受 visibility 影响） | 🤖 |
| 10 | Admin 登录，用户管理页或后台 | 能看到所有徽章（含 PRIVATE） | 🖐️ |

---

### UAT-F02: LinkedIn 分享 (Story 11.5)
**方式:** 🖐️ 手动 — 需要验证 UI 交互和 LinkedIn 弹窗

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Employee 打开一个已认领徽章的分享对话框 | 显示 4 个 tab: Email → LinkedIn → Teams → Widget | 🖐️ |
| 2 | 点击 LinkedIn tab | 切换到 LinkedIn 分享面板 | 🖐️ |
| 3 | 检查 LinkedIn 图标 | 使用品牌蓝色 `#0A66C2`，SVG 图标 | 🖐️ |
| 4 | 点击"Share on LinkedIn"按钮 | 新窗口打开 LinkedIn 分享页面（`linkedin.com/sharing/share-offsite/?url=...`） | 🖐️ |
| 5 | 检查按钮状态变化 | 按钮变为"✓ LinkedIn opened"，禁用约 5 秒 | 🖐️ |
| 6 | 5 秒后按钮恢复 | 可再次点击 | 🖐️ |
| 7 | LinkedIn 页面预览卡片 | 有标题、描述、图片（OG meta tags 生效） | 🖐️ |

**不建议脚本：** LinkedIn 弹窗和 OG 预览必须人眼验证

---

### UAT-F03: 嵌入式 Widget + Privacy 交互 (既有功能 + 11.4)
**方式:** 🖐️ 手动

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 分享对话框 → Widget tab → 复制嵌入代码 | 获得 `<iframe>` embed code | 🖐️ |
| 2 | 在临时 HTML 页面中粘贴嵌入代码 | Widget 正常渲染徽章信息 | 🖐️ |
| 3 | 回到 Wallet，将该徽章设为 PRIVATE | 切换成功 | 🖐️ |
| 4 | 刷新 Widget 页面 | Widget 应显示空/错误（PRIVATE 徽章不对外展示） | 🖐️ |

---

## 三、UI/UX 变更验证

### UAT-U01: 验证页面技能名称显示 (Story 11.18)
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 颁发一个包含技能的徽章 | 颁发成功 | 🤖 |
| 2 | 打开验证页面 | 技能显示为英文名称（如"Project Management"），非 UUID | 🖐️ |
| 3 | 脚本：`GET /api/verify/:id` 检查 JSON | skills 数组含 `{ id, name }` 而非纯 UUID | 🤖 |

---

### UAT-U02: 403 访问拒绝页面 (Story 11.19)
**方式:** 🖐️ 手动

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Employee 登录 | 正常进入 Dashboard | 🖐️ |
| 2 | 手动访问 Admin 专属路由（如 `/admin/users`） | 显示 403 Access Denied 页面（非空白/404） | 🖐️ |
| 3 | 检查 403 页面内容 | 有 ShieldAlert 图标、角色信息、返回按钮 | 🖐️ |
| 4 | 点击返回按钮 | 回到 Dashboard 或首页 | 🖐️ |

---

### UAT-U03: 用户管理导航修复 (Story 11.23)
**方式:** 🖐️ 手动

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Admin 登录 | 左侧导航栏出现"用户管理"入口 | 🖐️ |
| 2 | 点击"用户管理" | 进入用户管理页面，用户列表加载 | 🖐️ |
| 3 | Employee 登录 | 左侧导航栏**不显示**"用户管理" | 🖐️ |

---

### UAT-U04: ClaimPage 动态 UUID (Story 11.20)
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 颁发徽章给 Employee | 获得 claimToken | 🤖 |
| 2 | 打开 `/claim/{claimToken}` | 页面加载，显示正确的徽章信息（非硬编码） | 🖐️ |
| 3 | 点击认领 | 认领成功，显示 ClaimSuccessModal | 🖐️ |
| 4 | 检查 ClaimSuccessModal | 有提示"你可以在 Wallet 中设置徽章可见性" | 🖐️ |

---

### UAT-U05: Dashboard UI 改进 (Story 11.21 相关)
**方式:** 🖐️ 手动

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 登录新账号（无数据） | Dashboard 显示空状态占位符（非空白） | 🖐️ |
| 2 | 加载过程中 | 显示骨架屏/Loading 动画 | 🖐️ |
| 3 | 缩小浏览器窗口至移动端宽度 | 布局自适应，无溢出/截断 | 🖐️ |

---

### UAT-U06: Design System 一致性 (Story 11.15)
**方式:** 🖐️ 手动

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 浏览各主要页面（Dashboard, Wallet, Templates, Admin） | 视觉风格统一（间距、圆角、颜色） | 🖐️ |
| 2 | 检查按钮、卡片、表格 | 使用 Tailwind 设计系统，无手工 inline style 造成的不一致 | 🖐️ |
| 3 | 对比 Sprint 10 截图（如有） | 无明显的视觉退化 | 🖐️ |

---

## 四、数据/API 功能验证

### UAT-A01: 分析数据 CSV 导出 (Story 11.17)
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Admin 登录，进入 Analytics/Dashboard 页面 | 页面上有"导出"按钮 | 🖐️ |
| 2 | 点击"导出" | 浏览器下载 CSV 文件 | 🖐️ |
| 3 | 用 Excel/WPS 打开 CSV | 中文不乱码（UTF-8 BOM），4 个 section 结构完整 | 🖐️ |
| 4 | 脚本：`GET /api/analytics/export` | 返回 `text/csv`，Content-Disposition 含文件名和日期 | 🤖 |
| 5 | 脚本：Employee 调用该端点 | 返回 403 Forbidden（仅 Admin） | 🤖 |
| 6 | 检查 CSV 内容 | System Overview, Issuance Trends, Top Performers, Skills Distribution 四个 section | 🤖 |

---

### UAT-A02: 分页标准化 (Story 11.16)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `GET /api/badges?page=1&limit=5` | 返回 `{ data: [...], meta: { page, limit, total, totalPages } }` | 🤖 |
| 2 | `GET /api/badge-templates?page=1&limit=5` | 同样的 `PaginatedResponse<T>` 格式 | 🤖 |
| 3 | `GET /api/admin/users?page=1&limit=5` | 同样格式 | 🤖 |
| 4 | 验证 `totalPages` 计算正确 | `Math.ceil(total / limit)` | 🤖 |
| 5 | 请求超出范围的页码 `page=9999` | 返回空 `data: []`，`meta` 仍有正确 `total` | 🤖 |

**脚本建议:** `uat-a02-pagination.ps1` — 遍历 5 个分页端点，逐个验证响应结构

---

### UAT-A03: 邮箱掩码端点完整性 (Story 11.7)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `GET /api/verify/:id` | issuerEmail 掩码 | 🤖 |
| 2 | `GET /api/badges/:id/assertion` | 合规要求：仍可返回完整信息（公开端点） | 🤖 |
| 3 | `GET /api/badges/:badgeId/embed` | 检查是否有邮箱字段泄露 | 🤖 |

---

## 五、代码质量验证（DX — 非用户可见）

### UAT-Q01: ESLint no-console (Story 11.21)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `cd backend && npx eslint src/` | 0 errors, 0 warnings | 🤖 |
| 2 | `cd frontend && npx eslint src/` | 0 errors, 0 warnings | 🤖 |

---

### UAT-Q02: TypeScript 编译 (验证 Story 11.10-12, 11.16)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `cd backend && npx tsc --noEmit` | 0 errors | 🤖 |
| 2 | `cd frontend && npx tsc --noEmit` | 0 errors | 🤖 |

---

### UAT-Q03: 测试套件完整性 (Story 11.10, 11.11, 11.12)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `cd backend && npx jest --forceExit` | 722 tests passed, 0 failed | 🤖 |
| 2 | `cd frontend && npx vitest run` | 541 tests passed, 0 failed | 🤖 |
| 3 | 合计 1,263 测试全部通过 | 无回归 | 🤖 |

---

### UAT-Q04: npm 安全审计 (Story 11.3, 11.14)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `cd backend && npm audit --omit=dev` | 0 vulnerabilities | 🤖 |
| 2 | `cd frontend && npm audit --omit=dev` | 0 vulnerabilities | 🤖 |

---

### UAT-Q05: Husky Pre-commit (Story 11.22)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 创建含中文注释的 .ts 文件，`git commit` | Pre-commit hook 拦截，报中文字符警告 | 🤖 |
| 2 | 创建含 ESLint error 的 .ts 文件，`git commit` | Pre-commit hook 拦截，报 lint 错误 | 🤖 |
| 3 | 提交正常文件 | 通过 pre-commit，成功提交 | 🤖 |

---

### UAT-Q06: NestJS Logger (Story 11.13)
**方式:** 🤖 脚本

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | 启动后端，观察启动日志 | 日志格式为 `[Nest] PID - TIMESTAMP LOG [ServiceName] message` | 🤖 |
| 2 | 搜索所有 `.ts` 源文件中的 `console.log` | 生产代码中 0 个 `console.log`（仅 spec/test 文件可有） | 🤖 |

---

## 六、业务回归测试（Sprint 7 功能回归）

### UAT-R01: 核心生命周期回归
**方式:** 🖐️ 手动 — 完整端到端流程必须人眼验证

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Admin 创建 Badge 模板（含技能、图片） | 创建成功，列表中可见 | 🖐️ |
| 2 | Admin/Issuer 颁发徽章给 Employee | 颁发成功，系统通知 | 🖐️ |
| 3 | Employee 登录，Wallet 中看到待认领徽章 | 待认领状态显示 | 🖐️ |
| 4 | Employee 认领徽章 | ClaimSuccessModal 弹出，含 visibility 提示 | 🖐️ |
| 5 | 通过邮件分享 | 邮件发送成功（或分享链接生成） | 🖐️ |
| 6 | 通过 LinkedIn 分享 | LinkedIn 弹窗打开 | 🖐️ |
| 7 | 打开公开验证页面 | 显示有效徽章，颁发者邮箱已掩码 | 🖐️ |
| 8 | Admin 撤销该徽章 | 验证页显示"已撤销"状态 | 🖐️ |

---

### UAT-R02: 批量颁发回归
**方式:** 🔀 混合

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | Admin 上传 CSV 文件进行批量颁发 | 文件上传成功，预览页面加载 | 🖐️ |
| 2 | 确认批量颁发 | 颁发完成，显示成功/失败统计 | 🖐️ |
| 3 | 下载错误报告（如有失败记录） | CSV 结构正确，中文正常 | 🖐️ |

---

### UAT-R03: 密码重置回归
**方式:** 🤖 脚本（API 层面验证）

| Step | 操作 | 预期结果 | 方式 |
|------|------|----------|------|
| 1 | `POST /api/auth/request-reset` | 返回 200（无论邮箱是否存在） | 🤖 |
| 2 | 使用有效 resetToken 重置密码 | 返回 200，密码更新 | 🤖 |
| 3 | 再次使用同一 resetToken | 返回 400（token 已使用） | 🤖 |

---

## 七、跨浏览器验证

### UAT-B01: 浏览器兼容性
**方式:** 🖐️ 手动

| 浏览器 | 测试重点 | 方式 |
|--------|----------|------|
| Chrome 120+ | 完整流程（主浏览器） | 🖐️ |
| Edge 120+ | 登录 + Cookie + 基本导航 | 🖐️ |
| Firefox 120+ | 登录 + Cookie SameSite 行为 | 🖐️ |

重点验证：
- httpOnly Cookie 在各浏览器中正常设置/清除
- LinkedIn 分享弹窗不被 popup blocker 拦截
- CSV 下载在各浏览器中正常触发

---

## 测试执行总览

### 按方式汇总

| 方式 | 场景数 | 预估时间 |
|------|--------|----------|
| 🖐️ 手动 | UAT-S04, F01, F02, F03, U01-U06, R01, B01 | ~4h |
| 🤖 脚本 | UAT-S03, S06, A02, A03, Q01-Q06, R03 | ~1h（含脚本编写） |
| 🔀 混合 | UAT-S01, S02, S05, S07, F01.9, U01, U04, A01, R02 | ~2h |
| **总计** | **25 个测试场景** | **~7h（1 天）** |

### 按优先级排序

| 优先级 | 场景 | 说明 |
|--------|------|------|
| **P0** | S01-S07, F01, F02 | 安全功能 + P0 新功能（必须全部通过） |
| **P1** | U01-U06, A01, R01 | UI 变更 + CSV 导出 + 核心回归 |
| **P2** | A02, A03, Q01-Q06, R02-R03, F03, B01 | 分页/质量/跨浏览器 |

### 通过标准

- **P0 场景:** 100% 通过，0 defect → 可合并到 main
- **P1 场景:** 100% 通过，允许 cosmetic defect（logged, 不阻塞合并）
- **P2 场景:** 90%+ 通过，允许 minor defect defer 到 Sprint 12

---

## 缺陷分类

| 等级 | 定义 | 处理方式 |
|------|------|----------|
| **Blocker** | 安全漏洞、数据丢失、无法登录 | 立即修复，重新测试 |
| **Critical** | 核心流程中断（颁发/认领失败） | 修复后再合并 |
| **Major** | 功能不完整但有 workaround | 评估是否阻塞合并 |
| **Minor** | UI 对齐、文案、样式细节 | 记录，defer 到 Sprint 12 |

---

## 可编写的自动化脚本清单

以下脚本建议放在 `backend/test-scripts/uat-sprint-11/` 目录：

| 脚本 | 覆盖场景 | 内容 |
|------|----------|------|
| `uat-s01-account-lockout.ps1` | S01 | 5 次错误登录 → 401 → DB 查询 lockedUntil →  清除 → 恢复 |
| `uat-s02-magic-byte.ps1` | S02 | 伪造文件上传 → 400；正常文件 → 200 |
| `uat-s06-log-check.ps1` | S06 | 触发操作 → 检查日志无明文 PII |
| `uat-a02-pagination.ps1` | A02 | 5 个分页端点结构验证 |
| `uat-q-quality-gates.ps1` | Q01-Q04 | eslint + tsc + jest + npm audit 一键验证 |
| `uat-r03-password-reset.ps1` | R03 | 密码重置 API 流程 |

---

**文档创建:** SM Agent (Bob) — 2026-02-14  
**审批:** 待 PO 确认后执行
