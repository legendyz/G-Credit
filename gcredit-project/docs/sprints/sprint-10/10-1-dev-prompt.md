# Dev Prompt: Story 10.1 — TD-017 Fix tsc Test Type Errors + Password Reset Transaction

## 角色与上下文

你是 G-Credit 项目的 Dev Agent。当前在 `sprint-10/v1-release` 分支上执行 Sprint 10 的第一个 Story。

**项目背景：** G-Credit 是一个企业内部数字徽章（Digital Credentialing）系统，NestJS 11 + React 19 + PostgreSQL 16 + Prisma 6.19.2。当前 1087 测试全部通过，v0.9.0 已发布。Sprint 10 目标是 v1.0.0 Release。

**工作目录：** `c:\G_Credit\CODE\gcredit-project\backend`

---

## 🎯 目标

1. **修复 114 个 tsc test-only type errors**，使 `npx tsc --noEmit` 在 backend 目录下返回 0 errors
2. **将 password reset 流程包裹在 `$transaction` 中**（架构审计发现）
3. **将 `tsc --noEmit` 加入 CI pipeline**
4. **0 回归** — 全部 1087 测试仍然通过

---

## 📋 Acceptance Criteria

```
AC1: npx tsc --noEmit 返回 0 errors（当前 114 errors）
AC2: 所有 1087 测试通过（0 regressions）
AC3: 没有引入新的 any 类型（ESLint 检查）
AC4: Test mock 对象包含所有 required interface fields
AC5: CI pipeline 包含 tsc --noEmit 步骤
AC6: Commit message: refactor: fix 114 tsc test type errors (TD-017)
```

---

## 🔧 执行步骤

### Step 1: 分析 error 分布

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npx tsc --noEmit 2>&1 | Select-String "error TS" | Group-Object { $_ -replace '.*error (TS\d+).*', '$1' } | Sort-Object Count -Descending
```

已知 error 类型分布（来自 L35）：
- TS2339 (property does not exist) — ~56 个
- TS18048 (possibly undefined) — ~28 个  
- TS2322 (type not assignable) — ~16 个
- TS2345 (argument type mismatch) — ~16 个

按文件分组，从错误最多的文件开始修复。

### Step 2: 修复 Prisma mock type errors

**问题：** Test 中的 mock 对象缺少 Prisma 生成类型的必需字段。

**修复方法：**
```typescript
// ❌ 错误 — 缺少必需字段
const mockBadge = { id: '1', status: 'ACTIVE' };

// ✅ 正确 — 使用 Partial<> 或完整类型
const mockBadge: Partial<Badge> = { id: '1', status: 'ACTIVE' };

// ✅ 更好 — mock factory
function createMockBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: 'test-id',
    templateId: 'template-id',
    recipientId: 'user-id',
    status: BadgeStatus.ACTIVE,
    // ... all required fields
    ...overrides,
  };
}
```

每修复一批后运行 `npx tsc --noEmit` 确认进展。

### Step 3: 修复 RequestWithUser 接口相关 errors

**接口定义位置：** `src/common/interfaces/request-with-user.interface.ts`

```typescript
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
```

**修复测试 mock：**
```typescript
// ❌ 错误
const mockRequest = { user: { userId: '1' } };

// ✅ 正确
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

const mockRequest: RequestWithUser = {
  user: { userId: '1', email: 'test@test.com', role: UserRole.EMPLOYEE },
};
```

⚠️ **必须使用 `import type`**（因为 `isolatedModules: true` + `emitDecoratorMetadata: true`）

### Step 4: 修复其余 type errors

**🚨 关键规则（Lesson 34）：**
```typescript
// ❌ 不要使用 as 类型断言 — eslint --fix 会静默删除它
const rows = parse(csv) as CsvRow[];

// ✅ 使用变量类型注解 — eslint --fix 不会删除
const rows: CsvRow[] = parse(csv);
```

处理模式：
- `no-unsafe-assignment` → 用变量注解替换 `any`
- `no-unsafe-member-access` → 为中间变量添加类型
- `no-unsafe-call` → 为函数引用添加类型签名
- Generic service mocks → 使用 `jest.Mocked<typeof ServiceClass>`

### Step 5: 修复 password reset 事务问题

**文件：** `src/modules/auth/auth.service.ts`（resetPassword 方法）

**当前代码（非原子性）：**
```typescript
// Step 3: Update password（如果成功但 Step 4 失败，token 可复用）
await this.prisma.user.update({ ... });
// Step 4: Mark token as used
await this.prisma.passwordResetToken.update({ ... });
```

**修复为：**
```typescript
await this.prisma.$transaction(async (tx) => {
  // Update password
  await tx.user.update({
    where: { id: token.userId },
    data: { password: hashedPassword },
  });
  // Mark token as used (atomic with password update)
  await tx.passwordResetToken.update({
    where: { id: token.id },
    data: { used: true },
  });
});
```

**添加测试：** 验证 password update 和 token invalidation 是原子操作。

### Step 6: 添加 tsc --noEmit 到 CI

**文件：** `.github/workflows/test.yml`

在 `lint-and-unit` job 中，在 lint 步骤之后添加 type-check 步骤：

```yaml
- name: Type Check
  run: npx tsc --noEmit
  working-directory: ./gcredit-project/backend
