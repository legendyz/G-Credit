# Badge图片配置指南

## 问题说明
当前邮件中的badge图片无法显示，可能原因：
1. 外部图片服务被邮件客户端阻止
2. 需要使用自己的存储服务

## 推荐解决方案

### 方案A：上传到Azure Blob Storage（推荐）

**步骤**：
1. 创建一个简单的badge PNG图片（400x400px）
2. 上传到你的Azure Storage账号: `gcreditdevstoragelz`
3. 获取公开访问URL
4. 更新数据库中的imageUrl

**示例命令**：
```powershell
# 上传图片到Azure Storage
az storage blob upload `
  --account-name gcreditdevstoragelz `
  --container-name badges `
  --name excellence-award.png `
  --file ./badge-images/excellence-award.png `
  --content-type image/png
```

### 方案B：使用Base64嵌入（临时方案）

直接在邮件HTML中嵌入base64编码的图片，不依赖外部URL。

**优点**：
- 不需要外部服务
- 图片保证显示

**缺点**：
- 增加邮件大小
- 不适合大图片

### 方案C：等待Sprint 7 PNG生成功能

当前Graph API已验证工作正常，badge图片问题不影响核心功能验证。可以：
1. 暂时接受占位符或简单测试图片
2. 在Sprint 7实施完整的Badge PNG生成服务
3. 届时会有专业的badge设计模板

## 当前状态

✅ **Graph API Email功能已验证成功**
- Email发送正常
- 收件人收到邮件
- 邮件格式正确
- 只是图片显示有问题

⚠️ **Badge图片待优化**
- 临时使用公共测试图片
- Sprint 7将实施完整PNG生成

## 建议

如果需要立即解决图片问题，推荐使用**方案A**上传到Azure Storage。
如果可以接受临时占位图片，建议**推迟到Sprint 7**完整实施。

当前最重要的是验证Graph API和Teams通知功能，badge图片可以后续优化。
