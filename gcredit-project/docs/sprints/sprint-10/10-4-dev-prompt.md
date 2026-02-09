# Story 10.4 Dev Prompt: i18n Scan + UX/Code Quality Quick Wins

**Story Doc:** [10-4-i18n-chinese-string-scan.md](10-4-i18n-chinese-string-scan.md)  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 4h (实际预计 ~2.5h，部分 AC 已被前序 Story 修复)  
**Goal:** i18n 扫描 + UX 审计 Quick Wins + TD-020/TD-021 + 后端 console.log 清理

---

## ⚠️ SM 验证结果：部分 AC 已完成

SM 在准备本 Dev Prompt 时做了预扫描，发现以下 AC 相关问题**已在前序 Story 中修复**：

| AC | Story Doc 描述 | 当前实际状态 | 需要做？ |
|----|---------------|-------------|---------|
| AC5: 0 `window.alert()` | BulkPreviewPage + ProcessingComplete | ✅ **已经是 `toast.error()`**，无 `alert()` 残留 | ❌ 不需要 |
| AC1-2: 中文字符 (frontend) | 前端 src 扫描 | ✅ 前端无中文字符（仅测试文件有检测断言，正常） | ❌ 不需要 |
| AC1-2: 中文字符 (backend) | 后端 src 扫描 | 🔴 **`skill.dto.ts` 有 7 处中文 `@ApiProperty` 描述** | ✅ 需要 |

**实际需要完成的工作：**

| # | Task | AC | 预计时间 |
|---|------|----|---------|
| 1 | 后端 `skill.dto.ts` 中文翻译 | AC1-2 | 10min |
| 2 | 前端 `console.log` 清理（4 处） | AC6 | 15min |
| 3 | 后端 `console.log/error/warn` → NestJS Logger（~29 处） | AC6 | 45min |
| 4 | Navbar ARIA `role="menubar"` 修复 | AC7 | 30min |
| 5 | TD-020: CI E2E job 添加 frontend-tests 依赖 | AC9 | 5min |
| 6 | TD-021: eslint rule override + 移除 9 个 inline suppressions | AC10 | 15min |
| 7 | 验证 | AC4 | 15min |
| | **Total** | | **~2h 15min** |

---

## Step 1: 后端中文字符翻译 (10min)

**文件:** `backend/src/skills/dto/skill.dto.ts`

7 处 `@ApiProperty` 的 `description` 使用中文：

```typescript
// ❌ 当前
@ApiProperty({ description: '技能名称' })     // L18
@ApiProperty({ description: '技能描述' })     // L25
@ApiProperty({ description: '所属分类ID' })   // L33
@ApiProperty({ description: '技能等级' })     // L41
// UpdateSkillDto 中重复:
@ApiProperty({ description: '技能名称' })     // L49
@ApiProperty({ description: '技能描述' })     // L57
@ApiProperty({ description: '技能等级' })     // L65

// ✅ 替换为
@ApiProperty({ description: 'Skill name' })
@ApiProperty({ description: 'Skill description' })
@ApiProperty({ description: 'Category ID' })
@ApiProperty({ description: 'Skill level' })
// UpdateSkillDto:
@ApiProperty({ description: 'Skill name' })
@ApiProperty({ description: 'Skill description' })
@ApiProperty({ description: 'Skill level' })
```

**验证：** 替换后全局扫描确认无残留：

```powershell
cd c:\G_Credit\CODE
Get-ChildItem -Recurse -Include "*.ts","*.tsx" gcredit-project/backend/src, gcredit-project/frontend/src | Select-String -Pattern "[\u4E00-\u9FFF]"
# 预期: 0 matches
```

---

## Step 2: 前端 `console.log` 清理 (15min)

**4 处需要处理：**

### 2a. BadgeDetailModal.tsx (line ~307) — 删除

```typescript
// ❌ 当前
onSuccess={() => {
    console.log('Report submitted successfully');
}}

// ✅ 改为 toast 或直接删除 console.log
import { toast } from 'sonner';
// ...
onSuccess={() => {
    toast.success('Report submitted successfully');
}}
```

### 2b. EmptyState.tsx (lines 35, 41) — 保留为 default props

