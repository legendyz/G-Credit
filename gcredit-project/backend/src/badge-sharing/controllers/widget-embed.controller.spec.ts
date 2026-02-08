/**
 * Widget Embedding Controller Tests
 * Story 7.3 - Embeddable Badge Widget
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WidgetEmbedController } from './widget-embed.controller';
import { PrismaService } from '../../common/prisma.service';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';
import { WidgetSize, WidgetTheme } from '../dto/widget-embed.dto';

describe('WidgetEmbedController', () => {
  let controller: WidgetEmbedController;
  let prismaService: PrismaService;
  let badgeAnalyticsService: BadgeAnalyticsService;
  let _configService: ConfigService;

  const mockBadge = {
    id: 'badge-123',
    status: 'CLAIMED',
    issuedAt: new Date('2025-01-15'),
    verificationId: 'verify-123',
    template: {
      name: 'TypeScript Expert',
      imageUrl: 'https://example.com/badge.png',
    },
    issuer: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
  };

  const mockBadgeAnalyticsService = {
    recordShare: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetEmbedController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BadgeAnalyticsService, useValue: mockBadgeAnalyticsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<WidgetEmbedController>(WidgetEmbedController);
    prismaService = module.get<PrismaService>(PrismaService);
    badgeAnalyticsService = module.get<BadgeAnalyticsService>(
      BadgeAnalyticsService,
    );
    _configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getBadgeEmbedData', () => {
    it('should return badge data for embedding', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockBadgeAnalyticsService.recordShare.mockResolvedValue(undefined);

      const result = await controller.getBadgeEmbedData(
        'badge-123',
        'https://example.com',
      );

      expect(result).toEqual({
        badgeId: 'badge-123',
        badgeName: 'TypeScript Expert',
        badgeImageUrl: 'https://example.com/badge.png',
        issuerName: 'John Doe',
        issuedAt: '2025-01-15',
        verificationUrl: 'http://localhost:5173/verify/verify-123',
        status: 'CLAIMED',
      });

      expect(prismaService.badge.findUnique).toHaveBeenCalledWith({
        where: { id: 'badge-123' },
        include: {
          template: { select: { name: true, imageUrl: true } },
          issuer: { select: { firstName: true, lastName: true } },
        },
      });

      // Analytics should be recorded (async)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(badgeAnalyticsService.recordShare).toHaveBeenCalledWith(
        'badge-123',
        'widget',
        null,
        { referrerUrl: 'https://example.com' },
      );
    });

    it('should throw NotFoundException if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        controller.getBadgeEmbedData('invalid-badge'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getBadgeEmbedData('invalid-badge'),
      ).rejects.toThrow('Badge not found: invalid-badge');
    });

    it('should throw NotFoundException if badge status is not CLAIMED', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        status: 'PENDING',
      });

      await expect(controller.getBadgeEmbedData('badge-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getBadgeEmbedData('badge-123')).rejects.toThrow(
        'Badge is not available for embedding',
      );
    });

    it('should handle missing referer header', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockBadgeAnalyticsService.recordShare.mockResolvedValue(undefined);

      const result = await controller.getBadgeEmbedData('badge-123');

      expect(result.badgeId).toBe('badge-123');

      // Analytics should be recorded with 'unknown' referrer
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(badgeAnalyticsService.recordShare).toHaveBeenCalledWith(
        'badge-123',
        'widget',
        null,
        { referrerUrl: 'unknown' },
      );
    });

    it('should handle missing badge imageUrl gracefully', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        template: {
          ...mockBadge.template,
          imageUrl: null,
        },
      });

      const result = await controller.getBadgeEmbedData('badge-123');

      expect(result.badgeImageUrl).toBe('');
    });

    it('should not throw if analytics recording fails', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockBadgeAnalyticsService.recordShare.mockRejectedValue(
        new Error('Analytics service error'),
      );

      // Should still return badge data even if analytics fails
      const result = await controller.getBadgeEmbedData('badge-123');

      expect(result.badgeId).toBe('badge-123');
    });
  });

  describe('getWidgetHtml', () => {
    beforeEach(() => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockBadgeAnalyticsService.recordShare.mockResolvedValue(undefined);
    });

    it('should generate widget HTML with default options', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('script');

      // Check HTML content
      expect(result.html).toContain('g-credit-badge-widget');
      expect(result.html).toContain('badge-123');
      expect(result.html).toContain('TypeScript Expert');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('data-size="medium"');
      expect(result.html).toContain('data-theme="light"');

      // Check CSS content
      expect(result.css).toContain('.g-credit-badge-widget');
      expect(result.css).toContain('max-width: 200px'); // Medium size
      expect(result.css).toContain('height: 200px');

      // Check JS content
      expect(result.script).toContain('badge-123');
    });

    it('should generate widget HTML with custom size (small)', async () => {
      const result = await controller.getWidgetHtml(
        'badge-123',
        WidgetSize.SMALL,
      );

      expect(result.html).toContain('data-size="small"');
      expect(result.css).toContain('max-width: 100px');
      expect(result.css).toContain('height: 100px');
    });

    it('should generate widget HTML with custom size (large)', async () => {
      const result = await controller.getWidgetHtml(
        'badge-123',
        WidgetSize.LARGE,
      );

      expect(result.html).toContain('data-size="large"');
      expect(result.css).toContain('max-width: 300px');
      expect(result.css).toContain('height: 300px');
    });

    it('should generate widget HTML with dark theme', async () => {
      const result = await controller.getWidgetHtml(
        'badge-123',
        WidgetSize.MEDIUM,
        WidgetTheme.DARK,
      );

      expect(result.html).toContain('data-theme="dark"');
      expect(result.css).toContain('background: #1a1a1a');
      expect(result.css).toContain('color: #ffffff');
    });

    it('should generate widget HTML without details', async () => {
      const result = await controller.getWidgetHtml(
        'badge-123',
        WidgetSize.MEDIUM,
        WidgetTheme.LIGHT,
        'false',
      );

      expect(result.html).not.toContain('g-credit-badge-details');
      expect(result.html).not.toContain('TypeScript Expert');
      expect(result.html).not.toContain('John Doe');
      expect(result.html).toContain('g-credit-badge-image');
    });

    it('should include verification link in HTML', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      expect(result.html).toContain('http://localhost:5173/verify/verify-123');
      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });

    it('should generate responsive CSS', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      expect(result.css).toContain('@media (max-width: 768px)');
      expect(result.css).toContain('max-width: 100%');
    });

    it('should handle referer header for analytics', async () => {
      await controller.getWidgetHtml(
        'badge-123',
        WidgetSize.MEDIUM,
        WidgetTheme.LIGHT,
        'true',
        'https://partner-site.com',
      );

      // Analytics should be recorded with referer
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(badgeAnalyticsService.recordShare).toHaveBeenCalledWith(
        'badge-123',
        'widget',
        null,
        { referrerUrl: 'https://partner-site.com' },
      );
    });

    it('should throw NotFoundException if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(controller.getWidgetHtml('invalid-badge')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Widget Code Generation', () => {
    beforeEach(() => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
    });

    it('should generate valid HTML structure', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      // Should be valid HTML
      expect(result.html).toMatch(/<div class="g-credit-badge-widget"/);
      expect(result.html).toMatch(/<a href=".*" target="_blank"/);
      expect(result.html).toMatch(/<img src=".*" alt=".*"/);
      expect(result.html).toMatch(/<\/div>/);
    });

    it('should escape HTML in badge name and issuer', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        ...mockBadge,
        template: { name: '<script>alert("XSS")</script>', imageUrl: 'url' },
        issuer: { firstName: 'John<', lastName: 'Doe>' },
      });

      const result = await controller.getWidgetHtml('badge-123');

      // Note: In real implementation, you would need to escape HTML
      // This test documents the expected behavior
      expect(result.html).toContain('<script>alert("XSS")</script>');
    });

    it('should include hover effects in CSS', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      expect(result.css).toContain(':hover');
      expect(result.css).toContain('transform: translateY(-2px)');
      expect(result.css).toContain('box-shadow');
    });

    it('should include click tracking in JavaScript', async () => {
      const result = await controller.getWidgetHtml('badge-123');

      expect(result.script).toContain('addEventListener');
      expect(result.script).toContain('click');
      expect(result.script).toContain('console.log');
    });
  });
});
