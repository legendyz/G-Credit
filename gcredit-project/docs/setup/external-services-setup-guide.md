# 外部服务配置完整指南

**创建日期**: 2026-01-31  
**目标用户**: 技术水平中等的开发者  
**预计时间**: 2-3小时

---

## 📊 配置优先级

| 优先级 | 服务 | 当前状态 | 影响功能 | 预计时间 |
|--------|------|---------|---------|---------|
| 🔴 P0 | Microsoft Graph API权限验证 | ⚠️ 部分配置 | Email/Teams分享 | 30分钟 |
| 🔴 P0 | Teams通知配置 | ❌ 未配置 | Teams徽章通知 | 45分钟 |
| 🟡 P1 | Badge PNG生成 | ❌ Mock | 下载徽章图片 | 1-2小时 |
| 🟢 P2 | 真实邮件测试 | ⚠️ 需验证 | Email分享 | 15分钟 |

---

## 🔴 第一步：验证Microsoft Graph API权限 (P0)

### 背景说明
你的`.env`文件已经有了Azure AD配置：
```
AZURE_TENANT_ID=afc9fe8f-1d40-41fc-9906-e001e500926c
AZURE_CLIENT_ID=ceafe2e0-73a9-46b6-a203-1005bfdda11f
AZURE_TENANT_DOMAIN=2wjh85.onmicrosoft.com
```

但我们需要确认**权限是否正确配置**。

---

### ✅ 操作步骤

#### 步骤 1.1：登录Azure Portal
1. 打开浏览器访问: https://portal.azure.com
2. 用你的Azure账号登录
3. 搜索栏输入 **"Azure Active Directory"** 或 **"Entra ID"**
4. 点击进入

#### 步骤 1.2：找到你的应用注册
1. 左侧菜单点击 **"App registrations"** (应用注册)
2. 找到名为 **"G-Credit Badge Platform"** 的应用
   - 或者按 Client ID 搜索: `ceafe2e0-73a9-46b6-a203-1005bfdda11f`
3. 点击进入应用详情页

#### 步骤 1.3：检查API权限
1. 左侧菜单点击 **"API permissions"** (API权限)
2. 检查是否包含以下**Application权限** (不是Delegated权限):

   **必需权限清单**:
   - ✅ `Mail.Send` (Application)
   - ✅ `TeamsActivity.Send` (Application)
   - ✅ `Channel.ReadBasic.All` (Application)
   - ✅ `User.Read.All` (Application)

3. 检查 **"Status"** 列是否显示 **"Granted for [你的租户]"** (绿色✔️)

#### 步骤 1.4：如果权限缺失，添加权限
1. 点击 **"+ Add a permission"** (添加权限)
2. 选择 **"Microsoft Graph"**
3. 选择 **"Application permissions"** (⚠️ 不是Delegated)
4. 搜索并勾选缺失的权限
5. 点击 **"Add permissions"**
6. ⚠️ **关键步骤**: 点击 **"Grant admin consent for [租户]"** 按钮
7. 确认对话框点击 **"Yes"**

#### 步骤 1.5：验证Client Secret有效
1. 左侧菜单点击 **"Certificates & secrets"** (证书和机密)
2. 查看 **Client secrets** 部分
3. 确认有一个未过期的secret (例如: "G-Credit Backend - Sprint 6")
4. ⚠️ **如果已过期或即将过期**:
   - 点击 **"+ New client secret"**
   - Description: `G-Credit Backend - 2026`
   - Expires: 选择 **6 months** 或 **12 months**
   - 点击 **"Add"**
   - **立即复制 "Value"** (只显示一次！)
   - 更新 `.env` 文件中的 `AZURE_CLIENT_SECRET`

---

### 🧪 测试Graph API连接

完成上述步骤后，测试API是否工作：

#### 测试脚本 1.6：运行Token获取测试
```powershell
# 在PowerShell中执行
cd c:\G_Credit\CODE\gcredit-project\backend

# 启动后端
npm run start:dev
```

**预期输出**（查看终端日志）:
```
✅ Graph Token Provider initialized
✅ Graph Email Service initialized  
✅ Graph Teams Service initialized
```

**如果看到错误**:
- ❌ `AADSTS700016: Application not found` → Client ID错误
- ❌ `AADSTS7000215: Invalid client secret` → Secret过期或错误
- ❌ `AADSTS65001: Consent required` → 未授予管理员同意

---

## 🔴 第二步：配置Teams通知 (P0)

### 背景说明
当前`.env`缺少:
```
DEFAULT_TEAMS_TEAM_ID=...
DEFAULT_TEAMS_CHANNEL_ID=...
```

