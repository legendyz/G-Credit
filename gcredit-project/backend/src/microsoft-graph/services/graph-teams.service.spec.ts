import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphTeamsService } from './graph-teams.service';
import { GraphTokenProviderService } from './graph-token-provider.service';

describe('GraphTeamsService', () => {
  let service: GraphTeamsService;
  let tokenProvider: GraphTokenProviderService;

  const mockTokenProvider = {
    getAuthProvider: jest.fn().mockReturnValue({
      getAccessToken: jest.fn().mockResolvedValue('mock-token'),
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'ENABLE_GRAPH_TEAMS') return true;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphTeamsService,
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

    service = module.get<GraphTeamsService>(GraphTeamsService);
    tokenProvider = module.get<GraphTokenProviderService>(
      GraphTokenProviderService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize when ENABLE_GRAPH_TEAMS=true', () => {
      expect(service.isGraphTeamsEnabled()).toBe(true);
    });

    it('should not initialize when ENABLE_GRAPH_TEAMS=false', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
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

      const disabledService =
        module.get<GraphTeamsService>(GraphTeamsService);
      expect(disabledService.isGraphTeamsEnabled()).toBe(false);
    });
  });

  describe('sendActivityNotification', () => {
    it('should skip sending when disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
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

      const disabledService =
        module.get<GraphTeamsService>(GraphTeamsService);

      await expect(
        disabledService.sendActivityNotification(
          'user@example.com',
          'badgeEarned',
          'You earned a badge!',
          { badgeName: 'Test Badge' },
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('isGraphTeamsEnabled', () => {
    it('should return true when enabled', () => {
      expect(service.isGraphTeamsEnabled()).toBe(true);
    });

    it('should return false when disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
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

      const disabledService =
        module.get<GraphTeamsService>(GraphTeamsService);
      expect(disabledService.isGraphTeamsEnabled()).toBe(false);
    });
  });
});
