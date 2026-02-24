# Code Review Prompt — Story 12.1: Skill Category Management UI

## Review Context

**Story:** `gcredit-project/docs/sprints/sprint-12/12-1-skill-category-management-ui.md`
**Dev Prompt:** `gcredit-project/docs/sprints/sprint-12/12-1-dev-prompt.md`
**Branch:** `sprint-12/management-uis-evidence`
**Commit:** `28bdc90` — `feat(Story-12.1): Skill Category Management UI`
**Base:** `6f6c983` (previous commit on same branch)

### Story Summary

Admin 管理页面——技能类别（Skill Category）树形 CRUD 管理界面。支持 3 级层级（L1/L2/L3）创建/编辑/删除/拖拽重排序，同时建立了 3 个跨 Story 复用的共享组件。后端修改：`parentId` 从必填改为可选，支持创建顶级类别。

---

## Scope of Changes

**23 files changed, +3,458 / -100 lines**

### New Frontend Components (7 files, ~1,144 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/components/admin/AdminPageShell.tsx` | 89 | 共享页面壳：loading/error/empty 三态管理，包裹 PageTemplate |
| `frontend/src/components/ui/ConfirmDialog.tsx` | 56 | 共享确认对话框，支持 danger variant |
| `frontend/src/components/admin/CategoryTree.tsx` | 417 | 递归树组件，支持 editable/read-only 模式 + @dnd-kit 拖拽 |
| `frontend/src/components/admin/CategoryFormDialog.tsx` | 199 | 创建/编辑表单对话框，含 parent selector |
| `frontend/src/pages/admin/SkillCategoryManagementPage.tsx` | 194 | 主页面，组合所有组件 + CRUD 流程编排 |
| `frontend/src/hooks/useSkillCategories.ts` | 123 | React Query hooks: tree/flat 查询 + create/update/delete mutations |
| `frontend/src/lib/apiFetch.ts` | — | 未修改（仅引用） |

### New Test Files (7 files, ~1,282 lines)
| File | Lines | Tests |
|------|-------|-------|
| `frontend/src/components/admin/AdminPageShell.test.tsx` | 142 | Loading/error/empty/normal 四态 |
| `frontend/src/components/ui/ConfirmDialog.test.tsx` | 66 | Confirm/cancel/danger/loading |
| `frontend/src/components/admin/CategoryTree.test.tsx` | 177 | Tree 渲染/展开折叠/操作按钮/lock icon |
| `frontend/src/components/admin/CategoryFormDialog.test.tsx` | 196 | 表单创建/编辑/验证/parent 选择器 |
| `frontend/src/hooks/useSkillCategories.test.tsx` | 299 | 5 hooks: tree/flat 查询 + 3 mutations |
| `frontend/src/pages/admin/SkillCategoryManagementPage.test.tsx` | 252 | 页面级集成测试 |
| `backend/src/skill-categories/skill-categories.service.spec.ts` | 150 | Backend service: L1 创建, parent 验证, max level |

### Modified Files (9 files)
| File | Change | LOC |
|------|--------|-----|
| `frontend/src/App.tsx` | +lazy import + route `/admin/skills/categories` | +11 |
| `frontend/src/components/Navbar.tsx` | +Skill Categories nav link (ADMIN only) | +30/-14 |
| `frontend/src/components/layout/MobileNav.tsx` | +navLinks entry | +1 |
| `frontend/package.json` | +@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities | +3 |
| `frontend/package-lock.json` | lock file update | +56 |
| `backend/src/skill-categories/dto/skill-category.dto.ts` | parentId: required → @IsOptional() | +4/-3 |
| `backend/src/skill-categories/skill-categories.service.ts` | create(): 支持 parentId 为空时创建 L1 | +23/-17 |
| `docs/sprints/sprint-12/12-1-skill-category-management-ui.md` | Status → done, Dev Agent Record | ~70 |
| `docs/sprints/sprint-status.yaml` | 12-1 → done | +1/-1 |

---

## Review Checklist

### 1. Architecture & Patterns 合规性

- [ ] **apiFetch 使用：** 所有 API 调用是否都通过 `apiFetch` / `apiFetchJson`？未使用 raw `fetch` 或 `axios`？
- [ ] **React Query 模式：** `queryKey` 命名是否一致？`staleTime` 设置是否合理？mutation `onSuccess` 是否正确 invalidate 缓存？
- [ ] **Lazy loading：** 新页面是否使用 `lazy()` + `export default`？
- [ ] **ProtectedRoute：** 路由是否正确设置 `requiredRoles={['ADMIN']}`？
- [ ] **组件层次：** AdminPageShell → PageTemplate 嵌套是否合理？是否存在过度包装？
- [ ] **Toast 模式：** 是否使用 `sonner` 的 `toast.success()` / `toast.error()`？

