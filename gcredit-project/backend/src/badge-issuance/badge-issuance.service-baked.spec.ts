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
import { BadgeStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { anyObject } from '../../test/helpers/jest-typed-matchers';

describe('BadgeIssuanceService - Baked Badge (Story 6.4)', () => {
  let service: BadgeIssuanceService;
  let _prisma: PrismaService;
  let _storageService: StorageService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    downloadBlobBuffer: jest.fn(),
  };

  const mockAssertionGenerator = {
    generateAssertion: jest.fn(),
  };

  const mockNotificationService = {};
  const mockCSVParser = {};
  const mockMilestonesService = {};
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
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeIssuanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        {
          provide: AssertionGeneratorService,
          useValue: mockAssertionGenerator,
        },
        {
          provide: BadgeNotificationService,
          useValue: mockNotificationService,
        },
        { provide: CSVParserService, useValue: mockCSVParser },
        { provide: MilestonesService, useValue: mockMilestonesService },
        {
          provide: TeamsBadgeNotificationService,
          useValue: mockTeamsNotificationService,
        },
        { provide: GraphEmailService, useValue: mockGraphEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    _prisma = module.get<PrismaService>(PrismaService);
    _storageService = module.get<StorageService>(StorageService);
  });

  describe('generateBakedBadge()', () => {
    const mockBadgeId = 'badge-uuid-123';
    const mockUserId = 'user-uuid-456';
    const mockOtherUserId = 'user-uuid-789';

    const mockBadge = {
      id: mockBadgeId,
      recipientId: mockUserId,
      status: BadgeStatus.CLAIMED,
      template: {
        id: 'template-uuid',
        name: 'Excellence Badge',
        description: 'Awarded for excellence',
        imageUrl: 'https://storage.blob.core.windows.net/badges/badge-123.png',
        issuanceCriteria: { description: 'Complete project' },
      },
      recipient: {
        id: mockUserId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      issuer: {
        id: 'issuer-uuid',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      },
      evidenceFiles: [],
      assertionJson: {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        badge: 'https://g-credit.com/api/badge-templates/template-uuid',
      },
    };

    it('should throw NotFoundException if badge does not exist', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: mockBadgeId },
        include: anyObject(),
      });
    });

    it('should throw BadRequestException if user is not badge recipient', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      // Act & Assert
      await expect(
        service.generateBakedBadge(mockBadgeId, mockOtherUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateBakedBadge(mockBadgeId, mockOtherUserId),
      ).rejects.toThrow('only download your own badges');
    });

    it('should throw BadRequestException if template has no image', async () => {
      // Arrange
      const badgeWithoutImage = {
        ...mockBadge,
        template: {
          ...mockBadge.template,
          imageUrl: null,
        },
      };
      mockPrismaService.badge.findUnique.mockResolvedValue(badgeWithoutImage);

      // Act & Assert
      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow('no image');
    });

    it('should throw BadRequestException if badge has no assertion', async () => {
      // Arrange
      const badgeWithoutAssertion = {
        ...mockBadge,
        assertionJson: null,
      };
      mockPrismaService.badge.findUnique.mockResolvedValue(
        badgeWithoutAssertion,
      );

      // Act & Assert
      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow('no assertion');
    });

    it('should pass validation and reach sharp processing with valid inputs (rejects on fake image data)', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      // Mock image buffer (fake data — not a real PNG)
      const mockImageBuffer = Buffer.from('fake-png-data');
      mockStorageService.downloadBlobBuffer.mockResolvedValue(mockImageBuffer);

      // Act & Assert
      // Validates the flow passes all business-rule checks (ownership, image, assertion)
      // and reaches sharp image processing, which rejects the fake PNG data.
      await expect(
        service.generateBakedBadge(mockBadgeId, mockUserId),
      ).rejects.toThrow(); // Throws from sharp (not our validation)

      // Verify all steps were called correctly
      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: mockBadgeId },
        include: anyObject(),
      });

      expect(mockStorageService.downloadBlobBuffer).toHaveBeenCalledWith(
        mockBadge.template.imageUrl,
      );
    });

    it('should generate filename with sanitized badge name and date', async () => {
      // Arrange
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      // Create a real minimal PNG for sharp to process
      const realPngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a, // PNG signature
        0x00,
        0x00,
        0x00,
        0x0d,
        0x49,
        0x48,
        0x44,
        0x52, // IHDR chunk
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x01, // 1x1 pixel
        0x08,
        0x06,
        0x00,
        0x00,
        0x00,
        0x1f,
        0x15,
        0xc4,
        0x89,
        0x00,
        0x00,
        0x00,
        0x0a,
        0x49,
        0x44,
        0x41, // IDAT chunk
        0x54,
        0x78,
        0x9c,
        0x63,
        0x00,
        0x01,
        0x00,
        0x00,
        0x05,
        0x00,
        0x01,
        0x0d,
        0x0a,
        0x2d,
        0xb4,
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x45,
        0x4e,
        0x44,
        0xae, // IEND chunk
        0x42,
        0x60,
        0x82,
      ]);

      mockStorageService.downloadBlobBuffer.mockResolvedValue(realPngBuffer);

      // Act
      const result = await service.generateBakedBadge(mockBadgeId, mockUserId);

      // Assert
      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toMatch(
        /^badge-excellence-badge-\d{4}-\d{2}-\d{2}\.png$/,
      );
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });
  });
});
