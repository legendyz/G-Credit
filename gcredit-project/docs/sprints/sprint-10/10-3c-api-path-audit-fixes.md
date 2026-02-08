# Story 10.3c: API Path Audit Fixes — Route Mismatch + Hardcoded URL Cleanup

**Sprint:** 10  
**Priority:** 🔴 CRITICAL  
**Estimate:** 2h  
**Type:** Bug Fix (Pre-UAT Audit)  
**Dependencies:** None  
**Discovered:** SM API Path Audit (2026-02-09)  
**Audit Report:** [api-path-audit-report.md](api-path-audit-report.md)
**Dev Prompt:** [10-3c-dev-prompt.md](10-3c-dev-prompt.md)

---

## User Story

As a user, I want all frontend API calls to reach the correct backend endpoints, so that features like login, badge templates, skills filtering, evidence download, and Teams sharing actually work without 404 errors.

---

## Background & Problem

SM API 调用路径审计发现 **5 个 CRITICAL 路径不匹配**，会导致对应功能返回 404。根本原因：

1. **4 个后端控制器缺少 `api/` 前缀** — `auth`、`badge-templates`、`skills`、`skill-categories` 的 `@Controller` 没有 `api/` 前缀，但前端统一通过 `/api/...` 调用
2. **2 个前端路径拼装错误** — Evidence 路径缺少 `/badges` 段，Teams share 路径段顺序颠倒
3. **8 处前端硬编码 `/api/...`** — 绕过 `API_BASE_URL` 统一配置

### 关键约束
- NestJS `main.ts` 没有 `setGlobalPrefix('api')` — 各控制器自行声明前缀
- 15 个控制器已有 `api/` 前缀，4 个没有 — 不一致
- Vite proxy `/api` → `localhost:3000` 不做 path rewrite

---

## Acceptance Criteria

### AC1: 后端控制器前缀统一
- [x] `auth.controller.ts`: `@Controller('auth')` → `@Controller('api/auth')`
- [x] `badge-templates.controller.ts`: `@Controller('badge-templates')` → `@Controller('api/badge-templates')`
- [x] `skills.controller.ts`: `@Controller('skills')` → `@Controller('api/skills')`
- [x] `skill-categories.controller.ts`: `@Controller('skill-categories')` → `@Controller('api/skill-categories')`

### AC2: 前端路径 Bug 修复
- [x] `EvidenceSection.tsx:65`: `/evidence/${badgeId}/${fileId}/download` → `/badges/${badgeId}/evidence/${fileId}/download`
- [x] `EvidenceSection.tsx:98`: `/evidence/${badgeId}/${fileId}/preview` → `/badges/${badgeId}/evidence/${fileId}/preview`
- [x] `badgeShareApi.ts:94`: `/badges/${badgeId}/teams/share` → `/badges/${badgeId}/share/teams`

### AC3: 前端硬编码 URL 统一化
- [x] 8 处硬编码 `/api/...` 全部替换为 `${API_BASE_URL}/...`
- [x] 涉及文件: `authStore.ts`, `useSkills.ts`, `adminUsersApi.ts`, `BulkPreviewPage.tsx`, `ProcessingComplete.tsx`

### AC4: E2E 测试路径同步
- [x] 所有 E2E 测试中 `/auth/...` → `/api/auth/...`
- [x] 所有 E2E 测试中 `/badge-templates/...` → `/api/badge-templates/...`
- [x] 所有 E2E 测试中 `/skills/...` → `/api/skills/...`
- [x] 所有 E2E 测试中 `/skill-categories/...` → `/api/skill-categories/...`

### AC5: 零回归
- [x] 所有前端测试通过 (397+)
- [x] 所有后端测试通过 (534+)
- [x] 所有 E2E 测试通过
- [x] ESLint 零容忍通过 (前端 + 后端)

### AC6: Commit 标准
- [x] Commit message: `fix: API path audit fixes — 4 controller prefixes + 3 frontend path bugs`
- [x] Commit: `69aa5b3`

---

## Implementation Steps

### Step 1: 后端控制器前缀修复 (15min)

**4 个文件，每个只改一行：**

```typescript
// backend/src/auth/auth.controller.ts (原 line ~22)
@Controller('api/auth')        // was: @Controller('auth')

// backend/src/badge-templates/badge-templates.controller.ts (原 line ~47)
@Controller('api/badge-templates')  // was: @Controller('badge-templates')

// backend/src/skills/skills.controller.ts (原 line ~33)
@Controller('api/skills')       // was: @Controller('skills')

// backend/src/skills/skill-categories.controller.ts (原 line ~33)
@Controller('api/skill-categories') // was: @Controller('skill-categories')
```

### Step 2: 前端路径 Bug 修复 (10min)