### 2. Backend 变更审查

- [ ] **DTO 变更 (skill-category.dto.ts):**
  - `parentId` 从 `@IsUUID()` 必填改为 `@IsOptional() @IsUUID()` 可选
  - Swagger 描述是否准确？`@ApiPropertyOptional` 是否正确使用？
  - 是否向后兼容？（旧客户端传 parentId 仍然正常）

- [ ] **Service 变更 (skill-categories.service.ts):**
  - `create()`: 当 `parentId` 为空时 `level = 1` 逻辑是否正确？
  - `create()`: 当 `parentId` 存在时 level 计算 (`parent.level + 1`) 是否正确？
  - `create()`: `parentId || null` 是否安全？（空字符串会通过 `@IsUUID()` 验证吗？）
  - `create()`: `isSystemDefined: false, isEditable: true` 硬编码是否合理？
  - `update()`: system-defined 检查逻辑 — 只禁止 `level === 1` 的系统类别编辑，`level 2` 的系统类别允许编辑？这是否符合预期？
  - `remove()`: 删除保护是否完整（children + skills + isSystemDefined）？

- [ ] **Backend Tests (skill-categories.service.spec.ts):**
  - 是否覆盖了 L1 创建（无 parentId）？
  - 是否覆盖了 L2/L3 创建（有 parentId）？
  - 是否覆盖了 max level (3) 限制？
  - 是否覆盖了 parent 不存在的 404？
  - 是否有边界用例遗漏？

### 3. Frontend 组件审查

#### AdminPageShell.tsx
- [ ] 是否所有状态互斥？ `isLoading` + `isError` 同时为 true 时行为是否正确？（优先展示 loading）
- [ ] `error?.message` fallback `'Something went wrong'` 是否足够？
- [ ] `actions` slot 在 loading/error/empty 状态下是否应该隐藏？（当前实现：loading/error 时不传 actions）
- [ ] 是否需要 `aria-live` 属性通知屏幕阅读器状态变化？

#### ConfirmDialog.tsx
- [ ] `onOpenChange` 是否正确处理 ESC 键和点击 overlay 关闭？
- [ ] `loading` 状态时是否阻止关闭？（当前：按钮禁用，但 overlay 点击仍可关闭）
- [ ] "Processing..." 文字是否需要 i18n？

#### CategoryTree.tsx (417 lines — 最复杂的组件)
- [ ] **DnD 实现：**
  - 是否只允许同级拖拽重排？（检查 `SortableContext` 是否按 parent 分组）
  - `handleDragEnd` 中 `arrayMove` 后逐个调用 `onReorder` 是否高效？（N 个 PATCH 请求）
  - 是否有拖拽时的视觉反馈？（`isDragging` → `opacity: 0.5`，是否有蓝色插入线？）
  - `PointerSensor` 的 `activationConstraint: { distance: 5 }` 是否足够防止误触？
- [ ] **递归渲染：**
  - 子节点的 DnD context 是否独立？（每层一个 `DndContext`，检查嵌套是否冲突）
  - `SortableTreeNode` vs `CategoryTreeNode` 两种渲染路径的逻辑一致性？
  - 深层嵌套时的缩进 `ml-6` + `style.marginLeft` 是否有双重缩进 bug？
- [ ] **Expand/Collapse：**
  - 初始状态：只展开顶级节点 — 但 `useState` 初始化只读取一次 `categories`，如果数据更新后新 category 不会自动展开？
  - `toggleExpand` 是否需要 `useCallback` 依赖 `expanded`？（当前无依赖，使用 `prev` 函数式更新，正确）
- [ ] **操作按钮：**
  - `group-hover:flex` 在触摸设备上是否可用？
  - Add Child 按钮只在 `level < 3` 时显示 — 是否正确？
  - Delete 按钮 `disabled={category.isSystemDefined}` — tooltip 通过 `title` 属性实现，是否足够？
- [ ] **Accessibility：**
  - `role="tree"` / `role="treeitem"` / `role="group"` ARIA 树形结构是否正确？
  - `aria-selected` / `aria-expanded` 使用是否正确？
  - 键盘导航是否支持？（Enter/Space 展开，Arrow 键导航？）

#### CategoryFormDialog.tsx
- [ ] **表单重置：**
  - `useEffect` 依赖 `[open, mode, category, parentId]` — 每次 dialog 打开时重置表单 OK
  - 但 `parentId` 变化但 dialog 未关闭时会触发额外重置？（实际使用中可能无此场景）
