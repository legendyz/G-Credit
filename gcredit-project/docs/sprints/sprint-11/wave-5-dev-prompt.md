# Sprint 11 — Wave 5 Dev Prompt

**Wave:** 5 of 5 — Polish & CI  
**Sprint Branch:** `sprint-11/security-quality-hardening`  
**Baseline Commit:** `601fe6e`  
**Estimated Time:** ~9-10h  
**Test Baseline:** Backend 718 + Frontend 541 = **1259 tests**

---

## 🎯 Wave 5 目标

完成 Sprint 11 最后 4 个 Story — 前端设计系统清理、CSV 导出功能、CI 质量门禁和 Husky 预提交钩子。这是 Sprint 的收尾波次，完成后 23/23 stories 全部交付。

**验收标准：**
- [ ] 所有前端 inline `style={{}}` 已迁移至 Tailwind（动态/Recharts 除外，需注释说明）
- [ ] `GET /api/analytics/export?format=csv` 端点可用，返回正确 CSV 文件
- [ ] Analytics Dashboard 有 "Export CSV" 按钮（PageTemplate actions slot）
- [ ] CI 新增中文字符检测 + console.log 检测两个质量门禁
- [ ] Husky + lint-staged 在 pre-commit 拦截 lint/format 问题
- [ ] 全部测试通过（0 regressions from 1259 baseline）
- [ ] ESLint 0 errors + 0 warnings（BE + FE）

---

## 执行顺序

| 序号 | Story | 预估 | 说明 |
|------|-------|------|------|
| 1 | 11.15 | 2-3h | Design System — 独立前端重构，先做可给后续测试提供稳定基线 |
| 2 | 11.17 | 3h | CSV Export — 前后端新功能，独立于其他 story |
| 3 | 11.21 | 2h | CI Quality Gates — 需在 Husky 之前完成，Husky 复用同样的检查脚本 |
| 4 | 11.22 | 2h | Husky Pre-commit — 最后做，集成 11.21 的检查逻辑 |

---

## Story 11.15: CQ-006 — Frontend Design System Consistency (Inline → Tailwind)

**预估:** 2-3h | **优先级:** 🟡 MEDIUM  
**依赖:** None

### 目标

将所有前端组件的 inline `style={{}}` 迁移至 Tailwind CSS utility classes，使设计系统一致、可维护。

### 需要迁移的文件（按优先级排序）

#### 1. BadgeShareModal.tsx — **~55 个 inline style**（最大重构目标）

**路径:** `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`

常见的 inline → Tailwind 映射参考：

| Inline Style | Tailwind Class |
|-------------|----------------|
| `display: 'flex'` | `flex` |
| `flexDirection: 'column'` | `flex-col` |
| `gap: '1rem'` | `gap-4` |
| `gap: '0.75rem'` | `gap-3` |
| `padding: '0.75rem 1rem'` | `px-4 py-3` |
| `borderRadius: '0.5rem'` | `rounded-lg` |
| `borderRadius: '0.375rem'` | `rounded-md` |
| `backgroundColor: '#f0fdf4'` | `bg-green-50` |
| `backgroundColor: '#fef2f2'` | `bg-red-50` |
| `backgroundColor: '#eff6ff'` | `bg-blue-50` |
| `color: '#166534'` | `text-green-800` |
| `color: '#991b1b'` | `text-red-800` |
| `color: '#1e40af'` | `text-blue-800` |
| `color: '#6b7280'` | `text-gray-500` |
| `color: '#9ca3af'` | `text-gray-400` |
| `color: '#4b5563'` | `text-gray-600` |
| `color: '#374151'` | `text-gray-700` |
| `color: '#111827'` | `text-gray-900` |
| `color: '#2563eb'` | `text-blue-600` |
| `fontWeight: 500` | `font-medium` |
| `fontWeight: 600` | `font-semibold` |
| `fontSize: '0.75rem'` | `text-xs` |
| `fontSize: '0.875rem'` | `text-sm` |
| `marginBottom: '0.5rem'` | `mb-2` |
| `marginTop: '0.25rem'` | `mt-1` |
| `marginRight: '0.5rem'` | `mr-2` |
| `textDecoration: 'underline'` | `underline` |
| `textAlign: 'center'` | `text-center` |
| `cursor: 'pointer'` | `cursor-pointer` |
| `border: '1px solid #d1d5db'` | `border border-gray-300` |
| `border: '1px solid #e5e7eb'` | `border border-gray-200` |
| `width: '100%'` | `w-full` |
| `width: '1.25rem'` | `w-5` |
| `height: '1.25rem'` | `h-5` |
| `opacity: 0.25` | `opacity-25` |
| `opacity: 0.75` | `opacity-75` |
| `position: 'relative'` | `relative` |

