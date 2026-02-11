# Story 11.3: SEC-007 + DEP-001 — npm Audit Fix + Swagger Conditional Loading

**Status:** backlog  
**Priority:** 🔴 CRITICAL  
**Estimate:** 30min  
**Source:** Security Audit  

## Story

As a DevOps engineer,  
I want npm HIGH vulnerabilities fixed and Swagger UI hidden in production,  
So that known vulnerabilities are patched and API documentation isn't publicly exposed.

## Acceptance Criteria

1. [ ] `npm audit` shows 0 HIGH or CRITICAL vulnerabilities
2. [ ] Swagger UI only loads when `NODE_ENV !== 'production'`
3. [ ] `/api-docs` returns 404 in production mode
4. [ ] Swagger still works in development mode
5. [ ] No regression in existing tests

## Tasks / Subtasks

- [ ] **Task 1: npm audit fix** (AC: #1)
  - [ ] Run `cd backend && npm audit` to identify current vulnerabilities
  - [ ] Run `npm audit fix` to auto-fix compatible updates
  - [ ] If `--force` needed, evaluate breaking changes before applying
  - [ ] Verify all tests still pass

- [ ] **Task 2: Swagger conditional loading** (AC: #2, #3, #4)
  - [ ] In `main.ts` (L240-295), wrap Swagger setup in environment check:
    ```typescript
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()...;
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api-docs', app, document, {...});
      logger.log('Swagger API docs available at /api-docs');
    }
    ```
  - [ ] Verify Swagger works with `NODE_ENV=development`
  - [ ] Verify Swagger hidden with `NODE_ENV=production`

- [ ] **Task 3: Verify** (AC: #5)
  - [ ] Run `npm test`
  - [ ] Run `tsc --noEmit`

## Dev Notes

### Source Tree Components
- **main.ts:** `backend/src/main.ts` L240-295 (Swagger setup, unconditionally enabled)
- **npm audit:** Run in `backend/` directory

### Architecture Patterns
- Environment-based feature gating using `process.env.NODE_ENV`
- Swagger `persistAuthorization: true` setting should remain in dev mode

## Dev Agent Record
### Agent Model Used
### Completion Notes
### File List

## Retrospective Notes