```

同时在 `package.json` 中添加 script：
```json
"type-check": "tsc --noEmit"
```

### Step 7: 全量回归测试

```powershell
# Backend unit tests
cd c:\G_Credit\CODE\gcredit-project\backend
npm test

# Frontend tests
cd c:\G_Credit\CODE\gcredit-project\frontend
npm test

# E2E tests
cd c:\G_Credit\CODE\gcredit-project\backend
npm run test:e2e

# Type check (final verification)
npx tsc --noEmit
```

**期望结果：**
- Backend: 532 tests passing
- Frontend: 397 tests passing
- E2E: 158 tests passing
- tsc: 0 errors

---

## ⚠️ 关键注意事项

### 必须遵守的规则
1. **不要使用 `as` 类型断言** — ESLint `--fix` 会静默删除它（L34）
2. **使用 `import type` 而不是 `import`** — `isolatedModules: true` 要求（L36）
3. **每修复一批文件后增量验证** — 不要等到最后才运行 `tsc --noEmit`
4. **预算 mock 更新的连锁反应** — 替换 `any` 会暴露 N×M 个 mock 字段缺失（L36）
5. **不要修改 `src/` 中的业务逻辑** — 本 Story 只修复 test 文件类型 + password reset 事务

### TypeScript 配置要点
- `tsconfig.json`: `strictNullChecks: true`, `noImplicitAny: true`, `isolatedModules: true`
- `tsconfig.build.json`: 排除了 `test/` 和 `**/*spec.ts`（所以 `nest build` 从不检查 test files）
- Jest 使用 `ts-jest` 转译（宽松模式，不做完整 type check）

### 已有 mock 工具
- `test/factories/` — 测试数据工厂
- `test/helpers/` — 测试辅助函数
- 9 个 controller 已使用 `RequestWithUser`（Sprint 9 TD-015 完成）

---

## 📁 可能涉及的文件

### 主要修改（test 文件）
- `src/**/*.spec.ts` — 单元测试文件（主要 error 来源）
- `test/**/*.e2e-spec.ts` — E2E 测试文件

### 少量修改
- `src/modules/auth/auth.service.ts` — password reset `$transaction`
- `.github/workflows/test.yml` — 添加 tsc --noEmit step
- `package.json` — 添加 `type-check` script

### 参考文件（只读）
- `src/common/interfaces/request-with-user.interface.ts` — RequestWithUser 定义
- `tsconfig.json` / `tsconfig.build.json` — TS 配置
- `prisma/schema.prisma` — 数据模型定义（mock 字段参考）

---

## ✅ 完成标准

在提交代码前，确认以下全部通过：

```powershell
# 1. Type check clean
cd c:\G_Credit\CODE\gcredit-project\backend
npx tsc --noEmit
# Expected: 0 errors

# 2. All tests pass
npm test
# Expected: 532 tests, 0 failures

# 3. E2E tests pass
npm run test:e2e
# Expected: 158 tests, 0 failures

# 4. ESLint no new errors
npx eslint . --max-warnings=423
# Expected: pass (warnings ≤ 423)

# 5. Frontend tests unaffected
cd c:\G_Credit\CODE\gcredit-project\frontend
npm test
# Expected: 397 tests, 0 failures
```

**Commit：**
```bash
git add -A
git commit -m "refactor: fix 114 tsc test type errors (TD-017)

- Fix all tsc --noEmit type errors in test files
- Wrap password reset in \$transaction (arch audit)
- Add tsc --noEmit to CI pipeline
- Add type-check script to package.json
- 0 regressions, all 1087 tests passing"
```

---

## 📚 参考文档

- **Story 文件：** `docs/sprints/sprint-10/10-1-tsc-test-type-errors.md`
- **Lessons Learned：** `docs/lessons-learned/lessons-learned.md` → L34, L35, L36
- **架构审计：** `docs/sprints/sprint-10/architecture-release-audit-v1.0.0.md` → Transaction Safety
- **Sprint 9 TD-015：** `RequestWithUser` 共享接口重构
- **CI Workflow：** `.github/workflows/test.yml`
