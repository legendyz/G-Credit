# TD-002: ESLint Type-Safety Cleanup

**Task ID:** TD-002 (Backlog)  
**Epic:** Epic 10 - Production-Ready MVP  
**Sprint:** Backlog (Recommended: Sprint 9 or 10)  
**Priority:** LOW 🟢  
**Estimated Hours:** 16h  
**Actual Hours:** -  
**Status:** backlog 📋  
**Created:** 2026-02-03  
**Completed:** -

---

## Context

**Technical Debt TD-002**: ESLint type-safety warnings accumulated during rapid development.

**Current State (as of 2026-02-03):**
- ESLint errors: 0 ✅
- ESLint warnings: 888 ⚠️
- CI/CD status: Passing (warnings don't block)

**Warning Breakdown:**

| Rule | Count (Est.) | Severity | Description |
|------|--------------|----------|-------------|
| `no-unsafe-member-access` | ~300 | Medium | Accessing properties on `any` type |
| `no-unsafe-argument` | ~200 | Medium | Passing `any` to typed parameters |
| `no-unsafe-assignment` | ~150 | Medium | Assigning `any` to typed variables |
| `no-unused-vars` | ~100 | High | Unused imports/variables |
| `require-await` | ~20 | High | Async functions without await |
| `unbound-method` | ~30 | Low | Jest mock patterns |
| Other | ~88 | Low | Miscellaneous |

**Affected Modules:**
1. `badge-issuance/` - ~250 warnings
2. `badge-sharing/` - ~150 warnings
3. `microsoft-graph/` - ~120 warnings
4. `badge-templates/` - ~80 warnings
5. `test/` (E2E tests) - ~200 warnings
6. Other modules - ~88 warnings

**Impact:**
- ⚠️ Code quality: Type safety bypassed
- ⚠️ Maintainability: Harder to refactor safely
- ⚠️ IDE support: Reduced IntelliSense accuracy
- ✅ Runtime: No impact (TypeScript compiles)
- ✅ CI/CD: No impact (warnings allowed)

**Reference:** Sprint 8, Story 8.8 CI/CD integration

---

## Objectives

**As a** Developer,  
**I want** the codebase to have zero ESLint warnings,  
**So that** I can trust TypeScript's type safety and catch bugs at compile time.

---

## Acceptance Criteria

### AC1: Define TypeScript Interfaces
**Given** controllers and services using `any` for request.user  
**When** developer reviews the code  
**Then** proper interfaces (e.g., `JwtUser`, `AuthenticatedRequest`) are defined

**Example:**
```typescript
// Before
getProfile(@CurrentUser() user: any) {
  return user.userId; // No type safety
}

// After
interface JwtUser {
  userId: string;
  email: string;
  role: UserRole;
}

getProfile(@CurrentUser() user: JwtUser) {
  return user.userId; // Full type safety
}
```

### AC2: Fix Unused Variables
**Given** ESLint reports unused imports/variables  
**When** developer reviews the code  
**Then** unused code is removed or prefixed with `_`

**Acceptance:**
- [ ] All `no-unused-vars` warnings resolved
- [ ] No dead code remains

### AC3: Fix Async Functions
**Given** async functions without `await` statements  
**When** developer reviews the code  
**Then** unnecessary `async` is removed or `await` is added where needed

**Acceptance:**
- [ ] All `require-await` warnings resolved
- [ ] Async functions are intentional

### AC4: Module-by-Module Cleanup
**Given** warnings are distributed across modules  
**When** fixing warnings  
**Then** complete one module at a time to minimize merge conflicts

**Suggested Order:**
1. `common/` - Shared utilities, high impact
2. `modules/auth/` - Auth flow, security critical
3. `badge-issuance/` - Core feature
4. `badge-templates/` - Template management
5. `badge-verification/` - Verification flow
6. `badge-sharing/` - Sharing features
7. `microsoft-graph/` - External integrations
8. `test/` - E2E tests (lowest priority)

### AC5: Zero Warnings Target
**Given** all modules have been cleaned up  
**When** running `npm run lint`  
**Then** output shows 0 errors and 0 warnings

---

## Implementation Notes

### Quick Wins (2-4 hours)
1. **Unused imports** - Auto-fixable with IDE
2. **Unused variables** - Prefix with `_` or remove
3. **Simple async fixes** - Remove unnecessary `async`

### Medium Effort (4-8 hours)
1. **Define shared interfaces** in `common/interfaces/`
2. **Update decorators** like `@CurrentUser()` with proper types
3. **Fix controller parameter types**

### Higher Effort (4-8 hours)
1. **Service method return types** - Add explicit types
2. **Prisma result types** - Use generated types
3. **Test file types** - Add proper mocking types

### ESLint Configuration

Current configuration in `eslint.config.mjs`:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/unbound-method': 'warn',
  '@typescript-eslint/require-await': 'warn',
}
```

**After cleanup**, consider changing to `'error'`:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'warn', // Enable gradually
  '@typescript-eslint/no-unsafe-*': 'error',    // Enforce type safety
  '@typescript-eslint/no-unused-vars': 'error', // No dead code
}
```

---

## Testing Requirements

### Verification Steps
1. Run `npm run lint` - Should show 0 problems
2. Run `npm run build` - Should compile without errors
3. Run `npm run test` - Unit tests pass
4. Run `npm run test:e2e` - E2E tests pass

### Regression Check
- No behavioral changes expected
- Type-only changes should not affect runtime

---

## Dependencies

- **Depends on:** Story 8.8 (E2E Test Isolation) ✅ Complete
- **Blocks:** None (optional quality improvement)

---

## Estimation Breakdown

| Phase | Hours | Description |
|-------|-------|-------------|
| Quick wins | 2h | Unused vars, simple fixes |
| Shared interfaces | 4h | Define and apply interfaces |
| Controller/Service types | 4h | Update parameter types |
| Test file cleanup | 4h | E2E test type fixes |
| Verification & testing | 2h | Ensure no regressions |
| **Total** | **16h** | Can be split across sprints |

---

## Notes

- This is a **quality improvement** task, not a bug fix
- Can be done incrementally across multiple sprints
- Consider pairing with new feature development (fix warnings in files you touch)
- Low priority compared to feature development
- High value for long-term maintainability

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-02-03 | Dev Agent | Created TD-002 from Sprint 8 CI/CD work |
