# Sprint 11 — Wave 1 Dev Prompt

**Wave:** 1 of 5 — Quick Wins + Security Foundation  
**Sprint Branch:** `sprint-11/security-quality-hardening`  
**Baseline Commit:** `c139219`  
**Estimated Time:** ~3h  
**Test Baseline:** Backend 534 + Frontend 527 = **1061 tests**

---

## 🎯 Wave 1 目标

完成 5 个低风险、高价值的快速修复项，建立 Sprint 11 开发节奏。

**验收标准：**
- [ ] `npm audit` 双端 0 HIGH 漏洞
- [ ] Swagger 仅在非 production 环境加载
- [ ] 移除未使用依赖 (keyv, framer-motion)
- [ ] User Management 导航标签统一为 "Users"
- [ ] 验证页 Issuer 邮箱脱敏 + 隐私信任声明
- [ ] ClaimPage 不再使用硬编码 UUID
- [ ] 全部测试通过（0 regressions）
- [ ] Prettier + ESLint 0 errors

---

## Story 11.3: SEC-007+DEP-001 — npm Audit Fix + Swagger Conditional Loading

**预估:** 30min | **优先级:** 🔴 CRITICAL

### 当前问题
- **Backend:** 5 vulnerabilities (1 high: `@isaacs/brace-expansion`, 3 moderate: `lodash`, `qs`, 1 low)
- **Frontend:** 1 vulnerability (1 high: `axios` DoS via `__proto__` key)
- **Swagger:** 在所有环境（包括 production）无条件加载

### 需要修改的文件

#### 1. Backend npm audit fix
```bash
cd gcredit-project/backend
npm audit fix
```

#### 2. Frontend npm audit fix
```bash
cd gcredit-project/frontend
npm audit fix
```

#### 3. Swagger 条件加载
**文件:** `gcredit-project/backend/src/main.ts`  
**当前代码 (L246-290):** Swagger 无条件初始化

```typescript
// 当前：无条件执行
const config = new DocumentBuilder()
  .setTitle('G-Credit Digital Badge Platform API')
  // ... 完整配置 ...
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document, { ... });
```

**目标：** 用 `if (process.env.NODE_ENV !== 'production')` 包裹整个 Swagger 代码块（L246-290），包括 `DocumentBuilder`、`createDocument`、`SwaggerModule.setup`。

```typescript
// 目标：仅在非 production 环境加载
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('G-Credit Digital Badge Platform API')
    // ... 完整配置 ...
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, { ... });
}
```

**注意：** 顶部的 `import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';`（L3）可以保留，不影响 tree-shaking。同时将日志 `📚 API Documentation available at:` 也放进条件块中。

### 验收
- [ ] `npm audit` 双端 0 HIGH
- [ ] `NODE_ENV=production` 时 `/api-docs` 返回 404
- [ ] `NODE_ENV=development` 或未设置时 Swagger 正常访问
- [ ] 所有现有测试通过

---

## Story 11.14: CQ-005 — Remove Unused Dependencies

**预估:** 15min | **优先级:** 🟢 LOW

### 当前问题
经代码审计，以下依赖已无任何 import 引用：

| 依赖 | 所在 package.json | 源码引用 | 操作 |
|------|-------------------|---------|------|
| `keyv` | backend/package.json | 0 imports | ✅ 删除 |
| `framer-motion` | frontend/package.json | 0 imports, 仅 vite.config.ts chunk 引用 | ✅ 删除 |
| `tailwindcss-animate` | frontend/package.json | index.css `@plugin` + shadcn/ui 动画依赖 | ⚠️ **保留** |

### 需要修改的文件

#### 1. Backend: 删除 keyv
```bash
cd gcredit-project/backend
npm uninstall keyv
```

#### 2. Frontend: 删除 framer-motion
```bash
cd gcredit-project/frontend
npm uninstall framer-motion
```

#### 3. 清理 vite.config.ts chunk 配置
**文件:** `gcredit-project/frontend/vite.config.ts`  
**位置:** 约 L34，rollupOptions.output.manualChunks 中

删除以下 chunk 分割配置行：
```typescript
'animation-vendor': ['framer-motion'],  // ← 删除此行
```

#### ⚠️ tailwindcss-animate 不要删除
该依赖通过 `frontend/src/index.css` 的 `@plugin "tailwindcss-animate"` 加载，是 shadcn/ui 组件（Dialog, Sheet, Accordion 等）的 `animate-in` / `animate-out` 动画基础。删除会导致 UI 动画全部失效。**保留。**