**注意事项：**
- Tab 按钮的 `onMouseEnter`/`onMouseLeave` 样式操作 → 改用 Tailwind `hover:` 前缀
- SVG 图标尺寸 `width: '1.25rem', height: '1.25rem'` → `w-5 h-5`
- 分隔线 `borderTop: '1px solid #d1d5db'` → `border-t border-gray-300`

#### 2. ClaimSuccessModal.tsx — **~15 个 inline style**

**路径:** `frontend/src/components/ClaimSuccessModal.tsx`

- Overlay: `position: 'fixed', inset: 0, zIndex: 50, ...` → `fixed inset-0 z-50 flex items-center justify-center bg-black/50`
- Modal container: `bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-8 text-center`
- SVG check circle 的 `strokeDasharray` / `strokeDashoffset` / `animation` → **必须保留 inline**（CSS 动画计算值）
- 按钮样式全换 Tailwind: `bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-medium transition-colors`

#### 3. BadgeDetailModal.tsx — **~10 个 inline style**

**路径:** `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx`

- Footer area (L323-340): `p-4 border-t bg-gray-50 flex justify-between items-center flex-wrap gap-2`
- SVG icons (L391, L506): `w-4 h-4 mr-2`
- Action buttons (L411-531): 换 Tailwind + `hover:` 前缀替代 `onMouseEnter`/`onMouseLeave`

#### 4. 必须保留 inline 的场景（不迁移，加注释）

| 文件 | 行 | 原因 |
|------|-----|------|
| `CelebrationModal.tsx` | L44 | `left`, `backgroundColor`, `animationDelay` 全部由 props 计算 |
| `SkillsDistributionChart.tsx` | L66, L93 | Recharts `contentStyle` 是库 API prop；`width: ${pct}%` 是动态值 |
| `IssuanceTrendChart.tsx` | L55, L61 | Recharts `contentStyle` / `wrapperStyle` 是库 API prop |
| `ProcessingModal.tsx` | L87, L133 | `width: ${percentComplete}%` 和 `animationDelay: ${i * 0.15}s` 是动态计算 |
| `EmployeeDashboard.tsx` | L244 | `width: ${percentage}%` 动态进度条 |
| `IssuerDashboard.tsx` | L262 | `width: ${percentage}%` 动态进度条 |

> **对于必须保留 inline 的场景，添加注释：**
> ```tsx
> {/* inline style retained: dynamic value computed from props */}
> style={{ width: `${percentage}%` }}
> ```

#### 5. App.css 清理

**路径:** `frontend/src/App.css`

此文件为 Vite 脚手架残留，包含 `.logo`、`.card`、`.read-the-docs` 等未使用的类，以及 `#root { max-width: 1280px }` 可能与页面布局冲突。

**操作：**
- 检查 `App.tsx` 是否 import 了 `App.css`
- 如果 import 了但无使用 → 删除 import + 删除文件
- 如果有使用的类 → 迁移到 Tailwind 后再删除

#### 6. accessibility.css 审查

