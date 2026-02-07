# Story TD-017: Fix TypeScript Compiler (tsc) Type Errors

**Status:** backlog  
**Epic:** Technical Debt Cleanup  
**Sprint:** Deferred to Sprint 10  
**Priority:** P2  
**Estimated Hours:** 6h (Phase A: 4h src+test, Phase B: 2h verification+CI)  
**Dependencies:** [] (可与其他 Story 并行)  
**Source:** TD-015 SM Acceptance Review (2026-02-07)  
**Category:** Type Safety

---

## Story

As a **Developer**,  
I want **to fix all `tsc --noEmit` type errors in the backend codebase**,  
So that **the TypeScript compiler produces zero errors, enabling strict type checking in CI and preventing type-related runtime bugs**.

---

## Background

### Discovery

During TD-015 (ESLint Type Safety Cleanup) SM acceptance review on 2026-02-07, `npx tsc --noEmit` was run and found **138 errors**. Investigation revealed:

- **129 errors** were **pre-existing** (before TD-015)
- **9 errors** were **newly introduced** by TD-015 (stricter `RequestWithUser` type causing mock mismatches)
- These errors were never tracked because `tsc --noEmit` was not enforced in CI

### Why This Was Not Caught Earlier

- ESLint and Jest both use their own TypeScript compilation (ts-jest, @typescript-eslint/parser)
- `tsc --noEmit` is not part of `npm run lint` or `npm test`
- Tests pass because Jest's `ts-jest` is more lenient with type checking than `tsc --noEmit`
- No CI gate for `tsc --noEmit` exists

### Impact

- **Runtime risk:** Low — Jest/ESLint already catch most issues
- **Developer experience:** Medium — IDE shows red squiggles in affected files
- **CI/CD readiness:** High — cannot enable strict type checking in CI pipeline until fixed

---

## Current Error Baseline (2026-02-07)

**Total: 138 errors across 26 files**

### Error Type Breakdown

| Error Code | Count | Description | Fix Strategy |
|-----------|-------|-------------|-------------|
| **TS2339** | 56 | Property does not exist on type | Add type assertions or interface extensions |
| **TS18048** | 28 | Value is possibly 'undefined' | Add null checks or non-null assertions |
| **TS2322** | 16 | Type 'X' is not assignable to type 'Y' | Fix type mismatches (Prisma JSON, mock data) |
| **TS2345** | 16 | Argument of type 'X' is not assignable to parameter of type 'Y' | Fix mock objects to match expected interfaces |
| **TS7053** | 10 | Element implicitly has 'any' type (index access) | Add index signatures or type the access |
| **TS7006** | 10 | Parameter implicitly has 'any' type | Add parameter type annotations |
| **TS18046** | 1 | Value is of type 'unknown' | Add type narrowing |
| **TS2367** | 1 | Comparison always false | Fix comparison logic |
| **Total** | **138** | | |

### File Breakdown (src vs test)

| Category | Files | Errors | % of Total |
|----------|-------|--------|-----------|
| **Test files** (`.spec.ts`, `.e2e-spec.ts`, `factory.ts`) | 21 | 124 | 90% |
| **Source files** (`.ts`) | 5 | 14 | 10% |

### Top Files by Error Count

| File | Errors | Error Types |
|------|--------|-------------|
| `badge-issuance.service.spec.ts` | 27 | TS2322, TS7006, TS2345 |
| `admin-users.service.spec.ts` | 25 | TS2339, TS2345 |
| `badge-notification.builder.spec.ts` | 23 | TS18048, TS2339 |
| `teams-action.controller.spec.ts` | 14 | TS2339, TS2345 |
| `badge-analytics.controller.spec.ts` | 12 | TS2345 (RequestWithUser mocks) |
| `badge-issuance-teams.integration.spec.ts` | 5 | TS2339, TS2322 |
| `badge-issuance.service.ts` | 4 | TS2322 (Prisma JSON types) |
| `badge-templates.service.ts` | 3 | TS2322 (Prisma update types) |
| Other files (18) | 25 | Mixed |

### Source File Errors (14 errors — Priority)

| File | Line | Error | Description |
|------|------|-------|-------------|
| `badge-issuance.service.ts` | 137 | TS2322 | JsonValue → InputJsonValue |
| `badge-issuance.service.ts` | 454 | TS2322 | `{ hasSome: string[] }` → Prisma filter type |
| `badge-issuance.service.ts` | 583 | TS2322 | Same hasSome pattern |
| `badge-issuance.service.ts` | 900 | TS2322 | Same hasSome pattern |
| `csv-parser.service.ts` | 25 | TS2345 | Argument type mismatch |
| `csv-parser.service.ts` | 28 | TS2345 | Argument type mismatch |
| `milestones.service.ts` | 36 | TS2322 | JsonValue → InputJsonValue |
| `milestones.service.ts` | 67 | TS2322 | Prisma update input type |
| `badge-templates.service.ts` | 67 | TS2322 | Prisma update input type |
| `badge-templates.service.ts` | 323 | TS2322 | Prisma update input type |
| `badge-templates.service.ts` | 330 | TS2322 | Prisma update input type |
| `badge-analytics.service.ts` | 76 | TS2322 | Type mismatch |
| `multipart-json.interceptor.ts` | 118 | TS2322 | Regex callback type |
| `teams-badge-notification.service.ts` | 198 | TS2322 | Type mismatch |

