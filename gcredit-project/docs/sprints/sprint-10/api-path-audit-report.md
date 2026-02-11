# API 调用路径审计报告

**审计日期:** 2026-02-09  
**审计人:** SM (Bob)  
**审计范围:** 全部前端 API 调用点 vs 全部后端 NestJS 路由  
**目的:** v1.0.0 Release UAT 前置审计  
**Branch:** `sprint-10/v1-release` (HEAD: `c5c1cc4`)

---

## 审计方法

1. 提取后端所有 `@Controller` + `@Get/@Post/@Patch/@Delete` 装饰器路由
2. 提取前端所有 `fetch()` / `axios` 调用点
3. 交叉验证路径匹配
4. 检查 `main.ts` 全局前缀、Vite proxy 配置
5. 参照 E2E 测试路径作为基准

---

## 关键基础设施

| 配置 | 值 | 文件 |
|------|----|------|
| NestJS 全局前缀 | **无** (`setGlobalPrefix` 未调用) | `backend/src/main.ts` |
| Frontend API_BASE_URL | `import.meta.env.VITE_API_URL \|\| '/api'` | `frontend/src/lib/apiConfig.ts` |
| Vite Dev Proxy | `/api` → `http://localhost:3000` (无 rewrite) | `frontend/vite.config.ts` L16-20 |

**Proxy 行为说明：** Vite proxy 将 `/api/xxx` 原样转发到 `http://localhost:3000/api/xxx`。**不做路径重写。** 因此前端调用 `/api/auth/login` 到达后端的路径是 `/api/auth/login`，而后端路由是 `/auth/login` — **不匹配。**

---

## 📊 后端控制器路由前缀分类

### ✅ 有 `api/` 前缀的控制器 (15 个)

| Controller | 前缀 |
|------------|------|
| AdminUsersController | `api/admin/users` |
| AnalyticsController | `api/analytics` |
| BadgeIssuanceController | `api/badges` |
| BadgeSharingController | `api/badges/share` |
| BadgeAnalyticsController | `api/badges` |
| TeamsSharingController | `api/badges` |
| WidgetEmbedController | `api/badges` |
| BadgeVerificationController | `api/verify` |
| BulkIssuanceController | `api/bulk-issuance` |
| DashboardController | `api/dashboard` |
| EvidenceController | `api/badges/:badgeId/evidence` |
| M365SyncController | `api/admin/m365-sync` |
| TeamsActionController | `api/teams/actions` |
| MilestonesController | `api` |
| AppController | `` (root) |

### ❌ 缺少 `api/` 前缀的控制器 (4 个)

| Controller | 当前前缀 | 应为 |
|------------|---------|------|
| **AuthController** | `auth` | `api/auth` |
| **BadgeTemplatesController** | `badge-templates` | `api/badge-templates` |
| **SkillsController** | `skills` | `api/skills` |
| **SkillCategoriesController** | `skill-categories` | `api/skill-categories` |

---

## 🔴 CRITICAL 发现

### CRITICAL-1: Auth 路由前缀不匹配

| 项目 | 值 |
|------|----|
| **前端调用** | `fetch('/api/auth/login', ...)` |
| **后端路由** | `@Controller('auth')` → `/auth/login` |
| **E2E 测试** | `.post('/auth/login')` ← 证实后端无 `api/` |
| **影响** | 前端 → proxy → `localhost:3000/api/auth/login` → **404** |
| **涉及文件** | `frontend/src/stores/authStore.ts:55` |
| **涉及功能** | 用户登录 — **核心功能** |

**分析：** authStore 硬编码 `/api/auth/login`，但后端 `@Controller('auth')` 没有 `api/` 前缀。在开发环境中，Vite proxy 不做 path rewrite，所以请求以 `/api/auth/login` 到达后端 — **但后端只监听 `/auth/login`。**

> ⚠️ **但如果开发中登录功能正常工作**，说明可能有我们未发现的中间件或路由配置。**需要 Dev 实际验证。**

---

### CRITICAL-2: Badge Templates 路由前缀不匹配

| 项目 | 值 |
|------|----|
| **前端调用** | `fetch(\`${API_BASE_URL}/badge-templates?status=APPROVED\`)` → `/api/badge-templates?...` |
| **后端路由** | `@Controller('badge-templates')` → `/badge-templates` |
| **E2E 测试** | `.post('/badge-templates')`, `.get('/badge-templates')` ← 证实无 `api/` |
| **影响** | Bulk Issuance 模板选择 → **404** |
| **涉及文件** | `frontend/src/components/BulkIssuance/TemplateSelector.tsx:46` |

---

### CRITICAL-3: Skills 路由前缀不匹配

| 项目 | 值 |
|------|----|
| **前端调用** | `fetch('/api/skills', ...)` 和 `fetch('/api/skills/search?q=...', ...)` |
| **后端路由** | `@Controller('skills')` → `/skills`, `/skills/search` |
| **E2E 测试** | `.post('/skills')` ← 证实无 `api/` |
| **影响** | 技能筛选功能 → **404** |
| **涉及文件** | `frontend/src/hooks/useSkills.ts:42, :44` (hardcoded `/api/skills`) |

