# TD-015 Dev Agent Prompt: ESLint Type Safety Cleanup

**Sprint:** Sprint 9 | **Category:** Technical Debt | **Priority:** P2  
**Estimated Hours:** 8h (Phase 1: 4h + Phase 2: 4h) | **Target Version:** v0.9.0  
**Date Created:** 2026-02-07  
**Dependencies:** None (can run in parallel with other stories)  
**Story File:** `sprint-9/td-015-eslint-type-safety.md`

---

## 🎯 Mission

Fix ESLint type safety warnings in the backend codebase. Current baseline: **1303 warnings, 0 errors** across `{src,apps,libs,test}/**/*.ts`. These are pure type annotation fixes — **no logic changes, no runtime behavior changes**.

**Target:** Reduce warnings from 1303 → ≤500 (62% reduction)

---

## 📊 Current ESLint Baseline (2026-02-07)

```
✖ 1303 warnings (0 errors)
max-warnings in package.json: 1310
```

### Warning Breakdown by Rule

| Rule | Count | Priority | Fix Strategy |
|------|-------|----------|-------------|
| `no-unsafe-member-access` | 497 | Phase 2 | Add type assertions for Prisma results, typed object access |
| `no-unsafe-argument` | 253 | Phase 1 | Type function parameters, cast `any` args |
| `no-unsafe-assignment` | 196 | Phase 1 | Add explicit types to variable declarations |
| `no-unsafe-call` | 121 | Phase 1 | Type function references, add call signatures |
| `no-unused-vars` | 89 | Phase 2 | Remove or prefix with `_`, clean imports |
| `unbound-method` | 67 | Phase 2 | Use arrow functions or `.bind()` in tests |
| `no-unsafe-return` | 50 | Phase 1 | Add explicit return types to functions |
| `require-await` | 29 | Phase 2 | Remove `async` or add `await`, justify |
| `no-floating-promises` | 1 | Phase 1 | Add `await` or `void` |

### ESLint Config (eslint.config.mjs)

