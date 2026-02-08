/**
 * E2E Tests for Bulk Issuance Confirm (Batch Processing)
 * Story 8.4: Batch Processing Phase 1
 *
 * Tests the synchronous batch processing via:
 * - POST /api/bulk-issuance/confirm/:sessionId
 * - Full flow: upload → validate → confirm → issued badges
 * - Partial failure handling
 * - IDOR prevention
 * - Session status transitions
 */

import {
  TestContext,
  TestUser,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  authRequest,
} from './helpers/test-setup';

describe('Bulk Issuance Confirm — Batch Processing (e2e)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerUser: TestUser;
  let activeTemplateId: string;
  let recipientUser: TestUser;

  beforeAll(async () => {
    ctx = await setupE2ETest('bulk-confirm');
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    recipientUser = await createAndLoginUser(
      ctx.app,
      ctx.userFactory,
      'employee',
    );

    // Create an ACTIVE badge template
    const template = await ctx.templateFactory.createActive({
      name: 'Batch Processing Badge',
      createdById: adminUser.user.id,
    });
    activeTemplateId = template.id;
  }, 30000);

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  /**
   * Helper: upload CSV and return sessionId
   */
  async function uploadCsv(
    user: TestUser,
    csvContent: string,
  ): Promise<string> {
    const response = await authRequest(ctx.app, user.token)
      .post('/api/bulk-issuance/upload')
      .attach('file', Buffer.from(csvContent), {
        filename: 'batch-test.csv',
        contentType: 'text/csv',
      })
      .expect(201);

    const body = response.body as { sessionId: string };
    return body.sessionId;
  }

  // --- Full flow: upload → confirm → badges issued ---

  it('should confirm and issue all valid badges successfully', async () => {
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${recipientUser.user.email},https://example.com/ev1,Good work`,
    ].join('\n');

    const sessionIdLocal = await uploadCsv(adminUser, csvContent);

    const response = await authRequest(ctx.app, adminUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionIdLocal}`)
      .expect(201);

    const body = response.body as {
      success: boolean;
      processed: number;
      failed: number;
      results: Array<{
        row: number;
        recipientEmail: string;
        badgeName: string;
        status: string;
        error?: string;
      }>;
    };

    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].status).toBe('success');
    expect(body.results[0].recipientEmail).toBe(recipientUser.user.email);
    expect(body.results[0].badgeName).toBe('Batch Processing Badge');
  });

  // --- Session status: cannot re-confirm ---

  it('should reject confirming an already-confirmed session', async () => {
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${recipientUser.user.email},https://example.com/ev2,Test`,
    ].join('\n');

    const sessionIdLocal = await uploadCsv(adminUser, csvContent);

    // First confirm — should succeed
    await authRequest(ctx.app, adminUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionIdLocal}`)
      .expect(201);

    // Second confirm — should fail (status is now COMPLETED, not VALIDATED)
    await authRequest(ctx.app, adminUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionIdLocal}`)
      .expect(400);
  });

  // --- IDOR prevention ---

  it('should return 403 for confirm by a different user (IDOR)', async () => {
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${recipientUser.user.email},https://example.com/ev3,IDOR test`,
    ].join('\n');

    const sessionIdLocal = await uploadCsv(adminUser, csvContent);

    // Issuer user tries to confirm admin's session
    await authRequest(ctx.app, issuerUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionIdLocal}`)
      .expect(403);
  });

  // --- Partial failure: template deactivated between upload and confirm ---

  it('should handle partial failures with enriched results', async () => {
    // Create a second template that we'll deactivate after upload
    const ephemeralTemplate = await ctx.templateFactory.createActive({
      name: 'Ephemeral Badge',
      createdById: adminUser.user.id,
    });

    // CSV with two valid rows (both templates active at upload time)
    const csvContent = [
      'badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification',
      `${activeTemplateId},${recipientUser.user.email},https://example.com/ev4,Valid`,
      `${ephemeralTemplate.id},${recipientUser.user.email},https://example.com/ev5,Will fail`,
    ].join('\n');

    const sessionIdLocal = await uploadCsv(adminUser, csvContent);

    // Deactivate the ephemeral template AFTER upload but BEFORE confirm
    await ctx.prisma.badgeTemplate.update({
      where: { id: ephemeralTemplate.id },
      data: { status: 'ARCHIVED' },
    });

    const response = await authRequest(ctx.app, adminUser.token)
      .post(`/api/bulk-issuance/confirm/${sessionIdLocal}`)
      .expect(201);

    const body = response.body as {
      success: boolean;
      processed: number;
      failed: number;
      results: Array<{
        row: number;
        recipientEmail: string;
        badgeName: string;
        status: string;
        error?: string;
      }>;
    };

    expect(body.results).toHaveLength(2);
    expect(body.processed + body.failed).toBe(2);

    // The first (active template) should succeed
    const successResults = body.results.filter(
      (r) => r.status === 'success',
    );
    expect(successResults.length).toBeGreaterThanOrEqual(1);

    // The second (deactivated template) should fail
    const failedResults = body.results.filter(
      (r) => r.status === 'failed',
    );
    expect(failedResults.length).toBeGreaterThanOrEqual(1);
    expect(failedResults[0].error).toContain('not found or inactive');
  });
});