- [ ] **Parent 选择器：**
  - `__none__` 作为 "No parent" 的 value — `handleSubmit` 时 `selectedParentId` 可能为 `"__none__"` 而非 `""`？
  - 检查 `...(selectedParentId && { parentId: selectedParentId })` — 如果 `selectedParentId === '__none__'`，会把 `'__none__'` 作为 parentId 发给后端？这是一个 **潜在 bug**。
  - 编辑模式下隐藏 parent selector — 不允许 reparent？这是否符合 Story AC？
- [ ] **验证：**
  - 只验证 name required + max 100 — 是否需要 trim 后再验证长度？
  - 重复名称验证是否需要前端处理？（后端是否有 unique constraint？Prisma schema 无 `@unique` on name）

#### SkillCategoryManagementPage.tsx
- [ ] **Delete 流程：**
  - `handleDeleteRequest` 前端检查 skills/children 数量来决定显示 block message — 但这依赖于 tree 查询包含 skills 数据。如果 `includeSkills=true` 没传或后端没返回 `_count`，前端判断会失效？
  - Block message 模式：使用 ConfirmDialog 但 confirm 按钮变成 "OK"（只关闭 dialog） — 这种复用 ConfirmDialog 显示只读消息的方式是否是最佳实践？
- [ ] **Reorder 实现：**
  - `handleReorder` 每次只 PATCH 一个 item — 如果同级有 5 个节点拖拽，可能触发 4 个 PATCH 请求？
  - 是否需要 batch reorder API？或者使用 debounce？
  - 失败时是否需要 rollback UI？（当前依赖 React Query 自动 refetch）
- [ ] **状态管理：**
  - 6 个 `useState` — 是否应该使用 `useReducer` 简化？
  - `formMode` + `editingCategory` + `preSelectedParentId` 存在隐式关联 — 是否需要封装？

### 4. 测试覆盖度审查

- [ ] **Frontend Tests (1,132 lines across 6 files):**
  - AdminPageShell: 4 态全覆盖 ✓
  - ConfirmDialog: confirm/cancel/danger/loading ✓
  - CategoryTree: 渲染/操作 — 但 **DnD 交互测试是否足够**？
  - CategoryFormDialog: 创建/编辑/验证 — 但 **parent selector `__none__` 边界是否测试**？
  - useSkillCategories: 5 hooks — 但 **mutation error 场景是否测试**？
  - SkillCategoryManagementPage: 集成测试 — 但 **delete block flow 是否测试**？

- [ ] **Backend Tests (150 lines):**
  - 是否覆盖了 `create()` 完整路径？
  - `update()` 和 `remove()` 测试在哪里？（pre-existing test file 还是本次遗漏？）

### 5. 安全性审查

- [ ] **权限控制：**
  - 路由 `ProtectedRoute requiredRoles=['ADMIN']` ✓
  - 后端 `POST/PATCH/DELETE` 有 `@Roles(UserRole.ADMIN, UserRole.ISSUER)` — ISSUER 也能创建/编辑类别，是否符合 AC？（AC 说 "Admin"，但后端允许 ISSUER）
  - `DELETE` 路由只允许 `ADMIN` — 与 POST/PATCH 不一致但这可能是有意设计

- [ ] **输入验证：**
  - 前端 `maxLength={100}` + 后端 `@MaxLength(100)` 双重验证 ✓
  - 后端 `@SanitizeHtml()` 防 XSS ✓
  - 前端 `name.trim()` 是否在所有入口执行？

- [ ] **System-defined 保护：**
  - 前端：delete 按钮 disabled ✓
  - 后端：delete → 403 `ForbiddenException` ✓
  - 后端：update → 只禁止 `isSystemDefined && level === 1` — L2 系统类别可编辑是否安全？

### 6. 性能考量

- [ ] **Bundle size：** @dnd-kit 三个包引入的 bundle 大小影响？（通常 ~30KB gzipped）
- [ ] **Tree 渲染：** 当前种子数据 ~25 节点。如果扩展到 ~200 节点，递归渲染 + 每级一个 DndContext 是否有性能问题？
- [ ] **API 调用：** `staleTime: 5min` 是否合适？Admin 管理页面是否需要更短/更长？
- [ ] **Reorder N+1：** 拖拽重排序触发 N 个 PATCH 请求 — 是否需要 batch endpoint？

### 7. UX/UI 审查

