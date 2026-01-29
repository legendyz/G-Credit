import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from './graph-email.service';
import { GraphTokenProviderService } from './graph-token-provider.service';

describe('GraphEmailService', () => {
  let service: GraphEmailService;
  let tokenProvider: GraphTokenProviderService;

  const mockTokenProvider = {
    getAuthProvider: jest.fn().mockReturnValue({
      getAccessToken: jest.fn().mockResolvedValue('mock-token'),
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'ENABLE_GRAPH_EMAIL') return true;
      return defaultValue;
    }),
  };

  const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    post: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock Microsoft Graph Client
    jest.mock('@microsoft/microsoft-graph-client', () => ({
      Client: {
        initWithMiddleware: jest.fn(() => mockGraphClient),
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphEmailService,
        {
          provide: GraphTokenProviderService,
          useValue: mockTokenProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GraphEmailService>(GraphEmailService);
    tokenProvider = module.get<GraphTokenProviderService>(
      GraphTokenProviderService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize when ENABLE_GRAPH_EMAIL=true', () => {
      expect(service.isGraphEmailEnabled()).toBe(true);
    });

    it('should not initialize when ENABLE_GRAPH_EMAIL=false', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphEmailService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphEmailService>(GraphEmailService);
      expect(disabledService.isGraphEmailEnabled()).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should skip sending when disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphEmailService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphEmailService>(GraphEmailService);

      await expect(
        disabledService.sendEmail(
          'sender@example.com',
          ['recipient@example.com'],
          'Test Subject',
          '<p>Test Body</p>',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('isGraphEmailEnabled', () => {
    it('should return true when enabled', () => {
      expect(service.isGraphEmailEnabled()).toBe(true);
    });

    it('should return false when disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphEmailService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphEmailService>(GraphEmailService);
      expect(disabledService.isGraphEmailEnabled()).toBe(false);
    });
  });
});
