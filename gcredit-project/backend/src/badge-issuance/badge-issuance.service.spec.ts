import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { CSVParserService } from './services/csv-parser.service';
import { MilestonesService } from '../milestones/milestones.service';
import { TeamsBadgeNotificationService } from '../microsoft-graph/teams/teams-badge-notification.service';
import { NotFoundException, BadRequestException, GoneException } from '@nestjs/common';
import { BadgeStatus } from '@prisma/client';

describe('BadgeIssuanceService', () => {
  let service: BadgeIssuanceService;
  let prismaService: PrismaService;
  let assertionGenerator: AssertionGeneratorService;

  const mockPrismaService = {
    badgeTemplate: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    badge: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockAssertionGenerator = {
    generateClaimToken: jest.fn(),
    generateAssertion: jest.fn(),
    hashEmail: jest.fn(),
    getAssertionUrl: jest.fn(),
    getClaimUrl: jest.fn(),
    computeAssertionHash: jest.fn().mockReturnValue('mock-hash-12345'),
  };

  const mockNotificationService = {
    sendBadgeClaimNotification: jest.fn(),
  };

  const mockCSVParserService = {
    parseCSV: jest.fn(),
    validateCSVHeaders: jest.fn(),
  };

  const mockMilestonesService = {
    checkMilestones: jest.fn().mockResolvedValue(undefined),
  };

  const mockStorageService = {
    uploadBadgeImage: jest.fn(),
    getBadgeImageUrl: jest.fn(),
    deleteBadgeImage: jest.fn(),
  };

  const mockTeamsNotificationService = {
    sendBadgeIssuanceNotification: jest.fn().mockResolvedValue(undefined),
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
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    prismaService = module.get<PrismaService>(PrismaService);
    assertionGenerator = module.get<AssertionGeneratorService>(AssertionGeneratorService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueBadge', () => {
    const mockTemplate = {
      id: 'template-uuid',
      name: 'Test Badge',
      description: 'Test Description',
      imageUrl: 'https://example.com/image.png',
      status: 'ACTIVE',
      issuanceCriteria: { description: 'Test criteria' },
      category: 'skill',
      skillIds: [],
      validityPeriod: 365,
      createdBy: 'creator-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRecipient = {
      id: 'recipient-uuid',
      email: 'recipient@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: 'hash',
      role: 'EMPLOYEE',
      isActive: true,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockIssuer = {
      id: 'issuer-uuid',
      email: 'issuer@example.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: 'hash',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAssertion = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: 'https://example.com/api/badges/badge-uuid/assertion',
      badge: {
        type: 'BadgeClass',
        id: 'https://example.com/api/badge-templates/template-uuid',
        name: 'Test Badge',
      },
    };

    const issueDto = {
      templateId: 'template-uuid',
      recipientId: 'recipient-uuid',
      evidenceUrl: 'https://example.com/evidence.pdf',
      expiresIn: 365,
    };

    it('should issue badge successfully with valid inputs', async () => {
      // Arrange
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);
      mockAssertionGenerator.generateClaimToken.mockReturnValue('a'.repeat(32));
      mockAssertionGenerator.generateAssertion.mockReturnValue(mockAssertion);
      mockAssertionGenerator.hashEmail.mockReturnValue('sha256$hashvalue');
      mockAssertionGenerator.getAssertionUrl.mockReturnValue('https://example.com/assertion');
      mockAssertionGenerator.getClaimUrl.mockReturnValue('https://example.com/claim?token=aaa');

      const mockCreatedBadge = {
        id: 'badge-uuid',
        templateId: issueDto.templateId,
        recipientId: issueDto.recipientId,
        issuerId: mockIssuer.id,
        status: BadgeStatus.PENDING,
        claimToken: 'a'.repeat(32),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        evidenceUrl: issueDto.evidenceUrl,
        claimedAt: null,
        revokedAt: null,
        revocationReason: null,
        assertionJson: mockAssertion,
        recipientHash: 'sha256$hashvalue',
      };

      mockPrismaService.badge.create.mockResolvedValue(mockCreatedBadge);
      mockPrismaService.badge.update.mockResolvedValue(mockCreatedBadge);

      // Act
      const result = await service.issueBadge(issueDto, mockIssuer.id);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.status).toBe(BadgeStatus.PENDING);
      expect(result.claimToken).toHaveLength(32);
      expect(result).toHaveProperty('claimUrl');
      expect(result).toHaveProperty('assertionUrl');
      expect(mockPrismaService.badgeTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: issueDto.templateId },
      });
      expect(mockPrismaService.badge.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        `Badge template ${issueDto.templateId} not found`,
      );
    });

    it('should throw BadRequestException if template not ACTIVE', async () => {
      // Arrange
      const inactiveTemplate = { ...mockTemplate, status: 'DRAFT' };
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(inactiveTemplate);

      // Act & Assert
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        `Badge template ${mockTemplate.name} is not active`,
      );
    });

    it('should throw NotFoundException if recipient not found', async () => {
      // Arrange
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.issueBadge(issueDto, mockIssuer.id)).rejects.toThrow(
        `Recipient ${issueDto.recipientId} not found`,
      );
    });

    it('should generate unique claim token', async () => {
      // Arrange
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);
      
      const token1 = 'a'.repeat(32);
      const token2 = 'b'.repeat(32);
      mockAssertionGenerator.generateClaimToken
        .mockReturnValueOnce(token1)
        .mockReturnValueOnce(token2);
      
      mockAssertionGenerator.generateAssertion.mockReturnValue(mockAssertion);
      mockAssertionGenerator.hashEmail.mockReturnValue('sha256$hashvalue');
      mockAssertionGenerator.getAssertionUrl.mockReturnValue('https://example.com/assertion');
      mockAssertionGenerator.getClaimUrl.mockReturnValue('https://example.com/claim?token=aaa');

      const mockCreatedBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.PENDING,
        claimToken: token1,
        issuedAt: new Date(),
        expiresAt: null,
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        templateId: issueDto.templateId,
        recipientId: issueDto.recipientId,
        issuerId: mockIssuer.id,
        evidenceUrl: null,
        claimedAt: null,
        revokedAt: null,
        revocationReason: null,
        assertionJson: mockAssertion,
        recipientHash: 'sha256$hashvalue',
      };

      mockPrismaService.badge.create.mockResolvedValue(mockCreatedBadge);
      mockPrismaService.badge.update.mockResolvedValue(mockCreatedBadge);

      // Act
      const result1 = await service.issueBadge(
        { ...issueDto, expiresIn: undefined },
        mockIssuer.id,
      );

      // Reset for second call
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);

      const mockCreatedBadge2 = { ...mockCreatedBadge, claimToken: token2 };
      mockPrismaService.badge.create.mockResolvedValue(mockCreatedBadge2);
      mockPrismaService.badge.update.mockResolvedValue(mockCreatedBadge2);

      const result2 = await service.issueBadge(
        { ...issueDto, expiresIn: undefined },
        mockIssuer.id,
      );

      // Assert
      expect(result1.claimToken).toBe(token1);
      expect(result2.claimToken).toBe(token2);
      expect(result1.claimToken).not.toBe(result2.claimToken);
    });

    it('should calculate expiration date correctly', async () => {
      // Arrange
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);
      mockAssertionGenerator.generateClaimToken.mockReturnValue('a'.repeat(32));
      mockAssertionGenerator.generateAssertion.mockReturnValue(mockAssertion);
      mockAssertionGenerator.hashEmail.mockReturnValue('sha256$hashvalue');
      mockAssertionGenerator.getAssertionUrl.mockReturnValue('https://example.com/assertion');
      mockAssertionGenerator.getClaimUrl.mockReturnValue('https://example.com/claim?token=aaa');

      const now = new Date();
      const expectedExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const mockCreatedBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.PENDING,
        claimToken: 'a'.repeat(32),
        issuedAt: now,
        expiresAt: expectedExpiresAt,
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        templateId: issueDto.templateId,
        recipientId: issueDto.recipientId,
        issuerId: mockIssuer.id,
        evidenceUrl: issueDto.evidenceUrl,
        claimedAt: null,
        revokedAt: null,
        revocationReason: null,
        assertionJson: mockAssertion,
        recipientHash: 'sha256$hashvalue',
      };

      mockPrismaService.badge.create.mockResolvedValue(mockCreatedBadge);
      mockPrismaService.badge.update.mockResolvedValue(mockCreatedBadge);

      // Act
      const result = await service.issueBadge(issueDto, mockIssuer.id);

      // Assert
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      // Check expiration is approximately 365 days in the future (within 1 second tolerance)
      const actualDiff = result.expiresAt!.getTime() - now.getTime();
      const expectedDiff = 365 * 24 * 60 * 60 * 1000;
      expect(Math.abs(actualDiff - expectedDiff)).toBeLessThan(1000);
    });
  });

  describe('claimBadge', () => {
    const mockClaimToken = 'a'.repeat(32);
    const mockTemplate = {
      id: 'template-uuid',
      name: 'Test Badge',
      description: 'Test Description',
      imageUrl: 'https://example.com/image.png',
      status: 'ACTIVE',
    };

    const mockRecipient = {
      id: 'recipient-uuid',
      email: 'recipient@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should claim badge with valid token', async () => {
      // Arrange
      const mockPendingBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.PENDING,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        claimToken: mockClaimToken,
        template: mockTemplate,
        recipient: mockRecipient,
      };

      const mockClaimedBadge = {
        ...mockPendingBadge,
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date(),
        claimToken: null,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockPendingBadge);
      mockPrismaService.badge.update.mockResolvedValue(mockClaimedBadge);
      mockAssertionGenerator.getAssertionUrl.mockReturnValue('http://localhost:3000/api/badges/badge-uuid/assertion');

      // Act
      const result = await service.claimBadge(mockClaimToken);

      // Assert
      expect(result.status).toBe(BadgeStatus.CLAIMED);
      expect(result.claimedAt).toBeDefined();
      expect(result.badge.name).toBe(mockTemplate.name);
      expect(result.message).toContain('successfully');
      expect(mockPrismaService.badge.update).toHaveBeenCalledWith({
        where: { id: mockPendingBadge.id },
        data: {
          status: BadgeStatus.CLAIMED,
          claimedAt: expect.any(Date),
          claimToken: null,
        },
        include: {
          template: true,
          recipient: true,
        },
      });
    });

    it('should throw NotFoundException for invalid token', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.claimBadge('invalid-token-' + 'x'.repeat(19)))
        .rejects
        .toThrow(NotFoundException);
      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { claimToken: 'invalid-token-' + 'x'.repeat(19) },
        include: {
          template: true,
          recipient: true,
        },
      });
    });

    it('should throw BadRequestException if already claimed', async () => {
      // Arrange
      const mockClaimedBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.CLAIMED,
        issuedAt: new Date(),
        claimToken: null,
        template: mockTemplate,
        recipient: mockRecipient,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockClaimedBadge);

      // Act & Assert
      await expect(service.claimBadge(mockClaimToken))
        .rejects
        .toThrow(BadRequestException);
      expect(mockPrismaService.badge.update).not.toHaveBeenCalled();
    });

    it('should throw GoneException if revoked', async () => {
      // Arrange
      const mockRevokedBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.REVOKED,
        issuedAt: new Date(),
        claimToken: mockClaimToken,
        template: mockTemplate,
        recipient: mockRecipient,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockRevokedBadge);

      // Act & Assert
      await expect(service.claimBadge(mockClaimToken))
        .rejects
        .toThrow(GoneException);
      expect(mockPrismaService.badge.update).not.toHaveBeenCalled();
    });

    it('should throw GoneException if claim token expired (>7 days)', async () => {
      // Arrange
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const mockExpiredTokenBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.PENDING,
        issuedAt: eightDaysAgo,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        claimToken: mockClaimToken,
        template: mockTemplate,
        recipient: mockRecipient,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockExpiredTokenBadge);

      // Act & Assert
      await expect(service.claimBadge(mockClaimToken))
        .rejects
        .toThrow(GoneException);
      await expect(service.claimBadge(mockClaimToken))
        .rejects
        .toThrow(/Claim token has expired/);
      expect(mockPrismaService.badge.update).not.toHaveBeenCalled();
    });
  });
});
