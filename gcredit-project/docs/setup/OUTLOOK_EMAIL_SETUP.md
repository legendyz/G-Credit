# 📧 Outlook/Gmail 邮箱真实邮件发送测试指南

## 🎯 目标
在开发阶段临时测试真实邮件发送功能，用于演示和验证。测试完成后继续使用控制台输出方式开发。

## ⚠️ 重要提示：Outlook 配置较复杂，建议使用 Gmail

**推荐顺序**：
1. 🟢 **Gmail**（最简单，推荐） - 跳到"方案 B：使用 Gmail"
2. 🟡 **Outlook 个人账户**（复杂） - 见"方案 A：使用 Outlook"
3. 🔴 **Outlook 工作/学校账户** - 通常被组织策略限制，不推荐

---

## 方案 A：使用 Outlook 个人账户（outlook.com / hotmail.com）

### ❗ Outlook 限制说明
- Microsoft 在 2022 年后逐步移除了"应用密码"功能
- 许多个人账户无法创建应用密码
- 工作/学校账户通常被组织策略禁止
- **建议使用 Gmail 替代（见方案 B）**

### 第一步：检查账户类型

访问：https://account.microsoft.com/

- 如果看到 "个人账户" / "Personal Account" → 继续
- 如果看到公司/学校名称 → **不推荐**，使用方案 B（Gmail）

### 第二步：启用两步验证

1. 访问：https://account.microsoft.com/security
2. 找到 "**其他安全选项**" 或 "**Advanced security options**"
3. 向下滚动找到 "**两步验证**" / "**Two-step verification**"
4. 如果显示"关闭" → 点击"启用"
5. 按照提示设置（选择短信或 Authenticator 应用）
6. 完成验证

### 第三步：创建应用密码

⚠️ **如果找不到此选项，说明您的账户不支持应用密码，请使用方案 B（Gmail）**

1. 返回：https://account.microsoft.com/security
2. 在"其他安全选项"页面
3. 向下滚动找到 "**应用密码**" / "**App passwords**"
4. 如果没有这个选项 → **跳到方案 B 使用 Gmail**
5. 如果有，点击 "创建新的应用密码"
6. 输入名称：`G-Credit Dev`
7. 复制显示的密码（格式：`abcd efgh ijkl mnop`）
8. ⚠️ 立即保存，这个密码只显示一次

### 第四步：配置 SMTP（如果成功获取应用密码）

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="您的邮箱@outlook.com"
SMTP_PASSWORD="复制的应用密码（去掉空格）"
SMTP_FROM="G-Credit System <您的邮箱@outlook.com>"
```

---

## 方案 B：使用 Gmail（推荐，更简单）

### ✅ Gmail 优势
- 配置简单明了
- 应用密码功能稳定可靠
- 发送成功率高
- 开发环境常用方案

### 第一步：启用两步验证

1. 访问：https://myaccount.google.com/security
2. 找到 "**登录 Google**" / "**Signing in to Google**" 部分
3. 点击 "**两步验证**" / "**2-Step Verification**"
4. 点击 "**开始使用**" 按钮
5. 按照提示完成设置（通常使用手机短信验证）

### 第二步：创建应用专用密码

1. 启用两步验证后，返回：https://myaccount.google.com/security
2. 在 "登录 Google" 部分找到 "**应用密码**" / "**App passwords**"
3. 点击进入（可能需要再次输入密码）
4. 在下拉菜单中选择：
   - 应用：**邮件** / **Mail**
   - 设备：**其他（自定义名称）** / **Other (Custom name)**
5. 输入名称：`G-Credit Dev`
6. 点击 "**生成**" / "**Generate**"
7. 复制显示的 16 位密码（格式：`abcd efgh ijkl mnop`）
8. ⚠️ 立即保存，关闭后无法再查看

### 第三步：配置 Gmail SMTP

编辑 `.env.email-test` 文件：

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="您的邮箱@gmail.com"
SMTP_PASSWORD="刚才生成的16位密码（去掉空格）"
SMTP_FROM="G-Credit System <您的邮箱@gmail.com>"
```

**示例**：
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="john.doe@gmail.com"
SMTP_PASSWORD="abcdefghijklmnop"  # 16位，无空格
SMTP_FROM="G-Credit System <john.doe@gmail.com>"
```

---

## 方案 C：使用 Outlook 但不用应用密码（不推荐，安全性低）

⚠️ **仅用于临时测试，不要在生产环境使用**

如果您的 Outlook 账户：
- 没有两步验证
- 无法创建应用密码

可以临时启用"低安全性应用访问"：

1. 访问：https://account.microsoft.com/security
2. 找到 "**其他安全选项**"
3. 向下滚动找到 "**安全默认值**" 或类似选项
4. 禁用（仅临时）

配置：
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="您的邮箱@outlook.com"
SMTP_PASSWORD="您的账户密码（不是应用密码）"
SMTP_FROM="G-Credit System <您的邮箱@outlook.com>"
```

⚠️ **测试后立即重新启用安全默认值！**

---

## 📝 配置步骤（通用）

### 第二步：编辑配置文件

1. **打开 `.env.email-test` 文件**：
   ```powershell
   code .env.email-test
   ```

2. **根据您选择的方案修改配置**：

   **如果使用 Gmail**：
   ```env
   NODE_ENV="production"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="yourname@gmail.com"
   SMTP_PASSWORD="your16digitpassword"  # 去掉空格
   SMTP_FROM="G-Credit System <yourname@gmail.com>"
   ```

   **如果使用 Outlook**：
   ```env
   NODE_ENV="production"
   SMTP_HOST="smtp-mail.outlook.com"
   SMTP_PORT=587
   SMTP_USER="yourname@outlook.com"
   SMTP_PASSWORD="yourappppassword"  # 去掉空格和短横线
   SMTP_FROM="G-Credit System <yourname@outlook.com>"
   ```

