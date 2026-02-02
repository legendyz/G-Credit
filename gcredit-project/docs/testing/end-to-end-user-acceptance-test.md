# G-Credit - 完整用户端到端验收测试手册

**测试类型:** End-to-End User Acceptance Test (E2E UAT)  
**测试范围:** Badge完整生命周期 (创建→发放→认领→分享→撤销→验证)  
**测试方式:** 真实用户界面操作 (非API测试)  
**目标用户:** Product Owner, QA, 业务用户  
**创建日期:** 2026-02-02  
**最后更新:** 2026-02-02  
**适用版本:** Sprint 7 (v0.7.0+)

---

## 📋 测试文档概述

本文档提供**完整的真实用户操作测试流程**，从零开始启动系统，到完成Badge全生命周期的每一个环节。所有操作都通过**Web界面**完成，模拟真实业务场景。

### 📐 测试覆盖范围

| Epic | 功能模块 | 测试场景数 | 前端页面 |
|------|---------|-----------|---------|
| Epic 2 | 用户认证 | 3 | ✅ LoginPage |
| Epic 3 | Badge模板管理 | 5 | ✅ BadgeManagementPage |
| Epic 4 | Badge发放 | 4 | ✅ BadgeManagementPage |
| Epic 5 | Employee钱包 | 6 | ✅ TimelineView + BadgeDetailModal |
| Epic 6 | Badge验证 | 2 | ✅ VerifyBadgePage (公共) |
| Epic 7 | Badge分享 | 4 | ✅ BadgeShareModal + BadgeEmbedPage |
| Epic 9 | Badge撤销 | 3 | ✅ RevokedBadgeAlert + RevocationSection |

**总计:** 27个真实用户测试场景

---

## 🎯 测试前提条件

### 系统要求
- ✅ Node.js 20.20.0 LTS 已安装
- ✅ PostgreSQL 16 数据库可访问
- ✅ Azure Blob Storage 已配置 (badge图片存储)
- ✅ Git 已安装 (获取代码)

### 浏览器要求
- **推荐:** Chrome 120+ 或 Edge 120+ (Chromium内核)
- **支持:** Firefox 120+, Safari 17+
- **屏幕分辨率:** 最小 1280x720 (测试响应式设计)

### 测试账号准备
测试需要以下4个角色的账号 (通过seed script自动创建):
- **Admin** - 系统管理员 (可创建模板、发放、撤销)
- **Issuer** - Badge发放者 (可创建模板、发放)
- **Manager** - 团队经理 (可查看团队成员badges)
- **Employee** - 普通员工 (可认领、分享badges)

---

## 📦 Phase 0: 环境准备与数据注入

### Step 0.1: 获取代码并安装依赖 (首次执行)

```powershell
# 1. 克隆代码库 (如已克隆，跳过)
cd C:\G_Credit\CODE
# git clone <repository-url> gcredit-project

# 2. 进入项目目录
cd gcredit-project

# 3. 安装后端依赖
cd backend
npm install

# 4. 安装前端依赖
cd ..\frontend
npm install

cd ..
```

**预期结果:** 
- ✅ 所有依赖安装成功，无错误
- ✅ node_modules 文件夹已创建

---

### Step 0.2: 配置环境变量

#### 后端配置 (.env)

```powershell
# 进入后端目录
cd backend

# 复制环境变量模板 (如果.env不存在)
Copy-Item .env.example .env -ErrorAction SilentlyContinue
```

**编辑 `backend/.env` 文件:**

```ini
# Database (Azure PostgreSQL Flexible Server)
DATABASE_URL="postgresql://username:password@your-db-host:5432/postgres?sslmode=require"

# Azure Blob Storage (Badge Images)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=gcreditdevstoragelz;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstoragelz"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"

# JWT Authentication
JWT_SECRET="your-secure-jwt-secret-at-least-32-characters-long"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# Frontend URL (CORS)
FRONTEND_URL="http://localhost:5173"

# Email Notification (Optional - 可不配置)
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
EMAIL_FROM="noreply@gcredit.com"
```

**⚠️ 重要提示:**
- `JWT_SECRET` 必须至少32字符 (否则启动失败)
- `DATABASE_URL` 替换为您的Azure PostgreSQL连接字符串
- `AZURE_STORAGE_CONNECTION_STRING` 替换为您的Azure Storage密钥
- SMTP配置可选 (没有配置时，邮件通知会记录在控制台)

#### 前端配置 (可选)

前端默认连接 `http://localhost:3000`，如需修改:

```powershell
# 创建 frontend/.env
cd ..\frontend
New-Item -ItemType File -Path .env -Force
```

**编辑 `frontend/.env`:**

```ini
VITE_API_BASE_URL=http://localhost:3000
```

---

### Step 0.3: 数据库迁移与种子数据注入

```powershell
# 进入后端目录
cd backend

# 1. 运行数据库迁移 (创建所有表)
node_modules\.bin\prisma migrate dev

# 如果提示 "Enter a name for the new migration"，输入: "uat_setup"

# 2. 注入测试种子数据 (Demo模式)
npm run seed:demo
```

**seed:demo 会创建什么数据？**