```typescript
// 当前 — 作为 default prop 值
onViewPending = () => console.log('Switch to Pending tab'),
onClearFilters = () => console.log('Clear filters'),
```

**这是 default prop 值（fallback stubs），不是 debug 代码。** 两种处理方式：

- **Option A（推荐）：** 替换为空函数 `() => {}` — 更干净
- **Option B：** 保留不动 — 本身不会出现在生产环境中（调用者总是传入实际函数）

> 推荐 Option A。

### 2c. axe-setup.ts (line 51) — 条件保留

```typescript
console.log('🔍 Axe accessibility testing enabled...');
```

这是 `axe-core` 开发工具的初始化日志。检查是否只在 dev 模式下加载：
- 如果已有 `import.meta.env.DEV` 条件 → 保留不动
- 如果没有条件保护 → 添加条件或删除

**验证：** 清理后全局确认

```powershell
Get-ChildItem -Recurse -Include "*.ts","*.tsx" gcredit-project/frontend/src -Exclude "*.test.*","*.spec.*" | Select-String "console\.(log|error|warn)" | Where-Object { $_.Path -notmatch "test" }
# 预期: 0 matches（或仅剩 axe-setup.ts 在 DEV 条件下）
```

---

## Step 3: 后端 `console.log/error/warn` → NestJS Logger (45min)

**~29 处散布在多个文件中。** 使用 NestJS 的 `Logger` 替换：

```typescript
import { Logger } from '@nestjs/common';

// 在 class 内部
private readonly logger = new Logger(XxxService.name);

// 替换
console.log('message')   → this.logger.log('message')
console.error('message') → this.logger.error('message')
console.warn('message')  → this.logger.warn('message')
```

### 按文件处理清单

| # | 文件 | 数量 | 备注 |
|---|------|------|------|
| 1 | `modules/auth/auth.service.ts` | 6 | `[AUDIT]` 日志 — 改为 `this.logger.log('[AUDIT] ...')` |
| 2 | `config/azure-blob.config.ts` | 2 | `console.warn` — 改为 `Logger.warn(...)` (静态方法，非 class) |
| 3 | `main.ts` | 2-3 | 启动日志 — 改为 `Logger` (NestJS 启动通常用 `app.get(Logger)` 或直接 `new Logger('Bootstrap')`) |
| 4 | `common/prisma.service.ts` | 1 | DB 连接日志 |
| 5 | `common/storage.service.ts` | 3 | Storage 连接/警告 |
| 6 | `common/email.service.ts` | ~3 | DEV MODE fallback 日志 |
| 7 | `badge-templates/badge-templates.service.ts` | 4 | 图片管理日志 |
| 8 | `badge-sharing/controllers/widget-embed.controller.ts` | 1 | 嵌入脚本输出 — ⚠️ 这个 `console.log` 是**故意输出到浏览器端的 JS 代码**，可能需要保留 |

> ⚠️ **注意 `widget-embed.controller.ts`：** 如果 `console.log` 是生成给浏览器端执行的 JS snippet（如 embed widget 的 `<script>`），则**不应替换**为 NestJS Logger。请检查上下文。

### 搜索命令

```powershell
cd c:\G_Credit\CODE
Get-ChildItem -Recurse -Include "*.ts" gcredit-project/backend/src -Exclude "*.spec.*","*.test.*" | Select-String "console\.(log|error|warn)"
```

### 验证

```powershell
# 替换后确认
Get-ChildItem -Recurse -Include "*.ts" gcredit-project/backend/src -Exclude "*.spec.*","*.test.*" | Select-String "console\.(log|error|warn)"
# 预期: 0 matches (或仅 widget-embed.controller.ts 的浏览器端 JS 保留)
```

---

## Step 4: Navbar ARIA `role="menubar"` 修复 (30min)

**文件:** `frontend/src/components/Navbar.tsx`

### 当前问题
- Line 39: `<div ... role="menubar">` 包裹导航链接
- Lines 44, 54, 64, 74: `<Link ... role="menuitem">` 在每个链接上

`role="menubar"` / `role="menuitem"` 要求实现箭头键导航和焦点管理，当前没有实现 → ARIA 违规。

### 修复方案

