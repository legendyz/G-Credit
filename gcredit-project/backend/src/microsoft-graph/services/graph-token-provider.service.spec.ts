import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphTokenProviderService } from './graph-token-provider.service';
import { ClientSecretCredential } from '@azure/identity';

// Mock @azure/identity
jest.mock('@azure/identity');

describe('GraphTokenProviderService', () => {
  let service: GraphTokenProviderService;
  let configService: ConfigService;

  const mockConfigService = {
    get: (key: string, defaultValue?: string) => {
      const config = {
        AZURE_TENANT_ID: 'test-tenant-id',
        AZURE_CLIENT_ID: 'test-client-id',
        AZURE_CLIENT_SECRET: 'test-client-secret',
        GRAPH_API_SCOPE: 'https://graph.microsoft.com/.default',
      };
      return config[key] || defaultValue;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphTokenProviderService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GraphTokenProviderService>(GraphTokenProviderService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize credential with tenant/client/secret from config', async () => {
      await service.onModuleInit();

      expect(ClientSecretCredential).toHaveBeenCalledWith(
        'test-tenant-id',
        'test-client-id',
        'test-client-secret',
      );
    });

    it('should throw error if AZURE_TENANT_ID missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AZURE_TENANT_ID') return undefined;
        if (key === 'AZURE_CLIENT_ID') return 'test-client-id';
        if (key === 'AZURE_CLIENT_SECRET') return 'test-client-secret';
        if (key === 'GRAPH_API_SCOPE')
          return 'https://graph.microsoft.com/.default';
        return undefined;
      });

      // Now gracefully degrades - should NOT throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(service.isAvailable()).toBe(false);
    });

    it('should gracefully degrade if AZURE_CLIENT_ID missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AZURE_TENANT_ID') return 'test-tenant-id';
        if (key === 'AZURE_CLIENT_ID') return undefined;
        if (key === 'AZURE_CLIENT_SECRET') return 'test-client-secret';
        if (key === 'GRAPH_API_SCOPE')
          return 'https://graph.microsoft.com/.default';
        return undefined;
      });

      // Now gracefully degrades - should NOT throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(service.isAvailable()).toBe(false);
    });

    it('should gracefully degrade if AZURE_CLIENT_SECRET missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'AZURE_TENANT_ID') return 'test-tenant-id';
        if (key === 'AZURE_CLIENT_ID') return 'test-client-id';
        if (key === 'AZURE_CLIENT_SECRET') return undefined;
        if (key === 'GRAPH_API_SCOPE')
          return 'https://graph.microsoft.com/.default';
        return undefined;
      });

      // Now gracefully degrades - should NOT throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('getAuthProvider', () => {
    it('should return auth provider after initialization', async () => {
      // Mock ClientSecretCredential before creating service
      const mockCredential = {
        getToken: jest.fn().mockResolvedValue({
          token: 'mock-token',
          expiresOnTimestamp: Date.now() + 3600000,
        }),
      };

      (ClientSecretCredential as jest.Mock).mockImplementation(
        () => mockCredential,
      );

      // Create completely fresh config for this test
      const freshConfigService = {
        get: (key: string, defaultValue?: string) => {
          const config = {
            AZURE_TENANT_ID: 'test-tenant-id',
            AZURE_CLIENT_ID: 'test-client-id',
            AZURE_CLIENT_SECRET: 'test-client-secret',
            GRAPH_API_SCOPE: 'https://graph.microsoft.com/.default',
          };
          return config[key] || defaultValue;
        },
      };

      // Create fresh service instance
      const freshModule = await Test.createTestingModule({
        providers: [
          GraphTokenProviderService,
          {
            provide: ConfigService,
            useValue: freshConfigService,
          },
        ],
      }).compile();

      const freshService = freshModule.get<GraphTokenProviderService>(
        GraphTokenProviderService,
      );

      await freshService.onModuleInit();
      const authProvider = freshService.getAuthProvider();
      expect(authProvider).toBeDefined();
    });

    it('should return null if called when not configured', () => {
      // Now returns null instead of throwing
      expect(service.getAuthProvider()).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should throw error if called when not configured', async () => {
      await expect(service.getAccessToken()).rejects.toThrow(
        'Graph API not configured - Azure AD credentials missing',
      );
    });

    it('should request token with correct scope', async () => {
      const mockGetToken = jest.fn().mockResolvedValue({
        token: 'mock-access-token',
        expiresOnTimestamp: Date.now() + 3600000,
      });

      const mockCredential = {
        getToken: mockGetToken,
      };

      (ClientSecretCredential as jest.Mock).mockImplementation(
        () => mockCredential,
      );

      // Create completely fresh config for this test
      const freshConfigService = {
        get: (key: string, defaultValue?: string) => {
          const config = {
            AZURE_TENANT_ID: 'test-tenant-id',
            AZURE_CLIENT_ID: 'test-client-id',
            AZURE_CLIENT_SECRET: 'test-client-secret',
            GRAPH_API_SCOPE: 'https://graph.microsoft.com/.default',
          };
          return config[key] || defaultValue;
        },
      };

      // Create fresh service instance for this test
      const freshModule = await Test.createTestingModule({
        providers: [
          GraphTokenProviderService,
          {
            provide: ConfigService,
            useValue: freshConfigService,
          },
        ],
      }).compile();

      const freshService = freshModule.get<GraphTokenProviderService>(
        GraphTokenProviderService,
      );

      await freshService.onModuleInit();
      const token = await freshService.getAccessToken();

      expect(mockGetToken).toHaveBeenCalledWith(
        'https://graph.microsoft.com/.default',
      );
      expect(token).toBe('mock-access-token');
    });
  });
});