---

### CRITICAL-4: Evidence Download/Preview 路径错误

| 项目 | 值 |
|------|----|
| **前端调用 (download)** | `fetch(\`${API_BASE_URL}/evidence/${badgeId}/${fileId}/download\`)` → `/api/evidence/:badgeId/:fileId/download` |
| **后端路由** | `@Controller('api/badges/:badgeId/evidence')` + `@Get(':fileId/download')` → `/api/badges/:badgeId/evidence/:fileId/download` |
| **前端调用 (preview)** | `fetch(\`${API_BASE_URL}/evidence/${badgeId}/${fileId}/preview\`)` → `/api/evidence/:badgeId/:fileId/preview` |
| **后端路由** | → `/api/badges/:badgeId/evidence/:fileId/preview` |
| **影响** | Evidence 文件下载和预览 → **404** |
| **涉及文件** | `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx:65, :98` |

**分析：** 前端路径缺少 `/badges` 路径段。
- ❌ 前端: `/api/evidence/:badgeId/:fileId/download`
- ✅ 应为: `/api/badges/:badgeId/evidence/:fileId/download`

---

### CRITICAL-5: Teams Share 路径顺序错误

| 项目 | 值 |
|------|----|
| **前端调用** | `fetch(\`${API_BASE_URL}/badges/${badgeId}/teams/share\`)` → `/api/badges/:id/teams/share` |
| **后端路由** | `@Controller('api/badges')` + `@Post(':badgeId/share/teams')` → `/api/badges/:id/share/teams` |
| **影响** | Teams 分享功能 → **404** |
| **涉及文件** | `frontend/src/lib/badgeShareApi.ts:94` |

**分析：** 路径段顺序颠倒。
- ❌ 前端: `.../teams/share`
- ✅ 后端: `.../share/teams`

---

## 🟡 HIGH 发现

### HIGH-1: 硬编码 `/api/...` 绕过 API_BASE_URL (8 处)

以下文件直接硬编码 `/api/...` 而不使用 `API_BASE_URL`，生产环境如果设置了 `VITE_API_URL`，这些调用会指向错误地址：

| 文件 | 行 | 路径 |
|------|----|------|
| `stores/authStore.ts` | 55 | `/api/auth/login` |
| `hooks/useSkills.ts` | 42,44 | `/api/skills`, `/api/skills/search` |
| `lib/adminUsersApi.ts` | 75 | `/api/admin/users` |
| `components/BulkIssuance/BulkPreviewPage.tsx` | 93 | `/api/bulk-issuance/preview/...` |
| `components/BulkIssuance/BulkPreviewPage.tsx` | 132 | `/api/bulk-issuance/error-report/...` |
| `components/BulkIssuance/BulkPreviewPage.tsx` | 169 | `/api/bulk-issuance/confirm/...` |
| `components/BulkIssuance/ProcessingComplete.tsx` | 39 | `/api/bulk-issuance/error-report/...` |

> **注意：** `adminUsersApi.ts` 和 `BulkPreviewPage.tsx` 的硬编码路径**恰好与后端路由匹配**（后端有 `api/` 前缀），所以在当前 Vite proxy 下能工作。但不遵循统一 `API_BASE_URL` 模式。

### HIGH-2: SkillCategories 路由前端未调用但有前缀问题

`@Controller('skill-categories')` 存在但未找到前端对应调用。如果被 admin 页面使用，同样存在 CRITICAL-3 的前缀问题。

---

## 🟠 MEDIUM 发现

### MEDIUM-1: AdminAnalyticsPage 使用 Mock 数据

`AdminAnalyticsPage` 尚未连接到 `/api/analytics/*` 后端 API。这是 Story 10.5 的范围，不是 bug。

### MEDIUM-2: 混合使用 fetch + axios

| Library | 使用位置 |
|---------|---------|
| `fetch` | 所有 API 调用（30+ 处） |
| `axios` | 仅 `VerifyBadgePage.tsx:42` |

项目使用 `fetch` 为主，`VerifyBadgePage` 单独使用 `axios`。不影响功能，但不一致。

### MEDIUM-3: Auth Header 获取方式不一致

| 模式 | 使用位置 |
|------|---------|
| `localStorage.getItem('accessToken')` | `EvidenceSection`, `useSkills`, `badgeShareApi`, `badgesApi` 等 |
| `useAuthStore.getState().getAccessToken()` | (推荐但未广泛使用) |

两种方式功能等价，全部读 localStorage，但不一致。

---

## ✅ 验证通过的路由 (24 条无问题)

