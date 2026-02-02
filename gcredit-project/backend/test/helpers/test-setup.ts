/**
 * E2E Test Setup Helper (Story 8.8 - AC1, AC2)
 * TD-001: Base test setup for isolated E2E tests
 *
 * Provides a standardized way to set up E2E tests with:
 * - Schema-based database isolation
 * - Pre-configured factories
 * - Login helpers
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { createTestSchema, dropTestSchema } from './test-database';
import { UserFactory, BadgeTemplateFactory, BadgeFactory } from '../factories';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  schemaName: string;
  userFactory: UserFactory;
  templateFactory: BadgeTemplateFactory;
  badgeFactory: BadgeFactory;
}

export interface TestUser {
  user: User;
  token: string;
  credentials: { email: string; password: string };
}

/**
 * Sets up an isolated E2E test environment
 * @param suiteName - Unique name for the test suite (used for schema name)
 */
export async function setupE2ETest(suiteName: string): Promise<TestContext> {
  // Create isolated database schema
  const { prisma, schemaName } = await createTestSchema(suiteName);

  // Create NestJS testing module
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  // Create and configure app
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  // Create factories with unique prefix
  const testPrefix = schemaName.split('_').slice(-2).join('_');
  const userFactory = new UserFactory(prisma, testPrefix);
  const templateFactory = new BadgeTemplateFactory(prisma, testPrefix);
  const badgeFactory = new BadgeFactory(prisma, testPrefix);

  return {
    app,
    prisma,
    schemaName,
    userFactory,
    templateFactory,
    badgeFactory,
  };
}

/**
 * Tears down the E2E test environment
 */
export async function teardownE2ETest(context: TestContext): Promise<void> {
  await context.app.close();
  await dropTestSchema(context.prisma, context.schemaName);
}

/**
 * Creates a user and logs them in, returning user + JWT token
 */
export async function createAndLoginUser(
  app: INestApplication,
  userFactory: UserFactory,
  role: 'admin' | 'manager' | 'employee' = 'employee',
  password = 'TestPassword123!',
): Promise<TestUser> {
  let user: User;

  switch (role) {
    case 'admin':
      user = await userFactory.createAdmin({ password });
      break;
    case 'manager':
      user = await userFactory.createManager({ password });
      break;
    default:
      user = await userFactory.createEmployee({ password });
  }

  const credentials = { email: user.email, password };

  // Login to get token
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials)
    .expect(200); // Story 8.6: Login returns 200 OK

  return {
    user,
    token: response.body.accessToken,
    credentials,
  };
}

/**
 * Helper to make authenticated requests
 */
export function authRequest(
  app: INestApplication,
  token: string,
): {
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  put: (url: string) => request.Test;
  patch: (url: string) => request.Test;
  delete: (url: string) => request.Test;
} {
  const server = app.getHttpServer();

  return {
    get: (url: string) =>
      request(server).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(server).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(server).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(server).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(server).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Waits for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}