```typescript
// frontend/src/components/BadgeDetailModal/EvidenceSection.tsx:65
// ❌ `${API_BASE_URL}/evidence/${badgeId}/${fileId}/download`
// ✅ `${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/download`

// frontend/src/components/BadgeDetailModal/EvidenceSection.tsx:98
// ❌ `${API_BASE_URL}/evidence/${badgeId}/${fileId}/preview`
// ✅ `${API_BASE_URL}/badges/${badgeId}/evidence/${fileId}/preview`

// frontend/src/lib/badgeShareApi.ts:94
// ❌ `${API_BASE_URL}/badges/${badgeId}/teams/share`
// ✅ `${API_BASE_URL}/badges/${badgeId}/share/teams`
```

### Step 3: 前端硬编码 URL 统一化 (15min)

将以下文件中的硬编码 `/api/...` 替换为 `${API_BASE_URL}/...`：

| 文件 | 行 | 当前 | 修改为 |
|------|----|------|--------|
| `stores/authStore.ts` | 55 | `/api/auth/login` | `${API_BASE_URL}/auth/login` |
| `hooks/useSkills.ts` | 42 | `/api/skills` | `${API_BASE_URL}/skills` |
| `hooks/useSkills.ts` | 44 | `/api/skills/search` | `${API_BASE_URL}/skills/search` |
| `lib/adminUsersApi.ts` | 75 | `/api/admin/users` | `${API_BASE_URL}/admin/users` |
| `BulkPreviewPage.tsx` | 93 | `/api/bulk-issuance/preview/...` | `${API_BASE_URL}/bulk-issuance/preview/...` |
| `BulkPreviewPage.tsx` | 132 | `/api/bulk-issuance/error-report/...` | `${API_BASE_URL}/bulk-issuance/error-report/...` |
| `BulkPreviewPage.tsx` | 169 | `/api/bulk-issuance/confirm/...` | `${API_BASE_URL}/bulk-issuance/confirm/...` |
| `ProcessingComplete.tsx` | 39 | `/api/bulk-issuance/error-report/...` | `${API_BASE_URL}/bulk-issuance/error-report/...` |

> 需要在对应文件中添加 `import { API_BASE_URL } from '...'` 如果还未导入。

### Step 4: E2E 测试路径更新 (20min)

搜索并替换所有 E2E 测试文件中的旧路径：

```powershell
# 查找需要更新的文件
cd gcredit-project/backend
Get-ChildItem -Recurse -Filter "*.e2e*" test | ForEach-Object {
  Select-String -Path $_.FullName -Pattern "'/auth/|'/badge-templates/|'/skills/|'/skill-categories/"
}
```

替换规则：
- `/auth/` → `/api/auth/`
- `/badge-templates` → `/api/badge-templates`
- `/skills` → `/api/skills` (注意不要误匹配 `/api/analytics/skills-distribution`)
- `/skill-categories` → `/api/skill-categories`

### Step 5: 验证 (20min)

```powershell
# 1. Backend unit tests
cd gcredit-project/backend
npm test
# 预期: 534+ pass

# 2. Backend ESLint
npm run lint
# 预期: 0 errors + 0 warnings

# 3. Frontend tests
cd ../frontend
npx vitest run
# 预期: 397+ pass

# 4. Frontend ESLint
npx eslint . --max-warnings=0
# 预期: 0 errors + 0 warnings

# 5. tsc clean
npx tsc --noEmit
cd ../backend
npx tsc --noEmit
# 预期: 0 errors

# 6. E2E tests (if DB available)
# npm run test:e2e
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| E2E 测试路径更新遗漏 | Medium | grep 全面搜索 + 测试运行验证 |
| Swagger UI 路径变化 | Low | Swagger 使用 controller 装饰器路径，会自动更新 |
| 硬编码 URL mock 测试受影响 | Low | 前端单元测试可能 mock 了旧路径，需要更新 |

---

## Dev Notes

### ⚠️ 开放问题（Phase 0 验证）

本 Story 来源于 SM 静态代码审计。如果 CRITICAL-1~3 的功能在本地开发中**实际能正常工作**，说明可能存在未发现的路由转发机制（如 NestJS middleware、Helmet、或其他配置），审计结论可能不完全准确。

**必须执行两阶段方式：**
1. **Phase 0（验证）：** 启动前后端，用 curl 实际测试审计标记的路径，确认哪些真的 404
2. **Phase 1（修复）：** 仅修复 Phase 0 确认为 404 的路径

如果发现隐藏的路由机制，需在 commit message 和本 Story 的 Dev Notes 中记录发现。

详见 Dev Prompt 的 Phase 0 部分。

### 验证方法
```powershell
# 启动后端
cd gcredit-project/backend
npm run start:dev

# 在另一个终端测试
curl http://localhost:3000/auth/login        # 应该匹配
curl http://localhost:3000/api/auth/login     # 修复前应该 404
```

---

## Definition of Done
- [ ] All ACs met
- [ ] SM acceptance verified programmatically
- [ ] sprint-status.yaml updated
- [ ] backlog.md updated
