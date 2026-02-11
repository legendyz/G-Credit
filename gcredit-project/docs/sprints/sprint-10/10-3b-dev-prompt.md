# Story 10.3b Dev Prompt: TD-019 Frontend ESLint Cleanup + CI Gate

**Story Doc:** [10-3b-frontend-eslint-cleanup.md](10-3b-frontend-eslint-cleanup.md)  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 3.5h  
**Goal:** Frontend ESLint 0 errors + 0 warnings + CI zero-tolerance gate (match backend standard from Story 10.2)

---

## 📊 当前状态

```
Frontend ESLint: 49 errors + 21,363 warnings
Backend ESLint:  0 errors + 0 warnings ✅ (Story 10.2)
CI Pipeline:     Backend lint ✅ | Frontend lint ❌ (不存在)
```

### 问题根因
1. **无 `.gitattributes` 文件** — Windows 上 CRLF 导致 21,354 个 prettier warnings
2. **CI 不跑前端 lint** — `.github/workflows/test.yml` frontend-tests job 只跑 `npx vitest run`
3. **`package.json` lint 脚本无 `--max-warnings`** — 目前是 `"lint": "eslint ."`

### Error/Warning 分布

| Rule | Count | Severity | 修复策略 |
|------|-------|----------|----------|
| prettier/prettier (CRLF) | 21,354 | ⚠️ warn | `.gitattributes` + `eslint --fix` (自动) |
| react-hooks/exhaustive-deps | 9 | ⚠️ warn | 添加缺失依赖或 eslint-disable 带理由 |
| prettier/prettier (non-CRLF) | 13 | ❌ error | `eslint --fix` (自动) |
| react-hooks/set-state-in-effect | 8 | ❌ error | 重构 useEffect 中的 setState 链 |
| react-hooks/preserve-manual-memoization | 5 | ❌ error | 修复 useMemo/useCallback 签名 |
| react-hooks/refs | 4 | ❌ error | 不在 render 中访问 ref.current |
| react-hooks/purity | 5 | ❌ error | 不在 render 中调用 impure 函数/创建组件 |
| react-hooks/set-state-in-render | 2 | ❌ error | 移出 render 流 |
| @typescript-eslint/no-explicit-any | 9 | ❌ error | 替换为正确 TypeScript 类型 |
| @typescript-eslint/no-unused-vars | 9 | ❌ error | 删除或前缀 `_` |
| react-refresh/only-export-components | 3 | ❌ error | 分离非组件 export 到独立文件 |
| jsx-a11y/role-has-required-aria-props | 2 | ❌ error | 添加必需的 aria-controls/aria-expanded |
| jsx-a11y/label-has-associated-control | 2 | ❌ error | label 关联到 input (htmlFor/嵌套) |

---

## 执行顺序

1. **Step 1:** 创建 `.gitattributes` + 规范化行尾 (~30min)
2. **Step 2:** `eslint --fix` 自动修复 prettier 问题 (~15min)
3. **Step 3:** 修复 `@typescript-eslint` 错误 (no-unused-vars + no-explicit-any) (~30min)
4. **Step 4:** 修复 React Hooks/Compiler 错误 (~60min)
5. **Step 5:** 修复 react-refresh + jsx-a11y 错误 (~20min)
6. **Step 6:** 修复 react-hooks/exhaustive-deps warnings (~15min)
7. **Step 7:** 更新 CI Pipeline + package.json (~15min)
8. **Step 8:** 全面验证 (~15min)

---

## Step 1: 创建 `.gitattributes` + 规范化行尾

