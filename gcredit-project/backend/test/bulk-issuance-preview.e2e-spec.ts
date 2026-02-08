/**
 * E2E Tests for Bulk Issuance Preview & Confirm Endpoints
 * Story 8.3: Bulk Issuance Preview UI
 *
 * Tests the preview, confirm, and error-report endpoints:
 * - GET /api/bulk-issuance/preview/:sessionId (with optional pagination)
 * - POST /api/bulk-issuance/confirm/:sessionId
 * - GET /api/bulk-issuance/error-report/:sessionId
 * - IDOR prevention (ARCH-C2)
 * - RBAC enforcement
 */

import {
  TestContext,
  TestUser,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
} from './helpers/test-setup';

describe('Bulk Issuance Preview & Confirm (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let employeeUser: TestUser;
  let activeTemplateId: string;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-preview');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Create an ACTIVE badge template
    const template = await ctx.templateFactory.createActive({
      name: 'Preview Test Badge',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;

    // Upload a valid CSV to create a session for preview tests
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${adminUser.user.email},https://example.com/ev1,Good work`,
    ].join('\n');

    const uploadResponse = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'preview-test.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const body = uploadResponse.body as { sessionId: string };
    sessionId = body.sessionId;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // --- Preview endpoint ---

  it('GET /api/bulk-issuance/preview/:sessionId — returns enriched preview data', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get(`/api/bulk-issuance/preview/${sessionId}`)
      .expect(200);

    const body = response.body as {
      sessionId: string;
      totalRows: number;
      validRows: number;
      errorRows: number;
      rows: Array<{ badgeName?: string; recipientName?: string }>;
      summary: { byTemplate: Array<{ templateName: string; count: number }> };
    };

    expect(body.sessionId).toBe(sessionId);
    expect(body.totalRows).toBeGreaterThanOrEqual(1);
    expect(body.rows).toBeDefined();
    expect(body.summary).toBeDefined();
    expect(body.summary.byTemplate).toBeInstanceOf(Array);
  });

  it('GET /api/bulk-issuance/preview/:sessionId — supports pagination query params', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get(`/api/bulk-issuance/preview/${sessionId}?page=1&pageSize=10`)
      .expect(200);

    const body = response.body as {
      rows: unknown[];
      page: number;
      pageSize: number;
      totalPages: number;
    };

    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
  });

  // --- IDOR prevention (ARCH-C2) ---

  it('GET /api/bulk-issuance/preview/:sessionId — IDOR returns 403 for different user', async () => {
    await authRequest(ctx.app, issuerUser.token)
      .get(`/api/bulk-issuance/preview/${sessionId}`)
      .expect(403);
  });

  // --- RBAC ---

  it('GET /api/bulk-issuance/preview/:sessionId — EMPLOYEE role returns 403', async () => {
    await authRequest(ctx.app, employeeUser.token)
      .get(`/api/bulk-issuance/preview/${sessionId}`)
      .expect(403);
  });

  // --- 404 for non-existent session ---

  it('GET /api/bulk-issuance/preview/:sessionId — non-existent session returns 404', async () => {
    await authRequest(ctx.app, adminUser.token)
      .get('/api/bulk-issuance/preview/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  // --- Confirm endpoint ---

  it('POST /api/bulk-issuance/confirm/:sessionId — confirms and processes badges', async () => {
    // Create a fresh session for confirm test
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${adminUser.user.email},https://example.com/ev2,Confirm test`,
    ].join('\n');

    const uploadResponse = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'confirm-test.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const uploadBody = uploadResponse.body as { sessionId: string };
    const confirmSessionId = uploadBody.sessionId;

    const response = await authRequest(ctx.app, adminUser.token)
      .post(`/api/bulk-issuance/confirm/${confirmSessionId}`)
      .expect(201);

    const body = response.body as {
      success: boolean;
      processed: number;
      failed: number;
      results: Array<{ row: number; status: string }>;
    };

    expect(body.processed).toBeGreaterThanOrEqual(0);
    expect(typeof body.failed).toBe('number');
    expect(body.results).toBeInstanceOf(Array);
  });

  it('POST /api/bulk-issuance/confirm/:sessionId — IDOR returns 403', async () => {
    await authRequest(ctx.app, issuerUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionId}`)
      .expect(403);
  });
});

describe('Bulk Issuance Error Report (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let activeTemplateId: string;
  let sessionWithErrorsId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-errreport');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');

    const template = await ctx.templateFactory.createActive({
      name: 'Error Report Test Badge',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;

    // Upload CSV with invalid rows to generate errors
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${adminUser.user.email},https://example.com/ev,Valid row`,
      'invalid-template-id,nobody@nowhere.com,,Error row',
    ].join('\n');

    const uploadResponse = await authRequest(ctx.app, adminUser.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'errors-test.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const body = uploadResponse.body as {
      sessionId: string;
      errorRows: number;
    };
    sessionWithErrorsId = body.sessionId;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  it('GET /api/bulk-issuance/error-report/:sessionId — downloads CSV error report', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get(`/api/bulk-issuance/error-report/${sessionWithErrorsId}`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(typeof response.text).toBe('string');
    expect(response.text).toContain('Row');
    expect(response.text).toContain('Error');
  });

  it('GET /api/bulk-issuance/error-report/:sessionId — IDOR returns 403', async () => {
    await authRequest(ctx.app, issuerUser.token)
      .get(`/api/bulk-issuance/error-report/${sessionWithErrorsId}`)
      .expect(403);
  });
});
