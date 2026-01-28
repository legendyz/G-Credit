# Quick Demo Test Script
# 快速Demo测试 - 在开始正式Demo前运行

## Step 1: 检查后端健康状态

```powershell
# 测试后端是否正常运行
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```

**期望输出:** 
```json
{ "status": "ok", "timestamp": "..." }
```

---

## Step 2: 获取现有的测试数据ID

你需要从数据库中获取以下ID用于Demo：

### 2.1 获取Issuer ID（如果你有访问数据库的工具）
```sql
SELECT id, name, email FROM issuers LIMIT 1;
```

### 2.2 获取Badge Class ID
```sql
SELECT id, name, description, issuer_id FROM badge_classes LIMIT 1;
```

### 2.3 获取现有的Badge（如果有）
```sql
SELECT id, verification_id, metadata_hash, status 
FROM badges 
WHERE status = 'active' 
LIMIT 3;
```

---

## Step 3: 如果需要创建新徽章进行Demo

### 准备请求（在Postman或其他REST工具中）

**Endpoint:** `POST http://localhost:3000/api/badge-issuance/badges`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {your-jwt-token}
```

**Body:**
```json
{
  "badgeClassId": "{从数据库获取的badge-class-id}",
  "recipientEmail": "demo@example.com",
  "recipientName": "Demo User"
}
```

**注意:** 你需要先登录获取JWT token

---

## Step 4: 快速功能测试

### 测试1: 获取JSON-LD Assertion
```powershell
$verificationId = "{从上面创建或查询的verification-id}"
Invoke-RestMethod -Uri "http://localhost:3000/api/verification/$verificationId/assertion" -Method Get
```

### 测试2: 验证状态检查
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/verification/$verificationId/status" -Method Get
```

### 测试3: 完整性验证
```powershell
$badgeId = "{badge-id}"
Invoke-RestMethod -Uri "http://localhost:3000/api/badges/$badgeId/integrity" -Method Get
```

### 测试4: 前端验证页面
```powershell
# 在浏览器中打开
Start-Process "http://localhost:5173/verify/$verificationId"
```

---

## Step 5: 准备Demo数据记录表

请填写以下信息，Demo时使用：

```
===================== Demo Test Data =====================

Issuer ID: _______________________________________

Badge Class ID: ___________________________________

Test Badge 1:
  - Badge ID: _____________________________________
  - Verification ID: ______________________________
  - Recipient: demo@example.com

Test Badge 2:
  - Badge ID: _____________________________________
  - Verification ID: ______________________________
  - Recipient: test@example.com

Frontend URL: http://localhost:5173
Backend URL: http://localhost:3000

========================================================
```

---

## 如果遇到问题

### 问题1: 没有JWT Token
**解决方案:** 
1. 使用注册/登录API获取token
2. 或者从之前的测试中复制token
3. 或者临时禁用某些API的auth（仅用于Demo）

### 问题2: 数据库中没有测试数据
**解决方案:**
1. 运行seed脚本: `npm run seed`
2. 或者手动创建测试数据
3. 或者使用E2E测试中的setup数据

### 问题3: 前端页面404
**解决方案:**
1. 检查前端路由配置
2. 确认verification页面组件存在
3. 检查frontend启动日志

---

## ✅ Pre-Demo Checklist

运行以下命令确认环境：

```powershell
# 检查后端
Invoke-RestMethod http://localhost:3000/health

# 检查前端（打开浏览器）
Start-Process http://localhost:5173

# 如果一切正常，你看到：
# ✅ Backend: { "status": "ok" }
# ✅ Frontend: 页面正常显示
```

**准备就绪！** 🎉

现在你可以：
1. 准备好测试数据ID
2. 打开Postman/REST Client
3. 打开浏览器标签
4. 开始Demo演示

Good luck! 🚀