3. **保存文件**

## 🧪 测试真实邮件发送

### 方法一：临时切换配置文件

1. **备份当前配置**：
   ```powershell
   Copy-Item .env .env.backup
   ```

2. **切换到邮件测试配置**：
   ```powershell
   Copy-Item .env.email-test .env
   ```

3. **重启后端**（在外部 PowerShell 窗口）：
   - 如果后端正在运行，按 Ctrl+C 停止
   - 重新启动：
   ```powershell
   npm run start:dev
   ```

4. **运行邮件测试**：
   ```powershell
   .\test-email-real.ps1
   ```
   
   或使用已有的测试脚本：
   ```powershell
   .\test-reset-flow.ps1
   ```

5. **检查您的 Outlook 收件箱**：
   - 查找来自 "G-Credit System" 的邮件
   - 邮件主题："Reset Your Password"
   - 应该看到完整的 HTML 格式邮件

6. **恢复开发配置**：
   ```powershell
   Copy-Item .env.backup .env
   Remove-Item .env.backup
   ```
   
   然后重启后端

### 方法二：使用环境变量（推荐，无需修改文件）

```powershell
# 设置临时环境变量
$env:NODE_ENV = "production"
$env:SMTP_HOST = "smtp-mail.outlook.com"
$env:SMTP_PORT = "587"
$env:SMTP_USER = "yourname@outlook.com"
$env:SMTP_PASSWORD = "your-app-password"
$env:SMTP_FROM = "G-Credit System <yourname@outlook.com>"

# 启动后端
npm run start:dev

# 测试完成后关闭窗口，环境变量自动清除
```

## ✅ 验证清单

测试时请验证：
- [ ] 邮件成功发送到 Outlook 收件箱
- [ ] 邮件显示为 HTML 格式（有样式、有按钮）
- [ ] 重置链接格式正确：`http://localhost:5173/reset-password?token=...`
- [ ] Token 是 64 位十六进制字符串
- [ ] 邮件中显示"1小时内有效"的提示
- [ ] 点击邮件中的链接可以跳转（虽然前端未实现，但 URL 应正确）

## 📊 测试脚本

如果想自动测试并验证邮件发送：

```powershell
# 请求密码重置
$body = @{ email = "employee.test@gcredit.com" } | ConvertTo-Json
$respons找不到"应用密码"选项（Outlook）
**原因**：
- 您的账户不支持应用密码功能
- 使用的是工作/学校账户（受组织策略限制）
- Microsoft 已为您的账户类型移除此功能

**解决方案**：
- ✅ **推荐**：改用 Gmail（见方案 B）
- 尝试方案 C（临时使用账户密码，不安全）
- 等待前端实现 OAuth2 登录（未来功能）

### 问题2：535 Authentication failed
**原因**：认证失败，密码不正确或未启用两步验证

**Gmail 解决方法**：
- 确认已启用两步验证
- 重新生成应用密码
- 确保密码是 16 位，无空格
- 使用应用密码，不是账户密码

**Outlook 解决方法**：
- 确认已启用两步验证
- 应用密码去掉所有空格和短横线
- 如果是工作账户，联系 IT 管理员m: G-Credit System" -ForegroundColor Cyan
Write-Host "Subject: Reset Your Password" -ForegroundColor Cyan
```

## 🔧 常见问题

### 问题1：535 Authentication failed
**原因**：应用密码不正确或未启用两步验证
**解决**：
- 确认已启用两步验证
- 重新生成应用密码
- 确保密码中没有短横线和空格

### 问题2：邮件进入垃圾箱
**原因**：发件地址未验证或内容被识别为垃圾邮件
**解决**：
- 检查 Outlook 垃圾邮件文件夹
- 将 G-Credit System 添加到安全发件人
- 这在正式部署时通过 SPF/DKIM 记录解决

### 问题3：Connection timeout
**原因**：防火墙或网络限制
**解决**：
- 确认端口 587 未被防火墙阻止
- 尝试使用端口 25（不推荐）
- 检查公司网络是否限制 SMTP

### 问题4：邮件延迟
**正常情况**：Outlook 通常 1-3 分钟内送达
**如果超过 5 分钟**：检查后端日志查看发送状态

## 💡 演示建议

**演示前准备**：
1. 提前配置好真实邮件
2. 使用一个真实的测试邮箱账户
3. 准备好展示邮件收件箱

**演示流程**：
1. 展示密码重置请求（POST /auth/request-reset）
2. 打开邮箱，展示收到的 HTML 格式邮件
3. 展示邮件中的重置链接
4. 从邮件中复制 token
5. 使用 token 完成密码重置
6. 验证新密码可以登录

## 🔄 切换回开发模式

测试完成后，确保切换回开发模式：

1. **如果使用了方法一（文件切换）**：
   ```powershell
   Copy-Item .env.backup .env
   ```

2. **如果使用了方法二（环境变量）**：
   - 关闭那个 PowerShell 窗口
   - 在新窗口中正常启动后端

3. **验证已切换回开发模式**：
   - 后端启动时应该不会输出 SMTP 连接信息
   - 请求密码重置时，邮件内容输出到控制台

## 📝 注意事项

⚠️ **安全提醒**：
- 应用密码具有完整的邮箱访问权限
- 不要将 `.env.email-test` 文件提交到 Git
- 演示后及时删除或禁用应用密码

✅ **已添加到 .gitignore**：
- `.env.email-test` 已被排除
- 配置信息不会被提交到代码仓库

---

**准备好测试时，请告诉我，我可以帮您一步步完成配置！**