**路径:** `frontend/src/styles/accessibility.css`

- `.sr-only` 类与 Tailwind 内置 `sr-only` 重复 → 检查是否有组件直接使用 `.sr-only` class，如果全用的 Tailwind 版 → 删除重复定义
- focus 样式 hardcoded `#3b82f6` → 考虑改用 CSS var 或保持一致即可
- **目标：不引入视觉回归**

### 验证方法

```bash
# 1. 检查剩余的 inline style 数量（应大幅减少）
grep -rn "style={{" frontend/src/ --include="*.tsx" | grep -v "spec\|test\|\.d\.ts" | wc -l

# 2. 预期：仅剩 ~10 个（动态值 + Recharts API）
# 之前：~86 个

# 3. 运行前端测试确保无回归
cd gcredit-project/frontend && npx vitest run

# 4. 运行 ESLint 确保格式正确
npx eslint src/ --max-warnings=0
```

---

## Story 11.17: FR26 — Analytics CSV Export

**预估:** 3h | **优先级:** 🟡 MEDIUM  
**依赖:** None

### 目标

为 Analytics Dashboard 添加 CSV 导出功能，让 HR 管理员可以在 Excel 中进一步分析数据。

### 现有基础设施

- **CSV 生成参考:** `bulk-issuance.controller.ts` L62-89 — 使用 BOM + Content-Disposition 实现浏览器下载
- **Analytics 数据:** 5 个已有端点提供 system-overview、issuance-trends、top-performers、skills-distribution、recent-activity
- **前端 Analytics 页:** `AdminAnalyticsPage.tsx` — 使用 `PageTemplate` 组件，`actions` slot 当前未使用
- **PageTemplate actions slot:** 渲染在标题右侧 `<div className="flex items-center gap-2">`

### Backend 实现

#### 1. 新增 CSV Export Endpoint

**文件:** `backend/src/analytics/analytics.controller.ts`

