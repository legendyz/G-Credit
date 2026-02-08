/**
 * Simple Auth Test - Verify basic auth flow works
 * This test uses the default public schema to verify auth is working
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Auth E2E (Simple)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and login a user', async () => {
    const uniqueEmail = `test-${Date.now()}@test.com`;
    const password = 'TestPassword123!';

    // Register
    const registerResponse = await request(app.getHttpServer() as App)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password,
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    const registerBody = registerResponse.body as { email: string };
    console.log('Register response:', registerResponse.body);
    expect(registerBody.email).toBe(uniqueEmail);

    // Login
    const loginResponse = await request(app.getHttpServer() as App)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password,
      })
      .expect(200); // Story 8.6: Login returns 200 OK (was 201 before)

    const loginBody = loginResponse.body as {
      accessToken: string;
      user: { email: string };
    };
    console.log('Login response:', loginResponse.body);
    expect(loginBody.accessToken).toBeDefined();
    expect(loginBody.user.email).toBe(uniqueEmail);

    // Cleanup
    await prisma.user.delete({ where: { email: uniqueEmail } });
  });
});
