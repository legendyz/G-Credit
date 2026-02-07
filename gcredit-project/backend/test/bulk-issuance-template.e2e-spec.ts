/**
 * E2E Tests for Bulk Issuance Template Endpoint
 * Story 8.1: CSV Template & Validation
 *
 * Tests the GET /api/bulk-issuance/template endpoint for:
 * - Correct CSV content and structure
 * - Dynamic date-based filename
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

describe('Bulk Issuance Template (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let employeeUser: TestUser;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-template');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    employeeUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  it('GET /api/bulk-issuance/template — returns 200 with CSV content-type', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get('/api/bulk-issuance/template')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
  });

  it('GET /api/bulk-issuance/template — CSV has correct headers', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get('/api/bulk-issuance/template')
      .expect(200);

    const csvContent = response.text;
    // Strip BOM if present
    const cleanCsv = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanCsv.split('\n').filter((l) => !l.startsWith('#'));
    const headerLine = lines[0];

    expect(headerLine).toContain('badgeTemplateId');
    expect(headerLine).toContain('recipientEmail');
    expect(headerLine).toContain('evidenceUrl');
    expect(headerLine).toContain('narrativeJustification');
  });

  it('GET /api/bulk-issuance/template — CSV contains EXAMPLE-DELETE-THIS-ROW in example rows', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get('/api/bulk-issuance/template')
      .expect(200);

    const csvContent = response.text;
    expect(csvContent).toContain('EXAMPLE-DELETE-THIS-ROW');
    expect(csvContent).toContain('DELETE THIS EXAMPLE ROW BEFORE UPLOAD');
  });

  it('GET /api/bulk-issuance/template — response has Content-Disposition with dynamic date filename', async () => {
    const response = await authRequest(ctx.app, adminUser.token)
      .get('/api/bulk-issuance/template')
      .expect(200);

    const contentDisposition = response.headers['content-disposition'];
    expect(contentDisposition).toBeDefined();
    expect(contentDisposition).toContain('bulk-badge-issuance-template-');
    // Should match date pattern YYYY-MM-DD
    expect(contentDisposition).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('GET /api/bulk-issuance/template — EMPLOYEE role returns 403 Forbidden', async () => {
    await authRequest(ctx.app, employeeUser.token)
      .get('/api/bulk-issuance/template')
      .expect(403);
  });

  it('GET /api/bulk-issuance/template — ISSUER role has access', async () => {
    await authRequest(ctx.app, issuerUser.token)
      .get('/api/bulk-issuance/template')
      .expect(200);
  });
});
