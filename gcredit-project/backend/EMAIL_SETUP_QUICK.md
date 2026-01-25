# 快速配置指南 - 推荐使用 Gmail

## 🟢 方案 1：Gmail（最简单，推荐）

### 步骤 1：启用 Gmail 两步验证

1. 访问：**https://myaccount.google.com/security**
2. 找到 "**登录 Google**" 部分
3. 点击 "**两步验证**"
4. 点击 "**开始使用**"
5. 按提示完成设置（通常用手机验证码）

### 步骤 2：生成应用密码

1. 两步验证启用后，返回：**https://myaccount.google.com/security**
2. 在 "登录 Google" 部分，点击 "**应用密码**"
   
   💡 如果找不到，直接访问：**https://myaccount.google.com/apppasswords**

3. 可能需要再次输入密码
4. 选择应用：**邮件**
5. 选择设备：**其他（自定义名称）**
6. 输入：`G-Credit Dev`
7. 点击 "**生成**"
8. 复制显示的密码（16位，格式：`abcd efgh ijkl mnop`）
9. 去掉空格：`abcdefghijklmnop`

### 步骤 3：配置文件

编辑 `.env.email-test`：

```env
NODE_ENV="production"

# 使用 Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="你的邮箱@gmail.com"
SMTP_PASSWORD="去掉空格的16位密码"
SMTP_FROM="G-Credit System <你的邮箱@gmail.com>"
```

### 步骤 4：测试

```powershell
# 备份当前配置
Copy-Item .env .env.backup

# 使用测试配置
Copy-Item .env.email-test .env

# 重启后端（在外部 PowerShell 窗口）
# Ctrl+C 停止，然后：
npm run start:dev

# 运行测试（在 VS Code 终端）
.\test-email-real.ps1

# 输入要接收邮件的地址（可以是任何邮箱）
# 然后检查收件箱
```

### 步骤 5：恢复开发模式

```powershell
Copy-Item .env.backup .env
Remove-Item .env.backup
# 重启后端
```

---

## 🟡 方案 2：Outlook（如果 Gmail 不可用）

### ⚠️ 注意
- 许多 Outlook 账户已无法创建应用密码
- 如果找不到应用密码选项，请使用 Gmail

### 尝试步骤：

1. 访问：**https://account.microsoft.com/security**
2. 查找 "**其他安全选项**" 或 "**高级安全选项**"
3. 启用 "**两步验证**"
4. 查找 "**应用密码**" 部分
5. 如果存在 → 创建应用密码
6. 如果不存在 → **改用 Gmail**

---

## ✅ 成功标志

测试成功后，您会收到一封邮件：

```
发件人：G-Credit System
主题：Reset Your Password
格式：精美的 HTML 格式
内容：
  - 欢迎信息
  - 蓝色的 "Reset Password" 按钮
  - 完整的重置链接（带 token）
  - "此链接将在 1 小时后过期"
  - 安全提示
```

---

## 🐛 故障排除

### 1. Gmail: "应用密码" 选项找不到

**原因**：未启用两步验证

**解决**：
1. 先完成两步验证设置
2. 退出账户重新登录
3. 再次访问 https://myaccount.google.com/apppasswords

### 2. 认证失败 (535 error)

**Gmail**：
- 确保使用 16 位应用密码（不是账户密码）
- 密码中不要有空格
- 重新生成一个应用密码试试

**Outlook**：
- 确保应用密码去掉了所有空格和短横线
- 如果是工作账户，可能被组织策略禁止

### 3. 邮件未收到

- 检查垃圾邮件文件夹
- 查看后端控制台是否有错误信息
- 确认 NODE_ENV 设置为 "production"
- 等待 1-3 分钟（有时有延迟）

---

## 📞 需要帮助？

**推荐顺序**：
1. 先尝试 Gmail（成功率最高）
2. 如果必须用 Outlook，查看详细文档 OUTLOOK_EMAIL_SETUP.md
3. 如果遇到问题，告诉我具体的错误信息

**准备好开始了吗？** 
- 如果选择 Gmail → 访问 https://myaccount.google.com/security
- 如果选择 Outlook → 访问 https://account.microsoft.com/security
