# Story 10.3c Dev Prompt: API Path Audit Fixes — Route Mismatch + Hardcoded URL Cleanup

**Story Doc:** [10-3c-api-path-audit-fixes.md](10-3c-api-path-audit-fixes.md)  
**Audit Report:** [api-path-audit-report.md](api-path-audit-report.md)  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 2h  
**Goal:** 修复 5 个 CRITICAL API 路径不匹配 + 8 个硬编码 URL

---

## ⚠️ 重要：先验证再修复（两阶段执行）

本 Story 来源于 SM 的**静态审计**（代码分析），但存在一个**开放问题**：

> 如果 CRITICAL-1~3（auth / badge-templates / skills 路径不匹配）的功能在本地开发中**实际能正常工作**，说明可能存在**未发现的路由转发机制**（如 NestJS middleware、Helmet、或其他配置），审计结论可能不完全准确。

**因此，本 Story 必须采用两阶段执行：**

| 阶段 | 目标 | 决策 |
|------|------|------|
| **Phase 0: 验证** | 启动前后端，实际访问审计标记的路径，确认哪些真的 404 | 决定真实修复范围 |
| **Phase 1: 修复** | 按 Phase 0 验证结果执行修复 | 只修已确认的问题 |

---

## Phase 0: 路径验证（必须首先执行）

### Step 0.1: 启动后端

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
```

### Step 0.2: 逐条验证 CRITICAL 路径

在另一个终端执行，**记录每条请求的实际 HTTP 状态码**：

```powershell
# ===== CRITICAL-1: Auth (控制器 @Controller('auth')) =====
# 当前后端实际路由（应该能匹配）
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
# 预期: 401 (认证失败，但不是 404)

# 前端通过 Vite proxy 后到达的路径（审计认为会 404）
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
# 预期: 404 (如果真的没有 api/ 前缀) 或 401 (如果有隐藏机制)

# ===== CRITICAL-2: Badge Templates (控制器 @Controller('badge-templates')) =====
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/badge-templates
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/badge-templates
# 预期: 第一个 200/401, 第二个 404（如审计所说）

# ===== CRITICAL-3: Skills (控制器 @Controller('skills')) =====
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/skills
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/skills
# 预期: 第一个 200/401, 第二个 404

# ===== CRITICAL-4: Evidence Download (控制器 @Controller('api/badges/:badgeId/evidence')) =====
# 后端实际路由
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/badges/test-id/evidence/file-id/download
# 前端当前请求路径（缺少 /badges 段）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/evidence/test-id/file-id/download
# 预期: 第一个 401/403, 第二个 404

# ===== CRITICAL-5: Teams Share (控制器 @Controller('api/badges') + @Post(':badgeId/share/teams')) =====
# 后端实际路由
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/badges/test-id/share/teams
# 前端当前请求路径（顺序颠倒）
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/badges/test-id/teams/share
# 预期: 第一个 401/403, 第二个 404
```

### Step 0.3: 记录验证结果

**创建临时记录表，记录每条路径的实际状态码：**

| Finding | 路径 | 预期 | 实际状态码 | 确认 404？ |
|---------|------|------|-----------|-----------|
| CRITICAL-1 | `/api/auth/login` | 404 | _______ | Y / N |
| CRITICAL-2 | `/api/badge-templates` | 404 | _______ | Y / N |
| CRITICAL-3 | `/api/skills` | 404 | _______ | Y / N |
| CRITICAL-4 | `/api/evidence/:id/:fid/download` | 404 | _______ | Y / N |
| CRITICAL-5 | `/api/badges/:id/teams/share` | 404 | _______ | Y / N |

### Step 0.4: 决策矩阵

根据 Phase 0 验证结果，决定 Phase 1 修复范围：

| 场景 | 行动 |
|------|------|
| **全部 404 确认** | 按 Phase 1 全面修复（原计划） |
| **CRITICAL-1~3 不是 404（有隐藏路由机制）** | **停下来**，调查隐藏机制（可能是 middleware/guard），CRITICAL-1~3 的控制器前缀**不要改**，只修 CRITICAL-4/5 + 硬编码 URL |
| **部分 404** | 只修确认为 404 的路径，其他不动 |

> ⚠️ **如果发现 CRITICAL-1~3 不是 404，请在 commit message 中说明发现了什么机制，并更新 Story doc 的 Dev Notes。**

---

## Phase 1: 修复（按 Phase 0 结果执行）

> **以下实施步骤假设 Phase 0 全部确认为 404（最大范围修复）。如果 Phase 0 结果不同，请据此缩减范围。**

---

### Step 1: 后端控制器前缀修复 (15min)

> ⚠️ **仅修复 Phase 0 中确认为 404 的控制器**

**4 个文件，每个只改一行 `@Controller` 装饰器：**

#### 1a. AuthController

**文件：** `backend/src/auth/auth.controller.ts`

```typescript
// ❌ 当前
@Controller('auth')