```typescript
@Get('export')
@Roles('ADMIN')
@ApiOperation({
  summary: 'Export analytics data as CSV',
  description: 'Exports system overview, issuance trends, top performers, and skills distribution as a CSV file. Admin only.',
})
@ApiQuery({
  name: 'format',
  required: false,
  enum: ['csv'],
  description: 'Export format (currently only csv)',
})
@ApiResponse({ status: 200, description: 'CSV file download' })
@ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
async exportAnalytics(
  @Query('format') format: string = 'csv',
  @Res() res: Response,
  @CurrentUser() user: { userId: string; role: string },
): Promise<void> {
  const csv = await this.analyticsService.generateCsvExport(user.userId);
  const dateStr = new Date().toISOString().split('T')[0];
  const BOM = '\uFEFF';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="gcredit-analytics-${dateStr}.csv"`,
  );
  res.send(BOM + csv);
}
```

> **⚠️ 注意:** 使用 `@Res()` 时 NestJS 不会自动序列化返回值，需手动 `res.send()`。参考 bulk-issuance 的实现模式。

#### 2. Service 层 CSV 生成

**文件:** `backend/src/analytics/analytics.service.ts`

新增 `generateCsvExport()` 方法：

```typescript
async generateCsvExport(userId: string): Promise<string> {
  // 复用现有方法获取数据
  const [overview, trends, performers, skills] = await Promise.all([
    this.getSystemOverview(),
    this.getIssuanceTrends(30, undefined, userId, 'ADMIN'),
    this.getTopPerformers(undefined, 50, userId, 'ADMIN'),
    this.getSkillsDistribution(),
  ]);

  const lines: string[] = [];
  
  // Section 1: System Overview
  lines.push('Section,Metric,Value');
  lines.push(`System Overview,Total Users,${overview.users.total}`);
  lines.push(`System Overview,Active Users,${overview.users.active}`);
  lines.push(`System Overview,New Users This Month,${overview.users.newThisMonth}`);
  lines.push(`System Overview,Badges Issued,${overview.badges.issued}`);
  lines.push(`System Overview,Badges Claimed,${overview.badges.claimed}`);
  lines.push(`System Overview,Claim Rate,${overview.badges.claimRate}%`);
  lines.push(`System Overview,Active Templates,${overview.templates.active}`);
  lines.push('');
  
  // Section 2: Issuance Trends (last 30 days)
  lines.push('Date,Issued,Claimed,Revoked');
  for (const point of trends.dataPoints) {
    lines.push(`${point.date},${point.issued},${point.claimed},${point.revoked}`);
  }
  lines.push('');
  
  // Section 3: Top Performers
  lines.push('Rank,Employee,Badge Count');
  performers.performers.forEach((p, i) => {
    // 注意: CSV 值中可能包含逗号，需要双引号包裹
    lines.push(`${i + 1},"${(p.name || '').replace(/"/g, '""')}",${p.badgeCount}`);
  });
  lines.push('');
  
  // Section 4: Skills Distribution
  lines.push('Skill,Badge Count,Category');
  for (const skill of skills.topSkills) {
    lines.push(`"${(skill.name || '').replace(/"/g, '""')}",${skill.badgeCount},"${(skill.category || '').replace(/"/g, '""')}"`);
  }

  return lines.join('\n');
}
```

> **关键点：**
> - CSV 值含逗号时用双引号包裹
> - 双引号转义用 `""` (RFC 4180 标准)
> - 不引入第三方 CSV 库，inline 生成即可（参考 bulk-issuance 先例）
> - 复用现有 service 方法，不重复写 Prisma 查询

#### 3. 单元测试

**文件:** `backend/src/analytics/analytics.service.spec.ts`（在现有文件中追加）

```typescript
describe('generateCsvExport', () => {
  it('should generate valid CSV with all sections', async () => {
    // Mock the 4 data methods
    jest.spyOn(service, 'getSystemOverview').mockResolvedValue({ /* ... */ });
    jest.spyOn(service, 'getIssuanceTrends').mockResolvedValue({ /* ... */ });
    jest.spyOn(service, 'getTopPerformers').mockResolvedValue({ /* ... */ });
    jest.spyOn(service, 'getSkillsDistribution').mockResolvedValue({ /* ... */ });

    const csv = await service.generateCsvExport('user-id');
    expect(csv).toContain('Section,Metric,Value');
    expect(csv).toContain('Date,Issued,Claimed,Revoked');
    expect(csv).toContain('Rank,Employee,Badge Count');
    expect(csv).toContain('Skill,Badge Count,Category');
  });

  it('should escape commas and quotes in CSV values', async () => {
    // Mock performer with comma in name
    // Verify output has proper RFC 4180 escaping
  });
});
```

### Frontend 实现

#### 1. Export API 调用

**文件:** `frontend/src/api/analytics.ts`（或新建 `useAnalyticsExport` hook）

```typescript
export async function exportAnalyticsCsv(): Promise<Blob> {
  const response = await apiFetch('/api/analytics/export?format=csv');
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
}
```

#### 2. Analytics Page — Export 按钮

**文件:** `frontend/src/pages/AdminAnalyticsPage.tsx`

在 `PageTemplate` 的 `actions` prop 中添加：

```tsx
import { Download } from 'lucide-react';

// 在组件内部
const [exporting, setExporting] = useState(false);

const handleExport = async () => {
  setExporting(true);
  try {
    const blob = await exportAnalyticsCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcredit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  } catch {
    toast.error('Failed to export analytics');
  } finally {
    setExporting(false);
  }
};

// PageTemplate usage
<PageTemplate
  title="Analytics Dashboard"
  description="..."
  actions={
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  }
>
```

> **UX 要求 (from backlog):**
> - 按钮样式: `variant="outline"` + Lucide `Download` 图标
> - 文件名: `gcredit-analytics-{YYYY-MM-DD}.csv`
> - 交互: button loading → 浏览器直接下载 → `toast.success`

### 验证方法

```bash
# Backend: 测试 CSV 生成和端点
cd gcredit-project/backend && npx jest analytics --forceExit

