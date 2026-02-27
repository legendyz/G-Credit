/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AzureAdSsoService } from '../services/azure-ad-sso.service';
import { AzureAdConfigService } from '../config/azure-ad.config';

describe('AzureAdSsoService', () => {
  let service: AzureAdSsoService;
  let mockAzureAdConfigService: {
    isConfigured: jest.Mock;
    getMsalClient: jest.Mock;
    getSsoConfig: jest.Mock;
  };

  const mockSsoConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tenantId: 'test-tenant-id',
    redirectUri: 'http://localhost:3000/api/auth/sso/callback',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  };

  const mockMsalClient = {
    getAuthCodeUrl: jest.fn(),
    acquireTokenByCode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAzureAdConfigService = {
      isConfigured: jest.fn().mockReturnValue(true),
      getMsalClient: jest.fn().mockReturnValue(mockMsalClient),
      getSsoConfig: jest.fn().mockReturnValue(mockSsoConfig),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureAdSsoService,
        {
          provide: AzureAdConfigService,
          useValue: mockAzureAdConfigService,
        },
      ],
    }).compile();

    service = module.get<AzureAdSsoService>(AzureAdSsoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // generateAuthUrl() Tests
  // ============================================================
  describe('generateAuthUrl', () => {
    it('should return authUrl, codeVerifier, and state', async () => {
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(
        'https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/authorize?client_id=test',
      );

      const result = await service.generateAuthUrl();

      expect(result).toHaveProperty('authUrl');
      expect(result).toHaveProperty('codeVerifier');
      expect(result).toHaveProperty('state');
      expect(typeof result.authUrl).toBe('string');
      expect(typeof result.codeVerifier).toBe('string');
      expect(typeof result.state).toBe('string');
    });

    it('should pass correct scopes and redirectUri to MSAL', async () => {
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(
        'https://login.microsoftonline.com/authorize',
      );

      await service.generateAuthUrl();

      expect(mockMsalClient.getAuthCodeUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: mockSsoConfig.scopes,
          redirectUri: mockSsoConfig.redirectUri,
          codeChallengeMethod: 'S256',
        }),
      );
    });

    it('should include PKCE code_challenge in the auth URL request', async () => {
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(
        'https://login.microsoftonline.com/authorize',
      );

      await service.generateAuthUrl();

      const callArgs = mockMsalClient.getAuthCodeUrl.mock.calls[0][0];
      expect(callArgs).toHaveProperty('codeChallenge');
      expect(typeof callArgs.codeChallenge).toBe('string');
      expect(callArgs.codeChallenge.length).toBeGreaterThan(0);
    });

    it('should include state parameter for CSRF protection', async () => {
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(
        'https://login.microsoftonline.com/authorize',
      );

      await service.generateAuthUrl();

      const callArgs = mockMsalClient.getAuthCodeUrl.mock.calls[0][0];
      expect(callArgs).toHaveProperty('state');
      expect(typeof callArgs.state).toBe('string');
      expect(callArgs.state.length).toBe(32); // 16 bytes hex = 32 chars
    });

    it('should generate unique codeVerifier and state per call', async () => {
      mockMsalClient.getAuthCodeUrl.mockResolvedValue(
        'https://login.microsoftonline.com/authorize',
      );

      const result1 = await service.generateAuthUrl();
      const result2 = await service.generateAuthUrl();

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
      expect(result1.state).not.toBe(result2.state);
    });

    it('should throw ServiceUnavailableException when SSO is not configured', async () => {
      mockAzureAdConfigService.isConfigured.mockReturnValue(false);

      await expect(service.generateAuthUrl()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  // ============================================================
  // handleCallback() Tests
  // ============================================================
  describe('handleCallback', () => {
    const mockAuthResult = {
      idTokenClaims: {
        oid: 'azure-oid-123',
        preferred_username: 'user@example.com',
        name: 'Test User',
      },
      account: {
        homeAccountId: 'home-id',
      },
    };

    it('should return AzureAdProfile with oid, email, displayName on happy path', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockAuthResult);

      const result = await service.handleCallback(
        'valid-code',
        'valid-verifier',
      );

      expect(result).toEqual({
        oid: 'azure-oid-123',
        email: 'user@example.com',
        displayName: 'Test User',
      });
    });

    it('should pass code, scopes, redirectUri, and codeVerifier to MSAL', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue(mockAuthResult);

      await service.handleCallback('auth-code-xyz', 'verifier-abc');

      expect(mockMsalClient.acquireTokenByCode).toHaveBeenCalledWith({
        code: 'auth-code-xyz',
        scopes: mockSsoConfig.scopes,
        redirectUri: mockSsoConfig.redirectUri,
        codeVerifier: 'verifier-abc',
      });
    });

    it('should lowercase the email from claims', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: {
          oid: 'azure-oid-456',
          preferred_username: 'User@EXAMPLE.COM',
          name: 'Test',
        },
      });

      const result = await service.handleCallback('code', 'verifier');
      expect(result.email).toBe('user@example.com');
    });

    it('should use email claim as fallback when preferred_username is missing', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: {
          oid: 'azure-oid-789',
          email: 'fallback@example.com',
          name: 'Fallback User',
        },
      });

      const result = await service.handleCallback('code', 'verifier');
      expect(result.email).toBe('fallback@example.com');
    });

    it('should throw error when oid claim is missing', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: {
          preferred_username: 'user@example.com',
          name: 'No OID User',
          // oid is missing
        },
      });

      await expect(service.handleCallback('code', 'verifier')).rejects.toThrow(
        'Missing oid claim in Azure AD id_token',
      );
    });

    it('should throw error when email claims are missing', async () => {
      mockMsalClient.acquireTokenByCode.mockResolvedValue({
        idTokenClaims: {
          oid: 'azure-oid-999',
          name: 'No Email User',
          // no preferred_username or email
        },
      });

      await expect(service.handleCallback('code', 'verifier')).rejects.toThrow(
        'Missing email claim in Azure AD id_token',
      );
    });

    it('should handle MSAL error (invalid code) by propagating exception', async () => {
      mockMsalClient.acquireTokenByCode.mockRejectedValue(
        new Error('AADSTS70008: The provided authorization code is expired'),
      );

      await expect(
        service.handleCallback('expired-code', 'verifier'),
      ).rejects.toThrow('AADSTS70008');
    });

    it('should throw ServiceUnavailableException when SSO is not configured', async () => {
      mockAzureAdConfigService.isConfigured.mockReturnValue(false);

      await expect(service.handleCallback('code', 'verifier')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  // ============================================================
  // Configuration validation
  // ============================================================
  describe('configuration validation', () => {
    it('should throw ServiceUnavailableException on generateAuthUrl when not configured', async () => {
      mockAzureAdConfigService.isConfigured.mockReturnValue(false);

      await expect(service.generateAuthUrl()).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(service.generateAuthUrl()).rejects.toThrow(
        'Azure AD SSO is not configured',
      );
    });

    it('should throw ServiceUnavailableException on handleCallback when not configured', async () => {
      mockAzureAdConfigService.isConfigured.mockReturnValue(false);

      await expect(service.handleCallback('code', 'verifier')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