// ✅ 修改为
@Controller('api/auth')
```

#### 1b. BadgeTemplatesController

**文件：** `backend/src/badge-templates/badge-templates.controller.ts`

```typescript
// ❌ 当前
@Controller('badge-templates')

// ✅ 修改为
@Controller('api/badge-templates')
```

#### 1c. SkillsController

**文件：** `backend/src/skills/skills.controller.ts`

```typescript
// ❌ 当前
@Controller('skills')

// ✅ 修改为
@Controller('api/skills')
```

#### 1d. SkillCategoriesController

**文件：** `backend/src/skills/skill-categories.controller.ts`

```typescript
// ❌ 当前
@Controller('skill-categories')

// ✅ 修改为
@Controller('api/skill-categories')
```

---

### Step 2: 前端路径 Bug 修复 (10min)

> 这两个属于前端路径拼装 Bug，**无论 Phase 0 结果如何都需要修复**。

#### 2a. Evidence Download/Preview 路径（缺少 /badges 段）

**文件：** `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx`

```typescript
// ❌ 当前 (line ~65) — evidence download
`${API_BASE_URL}/evidence/${badgeId}/${fileId}/download`
// ✅ 修改为
`${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/download`

// ❌ 当前 (line ~98) — evidence preview
`${API_BASE_URL}/evidence/${badgeId}/${fileId}/preview`
// ✅ 修改为
`${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/preview`
```

#### 2b. Teams Share 路径（段顺序颠倒）

**文件：** `frontend/src/lib/badgeShareApi.ts`

```typescript
// ❌ 当前 (line ~94)
`${API_BASE_URL}/badges/${badgeId}/teams/share`
// ✅ 修改为
`${API_BASE_URL}/badges/${badgeId}/share/teams`
```

---

### Step 3: 前端硬编码 URL 统一化 (15min)

> **无论 Phase 0 结果如何都需要修复** — 这是代码规范问题，确保所有 API 调用使用统一的 `API_BASE_URL`。

将所有硬编码 `/api/...` 替换为 `${API_BASE_URL}/...`。如果文件尚未导入 `API_BASE_URL`，需添加导入：

```typescript
import { API_BASE_URL } from '@/lib/apiConfig';
// 或（根据文件现有 import path 风格）
import { API_BASE_URL } from '../lib/apiConfig';
```

#### 修复清单

| # | 文件 | 行 | 当前硬编码 | 修改为 |
|---|------|----|-----------|--------|
| 1 | `stores/authStore.ts` | ~55 | `'/api/auth/login'` | `` `${API_BASE_URL}/auth/login` `` |
| 2 | `hooks/useSkills.ts` | ~42 | `'/api/skills'` | `` `${API_BASE_URL}/skills` `` |
| 3 | `hooks/useSkills.ts` | ~44 | `'/api/skills/search'` | `` `${API_BASE_URL}/skills/search` `` |
| 4 | `lib/adminUsersApi.ts` | ~75 | `'/api/admin/users'` | `` `${API_BASE_URL}/admin/users` `` |
| 5 | `BulkIssuance/BulkPreviewPage.tsx` | ~93 | `/api/bulk-issuance/preview/...` | `` `${API_BASE_URL}/bulk-issuance/preview/...` `` |
| 6 | `BulkIssuance/BulkPreviewPage.tsx` | ~132 | `/api/bulk-issuance/error-report/...` | `` `${API_BASE_URL}/bulk-issuance/error-report/...` `` |
| 7 | `BulkIssuance/BulkPreviewPage.tsx` | ~169 | `/api/bulk-issuance/confirm/...` | `` `${API_BASE_URL}/bulk-issuance/confirm/...` `` |
| 8 | `BulkIssuance/ProcessingComplete.tsx` | ~39 | `/api/bulk-issuance/error-report/...` | `` `${API_BASE_URL}/bulk-issuance/error-report/...` `` |

> **注意：** 替换后这些 URL 会变成 `${API_BASE_URL}/auth/login` 即 `/api/auth/login`（默认值），效果不变——但确保了生产环境 `VITE_API_URL` 能生效。

---

### Step 4: E2E 测试路径更新 (20min)

> ⚠️ **仅在 Phase 0 确认控制器前缀需要修改时才需要此步骤**

后端 E2E 测试直接调用 `app.getHttpServer()`，不经过 Vite proxy。控制器前缀改为 `api/xxx` 后，E2E 中的路径也需要同步。

#### 4a. 搜索需要更新的文件

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
# 搜索 E2E 测试中使用旧路径的地方
Get-ChildItem -Recurse -Include "*.e2e*","*.spec*" test | ForEach-Object {
  $matches = Select-String -Path $_.FullName -Pattern "'/auth/|'/badge-templates|'/skills|'/skill-categories" -AllMatches
  if ($matches) { $matches }
}
```

