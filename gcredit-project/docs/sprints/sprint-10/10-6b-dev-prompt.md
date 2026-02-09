# Dev Prompt: Story 10.6b — Single Badge Issuance UI

**Sprint:** 10  
**Branch:** `sprint-10/v1-release`  
**Estimate:** 6h  
**Dependencies:** Phase 1-2, Story 10.6d (design system) complete

---

## 目标

为 Issuer/Admin 创建一个表单页面 `/admin/badges/issue`，用于通过 UI 发放单个徽章。后端 API (`POST /api/badges`) 已在 Sprint 3 完成，本 Story 仅涉及前端。

> **注意：** IssuerDashboard.tsx 的 "Issue New Badge" 按钮已经指向 `/admin/badges/issue`，目前该路由不存在，会命中 404。本 Story 就是补上这个缺失的页面。

---

## Step 1: API Service Function (0.5h)

### 1.1 在 `frontend/src/lib/badgesApi.ts` 末尾添加 `issueBadge()`

在文件现有的 `badgesApi` 对象和 `export default` 之前添加：

```typescript
// --- Single Badge Issuance (Story 10.6b) ---

export interface IssueBadgeRequest {
  templateId: string;
  recipientId: string;
  evidenceUrl?: string;
  expiresIn?: number;
}

export async function issueBadge(dto: IssueBadgeRequest): Promise<Badge> {
  const response = await fetch(`${API_BASE_URL}/badges`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(dto),
  });
  return handleResponse<Badge>(response);
}
```

然后将 `issueBadge` 加入 `badgesApi` 对象：

```typescript
export const badgesApi = { getAllBadges, getIssuedBadges, revokeBadge, getBadgeById, issueBadge };
```

### 1.2 后端 API 参考

```
POST /api/badges
Auth: JWT Bearer + ADMIN/ISSUER role
Body: {
  templateId: string   (UUID, required)
  recipientId: string  (UUID, required)
  evidenceUrl?: string (URL format, optional)
  expiresIn?: number   (1-3650 days, optional)
}
Response 201: Badge object (same shape as Badge interface)
Errors: 400 (validation), 403 (RBAC), 404 (template/recipient not found)
```

---

## Step 2: IssueBadgePage Component (3-4h)

### 2.1 创建 `frontend/src/pages/IssueBadgePage.tsx`

**架构要求：**
- 使用 `PageTemplate` 包裹（同 BulkIssuancePage pattern）
- 使用 shadcn/ui 组件：`Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Select`, `Input`, `Label`
- 使用 design tokens（`bg-brand-600`, `text-neutral-900`, `shadow-elevation-1`），**不要**使用 `blue-600`、`gray-700` 等硬编码色
- 表单字段使用 `useState` 管理
- Toast 使用 `sonner`：`toast.success()`, `toast.error()`
- 导航使用 `react-router-dom`：`useNavigate()`
- 无 `console.log`，无 `window.alert`

**页面布局参考：**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { issueBadge } from '@/lib/badgesApi';
import { API_BASE_URL } from '@/lib/apiConfig';
import { Award, Send, Loader2 } from 'lucide-react';