### TD-015 Introduced Errors (9 errors — RequestWithUser mocks)

These errors are a side-effect of TD-015's improvement: replacing `req: any` with `req: RequestWithUser`. The mock objects in spec files now need `email` and `role` properties:

| File | Error | Cause |
|------|-------|-------|
| `badge-sharing.controller.spec.ts` ×3 | TS2345 | `{ userId }` missing `email`/`role` |
| `badge-analytics.controller.spec.ts` ×6 | TS2345 | `{ user: { userId, email } }` missing `role` |

---

## Acceptance Criteria

1. [ ] **AC1: Fix all source file errors (14 errors → 0)**
   - All Prisma JSON/filter type mismatches resolved
   - `csv-parser.service.ts` argument types fixed
   - `multipart-json.interceptor.ts` callback typed
   - No new `as any` casts (use proper Prisma types)

2. [ ] **AC2: Fix all test file errors (124 errors → 0)**
   - Mock objects match interface contracts (RequestWithUser, Prisma types)
   - Null checks or `!` assertions for optional Adaptive Card properties
   - Parameter types added to callback functions
   - Factory files produce correctly typed objects

3. [ ] **AC3: Zero regressions**
   - All 992+ tests pass (510 unit + 339 frontend + 143 E2E)
   - All existing ESLint warnings stay ≤284
   - No new ESLint warnings introduced

4. [ ] **AC4: CI gate established**
   - `npx tsc --noEmit` added to `package.json` scripts as `type-check`
   - Documented as required check before PR merge
   - Sprint 11 target: Add to CI pipeline

---

## Tasks / Subtasks

### Phase A: Fix Type Errors (4h)

- [ ] **A.1** Fix source file errors — Prisma types (1.5h)
  - Fix `JsonValue` → `Prisma.InputJsonValue` in badge-issuance, milestones, badge-templates
  - Fix `hasSome` filter type in badge-issuance.service.ts (3 occurrences)
  - Fix csv-parser.service.ts argument types
  - Fix multipart-json.interceptor.ts callback type
  
- [ ] **A.2** Fix test file errors — RequestWithUser mocks (1h)
  - Update mock objects in badge-sharing.controller.spec.ts
  - Update mock objects in badge-analytics.controller.spec.ts  
  - Ensure all RequestWithUser mocks include `{ userId, email, role }`
  
- [ ] **A.3** Fix test file errors — TS2339/TS18048 (1.5h)
  - Fix property-not-exist errors in admin-users.service.spec.ts
  - Fix nullable access in badge-notification.builder.spec.ts
  - Fix index signatures in teams-action.controller.spec.ts
  - Fix remaining spec file type annotations

### Phase B: Verification & CI (2h)

- [ ] **B.1** Full verification (1h)
  - Run `npx tsc --noEmit` → 0 errors
  - Run `npm test` → 0 failures
  - Run `npm run lint` → ≤284 warnings
  
- [ ] **B.2** Add type-check script and document (1h)
  - Add `"type-check": "tsc --noEmit"` to package.json scripts
  - Update coding-standards.md with tsc gate requirement
  - Document in Sprint 10 planning as CI pipeline candidate

---

## Dev Notes

### Common Fix Patterns

```typescript
// TS2322: Prisma JsonValue → InputJsonValue
// ❌ Before
const data = { metadata: existingRecord.metadata }; // metadata is JsonValue

// ✅ After
const data = { metadata: existingRecord.metadata as Prisma.InputJsonValue };

// TS2345: RequestWithUser mock incomplete
// ❌ Before (TD-015 introduced)
const mockReq = { user: { userId: 'test-id', email: 'test@test.com' } };

// ✅ After  
const mockReq = { user: { userId: 'test-id', email: 'test@test.com', role: UserRole.ADMIN } } as RequestWithUser;

// TS18048: Possibly undefined (Adaptive Card builder)
// ❌ Before
factSet.facts.push(newFact); // facts is possibly undefined

// ✅ After
factSet.facts!.push(newFact); // or: if (factSet.facts) { factSet.facts.push(newFact); }

// TS2339: Property does not exist
// ❌ Before
const value = result.someProperty; // result typed without someProperty

// ✅ After
const value = (result as ExpectedType).someProperty;
```

### Architecture Notes
- 90% of errors are in test files — minimal risk to production code
- Prisma `JsonValue` vs `InputJsonValue` is a known Prisma typing limitation
- `RequestWithUser` mock fixes are mechanical (add `role` field)
- No logic changes required — pure type annotation fixes

---

## References

- **Discovery:** TD-015 SM Acceptance Review (2026-02-07)
- **Related:** TD-015 (ESLint cleanup) — tsc errors partially overlapping
- **Future:** Phase 3 (ESLint remaining 284 warnings) + Phase 4 (enable errors in CI)
- **Coding Standards:** `docs/development/coding-standards.md`