✅ **4个测试账号:**
| Role | Email | Password | 说明 |
|------|-------|----------|------|
| ADMIN | admin@example.com | testpass123 | 系统管理员 |
| ISSUER | issuer@example.com | testpass123 | Badge发放者 |
| MANAGER | manager@example.com | testpass123 | 团队经理 |
| EMPLOYEE | employee@example.com | testpass123 | 普通员工 |

✅ **5个Badge模板:**
- Advanced React Development
- Azure Cloud Architecture
- Agile Project Management
- Data Science Fundamentals
- Team Leadership Excellence

✅ **10个Badge实例 (各种状态):**
- 3个 ISSUED (待认领)
- 4个 CLAIMED (已认领)
- 2个 REVOKED (已撤销)
- 1个 EXPIRED (已过期)

**预期输出示例:**

```
🌱 Starting demo seed (local mode)...

🔐 Creating test users...
✅ Admin:     admin@example.com / testpass123
✅ Issuer:    issuer@example.com / testpass123
✅ Manager:   manager@example.com / testpass123
✅ Employee:  employee@example.com / testpass123

🎨 Creating badge templates...
✅ Created: Advanced React Development
✅ Created: Azure Cloud Architecture
✅ Created: Agile Project Management
✅ Created: Data Science Fundamentals
✅ Created: Team Leadership Excellence

🎖️ Creating badge instances...
✅ Badge 1: ISSUED (待认领)
✅ Badge 2: CLAIMED (已认领)
✅ Badge 3: REVOKED (已撤销)
... (total 10 badges)

✅ Demo data seeded successfully!

📋 You can now test with:
   - Admin login:    admin@example.com / testpass123
   - Employee login: employee@example.com / testpass123
```

**⚠️ 注意:**
- 如果需要重新注入数据，再次运行 `npm run seed:demo` (会清除旧数据)
- 数据库迁移只需运行一次 (除非schema有变化)

---

### Step 0.4: 启动后端服务器

**在新的 PowerShell 窗口:**

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend

# 启动开发服务器
npm run start:dev
```

**预期输出:**

```
[Nest] 12345  - 2026/02/02 14:30:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2026/02/02 14:30:00     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 2026/02/02 14:30:01     LOG [RoutesResolver] AppController {/}:
[Nest] 12345  - 2026/02/02 14:30:01     LOG [RouterExplorer] Mapped {/, GET} route
[Nest] 12345  - 2026/02/02 14:30:01     LOG [NestApplication] Nest application successfully started
✅ Backend server running on http://localhost:3000
```

**验证后端运行:**

在浏览器访问: **http://localhost:3000/api-docs**

应该看到 **Swagger API 文档页面** (OpenAPI 界面)

**⚠️ 重要:** 保持此PowerShell窗口打开，后端服务器需要持续运行

---

### Step 0.5: 启动前端开发服务器

**在另一个新的 PowerShell 窗口:**

```powershell
cd C:\G_Credit\CODE\gcredit-project\frontend

# 启动前端开发服务器
npm run dev
```

**预期输出:**

```
VITE v7.3.1  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**验证前端运行:**

在浏览器访问: **http://localhost:5173**

应该看到 **G-Credit登录页面**

**⚠️ 重要:** 保持此PowerShell窗口打开，前端服务器需要持续运行

---

### ✅ Phase 0 完成检查清单

