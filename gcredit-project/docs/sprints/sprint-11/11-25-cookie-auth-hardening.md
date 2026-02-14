# Story 11.25: Cookie Auth Hardening — httpOnly Cookie 迁移收尾

**Status:** ready  
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-5h  
**Source:** UAT 安全审计 — httpOnly cookie 迁移完整性排查 (2026-02-15)  
**Related:** Story 11.6 (SEC-002: JWT httpOnly Cookies)

## Story

As a platform operator,  
I want the httpOnly cookie authentication migration to be fully complete and consistent,  
So that no auth failures, cookie leaks, or silent degradations exist in any code path.

## Background

Sprint 11 Story 11.6 将 JWT 从 `Authorization: Bearer` header 迁移到 httpOnly cookies。
核心路径（`apiFetch`、`JwtStrategy`、Auth Controller、CORS）迁移正确。

但 2026-02-15 的全面审计发现：
- `JwtAuthGuard` 在 `@Public()` 路由上仍只检查 header，不读 cookie
- `clearCookie()` 参数不完整，生产环境可能清除失败
- Teams Action Controller 依赖浏览器 cookie 但 Teams 回调不携带 cookie
- 登录响应体仍泄露 token（违背 httpOnly 初衷）
- 前端 `VerifyBadgePage` 用原生 `axios` 绕过 `apiFetch`
- 测试代码未覆盖 cookie 认证路径

---

## Issue Inventory

### 🔴 Critical — 功能性缺陷

#### C-1: `JwtAuthGuard` 在 `@Public()` 路由上忽略 Cookie

- **文件:** `backend/src/common/guards/jwt-auth.guard.ts` L31-42
- **现象:** `@Public()` 路由的 best-effort 用户识别只检查 `Authorization` header，不检查 `cookies.access_token`。由于前端已全部走 cookie，`req.user` 在公开路由上永远为空
- **影响:** 任何 `@Public()` 端点如果可选使用 `req.user`（如日志记录、个性化响应）都将丢失用户上下文
- **修复:** 在 `isPublic` 分支中同时检查 `request.cookies?.access_token`

```typescript
// 修复后
if (isPublic) {
  const request = context.switchToHttp().getRequest<Request>();
  const authHeader = request.headers.authorization;
  const cookieToken = request.cookies?.access_token;
  if (authHeader?.startsWith('Bearer ') || cookieToken) {
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.then(() => true).catch(() => true);
    }
  }
  return true;
}
```

#### C-2: Teams Action Controller 使用 `JwtAuthGuard` 但 Teams 不发 Cookie

- **文件:** `backend/src/microsoft-graph/teams/teams-action.controller.ts` L44-45
- **现象:** `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` — Teams Adaptive Card 回调是服务器到服务器的 HTTP 调用，不携带浏览器 cookie，也不使用用户 JWT
- **影响:** Teams 中点击 "Claim Badge" 按钮将收到 401
- **修复方案:** 
  - Option A: 改为 `@Public()` + 自定义 Teams 签名验证 guard
  - Option B: 使用 webhook secret + HMAC 验证
  - 需要评估 Teams 当前集成状态后决定

---

### 🟡 Medium — 安全/可靠性风险

#### M-3: `clearCookie()` 参数不完整

- **文件:** `backend/src/modules/auth/auth.controller.ts` L108-109
- **现象:**
  ```typescript
  res.clearCookie('access_token', { path: '/api' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
  ```
  只传了 `path`，缺少 `httpOnly`、`secure`、`sameSite`。浏览器要求 `clearCookie` 的属性与 `setCookie` 完全匹配才能成功清除
- **影响:** 生产环境（`secure: true`）logout 可能无法清除 cookie，用户仍保持登录状态
- **修复:**
  ```typescript
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/api',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/api/auth',
  });
  ```

#### M-4: 登录响应体仍返回 Token（安全泄露）