All type-safety rules are set to `"warn"` (not error). The config uses:
- `tseslint.configs.recommendedTypeChecked` (strict type-aware rules)
- `@typescript-eslint/no-explicit-any: 'off'` (allows `any` — we fix where it's used unsafely)
- `prettier/prettier: ["error"]` (formatting only)

---

## ⚠️ Critical Rules

1. **NO logic changes** — only type annotations, assertions, and import cleanup
2. **NO new dependencies** — this is pure refactoring
3. **Run tests frequently** — after every 50-100 warning fixes, run `npm test`
4. **Commit incrementally** — commit after each phase/sub-phase for easy rollback
5. **DO NOT change `any` to wrong types** — if unsure, use explicit type assertion with comment
6. **DO NOT suppress warnings with `// eslint-disable`** — fix properly or skip
7. **Update `max-warnings` in package.json** after each phase to lock in progress

---

## 📦 Deliverables

### Phase 1: Fix unsafe-argument, unsafe-assignment, unsafe-call, unsafe-return (4h)

**Target:** Reduce warnings from 1303 → ~850 (~450 fixes)

#### Task 1.1: Fix `no-unsafe-argument` (253 warnings → ~50 remaining) — 1.5h

These warnings occur when `any`-typed values are passed to typed function parameters.

**Common Patterns & Fixes:**

```typescript
// ❌ BEFORE: any passed to typed param
const result = someFunction(prismaResult);  // prismaResult is any

// ✅ AFTER: Cast with proper type
const result = someFunction(prismaResult as ExpectedType);

// ❌ BEFORE: req.user is any in test mocks
mockRequest = { user: { id: 'test-id', role: 'ADMIN' } } as any;
controller.someMethod(mockRequest);  // mockRequest is any

// ✅ AFTER: Type the mock properly
const mockRequest = { user: { id: 'test-id', role: 'ADMIN' } } as RequestWithUser;
controller.someMethod(mockRequest);
```

**Key files to fix (test specs are the biggest source):**
- `*.controller.spec.ts` — mock request objects need `as RequestWithUser` typing
- `*.service.spec.ts` — Prisma mock results need explicit typing
- `*.e2e-spec.ts` — response bodies need type assertions

#### Task 1.2: Fix `no-unsafe-assignment` (196 warnings → ~50 remaining) — 1h

These warnings occur when `any`-typed values are assigned to variables without type annotations.

**Common Patterns & Fixes:**

```typescript
// ❌ BEFORE: Prisma result inferred as any
const user = await this.prisma.user.findUnique({ where: { id } });

// ✅ AFTER: Explicit type (if Prisma types are available)
const user: User | null = await this.prisma.user.findUnique({ where: { id } });

// ❌ BEFORE: Destructuring any
const { data } = response;

// ✅ AFTER: Type the destructured value
const { data } = response as { data: ExpectedType };

// ❌ BEFORE: Test mock assignment
const mockService = { findAll: jest.fn().mockResolvedValue([]) };

// ✅ AFTER: Type the mock
const mockService = { findAll: jest.fn().mockResolvedValue([]) } as unknown as SomeService;
```

#### Task 1.3: Fix `no-unsafe-call` (121 warnings → ~20 remaining) — 0.75h

These occur when calling a value typed as `any`.

**Common Patterns & Fixes:**

```typescript
// ❌ BEFORE: Calling any-typed method
result.someMethod();  // result is any

// ✅ AFTER: Type assertion before call
(result as SomeType).someMethod();

// ❌ BEFORE: jest.fn() mock calls
const spy = jest.spyOn(service, 'method');
spy.mockReturnValue(result);  // result is any

// ✅ AFTER: Type the return value
spy.mockReturnValue(result as ReturnType);
```

#### Task 1.4: Fix `no-unsafe-return` (50 warnings → ~10 remaining) — 0.5h

These occur when returning `any` from typed functions.

**Common Patterns & Fixes:**

```typescript
// ❌ BEFORE: Returning any from typed function
async findUser(id: string) {
  return this.prisma.user.findUnique({ where: { id } }); // returns any
}

// ✅ AFTER: Explicit return type
async findUser(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
}
```

#### Task 1.5: Fix `no-floating-promises` (1 warning) — 0.05h

```typescript
// ❌ BEFORE
someAsyncFunction();

// ✅ AFTER
await someAsyncFunction();
// or
void someAsyncFunction();
```

#### Task 1.6: Verify Phase 1 — 0.2h

```bash
# Run full test suite
npm test
# Check warning count  
npx eslint "{src,apps,libs,test}/**/*.ts" --max-warnings 9999 2>&1 | Select-Object -Last 3
# Update max-warnings in package.json
# Commit Phase 1
```

---

### Phase 2: Fix unsafe-member-access, unused-vars, unbound-method, require-await (4h)

**Target:** Reduce warnings from ~850 → ≤500 (~350 fixes)

#### Task 2.1: Fix `no-unsafe-member-access` (497 warnings → ~200 remaining) — 2h

This is the **largest category**. Occurs when accessing properties on `any`-typed values.

**Common Patterns & Fixes:**

```typescript
// ❌ BEFORE: Accessing .property on any
const name = result.name;  // result is any

// ✅ AFTER: Type the source
const typedResult = result as { name: string };
const name = typedResult.name;

// ❌ BEFORE: In test assertions
expect(response.body.data.length).toBe(5);  // body is any

// ✅ AFTER: Type the response
const body = response.body as { data: SomeType[] };
expect(body.data.length).toBe(5);

// ❌ BEFORE: Prisma relation access
const badges = user.badges;  // badges not in basic User type

// ✅ AFTER: Include type with relations
type UserWithBadges = User & { badges: Badge[] };
const typedUser = user as UserWithBadges;
const badges = typedUser.badges;
```

**Strategy for 497 warnings:**  
- Fix ~300 most impactful (src/ files first, then test/ files)
- Some in deeply nested test mocks may be left for Phase 3 (Sprint 10)
- Focus on actual source code (`src/`) over test files (`test/`) for maximum safety impact

#### Task 2.2: Fix `no-unused-vars` (89 warnings) — 0.75h

```typescript
// ❌ BEFORE: Unused import
import { Injectable, Logger, Scope } from '@nestjs/common';  // Scope unused

// ✅ AFTER: Remove unused
import { Injectable, Logger } from '@nestjs/common';

// ❌ BEFORE: Unused function parameter
async handleError(error: Error, context: string) {  // context unused
  this.logger.error(error.message);
}

// ✅ AFTER: Prefix with underscore
async handleError(error: Error, _context: string) {
  this.logger.error(error.message);
}

// ❌ BEFORE: Unused catch variable
try { ... } catch (error) { throw new HttpException('fail', 500); }

// ✅ AFTER: Prefix with underscore
try { ... } catch (_error) { throw new HttpException('fail', 500); }
```

#### Task 2.3: Fix `unbound-method` (67 warnings) — 0.75h

Mostly in test files where methods are referenced without binding.

```typescript
// ❌ BEFORE: In test expect()
expect(service.someMethod).toHaveBeenCalled();  // unbound reference

// ✅ AFTER: Use jest-extended or wrapper
// Option A: eslint-disable for test expectations (acceptable pattern)
// eslint-disable-next-line @typescript-eslint/unbound-method
expect(service.someMethod).toHaveBeenCalled();

// Option B: If it's a spy
expect(spy).toHaveBeenCalled();  // spy is already bound
```

**Note:** For test files, `unbound-method` in `expect()` calls is a known false positive. If the majority are in test specs, consider adding a test-specific override in `eslint.config.mjs`:

```javascript
{
  files: ['**/*.spec.ts', '**/test/**/*.ts'],
  rules: {
    '@typescript-eslint/unbound-method': 'off',
  },
}
```

This is an acceptable pattern used by many NestJS projects.

#### Task 2.4: Fix `require-await` (29 warnings) — 0.25h

```typescript
// ❌ BEFORE: async without await
async findAll() {
  return this.items;  // no await needed
}

// ✅ AFTER: Remove async if not needed
findAll() {
  return this.items;
}

// OR if interface requires async:
async findAll(): Promise<Item[]> {
  return Promise.resolve(this.items);
}
```

#### Task 2.5: Final Verification — 0.25h

```bash
# Run FULL test suite (backend + frontend + E2E)  
cd gcredit-project/backend && npm test
cd gcredit-project/frontend && npx vitest run
cd gcredit-project/backend && npm run test:e2e

# Final lint count
npx eslint "{src,apps,libs,test}/**/*.ts" --max-warnings 9999 2>&1 | Select-Object -Last 3

# Type check
npx tsc --noEmit

# Update max-warnings in package.json to lock in progress
# Target: --max-warnings=500 (or actual count)

# Commit Phase 2
```

---

## 🔒 Quality Gates

### After Phase 1
- [ ] Backend tests: 510+ passed, 0 new failures
- [ ] Warning count: ≤850 (from 1303)
- [ ] `npx tsc --noEmit` passes
- [ ] Commit with message: `refactor: TD-015 Phase 1 - fix unsafe-argument/assignment/call/return (1303→Xwarn)`

### After Phase 2
- [ ] Backend tests: 510+ passed, 0 new failures
- [ ] Frontend tests: 339 passed (no regressions)
- [ ] E2E tests: 143 passed (no regressions)
- [ ] Warning count: ≤500 (from ~850)
- [ ] `npx tsc --noEmit` passes
- [ ] `max-warnings` in `package.json` updated to actual count
- [ ] Commit with message: `refactor: TD-015 Phase 2 - fix unsafe-member-access/unused-vars/unbound-method (X→Ywarn)`

---

## 📁 Files Context

### ESLint Config
- `backend/eslint.config.mjs` — All rules are `"warn"`, `no-explicit-any` is `"off"`
- `backend/package.json` line 15: `"lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix --max-warnings=1310"`

### Highest-Impact Source Files (fix these first)
Source code (`src/`) fixes have more safety value than test file fixes:

- `src/badge-issuance/badge-issuance.service.ts` — Heavy Prisma usage, many unsafe member access
- `src/badge-sharing/badge-sharing.service.ts` — Graph API calls with unknown types
- `src/m365-sync/m365-sync.service.ts` — Graph API pagination, retry logic, any types
- `src/microsoft-graph/services/*.ts` — External API interop, heavy any usage
- `src/admin-users/admin-users.service.ts` — Prisma queries with relations
- `src/dashboard/dashboard.service.ts` — Aggregate queries, any results
- `src/bulk-issuance/bulk-issuance.service.ts` — CSV parsing, session management
- `src/badge-templates/badge-templates.service.ts` — Template CRUD with relations
- `src/analytics/analytics.service.ts` — Aggregate queries

### Test Files (fix after src/)
- `test/*.e2e-spec.ts` — Response body typing (`response.body as Type`)
- `src/**/*.spec.ts` — Mock typing, request objects

### Commonly Needed Types

```typescript
// Prisma types — import from @prisma/client
import { User, Badge, BadgeTemplate, Prisma } from '@prisma/client';

// Prisma with relations (use Prisma namespace)
type UserWithBadges = Prisma.UserGetPayload<{ include: { badges: true } }>;
type BadgeWithTemplate = Prisma.BadgeGetPayload<{ include: { badgeTemplate: true } }>;

// NestJS request type
import { Request } from 'express';
interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

// Test mock patterns
const mockPrisma = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
} as unknown as PrismaService;
```

---

## 🚫 Out of Scope

- Frontend ESLint warnings (tracked separately)
- Changing `no-explicit-any` to error (deferred to Phase 4, Sprint 11)
- Adding new ESLint rules
- Fixing prettier formatting issues (handled by `--fix`)
- Changing any runtime behavior or business logic

---

## ✅ Definition of Done

1. ESLint warnings ≤500 (from 1303 baseline, 62%+ reduction)
2. `max-warnings` in `package.json` updated to actual count
3. All existing tests pass (backend 510+, frontend 339, E2E 143)
4. `npx tsc --noEmit` passes clean
5. Zero new test failures
6. Remaining warnings categorized in Dev Agent Record for Sprint 10

---

## 📝 Dev Agent Record Template

Update the Dev Agent Record in `td-015-eslint-type-safety.md` with:

```markdown
### Agent Model Used
**Model:** [model name]
**Date:** 2026-02-07

### Completion Notes
**Status:** [done/partial]
**Blockers:** [None/describe]

### Lint Progress
- **Baseline:** 1303 warnings, 0 errors (2026-02-07)
- **Post-Phase 1:** X warnings (Y% reduction)
- **Post-Phase 2:** X warnings (Y% reduction)
- **max-warnings updated to:** X

### Warning Reduction by Rule
| Rule | Before | After | Fixed |
|------|--------|-------|-------|
| no-unsafe-member-access | 497 | ? | ? |
| no-unsafe-argument | 253 | ? | ? |
| no-unsafe-assignment | 196 | ? | ? |
| no-unsafe-call | 121 | ? | ? |
| no-unused-vars | 89 | ? | ? |
| unbound-method | 67 | ? | ? |
| no-unsafe-return | 50 | ? | ? |
| require-await | 29 | ? | ? |
| no-floating-promises | 1 | ? | ? |
| **TOTAL** | **1303** | **?** | **?** |

### Test Results
- **Backend Unit:** X passed, Y skipped
- **Frontend:** X passed
- **E2E:** X passed
- **tsc --noEmit:** pass/fail

### Remaining Warnings (for Sprint 10 Phase 3)
- [Categorize remaining ~500 warnings by file/rule for future work]

### File List
**Files Modified:** [count]
**Key files:** [list significant files]
```
