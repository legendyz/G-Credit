/**
 * E2E Tests for Bulk Issuance Upload Endpoint
 * Story 8.2: CSV Upload & Parsing
 *
 * Tests the POST /api/bulk-issuance/upload endpoint for:
 * - Valid CSV upload and session creation
 * - File validation (type, headers)
 * - RBAC enforcement
 * - XSS sanitization + CRLF support (combined test)
 * - IDOR prevention
 * - Rate limiting (ARCH-C3)
 *
 * NOTE: The upload endpoint has a rate limit of 3 per 5 min per IP (ARCH-C3).
 *       Functional tests are consolidated to stay within this limit.
 *       Validation edge cases (>20 rows, missing headers, EXAMPLE rows) are
 *       thoroughly covered by 86 unit tests in the service/validation specs.
 */

import {
  TestContext,
  TestUser,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
} from './helpers/test-setup';

/**
 * Functional tests — consolidated to stay within rate limit (3 POSTs max)
 *
 * Guard execution order: JwtAuthGuard → RolesGuard → ThrottlerGuard
 * Tests blocked by RolesGuard (EMPLOYEE) don't count against throttle.
 */
describe('Bulk Issuance Upload — Functional (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let employeeUser: TestUser;
  let activeTemplateId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-upload-fn');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Create an ACTIVE badge template
    const template = await ctx.templateFactory.createActive({
      name: 'Leadership Excellence',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // --- RBAC test (blocked by RolesGuard before ThrottlerGuard, doesn't count) ---

  it('POST /api/bulk-issuance/upload — EMPLOYEE role returns 403 (RBAC)', async () => {
    const csvContent = 'badgeTemplateId,recipientEmail\ntest,test@test.com';

    await authRequest(ctx.app, employeeUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      })
      .expect(403);
  });

  // --- Upload 1 of 3: Valid CSV with XSS + CRLF (ARCH-C7, ARCH-C4) ---

  it('POST /api/bulk-issuance/upload — valid CSV with CRLF + XSS sanitization', async () => {
    // CSV with CRLF line endings AND XSS in narrativeJustification
    const csvContent =
      `badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification\r\n` +
      `${activeTemplateId},${issuerUser.user.email},https://example.com/evidence,"<script>alert('xss')</script>Good work"`;

    const response = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'test-upload.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const body = response.body as {
      sessionId: string;
      totalRows: number;
    };
    // Session created
    expect(body.sessionId).toBeDefined();
    expect(body.totalRows).toBe(1);

    // XSS sanitized (ARCH-C7) — no script tags in response
    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain('<script>');

    // IDOR test: try to access the session as a different user
    const sessionId = body.sessionId;
    await authRequest(ctx.app, issuerUser.token)
      .get(`/api/bulk-issuance/preview/${sessionId}`)
      .expect(403);
  });

  // --- Upload 2 of 3: No file → 400 ---

  it('POST /api/bulk-issuance/upload — no file returns 400', async () => {
    await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .expect(400);
  });

  // --- Upload 3 of 3: Non-CSV file → 400 ---

  it('POST /api/bulk-issuance/upload — non-CSV file returns 400', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from('not csv content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    const body = response.body as { message: string };
    expect(body.message).toContain('CSV');
  });
});

/**
 * Rate Limiting test — uses real ThrottlerGuard (ARCH-C3)
 * Separate describe to get a fresh throttle counter.
 */
describe('Bulk Issuance Upload — Rate Limiting (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let activeTemplateId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-upload-rl');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');

    const template = await ctx.templateFactory.createActive({
      name: 'Rate Limit Test Template',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  it('POST /api/bulk-issuance/upload — 11th upload within 5 min returns 429 (ARCH-C3)', async () => {
    const makeCsv = (suffix: number) =>
      [
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
});

/**
 * Row Limit tests — validates MAX_ROWS (20) boundary (AC1)
 * Separate describe to get a fresh throttle counter.
 */
describe('Bulk Issuance Upload — Row Limit (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let activeTemplateId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-upload-rowlimit');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');

    const template = await ctx.templateFactory.createActive({
      name: 'Row Limit Test Template',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  it('POST /api/bulk-issuance/upload — 21 rows returns 400 with limit message', async () => {
    const header =
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification';
    const rows = Array.from(
      { length: 21 },
      (_, i) =>
        `${activeTemplateId},user${i}@rowlimit.test,https://example.com/ev${i},row ${i + 1}`,
    );
    const csvContent = [header, ...rows].join('\n');

    const response = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'too-many-rows.csv',
        contentType: 'text/csv',
      })
      .expect(400);

    const body = response.body as { message: string };
    expect(body.message).toContain('21 rows');
    expect(body.message).toContain('MVP limit');
    expect(body.message).toContain('split');
  });

  it('POST /api/bulk-issuance/upload — exactly 20 rows is accepted', async () => {
    const header =
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification';
    const rows = Array.from(
      { length: 20 },
      (_, i) =>
        `${activeTemplateId},user${i}@rowlimit-ok.test,https://example.com/ev${i},row ${i + 1}`,
    );
    const csvContent = [header, ...rows].join('\n');

    const response = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'exactly-20-rows.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const body = response.body as { sessionId: string; totalRows: number };
    expect(body.sessionId).toBeDefined();
    expect(body.totalRows).toBe(20);
  });
});
