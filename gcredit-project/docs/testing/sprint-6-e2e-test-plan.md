# Sprint 6 - End-to-End Test Plan

**测试日期**: 2026-01-31  
**测试环境**: Local Development (单机)  
**测试范围**: Sprint 6 所有功能 + 核心系统功能  
**测试人员**: AI Dev Agent

---

## 测试目标

验证G-Credit平台在本地开发环境下的完整功能链路：
1. ✅ 用户认证流程
2. ✅ Badge管理完整生命周期
3. ✅ Email通知系统
4. ✅ Badge分享功能 (Email, Widget)
5. ✅ Analytics统计功能
6. ✅ 数据持久化

---

## 测试环境准备

### 前置条件检查

```powershell
# 1. 检查后端服务
curl http://localhost:3000/health

# 2. 检查前端服务  
curl http://localhost:5173

# 3. 检查数据库连接
cd backend
npm run test:db

# 4. 验证环境变量
cat .env | Select-String "DATABASE_URL|JWT_SECRET|ENABLE_GRAPH_EMAIL"
```

### 测试数据准备

```powershell
# 重置数据库到干净状态
cd backend
npx prisma migrate reset --force
npx prisma db seed
```

---

## E2E Test Scenarios

### Scenario 1: 用户注册与登录 🔐

**目标**: 验证完整的身份认证流程

**步骤**:
1. [ ] 注册新用户 (Employee角色)
   - POST `/auth/register`
   - 验证用户创建成功
   - 检查数据库User表

2. [ ] 用户登录获取JWT
   - POST `/auth/login`
   - 验证返回accessToken
   - Token格式正确

3. [ ] 使用Token访问受保护资源
   - GET `/api/badges/wallet`
   - 验证401 → 200状态码变化

**预期结果**: 
- ✅ 新用户注册成功
- ✅ 登录返回有效token
- ✅ Token认证工作正常

---

### Scenario 2: Badge发行完整流程 📜

**目标**: 验证从创建template到发行badge的完整链路

**步骤**:
1. [ ] Issuer登录
   - 使用issuer@example.com账号

2. [ ] 创建Badge Template
   - POST `/api/badge-templates`
   - 上传badge图片 (可选)
   - 设置earning criteria

3. [ ] 发行Badge给员工
   - POST `/api/badges/issue`
   - 指定recipient email
   - Badge状态: PENDING

4. [ ] 验证Email通知发送 (如已配置Graph API)
   - 检查后端日志
   - 或检查邮箱

5. [ ] 员工Claim Badge
   - POST `/api/badges/claim`
   - 使用claim token
   - Badge状态: PENDING → CLAIMED

6. [ ] 验证Badge在Wallet显示
   - GET `/api/badges/wallet`
   - 前端: 访问 http://localhost:5173/wallet

**预期结果**:
- ✅ Template创建成功
- ✅ Badge发行成功
- ✅ 状态流转正确 (PENDING → CLAIMED)
- ✅ Wallet正确显示

---

### Scenario 3: Badge分享功能 📤

**目标**: 验证Email和Widget分享功能

**步骤**:

#### 3.1 Email分享
1. [ ] 打开Badge Detail Modal
   - 点击wallet中的badge卡片

2. [ ] 点击"Share Badge"按钮
   - 打开Share Modal

3. [ ] 填写Email分享表单
   - Recipient: test@example.com
   - Personal message: "Check out my badge!"

4. [ ] 提交分享请求
   - POST `/api/badges/share/email`
   - 验证API响应成功

5. [ ] 检查Analytics记录
   - GET `/api/badges/:id/analytics/shares`
   - 验证share count增加

#### 3.2 Widget嵌入
1. [ ] 点击Widget Tab
2. [ ] 点击"Open Widget Generator"
3. [ ] 访问 `/badges/:id/embed` 页面
4. [ ] 测试配置选项:
   - [ ] Size切换 (Small/Medium/Large)
   - [ ] Theme切换 (Light/Dark)
   - [ ] Show details toggle
5. [ ] 复制Iframe代码
6. [ ] 验证代码格式正确

**预期结果**:
- ✅ Email分享API调用成功
- ✅ Widget生成器正常工作
- ✅ Embed代码正确生成
- ✅ Analytics正确记录

---

### Scenario 4: Badge下载功能 💾

**目标**: 验证Badge PNG下载

