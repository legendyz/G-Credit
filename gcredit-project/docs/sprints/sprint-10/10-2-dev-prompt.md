# Dev Prompt: Story 10.2 — ESLint Full Cleanup + CI Zero-Tolerance Gate

## 角色与上下文

你是 G-Credit 项目的 Dev Agent。当前在 `sprint-10/v1-release` 分支上执行 Sprint 10 的第二个 Story。

**项目背景：** G-Credit 是一个企业内部数字徽章（Digital Credentialing）系统，NestJS 11 + React 19 + PostgreSQL 16 + Prisma 6.19.2。Story 10.1 已完成，`tsc --noEmit` 通过，534 tests pass。

**工作目录：** `c:\G_Credit\CODE\gcredit-project\backend`

---

## 🎯 目标

1. **消除所有 ESLint errors**（当前 18 个）
2. **消除所有 ESLint warnings**（当前 204 个）
3. **将 lint CI gate 设为 `--max-warnings=0` 零容忍**
4. **0 回归** — 全部测试仍然通过，`tsc --noEmit` 仍然干净

---

## 📋 Acceptance Criteria

```
AC1: npx eslint "{src,test}/**/*.ts" 返回 0 errors（当前 18）
AC2: npx eslint "{src,test}/**/*.ts" --max-warnings=0 返回 0 warnings（当前 204）
AC3: package.json lint script 设为 --max-warnings=0
AC4: CI gate: npm run lint（含 --max-warnings=0）阻止任何回归
AC5: 所有测试通过（0 regressions）
AC6: tsc --noEmit 仍然 0 errors（不能引入新的类型问题）
AC7: Commit message: refactor: ESLint full cleanup 537→0 + zero-tolerance CI gate
```

---

## 📊 当前问题分布

### Errors（18 个，2 类）
| 规则 | 数量 | 文件 | 修复方法 |
|------|------|------|----------|
| `no-unnecessary-type-assertion` | 12 | `badge-notification.builder.spec.ts` | 移除多余的 `!` 非空断言（tsc 已能推断） |
| `prettier/prettier` | 6 | 4 个 spec 文件 | `npx eslint --fix` 自动修复 |

### Warnings（204 个，6 类）
| 规则 | 数量 | 修复方法 |
|------|------|----------|
| `no-unsafe-member-access` | 58 | 为被访问对象添加类型注解 |
| `no-unsafe-assignment` | 51 | 使用 `const x: Type = expr` |
| `no-unsafe-argument` | 50 | 为函数参数添加类型 |
| `no-unsafe-return` | 28 | 为返回值添加类型 |
| `no-unsafe-call` | 16 | 为函数引用添加类型签名 |
| `require-await` | 1 | 移除不需要的 async 或加 await |

### Top 10 文件（占总 warnings 的 78%）
| 文件 | Warns | 主要问题 |
|------|-------|----------|
| `badge-issuance/badge-issuance.service.spec.ts` | 37 | member-access, assignment, return, call |
| `badge-sharing/services/badge-analytics.service.spec.ts` | 26 | argument(24), assignment(2) |
| `bulk-issuance/bulk-issuance.service.spec.ts` | 25 | member-access(18), return(4) |
| `microsoft-graph/teams/teams-badge-notification.service.spec.ts` | 23 | member-access(12), assignment(10) |
| `admin-users/admin-users.service.spec.ts` | 18 | assignment(6), return(6), call(6) |
| `admin-users/admin-users.controller.spec.ts` | 9 | argument(8) |
| `badge-sharing/controllers/teams-sharing.controller.spec.ts` | 7 | argument(7) |
| `dashboard/dashboard.controller.spec.ts` | 6 | argument(6) |
| `modules/auth/auth.service.spec.ts` | 4 | assignment(4) |
| `microsoft-graph/services/graph-email.service.spec.ts` | 4 | return(4) |

---

## 🔧 执行步骤

### Step 1: Auto-fix formatting errors（~5 min）

```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npx eslint "{src,test}/**/*.ts" --fix 2>&1 | Select-Object -Last 5
```

这会自动修复 6 个 `prettier/prettier` errors。修复后确认：

```powershell
npx eslint "{src,test}/**/*.ts" --max-warnings=9999 2>&1 | Select-String "problems"
```

### Step 2: 修复 12 个 `no-unnecessary-type-assertion` errors

**文件：** `src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts`

这些是 Story 10.1 添加的 `!` 非空断言，但 tsc 修复后类型已经足够精确，不再需要 `!`。

```typescript
// ❌ 当前（不必要的非空断言）
const columnSet = headerContainer.items![0];
const imageColumn = columnSet!.columns![0];

// ✅ 修复（移除多余的 !）
const columnSet = headerContainer.items[0];
const imageColumn = columnSet.columns[0];
```

