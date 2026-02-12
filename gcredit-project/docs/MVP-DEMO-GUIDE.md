# G-Credit MVP Demo 启动与演示指南

**Version:** v1.0.0  
**Last Updated:** 2026-02-12  

---

## 前置条件

- Node.js v20.20.0+  
- npm 10.8.2+  
- Azure PostgreSQL 数据库可访问（已配置在 `.env`）
- 两个终端窗口

---

## 第一步：启动后台 (NestJS, Port 3000)

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
```

等待看到以下输出即表示启动成功：
```
[Nest] LOG [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000
```

**验证后台运行：** 浏览器打开 http://localhost:3000/health → 应返回 200

**Swagger API 文档：** http://localhost:3000/api-docs （开发环境可用）

---

## 第二步：启动前台 (React + Vite, Port 5173)

打开**另一个终端窗口**：

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend
npm run dev
```

等待看到以下输出：
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**打开应用：** 浏览器访问 http://localhost:5173

---

## 第三步：登录

### Demo 账号（seed-uat 数据）

| 角色 | 邮箱 | 密码 | 可见菜单 |
|------|------|------|---------|
| **Admin** | `admin@gcredit.com` | `password123` | Dashboard, My Wallet, Badge Templates, Badge Management, Bulk Issuance, Analytics, Users |
| **Issuer** | `issuer@gcredit.com` | `password123` | Dashboard, My Wallet, Badge Templates, Badge Management, Bulk Issuance, Analytics |
| **Manager** | `manager@gcredit.com` | `password123` | Dashboard, My Wallet, Badge Management |
| **Employee** | `M365DevAdmin@2wjh85.onmicrosoft.com` | `password123` | Dashboard, My Wallet |

---

## 如需重置 Demo 数据

如果数据被改乱需要重置：

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm run seed:reset
```

> ⚠️ 这会清空数据库并重新填充 UAT 测试数据（4个用户、5个模板、11个徽章等）

---

## 常见问题

| 问题 | 解决 |
|------|------|
| 后台启动报 `ECONNREFUSED` | 检查 Azure PostgreSQL 是否可达，VPN 是否连接 |
| 前台白屏 | 确认后台已启动（Vite 代理 `/api` → `localhost:3000`） |
| 登录返回 `Invalid credentials` | 运行 `npm run seed:uat` 确保 demo 账号存在 |
| 端口被占用 | `netstat -ano | findstr :3000` 或 `:5173` 查看并终止占用进程 |

---

## 关闭服务

在各终端窗口按 `Ctrl + C` 即可停止前台和后台服务。

---
---

# Badge 全生命周期 Demo 演示脚本

> 以下按 Badge 从创建到验证/撤销的完整生命周期编排，建议按顺序演示。

---

## 🔵 阶段 1：Badge 模板创建（Admin/Issuer）

**目标：** 展示如何创建 Badge 模板（模板是颁发 Badge 的前提）

1. 用 `admin@gcredit.com` / `password123` **登录**
2. 进入 **Admin Dashboard** → 看到系统概览卡片（Total Users、Total Badges、Active Templates、System Health）
3. 点击左侧导航 **"Badge Templates"** → 进入模板列表页
   - 展示搜索框、状态筛选标签（All / Draft / Active / Archived）
   - 展示已有的 seed 模板
4. 点击右上角 **"Create Template"** 按钮
5. 填写表单：
   - **Template Name:** `Cloud Architecture Expert`
   - **Description:** `Awarded to employees who demonstrate expertise in cloud architecture`
   - **Category:** 选择 `Certification`
   - **Validity Period:** `365`（天）
   - **Issuance Criteria:** `完成 Cloud Architecture 认证考试并通过`
   - **Skills:** 选择相关技能
   - **Badge Image:** 点击 Browse 上传一张 JPG/PNG 图片（≤2MB）
6. 点击 **"Create Template"** → Toast 提示 "Template created successfully"
7. 返回模板列表 → 新模板显示为 **Draft** 状态（黄色标签）
8. 点击模板卡片上的 **"Activate"** 按钮 → 模板变为 **Active**（绿色标签）

> **演示要点：** 只有 Active 状态的模板才能用于颁发 Badge。

---

## 🔵 阶段 2：单个 Badge 颁发（Admin/Issuer）

**目标：** 展示管理员/颁发者如何给员工颁发 Badge

1. 点击左侧导航 **"Badge Management"** → 进入徽章管理列表
2. 或从 Dashboard 点击 **"Issue New Badge"** 快捷按钮
3. 在 Issue Badge 页面填写：
   - **Badge Template:** 选择刚创建的 `Cloud Architecture Expert`（仅显示 Active 模板）
   - **Recipient:** 从下拉选择 `M365Dev Admin`（Employee 角色用户）
   - **Evidence URL:** 可选，填入 `https://example.com/certificate/123`
   - **Expiry:** 可选，填入 `365`
4. 点击 **"Issue Badge"** → Toast 提示 "Badge issued successfully!"
5. 自动跳转到 Badge Management 列表 → 看到新颁发的 Badge 状态为 **Pending**（黄色）

> **演示要点：** Badge 颁发后状态为 Pending，需要接收者 Claim 后才变成 Claimed。

---

## 🔵 阶段 3：批量 Badge 颁发（Admin/Issuer）

**目标：** 展示通过 CSV 文件批量颁发 Badge 的流程

1. 点击左侧导航 **"Bulk Issuance"**
2. 看到步骤提示：**1 Download → 2 Upload → 3 Preview → 4 Confirm**
3. （可选）选择一个模板以预填充 CSV 中的 Template ID
4. 点击 **"Download CSV Template"** → 下载 CSV 模板文件
5. 用 Excel 打开 CSV，填入多条记录（收件人邮箱、模板ID、evidence 等）
6. 将填好的 CSV 拖拽到上传区域（或点击 Browse 选择文件）
7. 点击 **"Upload CSV"**
   - 如果数据有错误 → 显示验证摘要（valid/error 计数）
   - 如果数据正确 → 自动进入 Preview 页面
8. Preview 页面：
   - 查看数据表格（搜索/筛选/分页）
   - 确认无误后点击 **"Issue All Valid Badges"**
   - 确认弹窗 → 点击确认
9. 处理进度条显示 → 完成后显示成功/失败统计

> **演示要点：** 支持最多 20 条记录/次，100KB 文件限制。有错误时可查看错误报告。

---

## 🔵 阶段 4：员工收到 Badge + Claim（Employee）

**目标：** 展示员工视角 — 收到 Badge 通知并认领

1. **登出 Admin 账号** → 点击右上角 **"Sign Out"**
2. 用 `M365DevAdmin@2wjh85.onmicrosoft.com` / `password123` **登录**
3. 进入 Employee Dashboard：
   - 看到 Badge 统计卡片（Total Badges、Claimed This Month、Pending）
   - 如果有新 Badge → 弹出 🎉 **庆祝动画弹窗**
4. 点击 **"View Wallet"** 或左侧导航 **"My Wallet"**
5. **Badge Wallet 页面：**
   - **时间线视图**（默认）：按月份分组展示 Badge 卡片
   - 可切换为 **Grid 视图**
   - 搜索框 + 技能筛选 + 日期范围 + 状态筛选
6. 点击一张 **Pending** 状态的 Badge 卡片 → 打开 **Badge Detail Modal**
7. 在弹窗中查看：
   - Badge 图片、名称、状态、颁发日期、类别
   - 描述、技能标签、颁发标准
   - Evidence 文件（如有）
   - 时间线（issued → claimed → expires）
8. 点击底部 **"Claim Badge"** 按钮（绿色）
   - Badge 状态变为 **Claimed** ✅
   - 弹出 🎉 **Claim 成功庆祝动画**
   - Toast 提示 "Badge claimed!"

> **演示要点：** Claim 是员工确认接收 Badge 的动作，只有 Pending 状态的 Badge 可以 Claim。

---

## 🔵 阶段 5：Badge 分享（Employee）

**目标：** 展示 Badge 持有者如何分享自己的 Badge

1. 在 Badge Detail Modal 中（Badge 已 Claimed），点击 **"Share Badge"** 按钮
2. 打开 **Share Modal**，有 3 个标签页：

### 📧 Email 标签页
- 输入收件人邮箱（逗号分隔可填多个）
- 输入自定义消息
- 点击 **"Send via Email"** → 通过 M365 Graph API 发送邮件
- Toast 提示成功

### 💬 Teams 标签页
- 可选填 Team ID 和 Channel ID（留空使用默认）
- 输入自定义消息
- 点击 **"Share to Teams"** → 发送到 Microsoft Teams 频道

### 🔗 Widget 标签页
- 点击 **"Open Widget Generator"** → 新标签页打开嵌入式 Widget 配置器
  - 选择尺寸（small / medium / large）
  - 选择主题（light / dark / auto）
  - 实时预览
  - 复制 iframe 嵌入代码或独立 HTML 代码
- 或直接点击 **"Copy Widget Link"** 复制链接

3. 关闭 Share Modal 后，点击 **"Download PNG"** → 下载 Badge 图片文件

> **演示要点：** 三种分享渠道覆盖不同场景。Widget 可嵌入到任何网页（如个人博客、LinkedIn profile）。

---

## 🔵 阶段 6：Badge 公开验证（任何人，无需登录）

**目标：** 展示 Badge 的可信验证 — G-Credit 的核心价值

1. 在 Badge Detail Modal 的 Verification 区域，**复制验证链接**（格式：`http://localhost:5173/verify/xxxxxx`）
2. **打开浏览器隐身窗口**（模拟外部人员/HR/猎头）
3. 粘贴验证链接并访问
4. 看到 **公开验证页面**：
   - ✅ 绿色 "Verified Credential" 状态提示
   - Badge 详情卡片（名称、描述、接收者、颁发者、日期）
   - Evidence 文件（如有）
   - **"Download Assertion"** 按钮（下载 JSON-LD 格式的数字凭证）
5. 无需登录即可验证，任何人都可通过链接确认 Badge 真实性

> **演示要点：** 这是数字凭证系统的核心功能 — 可信的第三方验证。即使离开公司，Badge 验证链接仍然有效。

---

## 🔵 阶段 7：Badge 撤销（Admin）

**目标：** 展示管理员撤销 Badge 及其对验证的影响

1. **登出 Employee** → 用 `admin@gcredit.com` **登录**
2. 进入 **"Badge Management"** 列表
3. 找到一个 Claimed 状态的 Badge → 点击 **"Revoke"** 按钮（红色）
4. 在撤销弹窗中：
   - **Reason:** 选择撤销原因（如 `Policy Violation`、`Expired Certification` 等）
   - **Notes:** 填写备注说明（可选，最多 1000 字符）
   - 点击 **"Revoke Badge"**
5. Badge 状态变为 **Revoked**（红色标签）
6. **验证撤销效果：**
   - 用之前的验证链接在隐身窗口刷新
   - 验证页面现在显示 ❌ 红色撤销警告
   - 显示撤销时间、原因（如果标记为公开可见）
   - Badge 信息标记为 "Historical Information Only"

> **演示要点：** 撤销后公开验证页面立即反映，任何持有验证链接的人都能看到 Badge 已被撤销。

---

## 📊 完整生命周期总结

```
模板创建 (Draft) → 模板激活 (Active) → Badge 颁发 (Pending)
    → 员工认领 (Claimed) → 分享 (Email/Teams/Widget)
    → 公开验证 (任何人可验证)
    → [可选] 撤销 (Revoked) → 验证页显示撤销状态
    → [可选] 过期 (Expired) → 验证页显示过期提示
```

---

## 路由速查表

| 路由 | 页面 | 角色 | 公开? |
|------|------|------|-------|
| `/login` | 登录 | — | 是 |
| `/` | Dashboard | 所有登录用户 | 否 |
| `/wallet` | Badge Wallet | 所有登录用户 | 否 |
| `/profile` | 个人资料 | 所有登录用户 | 否 |
| `/claim?token=xxx` | 邮件链接认领 | 所有登录用户 | 否 |
| `/verify/:id` | 公开验证 | — | **是** |
| `/badges/:id/embed` | 嵌入式 Widget | — | **是** |
| `/admin/templates` | 模板列表 | Admin, Issuer | 否 |
| `/admin/templates/new` | 创建模板 | Admin, Issuer | 否 |
| `/admin/templates/:id/edit` | 编辑模板 | Admin, Issuer | 否 |
| `/admin/badges` | Badge 管理 | Admin, Issuer, Manager | 否 |
| `/admin/badges/issue` | 颁发 Badge | Admin, Issuer | 否 |
| `/admin/bulk-issuance` | 批量颁发 | Admin, Issuer | 否 |
| `/admin/analytics` | 数据分析 | Admin, Issuer | 否 |
| `/admin/users` | 用户管理 | Admin | 否 |