### 验收
- [ ] `grep -r "keyv" backend/src/` 无结果
- [ ] `grep -r "framer-motion" frontend/src/` 无结果
- [ ] vite.config.ts 中无 `framer-motion` 引用
- [ ] `npm run build` 双端成功
- [ ] 所有现有测试通过

---

## Story 11.23: FEAT-008-P0 — User Management Navigation Entry Fix

**预估:** 30min | **优先级:** 🟡 HIGH

### 当前状态
经代码检查，导航项**已存在**于两处：

| 组件 | 文件 | 标签 | 角色限制 |
|------|------|------|---------|
| Desktop Navbar | `frontend/src/components/Navbar.tsx` L137-153 | **"Users"** | ADMIN ✅ |
| Mobile Nav | `frontend/src/components/layout/MobileNav.tsx` L109 | **"User Management"** | ADMIN ✅ |

### 实际问题
标签不一致：Desktop 显示 "Users"，Mobile 显示 "User Management"。UX Review 建议统一为 **"Users"**（简洁，与其他导航项命名风格一致）。

### 需要修改的文件

#### 1. MobileNav.tsx — 移动端标签统一
**文件:** `gcredit-project/frontend/src/components/layout/MobileNav.tsx`  
**位置:** L109，`navLinks` 数组中的 User Management 条目

```tsx
// 当前
{ to: '/admin/users', label: 'User Management', roles: ['ADMIN'] },

// 改为
{ to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
```

#### 2. Navbar.tsx — Desktop 端保持不变
**无需修改。** 已经是 "Users"。

#### 3. 功能验证
- 登录 admin@gcredit.com，确认 Desktop 侧边栏显示 "Users"
- 缩小窗口到手机宽度，确认汉堡菜单显示 "Users"
- 点击导航到 `/admin/users` 页面正常渲染
- 登录 issuer@gcredit.com，确认两端**不**显示 Users

### 验收
- [ ] Desktop 与 Mobile 导航标签统一为 "Users"
- [ ] 仅 ADMIN 角色可见
- [ ] 点击正常导航到 `/admin/users`
- [ ] 前端测试通过

---

## Story 11.7: SEC-003 — Issuer Email Masking on Public Verification Pages

**预估:** 30min | **优先级:** 🟡 MEDIUM

### 当前问题
公开验证页面（`/verify/:code`）中：
- ✅ **Recipient 邮箱** 已脱敏（`j***@example.com`）
- ❌ **Issuer 邮箱** 未脱敏，完整暴露

### 根因
**文件:** `gcredit-project/backend/src/badge-verification/badge-verification.service.ts`

```typescript
// L136-143: Recipient 已脱敏 ✅
recipient: {
  name: `${badge.recipient.firstName} ${badge.recipient.lastName}`,
  email: this.maskEmail(badge.recipient.email),  // ✅ 已脱敏
},

// Issuer 未脱敏 ❌
issuer: {
  name: `${badge.issuer.firstName} ${badge.issuer.lastName}`,
  email: badge.issuer.email,  // ❌ 明文暴露
},
```

`maskEmail()` 方法已存在于同一 service（L187-194）。

### 修改方案（一行后端修复 + 前端信任声明）

#### 1. 后端: Issuer 邮箱脱敏
**文件:** `gcredit-project/backend/src/badge-verification/badge-verification.service.ts`  
**位置:** L142

```typescript
// 当前
email: badge.issuer.email,

// 改为
email: this.maskEmail(badge.issuer.email),
```

#### 2. 前端: 添加隐私信任声明 (UX Review)
**文件:** `gcredit-project/frontend/src/pages/VerifyBadgePage.tsx`  
在页面底部（Download 按钮下方）添加信任声明文案：

```tsx
<p className="mt-6 text-xs text-neutral-400 text-center max-w-md">
  Personal information is partially hidden to protect privacy.
  Badge authenticity is verified by G-Credit's cryptographic signature.
</p>
```

样式与页面底部元素一致，使用 `text-xs text-neutral-400`。

### 验收
- [ ] 公开验证页面 Issuer 邮箱显示为 `j***@example.com` 格式
- [ ] Recipient 邮箱仍然脱敏
- [ ] 页面底部显示隐私信任声明文案
- [ ] 单元测试覆盖 Issuer 邮箱脱敏逻辑
- [ ] 现有 badge-verification 测试通过

---

## Story 11.20: FEATURE-P1-8 — ClaimPage Hardcoded UUID Fix

**预估:** 1h | **优先级:** 🟡 MEDIUM

