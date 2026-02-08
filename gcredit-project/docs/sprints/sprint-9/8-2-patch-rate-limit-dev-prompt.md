# Story 8.2 Patch: ARCH-C3 Rate Limit Adjustment

**Date:** 2026-02-07  
**Type:** Post-implementation patch  
**Requested by:** PM (John) + Architect (Winston)  
**Effort:** 30 minutes  
**Risk:** Low — no new features, production security preserved

---

## Background

During Story 8.2 development, the ARCH-C3 rate limit (3 uploads / 5 minutes) was found to block E2E testing. PM requested an architecture review. The Architect confirmed that raising the production limit to **10/5min** is safe because:

- The endpoint requires **JWT + ISSUER/ADMIN role** — anonymous DoS is impossible
- File size is already capped (`MAX_FILE_SIZE`) — per-request resource cost has a ceiling
- Global rate limits (10/min, 50/10min, 200/hr) remain as additional protection layers
- 10/5min ≈ one upload every 30 seconds, matching normal iterative workflow

Additionally, the limit should be **environment-configurable** so test/dev environments can use higher values.

---

## Environment Configuration

| Environment | `UPLOAD_THROTTLE_LIMIT` env var | Effective limit | Rationale |
|-------------|--------------------------------|-----------------|-----------|
| **Production** | Not set (uses default) | **10 / 5 min** | Hardcoded fallback in decorator — secure for authenticated-only endpoint |
| **Test / Dev** | `50` | **50 / 5 min** | Multiple E2E test suites may share app instance; avoids cascading 429s |
| **Rate Limit E2E test** | `10` (set in own `beforeAll`) | **10 / 5 min** | Ensures the 429 behavior is still verified at production-equivalent values |

---

## Changes Required (4 files)

### 1. `backend/src/bulk-issuance/bulk-issuance.controller.ts`

**BEFORE (line 86):**
```typescript
  @Throttle({ default: { ttl: 300000, limit: 3 } })  // 3 uploads per 5 minutes per user (ARCH-C3)
```

**AFTER:**
```typescript
  @Throttle({ default: {
    ttl: parseInt(process.env.UPLOAD_THROTTLE_TTL || '300000'),
    limit: parseInt(process.env.UPLOAD_THROTTLE_LIMIT || '10'),
  } })  // 10 uploads per 5 minutes per user (ARCH-C3, updated 2026-02-07)
```

> **Note:** The `parseInt()` with fallback ensures production gets `10/300000` without needing any env var. Test environments override via env vars.

---

### 2. `backend/.env.test`

**BEFORE:**
```dotenv
# Test Environment Configuration
# Story 8.8: E2E Test Isolation - Higher rate limits for tests

# Rate Limiting - Higher limits for E2E testing
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000
```

**AFTER:**
```dotenv
# Test Environment Configuration
# Story 8.8: E2E Test Isolation - Higher rate limits for tests

# Rate Limiting - Higher limits for E2E testing
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000

# ARCH-C3: Upload endpoint rate limit override for testing (production default: 10)
UPLOAD_THROTTLE_LIMIT=50
UPLOAD_THROTTLE_TTL=300000
```

---

### 3. `backend/test/setup.ts`

**Add after existing throttle env vars (after line 12):**
```typescript
// ARCH-C3: Upload endpoint rate limit override for E2E tests
process.env.UPLOAD_THROTTLE_LIMIT = '50';  // 50 uploads per 5 min in tests (production: 10)
process.env.UPLOAD_THROTTLE_TTL = '300000';
```

---

### 4. `backend/test/bulk-issuance-upload.e2e-spec.ts`

**Rate Limiting describe block — update to test with production-equivalent limit:**

**BEFORE:**
```typescript
describe('Bulk Issuance Upload — Rate Limiting (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let activeTemplateId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-upload-rl');
```

**AFTER:**
```typescript
describe('Bulk Issuance Upload — Rate Limiting (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let activeTemplateId: string;

  beforeAll(async () => {
    // Override to production-equivalent limit for this test block
    process.env.UPLOAD_THROTTLE_LIMIT = '10';
    ctx = await setupE2ETest('bulk-upload-rl');
```

**BEFORE (test name and loop):**
```typescript
  it('POST /api/bulk-issuance/upload — 4th upload within 5 min returns 429 (ARCH-C3)', async () => {
    const makeCsv = (suffix: number) => [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},user${suffix}@test.com,,Rate limit test ${suffix}`,
    ].join('\n');

    // Exhaust the rate limit (3 uploads allowed)
    for (let i = 0; i < 3; i++) {
      await authRequest(ctx.app, adminUser.token)
        .post('/api/bulk-issuance/upload')
        .attach('file', Buffer.from(makeCsv(i)), {
          filename: `rate-limit-${i}.csv`,
          contentType: 'text/csv',
        });
      // Don't assert status — might be 201 or 400 depending on email validation
    }

    // 4th upload should be rate limited
    await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(makeCsv(99)), {
        filename: 'rate-limit-overflow.csv',
        contentType: 'text/csv',
      })
      .expect(429);
  });
```

**AFTER:**
```typescript
  it('POST /api/bulk-issuance/upload — 11th upload within 5 min returns 429 (ARCH-C3)', async () => {
    const makeCsv = (suffix: number) => [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},user${suffix}@test.com,,Rate limit test ${suffix}`,
    ].join('\n');

    // Exhaust the rate limit (10 uploads allowed, matching production default)
    for (let i = 0; i < 10; i++) {
      await authRequest(ctx.app, adminUser.token)
        .post('/api/bulk-issuance/upload')
        .attach('file', Buffer.from(makeCsv(i)), {
          filename: `rate-limit-${i}.csv`,
          contentType: 'text/csv',
        });
      // Don't assert status — might be 201 or 400 depending on email validation
    }

    // 11th upload should be rate limited
    await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(makeCsv(99)), {
        filename: 'rate-limit-overflow.csv',
        contentType: 'text/csv',
      })
      .expect(429);
  });
```

**Add `afterAll` to restore test-wide env var:**
```typescript
  afterAll(async () => {
    // Restore test-wide limit
    process.env.UPLOAD_THROTTLE_LIMIT = '50';
    await teardownE2ETest(ctx);
  });
```

---

## Verification Checklist

```bash
# 1. All backend unit tests pass
cd gcredit-project/backend
npm run test

# 2. All E2E tests pass (including updated rate limit test)
npm run test:e2e

# 3. Verify rate limit E2E test specifically
npm run test:e2e -- --testPathPattern=bulk-issuance-upload

# 4. Lint passes
npm run lint
```

- [ ] Controller decorator uses `parseInt(process.env.UPLOAD_THROTTLE_LIMIT || '10')`
- [ ] `.env.test` contains `UPLOAD_THROTTLE_LIMIT=50`
- [ ] `test/setup.ts` sets `process.env.UPLOAD_THROTTLE_LIMIT = '50'`
- [ ] Rate limit E2E test overrides to `10` in its own `beforeAll`, exhausts 10 uploads, asserts 429 on 11th
- [ ] All existing tests pass (0 regressions)

## Commit Message

```
fix(ARCH-C3): adjust upload rate limit 3→10/5min + env-configurable

- Production default: 10 uploads/5min (was 3)
- Test/dev override via UPLOAD_THROTTLE_LIMIT env var (default: 50)
- Rate limit E2E test updated to exhaust 10 before asserting 429
- Per PM/Architect review: endpoint has JWT+RBAC, anonymous DoS impossible
```