⚠️ **注意：** 移除 `!` 前确认该类型定义中属性确实不是 `optional`。如果移除后 tsc 报错，说明 `!` 是必要的——此时应该将规则改为 ignore 或调整接口类型。

### Step 3: 修复 `no-unsafe-*` warnings — 按文件逐个清理

**🚨 关键规则（Lesson 34）：**
```typescript
// ❌ 不要使用 as 类型断言 — eslint --fix 会静默删除它
const result = someCall() as MyType;

// ✅ 使用变量类型注解 — eslint --fix 不会删除
const result: MyType = someCall();
```

**修复顺序：** 从 warnings 最多的文件开始（impact-first）

#### 常见修复模式

**模式 A: no-unsafe-member-access（58 个）**
```typescript
// ❌ 访问 any 类型的属性
const body = response.body;
expect(body.id).toBe('123');

// ✅ 给 body 声明类型
const body = response.body as { id: string; status: string };
// 或更好：
interface BadgeResponse { id: string; status: string; }
const body: BadgeResponse = response.body;
```

**模式 B: no-unsafe-assignment（51 个）**
```typescript
// ❌ 赋值传播 any
const data = JSON.parse(raw);
const service = module.get(MyService);

// ✅ 类型注解
const data: MyInterface = JSON.parse(raw);
const service = module.get<MyService>(MyService);
```

**模式 C: no-unsafe-argument（50 个）**
```typescript
// ❌ 传入 any 参数
await controller.create(req, body);

// ✅ 确保参数有类型
const typedReq: RequestWithUser = req;
await controller.create(typedReq, body);
```

**模式 D: no-unsafe-return（28 个）**
```typescript
// ❌ 返回 any
get: jest.fn((key: string) => {
  const config = { ... };
  return config[key];  // config[key] is any
});

// ✅ 返回类型注解
get: jest.fn((key: string): string | undefined => {
  const config: Record<string, string> = { ... };
  return config[key];
});
```

**模式 E: no-unsafe-call（16 个）**
```typescript
// ❌ 调用 any 类型函数
mockPrismaService.user.findUnique.mockResolvedValue(user);

// ✅ 确保 mock 有正确类型
const mockPrismaService = {
  user: { findUnique: jest.fn() as jest.Mock },
};
// 或在 describe scope 声明即可（jest.fn() 返回 jest.Mock）
```

**模式 F: require-await（1 个）**
```typescript
// ❌ async 函数没有 await
async function doSomething() { return value; }

// ✅ 移除 async 或加 await
function doSomething() { return value; }
```

### Step 4: 处理 `describe.skip` 文件中的 warnings

以下 4 个 Teams 相关文件是 `describe.skip`（TD-006），但仍需清理 ESLint warnings：

1. `badge-issuance/badge-issuance-teams.integration.spec.ts`
2. `microsoft-graph/teams/teams-badge-notification.service.spec.ts` (23 warnings!)
3. `microsoft-graph/services/graph-teams.service.spec.ts` (3 warnings)
4. `badge-sharing/controllers/teams-sharing.controller.spec.ts` (7 warnings)

这些文件虽然测试被 skip，但代码仍被 ESLint 检查。同样的方式修复。

### Step 5: 处理 src/ 文件中的 warnings（非 test）

以下 src 文件也有 warnings：

| 文件 | Warns | 说明 |
|------|-------|------|
| `badge-issuance/services/badge-notification.service.ts` | 4 | member-access, assignment |
| `badge-sharing/badge-sharing.service.ts` | 4 | member-access |
| `badge-sharing/controllers/widget-embed.controller.ts` | 3 | member-access |
| `common/services/blob-storage.service.ts` | 3 | member-access |
| `microsoft-graph/services/graph-email.service.ts` | 3 | member-access, assignment |
| `common/storage.service.ts` | 2 | member-access |

⚠️ 修改 src/ 文件要特别小心，确保不改变运行时行为。每修改完一个 src 文件立即跑 `npm test`。

### Step 6: 更新 lint script 为零容忍

**文件：** `package.json`

```json
// 当前
"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix --max-warnings=423",

// 修改为
"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix --max-warnings=0",
```

验证：
```powershell
npm run lint
# Expected: 0 errors, 0 warnings, exit code 0
```

### Step 7: 全量回归测试

