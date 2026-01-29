/**
 * Unit tests for TeamsBadgeNotificationService
 * Story 7.4 - Microsoft Teams Notifications
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TeamsBadgeNotificationService } from './teams-badge-notification.service';
import { GraphTeamsService } from '../services/graph-teams.service';
import { BadgeNotificationCardBuilder } from './adaptive-cards/badge-notification.builder';
import { PrismaService } from '../../common/prisma.service';

describe('TeamsBadgeNotificationService - Story 7.4', () => {
  let service: TeamsBadgeNotificationService;
  let graphTeamsService: GraphTeamsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockGraphTeamsService = {
    sendActivityNotification: jest.fn(),
    isGraphTeamsEnabled: jest.fn().mockReturnValue(true),
  };

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    credential: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        PLATFORM_URL: 'https://g-credit.com',
        ENABLE_TEAMS_NOTIFICATIONS: true,
      };
      return config[key];
    }),
  };

  const mockBadgeData = {
    id: 'badge-123',
    name: 'Full-Stack Developer Certification',
    description: 'This badge recognizes proficiency in full-stack development.',
    imageUrl: 'https://storage.azure.com/badges/test-badge.png',
    badgeTemplate: {
      issuer: {
        id: 'issuer-456',
        name: 'Acme Tech University',
      },
    },
  };

  const mockRecipient = {
    id: 'user-789',
    name: 'John Smith',
    email: 'john.smith@example.com',
  };

  const mockCredential = {
    id: 'credential-101',
    issuedAt: new Date('2026-01-30T12:00:00Z'),
    status: 'PENDING',
    claimToken: 'claim-token-xyz',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsBadgeNotificationService,
        {
          provide: GraphTeamsService,
          useValue: mockGraphTeamsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TeamsBadgeNotificationService>(
      TeamsBadgeNotificationService,
    );
    graphTeamsService = module.get<GraphTeamsService>(GraphTeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('sendBadgeIssuanceNotification', () => {
    it('should send Teams notification with Adaptive Card', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        include: { badgeTemplate: { include: { issuer: true } } },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-789' },
      });
      expect(mockPrismaService.credential.findFirst).toHaveBeenCalledWith({
        where: { badgeId: 'badge-123', userId: 'user-789' },
        orderBy: { issuedAt: 'desc' },
      });

      expect(mockGraphTeamsService.sendActivityNotification).toHaveBeenCalled();
      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      expect(callArgs[0]).toBe(mockRecipient.email); // userId
      expect(callArgs[1]).toBe('badgeEarned'); // activityType
      expect(callArgs[2]).toContain(mockBadgeData.name); // previewText
      expect(callArgs[4]).toBeDefined(); // adaptiveCard
    });

    it('should throw error if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.sendBadgeIssuanceNotification('badge-999', 'user-789'),
      ).rejects.toThrow('Badge not found: badge-999');
    });

    it('should throw error if recipient not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.sendBadgeIssuanceNotification('badge-123', 'user-999'),
      ).rejects.toThrow('Recipient user not found: user-999');
    });

    it('should throw error if credential not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(null);

      await expect(
        service.sendBadgeIssuanceNotification('badge-123', 'user-789'),
      ).rejects.toThrow('Credential not found for badge and user');
    });

    it('should include claim URL when credential has PENDING status', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      const adaptiveCard = callArgs[4];
      const cardJson = JSON.stringify(adaptiveCard);

      expect(cardJson).toContain('claim?token=claim-token-xyz');
    });

    it('should not include claim URL when credential is CLAIMED', async () => {
      const claimedCredential = { ...mockCredential, status: 'CLAIMED' };
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(
        claimedCredential,
      );

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      const adaptiveCard = callArgs[4];

      // Adaptive Card should not have claim URL
      expect(adaptiveCard.actions.length).toBe(1); // Only "View Badge" button
    });

    it('should skip notification if Teams is disabled', async () => {
      mockGraphTeamsService.isGraphTeamsEnabled.mockReturnValue(false);
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      expect(mockGraphTeamsService.sendActivityNotification).not.toHaveBeenCalled();
    });

    it('should handle Graph API errors gracefully', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);
      
      // Mock the error AFTER enabling Teams
      mockGraphTeamsService.isGraphTeamsEnabled.mockReturnValue(true);
      mockGraphTeamsService.sendActivityNotification.mockRejectedValueOnce(
        new Error('Graph API rate limit exceeded'),
      );

      await expect(
        service.sendBadgeIssuanceNotification('badge-123', 'user-789'),
      ).rejects.toThrow('Graph API rate limit exceeded');
      
      // Verify the error was thrown after attempting to send
      expect(mockGraphTeamsService.sendActivityNotification).toHaveBeenCalled();
    });

    it('should format date correctly in Adaptive Card', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrismaService.credential.findFirst.mockResolvedValue(mockCredential);
      
      // Ensure Teams is enabled for this test
      mockGraphTeamsService.isGraphTeamsEnabled.mockReturnValue(true);
      mockGraphTeamsService.sendActivityNotification.mockResolvedValueOnce(undefined);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      expect(mockGraphTeamsService.sendActivityNotification).toHaveBeenCalled();
      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      
      // The adaptive card is the 5th argument (index 4)
      expect(callArgs).toHaveLength(5);
      const adaptiveCard = callArgs[4];
      expect(adaptiveCard).toBeDefined();

      // Find the FactSet container
      const detailsContainer = adaptiveCard.body[1];
      const factSet = detailsContainer.items[0];
      const issueDateFact = factSet.facts.find(
        (f) => f.title === 'Issued On:',
      );

      expect(issueDateFact.value).toBe('January 30, 2026');
    });
  });

  describe('buildAdaptiveCard', () => {
    it('should build Adaptive Card with all required data', () => {
      const cardData = {
        badgeImageUrl: mockBadgeData.imageUrl,
        badgeName: mockBadgeData.name,
        issuerName: mockBadgeData.badgeTemplate.issuer.name,
        recipientName: mockRecipient.name,
        issueDate: 'January 30, 2026',
        badgeId: mockBadgeData.id,
        badgeDescription: mockBadgeData.description,
        badgeWalletUrl: 'https://g-credit.com/wallet',
        claimUrl: 'https://g-credit.com/claim?token=claim-token-xyz',
      };

      const card = BadgeNotificationCardBuilder.build(cardData);

      expect(card).toHaveProperty('type', 'AdaptiveCard');
      expect(card).toHaveProperty('version', '1.4');
      expect(card.actions).toHaveLength(2); // View Badge + Claim Now
    });
  });
});