```tsx
// ❌ 当前
<div role="menubar" className="...">
  <Link to="/dashboard" role="menuitem">Dashboard</Link>
  <Link to="/badges" role="menuitem">Badges</Link>
  ...
</div>

// ✅ 修复：使用语义化 HTML，移除 ARIA role
<ul className="flex space-x-1">
  <li>
    <Link to="/dashboard" className={...}>Dashboard</Link>
  </li>
  <li>
    <Link to="/badges" className={...}>Badges</Link>
  </li>
  ...
</ul>
```

### 同时添加 active link styling

参考 MobileNav 的 `isActive` 模式，给当前页面的链接添加高亮样式：

```tsx
import { useLocation } from 'react-router-dom';

const { pathname } = useLocation();
const isActive = (path: string) => pathname.startsWith(path);

// 在 Link 上应用条件样式
<Link
  to="/dashboard"
  className={cn(
    'px-3 py-2 rounded-md text-sm font-medium',
    isActive('/dashboard')
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-foreground'
  )}
>
```

> 确保 `<nav>` 元素保留 `role="navigation"` 和 `aria-label`。

---

## Step 5: TD-020 — CI E2E Job 添加 frontend-tests 依赖 (5min)

**文件:** `.github/workflows/test.yml`

```yaml
# ❌ 当前 (line ~102-105)
e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint-and-unit

# ✅ 修改为
e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [lint-and-unit, frontend-tests]
```

这确保 E2E 测试只在前端 lint + vitest 也通过后才运行。

---

## Step 6: TD-021 — ESLint Rule Override + 移除 Inline Suppressions (15min)

### 6a. 添加规则 override

**文件:** `frontend/eslint.config.js`

在 `rules` 对象中添加：

```javascript
rules: {
  'prettier/prettier': 'warn',
  'react-hooks/set-state-in-effect': 'off',  // ← 添加这行
  // ... 其他规则
}
```

> **为什么用 `'off'` 而不是 `'warn'`？** 因为 CI 有 `--max-warnings=0` 零容忍。如果设 `'warn'`，9 个 warning 会导致 CI 失败。所有 9 个模式都是合法的 React 19 idiom（有内联注释说明理由），所以直接关闭。

### 6b. 移除 9 个 inline suppressions

从以下 9 个文件中删除 `// eslint-disable-next-line react-hooks/set-state-in-effect` 行（及其尾部的理由注释行）：

| # | 文件 | 行 |
|---|------|----|
| 1 | `hooks/useBadgeSearch.ts` | ~139 |
| 2 | `hooks/useMediaQuery.ts` | ~39 |
| 3 | `pages/dashboard/EmployeeDashboard.tsx` | ~106 |
| 4 | `components/BulkIssuance/ProcessingModal.tsx` | ~38 |
| 5 | `components/search/SearchInput.tsx` | ~90 |
| 6 | `components/admin/EditRoleDialog.tsx` | ~72 |
| 7 | `components/common/CelebrationModal.tsx` | ~69 |
| 8 | `components/layout/MobileNav.tsx` | ~28 |
| 9 | `components/admin/DeactivateUserDialog.tsx` | ~55 |

每个文件找到类似这样的行并**删除整行**：

```typescript
// eslint-disable-next-line react-hooks/set-state-in-effect -- Track async search operation loading state
```

> 只删 suppress 注释行，不要改动下面的实际代码。

### 验证

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend

# 确认无残留 inline suppressions
Get-ChildItem -Recurse -Include "*.ts","*.tsx" src | Select-String "react-hooks/set-state-in-effect"
# 预期: 0 matches

# 确认 ESLint 仍然通过
npx eslint . --max-warnings=0
# 预期: 0 errors, 0 warnings
```

---

## Step 7: 全面验证 (15min)

```powershell
# ===== 1. 中文字符全局扫描 =====
cd c:\G_Credit\CODE
Get-ChildItem -Recurse -Include "*.ts","*.tsx" gcredit-project/backend/src, gcredit-project/frontend/src -Exclude "*.test.*","*.spec.*" | Select-String -Pattern "[\u4E00-\u9FFF]"
# 预期: 0 matches

# ===== 2. console.log 扫描 (前端) =====
Get-ChildItem -Recurse -Include "*.ts","*.tsx" gcredit-project/frontend/src -Exclude "*.test.*","*.spec.*" | Select-String "console\.(log|error|warn)"
# 预期: 0 matches (或仅 axe-setup.ts DEV 条件下)