# Frontend: 确保编译通过
cd gcredit-project/frontend && npx tsc --noEmit

# 手动验证: 启动后端，访问 GET /api/analytics/export?format=csv
# 检查：Content-Type、Content-Disposition、BOM、CSV 格式正确
```

---

## Story 11.21: TD-023 + TD-024 — CI Quality Gates (Chinese Characters + console.log)

**预估:** 2h | **优先级:** 🟡 MEDIUM  
**依赖:** Story 11.13 (Logger migration — ✅ Done in Wave 4)

### 目标

在 CI pipeline 中新增两个质量门禁：检测源码中的中文字符和 `console.log` 语句。

### 现有 CI 结构

**文件:** `.github/workflows/test.yml`

当前 5 个 job:
1. `lint-and-unit` — Backend ESLint + tsc + jest
2. `frontend-tests` — Frontend ESLint + vitest
3. `e2e-tests` — Backend E2E (needs PostgreSQL)
4. `build` — Backend build
5. `frontend-build` — Frontend build

### 当前代码中的已知违规

| 文件 | 行 | 内容 | 修复方案 |
|------|-----|------|----------|
| `backend/src/badge-verification/badge-verification.service.ts` | L86 | `// Story 11.4: PRIVATE badges return 404 on verification page (C-3 方案B)` | 改为英文: `(C-3 Option B)` |

> **Backend & Frontend 生产代码中 `console.log` = 0 个**（Wave 4 Logger migration 已完成）

### 实现方案

#### 方案选择：CI Step（grep-based） vs ESLint Rule

| 维度 | CI Step (grep) | ESLint Rule |
|------|---------------|-------------|
| 复杂度 | Simple shell script | 需配置 `no-restricted-syntax` 或自定义 rule |
| 覆盖范围 | 所有文件 | 仅 ESLint 扫描到的文件 |
| 开发者反馈 | 推送后才知道 | IDE 实时提示 |
| 维护成本 | 低 | 集成到现有 lint 中 |

**推荐：两者都做。**
1. ESLint `no-console: 'error'` → IDE 实时反馈 + CI 自然拦截
2. CI 独立 step → 中文字符检测（ESLint 无原生支持）

#### Step 1: 修复已知违规

```typescript
// Before:
// Story 11.4: PRIVATE badges return 404 on verification page (C-3 方案B)

// After:
// Story 11.4: PRIVATE badges return 404 on verification page (C-3 Option B)
```

#### Step 2: Backend ESLint 添加 `no-console` Rule

**文件:** `backend/eslint.config.mjs`

```javascript
// 在 rules 中添加:
'no-console': 'error',
```

> **注意:** spec 文件中的 `console.log`（如 mock 中的 `jest.fn()`）也会被拦截。如果 spec 文件中有合法使用，需在 test override 中添加 `'no-console': 'off'`。

#### Step 3: Frontend ESLint 添加 `no-console` Rule

**文件:** `frontend/eslint.config.js`

```javascript
// 在 rules 中添加:
'no-console': 'error',
```

> **验证:** 先运行 `npx eslint src/ --max-warnings=0` 确认当前 0 violations，再提交规则。

#### Step 4: CI 中文字符检测

**文件:** `.github/workflows/test.yml`

在 `lint-and-unit` job 的 "Run ESLint" step **之前**添加：

```yaml
      - name: Check for Chinese characters in source code
        run: |
          echo "Checking for Chinese characters in backend source..."
          if grep -rn '[\x{4E00}-\x{9FFF}]' src/ --include="*.ts" | grep -v '\.spec\.ts' | grep -v '\.test\.ts' | grep -v 'node_modules'; then
            echo "::error::Chinese characters found in production source code!"
            exit 1
          fi
          echo "✓ No Chinese characters found"
```

