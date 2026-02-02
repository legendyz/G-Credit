# E2E Test Guidelines

**Document Version:** 1.0  
**Last Updated:** 2026-02-03  
**Sprint:** Sprint 8 (Story 8.8 - TD-001 Fix)

---

## Overview

This document outlines best practices for writing E2E tests in the GCredit project. Following these guidelines ensures tests run reliably in parallel without data conflicts.

**Key Achievement (Sprint 8):**
- Before: 45/71 tests failing in parallel (63% failure rate)
- After: 83/83 tests passing in parallel (100% pass rate) ✅

---

## Test Architecture

### Schema-Based Isolation

Each test suite runs in its own PostgreSQL schema, providing complete isolation:

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure PostgreSQL                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│ test_suite_a_*  │ test_suite_b_*  │  test_suite_c_*         │
│ (badge-issuance)│ (badge-templates)│ (badge-verification)   │
├─────────────────┼─────────────────┼─────────────────────────┤
│ - users         │ - users         │  - users                │
│ - badges        │ - badges        │  - badges               │
│ - templates     │ - templates     │  - templates            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Directory Structure

```
backend/test/
├── helpers/
│   ├── index.ts              # Exports all helpers
│   ├── test-database.ts      # Schema isolation utilities
│   └── test-setup.ts         # Test context setup/teardown
├── factories/
│   ├── index.ts              # Exports all factories
│   ├── user.factory.ts       # User creation factory
│   ├── badge.factory.ts      # Badge creation factory
│   └── badge-template.factory.ts  # Template factory
├── setup.ts                  # Global Jest setup
├── teardown.ts               # Global Jest teardown
└── *.e2e-spec.ts            # Test files
```

---

## Writing E2E Tests

### Basic Template

```typescript
import request from 'supertest';
import {
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
  TestContext,
  TestUser,
} from './helpers';

// Unique suite name for schema isolation
const SUITE_NAME = 'my_feature';

describe('My Feature (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;

  beforeAll(async () => {
    // Creates isolated PostgreSQL schema
    ctx = await setupE2ETest(SUITE_NAME);
    
    // Create test users with factories
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
  });

  afterAll(async () => {
    // Drops schema and cleans up
    await teardownE2ETest(ctx);
  });

  it('should do something', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get('/api/my-endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### Using Test Context

The `TestContext` object provides:

```typescript
interface TestContext {
  app: INestApplication;        // NestJS application instance
  prisma: PrismaClient;         // Prisma client for direct DB access
  schemaName: string;           // Current test schema name
  userFactory: UserFactory;     // User creation factory
  badgeFactory: BadgeFactory;   // Badge creation factory
  templateFactory: BadgeTemplateFactory;  // Template factory
}
```

### Using Factories

#### User Factory

```typescript
// Create different user roles
const admin = await ctx.userFactory.createAdmin();
const employee = await ctx.userFactory.createEmployee();
const issuer = await ctx.userFactory.createIssuer();
const manager = await ctx.userFactory.createManager();

// With custom options
const customUser = await ctx.userFactory.createEmployee({
  email: 'custom@test.com',
  firstName: 'Custom',
  lastName: 'User',
});
```

#### Badge Template Factory

```typescript
// Create active template
const template = await ctx.templateFactory.createActive({
  createdById: adminUser.user.id,
  name: 'Achievement Badge',
});

// Create draft template
const draft = await ctx.templateFactory.createDraft({
  createdById: adminUser.user.id,
});

// Create archived template
const archived = await ctx.templateFactory.createArchived({
  createdById: adminUser.user.id,
});
```

#### Badge Factory

```typescript
// Create pending badge
const pending = await ctx.badgeFactory.createPending({
  templateId: template.id,
  recipientId: employee.id,
  issuerId: adminUser.user.id,
});

// Create claimed badge
const claimed = await ctx.badgeFactory.createClaimed({
  templateId: template.id,
  recipientId: employee.id,
  issuerId: adminUser.user.id,
});

// Create revoked badge
const revoked = await ctx.badgeFactory.createRevoked({
  templateId: template.id,
  recipientId: employee.id,
  issuerId: adminUser.user.id,
  revocationReason: 'Policy violation',
});
```

### Making Authenticated Requests

```typescript
// Using authRequest helper (recommended)
const response = await authRequest(ctx.app, adminUser.token)
  .post('/api/badges')
  .send({ templateId, recipientId })
  .expect(201);

// Manual approach
const response = await request(ctx.app.getHttpServer())
  .post('/api/badges')
  .set('Authorization', `Bearer ${adminUser.token}`)
  .send({ templateId, recipientId })
  .expect(201);
