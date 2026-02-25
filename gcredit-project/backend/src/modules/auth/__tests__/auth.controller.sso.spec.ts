/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AzureAdSsoService } from '../services/azure-ad-sso.service';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

describe('AuthController SSO Endpoints (Story 13.1)', () => {
  let app: INestApplication;
  let mockAuthService: Record<string, jest.Mock>;
  let mockAzureAdSsoService: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAuthService = {
      ssoLogin: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };

    mockAzureAdSsoService = {
      generateAuthUrl: jest.fn(),
      handleCallback: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          FRONTEND_URL: 'http://localhost:5173',
          JWT_SECRET: 'test-jwt-secret-32-characters-long',
        };
        return config[key];
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AzureAdSsoService, useValue: mockAzureAdSsoService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ============================================================
  // GET /api/auth/sso/login
  // ============================================================
  describe('GET /api/auth/sso/login', () => {
    it('should redirect (302) to Azure AD authorize URL', async () => {
      mockAzureAdSsoService.generateAuthUrl.mockResolvedValue({
        authUrl:
          'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?client_id=xxx&scope=openid',
        codeVerifier: 'test-code-verifier',
        state: 'test-state-value',
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/login')
        .expect(302);

      expect(response.headers.location).toContain('login.microsoftonline.com');
    });

    it('should set sso_state cookie with codeVerifier and state', async () => {
      mockAzureAdSsoService.generateAuthUrl.mockResolvedValue({
        authUrl: 'https://login.microsoftonline.com/authorize',
        codeVerifier: 'pkce-verifier-123',
        state: 'csrf-state-456',
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/login')
        .expect(302);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const ssoStateCookie = cookies.find((c: string) =>
        c.startsWith('sso_state='),
      );
      expect(ssoStateCookie).toBeDefined();
      expect(ssoStateCookie).toContain('HttpOnly');
      expect(ssoStateCookie).toContain('Path=/api/auth/sso');
    });

    it('should return 503 when SSO is not configured', async () => {
      mockAzureAdSsoService.generateAuthUrl.mockRejectedValue(
        new ServiceUnavailableException('Azure AD SSO is not configured'),
      );

      await request(app.getHttpServer()).get('/api/auth/sso/login').expect(503);
    });
  });

  // ============================================================
  // GET /api/auth/sso/callback
  // ============================================================
  describe('GET /api/auth/sso/callback', () => {
    const validSsoState = JSON.stringify({
      codeVerifier: 'test-verifier',
      state: 'test-state',
    });

    it('should set auth cookies and redirect to frontend on happy path (existing user)', async () => {
      mockAzureAdSsoService.handleCallback.mockResolvedValue({
        oid: 'azure-oid-123',
        email: 'user@example.com',
        displayName: 'Test User',
      });
      mockAuthService.ssoLogin.mockResolvedValue({
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: { id: 'user-123', email: 'user@example.com', role: 'EMPLOYEE' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'auth-code-abc', state: 'test-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/sso/callback?success=true',
      );

      // Check auth cookies set
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const accessCookie = cookies.find((c: string) =>
        c.startsWith('access_token='),
      );
      const refreshCookie = cookies.find((c: string) =>
        c.startsWith('refresh_token='),
      );
      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();
    });

    it('should redirect with sso_no_account error when azureId not found', async () => {
      mockAzureAdSsoService.handleCallback.mockResolvedValue({
        oid: 'unknown-oid',
        email: 'unknown@example.com',
        displayName: 'Unknown',
      });
      mockAuthService.ssoLogin.mockResolvedValue({ error: 'sso_no_account' });

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'auth-code', state: 'test-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_no_account',
      );
    });

    it('should redirect with account_disabled error for inactive user', async () => {
      mockAzureAdSsoService.handleCallback.mockResolvedValue({
        oid: 'inactive-oid',
        email: 'inactive@example.com',
        displayName: 'Inactive',
      });
      mockAuthService.ssoLogin.mockResolvedValue({ error: 'account_disabled' });

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'auth-code', state: 'test-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=account_disabled',
      );
    });

    it('should redirect with sso_failed when code exchange fails (invalid code)', async () => {
      mockAzureAdSsoService.handleCallback.mockRejectedValue(
        new Error('AADSTS70008: expired authorization code'),
      );

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'expired-code', state: 'test-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_failed',
      );
    });

    it('should redirect with sso_invalid_token when oid is missing from token', async () => {
      mockAzureAdSsoService.handleCallback.mockRejectedValue(
        new Error('Missing oid claim in Azure AD id_token'),
      );

      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'code', state: 'test-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_invalid_token',
      );
    });

    it('should redirect with sso_cancelled when Azure AD returns access_denied', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({
          error: 'access_denied',
          error_description: 'User cancelled',
        })
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_cancelled',
      );
    });

    it('should redirect with sso_failed when Azure AD returns generic error', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({
          error: 'server_error',
          error_description: 'Something went wrong',
        })
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_failed',
      );
    });

    it('should redirect with sso_failed when state does not match (CSRF protection)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'code', state: 'wrong-state' })
        .set('Cookie', [`sso_state=${encodeURIComponent(validSsoState)}`])
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_failed',
      );
    });

    it('should redirect with sso_failed when sso_state cookie is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ code: 'code', state: 'test-state' })
        // No cookie set
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_failed',
      );
    });

    it('should redirect with sso_failed when code is missing from callback', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/sso/callback')
        .query({ state: 'test-state' })
        // No code param
        .expect(302);

      expect(response.headers.location).toBe(
        'http://localhost:5173/login?error=sso_failed',
      );
    });
  });
});