在 `frontend-tests` job 的 "Lint frontend" step **之前**添加：

```yaml
      - name: Check for Chinese characters in source code
        run: |
          echo "Checking for Chinese characters in frontend source..."
          if grep -rn '[\x{4E00}-\x{9FFF}]' src/ --include="*.ts" --include="*.tsx" | grep -v '\.spec\.' | grep -v '\.test\.' | grep -v '__tests__' | grep -v 'node_modules'; then
            echo "::error::Chinese characters found in production source code!"
            exit 1
          fi
          echo "✓ No Chinese characters found"
```

> **排除范围：**
> - `*.spec.ts` / `*.test.ts` / `__tests__/` — 测试文件中允许中文（如断言测试）
> - `docs/` — 文档目录不检查
> - `.md` 文件不检查
> - `node_modules/` — 第三方代码不检查

#### Step 5: 本地检测脚本（供 Husky 使用）

**文件:** `scripts/check-chinese.sh`

```bash
#!/bin/bash
# Check for Chinese characters in source code
# Used by CI and Husky pre-commit hook

echo "Checking for Chinese characters..."

BACKEND_HITS=$(grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/backend/src/ --include="*.ts" | grep -v '\.spec\.ts' | grep -v '\.test\.ts' || true)
FRONTEND_HITS=$(grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/frontend/src/ --include="*.ts" --include="*.tsx" | grep -v '\.spec\.' | grep -v '\.test\.' | grep -v '__tests__' || true)

if [ -n "$BACKEND_HITS" ] || [ -n "$FRONTEND_HITS" ]; then
  echo "ERROR: Chinese characters found in production source code:"
  [ -n "$BACKEND_HITS" ] && echo "$BACKEND_HITS"
  [ -n "$FRONTEND_HITS" ] && echo "$FRONTEND_HITS"
  exit 1
fi

echo "✓ No Chinese characters found"
```

### 验证方法

```bash
# 1. 先修复已知中文字符
grep -rn "[\x{4E00}-\x{9FFF}]" gcredit-project/backend/src/ --include="*.ts" | grep -v "\.spec\.ts"
# 预期: 0 matches after fix

# 2. ESLint no-console 规则验证
cd gcredit-project/backend && npx eslint src/ --max-warnings=0
cd gcredit-project/frontend && npx eslint src/ --max-warnings=0
# 预期: 0 errors (console.log 已在 Wave 4 全部替换为 Logger)

# 3. 注入故意违规，验证 CI 会拦截
# 在任意 .ts 文件加一行 console.log('test') → ESLint 应报错
# 在任意 .ts 文件加一行 // 中文注释 → grep 应报错
```

---

## Story 11.22: TD-025 — Husky Pre-commit Hooks

**预估:** 2h | **优先级:** 🟡 MEDIUM  
**依赖:** Story 11.21 (CI Quality Gates — 同 Wave，先于本 Story 完成)

### 目标

配置 Husky + lint-staged，在 `git commit` 时自动执行 lint、format 和中文字符检查。

### 项目结构注意事项

```
c:\G_Credit\CODE/              ← Git 根目录（.git 在这里）
├── gcredit-project/
│   ├── backend/               ← 独立 package.json + node_modules
│   └── frontend/              ← 独立 package.json + node_modules
├── _bmad/
└── (无 root package.json)
```

**关键问题:** Git hooks 必须在 `.git` 所在目录配置，但 `package.json` 在子目录。

### 实现方案

#### Step 1: 在项目根目录创建 package.json

**文件:** `package.json`（项目根目录 `c:\G_Credit\CODE/`）

