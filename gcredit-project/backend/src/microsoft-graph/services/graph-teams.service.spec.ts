/**
 * Graph Teams Service Tests
 *
 * TECHNICAL DEBT: Tests depend on Teams channel functionality.
 * Requires ChannelMessage.Send Graph API permission (not yet approved).
 * See: docs/sprints/sprint-6/technical-debt.md
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphTeamsService } from './graph-teams.service';
import { GraphTokenProviderService } from './graph-token-provider.service';

describe('GraphTeamsService', () => {
  let service: GraphTeamsService;
  let tokenProvider: GraphTokenProviderService;

  const mockAuthProvider = {
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockTokenProvider = {
    getAuthProvider: jest.fn().mockReturnValue(mockAuthProvider),
  };

  const mockConfigService = {
    get: (key: string, defaultValue?: any) => {
      // Task 7: Updated to use ENABLE_TEAMS_NOTIFICATIONS
      if (key === 'ENABLE_TEAMS_NOTIFICATIONS') return 'true';
      return defaultValue;
    },
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
    it('should initialize when ENABLE_TEAMS_NOTIFICATIONS=true', () => {
      expect(service.isGraphTeamsEnabled()).toBe(true);
    });

    it('should not initialize when ENABLE_TEAMS_NOTIFICATIONS=false', async () => {
      const disabledConfigService = {
        get: (key: string, defaultValue?: any) => {
          if (key === 'ENABLE_TEAMS_NOTIFICATIONS') return 'false';
          return defaultValue;
        },
      };

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphTeamsService>(GraphTeamsService);
      expect(disabledService.isGraphTeamsEnabled()).toBe(false);
    });
  });

  describe('sendActivityNotification', () => {
    it('should skip sending when disabled', async () => {
      const disabledConfigService = {
        get: (key: string, defaultValue?: any) => {
          if (key === 'ENABLE_TEAMS_NOTIFICATIONS') return 'false';
          return defaultValue;
        },
      };

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphTeamsService>(GraphTeamsService);

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
    it('should return true when enabled and tokenProvider available', async () => {
      // Create module with proper mock BEFORE service is constructed
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

      const enabledService = module.get<GraphTeamsService>(GraphTeamsService);
      expect(enabledService.isGraphTeamsEnabled()).toBe(true);
    });

    it('should return false when disabled', async () => {
      const disabledConfigService = {
        get: (key: string, defaultValue?: any) => {
          if (key === 'ENABLE_TEAMS_NOTIFICATIONS') return 'false';
          return defaultValue;
        },
      };

      const module = await Test.createTestingModule({
        providers: [
          GraphTeamsService,
          {
            provide: GraphTokenProviderService,
            useValue: mockTokenProvider,
          },
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<GraphTeamsService>(GraphTeamsService);
      expect(disabledService.isGraphTeamsEnabled()).toBe(false);
    });
  });
});
