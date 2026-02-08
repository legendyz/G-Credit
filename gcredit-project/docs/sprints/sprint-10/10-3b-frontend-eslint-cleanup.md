# Story 10.3b: TD-019 — Frontend ESLint Cleanup + CI Gate

**Sprint:** 10  
**Priority:** 🔴 HIGH  
**Estimate:** 3.5h  
**Type:** Technical Debt (TD-019)  
**Dependencies:** None  
**Discovered:** During Story 10.3 development — frontend ESLint never integrated into CI

---

## User Story

As a developer, I want the frontend codebase to have 0 ESLint errors and 0 warnings with CI enforcement, so that frontend code quality matches the backend zero-tolerance standard established in Story 10.2.

---

## Background & Problem

Story 10.2 achieved **0 errors + 0 warnings** for backend ESLint with `--max-warnings=0` CI gate. However, during Story 10.3 development we discovered:

1. **Frontend ESLint has 49 errors + 21,363 warnings** — never tracked or enforced
2. **CI pipeline does NOT run frontend lint** — only `npx vitest run`
3. **No `.gitattributes` file** — causes 21,354 CRLF prettier warnings on Windows

### Error Breakdown

| Category | Count | Type | Fix Strategy |
|----------|-------|------|-------------|
| prettier/prettier (CRLF) | 21,354 | ⚠️ Warning | `.gitattributes` + `eslint --fix` (auto) |
| react-hooks/exhaustive-deps | 9 | ⚠️ Warning | Add missing deps or eslint-disable with justification |
| prettier/prettier (other) | 13 | ❌ Error | `eslint --fix` (auto) |
| react-compiler/* | 24 | ❌ Error | Refactor: setState in render/effect, ref access during render |
| @typescript-eslint/no-explicit-any | 9 | ❌ Error | Replace `any` with proper types |
| @typescript-eslint/no-unused-vars | 9 | ❌ Error | Remove or prefix with `_` |
| react-refresh/only-export-components | 3 | ❌ Error | Extract non-component exports |
| jsx-a11y/* | 4 | ❌ Error | Fix heading order, ARIA roles |
| **TOTAL** | **21,425** | | |

---

## Acceptance Criteria

### AC1: Line Endings Normalized
- [ ] `.gitattributes` file created with `* text=auto eol=lf`
- [ ] All frontend files normalized to LF
- [ ] 0 prettier/prettier CRLF warnings

### AC2: Frontend ESLint Clean
- [ ] `npx eslint .` in `frontend/` reports **0 errors + 0 warnings**
- [ ] All 49 errors fixed (not suppressed unless justified)
- [ ] All 9 react-hooks/exhaustive-deps warnings resolved

### AC3: CI Frontend Lint Gate
- [ ] `npm run lint` added to CI `frontend-tests` job in `.github/workflows/test.yml`
- [ ] Frontend `package.json` lint script uses `--max-warnings=0`
- [ ] CI blocks merge on any frontend lint error or warning

### AC4: Zero Regressions
- [ ] All existing frontend tests pass (`npx vitest run`)
- [ ] All backend tests pass (534+)
- [ ] No UI functionality broken

### AC5: Commit Standards
- [ ] Commit message: `fix(frontend): TD-019 ESLint cleanup + CI zero-tolerance gate`
- [ ] Includes file count and summary of changes

---

## Implementation Steps

### Step 1: Create .gitattributes (15min)
```
# Root of repository
* text=auto eol=lf
*.png binary
*.jpg binary
*.ico binary
*.woff binary
*.woff2 binary
```

### Step 2: Normalize Line Endings (15min)
```bash
cd gcredit-project/frontend
# Remove index to force re-checkout with correct line endings  
git rm --cached -r .
git reset HEAD .
git checkout .
# Then: npx eslint --fix .
```

### Step 3: Fix Auto-fixable Errors (30min)
```bash
npx eslint --fix .
```
This should clear all prettier errors (CRLF + formatting).

### Step 4: Fix Manual Errors (2h)
Priority order:
1. **no-unused-vars (9):** Remove unused imports/variables or prefix with `_`
2. **no-explicit-any (9):** Replace with proper TypeScript types
3. **react-compiler (24):** Refactor setState-in-render, ref-access-during-render patterns
4. **react-refresh (3):** Move non-component exports to separate files
5. **jsx-a11y (4):** Fix heading hierarchy, ARIA roles
6. **react-hooks/exhaustive-deps (9):** Add missing dependencies or document suppression

### Step 5: Update CI Pipeline (15min)
In `.github/workflows/test.yml`, add to `frontend-tests` job:
```yaml
- name: Lint frontend
  working-directory: gcredit-project/frontend
  run: npm run lint
```

Update `frontend/package.json`:
```json
"lint": "eslint . --max-warnings=0"
```

### Step 6: Verify (15min)
```bash
# Frontend lint clean
cd gcredit-project/frontend && npx eslint . --max-warnings=0

# Frontend tests pass
npx vitest run

# Backend tests pass
cd ../backend && npm test
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Compiler fixes change behavior | Medium | Run all Vitest tests after each fix |
| .gitattributes causes git diff noise | Low | Single commit for line ending normalization |
| CI pipeline change breaks workflow | Low | Test locally first with `act` or dry run |

---

## Definition of Done
- [ ] All ACs met
- [ ] SM acceptance verified programmatically
- [ ] sprint-status.yaml updated
- [ ] backlog.md updated
