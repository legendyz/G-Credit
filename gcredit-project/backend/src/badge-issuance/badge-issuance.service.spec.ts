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
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { BadgeStatus } from '@prisma/client';
import {
  anyDate,
  containing,
  strContaining,
} from '../../test/helpers/jest-typed-matchers';

describe('BadgeIssuanceService', () => {
  let service: BadgeIssuanceService;
  let _prismaService: PrismaService;
  let _assertionGenerator: AssertionGeneratorService;

  // Explicit type annotation breaks circular reference (TS7022/TS7024)
  const mockPrismaService: {
    badgeTemplate: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    badge: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      count?: jest.Mock;
      findMany?: jest.Mock;
    };
    auditLog: { create: jest.Mock };
    $transaction: jest.Mock;
  } = {
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
    auditLog: {
      create: jest.fn(),
    },
    // Interactive transaction: execute callback with tx proxy that delegates to badge mocks
    $transaction: jest.fn(
      async (callback: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
        const tx: { badge: { create: jest.Mock; update: jest.Mock } } = {
          badge: {
            create: mockPrismaService.badge.create,
            update: mockPrismaService.badge.update,
          },
        };
        return callback(tx);
      },
    ),
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
    sendBadgeRevocationNotification: jest
      .fn()
      .mockResolvedValue({ success: true, attempts: 1 }),
  };

  const mockCSVParserService = {
    parseCSV: jest.fn(),
    validateCSVHeaders: jest.fn(),
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
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const config: Record<string, string> = {
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
    _prismaService = module.get<PrismaService>(PrismaService);
    _assertionGenerator = module.get<AssertionGeneratorService>(
      AssertionGeneratorService,
    );

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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);
      mockAssertionGenerator.generateClaimToken.mockReturnValue('a'.repeat(32));
      mockAssertionGenerator.generateAssertion.mockReturnValue(mockAssertion);
      mockAssertionGenerator.hashEmail.mockReturnValue('sha256$hashvalue');
      mockAssertionGenerator.getAssertionUrl.mockReturnValue(
        'https://example.com/assertion',
      );
      mockAssertionGenerator.getClaimUrl.mockReturnValue(
        'https://example.com/claim?token=aaa',
      );

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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        inactiveTemplate,
      );

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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
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
      mockAssertionGenerator.getAssertionUrl.mockReturnValue(
        'https://example.com/assertion',
      );
      mockAssertionGenerator.getClaimUrl.mockReturnValue(
        'https://example.com/claim?token=aaa',
      );

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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
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
      mockPrismaService.badgeTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockRecipient)
        .mockResolvedValueOnce(mockIssuer);
      mockAssertionGenerator.generateClaimToken.mockReturnValue('a'.repeat(32));
      mockAssertionGenerator.generateAssertion.mockReturnValue(mockAssertion);
      mockAssertionGenerator.hashEmail.mockReturnValue('sha256$hashvalue');
      mockAssertionGenerator.getAssertionUrl.mockReturnValue(
        'https://example.com/assertion',
      );
      mockAssertionGenerator.getClaimUrl.mockReturnValue(
        'https://example.com/claim?token=aaa',
      );

      const now = new Date();
      const expectedExpiresAt = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000,
      );

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
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockPendingBadge);
      mockPrismaService.badge.update.mockResolvedValue(mockClaimedBadge);
      mockAssertionGenerator.getAssertionUrl.mockReturnValue(
        'http://localhost:3000/api/badges/badge-uuid/assertion',
      );

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
          claimedAt: anyDate(),
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
      await expect(
        service.claimBadge('invalid-token-' + 'x'.repeat(19)),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { claimToken: 'invalid-token-' + 'x'.repeat(19) },
        include: {
          template: true,
          recipient: true,
        },
      });
    });

    it('should throw ForbiddenException if authenticated user is not the recipient', async () => {
      // Arrange
      const mockPendingBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.PENDING,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        claimToken: mockClaimToken,
        recipientId: 'recipient-uuid',
        template: mockTemplate,
        recipient: mockRecipient,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockPendingBadge);

      // Act & Assert — wrong user trying to claim
      await expect(
        service.claimBadge(mockClaimToken, 'wrong-user-uuid'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.badge.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if already claimed', async () => {
      // Arrange - token is kept after claim (not cleared)
      const mockClaimedBadge = {
        id: 'badge-uuid',
        status: BadgeStatus.CLAIMED,
        issuedAt: new Date(),
        claimToken: mockClaimToken,
        template: mockTemplate,
        recipient: mockRecipient,
      };

      mockPrismaService.badge.findUnique.mockResolvedValue(mockClaimedBadge);

      // Act & Assert
      await expect(service.claimBadge(mockClaimToken)).rejects.toThrow(
        BadRequestException,
      );
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
      await expect(service.claimBadge(mockClaimToken)).rejects.toThrow(
        GoneException,
      );
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

      mockPrismaService.badge.findUnique.mockResolvedValue(
        mockExpiredTokenBadge,
      );

      // Act & Assert
      await expect(service.claimBadge(mockClaimToken)).rejects.toThrow(
        GoneException,
      );
      await expect(service.claimBadge(mockClaimToken)).rejects.toThrow(
        /Claim token has expired/,
      );
      expect(mockPrismaService.badge.update).not.toHaveBeenCalled();
    });
  });

  // Sprint 7: Badge Revocation Tests (Story 9.1)
  describe('revokeBadge', () => {
    const mockBadgeId = 'badge-uuid-123';
    const mockAdminUser = {
      id: 'admin-id',
      email: 'admin@test.com',
      role: 'ADMIN',
    };
    const mockIssuerUser = {
      id: 'issuer-id',
      email: 'issuer@test.com',
      role: 'ISSUER',
    };
    const mockEmployeeUser = {
      id: 'employee-id',
      email: 'employee@test.com',
      role: 'EMPLOYEE',
    };
    const mockBadge = {
      id: mockBadgeId,
      status: BadgeStatus.CLAIMED,
      issuerId: 'issuer-id', // Use issuerId not issuedBy
      recipientEmail: 'recipient@test.com',
      name: 'Test Badge',
      template: {
        name: 'Test Template',
        description: 'Test description',
      },
      recipient: {
        email: 'recipient@test.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      mockPrismaService.badge.findUnique = jest.fn();
      mockPrismaService.user.findUnique = jest.fn();
      mockPrismaService.badge.update = jest.fn();
      mockPrismaService.$transaction = jest.fn();
    });

    describe('Authorization', () => {
      it('should allow ADMIN to revoke any badge', async () => {
        // Arrange
        mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadge,
                  status: BadgeStatus.REVOKED,
                  revokedBy: mockAdminUser.id,
                  revokedAt: new Date(),
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        const result = await service.revokeBadge(mockBadgeId, {
          reason: 'POLICY_VIOLATION',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(result.status).toBe(BadgeStatus.REVOKED);
        expect(result.revokedBy).toBe(mockAdminUser.id);
      });

      it('should allow ISSUER to revoke their own badges', async () => {
        // Arrange
        const ownBadge = {
          ...mockBadge,
          issuerId: mockIssuerUser.id, // Correct field name
        };
        mockPrismaService.badge.findUnique.mockResolvedValue(ownBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockIssuerUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...ownBadge,
                  status: BadgeStatus.REVOKED,
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        const result = await service.revokeBadge(mockBadgeId, {
          reason: 'ISSUED_IN_ERROR',
          actorId: mockIssuerUser.id,
        });

        // Assert
        expect(result.status).toBe(BadgeStatus.REVOKED);
      });

      it('should throw 403 if ISSUER tries to revoke others badge', async () => {
        // Arrange
        const otherBadge = {
          ...mockBadge,
          issuerId: 'other-issuer-id', // Different issuer
        };
        mockPrismaService.badge.findUnique.mockResolvedValue(otherBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockIssuerUser);

        // Act & Assert
        await expect(
          service.revokeBadge(mockBadgeId, {
            reason: 'POLICY_VIOLATION',
            actorId: mockIssuerUser.id,
          }),
        ).rejects.toThrow('cannot revoke badge');
      });

      it('should throw 403 if EMPLOYEE tries to revoke', async () => {
        // Arrange
        mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockEmployeeUser);

        // Act & Assert
        await expect(
          service.revokeBadge(mockBadgeId, {
            reason: 'POLICY_VIOLATION',
            actorId: mockEmployeeUser.id,
          }),
        ).rejects.toThrow('cannot revoke badge');
      });
    });

    describe('Idempotency', () => {
      it('should return 200 if badge already revoked', async () => {
        // Arrange
        const revokedBadge = {
          ...mockBadge,
          status: BadgeStatus.REVOKED,
          revokedAt: new Date(),
          revokedBy: mockAdminUser.id,
        };
        mockPrismaService.badge.findUnique.mockResolvedValue(revokedBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

        // Act
        const result = await service.revokeBadge(mockBadgeId, {
          reason: 'POLICY_VIOLATION',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(result.status).toBe(BadgeStatus.REVOKED);
        expect(result).toHaveProperty('alreadyRevoked', true);
        expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      });

      it('should NOT create duplicate audit log on re-revoke', async () => {
        // Arrange
        const revokedBadge = { ...mockBadge, status: BadgeStatus.REVOKED };
        mockPrismaService.badge.findUnique.mockResolvedValue(revokedBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'POLICY_VIOLATION',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      });
    });

    describe('Data Integrity', () => {
      it('should populate all revocation fields', async () => {
        // Arrange
        mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        const mockTimestamp = new Date();
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadge,
                  status: BadgeStatus.REVOKED,
                  revokedAt: mockTimestamp,
                  revokedBy: mockAdminUser.id,
                  revocationReason: 'EXPIRED',
                  revocationNotes: 'Badge validity period ended',
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        const result = await service.revokeBadge(mockBadgeId, {
          reason: 'EXPIRED',
          notes: 'Badge validity period ended',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(result.revokedAt).toBeInstanceOf(Date);
        expect(result.revokedBy).toBe(mockAdminUser.id);
        expect(result.revocationReason).toBe('EXPIRED');
        expect(result.revocationNotes).toBe('Badge validity period ended');
      });

      it('should create audit log entry', async () => {
        // Arrange
        mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        const mockAuditLogCreate = jest.fn().mockResolvedValue({});
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadge,
                  status: BadgeStatus.REVOKED,
                }),
              },
              auditLog: {
                create: mockAuditLogCreate,
              },
            });
          },
        );

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'POLICY_VIOLATION',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(mockAuditLogCreate).toHaveBeenCalledWith({
          data: containing({
            entityType: 'Badge',
            entityId: mockBadgeId,
            action: 'REVOKED',
            actorId: mockAdminUser.id,
            actorEmail: mockAdminUser.email,
          }),
        });
      });

      it('should throw 404 if badge not found', async () => {
        // Arrange
        mockPrismaService.badge.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.revokeBadge(mockBadgeId, {
            reason: 'POLICY_VIOLATION',
            actorId: mockAdminUser.id,
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    // Story 9.4: Badge Revocation Notifications
    describe('Email Notifications (Story 9.4)', () => {
      beforeEach(() => {
        mockNotificationService.sendBadgeRevocationNotification.mockClear();
      });

      it('should send revocation email notification when badge is revoked', async () => {
        // Arrange
        const mockRecipient = {
          email: 'recipient@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
        };
        const mockTemplate = {
          name: 'Advanced React Development',
        };
        const mockBadgeWithRecipient = {
          ...mockBadge,
          recipient: mockRecipient,
          template: mockTemplate,
        };

        mockPrismaService.badge.findUnique.mockResolvedValue(
          mockBadgeWithRecipient,
        );
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadgeWithRecipient,
                  status: BadgeStatus.REVOKED,
                  revokedAt: new Date(),
                  revokedBy: mockAdminUser.id,
                  revocationReason: 'Policy Violation',
                  revocationNotes: 'Test notes',
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'Policy Violation',
          notes: 'Test notes',
          actorId: mockAdminUser.id,
        });

        // Assert - Verify email notification was called with correct params
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).toHaveBeenCalledWith(
          containing({
            recipientEmail: 'recipient@test.com',
            recipientName: 'Jane Doe',
            badgeName: 'Advanced React Development',
            revocationReason: 'Policy Violation',
            revocationDate: anyDate(),
            revocationNotes: 'Test notes',
            walletUrl: strContaining('/wallet'),
          }),
        );
      });

      it('should send email with reason but no notes if notes not provided', async () => {
        // Arrange
        const mockRecipient = {
          email: 'john@test.com',
          firstName: 'John',
          lastName: 'Smith',
        };
        const mockTemplate = {
          name: 'Security Awareness',
        };
        const mockBadgeWithRecipient = {
          ...mockBadge,
          recipient: mockRecipient,
          template: mockTemplate,
        };

        mockPrismaService.badge.findUnique.mockResolvedValue(
          mockBadgeWithRecipient,
        );
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadgeWithRecipient,
                  status: BadgeStatus.REVOKED,
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'Expired',
          actorId: mockAdminUser.id,
        });

        // Assert
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).toHaveBeenCalledWith(
          containing({
            recipientEmail: 'john@test.com',
            recipientName: 'John Smith',
            badgeName: 'Security Awareness',
            revocationReason: 'Expired',
            revocationDate: anyDate(),
            revocationNotes: undefined,
          }),
        );
      });

      it('should NOT send email if badge already revoked (idempotency)', async () => {
        // Arrange
        const revokedBadge = {
          ...mockBadge,
          status: BadgeStatus.REVOKED,
          revokedAt: new Date(),
        };
        mockPrismaService.badge.findUnique.mockResolvedValue(revokedBadge);
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'Policy Violation',
          actorId: mockAdminUser.id,
        });

        // Assert - Email should NOT be sent for already-revoked badges
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).not.toHaveBeenCalled();
      });

      it('should NOT fail revocation if email sending fails', async () => {
        // Arrange
        const mockRecipient = {
          email: 'recipient@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
        };
        const mockBadgeWithRecipient = {
          ...mockBadge,
          recipient: mockRecipient,
        };

        mockPrismaService.badge.findUnique.mockResolvedValue(
          mockBadgeWithRecipient,
        );
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadgeWithRecipient,
                  status: BadgeStatus.REVOKED,
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Simulate email service failure
        mockNotificationService.sendBadgeRevocationNotification.mockRejectedValue(
          new Error('SMTP connection failed'),
        );

        // Act & Assert - Revocation should succeed even if email fails
        const result = await service.revokeBadge(mockBadgeId, {
          reason: 'Policy Violation',
          actorId: mockAdminUser.id,
        });

        expect(result.status).toBe(BadgeStatus.REVOKED);
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).toHaveBeenCalled();
      });

      it('should create audit log entry for notification result (AC3)', async () => {
        // Arrange
        const mockRecipient = {
          email: 'audit-test@test.com',
          firstName: 'Audit',
          lastName: 'Test',
        };
        const mockTemplate = { name: 'Audit Badge' };
        const mockBadgeWithRecipient = {
          ...mockBadge,
          recipient: mockRecipient,
          template: mockTemplate,
        };

        mockPrismaService.badge.findUnique.mockResolvedValue(
          mockBadgeWithRecipient,
        );
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadgeWithRecipient,
                  status: BadgeStatus.REVOKED,
                  revokedAt: new Date(),
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Mock notification result for audit
        mockNotificationService.sendBadgeRevocationNotification.mockResolvedValue(
          {
            success: true,
            attempts: 1,
          },
        );
        mockPrismaService.auditLog.create.mockResolvedValue({});

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'Policy Violation',
          actorId: mockAdminUser.id,
        });

        // Wait for async notification handling
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Assert - Audit log should be created for notification
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: containing({
            entityType: 'BadgeNotification',
            entityId: mockBadgeId,
            action: 'NOTIFICATION_SENT',
            metadata: containing({
              notificationType: 'REVOCATION',
              recipientEmail: 'audit-test@test.com',
              success: true,
              attempts: 1,
            }),
          }),
        });
      });

      it('should include revocationDate in notification (AC1 fix)', async () => {
        // Arrange
        const revokedAt = new Date('2026-02-01T10:00:00Z');
        const mockRecipient = {
          email: 'date-test@test.com',
          firstName: 'Date',
          lastName: 'Test',
        };
        const mockTemplate = { name: 'Date Test Badge' };
        const mockBadgeWithRecipient = {
          ...mockBadge,
          recipient: mockRecipient,
          template: mockTemplate,
        };

        mockPrismaService.badge.findUnique.mockResolvedValue(
          mockBadgeWithRecipient,
        );
        mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);
        mockPrismaService.$transaction.mockImplementation(
          (callback: (tx: unknown) => unknown) => {
            return callback({
              badge: {
                update: jest.fn().mockResolvedValue({
                  ...mockBadgeWithRecipient,
                  status: BadgeStatus.REVOKED,
                  revokedAt: revokedAt,
                }),
              },
              auditLog: {
                create: jest.fn().mockResolvedValue({}),
              },
            });
          },
        );

        // Act
        await service.revokeBadge(mockBadgeId, {
          reason: 'Expired',
          actorId: mockAdminUser.id,
        });

        // Assert - revocationDate should be passed
        expect(
          mockNotificationService.sendBadgeRevocationNotification,
        ).toHaveBeenCalledWith(
          containing({
            revocationDate: revokedAt,
          }),
        );
      });
    });
  });

  // Story 9.3: Employee Wallet Display for Revoked Badges
  describe('getWalletBadges - Story 9.3', () => {
    const mockUserId = 'user-uuid-123';

    describe('Revocation Fields Inclusion', () => {
      it('should include revocation fields when badge is REVOKED', async () => {
        // Arrange
        const revokedBadge = {
          id: 'badge-1',
          recipientId: mockUserId,
          status: BadgeStatus.REVOKED,
          issuedAt: new Date('2026-01-15'),
          claimedAt: new Date('2026-01-16'),
          revokedAt: new Date('2026-02-01'),
          revocationReason: 'Policy Violation',
          revocationNotes: 'Violated company code of conduct',
          revokedBy: 'admin-uuid',
          template: {
            id: 'template-1',
            name: 'Badge 1',
            description: 'Test Badge',
            imageUrl: '/badge1.png',
            category: 'Technical',
          },
          issuer: {
            id: 'issuer-1',
            firstName: 'John',
            lastName: 'Manager',
            email: 'manager@test.com',
          },
          revoker: {
            id: 'admin-uuid',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@test.com',
            role: 'ADMIN',
          },
        };

        mockPrismaService.badge.count = jest.fn().mockResolvedValue(1);
        mockPrismaService.badge.findMany = jest
          .fn()
          .mockResolvedValue([revokedBadge]);
        mockMilestonesService.getUserAchievements = jest
          .fn()
          .mockResolvedValue([]);

        // Act
        const result = await service.getWalletBadges(mockUserId, {});

        // Assert - Revocation fields should be present
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toHaveProperty('status', BadgeStatus.REVOKED);
        expect(result.data[0]).toHaveProperty('revokedAt');
        expect(result.data[0]).toHaveProperty(
          'revocationReason',
          'Policy Violation',
        );
        expect(result.data[0]).toHaveProperty(
          'revocationNotes',
          'Violated company code of conduct',
        );
        expect(result.data[0]).toHaveProperty('revokedBy');
      });

      it('should NOT include revocation fields when badge is CLAIMED', async () => {
        // Arrange
        const claimedBadge = {
          id: 'badge-2',
          recipientId: mockUserId,
          status: BadgeStatus.CLAIMED,
          issuedAt: new Date('2026-01-15'),
          claimedAt: new Date('2026-01-16'),
          revokedAt: null,
          revocationReason: null,
          revocationNotes: null,
          revokedBy: null,
          template: {
            id: 'template-2',
            name: 'Active Badge',
            description: 'Active Test Badge',
            imageUrl: '/badge2.png',
            category: 'Leadership',
          },
          issuer: {
            id: 'issuer-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
          },
        };

        mockPrismaService.badge.count = jest.fn().mockResolvedValue(1);
        mockPrismaService.badge.findMany = jest
          .fn()
          .mockResolvedValue([claimedBadge]);
        mockMilestonesService.getUserAchievements = jest
          .fn()
          .mockResolvedValue([]);

        // Act
        const result = await service.getWalletBadges(mockUserId, {});

        // Assert - Revocation fields should NOT be present
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toHaveProperty('status', BadgeStatus.CLAIMED);
        expect(result.data[0]).not.toHaveProperty('revokedAt');
        expect(result.data[0]).not.toHaveProperty('revocationReason');
        expect(result.data[0]).not.toHaveProperty('revocationNotes');
      });

      it('should support status filter for REVOKED badges', async () => {
        // Arrange
        const revokedBadge = {
          id: 'badge-3',
          recipientId: mockUserId,
          status: BadgeStatus.REVOKED,
          issuedAt: new Date('2026-01-15'),
          revokedAt: new Date('2026-02-01'),
          revocationReason: 'Expired',
          template: {
            id: 'template-3',
            name: 'Expired Badge',
            description: 'Test',
            imageUrl: '/badge3.png',
            category: 'Technical',
          },
          issuer: {
            id: 'issuer-3',
            firstName: 'Manager',
            lastName: 'One',
            email: 'manager@test.com',
          },
        };

        mockPrismaService.badge.count = jest.fn().mockResolvedValue(1);
        mockPrismaService.badge.findMany = jest
          .fn()
          .mockResolvedValue([revokedBadge]);
        mockMilestonesService.getUserAchievements = jest
          .fn()
          .mockResolvedValue([]);

        // Act
        const result = await service.getWalletBadges(mockUserId, {
          status: BadgeStatus.REVOKED,
        });

        // Assert
        expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
          where: {
            recipientId: mockUserId,
            status: BadgeStatus.REVOKED,
          },
        });
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toHaveProperty('status', BadgeStatus.REVOKED);
      });
    });
  });
});