- **文件:** `backend/src/modules/auth/auth.controller.ts` L56 注释 "Dual-write: body still returns tokens (transition period)"
- **现象:** `login()` 和 `register()` 的响应 JSON 中包含 `accessToken` 和 `refreshToken`
- **影响:** httpOnly cookie 的核心价值是防止 JavaScript 访问 token。body 中仍返回 token 意味着 XSS 攻击可以直接从响应中窃取
- **修复:** 从响应体中移除 `accessToken` 和 `refreshToken`，只保留 `user` 对象。前端 `authStore.ts` 确认已不读取响应中的 token

#### M-5: `VerifyBadgePage` 使用原生 `axios` 绕过 `apiFetch`

- **文件:** `frontend/src/pages/VerifyBadgePage.tsx` L20, L44
- **现象:** 直接 `import axios from 'axios'`，使用 `axios.get(...)` 而非 `apiFetch()`
- **影响:** 当前可工作（`/verify/:id` 是 `@Public()`），但架构不一致。如果未来该端点需要可选 auth、或 `apiFetch` 增加全局拦截器（错误处理、日志），此页面不受益
- **修复:** 替换为 `apiFetch('/verify/...')`，移除 `axios` import

---

### 🟢 Low — 技术债务 / 清理

#### L-6: 前端测试文件残留 `localStorage` mock

- **文件:**
  - `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx` L118
  - `frontend/src/pages/BulkIssuancePage.test.tsx` L52
- **现象:** `(window.localStorage.getItem as ...).mockReturnValue('test-token')` — 旧认证方式的残余
- **修复:** 删除这些 mock 行

#### L-7: E2E 测试只用 Bearer header，不测 Cookie 路径

- **文件:** `backend/test/helpers/test-setup.ts` L133-153
- **现象:** 90+ E2E 测试通过 `.set('Authorization', 'Bearer ...')` 认证。`JwtStrategy` 的 Bearer fallback 让测试通过，但从未测试过 cookie 认证路径
- **影响:** 如果 Bearer fallback 被移除，所有 E2E 测试将 break
- **修复:** 更新 `authRequest` helper 使用 `.set('Cookie', 'access_token=...')` 或 supertest agent cookie jar

#### L-8: Swagger 文档仍显示 Bearer Auth

- **文件:** `backend/src/main.ts` L267-276 (`.addBearerAuth(...)`)、多个 controller (`@ApiBearerAuth()`)
- **修复:** 添加 `.addCookieAuth('access_token')`，更新装饰器为 `@ApiCookieAuth()`

---

## Tasks

### Task 1: 修复 JwtAuthGuard 的 @Public() Cookie 支持 (30min)

**文件:** `backend/src/common/guards/jwt-auth.guard.ts`

- [ ] 在 `isPublic` 分支中增加 `request.cookies?.access_token` 检查
- [ ] 当存在 cookie 或 Bearer token 时，调用 `super.canActivate(context)`
- [ ] 更新注释文档
- [ ] 添加/更新单元测试覆盖 cookie 场景

**AC:**
- [ ] `@Public()` 路由 + cookie → `req.user` 被正确填充
- [ ] `@Public()` 路由 + no token → `req.user` 为 undefined，请求正常通过
- [ ] `@Public()` 路由 + invalid cookie → 请求正常通过，`req.user` 为 undefined

### Task 2: 修复 clearCookie 参数一致性 (15min)

**文件:** `backend/src/modules/auth/auth.controller.ts`

- [ ] `clearCookie('access_token')` 添加 `httpOnly`, `secure`, `sameSite`, `path` 参数
- [ ] `clearCookie('refresh_token')` 同上
- [ ] 抽取 cookie options 为常量/方法避免重复

**AC:**
- [ ] `clearCookie` 参数与 `setCookie` 完全一致
- [ ] Logout 在 `secure: true`（生产模式）下正常清除 cookie

### Task 3: 移除登录响应体中的 Token (30min)