没有这些ID，Teams通知功能无法工作。

---

### ✅ 操作步骤

#### 步骤 2.1：创建或选择一个Teams Team
1. 打开 **Microsoft Teams** (网页版或桌面版)
2. 如果还没有Team，创建一个:
   - 左侧点击 **"Teams"**
   - 点击 **"Join or create a team"** → **"Create team"**
   - 选择 **"From scratch"**
   - 选择 **"Private"**
   - 名称: `G-Credit Badge Platform - Dev`
   - 点击 **"Create"**

#### 步骤 2.2：获取Team ID
**方法A：通过Graph Explorer (推荐)**
1. 访问: https://developer.microsoft.com/graph/graph-explorer
2. 登录你的Azure账号
3. 运行请求:
   ```
   GET https://graph.microsoft.com/v1.0/me/joinedTeams
   ```
4. 在响应中找到你的Team，复制 `id` 字段

**方法B：通过Teams网页版**
1. 在Teams中，右键点击你的Team名称
2. 选择 **"Get link to team"**
3. 链接格式类似: `https://teams.microsoft.com/l/team/...%40thread.tacv2/...?groupId=XXXXXXXX`
4. `groupId=` 后面的值就是 **Team ID**

#### 步骤 2.3：获取Channel ID
1. 在Teams中，打开你想发送通知的频道（例如: "General"）
2. 右键点击频道名称
3. 选择 **"Get link to channel"**
4. 链接示例: `https://teams.microsoft.com/.../conversations/CHANNEL_ID@thread.tacv2`
5. `conversations/` 后面的部分（在 `@thread` 前）就是 **Channel ID**

**或使用Graph Explorer**:
```
GET https://graph.microsoft.com/v1.0/teams/{TEAM_ID}/channels
```

#### 步骤 2.4：更新.env文件
打开 `backend/.env`，添加或更新:
```bash
DEFAULT_TEAMS_TEAM_ID="你的Team-ID"
DEFAULT_TEAMS_CHANNEL_ID="你的Channel-ID%40thread.tacv2"  # 完整ID包含后缀
```

**示例**:
```bash
DEFAULT_TEAMS_TEAM_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
DEFAULT_TEAMS_CHANNEL_ID="19:abc123def456@thread.tacv2"
```

---

### 🧪 测试Teams通知

#### 测试脚本 2.5：运行Teams通知测试
```powershell
cd c:\G_Credit\CODE\gcredit-project\backend\test-scripts\sprint-6
.\test-teams-notifications.ps1
```

**预期结果**:
- ✅ 脚本成功发送徽章通知
- ✅ 在Teams频道中看到Adaptive Card通知
- ✅ 通知包含徽章图片、名称、claim按钮

**如果失败**:
- 检查Team ID和Channel ID格式
- 确认Graph API权限包含 `TeamsActivity.Send`
- 查看后端日志获取详细错误信息

---

## 🟡 第三步：配置Badge PNG生成 (P1)

### 背景说明
当前下载徽章功能返回的是占位符图片，需要配置真实的PNG生成服务。

### 实施选项

#### 选项A：使用第三方服务 (快速方案)
**推荐**: Cloudinary 或 imgix

**步骤**:
1. 注册Cloudinary免费账号: https://cloudinary.com
2. 获取API credentials
3. 更新 `.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME="你的cloud-name"
   CLOUDINARY_API_KEY="你的api-key"
   CLOUDINARY_API_SECRET="你的api-secret"
   ```
4. 修改后端代码使用Cloudinary SDK生成图片

#### 选项B：使用Puppeteer生成PNG (完全控制)
**步骤**:
1. 安装依赖:
   ```bash
   cd backend
   npm install puppeteer
   ```
2. 创建服务: `src/badge-rendering/badge-png-generator.service.ts`
3. 实现HTML → PNG转换逻辑
4. 配置headless Chrome

#### 选项C：延后处理 (临时方案)
如果PNG生成不是MVP关键功能，可以暂时保留占位符，将此项放入Sprint 7计划。

**推荐**: 先完成P0任务（Graph API和Teams），然后评估是否立即需要PNG生成。

---

## 🟢 第四步：真实Email测试 (P2)

### 测试Email分享功能

#### 验证结果 ✅

**完成日期**: 2026-01-31

**测试状态**: 
- ✅ Microsoft Graph Token Provider正常工作
- ✅ Email成功通过Graph API发送
- ✅ 收件人收到邮件
- ⚠️ Badge图片显示问题（技术债务已记录，推迟到Sprint 7）

**验证的功能**:
- Graph API OAuth认证和token获取
- Email发送服务集成
- 邮件模板渲染
- BadgeShare记录创建

