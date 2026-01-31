/**
 * Unit tests for TeamsBadgeNotificationService
 * Story 7.4 - Microsoft Teams Notifications
 * Task 6: Email Fallback Testing
 * 
 * NOTE: Some tests may fail due to Teams channel sharing being technical debt.
 * Teams channel sharing requires ChannelMessage.Send Graph API permission.
 * See: docs/sprints/sprint-6/technical-debt.md
 * Core email notification functionality is working and tested.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TeamsBadgeNotificationService } from './teams-badge-notification.service';
import { GraphTeamsService } from '../services/graph-teams.service';
import { BadgeNotificationCardBuilder } from './adaptive-cards/badge-notification.builder';
import { PrismaService } from '../../common/prisma.service';
import { BadgeNotificationService } from '../../badge-issuance/services/badge-notification.service';

describe('TeamsBadgeNotificationService - Story 7.4', () => {
  let service: TeamsBadgeNotificationService;
  let graphTeamsService: GraphTeamsService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let emailNotificationService: BadgeNotificationService;

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

  const mockEmailNotificationService = {
    sendBadgeClaimNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockBadgeData = {
    id: 'badge-123',
    status: 'PENDING',
    issuedAt: new Date('2026-01-30T12:00:00Z'),
    claimToken: 'claim-token-xyz',
    recipientId: 'user-789',
    issuerId: 'issuer-456',
    template: {
      id: 'template-001',
      name: 'Full-Stack Developer Certification',
      description: 'This badge recognizes proficiency in full-stack development.',
      imageUrl: 'https://storage.azure.com/badges/test-badge.png',
    },
    issuer: {
      id: 'issuer-456',
      firstName: 'Acme',
      lastName: 'Tech University',
      email: 'issuer@example.com',
    },
  };

  const mockRecipient = {
    id: 'user-789',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
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
        {
          provide: BadgeNotificationService,
          useValue: mockEmailNotificationService,
        },
      ],
    }).compile();

    service = module.get<TeamsBadgeNotificationService>(
      TeamsBadgeNotificationService,
    );
    graphTeamsService = module.get<GraphTeamsService>(GraphTeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    emailNotificationService = module.get<BadgeNotificationService>(BadgeNotificationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('sendBadgeIssuanceNotification', () => {
    it('should send Teams notification with Adaptive Card', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        include: { template: true, issuer: true },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-789' },
      });

      expect(mockGraphTeamsService.sendActivityNotification).toHaveBeenCalled();
      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      expect(callArgs[0]).toBe(mockRecipient.email); // userId
      expect(callArgs[1]).toBe('badgeEarned'); // activityType
      expect(callArgs[2]).toContain(mockBadgeData.template.name); // previewText
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

    it('should include claim URL when badge has PENDING status', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      const callArgs =
        mockGraphTeamsService.sendActivityNotification.mock.calls[0];
      const adaptiveCard = callArgs[4];
      const cardJson = JSON.stringify(adaptiveCard);

      expect(cardJson).toContain('claim?token=claim-token-xyz');
    });

    it('should not include claim URL when badge is CLAIMED', async () => {
      const claimedBadge = { ...mockBadgeData, status: 'CLAIMED', claimToken: null };
      mockPrismaService.badge.findUnique.mockResolvedValue(claimedBadge);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);

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

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      expect(mockGraphTeamsService.sendActivityNotification).not.toHaveBeenCalled();
    });

    it('should handle Graph API errors gracefully', async () => {
      // Task 6: Updated - now sends email fallback instead of throwing
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      
      // Mock the error AFTER enabling Teams
      mockGraphTeamsService.isGraphTeamsEnabled.mockReturnValue(true);
      mockGraphTeamsService.sendActivityNotification.mockRejectedValueOnce(
        new Error('Graph API rate limit exceeded'),
      );
      mockEmailNotificationService.sendBadgeClaimNotification.mockResolvedValue(undefined);

      // Should NOT throw - email fallback handles it
      await expect(
        service.sendBadgeIssuanceNotification('badge-123', 'user-789'),
      ).resolves.not.toThrow();
      
      // Verify Teams was attempted
      expect(mockGraphTeamsService.sendActivityNotification).toHaveBeenCalled();
      
      // Verify email fallback was triggered
      expect(mockEmailNotificationService.sendBadgeClaimNotification).toHaveBeenCalledWith({
        recipientEmail: 'john.smith@example.com',
        recipientName: 'John Smith',
        badgeName: 'Full-Stack Developer Certification',
        badgeDescription: 'This badge recognizes proficiency in full-stack development.',
        badgeImageUrl: 'https://storage.azure.com/badges/test-badge.png',
        claimUrl: 'https://g-credit.com/claim?token=claim-token-xyz',
      });
    });

    it('should send email fallback when Teams fails', async () => {
      // Task 6: Test email fallback
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);

      mockGraphTeamsService.isGraphTeamsEnabled.mockReturnValue(true);
      mockGraphTeamsService.sendActivityNotification.mockRejectedValueOnce(
        new Error('Teams service unavailable'),
      );
      mockEmailNotificationService.sendBadgeClaimNotification.mockResolvedValue(undefined);

      await service.sendBadgeIssuanceNotification('badge-123', 'user-789');

      // Verify email was sent
      expect(mockEmailNotificationService.sendBadgeClaimNotification).toHaveBeenCalledTimes(1);
      expect(mockEmailNotificationService.sendBadgeClaimNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'john.smith@example.com',
          recipientName: 'John Smith',
          badgeName: 'Full-Stack Developer Certification',
        }),
      );
    });

    it('should throw if email notification fails', async () => {
      // Badge issuance notification via email - should throw on failure
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);

      mockEmailNotificationService.sendBadgeClaimNotification.mockRejectedValueOnce(
        new Error('Email service down'),
      );

      // Should throw when email fails since email is the primary notification method
      await expect(
        service.sendBadgeIssuanceNotification('badge-123', 'user-789'),
      ).rejects.toThrow('Email service down');

      expect(mockEmailNotificationService.sendBadgeClaimNotification).toHaveBeenCalled();
    });

    it('should format date correctly in Adaptive Card', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadgeData);
      mockPrismaService.user.findUnique.mockResolvedValue(mockRecipient);
      
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
        badgeImageUrl: mockBadgeData.template.imageUrl,
        badgeName: mockBadgeData.template.name,
        issuerName: 'Acme Tech University',
        recipientName: 'John Smith',
        issueDate: 'January 30, 2026',
        badgeId: mockBadgeData.id,
        badgeDescription: mockBadgeData.template.description,
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