**步骤**:
1. [ ] 打开Badge Detail Modal
2. [ ] 点击"Download PNG"按钮
3. [ ] 验证文件下载
   - 文件名: `{BadgeName}-badge.png`
   - 文件存在
4. [ ] 打开PNG文件验证内容

**预期结果**:
- ✅ 文件成功下载
- ⚠️ PNG内容为占位符 (技术债)

---

### Scenario 5: Admin Analytics Dashboard 📊

**目标**: 验证全局统计功能

**步骤**:
1. [ ] Admin用户登录
2. [ ] 访问 `/admin/analytics`
3. [ ] 验证显示内容:
   - [ ] Total Shares统计卡片
   - [ ] Platform Distribution图表
   - [ ] Recent Activity趋势
   - [ ] Top Shared Badges表格
4. [ ] 检查数据来源
   - 当前使用Mock数据 (Demo Mode)
   - 验证Banner显示

**预期结果**:
- ✅ 页面正常渲染
- ✅ Mock数据显示正确
- ✅ Demo Mode提示清晰

---

### Scenario 6: Badge Report Issue 🐛

**目标**: 验证问题报告功能

**步骤**:
1. [ ] 打开Badge Detail Modal
2. [ ] 滚动到"Report Issue" section
3. [ ] 填写表单:
   - Issue Type: "Incorrect information"
   - Description: "Badge expiration date is wrong"
4. [ ] 提交报告
5. [ ] 验证成功消息显示

**预期结果**:
- ✅ 表单提交成功
- ✅ 成功消息显示: "Report submitted..."

---

### Scenario 7: Badge撤销与验证 🔒

**目标**: 验证Badge撤销和公开验证功能

**步骤**:

#### 7.1 Badge撤销
1. [ ] Issuer登录
2. [ ] 访问已发行的badge
3. [ ] 撤销badge
   - PATCH `/api/badges/:id/revoke`
   - Reason: "No longer employed"
4. [ ] 验证状态变更
   - Badge status: REVOKED
5. [ ] 验证Wallet不再显示 (或标记为revoked)

#### 7.2 公开验证
1. [ ] 获取verification URL
   - From badge detail modal
2. [ ] 访问验证页面 (无需登录)
   - `/verify/:verificationId`
3. [ ] 验证显示内容:
   - Badge信息
   - 发行人信息
   - 状态 (CLAIMED/REVOKED)
4. [ ] 测试不存在的verification ID
   - 应显示404或"Not found"

**预期结果**:
- ✅ 撤销流程正常
- ✅ 公开验证页面工作
- ✅ 状态正确显示

---

## 测试执行

### Phase 1: 自动化API测试

```powershell
# 运行所有单元测试
cd backend
npm test

# 检查测试覆盖率
npm run test:cov
```

**预期**: 190/190 core tests passing

### Phase 2: 手动功能测试

按照上述Scenarios 1-7逐一执行，记录结果。

### Phase 3: 浏览器兼容性测试

- [ ] Chrome (主要测试浏览器)
- [ ] Edge
- [ ] Firefox (可选)

### Phase 4: 响应式测试

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 测试结果记录

### 执行时间
- **开始**: _______________
- **结束**: _______________
- **总耗时**: _______________

### 通过率

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| 认证流程 | 3 | - | - | -% |
| Badge发行 | 6 | - | - | -% |
| Badge分享 | 6 | - | - | -% |
| Badge下载 | 4 | - | - | -% |
| Admin功能 | 4 | - | - | -% |
| Issue报告 | 4 | - | - | -% |
| 撤销验证 | 7 | - | - | -% |
| **Total** | **34** | **-** | **-** | **-%** |

### 发现的问题

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| - | - | - | - |

### 技术债验证

- [ ] Teams分享正确显示为不可用
- [ ] Badge PNG为占位符 (已知)
- [ ] Admin analytics使用mock数据 (已知)

---

## 测试结论

### 系统稳定性
- [ ] 优秀 - 无关键问题
- [ ] 良好 - 有minor issues但不影响使用
- [ ] 需要改进 - 有影响用户体验的问题
- [ ] 不合格 - 有blocking issues

### MVP就绪度
- [ ] ✅ 可以发布MVP
- [ ] ⚠️ 需要修复minor issues后发布
- [ ] ❌ 不建议发布，需要重大修复

### 下一步建议
1. 
2. 
3. 

---

**测试完成签名**: _______________  
**日期**: 2026-01-31