// ... component implementation
export function IssueBadgePage() { ... }
export default IssueBadgePage;
```

### 2.2 表单字段

| 字段 | 类型 | 必填 | 验证规则 | UI 组件 |
|------|------|------|----------|---------|
| Template | Selector | ✅ | UUID, must select one | `<Select>` with templates from API |
| Recipient | Selector | ✅ | UUID, must select one | `<Select>` with user search from API |
| Evidence URL | Text input | ❌ | URL format (if provided) | `<Input type="url">` |
| Expiry Days | Number input | ❌ | Integer 1-3650 (if provided) | `<Input type="number" min={1} max={3650}>` |

### 2.3 Template Selector 加载

从 API 获取 ACTIVE/APPROVED 模板列表：

```typescript
// Fetch templates on mount
useEffect(() => {
  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/badge-templates?status=APPROVED`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      // Handle both array and paginated response formats
      const list = Array.isArray(data) ? data : data.data || data.items || [];
      setTemplates(list);
    } catch {
      toast.error('Failed to load badge templates');
    }
  };
  fetchTemplates();
}, []);
```

**Template interface:**
```typescript
interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
}
```

### 2.4 Recipient Selector 加载

使用现有 `adminUsersApi.ts` 获取用户列表：

```typescript
import { getAdminUsers, type AdminUser } from '@/lib/adminUsersApi';

// Fetch users on mount (or with search debounce)
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await getAdminUsers({ limit: 100, statusFilter: true });
      setUsers(response.users);
    } catch {
      toast.error('Failed to load users');
    }
  };
  fetchUsers();
}, []);
```

`<Select>` 显示格式：`{firstName} {lastName} ({email})`

### 2.5 表单提交

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!selectedTemplateId) {
    toast.error('Please select a badge template');
    return;
  }
  if (!selectedRecipientId) {
    toast.error('Please select a recipient');
    return;
  }
  if (evidenceUrl && !isValidUrl(evidenceUrl)) {
    toast.error('Please enter a valid URL for evidence');
    return;
  }
  if (expiresIn !== '' && (Number(expiresIn) < 1 || Number(expiresIn) > 3650)) {
    toast.error('Expiry must be between 1 and 3650 days');
    return;
  }

  setIsSubmitting(true);
  try {
    await issueBadge({
      templateId: selectedTemplateId,
      recipientId: selectedRecipientId,
      ...(evidenceUrl ? { evidenceUrl } : {}),
      ...(expiresIn !== '' ? { expiresIn: Number(expiresIn) } : {}),
    });
    toast.success('Badge issued successfully!');
    navigate('/admin/badges');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to issue badge');
  } finally {
    setIsSubmitting(false);
  }
};
```

URL 验证 helper：
```typescript
function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}
```

### 2.6 UI / 样式要求

- Card 使用 `shadow-elevation-1 border border-neutral-200`
- 标题使用 `text-h3 font-semibold text-neutral-900`
- Label 使用 `text-body font-medium text-neutral-700`
- Submit button: `bg-brand-600 hover:bg-brand-700 text-white min-h-[44px]`
- 所有 input focus ring: `focus:ring-brand-500`
- Loading state: button 显示 `<Loader2 className="animate-spin" />` + disabled
- 所有 form inputs：proper `<Label htmlFor>`, `aria-required`, `id` attributes

### 2.7 Accessibility 要求

- 所有 input 有 `<Label htmlFor="...">`
- Required fields: `aria-required="true"`
- Error messages: `aria-live="polite"` 或通过 Sonner toast
- Submit button: `min-h-[44px]` touch target
- Form 元素使用 `<form onSubmit={handleSubmit}>`

---

## Step 3: Route Registration (0.25h)

### 3.1 修改 `frontend/src/App.tsx`

**添加 lazy import（放在其他 lazy import 附近）：**

```typescript
const IssueBadgePage = lazy(() =>
  import('@/pages/IssueBadgePage').then((m) => ({ default: m.IssueBadgePage }))
);
```

**添加路由（放在 `/admin/badges` 路由之后）：**

```tsx
<Route
  path="/admin/badges/issue"
  element={
    <ProtectedRoute requiredRoles={['ADMIN', 'ISSUER']}>
      <Layout pageTitle="Issue Badge">
        <IssueBadgePage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

> ⚠️ **重要：** `/admin/badges/issue` 必须放在 `/admin/badges` 之后，因为 React Router v6 会自动选最长匹配，顺序无所谓，但放在一起更清晰。

---

## Step 4: Dashboard Navigation Fix (0.25h)

### 4.1 确认 IssuerDashboard.tsx

IssuerDashboard 的 "Issue New Badge" 按钮**已经**正确指向 `/admin/badges/issue`：

```tsx
<Button onClick={() => navigate('/admin/badges/issue')} ...>
  <PlusCircle className="h-4 w-4" />
  Issue New Badge
</Button>
```

**不需要修改。** 只需确认路由注册后此按钮可正常工作。

### 4.2 确认 AdminDashboard.tsx

AdminDashboard **没有** "Issue Badge" 按钮，无需修改。

### 4.3 可选：Badge Management 页面添加 "Issue Badge" 快捷按钮

在 `BadgeManagementPage` 中可以考虑添加一个 "Issue New Badge" 按钮（使用 `PageTemplate` 的 `actions` prop）：

```tsx
<PageTemplate
  title="Badge Management"
  description="Manage badge templates and issued badges"
  actions={
    <Button onClick={() => navigate('/admin/badges/issue')}
            className="bg-brand-600 hover:bg-brand-700 text-white min-h-[44px]">
      <PlusCircle className="h-4 w-4 mr-2" />
      Issue Badge
    </Button>
  }
>
```

> 这是可选增强，如果时间允许则添加。

---

## Step 5: Tests (2h)

### 5.1 创建 `frontend/src/pages/IssueBadgePage.test.tsx`

**最少 5 个测试用例：**

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { IssueBadgePage } from './IssueBadgePage';

// Mock dependencies
vi.mock('@/lib/badgesApi', () => ({
  issueBadge: vi.fn(),
}));
vi.mock('@/lib/adminUsersApi', () => ({
  getAdminUsers: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const renderPage = () =>
  render(
    <BrowserRouter>
      <IssueBadgePage />
    </BrowserRouter>
  );
```

**Required tests:**

| # | Test | What to assert |
|---|------|----------------|
| 1 | Form renders correctly | h1 contains "Issue Badge", template select exists, recipient select exists, submit button exists |
| 2 | Template dropdown loads from API | Mock fetch → verify templates appear in dropdown |
| 3 | Form validation — required fields | Click submit without selections → `toast.error` called |
| 4 | Successful submission | Fill form + submit → `issueBadge()` called with correct args → `toast.success` called |
| 5 | API error handling | Mock `issueBadge` to reject → `toast.error` called with error message |
| 6 | Loading state | During submission → submit button disabled + shows spinner |

### 5.2 验证回归

```bash
cd frontend
npx vitest run          # All 442+ tests pass
npx eslint --max-warnings=0 .  # 0 errors, 0 warnings
npx vite build          # Clean build
```

---

## 技术参考

### 现有文件结构

```
frontend/src/
├── lib/
│   ├── apiConfig.ts          # API_BASE_URL
│   ├── badgesApi.ts          # Badge CRUD + 新增 issueBadge()
│   └── adminUsersApi.ts      # getAdminUsers() for recipient list
├── pages/
│   ├── IssueBadgePage.tsx     # ← 新建
│   ├── IssueBadgePage.test.tsx # ← 新建
│   ├── BulkIssuancePage.tsx   # 参考：admin page layout pattern
│   └── dashboard/
│       ├── IssuerDashboard.tsx  # "Issue New Badge" → /admin/badges/issue (已正确)
│       └── AdminDashboard.tsx   # 无 issue 按钮
├── components/
│   ├── layout/
│   │   └── PageTemplate.tsx   # 页面 wrapper (title, description, actions, children)
│   └── ui/
│       ├── button.tsx, card.tsx, input.tsx, label.tsx, select.tsx  # shadcn/ui
│       └── ...
└── App.tsx                    # 路由注册
```

### Design Token 使用规范 (ADR-009)

**源头文档：** `docs/planning/ux-design-specification.md` (3,321 行) — 完整 UX 设计规范  
**技术实现：** `docs/decisions/ADR-009-tailwind-v4-css-first-config.md` — Tailwind v4 CSS-first 配置  
**Token 定义：** `frontend/src/index.css` `@theme {}` 块 — 所有品牌色、字体、阴影、圆角

**UX 规范核心要点（dev 必读）：**
- 字体：Inter, Segoe UI — 专业企业级风格（非卡通风）
- 配色：Microsoft Fluent 品牌色体系 — `brand-600: #0078D4` 为主色
- 间距：8px 基准（`xs:0.5rem`, `sm:1rem`, `md:1.5rem`, `lg:2rem`）
- 圆角：Cards/Badges 用 `rounded-lg` (12px)，Inputs 用 `rounded-md` (8px)
- 阴影层级：`elevation-1` (2px) 日常卡片 → `elevation-4` (16px) 模态框
- 交互反馈：hover 时 `shadow-lg` + 微上移，按钮 active 缩小
- 响应式：Desktop-first（`md:768px`, `lg:1024px`），mobile 为功能性回退
- 无障碍：WCAG 2.1 AA — 对比度 4.5:1+, 焦点环 2px, 触控目标 44px

**必须使用 design tokens，禁止使用硬编码 Tailwind 色：**

| ✅ 正确 | ❌ 错误 |
|---------|---------|
| `bg-brand-600` | `bg-blue-600` |
| `text-neutral-900` | `text-gray-900` |
| `text-neutral-600` | `text-gray-600` |
| `shadow-elevation-1` | `shadow-md` |
| `text-h2 font-semibold` | `text-2xl font-semibold` |
| `focus:ring-brand-500` | `focus:ring-blue-500` |
| `text-error` | `text-red-600` |
| `text-success` | `text-green-600` |

> Tailwind v4.1.18 — Token 定义在 `index.css` 的 `@theme {}` 中，不在 `tailwind.config.js` 中。

### Coding Standards Checklist

- [ ] No Chinese characters in source files
- [ ] No `console.log` — use Sonner toasts
- [ ] No `window.alert` — use Sonner toasts
- [ ] No `any` types — TypeScript strict
- [ ] All inputs have `<Label htmlFor>` + `aria-required`
- [ ] All interactive elements `min-h-[44px]`
- [ ] Component: PascalCase naming
- [ ] Files: kebab-case naming (exception: components use PascalCase)
- [ ] `export default` at bottom for lazy() compatibility
- [ ] ESLint: `--max-warnings=0` clean

### 预期交付文件清单

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/lib/badgesApi.ts` | Modify | Add `IssueBadgeRequest`, `issueBadge()` |
| `frontend/src/pages/IssueBadgePage.tsx` | Create | Single badge issuance form page |
| `frontend/src/pages/IssueBadgePage.test.tsx` | Create | Unit tests (6+ tests) |
| `frontend/src/App.tsx` | Modify | Add `/admin/badges/issue` route |

### 验收标准速查

1. ✅ `/admin/badges/issue` 路由存在且受 ADMIN/ISSUER 角色保护
2. ✅ 表单包含 4 个字段：Template, Recipient, Evidence URL, Expiry Days
3. ✅ Template selector 只显示 APPROVED 状态模板
4. ✅ Recipient selector 从 admin users API 加载
5. ✅ 表单验证与后端 DTO 一致
6. ✅ 成功：toast.success + redirect to `/admin/badges`
7. ✅ 失败：toast.error 显示服务端错误
8. ✅ IssuerDashboard "Issue New Badge" 按钮正常跳转
9. ✅ EMPLOYEE/MANAGER 无法访问页面
10. ✅ 6+ 单元测试覆盖
11. ✅ 442+ existing tests 无回归
12. ✅ ESLint 0 errors 0 warnings
13. ✅ Build clean
