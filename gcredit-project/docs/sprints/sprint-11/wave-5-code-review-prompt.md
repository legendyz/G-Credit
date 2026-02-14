# Wave 5 Code Review Prompt

**Sprint:** 11 — Security & Quality Hardening  
**Wave:** 5 of 5 — Polish & CI (Sprint 最终波次)  
**Branch:** `sprint-11/security-quality-hardening`  
**Commits:** `4d0fc84..2d452e5` (4 commits: 1 design system + 1 CSV export + 1 CI gates + 1 Husky)  
**Changed Files:** 26 files, +520 / -606 lines (净减 86 行 — 清理 inline styles)  
**Test Baseline:** Backend 718 + Frontend 541 = **1259 tests**

---

## 📋 Review Scope

请对 Wave 5 的以下 4 个 Story 实现做 Code Review。这是 Sprint 11 的最后一波，完成后 23/23 stories 全部交付。

| Story | 标题 | 改动范围 | Commit |
|-------|------|---------|--------|
| 11.15 | CQ-006: Design System Consistency (Inline → Tailwind) | 10 个前端文件，~86 个 inline style 迁移 | `9ebbdf8` |
| 11.17 | FR26: Analytics CSV Export | BE endpoint + service + tests，FE button + API | `9ef81d3` |
| 11.21 | TD-023+024: CI Quality Gates | ESLint no-console + CI 中文检测 + 1 Chinese fix | `2266e98` |
| 11.22 | TD-025: Husky Pre-commit Hooks | root package.json + .husky/ hooks + README | `2d452e5` |

---

## 📐 Review 参考文档

1. **实现规格:** `sprint-11/wave-5-dev-prompt.md` — 每个 Story 的修改位置、方案、验收标准
2. **验收标准:** `sprint-11/backlog.md` 中 Story 11.15, 11.17, 11.21, 11.22 的 Key Deliverables
3. **Lesson 35:** ESLint 必须对全 `src/` 目录执行，不能 cherry-pick 文件。新文件更容易出问题。
4. **Lesson 40:** 本地 pre-push 检查必须完整镜像 CI pipeline。

---

## ✅ Review Checklist（逐 Story）

### Story 11.15: CQ-006 — Frontend Design System Consistency — 2-3h

#### 主要迁移文件
- [ ] **BadgeShareModal.tsx** — ~55 个 inline style → Tailwind（最大重构）
  - [ ] 所有 `color: '#xxxxx'` → 对应 Tailwind text 色彩 class（如 `text-green-800`, `text-red-800`, `text-gray-500`）
  - [ ] 所有 `fontSize`/`fontWeight` → `text-sm`/`text-xs`/`font-medium`/`font-semibold`
  - [ ] 所有 `display: 'flex'`, `flexDirection`, `gap`, `padding`, `borderRadius` → Tailwind layout class
  - [ ] `onMouseEnter`/`onMouseLeave` 内联样式操作是否已改为 Tailwind `hover:` 前缀？
  - [ ] 无 UI 视觉回归（颜色、间距、字号映射正确）

- [ ] **ClaimSuccessModal.tsx** — ~15 个 inline style → Tailwind
  - [ ] Overlay、Modal container、按钮样式全 Tailwind
  - [ ] SVG `strokeDasharray`/`strokeDashoffset`/`animation` 是否保留 inline？（应该保留 — CSS 动画计算值）
  - [ ] 保留的 inline style 是否有 `/* inline style retained: ... */` 注释？

- [ ] **BadgeDetailModal.tsx** — ~10 个 inline style → Tailwind
  - [ ] Footer 区域 layout styles 已迁移
  - [ ] SVG icon 尺寸 `w-4 h-4 mr-2` 替代 `width: '1rem'` 等
  - [ ] Action button hover 是否改用 Tailwind `hover:` 替代 `onMouseEnter`/`onMouseLeave`？