#### 4b. 替换规则

| 旧路径 | 新路径 | 注意 |
|--------|--------|------|
| `'/auth/login'` | `'/api/auth/login'` | |
| `'/auth/register'` | `'/api/auth/register'` | |
| `'/auth/profile'` | `'/api/auth/profile'` | |
| `'/badge-templates'` | `'/api/badge-templates'` | GET / POST |
| `'/badge-templates/:id'` | `'/api/badge-templates/:id'` | GET / PATCH / DELETE |
| `'/skills'` | `'/api/skills'` | ⚠️ 不要误匹配 `/api/analytics/skills-distribution` |
| `'/skills/search'` | `'/api/skills/search'` | |
| `'/skill-categories'` | `'/api/skill-categories'` | |

> **⚠️ 重要：** 搜索 `/skills` 时要精确匹配，避免把 `/api/analytics/skills-distribution` 改成 `/api/analytics/api/skills-distribution`。建议使用完整路径匹配，不要全局 find-replace。

#### 4c. 验证 E2E 路径更新

```powershell
# 确认没有遗漏
Get-ChildItem -Recurse -Include "*.e2e*","*.spec*" test | ForEach-Object {
  $matches = Select-String -Path $_.FullName -Pattern "\.(?:get|post|patch|delete|put)\([`'\"]/(?:auth|badge-templates|skills|skill-categories)" -AllMatches
  if ($matches) { $matches }
}
# 预期: 0 matches（所有旧路径已更新）
```

---

### Step 5: 前端单元测试路径同步 (10min)

> 前端 Vitest 测试中可能 mock 了旧路径，改完源码后 mock 也需要同步。

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend
# 搜索前端测试中的旧硬编码路径
Get-ChildItem -Recurse -Include "*.test.*","*.spec.*" src | ForEach-Object {
  $matches = Select-String -Path $_.FullName -Pattern "'/api/auth|'/api/skills|'/api/bulk-issuance|'/api/admin/users|/evidence/|/teams/share" -AllMatches
  if ($matches) { $matches }
}
```

将找到的 mock 路径同步更新。注意：
- 如果 mock 使用相对路径如 `'/api/auth/login'`，改为 mock `API_BASE_URL` + `/auth/login`
- 如果 mock 匹配 `evidence` 或 `teams/share` 的旧错误路径，同步修正

---

### Step 6: 全面验证 (20min)

```powershell
# ===== 1. Backend Unit Tests =====
cd c:\G_Credit\CODE\gcredit-project\backend
npm test
# 预期: 534+ pass, skip ≤ 28

# ===== 2. Backend ESLint =====
npm run lint
# 预期: 0 errors + 0 warnings

# ===== 3. Backend tsc =====
npx tsc --noEmit
# 预期: 0 errors

# ===== 4. Frontend Tests =====
cd ../frontend
npx vitest run
# 预期: 397+ pass

# ===== 5. Frontend ESLint =====
npx eslint . --max-warnings=0
# 预期: 0 errors + 0 warnings

# ===== 6. Frontend tsc =====
npx tsc --noEmit
# 预期: 0 errors

# ===== 7. E2E Tests (如 DB 可用) =====
cd ../backend
# npm run test:e2e
# 预期: all pass
```

