# Story 10.6b Fix Prompt — Code Review Issues

**Story:** 10.6b Single Badge Issuance UI  
**Source:** `docs/sprints/sprint-10/10-6b-code-review.md`  
**Branch:** `sprint-10/v1-release`  
**Scope:** 2 issues, estimated 1h

---

## Fix 1: `status=APPROVED` → `status=ACTIVE` (5min)

### 问题

Prisma schema 定义的 `TemplateStatus` enum 为 `DRAFT | ACTIVE | ARCHIVED`，系统中**不存在 `APPROVED` 状态**。

当前代码传 `?status=APPROVED`，后端 `GET /badge-templates` 碰巧因为 `onlyActive=true` 覆盖了 `query.status`，所以功能正常。但参数语义错误，如果未来后端逻辑变化会导致返回 0 条结果。

### 修改文件

**文件 1：`frontend/src/pages/IssueBadgePage.tsx` 第 57 行**

```diff
- const response = await fetch(`${API_BASE_URL}/badge-templates?status=APPROVED`, {
+ const response = await fetch(`${API_BASE_URL}/badge-templates?status=ACTIVE`, {
```

**文件 2：`frontend/src/components/BulkIssuance/TemplateSelector.tsx` 第 47 行**

```diff
- const response = await fetch(`${API_BASE_URL}/badge-templates?status=APPROVED`, {
+ const response = await fetch(`${API_BASE_URL}/badge-templates?status=ACTIVE`, {
```

**文件 3：`frontend/src/pages/IssueBadgePage.test.tsx` 第 137 行**

```diff
- expect.stringContaining('/badge-templates?status=APPROVED'),
+ expect.stringContaining('/badge-templates?status=ACTIVE'),
```

---

## Fix 2: 修复 2 个绕过表单提交的测试 (45min)

### 问题

`IssueBadgePage.test.tsx` 中两个测试直接调用 mock 函数而非通过组件交互触发提交：

1. **"submits the form successfully and navigates"** (行 182-200) — 直接调用 `await mockIssueBadge({...})`，不验证 `toast.success` 和 `navigate`
2. **"handles API error on form submission"** (行 202-216) — 直接 try/catch `mockIssueBadge`，不验证 `toast.error`

这两个测试只在测试 mock 本身，完全没有覆盖组件的 `handleSubmit` 逻辑。

### 修复策略

Radix UI `<Select>` 在 jsdom 中无法通过 `userEvent.click() → selectOption()` 触发 `onValueChange`。**解决方案：Mock shadcn Select 组件为原生 `<select>`**。

### 修改内容

**在测试文件顶部现有 mock 区域（`vi.mock('@/lib/adminUsersApi'...` 之后）添加 Select mock：**

```typescript
// Mock shadcn Select as native <select> for testability
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: {
    children: React.ReactNode; value: string; onValueChange: (v: string) => void; disabled?: boolean;
  }) => (
    <div data-testid="mock-select">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as { displayName?: string })?.displayName === 'MockSelectTrigger') {
          return child;
        }
        if (React.isValidElement(child) && (child.type as { displayName?: string })?.displayName === 'MockSelectContent') {
          return React.cloneElement(child as React.ReactElement<{ onValueChange: (v: string) => void; value: string; disabled?: boolean }>, { onValueChange, value, disabled });
        }
        return child;
      })}
    </div>
  ),
  SelectTrigger: Object.assign(
    ({ children, ...props }: { children: React.ReactNode; id?: string; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    { displayName: 'MockSelectTrigger' }
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: Object.assign(
    ({ children, onValueChange, value, disabled }: {
      children: React.ReactNode; onValueChange?: (v: string) => void; value?: string; disabled?: boolean;
    }) => (
      <select
        data-testid="native-select"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="">-- select --</option>
        {children}
      </select>
    ),
    { displayName: 'MockSelectContent' }
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));
```

> ⚠️ 如果上面的 mock 过于复杂无法正常工作，可用更简单的替代方案（见下方备选方案）。