#### 必须保留 inline 的场景
- [ ] `CelebrationModal.tsx` — 动态 `left`, `backgroundColor`, `animationDelay`（props 计算）→ 有注释
- [ ] `SkillsDistributionChart.tsx` — Recharts `contentStyle` (库 API) + 动态 `width: ${pct}%` → 有注释
- [ ] `IssuanceTrendChart.tsx` — Recharts `contentStyle`/`wrapperStyle` (库 API) → 有注释
- [ ] `ProcessingModal.tsx` — 动态 `width: ${percentComplete}%` + `animationDelay` → 有注释
- [ ] `EmployeeDashboard.tsx` — 动态 `width: ${percentage}%` → 有注释
- [ ] `IssuerDashboard.tsx` — 动态 `width: ${percentage}%` → 有注释

> **验证方法:** 对每个 "inline style retained" 注释检查：是否确实是动态/库API，而非可转 Tailwind 的静态值。

#### CSS 清理
- [ ] `App.css` 已删除？（Vite 脚手架残留，42 行）
- [ ] `App.tsx` 中 `import './App.css'` 已移除？（若有）
- [ ] `accessibility.css` 中 `.sr-only` 重复是否处理？（与 Tailwind 内置重复）

#### 测试与 Lint
- [ ] 前端测试全部通过（≥541，0 regressions）
- [ ] ESLint 0 errors + 0 warnings

---

### Story 11.17: FR26 — Analytics CSV Export — 3h

#### Backend — Controller
- [ ] `analytics.controller.ts` 新增 `@Get('export')` endpoint
  - [ ] 装饰器完整：`@Roles('ADMIN')`, `@ApiOperation`, `@ApiQuery`, `@ApiResponse`
  - [ ] 使用 `@Res()` 手动发送响应（与 bulk-issuance 模式一致）
  - [ ] `Content-Type: text/csv; charset=utf-8` header
  - [ ] `Content-Disposition: attachment; filename="gcredit-analytics-{YYYY-MM-DD}.csv"` header
  - [ ] BOM `\uFEFF` 前缀（Excel 兼容性）
  - [ ] `_format` 参数（`= 'csv'` 默认值）— 下划线前缀表示未使用但接受，是否合理？

#### Backend — Service
- [ ] `analytics.service.ts` 新增 `generateCsvExport(userId: string)` 方法
  - [ ] 4 个数据源通过 `Promise.all` 并行获取（performance）
  - [ ] 复用已有 `getSystemOverview()`, `getIssuanceTrends()`, `getTopPerformers()`, `getSkillsDistribution()`
  - [ ] RFC 4180 CSV 转义：逗号字段双引号包裹，双引号用 `""` 转义
  - [ ] 4 个 section 有正确的 header 行
  - [ ] 空行分隔各 section
  - [ ] DTO 字段名访问是否与实际返回的字段名一致？（如 `overview.users.activeThisMonth` vs `active`、`overview.badges.totalIssued` vs `issued`）
  - [ ] `performers.topPerformers` vs `performers.performers` — 访问的属性名是否匹配 `TopPerformersDto`？
  - [ ] `skills.topSkills[].skillName` vs `name` — 字段名是否匹配 `SkillsDistributionDto`？

> **⚠️ 重点审查:** CSV 中的 DTO 字段路径必须与实际 analytics service 返回的对象结构完全匹配。如有不匹配会导致运行时 `undefined` 输出。建议对照 DTOs in `analytics/dto/` 目录逐一核对。

#### Backend — Tests
- [ ] `analytics.service.spec.ts` 新增 `describe('generateCsvExport')` — 4 个测试
  - [ ] 'should generate valid CSV with all four sections' — 验证 4 个 section header
  - [ ] 'should escape commas and quotes in CSV values (RFC 4180)' — `"Bob, Jr."` + `"Project ""Management"""`
  - [ ] 'should call service methods with correct parameters' — spy 验证参数传递
  - [ ] 'should handle empty data gracefully' — 空 dataPoints/performers/skills 不报错
  - [ ] Mock 数据结构是否与实际 DTO 一致？

#### Frontend — API
- [ ] `analyticsApi.ts` 新增 `exportAnalyticsCsv()` 函数
  - [ ] 使用 `apiFetch('/analytics/export?format=csv')` — 路径正确？
  - [ ] 错误处理：`response.json().catch()` 兜底 — 健壮
  - [ ] 返回 `Blob` — 正确用于文件下载

