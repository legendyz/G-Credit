# 徽章发放系统 - 用户验收测试（UAT）指南

## 测试环境
- **服务器地址**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api
- **测试账户**: admin@gcredit.com / Admin123!

---

## 测试场景 1：发放单个徽章（最基础场景）

### 预期流程：
1. HR 管理员登录系统
2. 选择徽章模板
3. 选择接收者
4. 填写证明材料链接
5. 设置有效期
6. 点击发放

### 手动测试步骤：
1. 打开 Swagger UI: http://localhost:3000/api
2. 找到 `POST /auth/login`，登录获取 token
3. 点击右上角 "Authorize"，输入 token
4. 找到 `POST /api/badges`，发放徽章
5. 检查邮件是否收到通知

### 验收标准：
- [ ] 操作流程简单直观（3 分钟内完成）
- [ ] 错误提示清晰易懂
- [ ] 邮件通知及时到达
- [ ] 邮件内容专业友好

---

## 测试场景 2：员工认领徽章

### 预期流程：
1. 员工收到邮件
2. 点击邮件中的认领链接
3. 看到徽章详情
4. 确认认领
5. 获得徽章

### 手动测试步骤：
1. 检查邮件收件箱（开发环境：Ethereal）
2. 复制 claim URL
3. 在 Swagger 中使用 `POST /api/badges/:id/claim`
4. 查看返回的徽章信息

### 验收标准：
- [ ] 邮件模板美观
- [ ] 认领流程无需登录（方便）
- [ ] 认领后立即看到成功消息
- [ ] 错误提示友好（已认领、过期等）

---

## 测试场景 3：批量发放徽章（效率场景）

### 预期流程：
1. HR 下载 CSV 模板
2. 填写 100+ 员工信息
3. 上传 CSV 文件
4. 查看处理结果
5. 处理失败的记录

### 手动测试步骤：
1. 创建 CSV 文件：
```csv
recipientEmail,templateId,evidenceUrl,expiresIn
test1@example.com,your-template-id,https://example.com/cert1.pdf,365
test2@example.com,your-template-id,https://example.com/cert2.pdf,730
```
2. 使用 `POST /api/badges/bulk` 上传
3. 查看返回的成功/失败统计

### 验收标准：
- [ ] CSV 格式简单易懂
- [ ] 上传速度可接受（100 条 < 30 秒）
- [ ] 部分失败不影响成功的记录
- [ ] 错误报告包含行号和具体原因

---

## 测试场景 4：查看徽章历史

### 预期流程：
1. 员工查看自己获得的所有徽章
2. 按状态筛选（待认领、已认领）
3. 按时间排序
4. 翻页查看

### 手动测试步骤：
1. 使用 `GET /api/badges/my-badges`
2. 测试分页：`?page=1&limit=10`
3. 测试筛选：`?status=CLAIMED`
4. 测试排序：`?sortBy=issuedAt&sortOrder=desc`

### 验收标准：
- [ ] 加载速度快（< 1 秒）
- [ ] 显示的信息足够详细
- [ ] 筛选和排序功能直观
- [ ] 移动端友好（如果有前端）

---

## 测试场景 5：撤销徽章

### 预期流程：
1. 管理员发现发错了徽章
2. 查找该徽章
3. 填写撤销原因
4. 确认撤销
5. 员工收到撤销通知

### 手动测试步骤：
1. 使用 `POST /api/badges/:id/revoke`
2. 提供撤销原因（至少 10 字符）
3. 检查邮件通知
4. 验证徽章状态变为 REVOKED

### 验收标准：
- [ ] 撤销原因必须详细（防止随意撤销）
- [ ] 撤销通知邮件语气恰当（不引起恐慌）
- [ ] 已撤销的徽章无法再次认领
- [ ] 公开验证端点返回 410 Gone

---

## 测试场景 6：Open Badges 标准验证

### 预期流程：
1. 获取徽章的 assertion URL
2. 在第三方平台验证
3. 查看徽章元数据

### 手动测试步骤：
1. 使用 `GET /api/badges/:id/assertion`（无需登录）
2. 检查返回的 JSON 格式
3. 验证 Open Badges 2.0 字段

### 验收标准：
- [ ] 符合 Open Badges 2.0 规范
- [ ] 包含完整的元数据
- [ ] 公开可访问（无需认证）
- [ ] 已撤销的返回 410 状态

---

## 快速测试命令

运行自动化测试脚本：
```powershell
cd C:\G_Credit\CODE\gcredit-project\backend\test
.\manual-uat-test.ps1
```

或者手动使用 PowerShell 测试：
```powershell
# 登录
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -Body (@{email="admin@gcredit.com"; password="Admin123!"} | ConvertTo-Json) `
  -ContentType "application/json"

$token = $response.accessToken

# 发放徽章
$badge = Invoke-RestMethod -Uri "http://localhost:3000/api/badges" `
  -Method POST `
  -Headers @{Authorization="Bearer $token"} `
  -Body (@{templateId="your-id"; recipientId="recipient-id"} | ConvertTo-Json) `
  -ContentType "application/json"
```

---

## 关键指标

### 性能指标
- [ ] 单个徽章发放 < 2 秒
- [ ] 批量 100 条 < 30 秒
- [ ] 查询历史 < 1 秒
- [ ] 邮件发送 < 5 秒

### 可用性指标
- [ ] 新用户 10 分钟内学会发放徽章
- [ ] 错误率 < 5%（用户操作错误）
- [ ] 错误提示理解度 > 90%

### 业务指标
- [ ] 减少 80% 手动发放时间
- [ ] 员工认领率 > 85%
- [ ] 撤销率 < 2%

---

## 问题反馈模板

发现问题时请记录：

**问题描述：**
（用户操作的具体步骤）

**预期结果：**
（应该发生什么）

**实际结果：**
（实际发生了什么）

**严重程度：**
- [ ] 阻塞（无法继续）
- [ ] 严重（影响主要功能）
- [ ] 一般（小问题但可用）
- [ ] 建议（优化建议）

**截图/日志：**
（如果有）

---

## 邮件测试说明

开发环境使用 **Ethereal Email**（虚拟邮箱）：

1. 查看所有测试邮件：
   - 检查服务器启动日志
   - 找到 "Preview URL" 链接
   - 在浏览器中打开查看邮件

2. 正式环境将使用 Azure Communication Services 发送真实邮件

---

## 测试完成检查清单

- [ ] 所有测试场景执行完毕
- [ ] 所有验收标准达标
- [ ] 性能指标符合要求
- [ ] 发现的问题已记录
- [ ] 邮件通知已验证
- [ ] Swagger 文档准确
- [ ] 错误提示友好
- [ ] 准备好进行演示

**测试人员签名：** _______________
**测试日期：** 2026-01-27
**系统版本：** Sprint 3 - Badge Issuance v1.0
