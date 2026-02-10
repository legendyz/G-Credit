# Dev Prompt: Story 10.8 — UAT Bug Fixes

**Sprint:** 10  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 20h (expanded from 8h buffer — all bugs are MVP core)  
**Dependencies:** Story 10.7 UAT execution complete  
**Risk Level:** 🔴 HIGH (4 P0 blockers + 3 P1 bugs, includes new pages)

---

## 目标

修复 UAT 发现的全部 7 个 Bug，使 re-UAT 通过率达到 90%+。

**关键约束（必读）：**
- ⚠️ **UI/UX 教训 (Lesson #1):** 本项目最大教训是 UI 设计未被 tracking 导致大量返工。所有新页面必须严格遵循设计系统（`@theme` tokens in `index.css`），与现有页面风格保持一致。
- ⚠️ **UX Designer Review:** 新页面完成后需 UX Designer review 截图。Dev 产出必须达到 review-ready 质量。
- ⚠️ **Tailwind v4:** 使用 `@theme` CSS 变量（如 `bg-brand-600`, `text-neutral-700`），不要用旧版 `tailwind.config.js` 方式（ADR-009）。

---

## 修复计划

按优先级和依赖关系排列。**建议严格按此顺序执行。**

---

### Step 1: BUG-002 — Nav "My Wallet" 链接修正 (P0, ~0.5h)

**影响:** 9 个 UAT test cases 失败的根因

**问题:** Navbar 和 MobileNav 的 "My Wallet" 链接指向 `/`（Dashboard），而非 `/wallet`（实际钱包页）。用户点击 "My Wallet" 永远停在 Dashboard 页。

**修复文件:**

#### 1.1 `frontend/src/components/Navbar.tsx`

当前代码 (~L48-56):
```tsx
<Link
  to="/"
  className={`px-4 py-3 ...`}
  aria-current={isActive('/') ? 'page' : undefined}
>
  My Wallet
</Link>
```

改为:
```tsx
<Link
  to="/wallet"
  className={`px-4 py-3 ... ${isActive('/wallet') ? 'text-brand-600 bg-brand-50' : 'text-neutral-700 hover:text-brand-600'}`}
  aria-current={isActive('/wallet') ? 'page' : undefined}
>
  My Wallet
</Link>
```

同时，在 "My Wallet" 链接**之前**添加一个 "Dashboard" 链接指向 `/`：
```tsx
<Link
  to="/"
  className={`px-4 py-3 ... ${isActive('/') ? 'text-brand-600 bg-brand-50' : 'text-neutral-700 hover:text-brand-600'}`}
  aria-current={isActive('/') ? 'page' : undefined}
>
  Dashboard
</Link>
```

#### 1.2 `frontend/src/components/layout/MobileNav.tsx`

当前 navLinks 数组 (~L103-108):
```tsx
const navLinks = [
  { to: '/', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  ...
];
```

改为:
```tsx
const navLinks = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  { to: '/wallet', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  ...
];
```

**验证:** 
- 点击 "My Wallet" → 导航到 `/wallet`（TimelineView）
- 点击 "Dashboard" → 导航到 `/`（DashboardPage）
- 各页面 nav 高亮正确

**回归测试:** 更新所有引用导航链接的现有 test（Navbar.spec, MobileNav.spec 等）。

---

### Step 2: BUG-005 — BadgeSearchBar 搜索框不接受输入 (P0, ~1h)

**影响:** 2 个 UAT test cases (UAT-011, UAT-032)

**问题:** Badge Management 页面搜索框弹出后不接受键盘输入。

**根因:** `SearchInput.tsx` 在受控模式（`controlledValue` !== undefined）下存在双重 debounce 冲突：
1. 输入 `value` 读 `controlledValue`（父组件 state）
2. `handleChange` 调用 `onChange(newValue)` 更新父 state
3. 但同时内部 `useDebounce` 也触发 `onChange`，造成状态竞争

**修复文件:** `frontend/src/components/search/SearchInput.tsx`

**修复方案:** 在受控模式下，输入框的 `value` 应使用 `internalValue`（本地状态）而非 `controlledValue`，确保用户按键立即反映在输入框中。debounce 效果仅用于触发搜索回调，不影响显示。

当前 (约L87):
```tsx
const value = controlledValue !== undefined ? controlledValue : internalValue;
```

改为:
```tsx
// Always use internalValue for display to ensure immediate keystroke feedback
const value = internalValue;
```

同时确保 `handleChange` 中：
- 受控模式下：`setInternalValue(newValue)` + 不要立即调 `onChange`（让 debounce 触发）
- 非受控模式下：保持原有逻辑

**验证:**
- Badge Management 页面：搜索框能正常输入字符
- 输入后搜索结果正确过滤
- Wallet 页面 TimelineView 搜索同样正常

**回归测试:** 为 SearchInput 添加受控模式输入测试。

---

### Step 3: BUG-004 — Issue Badge Recipient 下拉列表未加载 (P0, ~1.5h)

**影响:** 4 个 UAT test cases (UAT-012 ~ UAT-015)

**问题:** Issuer 角色访问 `/admin/badges/issue` 时，recipient 下拉列表为空。

**根因:** `IssueBadgePage.tsx` 调用 `getAdminUsers()` → `GET /api/admin/users`。但 `AdminUsersController` 限制 `@Roles(UserRole.ADMIN)` 仅允许 Admin。Issuer 收到 403，下拉列表静默失败。

**修复方案（推荐：新建轻量 endpoint）:**

#### 3.1 Backend: 新增 recipient list endpoint

在 `badge-issuance.controller.ts` 中添加：
```typescript
@Get('recipients')
@Roles(UserRole.ADMIN, UserRole.ISSUER)
@ApiOperation({ summary: 'Get list of users available as badge recipients' })
async getRecipients() {
  // 返回所有 active 用户的 id, firstName, lastName, email, department
  return this.prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true, department: true },
    orderBy: { lastName: 'asc' },
  });
}
```

路由应为 `GET /api/badges/recipients`（和现有 badge controller 前缀一致）。

#### 3.2 Frontend: 更新 IssueBadgePage.tsx

将 `getAdminUsers()` 调用替换为新的 `fetch` 或 API 函数：
```typescript
const response = await fetch(`${API_BASE_URL}/badges/recipients`, {
  headers: { Authorization: `Bearer ${token}` },
});
const users = await response.json();
setUsers(users);
```

#### 3.3 导航入口

确保 Issuer 的 Quick Action "Issue New Badge" 和 Nav 中有导航链接指向 `/admin/badges/issue`。如果当前缺失，在 `IssuerDashboard` 的 Quick Actions 中添加。

**验证:**
- Admin 登录 → Issue Badge → recipient dropdown 加载用户列表 ✅
- Issuer 登录 → Issue Badge → recipient dropdown 加载用户列表 ✅
- Employee/Manager 无法访问 Issue Badge ✅

**回归测试:** IssueBadgePage spec 添加 Issuer 角色 recipient 加载测试。

---

### Step 4: BUG-003 — Badge Template Management UI (P0, ~10h)

**影响:** 5 个 UAT test cases (UAT-008 ~ UAT-011, UAT-034)

**问题:** 前端完全没有 Badge Template 的增删改查页面。后端 API 完整存在（`/api/badge-templates` CRUD），但前端从未构建。

**⚠️ 这是本 Story 最大的工作项。请严格遵循设计系统。**

**需要创建的文件:**

#### 4.1 API 层: `frontend/src/lib/badgeTemplatesApi.ts`

创建 Template API 调用封装：
```typescript
// GET /api/badge-templates/all   — Admin/Issuer 获取全部（含 DRAFT/ARCHIVED）
// GET /api/badge-templates/:id   — 获取单个
// POST /api/badge-templates      — 创建（multipart/form-data，含图片）
// PATCH /api/badge-templates/:id — 更新（含状态变更）
// DELETE /api/badge-templates/:id — 删除
```

参考现有 `badgesApi.ts` 的 fetch + auth header 模式。

**后端 API 规格:**
- **Create:** `POST /api/badge-templates` — multipart/form-data
  - Required: `name`, `category` (achievement/skill/certification/participation), `skillIds` (string[]), `issuanceCriteria` (object)
  - Optional: `description`, `validityPeriod` (days, number), `image` (binary, max 5MB, JPG/PNG/GIF/WebP)
  - Auth: JWT, Roles: ADMIN, ISSUER
- **Update:** `PATCH /api/badge-templates/:id`
  - All fields optional, plus `status` (DRAFT/ACTIVE/ARCHIVED)
  - Auth: JWT, Roles: ADMIN, ISSUER (ISSUER: own templates only)
- **List All:** `GET /api/badge-templates/all`
  - Auth: JWT, Roles: ADMIN, ISSUER
  - Returns: all templates (DRAFT + ACTIVE + ARCHIVED)
- **Delete:** `DELETE /api/badge-templates/:id`
  - Auth: JWT, Roles: ADMIN, ISSUER (ISSUER: own only)

#### 4.2 列表页: `frontend/src/pages/admin/BadgeTemplateListPage.tsx`

**参考:** `BadgeManagementPage.tsx` 的布局模式。

**功能:**
- 使用 `PageTemplate` 组件包裹
- 顶部工具栏：搜索 + "Create Template" 按钮 (使用 `Button` + `Plus` icon)
- 状态筛选 Tab/Pills: All / DRAFT / ACTIVE / ARCHIVED
- Template 卡片列表 (使用 `Card` 组件)，每张卡片显示：
  - 模板图片缩略图（如有）
  - 模板名称
  - Category badge
  - Status badge (DRAFT=amber, ACTIVE=green, ARCHIVED=grey)
  - Created date
  - 操作按钮：View/Edit, 状态变更 (Activate/Archive), Delete
- 使用 `@tanstack/react-query` 获取数据 (queryKey: `['badge-templates-all']`)
- 空状态提示 + 加载骨架屏 (使用 `Skeleton` 组件)
- 分页（如果模板数量多）

**设计规范:**
- 卡片圆角: `rounded-lg` (lg = 12px per design tokens)
- 品牌色: `text-brand-600`, `bg-brand-50`
- Status badges: 使用现有 `StatusBadge` 组件或统一的颜色方案
- 间距: 使用 Tailwind `gap-4`, `p-4`, `space-y-4` 规律
- 交互: hover 时 `shadow-elevation-2` 效果
- Touch targets: 所有按钮最小 44×44px

#### 4.3 创建/编辑表单页: `frontend/src/pages/admin/BadgeTemplateFormPage.tsx`

**参考:** `IssueBadgePage.tsx` 的表单模式。

**功能:**
- 双模式：URL 有 `:id` 参数 → 编辑模式，无参数 → 创建模式
- 表单字段：
  - Name (Input, required)
  - Description (Textarea)
  - Category (Select: achievement/skill/certification/participation, required)
  - Skills/Tags (多选或自由输入)
  - Issuance Criteria (JSON editor 或 结构化表单)
  - Validity Period (Input number, days, optional)
  - Image Upload (文件选择器, max 5MB, 预览)
  - Status (Select: DRAFT/ACTIVE/ARCHIVED, 仅编辑模式可选)
- 提交 → `toast.success()` → navigate 回列表
- 错误处理 → `toast.error()` + 表单内 inline error
- 取消 → navigate 回列表
- **multipart/form-data** 提交（因为包含图片上传）

**设计规范:**
- 使用 shadcn 的 `Card`, `Input`, `Label`, `Select`, `Textarea`, `Button`
- 表单分组使用 `CardHeader` / `CardContent` 区块
- Save 按钮: `bg-brand-600 hover:bg-brand-700 text-white`
- Cancel 按钮: `variant="outline"`

#### 4.4 Route 注册: `frontend/src/App.tsx`

添加两条路由（放在现有 admin routes 附近）：
```tsx
<Route path="/admin/templates" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
    <Layout pageTitle="Badge Templates"><BadgeTemplateListPage /></Layout>
  </ProtectedRoute>
} />
<Route path="/admin/templates/new" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
    <Layout pageTitle="Create Template"><BadgeTemplateFormPage /></Layout>
  </ProtectedRoute>
} />
<Route path="/admin/templates/:id/edit" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
    <Layout pageTitle="Edit Template"><BadgeTemplateFormPage /></Layout>
  </ProtectedRoute>
} />
```

#### 4.5 导航更新

**Navbar.tsx:** 在 Admin/Issuer 链接组中添加 "Badge Templates" → `/admin/templates`
**MobileNav.tsx:** 在 navLinks 中添加 `{ to: '/admin/templates', label: 'Badge Templates', roles: ['ADMIN', 'ISSUER'] }`
**AdminDashboard.tsx:** Quick Action "Badge Templates" → `navigate('/admin/templates')`（当前错误指向 `/admin/badges`）

**验证:**
- Admin 创建 DRAFT 模板 → 列表显示 ✅
- Admin 将 DRAFT 改为 ACTIVE → 状态更新 ✅
- Admin 将 ACTIVE 改为 ARCHIVED → 状态更新 ✅
- 搜索模板按名称/category 过滤 ✅
- Issuer 只能编辑/删除自己创建的模板 ✅

**回归测试:** 
- `BadgeTemplateListPage.spec.tsx` — 列表/筛选/空状态
- `BadgeTemplateFormPage.spec.tsx` — 创建/编辑/验证/提交
- 路由保护测试

---

### Step 5: BUG-008 — Prisma P2028 事务超时 (P1, ~1h)

**影响:** UAT-026 (间歇性)

**问题:** 批量颁发首次执行 → `PrismaClientKnownRequestError P2028: Unable to start a transaction in the given time.`

**根因:** `bulk-issuance.service.ts` 的 `$transaction` 设置 `timeout: 10000` (10秒)，所有 CSV 行的验证在事务内逐行 `await`，冷连接池 + 行数多时易超时。

**修复文件:** `backend/src/bulk-issuance/bulk-issuance.service.ts`

**方案 (推荐):** 增加 `timeout` 和 `maxWait`：

当前 (~L338):
```typescript
{
  isolationLevel: 'ReadCommitted',
  timeout: 10000,
}
```

改为:
```typescript
{
  isolationLevel: 'ReadCommitted',
  timeout: 30000,    // 30 seconds — adequate for ≤500 rows
  maxWait: 10000,    // 10 seconds max wait for connection
}
```

**验证:**
- 批量颁发 20 行 CSV → 首次执行成功 ✅
- 无 P2028 错误 ✅

**回归测试:** BulkIssuanceService spec 验证事务成功。

---

### Step 6: BUG-006 — Manager 撤销权限 (P1, ~2h)

**影响:** 3 个 UAT test cases (UAT-028 ~ UAT-030)

**设计决策（PO 已确认）：** 
- Manager 可以撤销**同部门**员工的 Badge（不论谁颁发）
- Manager **不能**撤销其他部门的 Badge
- Issuer-based revocation（颁发者跨部门撤销自己发的 badge）→ Post-MVP FEAT-004

#### 6.1 Backend: `badge-issuance.controller.ts`

revoke endpoint 添加 MANAGER 角色：

```typescript
@Post(':id/revoke')
@Roles(UserRole.ADMIN, UserRole.ISSUER, UserRole.MANAGER)
```

#### 6.2 Backend: `badge-issuance.service.ts`

在 revoke 方法中添加 Manager 权限校验逻辑：

```typescript
// If revoker is MANAGER, verify same department
if (revoker.role === UserRole.MANAGER) {
  const recipient = await this.prisma.user.findUnique({ where: { id: badge.recipientId } });
  if (recipient.department !== revoker.department) {
    throw new ForbiddenException('Managers can only revoke badges within their department');
  }
}
```

#### 6.3 Frontend: 给 Manager 展示 Badge Management（有限视图）

**App.tsx:** `/admin/badges` 路由的 `requiredRoles` 添加 `'MANAGER'`
**Navbar.tsx + MobileNav.tsx:** 添加 `'MANAGER'` 到 Badge Management 链接的角色数组

**注意:** Manager 在 Badge Management 页面只看到自己部门的 badge。在 `BadgeManagementPage.tsx` 中根据 `userRole === 'MANAGER'` 添加部门过滤：
```typescript
// For MANAGER, filter badges by department
if (userRole === 'MANAGER') {
  // Filter client-side or add department query param to API
  filteredBadges = badges.filter(b => b.recipientDepartment === currentUser.department);
}
```

同时确保 Manager 视图中**隐藏** Issue 和 Bulk Issuance 相关入口。只显示 View/Revoke 操作。

**验证:**
- Manager 登录 → 看到 Badge Management 导航 ✅
- Manager 在 Badge Management 仅看到同部门 badge ✅
- Manager 点击 Revoke → 成功撤销同部门 badge ✅
- Manager 无法撤销其他部门 badge → 403 ✅
- Manager 看不到 Issue 按钮 ✅

**回归测试:**
- BadgeIssuanceController spec: MANAGER revoke 同部门 pass / 跨部门 403
- BadgeManagementPage spec: MANAGER 视图筛选

---

### Step 7: BUG-007 — Profile / 密码修改页面 (P1, ~4h)

**影响:** UAT-006

**问题:** 前端无 Profile 页面。后端已有完整 API：
- `GET /api/auth/profile` — 获取个人信息
- `PATCH /api/auth/profile` — 更新 firstName/lastName
- `POST /api/auth/change-password` — 修改密码 (需 currentPassword + newPassword, min 8 chars, 需含大小写+数字)

#### 7.1 创建 `frontend/src/pages/ProfilePage.tsx`

**分为两个 Card 区块：**

**Card 1: Profile Information**
- 显示 Email（只读）、Role（只读）、Department（只读）
- 可编辑：First Name、Last Name
- Save 按钮 → `PATCH /api/auth/profile`
- 成功 toast: "Profile updated successfully"

**Card 2: Change Password**
- Current Password (Input type="password")
- New Password (Input type="password") — 提示：至少 8 位，含大小写和数字
- Confirm New Password (Input type="password") — 前端验证两次输入一致
- Change Password 按钮 → `POST /api/auth/change-password`
- 成功 toast: "Password changed successfully"
- 错误处理：当前密码错误 → inline error

**设计规范:**
- 使用 `PageTemplate` 包裹
- 两个 Card 垂直堆叠，`space-y-6`
- 表单字段使用 `Input` + `Label` 组合
- Save 按钮: `bg-brand-600`, Change Password 按钮: `bg-brand-600`
- 只读字段用 `Input` + `disabled` 或纯文本显示

#### 7.2 Route: `frontend/src/App.tsx`

```tsx
<Route path="/profile" element={
  <ProtectedRoute>
    <Layout pageTitle="My Profile"><ProfilePage /></Layout>
  </ProtectedRoute>
} />
```

#### 7.3 导航入口

**Navbar.tsx:** 在 Sign Out 按钮前添加 Profile 链接（Settings icon / User icon）
```tsx
<Link to="/profile" className="... min-w-[44px] min-h-[44px] ..." aria-label="Profile">
  <Settings className="w-5 h-5" />
</Link>
```

**MobileNav.tsx:** 在 navLinks 或 drawer 底部添加 Profile 入口

**验证:**
- 点击 Profile 图标 → 进入 `/profile` ✅
- 显示当前用户信息 ✅
- 修改 First/Last Name → 保存成功 ✅
- 修改密码（正确旧密码）→ 成功 ✅
- 修改密码（错误旧密码）→ 显示错误 ✅
- 重新登录验证新密码生效 ✅
- **测试完成后重置密码回 `password123`**

**回归测试:** `ProfilePage.spec.tsx` — 渲染/加载/保存/密码修改/错误处理

---

## 完成后的检查清单

### Code Quality
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 errors, 0 warnings (backend + frontend)
- [ ] 所有新文件无 `console.log`（使用 Logger 或 toast）
- [ ] 所有新文件无 TODO/FIXME
- [ ] 所有新文件无硬编码 `localhost:3000`

### Testing
- [ ] 所有现有测试通过（534+ backend）
- [ ] 前端新增测试通过（Vitest）
- [ ] 每个 Bug 至少 1 个回归测试

### Design System Compliance ← **重点检查**
- [ ] 所有新页面使用 `@theme` token 颜色（brand-*, neutral-*, success-*, error-*）
- [ ] 字体使用 Inter（`font-sans`）
- [ ] 所有交互元素 min 44×44px touch target
- [ ] Card 使用 `rounded-lg` + `shadow-elevation-1`
- [ ] Button: primary = `bg-brand-600`, outline = `variant="outline"`
- [ ] 空状态有友好提示
- [ ] 加载状态使用 `Skeleton` 组件
- [ ] 响应式: 至少 Desktop (1440px) + Tablet (768px) 正常

### UX Designer Review Preparation
- [ ] 每个新页面提供截图（Desktop 视图）
- [ ] Badge Template List 页面截图（空状态 + 有数据状态）
- [ ] Badge Template Form 页面截图（创建 + 编辑模式）
- [ ] Profile 页面截图
- [ ] Manager Badge Management 视图截图（仅 revoke 操作）

---

## Story Doc 更新

完成后更新 `10-8-uat-bug-fixes.md`:
- `status: backlog` → `status: complete`
- 逐个勾选 AC
- 填写 Dev Agent Record（model, completion notes, file list）
- 标记每个 BUG 的修复 commit

---

## 参考资源

| 资源 | 路径 |
|------|------|
| UAT Results | `docs/sprints/sprint-10/uat-results.md` |
| UAT Test Plan | `docs/sprints/sprint-10/uat-test-plan.md` |
| Design Tokens | `frontend/src/index.css` (@theme blocks) |
| 现有 Admin 页面参考 | `frontend/src/pages/admin/BadgeManagementPage.tsx` |
| 现有表单参考 | `frontend/src/pages/IssueBadgePage.tsx` |
| Badge Templates API | `backend/src/badge-templates/badge-templates.controller.ts` |
| Auth Profile API | `backend/src/modules/auth/auth.controller.ts` |
| Shadcn 组件 | `frontend/src/components/ui/` (button, card, dialog, input, label, select, skeleton, textarea) |
| PageTemplate | `frontend/src/components/layout/PageTemplate.tsx` |
| API Base URL | `frontend/src/lib/apiConfig.ts` → `API_BASE_URL` |