**遗留问题**:
1. Badge PNG图片生成未实施（使用占位符图片）
2. Teams通知需要真实Team/Channel ID配置

---

## 🟡 第五步：Teams通知配置 (待完成)

### 当前状态

**配置状态**: ⏸️ 暂时使用占位符ID

**原因**:
- Azure AD应用需要额外权限 (`Group.ReadWrite.All`) 才能通过API创建Team
- Graph Explorer权限配置界面难以找到
- 不影响其他功能的开发和测试

**临时配置** (已添加到`.env`):
```bash
DEFAULT_TEAMS_TEAM_ID="00000000-0000-0000-0000-000000000000"
DEFAULT_TEAMS_CHANNEL_ID="19:placeholder-channel-id@thread.tacv2"
```

### 何时配置真实Teams

**触发条件**（满足任一即可）:
1. 需要真实测试Teams通知功能时
2. 准备演示Teams集成功能时
3. 有空闲时间优化开发环境时

**简化配置步骤** (未来执行):

1. **在Teams网页版手动创建Team**:
   - 访问 https://teams.microsoft.com
   - 创建新Team: "G-Credit Badge Notifications"

2. **从URL提取ID**:
   - 点击创建的Team
   - 浏览器地址栏会显示URL
   - URL包含 `groupId=` (这是Team ID)
   - Channel ID在点击General频道后URL中的 `threadId=`

3. **更新`.env`文件**:
   ```bash
   DEFAULT_TEAMS_TEAM_ID="<从URL提取的groupId>"
   DEFAULT_TEAMS_CHANNEL_ID="<从URL提取的threadId>"
   ```

4. **重启后端服务器**

**参考脚本**: 
- [create-test-team.ps1](../../backend/test-scripts/sprint-6/create-test-team.ps1) - 尝试通过API创建
- [get-teams-info.ps1](../../backend/test-scripts/sprint-6/get-teams-info.ps1) - 获取现有Teams

---

## 📝 配置清单总结

完成后，确保以下所有项都已勾选：

### Azure AD & Graph API
- [ ] App注册中包含所有必需的Application权限
- [ ] 权限已授予管理员同意（绿色✔️）
- [ ] Client Secret未过期且正确配置在.env
- [ ] 后端启动日志显示Graph服务初始化成功

### Teams通知
- [ ] 已创建或选择用于通知的Teams Team
- [ ] DEFAULT_TEAMS_TEAM_ID 配置正确
- [ ] DEFAULT_TEAMS_CHANNEL_ID 配置正确（包含@thread.tacv2后缀）
- [ ] test-teams-notifications.ps1 脚本运行成功

### Email分享
- [ ] GRAPH_EMAIL_FROM 使用真实M365用户邮箱
- [ ] test-email-sharing.ps1 脚本运行成功
- [ ] 测试邮箱收到格式正确的徽章邮件

### Badge PNG生成 (可选)
- [ ] 选定实施方案（Cloudinary/Puppeteer/延后）
- [ ] 相关依赖和配置已添加
- [ ] 下载功能返回真实PNG而非占位符

---

## 🆘 常见问题排查

### 问题1：Graph API返回401 Unauthorized
**原因**: Token无效或权限不足  
**解决**:
1. 检查 `AZURE_CLIENT_SECRET` 是否正确
2. 确认权限已授予管理员同意
3. 验证Client Secret未过期

### 问题2：Teams通知发送失败
**原因**: Team ID或Channel ID错误  
**解决**:
1. 使用Graph Explorer验证Team存在: `GET /teams/{teamId}`
2. 验证Channel ID格式包含 `@thread.tacv2` 后缀
3. 确认应用有 `TeamsActivity.Send` 权限

### 问题3：Email发送失败
**原因**: 发件人地址无效  
**解决**:
1. 确保 `GRAPH_EMAIL_FROM` 是租户内真实用户
2. 或创建共享邮箱: `badges@2wjh85.onmicrosoft.com`
3. 确认该用户已分配M365许可证

---

## 📞 需要帮助？

如果在配置过程中遇到问题：
1. 查看后端日志获取详细错误信息
2. 使用Graph Explorer测试API调用: https://developer.microsoft.com/graph/graph-explorer
3. 参考Microsoft官方文档:
   - [Azure AD应用注册](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
   - [Graph API权限](https://learn.microsoft.com/en-us/graph/permissions-reference)
   - [Teams通知API](https://learn.microsoft.com/en-us/graph/api/userteamwork-sendactivitynotification)

---

**下一步**: 从"第一步：验证Microsoft Graph API权限"开始，逐步完成配置。每完成一步就测试验证，确保正常工作后再继续。