```json
{
  "name": "gcredit-monorepo",
  "private": true,
  "description": "G-Credit project root — Husky hooks only",
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "gcredit-project/backend/src/**/*.ts": [
      "bash -c 'cd gcredit-project/backend && npx eslint --fix --max-warnings=0'",
      "bash -c 'cd gcredit-project/backend && npx prettier --write'"
    ],
    "gcredit-project/frontend/src/**/*.{ts,tsx}": [
      "bash -c 'cd gcredit-project/frontend && npx eslint --fix --max-warnings=0'",
      "bash -c 'cd gcredit-project/frontend && npx prettier --write'"
    ]
  }
}
```

> **⚠️ Windows 兼容性:** `bash -c` 在 Git Bash (Windows) 中可用。如果团队使用 PowerShell，需测试兼容性。lint-staged 也支持直接命令格式。

**替代方案（Windows-native，推荐）：**

```json
{
  "lint-staged": {
    "gcredit-project/backend/src/**/*.ts": [
      "npx --prefix gcredit-project/backend eslint --fix --max-warnings=0",
      "npx --prefix gcredit-project/backend prettier --write"
    ],
    "gcredit-project/frontend/src/**/*.{ts,tsx}": [
      "npx --prefix gcredit-project/frontend eslint --fix --max-warnings=0",
      "npx --prefix gcredit-project/frontend prettier --write"
    ]
  }
}
```

#### Step 2: 安装依赖 + 初始化 Husky

```bash
cd c:\G_Credit\CODE
npm install
npx husky init
```

这会创建 `.husky/` 目录和默认的 pre-commit hook。

#### Step 3: 配置 Pre-commit Hook

**文件:** `.husky/pre-commit`

```bash
# Lint-staged: ESLint + Prettier on staged files
npx lint-staged

# Chinese character check on staged .ts/.tsx files
STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | grep -v '\.spec\.' | grep -v '\.test\.' | grep -v '__tests__' || true)

if [ -n "$STAGED_TS" ]; then
  CHINESE=$(echo "$STAGED_TS" | xargs grep -l '[\x{4E00}-\x{9FFF}]' 2>/dev/null || true)
  if [ -n "$CHINESE" ]; then
    echo "ERROR: Chinese characters found in staged files:"
    echo "$CHINESE"
    exit 1
  fi
fi
```

#### Step 4: 配置 Pre-push Hook（Lesson 40 — 镜像 CI）

**文件:** `.husky/pre-push`

```bash
echo "Running pre-push checks (mirroring CI pipeline)..."

# Backend checks
echo "=== Backend ==="
cd gcredit-project/backend
npx eslint src/ --max-warnings=0
npx tsc --noEmit
npm test -- --forceExit
cd ../..

# Frontend checks
echo "=== Frontend ==="
cd gcredit-project/frontend
npx eslint src/ --max-warnings=0
npx tsc --noEmit
npx vitest run
cd ../..

echo "✓ All pre-push checks passed!"
```

> **⚠️ Lesson 40 集成:** pre-push 包含完整 CI 镜像（lint + tsc + test），确保推送前所有检查通过。
> **⚠️ Lesson 35 集成:** `eslint src/` 扫描整个 src/ 目录而非选择性文件，确保不遗漏新文件。

#### Step 5: 更新 .gitignore

确保不提交 node_modules 但提交 .husky：

```
# Root node_modules (Husky/lint-staged)
/node_modules/
/package-lock.json
```

> **注意:** `package-lock.json` 是否提交取决于团队决策。如果只有 husky + lint-staged，不提交 lock file 影响不大。

#### Step 6: 文档更新

**文件:** `gcredit-project/README.md` — 在 "Getting Started" 或 "Development" 部分添加：

```markdown
### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) for Git hooks:

- **Pre-commit:** ESLint + Prettier on staged files, Chinese character detection
- **Pre-push:** Full CI mirror (lint + type-check + tests for both BE and FE)

After cloning, run from the project root:
```bash
npm install  # Installs Husky + lint-staged
```

To bypass hooks temporarily (not recommended):
```bash
git commit --no-verify
git push --no-verify
```
```