# ===== 3. console.log 扫描 (后端) =====
Get-ChildItem -Recurse -Include "*.ts" gcredit-project/backend/src -Exclude "*.spec.*" | Select-String "console\.(log|error|warn)"
# 预期: 0 matches (或仅 widget-embed 浏览器端 JS)

# ===== 4. window.alert 扫描 =====
Get-ChildItem -Recurse -Include "*.ts","*.tsx" gcredit-project/frontend/src | Select-String "window\.alert\(|[^a-zA-Z]alert\("
# 预期: 0 matches

# ===== 5. Backend Tests =====
cd gcredit-project/backend
npm test
# 预期: 534+ pass, 28 skip

# ===== 6. Backend ESLint =====
npm run lint
# 预期: 0 errors, 0 warnings

# ===== 7. Frontend Tests =====
cd ../frontend
npx vitest run
# 预期: 397+ pass

# ===== 8. Frontend ESLint =====
npx eslint . --max-warnings=0
# 预期: 0 errors, 0 warnings

# ===== 9. tsc =====
npx tsc --noEmit
cd ../backend
npx tsc --noEmit
# 预期: 0 errors
```

---

## Step 8: Commit

```powershell
cd c:\G_Credit\CODE
git add -A
git commit -m "fix: i18n scan + UX polish (audit quick wins)

- Translate 7 Chinese @ApiProperty descriptions in skill.dto.ts
- Remove console.log from BadgeDetailModal + EmptyState defaults
- Migrate ~29 backend console.* to NestJS Logger
- Fix Navbar ARIA: remove menubar/menuitem, use semantic nav+ul+li
- Add active link styling to desktop Navbar
- TD-020: CI e2e-tests job now depends on frontend-tests
- TD-021: Disable react-hooks/set-state-in-effect, remove 9 inline suppressions
- All tests pass (534 backend + 397 frontend + ESLint 0)"
```

---

## Reference Files

### 需修改
| 文件 | 改动 |
|------|------|
| `backend/src/skills/dto/skill.dto.ts` | 7 处中文 → 英文 |
| `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx` | 删除 console.log (L307) |
| `frontend/src/components/BadgeWallet/EmptyState.tsx` | default prop `console.log` → `() => {}` |
| `frontend/src/components/Navbar.tsx` | ARIA 修复 + active link styling |
| `backend/src/modules/auth/auth.service.ts` | ~6 处 console → Logger |
| `backend/src/config/azure-blob.config.ts` | 2 处 console.warn → Logger |
| `backend/src/main.ts` | 2-3 处 console → Logger |
| `backend/src/common/prisma.service.ts` | 1 处 console → Logger |
| `backend/src/common/storage.service.ts` | 3 处 console → Logger |
| `backend/src/common/email.service.ts` | ~3 处 console → Logger |
| `backend/src/badge-templates/badge-templates.service.ts` | 4 处 console → Logger |
| `.github/workflows/test.yml` | TD-020: e2e-tests needs 添加 frontend-tests |
| `frontend/eslint.config.js` | TD-021: 添加 rule override |
| 9 个前端组件/hooks 文件 | TD-021: 删除 inline eslint-disable 注释 |

### 只读参考
| 文件 | 用途 |
|------|------|
| `frontend/src/lib/axe-setup.ts` | 检查 console.log 是否有 DEV 条件 |
| `backend/src/badge-sharing/controllers/widget-embed.controller.ts` | 检查 console.log 是否为浏览器端 JS |
| `frontend/src/components/layout/MobileNav.tsx` | active link styling 参考 |

---

## Definition of Done
- [ ] 0 Chinese characters in src (excluding tests)
- [ ] 0 `console.log` in frontend src (excluding DEV-only tooling)
- [ ] 0 `console.log/error/warn` in backend src (excluding browser-side JS)
- [ ] Navbar uses semantic `<ul>/<li>` instead of `menubar/menuitem`
- [ ] CI `e2e-tests` depends on `[lint-and-unit, frontend-tests]`
- [ ] `react-hooks/set-state-in-effect` rule set to `off`, 0 inline suppressions
- [ ] All tests pass, ESLint 0 errors + 0 warnings
