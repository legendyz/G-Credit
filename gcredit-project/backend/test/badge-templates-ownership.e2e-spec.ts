import request from 'supertest';
import { App } from 'supertest/types';
import * as path from 'path';
import * as fs from 'fs';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
} from './helpers/test-setup';
import { BadgeTemplate } from '@prisma/client';

/**
 * Story 16.3: Template Edit/Update Ownership Guard — E2E Tests
 *
 * Verifies ARCH-P1-004 ownership checks:
 * - ISSUER can only update/delete own templates
 * - ADMIN bypasses all ownership checks
 * - Status changes via PATCH also enforce ownership
 * - Returns 403 Forbidden with clear message on violation
 */
describe('Template Ownership Guard (E2E) — Story 16.3', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let issuerA: TestUser;
  let issuerB: TestUser;
  let templateByA: BadgeTemplate;
  let templateByB: BadgeTemplate;
  let draftByA: BadgeTemplate;
  let draftByB: BadgeTemplate;
  let categoryId: string;
  let skillId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('tpl-ownership');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  // Setup: create users, category, skill, and templates
  beforeAll(async () => {
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');
    issuerA = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');
    issuerB = await createAndLoginUser(ctx.app, ctx.userFactory, 'issuer');

    // Create category + skill for template creation
    const category = await ctx.prisma.skillCategory.create({
      data: {
        name: `Ownership Test Cat ${Date.now()}`,
        description: 'For ownership E2E tests',
      },
    });
    categoryId = category.id;

    const skill = await ctx.prisma.skill.create({
      data: {
        name: `Ownership Test Skill ${Date.now()}`,
        description: 'For ownership E2E tests',
        categoryId,
      },
    });
    skillId = skill.id;

    // Issuer-A creates two templates (ACTIVE + DRAFT)
    templateByA = await ctx.templateFactory.createActive({
      name: `IssuerA Active ${Date.now()}`,
      createdById: issuerA.user.id,
      skillIds: [skillId],
      category: 'achievement',
    });

    draftByA = await ctx.templateFactory.createDraft({
      name: `IssuerA Draft ${Date.now()}`,
      createdById: issuerA.user.id,
      skillIds: [skillId],
      category: 'achievement',
    });

    // Issuer-B creates two templates (ACTIVE + DRAFT)
    templateByB = await ctx.templateFactory.createActive({
      name: `IssuerB Active ${Date.now()}`,
      createdById: issuerB.user.id,
      skillIds: [skillId],
      category: 'achievement',
    });

    draftByB = await ctx.templateFactory.createDraft({
      name: `IssuerB Draft ${Date.now()}`,
      createdById: issuerB.user.id,
      skillIds: [skillId],
      category: 'achievement',
    });
  });

  // ─── PATCH /api/badge-templates/:id (update) ───────────────────────

  describe('PATCH /api/badge-templates/:id (update)', () => {
    it('Issuer-A updates own template → 200 OK', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${templateByA.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .field('description', 'Updated by owner Issuer-A')
        .expect(200);

      const body = response.body as { description: string };
      expect(body.description).toBe('Updated by owner Issuer-A');
    });

    it('Issuer-A updates Issuer-B template → 403 Forbidden', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${templateByB.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .field('description', 'Should be forbidden')
        .expect(403);

      const body = response.body as { message: string };
      expect(body.message).toContain('You can only update your own badge templates');
    });

    it('Issuer-B updates Issuer-A template → 403 Forbidden', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${templateByA.id}`)
        .set('Authorization', `Bearer ${issuerB.token}`)
        .field('description', 'Should be forbidden')
        .expect(403);

      const body = response.body as { message: string };
      expect(body.message).toContain('You can only update your own badge templates');
    });

    it('Admin updates Issuer-A template → 200 OK (ownership bypass)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${templateByA.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('description', 'Updated by Admin')
        .expect(200);

      const body = response.body as { description: string };
      expect(body.description).toBe('Updated by Admin');
    });

    it('Admin updates Issuer-B template → 200 OK (ownership bypass)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${templateByB.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('description', 'Updated by Admin too')
        .expect(200);

      const body = response.body as { description: string };
      expect(body.description).toBe('Updated by Admin too');
    });
  });

  // ─── PATCH /api/badge-templates/:id (status change via update) ─────

  describe('PATCH /api/badge-templates/:id (status change via update)', () => {
    it('Issuer-A activates own DRAFT template → 200 OK', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${draftByA.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .field('status', 'ACTIVE')
        .expect(200);

      const body = response.body as { status: string };
      expect(body.status).toBe('ACTIVE');
    });

    it('Issuer-A changes Issuer-B DRAFT status → 403 Forbidden', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${draftByB.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .field('status', 'ACTIVE')
        .expect(403);

      const body = response.body as { message: string };
      expect(body.message).toContain('You can only update your own badge templates');
    });

    it('Admin activates Issuer-B DRAFT → 200 OK (ownership bypass)', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .patch(`/api/badge-templates/${draftByB.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('status', 'ACTIVE')
        .expect(200);

      const body = response.body as { status: string };
      expect(body.status).toBe('ACTIVE');
    });
  });

  // ─── DELETE /api/badge-templates/:id ────────────────────────────────

  describe('DELETE /api/badge-templates/:id', () => {
    let deletableByA: BadgeTemplate;
    let deletableByB: BadgeTemplate;
    let adminDeletable: BadgeTemplate;

    beforeAll(async () => {
      // Create fresh templates specifically for delete tests
      deletableByA = await ctx.templateFactory.createDraft({
        name: `DeleteTest A ${Date.now()}`,
        createdById: issuerA.user.id,
        skillIds: [skillId],
        category: 'achievement',
      });

      deletableByB = await ctx.templateFactory.createDraft({
        name: `DeleteTest B ${Date.now()}`,
        createdById: issuerB.user.id,
        skillIds: [skillId],
        category: 'achievement',
      });

      adminDeletable = await ctx.templateFactory.createDraft({
        name: `DeleteTest Admin ${Date.now()}`,
        createdById: issuerB.user.id,
        skillIds: [skillId],
        category: 'achievement',
      });
    });

    it('Issuer-A deletes own template → 200 OK', async () => {
      await request(ctx.app.getHttpServer() as App)
        .delete(`/api/badge-templates/${deletableByA.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .expect(200);

      // Verify deleted
      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badge-templates/${deletableByA.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .expect(404);
    });

    it('Issuer-A deletes Issuer-B template → 403 Forbidden', async () => {
      const response = await request(ctx.app.getHttpServer() as App)
        .delete(`/api/badge-templates/${deletableByB.id}`)
        .set('Authorization', `Bearer ${issuerA.token}`)
        .expect(403);

      const body = response.body as { message: string };
      expect(body.message).toContain('You can only delete your own badge templates');
    });

    it('Issuer-B deletes own template → 200 OK', async () => {
      await request(ctx.app.getHttpServer() as App)
        .delete(`/api/badge-templates/${deletableByB.id}`)
        .set('Authorization', `Bearer ${issuerB.token}`)
        .expect(200);

      // Verify deleted
      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badge-templates/${deletableByB.id}`)
        .set('Authorization', `Bearer ${issuerB.token}`)
        .expect(404);
    });

    it('Admin deletes any template → 200 OK (ownership bypass)', async () => {
      await request(ctx.app.getHttpServer() as App)
        .delete(`/api/badge-templates/${adminDeletable.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      // Verify deleted
      await request(ctx.app.getHttpServer() as App)
        .get(`/api/badge-templates/${adminDeletable.id}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(404);
    });
  });
});