**替换 "submits the form successfully and navigates" 测试（行 182-200）：**

```typescript
  it('submits the form successfully and navigates', async () => {
    mockIssueBadge.mockResolvedValue({ id: 'badge-1', status: 'PENDING' });
    const user = userEvent.setup();
    renderPage();

    // Wait for data to load
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockGetAdminUsers).toHaveBeenCalled());

    // Select template and recipient via native <select> (mocked)
    const selects = screen.getAllByTestId('native-select');
    await user.selectOptions(selects[0], 'tpl-1');  // Template
    await user.selectOptions(selects[1], 'user-1');  // Recipient

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    await user.click(submitBtn);

    // Verify API called with correct args
    await waitFor(() => {
      expect(mockIssueBadge).toHaveBeenCalledWith({
        templateId: 'tpl-1',
        recipientId: 'user-1',
      });
    });

    // Verify success feedback
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Badge issued successfully!');
    });

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/admin/badges');
  });
```

**替换 "handles API error on form submission" 测试（行 202-216）：**

```typescript
  it('handles API error on form submission', async () => {
    mockIssueBadge.mockRejectedValue(new Error('Template not found'));
    const user = userEvent.setup();
    renderPage();

    // Wait for data to load
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockGetAdminUsers).toHaveBeenCalled());

    // Select template and recipient
    const selects = screen.getAllByTestId('native-select');
    await user.selectOptions(selects[0], 'tpl-1');
    await user.selectOptions(selects[1], 'user-1');

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    await user.click(submitBtn);

    // Verify error toast shown with server error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Template not found');
    });

    // Verify NO navigation on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });
```

### 备选方案（如果 Select mock 太复杂）

如果 mock Radix Select 组件遇到问题，可以改用**直接操作组件 state** 的方式。在 `IssueBadgePage.tsx` 组件中暴露一个 test helper：

```typescript
// 在 IssueBadgePage.tsx 的 form onSubmit 外部，添加 data attribute:
<form onSubmit={handleSubmit} className="space-y-6" data-testid="issue-badge-form">
```

然后在测试中直接 fire submit event 并预设 state：

```typescript
  it('submits the form successfully and navigates', async () => {
    mockIssueBadge.mockResolvedValue({ id: 'badge-1', status: 'PENDING' });
    renderPage();

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    // Cannot interact with Radix Select in jsdom, so fire form submit directly
    // The validation will fail (no template selected), so we mock issueBadge
    // to verify the error path instead
    // ... (this is the fallback — prefer the Select mock approach above)
  });
```

> **优先使用 Select mock 方案**，这样测试真正覆盖了 handleSubmit 的完整路径。

---

## 验证清单

修复完成后运行：

```bash
cd frontend

# 1. All tests pass
npx vitest run

# 2. 检查 IssueBadgePage 测试专门运行
npx vitest run src/pages/IssueBadgePage.test.tsx

# 3. ESLint clean
npx eslint --max-warnings=0 .

# 4. Build clean
npx vite build
```

### 验收标准

- [ ] `status=APPROVED` 已全部替换为 `status=ACTIVE`（3 处）
- [ ] "submits successfully" 测试通过组件 Submit 按钮触发，验证 `toast.success` + `navigate`
- [ ] "handles API error" 测试通过组件 Submit 按钮触发，验证 `toast.error` + 无 navigate
- [ ] 所有现有测试通过（0 regressions）
- [ ] ESLint 0 errors 0 warnings
- [ ] Build clean

## 预期修改文件清单

| File | Change |
|------|--------|
| `frontend/src/pages/IssueBadgePage.tsx` | `APPROVED` → `ACTIVE` |
| `frontend/src/pages/IssueBadgePage.test.tsx` | `APPROVED` → `ACTIVE` + 添加 Select mock + 重写 2 个测试 |
| `frontend/src/components/BulkIssuance/TemplateSelector.tsx` | `APPROVED` → `ACTIVE` |
