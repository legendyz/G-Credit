import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { CSVParserService } from './services/csv-parser.service';
import { MilestonesService } from '../milestones/milestones.service';
import { TeamsBadgeNotificationService } from '../microsoft-graph/teams/teams-badge-notification.service';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';
import { ConfigService } from '@nestjs/config';
import { WalletQueryDto } from './dto/wallet-query.dto';
import { BadgeStatus } from '@prisma/client';

describe('BadgeIssuanceService - Wallet (Story 4.1)', () => {
  let service: BadgeIssuanceService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    badge: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAssertionGenerator = {
    generateClaimToken: jest.fn(),
    generateAssertion: jest.fn(),
    hashEmail: jest.fn(),
  };

  const mockNotificationService = {
    sendBadgeClaimNotification: jest.fn(),
  };

  const mockCSVParserService = {
    parseCSV: jest.fn(),
  };

  const mockMilestonesService = {
    checkMilestones: jest.fn().mockResolvedValue(undefined),
    getUserAchievements: jest.fn().mockResolvedValue([]),
  };

  const mockStorageService = {
    uploadBadgeImage: jest.fn(),
    getBadgeImageUrl: jest.fn(),
    deleteBadgeImage: jest.fn(),
  };

  const mockTeamsNotificationService = {
    sendBadgeIssuanceNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockGraphEmailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        GRAPH_EMAIL_FROM: 'test@test.com',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeIssuanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AssertionGeneratorService,
          useValue: mockAssertionGenerator,
        },
        {
          provide: BadgeNotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: CSVParserService,
          useValue: mockCSVParserService,
        },
        {
          provide: MilestonesService,
          useValue: mockMilestonesService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: TeamsBadgeNotificationService,
          useValue: mockTeamsNotificationService,
        },
        {
          provide: GraphEmailService,
          useValue: mockGraphEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getWalletBadges', () => {
    const userId = 'user-123';
    const mockBadges = [
      {
        id: 'badge-1',
        recipientId: userId,
        issuedAt: new Date('2026-01-15'),
        status: BadgeStatus.CLAIMED,
        template: {
          id: 'template-1',
          name: 'Python Expert',
          description: 'Python mastery',
          imageUrl: 'https://example.com/python.png',
          category: 'programming',
        },
        issuer: {
          id: 'issuer-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'badge-2',
        recipientId: userId,
        issuedAt: new Date('2026-01-10'),
        status: BadgeStatus.CLAIMED,
        template: {
          id: 'template-2',
          name: 'JavaScript Pro',
          description: 'JS expertise',
          imageUrl: 'https://example.com/js.png',
          category: 'programming',
        },
        issuer: {
          id: 'issuer-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    ];

    it('should return wallet badges with pagination and date groups', async () => {
      const query: WalletQueryDto = {
        page: 1,
        limit: 50,
      };

      mockPrismaService.badge.count.mockResolvedValue(2);
      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getWalletBadges(userId, query);

      expect(result).toBeDefined();
      expect(result.badges).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      });
      expect(result.dateGroups).toBeDefined();
      expect(result.dateGroups.length).toBeGreaterThan(0);

      // Verify Prisma query
      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: { recipientId: userId },
      });
      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith({
        where: { recipientId: userId },
        orderBy: { issuedAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              category: true,
              // Story 8.2: Include skillIds for filtering
              skillIds: true,
            },
          },
          issuer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          // Story 9.3: Include revoker for REVOKED badges
          revoker: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });
    });

    it('should filter badges by status', async () => {
      const query: WalletQueryDto = {
        page: 1,
        limit: 50,
        status: BadgeStatus.PENDING,
      };

      mockPrismaService.badge.count.mockResolvedValue(0);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      await service.getWalletBadges(userId, query);

      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          recipientId: userId,
          status: BadgeStatus.PENDING,
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const query: WalletQueryDto = {
        page: 2,
        limit: 10,
      };

      mockPrismaService.badge.count.mockResolvedValue(25);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service.getWalletBadges(userId, query);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      // AC 2.12: No longer uses skip/take (fetches all for milestone merging)
      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientId: userId },
          orderBy: { issuedAt: 'desc' },
        }),
      );
    });

    it('should sort by issuedAt ascending when specified', async () => {
      const query: WalletQueryDto = {
        page: 1,
        limit: 50,
        sort: 'issuedAt_asc',
      };

      mockPrismaService.badge.count.mockResolvedValue(2);
      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      await service.getWalletBadges(userId, query);

      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { issuedAt: 'asc' },
        }),
      );
    });

    it('should generate date groups correctly', async () => {
      const query: WalletQueryDto = { page: 1, limit: 50 };

      mockPrismaService.badge.count.mockResolvedValue(2);
      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getWalletBadges(userId, query);

      expect(result.dateGroups).toBeDefined();
      expect(result.dateGroups[0]).toHaveProperty('label');
      expect(result.dateGroups[0]).toHaveProperty('count');
      expect(result.dateGroups[0]).toHaveProperty('startIndex');
      expect(result.dateGroups[0].label).toContain('2026');
    });

    it('should handle empty badge list', async () => {
      const query: WalletQueryDto = { page: 1, limit: 50 };

      mockPrismaService.badge.count.mockResolvedValue(0);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service.getWalletBadges(userId, query);

      expect(result.badges).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.dateGroups).toHaveLength(0);
    });
  });
});