### 验证方法

```bash
# 1. 安装验证
ls .husky/pre-commit  # 文件存在
ls .husky/pre-push    # 文件存在

# 2. Pre-commit 验证 — 修改一个 .ts 文件，stage，commit
echo "// test" >> gcredit-project/backend/src/app.service.ts
git add gcredit-project/backend/src/app.service.ts
git commit -m "test: verify husky hook"
# Husky 应触发 lint-staged + 中文字符检查

# 3. Pre-push 验证 — 尝试 push
git push origin sprint-11/security-quality-hardening
# 应运行完整 lint + tsc + test 套件

# 4. 故障注入 — 验证拦截
# 在 .ts 文件中加入 console.log → commit 应失败 (ESLint no-console)
# 在 .ts 文件中加入中文注释 → commit 应失败 (grep check)
```

---

## 📊 验收标准总览

| 分类 | 检查项 | Story |
|------|--------|-------|
| CQ | 前端 inline style 数量 ≤10（仅动态值+库API） | 11.15 |
| CQ | App.css 已清理或删除 | 11.15 |
| FE | Analytics "Export CSV" 按钮可用 | 11.17 |
| BE | `GET /api/analytics/export?format=csv` 返回有效 CSV | 11.17 |
| BE | CSV 包含 4 个 section（overview/trends/performers/skills） | 11.17 |
| BE | CSV 文件名格式 `gcredit-analytics-{YYYY-MM-DD}.csv` | 11.17 |
| CI | `.github/workflows/test.yml` 含中文字符检测 step | 11.21 |
| CI | Backend + Frontend ESLint 配置 `no-console: 'error'` | 11.21 |
| CI | 0 个中文字符残留在生产代码中 | 11.21 |
| CI | 0 个 `console.log` 残留在生产代码中 | 11.21 |
| DX | `.husky/pre-commit` 运行 lint-staged + 中文检查 | 11.22 |
| DX | `.husky/pre-push` 镜像完整 CI pipeline (Lesson 40) | 11.22 |
| DX | 根目录 `package.json` 仅含 husky + lint-staged | 11.22 |
| ALL | Backend 测试 ≥718 passing（0 regressions） | ALL |
| ALL | Frontend 测试 ≥541 passing（0 regressions） | ALL |
| ALL | ESLint 0 errors + 0 warnings（BE + FE） | ALL |

---

## 🔧 Pre-Push Checklist（提交前必须全部通过）

> **Lesson 40:** 本地 pre-push 检查必须完整镜像 CI pipeline，避免推送后 CI 红。
> **Lesson 35:** ESLint 必须扫描整个 `src/` 目录，不能只检查修改的文件。新文件更容易出问题。

在每次 `git push` 之前，请在本地依次执行以下命令，**全部通过后**再推送：

### Backend
```bash
cd gcredit-project/backend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint src/ --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npm test -- --forceExit
```

### Frontend
```bash
cd gcredit-project/frontend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint src/ --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npx vitest run
```

### 额外检查（Story 11.21/11.22 完成后自动化）
```bash
# 中文字符检查（手动 → Husky 后自动）
grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/backend/src/ --include="*.ts" | grep -v "\.spec\.ts"
grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/frontend/src/ --include="*.ts" --include="*.tsx" | grep -v "\.spec\." | grep -v "__tests__"
```

### 常见问题
| 原因 | 解决 |
|------|------|
| `no-console` 规则报错（11.21 后出现） | 用 `this.logger.log()` 替代 `console.log()` |
| lint-staged 运行 ESLint 报错 | 确认 `npx --prefix` 路径正确 |
| pre-push 太慢（跑全量测试） | 正常，约 2-3 分钟，保证质量 |
| Windows bash 不可用 | 安装 Git for Windows（自带 bash） |

> **规则：** 如果本地检查有任何失败，先修复再推送。不要假设 CI 会通过。