**在仓库根目录 (`c:\G_Credit\CODE\`) 创建 `.gitattributes`：**

```gitattributes
# Auto detect text files and normalize to LF
* text=auto eol=lf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.svg binary
*.woff binary
*.woff2 binary
*.ttf binary
*.eot binary
*.pdf binary
```

**然后规范化已有文件的行尾：**

```powershell
# 在项目根目录执行
cd c:\G_Credit\CODE

# 删除 git 索引并重新签出（强制应用新的行尾规则）
git rm --cached -r gcredit-project/frontend
git reset HEAD gcredit-project/frontend
git checkout -- gcredit-project/frontend

# 验证文件现在是 LF
# 随机检查一个文件
file gcredit-project/frontend/src/App.tsx
```

> ⚠️ **注意：** `.gitattributes` 放在仓库根目录 `c:\G_Credit\CODE\`，不是 frontend 子目录。

---

## Step 2: `eslint --fix` 自动修复

```powershell
cd c:\G_Credit\CODE\gcredit-project\frontend
npx eslint src --fix

# 验证 prettier 问题清零
npx eslint src 2>&1 | Select-String "prettier/prettier" | Measure-Object
# 期望: Count = 0
```

这应该自动清除所有 21,367 个 prettier 相关问题（CRLF + 格式化）。

---

## Step 3: 修复 `@typescript-eslint` 错误

### 3a: no-unused-vars (9 个)

逐文件修复，删除未使用的 import/变量或前缀 `_`：

```powershell
npx eslint src --format compact 2>&1 | Select-String "no-unused-vars"
```

**常见模式：**
- 测试文件中未使用的 `waitFor`、`beforeEach`、`container` → 删除 import
- 组件中未使用的变量 (`navigate`、`dropZone`、`_selectedTemplateId`) → 删除或前缀 `_`
- 未使用的 type import (`BadgeSearchFilters`) → 删除

### 3b: no-explicit-any (9 个)

```powershell
npx eslint src --format compact 2>&1 | Select-String "no-explicit-any"
```

**替换策略：**
- API response → `unknown` + type guard 或 具体 DTO type
- Event handlers → `React.MouseEvent<HTMLElement>` 或类似具体类型
- Generic catch → `unknown` (然后 `instanceof Error` 检查)
- 回调参数 → 推断具体类型

---

## Step 4: 修复 React Hooks/Compiler 错误 (24 个)

这些来自 React 19 的 `react-hooks` 推荐配置（包含 React Compiler 规则）。

### 4a: set-state-in-effect (8 个)

**问题：** useEffect 内同步调用 setState 触发级联渲染

**涉及文件（根据 eslint 输出）：**
- `components/BulkIssuance/ProcessingModal.tsx:38`
- `components/common/CelebrationModal.tsx:65`
- `components/search/DateRangePicker.tsx:90`
- `components/search/SearchInput.tsx:87`
- `hooks/useBadgeSearch.ts:139`
- `hooks/useMediaQuery.ts:39`（可能是 `MobileNav.tsx:28`）
- `pages/dashboard/EmployeeDashboard.tsx:106`

**修复模式：**

```typescript
// ❌ BAD: setState in effect causes cascading render
useEffect(() => {
  setDerivedState(computeFromProps(props));
}, [props]);

// ✅ GOOD Option 1: Compute during render (preferred)
const derivedState = useMemo(() => computeFromProps(props), [props]);

// ✅ GOOD Option 2: Use useRef for timer/interval IDs  
const timerRef = useRef<NodeJS.Timeout | null>(null);
useEffect(() => {
  timerRef.current = setTimeout(() => { /* ... */ }, delay);
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, [delay]);

// ✅ GOOD Option 3: Batch state updates with startTransition
useEffect(() => {
  startTransition(() => {
    setStateA(newA);
    setStateB(newB);
  });
}, [dep]);
```

### 4b: preserve-manual-memoization (5 个)

**涉及文件：**
- `components/TimelineView/TimelineView.tsx:29, :99`
- `components/search/SearchInput.tsx:124`
- `pages/admin/BadgeManagementPage.tsx:148, :202, :217`

**修复：** useMemo/useCallback 的依赖与 React Compiler 推断不一致。通常需要：
- 确认 deps 数组包含所有引用的变量
- 或简化 memoization，让 Compiler 接管

```typescript
// ❌ Compiler says memoization can't be preserved
const filtered = useMemo(() => {
  return items.filter(x => x.active && someOuterVar);
}, [items]); // missing someOuterVar

// ✅ Add missing dep
const filtered = useMemo(() => {
  return items.filter(x => x.active && someOuterVar);
}, [items, someOuterVar]);
```

### 4c: refs — Cannot access refs during render (4 个)

**涉及文件：**
- `components/admin/DeactivateUserDialog.tsx:41` (x2)
- `components/admin/EditRoleDialog.tsx:57` (x2)

**修复：** 不在组件 render 阶段读取 `ref.current`，移到 useEffect 或 event handler 中。

```typescript
// ❌ Accessing ref during render
const value = inputRef.current?.value;

// ✅ Access ref in effect or event handler
useEffect(() => {
  const value = inputRef.current?.value;
  // use value
}, []);
```

### 4d: purity (5 个)

**涉及文件：**
- `components/BadgeDetailModal/TimelineSection.tsx:26` — impure function call during render
- `components/admin/UserListTable.tsx:271, :272, :275, :278` — creating components during render
- `components/common/CelebrationModal.tsx:41` — impure function during render

**修复 UserListTable — creating components during render：**
```typescript
// ❌ Creating components inside render
{condition && <SomeComponent />}
// 如果 SomeComponent 是动态确定的，需要提前定义

// ✅ 使用条件渲染或提取子组件
const ActionCell = ({ row }) => { /* ... */ };
// 引用 ActionCell 而不是内联创建
```

**修复 impure function during render：**
```typescript
// ❌ Calling Date.now() or Math.random() during render
const timestamp = Date.now();

// ✅ Move to useMemo
const timestamp = useMemo(() => Date.now(), []);
// 或者 useRef
const timestampRef = useRef(Date.now());
```

---

## Step 5: 修复 react-refresh + jsx-a11y 错误

### 5a: react-refresh/only-export-components (3 个)

**涉及文件：**
- `components/BadgeShareModal/index.ts`
- `components/search/index.ts`
- `pages/dashboard/index.ts`

**修复：** barrel export 文件（index.ts）同时导出组件和非组件（types、constants）。

```typescript
// ❌ BAD: Mixed exports in barrel file
export { BadgeShareModal } from './BadgeShareModal';
export { SHARE_CONSTANTS } from './constants';
export type { ShareProps } from './types';

// ✅ GOOD Option 1: 在 eslint 配置中允许 barrel files
// eslint.config.js:
// 'react-refresh/only-export-components': ['error', { allowConstantExport: true }]
// 注意: 已配置 allowConstantExport，但 type re-exports 可能仍然触发

// ✅ GOOD Option 2: eslint-disable 带注释
// eslint-disable-next-line react-refresh/only-export-components -- barrel file re-exports
```

> **注意：** `allowConstantExport: true` 已在 ESLint 配置中。如果仍然报错，说明是 type 导出触发的。可以在 barrel 文件中使用 `// eslint-disable-next-line` 并注明理由。

### 5b: jsx-a11y/role-has-required-aria-props (2 个)

```powershell
npx eslint src --format compact 2>&1 | Select-String "role-has-required-aria-props"
```

**修复：** `role="combobox"` 元素必须有 `aria-controls` 和 `aria-expanded` 属性。

```tsx
// ❌ Missing required ARIA props
<div role="combobox">

// ✅ Add required props
<div
  role="combobox"
  aria-controls="listbox-id"
  aria-expanded={isOpen}
>
```

### 5c: jsx-a11y/label-has-associated-control (2 个)

**修复：** `<label>` 必须关联到表单控件。

```tsx
// ❌ Label without associated control
<label>Name</label>
<input type="text" />

// ✅ Option 1: htmlFor
<label htmlFor="name-input">Name</label>
<input id="name-input" type="text" />

// ✅ Option 2: Nesting
<label>
  Name
  <input type="text" />
</label>
```

---

## Step 6: 修复 react-hooks/exhaustive-deps warnings (9 个)

```powershell
npx eslint src --format compact 2>&1 | Select-String "exhaustive-deps"
```

**修复策略：**

1. **添加缺失依赖**（首选）：
```typescript
// ❌ Missing dep
useEffect(() => { fetchData(userId); }, []);

// ✅ Add dep  
useEffect(() => { fetchData(userId); }, [userId]);
```

2. **使用 useRef 避免不必要的重执行**：
```typescript
// 如果 callback 不应随 dep 变化而重新执行
const fetchDataRef = useRef(fetchData);
fetchDataRef.current = fetchData;
useEffect(() => { fetchDataRef.current(userId); }, [userId]);
```

3. **确有理由忽略时，使用 eslint-disable + 注释**：
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在挂载时执行一次
useEffect(() => { initializeOnce(); }, []);
```

---

## Step 7: 更新 CI Pipeline + package.json

### 7a: 更新 `frontend/package.json`

```json
"lint": "eslint . --max-warnings=0"
```

### 7b: 更新 `.github/workflows/test.yml`

在 `frontend-tests` job 的 `Install dependencies` 之后、`Run Frontend Tests` 之前添加：

```yaml
      - name: Lint frontend
        run: npm run lint

      - name: Run Frontend Tests
        run: npx vitest run
```

**完整 frontend-tests job 应为：**

```yaml
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: ./gcredit-project/frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './gcredit-project/frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Lint frontend
        run: npm run lint

      - name: Run Frontend Tests
        run: npx vitest run
```

---

## Step 8: 全面验证

```powershell
# 1. Frontend ESLint clean (0 errors + 0 warnings)
cd c:\G_Credit\CODE\gcredit-project\frontend
npx eslint . --max-warnings=0
# 预期: 无输出，exit code 0

# 2. Frontend tests pass
npx vitest run
# 预期: 37 test files, 397 tests pass

# 3. Backend tests still pass
cd ..\backend
npm test
# 预期: 534 pass, 28 skip, 0 fail

# 4. Backend ESLint still clean
npm run lint
# 预期: 无输出，exit code 0

# 5. tsc clean
cd ..\frontend
npx tsc --noEmit
# 预期: 0 errors

cd ..\backend
npx tsc --noEmit
# 预期: 0 errors
```

---

## Commit 要求

```
fix(frontend): TD-019 ESLint cleanup + CI zero-tolerance gate

- Create .gitattributes for LF line ending normalization
- Fix N frontend ESLint errors (react-hooks, typescript, a11y)
- Fix M frontend ESLint warnings (exhaustive-deps)
- Clear 21,354 CRLF prettier warnings via line ending normalization
- Add --max-warnings=0 to frontend lint script
- Add lint step to CI frontend-tests job
- 0 errors + 0 warnings across frontend + backend
- All tests pass: 397 frontend + 534 backend
```

（N 和 M 替换为实际修复数量）

---

## ⚠️ 重要注意事项

### 规则来源说明
ESLint 输出中的 "React Compiler" 错误实际来自 `react-hooks` 插件。React 19 的 `reactHooks.configs.flat.recommended` 自动包含这些 Compiler 规则：
- `react-hooks/set-state-in-effect` → "Calling setState synchronously within an effect"
- `react-hooks/preserve-manual-memoization` → "Existing memoization could not be preserved"
- `react-hooks/refs` → "Cannot access refs during render"
- `react-hooks/purity` → "Cannot call impure function during render" / "Cannot create components during render"

这些不是独立的 `react-compiler` 插件，而是 `react-hooks` v5+ 内置的。

### eslint-disable 使用原则（继承 Story 10.2 标准）
- **必须标注具体规则名**: `// eslint-disable-next-line react-hooks/exhaustive-deps`
- **必须附带英文理由**: `-- runs once on mount, deps intentionally excluded`
- **禁止 blanket disable**: ❌ `// eslint-disable`
- **优先修复不要压制**: 只有在确认修复会引入更大风险时才 disable

### CI 零容忍标准
Story 10.3b 完成后，前后端统一标准：
- Backend: `eslint "{src,apps,libs,test}/**/*.ts" --max-warnings=0` ✅
- Frontend: `eslint . --max-warnings=0` ✅
- 任何新增 error 或 warning → CI 红灯 → PR 无法合并