| 前端调用 | 后端路由 | 状态 |
|---------|---------|------|
| `/api/badges/:id` | `api/badges` + `@Get(':id')` | ✅ |
| `/api/badges/:id/download/png` | `api/badges` + `@Get(':id/download/png')` | ✅ |
| `/api/badges/:id/claim` | `api/badges` + `@Post(':id/claim')` | ✅ |
| `/api/badges/:badgeId/evidence` (GET list) | `api/badges/:badgeId/evidence` + `@Get()` | ✅ |
| `/api/badges/:id/report` | `api/badges` + `@Post(':id/report')` | ✅ |
| `/api/badges/:id/similar` | `api/badges` + `@Get(':id/similar')` | ✅ |
| `/api/badges/wallet` | `api/badges` + `@Get('wallet')` | ✅ |
| `/api/badges/issued` | `api/badges` + `@Get('issued')` | ✅ |
| `/api/badges/:id/revoke` | `api/badges` + `@Post(':id/revoke')` | ✅ |
| `/api/badges/share/email` | `api/badges/share` + `@Post('email')` | ✅ |
| `/api/badges/:id/analytics/shares` | `api/badges` + `@Get(':id/analytics/shares')` | ✅ |
| `/api/badges/:id/embed` | `api/badges` + `@Get(':id/embed')` | ✅ |
| `/api/badges/:id/widget` | `api/badges` + `@Get(':id/widget')` | ✅ |
| `/api/bulk-issuance/template` | `api/bulk-issuance` + `@Get('template')` | ✅ |
| `/api/bulk-issuance/upload` | `api/bulk-issuance` + `@Post('upload')` | ✅ |
| `/api/bulk-issuance/preview/:id` | `api/bulk-issuance` + `@Get('preview/:sessionId')` | ✅ |
| `/api/bulk-issuance/confirm/:id` | `api/bulk-issuance` + `@Post('confirm/:sessionId')` | ✅ |
| `/api/bulk-issuance/error-report/:id` | `api/bulk-issuance` + `@Get('error-report/:sessionId')` | ✅ |
| `/api/verify/:id` | `api/verify` + `@Get(':verificationId')` | ✅ |
| `/api/dashboard/employee` | `api/dashboard` + `@Get('employee')` | ✅ |
| `/api/dashboard/issuer` | `api/dashboard` + `@Get('issuer')` | ✅ |
| `/api/dashboard/manager` | `api/dashboard` + `@Get('manager')` | ✅ |
| `/api/admin/users` | `api/admin/users` + `@Get()` | ✅ |
| `/api/admin/users/:id/role` | `api/admin/users` + `@Patch(':id/role')` | ✅ |

---

## 📋 修复建议

### 推荐方案: 后端添加 `api/` 前缀 + 前端路径修复

**后端 (4 控制器):**

```typescript
// auth.controller.ts
@Controller('api/auth')              // was: @Controller('auth')

// badge-templates.controller.ts
@Controller('api/badge-templates')   // was: @Controller('badge-templates')

// skills.controller.ts
@Controller('api/skills')            // was: @Controller('skills')

// skill-categories.controller.ts
@Controller('api/skill-categories')  // was: @Controller('skill-categories')
```

**前端 (3 路径 bug 修复):**

```typescript
// EvidenceSection.tsx:65 — 修复路径
// ❌ `${API_BASE_URL}/evidence/${badgeId}/${fileId}/download`
// ✅ `${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/download`

// EvidenceSection.tsx:98 — 修复路径
// ❌ `${API_BASE_URL}/evidence/${badgeId}/${fileId}/preview`
// ✅ `${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/preview`

// badgeShareApi.ts:94 — 修复路径顺序
// ❌ `${API_BASE_URL}/badges/${badgeId}/teams/share`
// ✅ `${API_BASE_URL}/badges/${badgeId}/share/teams`
```

**前端 (硬编码统一化):**

```typescript
// 将以下文件中的硬编码 '/api/...' 替换为 `${API_BASE_URL}/...`
// authStore.ts, useSkills.ts, adminUsersApi.ts, BulkPreviewPage.tsx, ProcessingComplete.tsx
```

**后端 E2E 测试路径更新:**

```typescript
// 所有 E2E 测试中的 '/auth/...' → '/api/auth/...'
// 所有 '/badge-templates/...' → '/api/badge-templates/...'
// 所有 '/skills/...' → '/api/skills/...'
```

---

## 🎯 建议执行计划

| 改动类型 | 文件数 | 预估 |
|---------|-------|------|
| 后端 4 控制器加 `api/` 前缀 | 4 | 15min |
| 后端 E2E 测试路径更新 | ~5 | 20min |
| 前端 Evidence 路径修复 | 1 | 5min |
| 前端 Teams share 路径修复 | 1 | 5min |
| 前端硬编码 → API_BASE_URL | 4 | 15min |
| 回归测试验证 | — | 20min |
| **总计** | **~15 files** | **~1.5h** |

**建议：新建 Story 10.4b 或合并到 Story 10.4 中处理。**

---

## 审计结论

| 严重度 | 数量 | 状态 |
|--------|------|------|
| 🔴 CRITICAL | 5 | 需在 UAT 前修复 |
| 🟡 HIGH | 2 | 建议修复 |
| 🟠 MEDIUM | 3 | 可接受风险 |
| ✅ PASS | 24 | 路由匹配正确 |

**5 个 CRITICAL 路径不匹配将导致对应功能返回 404。必须在 UAT 前修复。**

> **开放问题：** 如果上述 CRITICAL 路径在开发中实际能工作（用户登录正常），说明可能有我们未发现的中间件或路由配置。**需要 Dev 实际启动前后端并验证。**