```powershell
# 1. Type check（确认 Story 10.1 成果未被破坏）
npx tsc --noEmit
# Expected: 0 errors

# 2. Backend unit tests
npm test
# Expected: 534 pass, 28 skip, 0 fail

# 3. ESLint final check
npx eslint "{src,test}/**/*.ts" --max-warnings=0
# Expected: 0 errors, 0 warnings

# 4. lint script verification
npm run lint
# Expected: exit code 0
```

---

## ⚠️ 关键注意事项

### 必须遵守的规则
1. **不要使用 `as` 类型断言** — ESLint `--fix` 会静默删除它（L34）
2. **不要使用 `// eslint-disable` 注释** — 目标是真正修复，不是绕过
3. **不要修改 `eslint.config.mjs` 规则配置** — 不要将 warn 降为 off
4. **不要修改 `no-explicit-any: off` 设置** — 这个配置是有意的（允许显式 any 但禁止隐式 unsafe）
5. **每修完一批文件后增量验证** — 不要等最后才跑 eslint
6. **修改 src/ 文件后立即跑测试** — 确保无运行时回归

### ESLint 配置要点
- `eslint.config.mjs` 使用 flat config（ESLint 9）
- `recommendedTypeChecked` 开启所有 no-unsafe-* 规则
- Test 文件已关闭 `unbound-method`（测试中 `expect(service.method)` 是误报）
- `prettier/prettier` 设为 error

### 与 tsc 的交互
- Story 10.1 已添加 `tsc --noEmit` 到 CI
- CI 执行顺序：lint → type-check → tests（正确）
- 移除不必要的 `!` 断言后必须验证 tsc 仍然通过

---

## 📁 主要涉及的文件

### 高优先级（warnings 最多）
- `src/badge-issuance/badge-issuance.service.spec.ts` — 37 warnings
- `src/badge-sharing/services/badge-analytics.service.spec.ts` — 26 warnings
- `src/bulk-issuance/bulk-issuance.service.spec.ts` — 25 warnings
- `src/microsoft-graph/teams/teams-badge-notification.service.spec.ts` — 23 warnings
- `src/admin-users/admin-users.service.spec.ts` — 18 warnings

### 中优先级
- `src/admin-users/admin-users.controller.spec.ts` — 9 warnings
- `src/badge-sharing/controllers/teams-sharing.controller.spec.ts` — 7 warnings
- `src/dashboard/dashboard.controller.spec.ts` — 6 warnings
- 其他 spec 文件（每个 3-4 个 warnings）

### src/ 文件修改（谨慎）
- `src/badge-issuance/services/badge-notification.service.ts`
- `src/badge-sharing/badge-sharing.service.ts`
- `src/badge-sharing/controllers/widget-embed.controller.ts`
- `src/common/services/blob-storage.service.ts`
- `src/microsoft-graph/services/graph-email.service.ts`
- `src/common/storage.service.ts`

### 配置文件
- `package.json` — lint script `--max-warnings=0`

### Error 修复
- `src/microsoft-graph/teams/adaptive-cards/badge-notification.builder.spec.ts` — 12 no-unnecessary-type-assertion

---

## ✅ 完成标准

在提交代码前，确认以下全部通过：

```powershell
# 1. ESLint zero-tolerance
cd c:\G_Credit\CODE\gcredit-project\backend
npx eslint "{src,test}/**/*.ts" --max-warnings=0
# Expected: 0 errors, 0 warnings

# 2. lint script passes
npm run lint
# Expected: exit code 0

# 3. Type check clean
npx tsc --noEmit
# Expected: 0 errors

# 4. All tests pass
npm test
# Expected: 534 pass, 28 skip, 0 fail

# 5. E2E tests pass (if database available)
npm run test:e2e
# Expected: ~158 tests, 0 failures
```

**Commit：**
```bash
git add -A
git commit -m "refactor: ESLint full cleanup 537→0 + zero-tolerance CI gate

- Fix 12 no-unnecessary-type-assertion errors (badge-notification.builder.spec)
- Fix 6 prettier formatting errors (auto-fix)
- Fix 204 no-unsafe-* warnings across 20+ files
- Update lint script: --max-warnings=423 → --max-warnings=0
- 0 regressions, all tests passing, tsc --noEmit clean"
```

---

## 📚 参考文档

- **Story 文件：** `docs/sprints/sprint-10/10-2-eslint-regression-ci-gate.md`
- **Lessons Learned L34：** Variable annotations vs `as` casts
- **Sprint 9 TD-015：** ESLint cleanup methodology
- **ESLint Config：** `eslint.config.mjs`（flat config, ESLint 9）
- **CI Workflow：** `.github/workflows/test.yml` → lint-and-unit job
- **Story 10.1 Code Review：** `docs/sprints/sprint-10/10-1-code-review.md` → Finding #2 directly addressed by this story