#### Frontend — Page
- [ ] `AdminAnalyticsPage.tsx` — Export 按钮
  - [ ] 使用 `PageTemplate` 的 `actions` prop — 正确 slot
  - [ ] `Download` icon from `lucide-react` — 符合 UX review 要求
  - [ ] `variant="outline"` 外观：`border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50`
  - [ ] Loading 状态：`disabled={exporting}` + `'Exporting...'` 文案
  - [ ] `URL.createObjectURL` + `URL.revokeObjectURL` — 内存清理正确
  - [ ] 文件名格式：`gcredit-analytics-{YYYY-MM-DD}.csv` — 符合 UX review
  - [ ] 成功 toast：`toast.success('Analytics exported successfully')`
  - [ ] 失败 toast：`toast.error('Failed to export analytics')`
  - [ ] `useCallback` 包裹 handler — 合理（避免 re-render）

---

### Story 11.21: TD-023+TD-024 — CI Quality Gates — 2h

#### 中文字符修复
- [ ] `badge-verification.service.ts` L86：`方案B` → `Option B` — 唯一已知违规已修复

#### ESLint no-console Rule — Backend
- [ ] `eslint.config.mjs` 添加 `'no-console': 'error'`
- [ ] Test override (`**/*.spec.ts`, `**/test/**/*.ts`) 添加 `'no-console': 'off'` — 测试文件允许 console
- [ ] 注释 `// TD-023: Allow console in test files (jest mock patterns)` — 清晰

#### ESLint no-console Rule — Frontend
- [ ] `eslint.config.js` 添加 `'no-console': 'error'`
- [ ] Test override (`**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`, `**/__tests__/**`) 添加 `'no-console': 'off'`
- [ ] 注释 `// TD-024: Prevent console.log in production code` 和 `// TD-024: Allow console in test files`

#### ErrorBoundary.tsx 特殊处理
- [ ] `ErrorBoundary.tsx` 的 `console.error` 添加 `// eslint-disable-next-line no-console --` + 说明
- [ ] 这是 React Error Boundary 的合法用法 — `componentDidCatch` 作为最后兜底必须直接 log 到 console

> **验证:** frontend/backend 除 ErrorBoundary 外，0 个 `console.log/warn/error` 在生产代码。

#### CI Workflow
- [ ] `.github/workflows/test.yml` — `lint-and-unit` job 新增 "Check for Chinese characters in source code" step
  - [ ] grep 命令排除 `.spec.ts`, `.test.ts`, `node_modules`
  - [ ] 使用 `::error::` GitHub Actions 注解格式
  - [ ] 在 ESLint step 之前执行（fail fast）
- [ ] `.github/workflows/test.yml` — `frontend-tests` job 新增相同 step
  - [ ] grep 命令排除 `.spec.`, `.test.`, `__tests__`, `node_modules`
  - [ ] 同样在 Lint step 之前

#### check-chinese.sh 脚本
- [ ] `scripts/check-chinese.sh` 存在且可执行
- [ ] 检查 backend src/ + frontend src/
- [ ] 排除 spec/test 文件
- [ ] 使用 `|| true` 防止 grep 无匹配时退出

> **⚠️ 审查点:** CI 中的 grep 正则 `[\x{4E00}-\x{9FFF}]` 在 Ubuntu (GNU grep) 上是否正确工作？某些 grep 版本需要 `-P` (Perl regex) flag 来支持 `\x{...}` 语法。如果 CI 使用 `grep -P` 不可用，可能需要改为 `[\u4E00-\u9FFF]` 或使用 `grep -P '[\x{4E00}-\x{9FFF}]'`。

---

### Story 11.22: TD-025 — Husky Pre-commit Hooks — 2h

#### 根目录 package.json
- [ ] `package.json` 创建于 Git 根目录
  - [ ] `"private": true` — 防止误发布
  - [ ] `"prepare": "husky"` script — Husky v9 初始化
  - [ ] `devDependencies` 仅含 `husky` + `lint-staged` — 最小化
  - [ ] `lint-staged` 配置分 backend/frontend 路径
  - [ ] `npx --prefix` 前缀方案 Windows 兼容性是否验证过？