- [ ] **Empty state：** "Create your first skill category" CTA 在两个位置出现（AdminPageShell.emptyAction + CategoryTree.onCreateRoot）— 是否重复？
- [ ] **Error handling：** API 错误消息直接显示给用户？是否需要映射为用户友好文案？
- [ ] **Loading states：** mutation 进行中时页面是否有适当反馈？（toast 在成功/失败时显示，但进行中呢？）
- [ ] **Responsive：** AC #10 提到 `<1024px` tree 折叠为 dropdown — 当前实现是否包含？
- [ ] **Drag handle:** 触摸设备上 `GripVertical` 图标是否够大？(`h-4 w-4` = 16px, touch target 建议 44px)

---

## Key Files for Review

| Priority | File | Lines | Focus |
|----------|------|-------|-------|
| 🔴 HIGH | `CategoryTree.tsx` | 417 | DnD 实现, 递归逻辑, 双重缩进问题 |
| 🔴 HIGH | `SkillCategoryManagementPage.tsx` | 194 | CRUD 流程编排, delete 逻辑 |
| 🔴 HIGH | `skill-categories.service.ts` | 176 | L1 创建逻辑, system-defined 保护 |
| 🟡 MED | `CategoryFormDialog.tsx` | 199 | `__none__` parent 选择器 bug |
| 🟡 MED | `useSkillCategories.ts` | 123 | mutation 缓存策略 |
| 🟡 MED | `skill-category.dto.ts` | 119 | parentId optional 向后兼容 |
| 🟢 LOW | `AdminPageShell.tsx` | 89 | 简单 wrapper, 低风险 |
| 🟢 LOW | `ConfirmDialog.tsx` | 56 | 简单 wrappeer, 低风险 |
| 🟢 LOW | `App.tsx` / `Navbar.tsx` / `MobileNav.tsx` | ~42 | Route + nav 新增 |

---

## Potential Issues Identified Pre-Review

### 🔴 P0 — CategoryFormDialog `__none__` parentId Bug
**File:** `CategoryFormDialog.tsx` — `handleSubmit()`
**Issue:** Select 组件 "No parent" 选项的 value 是 `"__none__"`。但 `handleSubmit` 中 `...(selectedParentId && { parentId: selectedParentId })` 会把 `"__none__"` 字符串作为 `parentId` 发送到后端。后端 `@IsUUID()` 校验会拒绝 `"__none__"` — 返回 400 错误。
**Expected:** 选择 "No parent" 时 `parentId` 应为 `undefined` 或不包含在请求体中。
**Fix:** 在 `handleSubmit` 中检查 `selectedParentId !== '__none__'`。

### 🟡 P1 — CategoryTree 双重缩进
**File:** `CategoryTree.tsx` — `CategoryTreeNodeInner`
**Issue:** 节点同时使用 `className="ml-6"` 和 `style={{ marginLeft: level * 1.5rem }}`。当 `level > 0` 时两者都生效，可能导致缩进过大。
**Fix:** 只使用其中一种缩进方式。

### 🟡 P1 — DnD 批量 PATCH
**File:** `CategoryTree.tsx` — `handleDragEnd()` / `handleChildDragEnd()`
**Issue:** 拖拽一个节点后，`arrayMove` 后遍历所有 siblings，对 `displayOrder` 改变的每个 item 都触发一次 `onReorder`（= 一次 PATCH 请求）。5 个同级节点拖拽可能触发 4 个并发 PATCH。
**Risk:** 网络竞争条件，局部失败导致顺序不一致。
**Suggestion:** 考虑 batch reorder endpoint 或乐观更新 + 单次请求。

### 🟢 P2 — Responsive Tree 未实现
**Story AC #10 注明** sidebar nav 是 Sprint 13，但 AC 旁注和 dev prompt 提到 `<1024px` 树折叠为 dropdown。当前实现未包含 responsive 折叠。如果这是 defer to later 则可接受，需确认。

---

## Review Execution Guide

1. **先读 Story 文件** — 确认 AC 理解
2. **从 HIGH 优先级开始** — CategoryTree.tsx → Page → Backend Service
3. **重点关注上述 P0 Bug** — `__none__` parentId 问题
4. **运行测试验证：**
   ```bash
   cd gcredit-project/frontend && npx vitest run
   cd gcredit-project/backend && npx jest --forceExit
   cd gcredit-project/frontend && npx tsc --noEmit
   cd gcredit-project/backend && npx tsc --noEmit
   ```
5. **手动 E2E 验证（如条件允许）：**
   - 以 Admin 登录 → 导航到 `/admin/skills/categories`
   - 创建 L1 类别（不选 parent）
   - 创建 L2/L3 子类别
   - 编辑类别名称
   - 尝试删除有 skills 的类别（应被阻止）
   - 拖拽同级重排序
   - 验证系统类别 lock icon 且不可删除