**文件:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.controller.ts`

- [ ] `login()` 返回值移除 `accessToken` 和 `refreshToken`，只返回 `{ user }`
- [ ] `register()` 同上
- [ ] `refresh()` 同上
- [ ] 移除 "Dual-write" 注释
- [ ] 验证前端 `authStore.ts` 确认不依赖响应中的 token 字段
- [ ] 更新相关 DTO / Swagger 文档

**AC:**
- [ ] `POST /auth/login` 响应不包含 `accessToken` 或 `refreshToken`
- [ ] `POST /auth/register` 响应不包含 token
- [ ] `POST /auth/refresh` 响应不包含 token
- [ ] 前端登录/注册/刷新流程正常工作

### Task 4: VerifyBadgePage 迁移到 apiFetch (20min)

**文件:** `frontend/src/pages/VerifyBadgePage.tsx`

- [ ] 替换 `import axios from 'axios'` 为 `import { apiFetch } from '../lib/apiFetch'`
- [ ] 替换 `axios.get(...)` 为 `apiFetch('/verify/...')`
- [ ] 调整响应数据提取方式（`response.data` → `await response.json()`）
- [ ] 验证页面功能正常

**AC:**
- [ ] 无 `axios` import
- [ ] 使用 `apiFetch` 并发 `credentials: 'include'`
- [ ] 验证页面正常显示 badge 信息

### Task 5: Teams Action Controller 认证方案 (1.5-2h)

**文件:** `backend/src/microsoft-graph/teams/teams-action.controller.ts`

- [ ] 评估 Teams Adaptive Card 回调的实际认证需求
- [ ] Option A: 改为 `@Public()` + webhook secret 验证 guard
- [ ] Option B: 使用 Teams Bot Framework token 验证
- [ ] 更新 Swagger 文档
- [ ] 添加 E2E 测试

**AC:**
- [ ] Teams "Claim Badge" 回调不因缺少 cookie/JWT 而返回 401
- [ ] 端点有适当的认证保护（不能裸奔）
- [ ] 非 Teams 来源的请求被拒绝

### Task 6: 测试代码清理 (30min)

**文件:**
- `frontend/src/components/BulkIssuance/__tests__/BulkPreviewPage.test.tsx`
- `frontend/src/pages/BulkIssuancePage.test.tsx`
- `backend/test/helpers/test-setup.ts`

- [ ] 删除前端测试中的 `localStorage.getItem` token mock
- [ ] 评估 E2E test helper 是否需要同步迁移到 cookie（低优先级）
- [ ] 更新 Swagger `addBearerAuth` → 添加 `addCookieAuth`

**AC:**
- [ ] 前端测试无残留的 localStorage token mock
- [ ] 所有测试通过

---

## Affected Files Summary

| File | Change |
|------|--------|
| `backend/src/common/guards/jwt-auth.guard.ts` | 增加 cookie 检查 in @Public() |
| `backend/src/modules/auth/auth.controller.ts` | clearCookie 参数 + 移除 body token |
| `backend/src/modules/auth/auth.service.ts` | 返回值移除 token |
| `backend/src/microsoft-graph/teams/teams-action.controller.ts` | 认证方案调整 |
| `frontend/src/pages/VerifyBadgePage.tsx` | axios → apiFetch |
| `frontend/src/**/__tests__/BulkPreviewPage.test.tsx` | 删除 localStorage mock |
| `frontend/src/pages/BulkIssuancePage.test.tsx` | 删除 localStorage mock |
| `backend/src/main.ts` | Swagger cookie auth 文档 |
| `backend/test/helpers/test-setup.ts` | 评估 cookie 认证方式 |

---

## Estimation Breakdown

| Task | Estimate | Priority |
|------|----------|----------|
| Task 1: JwtAuthGuard @Public() cookie | 30min | 🔴 |
| Task 2: clearCookie 参数修复 | 15min | 🟡 |
| Task 3: 移除响应体 token | 30min | 🟡 |
| Task 4: VerifyBadgePage → apiFetch | 20min | 🟡 |
| Task 5: Teams 认证方案 | 1.5-2h | 🔴 |
| Task 6: 测试清理 | 30min | 🟢 |
| **TOTAL** | **3.5-4h** | |

---

## Out of Scope

- CSRF token 机制（`sameSite: 'lax'` + JSON Content-Type 已提供足够保护）
- E2E 测试全面迁移到 cookie（保留 Bearer fallback 即可）
- `sameSite: 'strict'` 升级（会破坏跨域重定向场景）
