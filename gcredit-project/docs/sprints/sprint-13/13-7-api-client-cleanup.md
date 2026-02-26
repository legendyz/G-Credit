# Story 13.7: API Client Cleanup (Remove axios + Inline Migrations)

Status: dev

## Story

As a **developer maintaining the codebase**,
I want a single, consistent API client pattern across all pages,
So that every API call benefits from the 401 interceptor and cookie handling automatically.

## Context

- Feature Audit P1-3: API Client Unification
- `axios` is in `package.json` but has 0 active imports (dead dependency)
- Some pages may call `apiFetch()` inline instead of through API lib + hooks
- Story 13.5 adds 401 interceptor to `apiFetch()` — all API calls should route through it
- Also addresses P1-8 fix if any remaining `localStorage` token references exist

## Acceptance Criteria

1. [ ] `axios` removed from `frontend/package.json` and `package-lock.json`
2. [ ] No remaining `import axios` or `require('axios')` in any frontend file
3. [ ] Pages that call `apiFetch()` inline (not through API lib + hooks) are migrated:
   - Identify remaining inline `apiFetch` calls in page components
   - Create missing API lib functions where needed
   - Convert page components to use `useQuery`/`useMutation` hooks where appropriate
4. [ ] All API lib files (`*Api.ts`) confirmed to use `apiFetch()` / `apiFetchJson()`
5. [ ] No remaining `localStorage.getItem('accessToken')` or `localStorage.getItem('refreshToken')` in API-calling code
6. [ ] Tests: all existing tests pass, no `axios` import in test files

## Tasks / Subtasks

- [ ] Task 1: Remove axios dependency (AC: #1, #2)
  - [ ] `cd frontend && npm uninstall axios`
  - [ ] Verify no `import axios` or `require('axios')` in any file
  - [ ] Grep codebase: `grep -r "axios" src/` → should return 0 results
  - [ ] Check test files too: `grep -r "axios" src/**/*.test.*`
- [ ] Task 2: Audit inline `apiFetch` calls (AC: #3)
  - [ ] Scan page components for direct `apiFetch()` calls (not through hooks/lib)
  - [ ] List all inline calls with file + line number
  - [ ] For each: determine if existing API lib function covers it or if new one needed
  - [ ] Create migration plan: which calls → which hooks
- [ ] Task 3: Create missing API lib functions (AC: #3, #4)
  - [ ] For each identified inline call without API lib coverage:
    - Create function in appropriate `*Api.ts` file
    - Follow existing pattern: `export async function doSomething(...): Promise<T>`
    - Use `apiFetchJson()` for JSON responses
  - [ ] Verify all `*Api.ts` files use `apiFetch()` / `apiFetchJson()` exclusively
- [ ] Task 4: Migrate page components to hooks (AC: #3)
  - [ ] Replace inline `apiFetch` calls with `useQuery`/`useMutation` hooks
  - [ ] Follow existing patterns from Sprint 12 pages (e.g., `useSkillCategories()`)
  - [ ] Ensure proper loading/error states maintained
  - [ ] Test each migrated page manually (smoke test)
- [ ] Task 5: Remove legacy localStorage token references (AC: #5)
  - [ ] Grep: `localStorage.getItem('accessToken')`, `localStorage.getItem('refreshToken')`
  - [ ] Grep: `localStorage.setItem('access`, `localStorage.removeItem('access`
  - [ ] Remove any found references — all auth is cookie-based now
  - [ ] Verify auth store doesn't use localStorage for tokens
- [ ] Task 6: Verification and tests (AC: #6)
  - [ ] Run full frontend test suite: `npm test`
  - [ ] Run lint: `npm run lint`
  - [ ] Run build: `npm run build`
  - [ ] Verify 0 regressions in existing tests

## Dev Notes

### Expected Scope
- `axios` removal: ~5 min (npm uninstall + verify no imports)
- Inline migration: depends on how many inline calls remain — audit first
- Sprint 12 already migrated many pages to API lib + hooks pattern
- This story should be small (3-4h) because most cleanup was done incrementally

### Order Dependency
- Must be done AFTER Story 13.5 (401 interceptor) — so migrated calls benefit from interception
- Can be done in parallel with Story 13.6 (idle timeout) — independent concerns

### Key References
- `src/lib/apiFetch.ts` — central API client
- `src/lib/*Api.ts` — API library modules
- `src/hooks/use*.ts` — React Query hooks