- [ ] 后端服务器运行在 **http://localhost:3000**
- [ ] 前端应用运行在 **http://localhost:5173**
- [ ] Swagger API文档可访问 (http://localhost:3000/api-docs)
- [ ] 登录页面显示正常 (http://localhost:5173)
- [ ] 种子数据已注入 (4个用户 + 5个模板 + 10个badges)
- [ ] 两个PowerShell窗口保持运行

**如果全部勾选 ✅，可以开始正式测试！**

---

## 🧪 Phase 1: 用户认证测试 (Epic 2)

### 测试场景 1.1: Admin登录

**测试目标:** 验证Admin角色可以登录并访问管理功能

**操作步骤:**

1. 在浏览器打开: **http://localhost:5173**
2. 应该看到登录页面，包含:
   - Email输入框
   - Password输入框
   - "Sign In" 按钮
3. 输入Admin凭据:
   - Email: `admin@example.com`
   - Password: `testpass123`
4. 点击 **"Sign In"** 按钮

**预期结果:**

✅ **登录成功:**
- 页面跳转到 `/` (Employee Badge Wallet页面)
- 顶部导航栏显示:
  - "G-Credit" Logo (左侧)
  - "Badge Wallet" 链接
  - "Badge Management" 链接 (Admin可见)
  - "Analytics" 链接 (Admin可见)
  - "admin@example.com" 用户信息
  - "Logout" 按钮

✅ **导航权限验证:**
- Admin可以看到所有导航选项 (Wallet, Badge Management, Analytics)
- 右上角显示当前用户: "admin@example.com"

**截图位置:** `docs/testing/screenshots/1-1-admin-login-success.png`

---

### 测试场景 1.2: Employee登录

**测试目标:** 验证Employee角色只能访问自己的钱包

**操作步骤:**

1. 点击右上角 **"Logout"** 按钮 (如已登录Admin)
2. 确认返回登录页面
3. 输入Employee凭据:
   - Email: `employee@example.com`
   - Password: `testpass123`
4. 点击 **"Sign In"** 按钮

**预期结果:**

✅ **登录成功:**
- 页面跳转到 `/` (Employee Badge Wallet页面)
- 顶部导航栏显示:
  - "G-Credit" Logo
  - "Badge Wallet" 链接
  - **没有** "Badge Management" 和 "Analytics" 链接 (Employee无权限)
  - "employee@example.com" 用户信息
  - "Logout" 按钮

✅ **权限隔离验证:**
- Employee只能看到 "Badge Wallet" 导航
- 无法访问管理功能

---

### 测试场景 1.3: 登录失败处理

**测试目标:** 验证错误凭据的错误提示

**操作步骤:**

1. 登出当前用户 (如已登录)
2. 输入错误凭据:
   - Email: `admin@example.com`
   - Password: `wrongpassword`
3. 点击 **"Sign In"** 按钮

**预期结果:**

❌ **登录失败:**
- 页面停留在登录页面
- 显示错误Toast消息: "Invalid credentials" (右上角红色提示)
- Email和Password输入框未清空 (方便用户修正)

---

## 🎨 Phase 2: Badge模板管理测试 (Epic 3)

**前置条件:** 以 **Admin** 身份登录

### 测试场景 2.1: 查看Badge模板列表

**操作步骤:**

1. 确认已以Admin身份登录
2. 点击顶部导航栏 **"Badge Management"** 链接
3. 页面应该跳转到 `/admin/badges`

**预期结果:**

✅ **模板列表页面显示:**
- 页面标题: "Badge Management"
- 5个Badge模板卡片显示 (来自seed数据):
  1. Advanced React Development
  2. Azure Cloud Architecture
  3. Agile Project Management
  4. Data Science Fundamentals
  5. Team Leadership Excellence

✅ **每个模板卡片显示:**
- Badge图片 (如果有)
- Badge名称
- Badge描述 (简短版本)
- 状态标签 (ACTIVE / DRAFT / ARCHIVED)
- 操作按钮: "Edit", "Issue Badge", "View Details"

---

### 测试场景 2.2: 创建新Badge模板

**操作步骤:**

1. 在Badge Management页面，点击 **"Create New Badge"** 按钮
2. 填写新Badge模板表单:
   - **Name:** `Customer Service Excellence`
   - **Description:** `Awarded to employees who demonstrate exceptional customer service skills`
   - **Category:** `Soft Skills`
   - **Status:** `ACTIVE`
   - **Validity Period:** `365` days
   - **Issuance Criteria:** (可选文本)
     ```
     - Consistent positive customer feedback (4.5+ rating)
     - Zero escalations in past 6 months
     - Completed customer service training
     ```
   - **Badge Image:** (可选) 点击 "Upload Image" 选择本地图片
3. 点击 **"Create Badge Template"** 按钮

**预期结果:**

✅ **模板创建成功:**
- 显示成功Toast消息: "Badge template created successfully"
- 返回模板列表页面
- 新模板 "Customer Service Excellence" 出现在列表顶部
- 新模板显示 "ACTIVE" 状态标签

**错误处理测试:**
- 尝试提交空Name: 应显示验证错误 "Name is required"
- 尝试上传超大图片 (>5MB): 应显示 "Image size must be less than 5MB"

---

### 测试场景 2.3: 编辑Badge模板

**操作步骤:**

1. 在模板列表中，找到刚创建的 "Customer Service Excellence"
2. 点击 **"Edit"** 按钮
3. 修改描述:
   - **Description:** `Awarded to employees who consistently exceed customer service expectations and receive outstanding feedback`
4. 将状态改为 **DRAFT**
5. 点击 **"Save Changes"** 按钮

**预期结果:**

✅ **模板更新成功:**
- 显示成功Toast: "Badge template updated successfully"
- 返回模板列表
- 模板状态变为 "DRAFT" (灰色标签)
- 描述已更新 (可以通过 "View Details" 查看)

---

### 测试场景 2.4: 查看模板详情

**操作步骤:**

1. 在模板列表中，点击任意模板的 **"View Details"** 按钮
2. 应该打开模板详情模态框 (Modal)

**预期结果:**

✅ **详情模态框显示:**
- Badge图片 (如果有)
- 完整的Badge名称
- 完整的描述
- Category
- Status (状态标签)
- Validity Period (有效期)
- Issuance Criteria (颁发标准)
- Created Date (创建日期)
- Created By (创建人: Admin)
- **操作按钮:**
  - "Issue Badge" (发放Badge)
  - "Edit" (编辑)
  - "Close" (关闭)

---

### 测试场景 2.5: 搜索Badge模板

**操作步骤:**

1. 在Badge Management页面顶部，找到搜索框
2. 输入关键词: `React`
3. 按回车或等待自动搜索

**预期结果:**

✅ **搜索结果过滤:**
- 列表只显示匹配的模板: "Advanced React Development"
- 其他模板被隐藏
- 搜索框显示输入的关键词

**清除搜索:**
- 清空搜索框，按回车
- 所有模板重新显示 (5个原始模板 + 新创建的)

---

## 🎖️ Phase 3: Badge发放测试 (Epic 4)

**前置条件:** 以 **Admin** 或 **Issuer** 身份登录

### 测试场景 3.1: 单个Badge发放

**操作步骤:**

1. 确认已登录Admin
2. 在Badge Management页面，找到 "Advanced React Development" 模板
3. 点击 **"Issue Badge"** 按钮
4. 填写发放表单:
   - **Recipient Email:** `employee@example.com`
   - **Evidence URL (可选):** `https://github.com/employee/react-project`
   - **Custom Message (可选):** `Congratulations on completing the advanced React course!`
   - **Expiration:** `365 days from now` (默认)
5. 点击 **"Issue Badge"** 按钮

**预期结果:**

✅ **发放成功:**
- 显示成功Toast: "Badge issued successfully"
- 返回模板列表或发放记录页面
- (可选) 如果配置了SMTP，employee@example.com 会收到Badge通知邮件

✅ **数据库状态:**
- 新Badge创建，状态为 `ISSUED` (待认领)
- 包含claim token (用于认领)

**验证Badge状态:**
1. 登出Admin
2. 以Employee身份登录 (`employee@example.com / testpass123`)
3. 应该在Badge Wallet看到新的Badge (状态: "Pending" 或 "Unclaimed")

---

### 测试场景 3.2: 批量Badge发放 (CSV)

**⚠️ 注意:** 此功能属于 **Epic 8** (未完成)，当前版本**不可用**。

**预期结果:** 
- Badge Management页面应该**没有** "Bulk Issue" 或 "Upload CSV" 按钮
- 这是正常的 (Epic 8在Sprint 9开发)

---

### 测试场景 3.3: 查看已发放Badge记录

**操作步骤:**

1. 确认已登录Admin或Issuer
2. 在Badge Management页面，点击 **"Issued Badges"** 标签页 (如果有)
3. 或者访问: `/admin/badges/issued`

**预期结果:**

✅ **已发放Badge列表显示:**
- 表格或卡片列表显示所有已发放的Badges
- 每条记录包含:
  - Badge名称 (模板)
  - Recipient (接收人email)
  - Status (ISSUED / CLAIMED / REVOKED)
  - Issued Date (发放日期)
  - Claimed Date (认领日期, 如果已认领)

✅ **筛选功能 (如果有):**
- 可以按Status筛选 (All / Issued / Claimed / Revoked)
- 可以搜索Recipient email

---

### 测试场景 3.4: 无权限用户无法发放Badge

**操作步骤:**

1. 登出当前用户
2. 以Employee身份登录 (`employee@example.com / testpass123`)
3. 尝试访问 `/admin/badges`

**预期结果:**

❌ **权限拒绝:**
- 页面跳转到 `/` (Badge Wallet)
- 或显示 "403 Forbidden" 错误页面
- Toast消息: "You don't have permission to access this page"

✅ **导航隔离:**
- Employee导航栏没有 "Badge Management" 链接
- 无法通过URL直接访问

---

## 👛 Phase 4: Employee Badge钱包测试 (Epic 5)

**前置条件:** 以 **Employee** 身份登录

### 测试场景 4.1: 查看Badge钱包 (Timeline View)

**操作步骤:**

1. 确认已以Employee身份登录
2. 点击顶部导航 **"Badge Wallet"** 或访问 `/`
3. 应该看到Timeline视图 (时间轴布局)

**预期结果:**

✅ **Timeline View显示:**
- 页面标题: "My Badges" 或 "Badge Wallet"
- Badges按时间倒序排列 (最新的在上方)
- 每个Badge卡片显示:
  - Badge图片
  - Badge名称
  - 颁发日期 (Issued Date)
  - 状态标签 (CLAIMED / PENDING / REVOKED)
  - 快速操作按钮: "View Details", "Share" (如果已认领)

✅ **日期分组 (如果实现):**
- Badges按月份分组: "February 2026", "January 2026", etc.
- 每个分组显示badge数量

✅ **Empty State (如果没有badge):**
- 显示友好提示: "You don't have any badges yet"
- 显示插图或图标
- 提示文字: "Complete learning programs to earn your first badge!"

---

### 测试场景 4.2: 查看Badge详情 (Badge Detail Modal)

**操作步骤:**

1. 在Badge Wallet中，点击任意已认领的Badge
2. 应该打开Badge详情模态框

**预期结果:**

✅ **详情模态框显示 (10个子组件):**

**1. Hero区域:**
- Badge大图 (400x400px 或更大)
- Badge名称
- 状态标签 (CLAIMED)
- Issuer信息 (发放人)

**2. Badge元数据:**
- Issued Date: 2026-01-15
- Claimed Date: 2026-01-16
- Expiration Date: 2027-01-15 (如果有)
- Verification ID: abc123... (带复制按钮)

**3. Badge描述:**
- 完整的badge描述文本
- Issuance Criteria (颁发标准)

**4. Issuer Message (如果有):**
- 发放者留言: "Congratulations on..."
- Issuer信息 (名字、职位)

**5. Evidence Section (证据文件):**
- 证据文件列表 (如果有)
- 文件名、大小、上传日期
- "Download" 按钮 (生成SAS token下载)

**6. Skills & Competencies (如果关联):**
- 关联的技能标签
- 技能分类

**7. Similar Badges (推荐):**
- 3-5个相似badge推荐
- 基于技能、类别、发放者相似度
- 点击可查看详情

**8. Milestones (里程碑，如果达成):**
- "🎉 First Badge!" (第一个badge)
- "🏆 5 Badges Earned" (累计5个)
- 显示达成日期

**9. Revocation Section (如果已撤销):**
- ⚠️ 警告横幅: "This badge has been revoked"
- Revocation Date
- Revocation Reason: "Policy Violation"
- Revocation Notes: "Employee left organization"

**10. Report Issue (问题反馈):**
- "Report an Issue" 按钮
- 点击展开表单: Issue Type, Description
- Submit按钮 (发送邮件到 g-credit@outlook.com)

✅ **操作按钮区域:**
- "Share" 按钮 (打开分享模态框)
- "Download" 按钮 (下载JSON-LD assertion)
- "Verify" 按钮 (打开公共验证页面)
- "Close" 按钮 (关闭模态框)

---

### 测试场景 4.3: Badge认领 (Claim Badge)

**前置条件:** 有一个状态为 `ISSUED` (待认领) 的Badge

**操作步骤:**

1. 在Badge Wallet中，找到状态为 "Pending" 的Badge
2. Badge卡片上应该显示 **"Claim Badge"** 按钮
3. 点击 **"Claim Badge"** 按钮

**预期结果:**

✅ **认领成功:**
- 显示成功Toast: "Badge claimed successfully!"
- Badge状态从 "Pending" 变为 "Claimed"
- Badge卡片显示绿色 "CLAIMED" 标签
- Claimed Date 更新为当前日期
- **"Claim Badge" 按钮消失**，变为 "View Details" 和 "Share"

✅ **认领确认模态框 (如果实现):**
- 可能弹出确认模态框: "Congratulations! You've earned this badge"
- 显示Badge图片和名称
- "View Badge" 按钮 (查看详情)
- "Share Now" 按钮 (立即分享)

---

### 测试场景 4.4: 下载Badge证据文件

**前置条件:** Badge包含证据文件 (Evidence Files)

**操作步骤:**

1. 打开包含证据文件的Badge详情模态框
2. 在 "Evidence" 区域，点击任意文件的 **"Download"** 按钮

**预期结果:**

✅ **文件下载成功:**
- 浏览器开始下载文件 (通过SAS token)
- 文件名正确: `evidence-filename.pdf`
- 文件大小匹配 (最大10MB)

✅ **SAS Token安全性:**
- SAS token有效期: 5分钟
- 5分钟后链接失效 (安全性验证)
- 无法通过URL直接访问 (需要认证生成token)

---

### 测试场景 4.5: 提交Badge问题反馈

**操作步骤:**

1. 打开任意Badge详情模态框
2. 滚动到底部，点击 **"Report an Issue"** 按钮
3. 填写问题反馈表单:
   - **Issue Type:** 下拉选择 (e.g., "Incorrect Information")
   - **Description:** `The badge issue date is incorrect, should be January 10, not January 15`
4. 点击 **"Submit Report"** 按钮

**预期结果:**

✅ **反馈提交成功:**
- 显示成功Toast: "Issue reported successfully. Our team will review it."
- 表单自动关闭或清空
- (后端) 发送邮件到 `g-credit@outlook.com` (如果配置SMTP)
- 或记录到控制台日志

---

### 测试场景 4.6: 查看里程碑成就 (Milestones)

**操作步骤:**

1. 在Badge Wallet页面顶部或侧边栏
2. 应该有 **"Milestones"** 或 **"Achievements"** 区域
3. 查看当前已达成的里程碑

**预期结果:**

✅ **里程碑显示:**
- 🎉 **First Badge** - 2026-01-15 (获得第一个badge)
- 🏆 **5 Badges Earned** - 2026-01-28 (累计5个badges)
- 🌟 **Skill Expert: React** - 2026-02-01 (获得3个React相关badges)
- 📅 **1 Year Anniversary** - (如果注册满1年)

✅ **未达成里程碑 (灰色/锁定):**
- 🔒 10 Badges Earned (Progress: 5/10)
- 🔒 Badge Master (50 badges)

✅ **Admin配置 (如果有管理界面):**
- Admin可以创建自定义里程碑
- 配置条件: badge数量、技能轨道、周年纪念等

---

## ✅ Phase 5: Badge验证测试 (Epic 6)

**前置条件:** 有一个已认领的Badge (状态: CLAIMED)

### 测试场景 5.1: 公共验证页面 (Public Verification)

**操作步骤:**

1. 以Employee身份登录，打开任意已认领Badge的详情
2. 找到 **Verification ID** 或 **Verification URL**
3. 复制Verification URL (例如: `http://localhost:5173/verify/abc123-def456`)
4. **在隐私浏览窗口打开** (模拟外部访客，未登录)

**预期结果:**

✅ **公共验证页面显示 (无需登录):**

**页面标题:** "Verify Badge"

**Badge信息展示:**
- Badge大图
- Badge名称: "Advanced React Development"
- Badge描述
- ✅ **Verification Status: VALID** (绿色勾选)

**Issuer信息:**
- Issuer Name: "G-Credit Team"
- Issuer Organization: "Your Company"
- Issuer Website: https://yourcompany.com

**Recipient信息:**
- ⚠️ **隐私保护:** 只显示部分信息 (e.g., "John D." 或 "J***n Doe")
- Issued Date: 2026-01-15
- Claimed Date: 2026-01-16

**Verification信息:**
- Verification ID: abc123-def456
- Verification URL: http://localhost:5173/verify/abc123-def456
- Verification Date: 2026-02-02 (当前日期)
- Status: ✅ VALID

**Open Badges 2.0 Assertion:**
- "View JSON-LD" 按钮
- 点击后显示完整的Open Badges 2.0 JSON assertion
- 可以复制或下载JSON文件

---

### 测试场景 5.2: 已撤销Badge的验证页面

**操作步骤:**

1. (需要Admin先撤销一个badge - 见Phase 7)
2. 获取已撤销badge的Verification URL
3. 在隐私浏览窗口打开

**预期结果:**

❌ **验证页面显示撤销状态:**

**Verification Status: ❌ REVOKED** (红色警告)

**撤销信息显示:**
- ⚠️ 警告横幅: "This badge has been revoked and is no longer valid"
- Revoked Date: 2026-01-25
- Revocation Reason: "Policy Violation"
- Original Issue Date: 2026-01-15

**其他信息:**
- Badge基本信息仍然显示 (透明度降低或灰色)
- Issuer和Recipient信息
- 但明确标注: "Not Valid" 或 "Revoked"

**Open Badges 2.0 Compliance:**
- JSON-LD assertion 中包含 `revoked: true` 字段
- `revocationReason` 字段

---

## 🔗 Phase 6: Badge分享测试 (Epic 7)

**前置条件:** 以Employee身份登录，有已认领的Badge

### 测试场景 6.1: 打开分享模态框

**操作步骤:**

1. 在Badge Wallet中，点击已认领badge的 **"Share"** 按钮
2. 或在Badge详情模态框中，点击 **"Share"** 按钮

**预期结果:**

✅ **分享模态框显示 (BadgeShareModal):**

**模态框标题:** "Share Your Badge"

**分享选项 (4个平台):**

**1. LinkedIn分享:**
- LinkedIn图标 (蓝色)
- "Share on LinkedIn" 按钮
- 说明文字: "Share your achievement with your professional network"

**2. Email分享:**
- Email图标
- "Share via Email" 按钮
- 说明文字: "Send badge details to friends or colleagues"

**3. 公共链接复制:**
- Link图标
- "Copy Public Link" 按钮
- 显示完整的公共验证URL
- 点击后自动复制到剪贴板

**4. 嵌入代码 (Widget):**
- Code图标
- "Get Embed Code" 按钮
- 说明文字: "Embed badge on your personal website"

---

### 测试场景 6.2: LinkedIn分享

**操作步骤:**

1. 在分享模态框中，点击 **"Share on LinkedIn"** 按钮

**预期结果:**

✅ **LinkedIn分享窗口:**
- 打开新窗口/标签页 (LinkedIn分享界面)
- URL包含LinkedIn分享参数:
  ```
  https://www.linkedin.com/sharing/share-offsite/?url=http://localhost:5173/verify/abc123
  ```
- 预填充内容:
  - Title: "I earned a badge: Advanced React Development"
  - Description: Badge描述
  - Image: Badge图片URL

⚠️ **注意:** 需要LinkedIn账号登录才能完成分享

---

### 测试场景 6.3: 复制公共验证链接

**操作步骤:**

1. 在分享模态框中，点击 **"Copy Public Link"** 按钮

**预期结果:**

✅ **链接复制成功:**
- 显示Toast消息: "Link copied to clipboard!"
- 剪贴板包含完整URL: `http://localhost:5173/verify/abc123-def456`
- 可以粘贴到任何地方分享

**验证链接:**
- 将链接粘贴到浏览器新标签页
- 应该打开公共验证页面 (无需登录)
- 显示Badge完整信息

---

### 测试场景 6.4: 获取嵌入代码 (Widget)

**操作步骤:**

1. 在分享模态框中，点击 **"Get Embed Code"** 按钮
2. 应该显示嵌入代码 (HTML iframe 或 JavaScript snippet)

**预期结果:**

✅ **嵌入代码显示:**

```html
<!-- Copy this code to your website -->
<iframe 
  src="http://localhost:5173/badges/abc123-def456/embed" 
  width="300" 
  height="400" 
  frameborder="0">
</iframe>
```

✅ **"Copy Code" 按钮:**
- 点击自动复制嵌入代码
- Toast消息: "Embed code copied!"

**验证嵌入效果:**
1. 创建测试HTML文件: `test-embed.html`
2. 粘贴嵌入代码
3. 在浏览器打开 `test-embed.html`
4. 应该看到嵌入的Badge widget (300x400px)
5. Widget显示:
   - Badge图片
   - Badge名称
   - Issuer信息
   - "Verify" 按钮 (链接到公共验证页面)

---

## 🚫 Phase 7: Badge撤销测试 (Epic 9)

**前置条件:** 以 **Admin** 身份登录

### 测试场景 7.1: 撤销Badge (Admin操作)

**操作步骤:**

1. 以Admin身份登录
2. 访问 `/admin/badges/issued` (已发放Badge列表)
3. 找到一个状态为 **CLAIMED** 的Badge
4. 点击该Badge的 **"Revoke"** 按钮 (或 "..." 菜单 → "Revoke")
5. 填写撤销表单:
   - **Revocation Reason:** 下拉选择 "Policy Violation"
   - **Notes (可选):** `Employee violated code of conduct`
6. 点击 **"Confirm Revoke"** 按钮

**预期结果:**

✅ **撤销成功:**
- 显示确认Toast: "Badge revoked successfully"
- Badge状态从 "CLAIMED" 变为 "REVOKED"
- 列表中该badge显示红色 "REVOKED" 标签
- Revoked Date 设置为当前日期

✅ **通知发送 (如果配置SMTP):**
- Recipient (employee@example.com) 收到撤销通知邮件
- 邮件包含:
  - Badge名称
  - Revocation Reason
  - Revoked Date
  - 联系管理员的链接

---

### 测试场景 7.2: Employee查看已撤销Badge

**操作步骤:**

1. 登出Admin
2. 以被撤销badge的Employee身份登录
3. 访问Badge Wallet (`/`)
4. 查看被撤销的badge

**预期结果:**

✅ **Badge Wallet显示撤销状态:**
- Badge卡片显示红色 ⚠️ "REVOKED" 标签
- Badge图片可能显示半透明或灰色覆盖层
- 卡片上显示撤销日期

✅ **打开Badge详情:**
- 顶部显示红色警告横幅:
  ```
  ⚠️ This badge has been revoked
  ```
- Revocation Section显示:
  - Revoked Date: 2026-02-02
  - Revocation Reason: "Policy Violation"
  - Revocation Notes: "Employee violated code of conduct"

✅ **功能限制:**
- **"Share" 按钮禁用** (无法分享已撤销badge)
- "Download" 按钮仍可用 (可以下载assertion作为记录)
- "Verify" 按钮仍可用 (公共验证页面显示REVOKED状态)

---

### 测试场景 7.3: 已撤销Badge的公共验证

**操作步骤:**

1. 获取已撤销badge的Verification URL
2. 在隐私浏览窗口打开 (无需登录)

**预期结果:**

❌ **验证页面显示:**
- ⚠️ 大红色警告横幅: "This badge has been revoked and is no longer valid"
- Verification Status: ❌ **REVOKED** (红色X图标)
- Revoked Date: 2026-02-02
- Revocation Reason: "Policy Violation"
- Original Issue Date: 2026-01-15 (保留历史记录)

✅ **Open Badges 2.0 Compliance:**
- JSON-LD assertion包含撤销字段:
  ```json
  {
    "@context": "https://w3id.org/openbadges/v2",
    "type": "Assertion",
    "revoked": true,
    "revocationReason": "Policy Violation"
  }
  ```

---

## 📊 Phase 8: 分析报表测试 (Epic 12 - 未实现)

**⚠️ 重要:** Epic 12 (分析与报告仪表盘) 在Sprint 9开发

**当前状态:**
- 导航栏有 **"Analytics"** 链接 (Admin可见)
- 点击后可能显示占位符页面或404
- 这是正常的，功能未实现

**未来测试场景 (Sprint 9+):**
- Badge发放趋势图表
- 技能库存可视化
- 部门/角色技能分布
- Claim率统计
- 可导出报告 (CSV/PDF)

---

## ✅ 测试完成检查清单

### 功能测试完成度

| Epic | 功能模块 | 测试场景 | 状态 |
|------|---------|---------|------|
| Epic 2 | 用户认证 | 3 | ✅ |
| Epic 3 | Badge模板管理 | 5 | ✅ |
| Epic 4 | Badge发放 | 4 | ✅ |
| Epic 5 | Employee钱包 | 6 | ✅ |
| Epic 6 | Badge验证 | 2 | ✅ |
| Epic 7 | Badge分享 | 4 | ✅ |
| Epic 9 | Badge撤销 | 3 | ✅ |
| **总计** | **7个Epic** | **27个场景** | **✅ 全部可测** |

### 前端页面验证

- [ ] LoginPage (登录页面) - http://localhost:5173/login
- [ ] TimelineView (Badge钱包) - http://localhost:5173/
- [ ] BadgeDetailModal (Badge详情模态框)
- [ ] BadgeManagementPage (Admin管理) - http://localhost:5173/admin/badges
- [ ] VerifyBadgePage (公共验证) - http://localhost:5173/verify/:id
- [ ] BadgeShareModal (分享模态框)
- [ ] BadgeEmbedPage (嵌入widget) - http://localhost:5173/badges/:id/embed
- [ ] AdminAnalyticsPage (分析报表) - http://localhost:5173/admin/analytics (占位符)

### 角色权限验证

- [ ] **ADMIN** - 可访问所有功能 (Wallet, Management, Analytics, Issue, Revoke)
- [ ] **ISSUER** - 可访问 (Wallet, Management, Issue) 但无法Revoke
- [ ] **MANAGER** - 可访问 (Wallet) 及团队成员badges
- [ ] **EMPLOYEE** - 只能访问 (Wallet)，无管理权限

### Badge生命周期完整性

- [ ] **创建模板** (Admin创建badge模板)
- [ ] **发放Badge** (Admin/Issuer发放给Employee)
- [ ] **通知发送** (Employee收到邮件通知 - 如配置SMTP)
- [ ] **认领Badge** (Employee登录后claim)
- [ ] **查看详情** (Employee查看badge完整信息)
- [ ] **分享Badge** (LinkedIn, Email, 公共链接, Widget)
- [ ] **公共验证** (外部访客验证badge真实性)
- [ ] **撤销Badge** (Admin因policy violation撤销)
- [ ] **撤销通知** (Employee收到撤销通知)
- [ ] **撤销验证** (公共验证页面显示REVOKED状态)

### 数据完整性验证

- [ ] 所有Badge状态正确 (ISSUED → CLAIMED → REVOKED)
- [ ] 时间戳准确 (issuedAt, claimedAt, revokedAt)
- [ ] Open Badges 2.0 assertion格式正确 (JSON-LD验证)
- [ ] SAS Token过期机制工作 (evidence下载5分钟有效期)
- [ ] 审计日志完整 (所有操作记录在数据库)

---

## 🐛 问题反馈与报告

### 如果发现问题

**记录以下信息:**
1. 测试场景编号 (e.g., 4.2: 查看Badge详情)
2. 操作步骤 (具体复现步骤)
3. 预期结果 vs 实际结果
4. 截图或录屏 (如果可能)
5. 浏览器信息 (Chrome版本、屏幕分辨率)
6. 控制台错误日志 (F12 → Console)

**问题严重程度分类:**
- **P0 (阻塞):** 无法完成核心流程 (e.g., 无法登录)
- **P1 (严重):** 功能不可用但有workaround (e.g., 无法claim badge)
- **P2 (中等):** UI问题或非关键功能 (e.g., Toast显示不正确)
- **P3 (轻微):** 文字错误、样式问题

**报告渠道:**
- 创建GitHub Issue
- 或发送邮件到测试团队

---

## 📈 测试报告模板

### 测试执行总结

**测试日期:** 2026-02-02  
**测试人员:** [Your Name]  
**测试环境:** 
- OS: Windows 11
- Browser: Chrome 120.0.0
- 前端版本: v0.7.0 (Sprint 7)
- 后端版本: v0.7.0 (Sprint 7)

**测试结果:**
- 总测试场景: 27
- 通过: 25 ✅
- 失败: 2 ❌
- 阻塞: 0 ⚠️

**主要发现:**
1. ✅ Badge完整生命周期全流程可用
2. ✅ 多角色权限控制正常工作
3. ❌ LinkedIn分享按钮在某些情况下无响应 (P2)
4. ❌ 批量发放功能未实现 (Epic 8未开发，符合预期)

**建议:**
- 修复LinkedIn分享集成问题
- 添加更多错误处理提示
- 优化移动端响应式设计

---

## 🎓 附录A: 测试账号速查表

| Role | Email | Password | 权限 |
|------|-------|----------|------|
| ADMIN | admin@example.com | testpass123 | 全部权限 |
| ISSUER | issuer@example.com | testpass123 | 发放Badge |
| MANAGER | manager@example.com | testpass123 | 查看团队 |
| EMPLOYEE | employee@example.com | testpass123 | 个人钱包 |

**密码统一:** `testpass123` (测试环境专用)

---

## 🎓 附录B: 常见问题排查

### 问题1: 无法启动后端服务器

**错误信息:** `Error: JWT_SECRET is not set or too short`

**解决方案:**
1. 检查 `backend/.env` 文件
2. 确保 `JWT_SECRET` 至少32字符
3. 重启后端: `npm run start:dev`

---

### 问题2: 前端无法连接后端

**错误信息:** `Network Error` 或 `ERR_CONNECTION_REFUSED`

**解决方案:**
1. 确认后端运行在 `http://localhost:3000`
2. 检查 `backend/.env` 中 `FRONTEND_URL=http://localhost:5173`
3. 检查防火墙设置

---

### 问题3: 种子数据注入失败

**错误信息:** `P2002: Unique constraint failed on the fields: (email)`

**解决方案:**
1. 数据库已有数据冲突
2. 清空数据库:
   ```powershell
   cd backend
   node_modules\.bin\prisma migrate reset
   ```
3. 重新运行种子脚本: `npm run seed:demo`

---

### 问题4: Badge图片无法显示

**错误信息:** 图片显示broken image图标

**解决方案:**
1. 检查Azure Blob Storage连接字符串
2. 确认 `badges` container是public read权限
3. 测试直接访问图片URL

---

### 问题5: Email通知未收到

**说明:** 如果未配置SMTP，邮件不会实际发送

**解决方案:**
1. 配置 `backend/.env` 中的SMTP设置
2. 或查看后端控制台日志 (邮件内容会打印)
3. 测试SMTP连接: 
   ```powershell
   cd backend
   npm run test:email
   ```

---

## 🎉 测试完成

恭喜！您已完成G-Credit系统的**完整端到端用户验收测试**。

**下一步:**
1. 整理测试报告 (使用附录中的模板)
2. 提交发现的问题 (GitHub Issues)
3. 与开发团队确认修复优先级
4. 准备Sprint 9 (Epic 8: 批量发放 + Epic 12: 分析报表)

**有任何问题？**
- 查阅项目文档: `gcredit-project/docs/`
- 联系开发团队: dev-team@gcredit.com

---

**文档版本:** 1.0  
**创建日期:** 2026-02-02  
**维护者:** BMad Master + Development Team