```

---

## Best Practices

### ✅ DO

1. **Use unique suite names**
   ```typescript
   const SUITE_NAME = 'badge_issuance_main';  // Unique per file
   ```

2. **Use factories for test data**
   ```typescript
   const user = await ctx.userFactory.createAdmin();
   const badge = await ctx.badgeFactory.createPending({ ... });
   ```

3. **Clean up in afterAll**
   ```typescript
   afterAll(async () => {
     await teardownE2ETest(ctx);
   });
   ```

4. **Use descriptive test names**
   ```typescript
   it('should return 403 when EMPLOYEE tries to revoke badge', ...);
   ```

5. **Test one thing per test**
   ```typescript
   it('should create badge', ...);
   it('should validate required fields', ...);
   ```

### ❌ DON'T

1. **Don't use hardcoded emails**
   ```typescript
   // BAD
   email: 'admin@test.com'
   
   // GOOD - use factory
   const admin = await ctx.userFactory.createAdmin();
   ```

2. **Don't share state between tests**
   ```typescript
   // BAD - modifying shared variable
   let sharedBadge;
   it('test 1', () => { sharedBadge.status = 'CLAIMED'; });
   it('test 2', () => { expect(sharedBadge.status).toBe('PENDING'); }); // FAILS!
   
   // GOOD - create fresh data per test
   it('test 1', async () => {
     const badge = await ctx.badgeFactory.createPending({ ... });
   });
   ```

3. **Don't forget async/await**
   ```typescript
   // BAD
   it('should work', () => {
     ctx.badgeFactory.createPending({ ... }); // Missing await!
   });
   
   // GOOD
   it('should work', async () => {
     await ctx.badgeFactory.createPending({ ... });
   });
   ```

4. **Don't use setTimeout for waiting**
   ```typescript
   // BAD
   await new Promise(r => setTimeout(r, 1000));
   
   // GOOD - use proper assertions or waitFor
   expect(response.body.status).toBe('CLAIMED');
   ```

---

## Running Tests

### Local Development

```bash
# Run all E2E tests (parallel)
npm run test:e2e

# Run single test file
npm run test:e2e -- badge-issuance.e2e-spec.ts

# Run with specific workers
npm run test:e2e -- --maxWorkers=4

# Run sequentially (for debugging)
npm run test:e2e -- --maxWorkers=1

# Run with verbose output
npm run test:e2e -- --verbose

# Force exit (if tests hang)
npm run test:e2e -- --forceExit
```

### CI/CD

Tests run automatically on GitHub Actions:
- Pull requests: `--maxWorkers=2`
- Main branch: `--maxWorkers=2`

---

## Troubleshooting

### Test Hanging

If tests hang after completion:
```bash
npm run test:e2e -- --forceExit --detectOpenHandles
```

Common causes:
- Unclosed database connections
- Pending timers/intervals
- Unresolved promises

### Rate Limiting (429 Errors)

The app has rate limiting (10 requests/minute). For tests:
1. Use factory to create data directly (bypasses API)
2. Add delays between requests if needed
3. Check `test/setup.ts` for rate limit configuration

### Schema Not Created

If you see "schema does not exist" errors:
1. Check DATABASE_URL is set correctly
2. Verify PostgreSQL user has CREATE SCHEMA permission
3. Run `npx prisma db push` to sync schema

### Data Conflicts

If tests fail with unique constraint violations:
1. Ensure suite name is unique
2. Check factories generate unique emails/IDs
3. Run `--maxWorkers=1` to isolate the issue

---

## Test File Checklist

Before submitting a new E2E test file:

- [ ] Uses `setupE2ETest()` and `teardownE2ETest()`
- [ ] Has unique `SUITE_NAME`
- [ ] Uses factories for test data (no hardcoded values)
- [ ] Uses `authRequest()` for authenticated requests
- [ ] Tests pass with `--maxWorkers=4`
- [ ] Tests pass 3 consecutive runs (no flakiness)
- [ ] Follows naming convention: `*.e2e-spec.ts`

---

## Reference

### Test Context API

| Method | Description |
|--------|-------------|
| `setupE2ETest(name)` | Creates isolated schema and returns TestContext |
| `teardownE2ETest(ctx)` | Drops schema and closes connections |
| `createAndLoginUser(app, factory, role)` | Creates user and returns with JWT token |
| `authRequest(app, token)` | Creates authenticated supertest request |

### Factory Methods

| Factory | Methods |
|---------|---------|
| `UserFactory` | `createAdmin()`, `createEmployee()`, `createIssuer()`, `createManager()` |
| `BadgeTemplateFactory` | `createActive()`, `createDraft()`, `createArchived()` |
| `BadgeFactory` | `createPending()`, `createClaimed()`, `createRevoked()`, `createExpired()` |

---

## Related Documentation

- [Story 8.8: E2E Test Isolation](../sprints/sprint-8/8-8-e2e-test-isolation.md)
- [Backend README](../../gcredit-project/backend/README.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