#### Pre-commit Hook
- [ ] `.husky/pre-commit` 存在
  - [ ] 运行 `npx lint-staged` — ESLint + Prettier on staged files
  - [ ] 中文字符检查：仅对 staged `.ts/.tsx` 文件（排除 spec/test）
  - [ ] `git diff --cached --name-only --diff-filter=ACM` — 仅检查新增/修改文件
  - [ ] `|| true` 防止 grep/xargs 无匹配退出

#### Pre-push Hook — Lesson 40 镜像
- [ ] `.husky/pre-push` 存在
  - [ ] Backend: `eslint src/ --max-warnings=0` + `tsc --noEmit` + `npm test -- --forceExit`
  - [ ] Frontend: `eslint src/ --max-warnings=0` + `tsc --noEmit` + `npx vitest run`
  - [ ] **Lesson 35 合规:** `eslint src/` 扫描整个目录而非选择性文件 ✓
  - [ ] **Lesson 40 合规:** 完整镜像 CI pipeline（lint + type-check + test） ✓
  - [ ] `cd gcredit-project/backend` 和 `cd ../..` — 路径是否正确？假设从 Git 根目录执行

> **⚠️ 审查点:** pre-push 中 `cd gcredit-project/backend` → `cd ../..` 能否正确回到 Git 根？如果 Husky 从 `.husky/` 目录执行，初始 cwd 是什么？Husky v9 默认从 Git 根执行，应该没问题。

#### .gitignore 更新
- [ ] `/node_modules/` 和 `/package-lock.json` 已添加（根目录，避免提交 Husky 依赖产物）
- [ ] `/Scripts/` 改为 `/Scripts/`（绝对路径，避免误匹配 `scripts/` 目录）

#### README 更新
- [ ] `gcredit-project/README.md` 新增 "Pre-commit Hooks" 部分
  - [ ] 说明 pre-commit 和 pre-push 功能
  - [ ] 安装命令 `cd .. && npm install`
  - [ ] `--no-verify` bypass 提示（附"not recommended"警告）

---

## 🔍 跨 Story 检查

### Lesson 35 合规（ESLint 全目录扫描）
- [ ] Dev 是否在提交前运行了 `npx eslint src/ --max-warnings=0`（整个 src/）？
- [ ] 新增的 `analyticsApi.ts`、修改的 ESLint 配置文件自身格式是否正确？
- [ ] 有无出现 Wave 4 的 Lesson 35 recurrence（新文件绕过 lint）？

### Lesson 40 合规（Pre-Push = CI Mirror）
- [ ] `.husky/pre-push` 是否覆盖 CI 的所有步骤（lint + tsc + test for both BE and FE）？
- [ ] E2E tests 是否包含在 pre-push 中？（CI 有 e2e-tests job，pre-push 可能跳过 — 这是否合理决策？）

### 功能完整性
- [ ] 新增的 `no-console` ESLint 规则不会破坏现有 ESLint 检查（应该不会 — 生产代码已无 console）
- [ ] `App.css` 删除后不影响任何组件样式（确认无引用残留）
- [ ] Husky hooks 在 Windows + Git Bash 环境可正常工作

### 测试数量
```
Backend:  ≥718 passing (0 regressions) + 新增 CSV export tests
Frontend: ≥541 passing (0 regressions)
ESLint:   BE 0 errors + FE 0 errors
```

---

## 📋 Review 输出格式

请按以下格式输出 Review 结果：

```markdown
## Review 结果: [APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED]

### 各 Story 状态
| Story | 状态 | 备注 |
|-------|------|------|
| 11.15 | ✅/⚠️/❌ | ... |
| 11.17 | ✅/⚠️/❌ | ... |
| 11.21 | ✅/⚠️/❌ | ... |
| 11.22 | ✅/⚠️/❌ | ... |

### 架构条件满足情况
（本 Wave 无新架构条件，但需验证 Lesson 35/40 合规）

### Lesson 35/40 合规
| # | 条件 | 状态 | 备注 |
|---|------|------|------|
| L35 | ESLint 全 src/ 目录扫描 | ✅/❌ | ... |
| L40 | pre-push 镜像 CI pipeline | ✅/❌ | ... |

### 发现的问题（如有）
1. [BLOCKER/SUGGESTION] ...

### 总结
...
```
