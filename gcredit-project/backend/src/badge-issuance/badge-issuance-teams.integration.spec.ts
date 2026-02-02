/**
 * Badge Issuance → Teams Notification Integration Tests
 *
 * Story 7.4 Task 4
 * Verifies Teams notification is triggered when badge is issued
 */

/**
 * Badge Issuance Teams Integration Tests
 *
 * TECHNICAL DEBT: Teams integration tests may fail.
 * Badge issuance now uses email notifications (fully working).
 * Teams channel notifications deferred pending permissions.
 * See: docs/sprints/sprint-6/technical-debt.md
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';
import { TeamsBadgeNotificationService } from '../microsoft-graph/teams/teams-badge-notification.service';
import { PrismaService } from '../common/prisma.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { CSVParserService } from './services/csv-parser.service';
import { MilestonesService } from '../milestones/milestones.service';
import { StorageService } from '../common/storage.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { BadgeStatus } from '@prisma/client';

describe('BadgeIssuanceService - Teams Integration', () => {
  let service: BadgeIssuanceService;
  let teamsNotificationService: jest.Mocked<TeamsBadgeNotificationService>;
  let prismaService: jest.Mocked<PrismaService>;
  let assertionGenerator: jest.Mocked<AssertionGeneratorService>;
  let notificationService: jest.Mocked<BadgeNotificationService>;
  let milestonesService: jest.Mocked<MilestonesService>;

  const mockTemplate = {
    id: 'template-123',
    name: 'Test Badge',
    description: 'Test description',
    imageUrl: 'https://example.com/badge.png',
    status: 'ACTIVE',
    category: 'ACHIEVEMENT',
    skillIds: [],
    createdBy: 'admin-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    requiredEvidenceCount: 0,
    validityPeriodDays: null,
  };

  const mockRecipient = {
    id: 'user-123',
    email: 'recipient@test.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hash',
    role: 'EMPLOYEE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
    lastLogin: null,
  };

  const mockIssuer = {
    id: 'issuer-456',
    email: 'issuer@test.com',
    firstName: 'Issuer',
    lastName: 'Admin',
    passwordHash: 'hash',
    role: 'ISSUER' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: false,
    lastLogin: null,
  };

  const mockBadge = {
    id: 'badge-789',
    templateId: 'template-123',
    recipientId: 'user-123',
    issuerId: 'issuer-456',
    status: BadgeStatus.PENDING,
    issuedAt: new Date(),
    expiresAt: null,
    claimedAt: null,
    revokedAt: null,
    revokedReason: null,
    evidenceUrl: null,
    claimToken: 'claim-token-abc',
    recipientHash: 'hash-abc',
    assertionJson: {},
    verificationId: 'verify-123',
    metadataHash: 'metadata-hash-abc',
    template: mockTemplate,
    recipient: mockRecipient,
    issuer: mockIssuer,
    evidenceFiles: [],
  };

  beforeEach(async () => {
    // Create mocks
    const mockPrismaService = {
      badgeTemplate: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      badge: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockTeamsNotificationService = {
      sendBadgeIssuanceNotification: jest.fn(),
    };

    const mockAssertionGenerator = {
      generateClaimToken: jest.fn(),
      hashEmail: jest.fn(),
      generateAssertion: jest.fn(),
      computeAssertionHash: jest.fn(),
      getClaimUrl: jest.fn(),
      getAssertionUrl: jest.fn(),
    };

    const mockNotificationService = {
      sendBadgeClaimNotification: jest.fn(),
    };

    const mockMilestonesService = {
      checkMilestones: jest.fn(),
    };

    const mockStorageService = {};
    const mockCSVParser = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeIssuanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: TeamsBadgeNotificationService,
          useValue: mockTeamsNotificationService,
        },
        {
          provide: AssertionGeneratorService,
          useValue: mockAssertionGenerator,
        },
        {
          provide: BadgeNotificationService,
          useValue: mockNotificationService,
        },
        { provide: MilestonesService, useValue: mockMilestonesService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CSVParserService, useValue: mockCSVParser },
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    teamsNotificationService = module.get(TeamsBadgeNotificationService);
    prismaService = module.get(PrismaService);
    assertionGenerator = module.get(AssertionGeneratorService);
    notificationService = module.get(BadgeNotificationService);
    milestonesService = module.get(MilestonesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueBadge with Teams notification', () => {
    const issueDto: IssueBadgeDto = {
      templateId: 'template-123',
      recipientId: 'user-123',
      evidenceUrl: 'https://example.com/evidence.pdf',
    };

    beforeEach(() => {
      // Setup default mocks
      prismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient) // First call for recipient
        .mockResolvedValueOnce(mockIssuer); // Second call for issuer

      prismaService.badge.create.mockResolvedValue(mockBadge);
      prismaService.badge.update.mockResolvedValue(mockBadge);

      assertionGenerator.generateClaimToken.mockReturnValue('claim-token-abc');
      assertionGenerator.hashEmail.mockReturnValue('hash-abc');
      assertionGenerator.generateAssertion.mockReturnValue({
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'https://example.com/assertions/badge-789',
      });
      assertionGenerator.computeAssertionHash.mockReturnValue(
        'metadata-hash-abc',
      );
      assertionGenerator.getClaimUrl.mockReturnValue(
        'https://example.com/claim/claim-token-abc',
      );
      assertionGenerator.getAssertionUrl.mockReturnValue(
        'https://example.com/assertions/badge-789',
      );

      notificationService.sendBadgeClaimNotification.mockResolvedValue(
        undefined,
      );
      milestonesService.checkMilestones.mockResolvedValue(undefined);
      teamsNotificationService.sendBadgeIssuanceNotification.mockResolvedValue(
        undefined,
      );
    });

    it('should trigger Teams notification after badge issuance', async () => {
      // Act
      await service.issueBadge(issueDto, 'issuer-456');

      // Wait for async Teams notification
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(
        teamsNotificationService.sendBadgeIssuanceNotification,
      ).toHaveBeenCalledWith('badge-789', 'user-123');
    });

    it('should not block badge issuance if Teams notification fails', async () => {
      // Arrange
      teamsNotificationService.sendBadgeIssuanceNotification.mockRejectedValue(
        new Error('Teams API unavailable'),
      );

      // Act
      const result = await service.issueBadge(issueDto, 'issuer-456');

      // Assert - Badge should still be created
      expect(result).toBeDefined();
      expect(result.id).toBe('badge-789');
      expect(result.status).toBe(BadgeStatus.PENDING);

      // Wait for async Teams notification attempt
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Teams notification should have been attempted
      expect(
        teamsNotificationService.sendBadgeIssuanceNotification,
      ).toHaveBeenCalled();
    });

    it('should send both email and Teams notifications', async () => {
      // Act
      await service.issueBadge(issueDto, 'issuer-456');

      // Wait for async notifications
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Both notifications sent
      expect(
        notificationService.sendBadgeClaimNotification,
      ).toHaveBeenCalledWith({
        recipientEmail: 'recipient@test.com',
        recipientName: 'Test User',
        badgeName: 'Test Badge',
        badgeDescription: 'Test description',
        badgeImageUrl: 'https://example.com/badge.png',
        claimUrl: 'https://example.com/claim/claim-token-abc',
      });

      expect(
        teamsNotificationService.sendBadgeIssuanceNotification,
      ).toHaveBeenCalledWith('badge-789', 'user-123');
    });

    it('should log warning when Teams notification fails', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(service['logger'], 'warn');
      teamsNotificationService.sendBadgeIssuanceNotification.mockRejectedValue(
        new Error('Network timeout'),
      );

      // Act
      await service.issueBadge(issueDto, 'issuer-456');

      // Wait for async notification
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Teams notification failed for badge badge-789',
        ),
      );
    });
  });
});
