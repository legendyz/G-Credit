import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import {
  TestContext,
  setupE2ETest,
  teardownE2ETest,
  createAndLoginUser,
  TestUser,
} from './helpers/test-setup';

/**
 * Sprint 2 E2E Tests - Badge Template Management (Isolated)
 *
 * Story 8.8: Test Isolation - Refactored for parallel execution
 *
 * Tests all 6 stories + Enhancement 1:
 * - Story 3.1: Data Model (Skills & Categories)
 * - Story 3.2: CRUD API with Azure Blob
 * - Story 3.3: Query API
 * - Story 3.4: Search Optimization
 * - Story 3.5: Issuance Criteria Validation
 * - Story 3.6: Skill Category Management
 * - Enhancement 1: Azure Blob Image Complete Management
 */
describe('Badge Templates E2E (Sprint 2 - Isolated)', () => {
  let ctx: TestContext;
  let adminUser: TestUser;
  let categoryId: string;
  let skillId: string;

  beforeAll(async () => {
    ctx = await setupE2ETest('badge-templates');
  });

  afterAll(async () => {
    await teardownE2ETest(ctx);
  });

  beforeAll(async () => {
    // Create admin user for tests
    adminUser = await createAndLoginUser(ctx.app, ctx.userFactory, 'admin');

    // Create test category
    const category = await ctx.prisma.skillCategory.create({
      data: {
        name: `Test Category ${Date.now()}`,
        description: 'Category for isolated E2E testing',
      },
    });
    categoryId = category.id;

    // Create test skill
    const skill = await ctx.prisma.skill.create({
      data: {
        name: `Test Skill ${Date.now()}`,
        description: 'Skill for isolated E2E testing',
        categoryId: categoryId,
      },
    });
    skillId = skill.id;
  });

  describe('Story 3.6: Skill Category Management', () => {
    it('should get all skill categories', () => {
      return request(ctx.app.getHttpServer())
        .get('/skill-categories')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Story 3.1: Create Skill', () => {
    it('should create a new skill', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({
          name: `E2E Skill ${Date.now()}`,
          description: 'Created by isolated E2E test',
          categoryId: categoryId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body.categoryId).toBe(categoryId);
    });

    it('should require authentication', () => {
      return request(ctx.app.getHttpServer())
        .post('/skills')
        .send({
          name: 'Test Skill',
          description: 'Test',
        })
        .expect(401);
    });
  });

  describe('Story 3.2: CRUD API with Azure Blob', () => {
    let createdBadgeId: string;

    it('should create badge template with image (multipart)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      if (!fs.existsSync(testImagePath)) {
        throw new Error(`Test image not found: ${testImagePath}`);
      }

      const response = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `E2E Badge ${Date.now()}`)
        .field('description', 'Created by isolated E2E test')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body.skillIds).toContain(skillId);
      expect(response.body.issuanceCriteria.type).toBe('manual');
      createdBadgeId = response.body.id;
    });

    it('should update badge template', async () => {
      const response = await request(ctx.app.getHttpServer())
        .patch(`/badge-templates/${createdBadgeId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('description', 'Updated by isolated E2E test')
        .field('status', 'ACTIVE')
        .expect(200);

      expect(response.body.description).toBe('Updated by isolated E2E test');
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should get badge template by id', () => {
      return request(ctx.app.getHttpServer())
        .get(`/badge-templates/${createdBadgeId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdBadgeId);
        });
    });
  });

  describe('Story 3.3: Query API', () => {
    it('should query badge templates with pagination', () => {
      return request(ctx.app.getHttpServer())
        .get('/badge-templates?page=1&limit=10')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('totalPages');
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10);
        });
    });

    it('should filter by category', () => {
      return request(ctx.app.getHttpServer())
        .get('/badge-templates?category=achievement')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          res.body.data.forEach((badge: any) => {
            expect(badge.category).toBe('achievement');
          });
        });
    });

    it('should filter by status (public API - only ACTIVE)', () => {
      return request(ctx.app.getHttpServer())
        .get('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((badge: any) => {
            expect(badge.status).toBe('ACTIVE');
          });
        });
    });
  });

  describe('Story 3.4: Search Optimization', () => {
    it('should search badges by name', () => {
      return request(ctx.app.getHttpServer())
        .get('/badge-templates?search=E2E')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    it('should sort badges by createdAt DESC', () => {
      return request(ctx.app.getHttpServer())
        .get('/badge-templates?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200)
        .expect((res) => {
          const badges = res.body.data;
          if (badges.length > 1) {
            const dates = badges.map((b: any) =>
              new Date(b.createdAt).getTime(),
            );
            for (let i = 1; i < dates.length; i++) {
              expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
            }
          }
        });
    });
  });

  describe('Story 3.5: Issuance Criteria Validation', () => {
    it('should validate manual issuance criteria', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      const response = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `Manual Badge ${Date.now()}`)
        .field('description', 'Manual issuance test')
        .field('category', 'certification')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body.issuanceCriteria.type).toBe('manual');
    });

    it('should validate automatic issuance criteria (task)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      const response = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `Auto Badge ${Date.now()}`)
        .field('description', 'Automatic task test')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field(
          'issuanceCriteria',
          JSON.stringify({
            type: 'auto_task',
            conditions: [
              { field: 'taskId', operator: '==', value: 'task-123' },
              { field: 'status', operator: '==', value: 'completed' },
            ],
            logicOperator: 'all',
          }),
        )
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body.issuanceCriteria.type).toBe('auto_task');
      expect(response.body.issuanceCriteria.conditions).toHaveLength(2);
    });

    it('should reject invalid issuance criteria type', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', 'Invalid Badge')
        .field('description', 'Invalid criteria test')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'invalid_type' }))
        .attach('image', testImagePath)
        .expect(400);
    });
  });

  describe('Enhancement 1: Azure Blob Image Complete Management', () => {
    it('should reject image too small (<128px)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-too-small-64x64.png',
      );

      if (!fs.existsSync(testImagePath)) {
        console.warn('Skipping test: test image not found');
        return;
      }

      await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', 'Too Small Badge')
        .field('description', 'Image too small')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(400);
    });

    it('should reject image too large (>2048px)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-too-large-3000x3000.png',
      );

      if (!fs.existsSync(testImagePath)) {
        console.warn('Skipping test: test image not found');
        return;
      }

      await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', 'Too Large Badge')
        .field('description', 'Image too large')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(400);
    });

    it('should accept optimal size (256x256)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      const response = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `Optimal Badge ${Date.now()}`)
        .field('description', 'Optimal size test')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('imageUrl');
    });

    it('should accept optimal size (512x512)', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-512x512.png',
      );

      if (!fs.existsSync(testImagePath)) {
        console.warn('Skipping test: test image not found');
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `Optimal 512 Badge ${Date.now()}`)
        .field('description', 'Optimal 512 size test')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('imageUrl');
    });

    it('should delete badge and its image', async () => {
      const testImagePath = path.join(
        __dirname,
        '../test-images/test-optimal-256x256.png',
      );

      // Create a badge
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/badge-templates')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .field('name', `To Delete Badge ${Date.now()}`)
        .field('description', 'Will be deleted')
        .field('category', 'achievement')
        .field('skillIds', JSON.stringify([skillId]))
        .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
        .attach('image', testImagePath)
        .expect(201);

      const badgeId = createResponse.body.id;
      const imageUrl = createResponse.body.imageUrl;
      expect(imageUrl).toBeTruthy();

      // Delete the badge
      await request(ctx.app.getHttpServer())
        .delete(`/badge-templates/${badgeId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(200);

      // Verify badge is deleted
      await request(ctx.app.getHttpServer())
        .get(`/badge-templates/${badgeId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .expect(404);
    });
  });
});
