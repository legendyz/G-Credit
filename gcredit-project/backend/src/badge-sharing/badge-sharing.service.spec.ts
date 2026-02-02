import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BadgeSharingService } from './badge-sharing.service';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';
import { EmailTemplateService } from './services/email-template.service';
import { BadgeAnalyticsService } from './services/badge-analytics.service';
import { ShareBadgeEmailDto } from './dto/share-badge-email.dto';

describe('BadgeSharingService', () => {
  let service: BadgeSharingService;
  let prismaService: PrismaService;
  let graphEmailService: GraphEmailService;
  let emailTemplateService: EmailTemplateService;
  let badgeAnalyticsService: BadgeAnalyticsService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockGraphEmailService = {
    sendEmail: jest.fn(),
  };

  const mockEmailTemplateService = {
    renderHtml: jest.fn(),
    renderText: jest.fn(),
  };

  const mockBadgeAnalyticsService = {
    recordShare: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockBadge = {
    id: 'badge-123',
    templateId: 'template-123',
    recipientId: 'user-123',
    issuerId: 'issuer-123',
    status: 'CLAIMED',
    issuedAt: new Date('2026-01-30'),
    expiresAt: new Date('2027-01-30'),
    verificationId: 'verification-123',
    claimToken: null,
    template: {
      name: 'Test Badge',
      description: 'Test badge description',
      imageUrl: 'https://example.com/badge.png',
    },
    recipient: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    issuer: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
  };

  const mockSender = {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeSharingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GraphEmailService, useValue: mockGraphEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
        { provide: BadgeAnalyticsService, useValue: mockBadgeAnalyticsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BadgeSharingService>(BadgeSharingService);
    prismaService = module.get<PrismaService>(PrismaService);
    graphEmailService = module.get<GraphEmailService>(GraphEmailService);
    emailTemplateService =
      module.get<EmailTemplateService>(EmailTemplateService);
    badgeAnalyticsService = module.get<BadgeAnalyticsService>(
      BadgeAnalyticsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shareBadgeViaEmail', () => {
    const shareDto: ShareBadgeEmailDto = {
      badgeId: 'badge-123',
      recipientEmail: 'colleague@example.com',
      personalMessage: 'Check out this badge!',
    };

    beforeEach(() => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.count.mockResolvedValue(50);
      mockPrismaService.user.findUnique.mockResolvedValue(mockSender);
      mockEmailTemplateService.renderHtml.mockReturnValue('<html>Email</html>');
      mockEmailTemplateService.renderText.mockReturnValue('Plain text email');
      mockGraphEmailService.sendEmail.mockResolvedValue(undefined);
      mockConfigService.get.mockReturnValue('badges@g-credit.com');
    });

    it('should successfully share badge via email', async () => {
      const result = await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(result).toEqual({
        success: true,
        message: 'Badge shared successfully via email',
        recipientEmail: 'colleague@example.com',
        badgeId: 'badge-123',
      });

      expect(mockPrismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        include: {
          template: {
            select: {
              name: true,
              description: true,
              imageUrl: true,
            },
          },
          recipient: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          issuer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(mockGraphEmailService.sendEmail).toHaveBeenCalledWith(
        'badges@g-credit.com',
        ['colleague@example.com'],
        expect.stringContaining('Alice Johnson shared a badge with you'),
        '<html>Email</html>',
        'Plain text email',
      );
    });

    it('should omit badge image URL when invalid', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        template: {
          ...mockBadge.template,
          imageUrl: 'not-a-valid-url',
        },
      });

      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          badgeImageUrl: null,
        }),
      );
    });

    it('should throw NotFoundException when badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow('Badge with ID badge-123 not found');
    });

    it('should throw BadRequestException when user lacks permission', async () => {
      await expect(
        service.shareBadgeViaEmail(shareDto, 'unauthorized-user'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.shareBadgeViaEmail(shareDto, 'unauthorized-user'),
      ).rejects.toThrow('You do not have permission to share this badge');
    });

    it('should allow badge recipient to share', async () => {
      const result = await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(result.success).toBe(true);
    });

    it('should allow badge issuer to share', async () => {
      const result = await service.shareBadgeViaEmail(shareDto, 'issuer-123');

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException for revoked badge', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        status: 'REVOKED',
      });

      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow('Cannot share a revoked badge');
    });

    it('should throw BadRequestException for expired badge', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        status: 'EXPIRED',
      });

      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow('Cannot share an expired badge');
    });

    it('should include claimToken for pending badges', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        status: 'PENDING',
        claimToken: 'claim-token-123',
      });

      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          claimToken: 'claim-token-123',
        }),
      );
    });

    it('should not include claimToken for claimed badges', async () => {
      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          claimToken: null,
        }),
      );
    });

    it('should include earned count when > 1', async () => {
      mockPrismaService.badge.count.mockResolvedValue(50);

      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          earnedCount: 50,
        }),
      );
    });

    it('should not include earned count when <= 1', async () => {
      mockPrismaService.badge.count.mockResolvedValue(1);

      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          earnedCount: undefined,
        }),
      );
    });

    it('should include personal message in email data', async () => {
      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockEmailTemplateService.renderHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          personalMessage: 'Check out this badge!',
        }),
      );
    });

    it('should throw BadRequestException when email sending fails', async () => {
      mockGraphEmailService.sendEmail.mockRejectedValue(
        new Error('Graph API error'),
      );

      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.shareBadgeViaEmail(shareDto, 'user-123'),
      ).rejects.toThrow('Failed to send email: Graph API error');
    });

    it('should use sender email when configured', async () => {
      await service.shareBadgeViaEmail(shareDto, 'user-123');

      expect(mockGraphEmailService.sendEmail).toHaveBeenCalledWith(
        'badges@g-credit.com',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('getBadgeEarnedCount', () => {
    it('should return count of earned badges', async () => {
      mockPrismaService.badge.count.mockResolvedValue(42);

      const count = await service.getBadgeEarnedCount('template-123');

      expect(count).toBe(42);
      expect(mockPrismaService.badge.count).toHaveBeenCalledWith({
        where: {
          templateId: 'template-123',
          status: { in: ['CLAIMED', 'PENDING'] },
        },
      });
    });
  });
});