### 当前问题
**文件:** `gcredit-project/frontend/src/pages/ClaimBadgePage.tsx` L43-44

```tsx
// Use a placeholder UUID; the backend ignores :id when claimToken is provided
const response = await fetch(
  `${API_BASE_URL}/badges/00000000-0000-0000-0000-000000000000/claim`,
  { ... }
);
```

前端使用硬编码的 nil UUID 作为路径参数。虽然后端在有 `claimToken` 时忽略 `:id`，但这是技术债务，URL 不干净且对前端开发者有误导性。

### 后端路由现状
**文件:** `gcredit-project/backend/src/badge-issuance/badge-issuance.controller.ts` L78-115

```typescript
@Post(':id/claim')
@Public()
async claimBadge(
  @Param('id') id: string,
  @Body() dto: ClaimBadgeDto,
  @Request() req: RequestWithUser,
) {
  if (dto.claimToken) {
    return this.badgeService.claimBadge(dto.claimToken);  // ← ignores :id
  }
  return this.badgeService.claimBadgeById(id, req.user?.userId);
}
```

### 推荐方案：新增专用 Token Claim 路由

#### 1. Backend: 新增 `POST /api/badges/claim` 路由
**文件:** `gcredit-project/backend/src/badge-issuance/badge-issuance.controller.ts`

在现有 `@Post(':id/claim')` **之前** 新增（路由顺序重要，`:id` 会吞噬 `claim`）：

```typescript
@Post('claim')
@Public()
@ApiOperation({
  summary: 'Claim a badge using claim token (no badge ID required)',
})
@ApiResponse({ status: 200, description: 'Badge claimed successfully' })
@ApiResponse({ status: 404, description: 'Invalid claim token' })
@ApiResponse({ status: 410, description: 'Badge expired or revoked' })
async claimBadgeByToken(@Body() dto: ClaimBadgeDto) {
  if (!dto.claimToken) {
    throw new BadRequestException('claimToken is required');
  }
  return this.badgeService.claimBadge(dto.claimToken);
}
```

**注意路由优先级：** NestJS 中静态路由 `claim` 必须在参数路由 `:id/claim` 之前声明，否则 `claim` 会被当作 `:id` 参数匹配。

#### 2. Frontend: ClaimBadgePage 使用新路由
**文件:** `gcredit-project/frontend/src/pages/ClaimBadgePage.tsx` L41-44

```tsx
// 当前
const response = await fetch(
  `${API_BASE_URL}/badges/00000000-0000-0000-0000-000000000000/claim`,
  { ... }
);

// 改为
const response = await fetch(
  `${API_BASE_URL}/badges/claim`,
  { ... }
);
```

删除 L43 的注释 `// Use a placeholder UUID; the backend ignores :id when claimToken is provided`。

#### 3. 保留原路由兼容性
`@Post(':id/claim')` 保留不变，供已认证用户通过 badge ID 直接 claim 使用。

### 验收
- [ ] `POST /api/badges/claim` 带 `{ claimToken: "xxx" }` 正常工作
- [ ] `POST /api/badges/:id/claim` 原有功能不受影响
- [ ] ClaimBadgePage 不再有任何硬编码 UUID
- [ ] Claim 流程端到端测试通过
- [ ] 新路由有 Swagger 文档
- [ ] 后端 + 前端测试通过

---

## 📋 执行顺序

```
1. Story 11.3  → npm audit fix (BE+FE) + Swagger 条件加载
2. Story 11.14 → 删除 keyv, framer-motion + 清理 vite.config.ts
3. Story 11.23 → MobileNav "User Management" → "Users" (统一标签)
4. Story 11.7  → badge-verification.service.ts 邮箱脱敏 + VerifyBadgePage 信任声明
5. Story 11.20 → 新增 POST /badges/claim + 更新 ClaimBadgePage
```

每个 Story 完成后：
1. 运行 `npm run test` (BE) + `npx vitest run` (FE) 确认 0 regressions
2. `npx prettier --check` 确认格式
3. 单独 commit（commit message 格式: `fix(scope): description` 或 `feat(scope): description`）

## 📋 Wave 1 完成后

- [ ] 全部 5 stories committed
- [ ] `git push` 推送到远程
- [ ] 更新 backlog.md 中 5 个 story 状态为 ✅ Done
- [ ] 运行完整测试确认基线：BE ≥534 + FE ≥527
- [ ] 准备 Wave 2 prompt

---

**Created:** 2026-02-13  
**Author:** SM Agent (Bob)