---

### Step 7: 实际功能验证（推荐）

如果条件允许，启动前后端做一次端到端手动验证：

```powershell
# 终端 1: 启动后端
cd c:\G_Credit\CODE\gcredit-project\backend
npm run start:dev

# 终端 2: 启动前端
cd c:\G_Credit\CODE\gcredit-project\frontend
npm run dev
```

在浏览器中访问 `http://localhost:5173`，验证：
- [ ] 登录功能正常
- [ ] Badge 模板加载正常
- [ ] Skills 筛选正常
- [ ] Evidence 下载/预览正常（需要已发行的 badge）
- [ ] Teams 分享正常（需要 Teams 配置）

---

### Step 8: Commit

```powershell
cd c:\G_Credit\CODE
git add -A
git commit -m "fix: API path audit fixes — 4 controller prefixes + 3 frontend path bugs

- Auth/BadgeTemplates/Skills/SkillCategories controllers: add api/ prefix
- EvidenceSection: fix download/preview path (add /badges segment)
- badgeShareApi: fix Teams share path order (/share/teams)
- 8 hardcoded /api/... URLs unified to API_BASE_URL
- E2E test paths synced
- All tests pass (534 backend + 397 frontend)
- Closes TD-022"
```

> ⚠️ **如果 Phase 0 发现部分路径不需要修复，commit message 应反映实际修复内容。**

---

## 📊 当前状态

```
后端控制器前缀:
  ✅ 有 api/ 前缀: 15 个 (badges, dashboard, analytics, verify, admin, etc.)
  ❌ 缺 api/ 前缀: 4 个 (auth, badge-templates, skills, skill-categories)
  
前端路径 Bug:
  ❌ EvidenceSection: /evidence/:id/:fid/download → 缺 /badges 段
  ❌ badgeShareApi: /teams/share → 应为 /share/teams
  
硬编码 URL: 8 处绕过 API_BASE_URL
E2E 测试: 使用旧路径（无 api/ 前缀）
```

---

## Reference Files

### 后端（需修改）
- `backend/src/auth/auth.controller.ts` — `@Controller('auth')` (~line 22)
- `backend/src/badge-templates/badge-templates.controller.ts` — `@Controller('badge-templates')` (~line 47)
- `backend/src/skills/skills.controller.ts` — `@Controller('skills')` (~line 33)
- `backend/src/skills/skill-categories.controller.ts` — `@Controller('skill-categories')` (~line 33)
- `backend/src/main.ts` — 确认无 `setGlobalPrefix`
- `backend/test/` — E2E 测试文件（路径同步）

### 前端（需修改）
- `frontend/src/components/BadgeDetailModal/EvidenceSection.tsx` — lines 65, 98
- `frontend/src/lib/badgeShareApi.ts` — line 94
- `frontend/src/stores/authStore.ts` — line 55
- `frontend/src/hooks/useSkills.ts` — lines 42, 44
- `frontend/src/lib/adminUsersApi.ts` — line 75
- `frontend/src/components/BulkIssuance/BulkPreviewPage.tsx` — lines 93, 132, 169
- `frontend/src/components/BulkIssuance/ProcessingComplete.tsx` — line 39

### 参考（只读）
- `frontend/src/lib/apiConfig.ts` — `API_BASE_URL` 定义
- `frontend/vite.config.ts` — Vite proxy 配置
- [api-path-audit-report.md](api-path-audit-report.md) — 完整审计报告

---

## Definition of Done
- [ ] Phase 0 验证结果已记录
- [ ] 所有确认的 CRITICAL 路径已修复
- [ ] 8 处硬编码 URL 统一为 `API_BASE_URL`
- [ ] E2E 测试路径已同步
- [ ] 前端单元测试 mock 路径已同步
- [ ] 全部测试通过 (backend 534+ / frontend 397+ / ESLint 0)
- [ ] commit message 反映实际修复范围
