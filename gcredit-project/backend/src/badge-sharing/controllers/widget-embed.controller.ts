/**
 * Widget Embedding Controller
 * Story 7.3 - Embeddable Badge Widget
 * 
 * PUBLIC API - No authentication required for widget embedding
 */

import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Headers,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';
import {
  WidgetEmbedResponseDto,
  WidgetHtmlResponseDto,
  WidgetSize,
  WidgetTheme,
} from '../dto/widget-embed.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Badge Widget')
@Controller('badges')
export class WidgetEmbedController {
  private readonly logger = new Logger(WidgetEmbedController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly badgeAnalyticsService: BadgeAnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get badge data for widget embedding (JSON)
   * PUBLIC API - No authentication required
   * 
   * AC #2: Widget displays badge image and details correctly
   * AC #7: Widget works cross-origin (CORS configured)
   */
  @Get(':badgeId/embed')
  @ApiOperation({
    summary: 'Get badge data for widget embedding (JSON)',
    description:
      'Returns badge data in JSON format for client-side rendering. Public API - no authentication required.',
  })
  @ApiParam({
    name: 'badgeId',
    description: 'Badge ID',
    example: 'badge-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Badge data retrieved successfully',
    type: WidgetEmbedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found or not publicly accessible',
  })
  async getBadgeEmbedData(
    @Param('badgeId') badgeId: string,
    @Headers('referer') referer?: string,
  ): Promise<WidgetEmbedResponseDto> {
    this.logger.log(`Widget embed request for badge ${badgeId}`);

    // Fetch badge with all required relations
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        issuer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge not found: ${badgeId}`);
    }

    // Only allow embedding of claimed badges (not pending/revoked/expired)
    if (badge.status !== 'CLAIMED') {
      throw new NotFoundException(
        `Badge is not available for embedding (status: ${badge.status})`,
      );
    }

    // Record widget embed analytics (async, non-blocking)
    this.recordWidgetEmbed(badgeId, referer).catch((error) => {
      this.logger.warn(
        `Failed to record widget embed analytics: ${error.message}`,
      );
    });

    // Build verification URL
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';
    const verificationUrl = `${baseUrl}/verify/${badge.verificationId}`;

    return {
      badgeId: badge.id,
      badgeName: badge.template.name,
      badgeImageUrl: badge.template.imageUrl || '',
      issuerName: `${badge.issuer.firstName} ${badge.issuer.lastName}`,
      issuedAt: badge.issuedAt.toISOString().split('T')[0],
      verificationUrl,
      status: badge.status,
    };
  }

  /**
   * Get widget HTML snippet for embedding
   * PUBLIC API - No authentication required
   * 
   * AC #1: User can generate embed code
   * AC #3: Widget works in iframe and standalone HTML
   * AC #4: Widget supports sizes and themes
   */
  @Get(':badgeId/widget')
  @ApiOperation({
    summary: 'Get widget HTML snippet for embedding',
    description:
      'Returns ready-to-use HTML snippet for embedding. Supports size, theme, and detail options.',
  })
  @ApiParam({
    name: 'badgeId',
    description: 'Badge ID',
    example: 'badge-123',
  })
  @ApiQuery({
    name: 'size',
    enum: WidgetSize,
    required: false,
    description: 'Widget size (small: 100x100, medium: 200x200, large: 300x300)',
    example: 'medium',
  })
  @ApiQuery({
    name: 'theme',
    enum: WidgetTheme,
    required: false,
    description: 'Widget theme (light, dark, auto)',
    example: 'light',
  })
  @ApiQuery({
    name: 'showDetails',
    type: Boolean,
    required: false,
    description: 'Show badge name and issuer details',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Widget HTML snippet generated successfully',
    type: WidgetHtmlResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found',
  })
  async getWidgetHtml(
    @Param('badgeId') badgeId: string,
    @Query('size') size: WidgetSize = WidgetSize.MEDIUM,
    @Query('theme') theme: WidgetTheme = WidgetTheme.LIGHT,
    @Query('showDetails') showDetails: string = 'true',
    @Headers('referer') referer?: string,
  ): Promise<WidgetHtmlResponseDto> {
    this.logger.log(
      `Widget HTML request for badge ${badgeId} (size: ${size}, theme: ${theme})`,
    );

    // Get badge data
    const badgeData = await this.getBadgeEmbedData(badgeId, referer);

    // Parse showDetails (query params are strings)
    const includeDetails = showDetails === 'true' || showDetails === '1';

    // Generate HTML, CSS, and JS
    const { html, css, script } = this.generateWidgetCode(
      badgeData,
      size,
      theme,
      includeDetails,
    );

    return { html, css, script };
  }

  /**
   * Generate widget HTML, CSS, and JavaScript code
   * AC #4: Support different sizes and themes
   * AC #5: Widget click opens verification page
   * AC #8: Widget is responsive
   */
  private generateWidgetCode(
    badge: WidgetEmbedResponseDto,
    size: WidgetSize,
    theme: WidgetTheme,
    showDetails: boolean,
  ): { html: string; css: string; script: string } {
    // Size dimensions
    const dimensions = {
      small: { width: 100, height: 100 },
      medium: { width: 200, height: 200 },
      large: { width: 300, height: 300 },
    };
    const { width, height } = dimensions[size] || dimensions.medium;

    // Theme colors
    const themeColors = {
      light: { bg: '#ffffff', text: '#333333', border: '#e0e0e0' },
      dark: { bg: '#1a1a1a', text: '#ffffff', border: '#444444' },
      auto: { bg: '#ffffff', text: '#333333', border: '#e0e0e0' }, // Default to light
    };
    const colors = themeColors[theme] || themeColors.light;

    // HTML
    const altText = showDetails ? badge.badgeName : 'Digital Badge';
    const html = `
<div class="g-credit-badge-widget" data-badge-id="${badge.badgeId}" data-size="${size}" data-theme="${theme}">
  <a href="${badge.verificationUrl}" target="_blank" rel="noopener noreferrer" class="g-credit-badge-link">
    <img src="${badge.badgeImageUrl}" alt="${altText}" class="g-credit-badge-image" />
    ${
      showDetails
        ? `
    <div class="g-credit-badge-details">
      <div class="g-credit-badge-name">${badge.badgeName}</div>
      <div class="g-credit-badge-issuer">Issued by ${badge.issuerName}</div>
    </div>
    `
        : ''
    }
  </a>
</div>`.trim();

    // CSS
    const css = `
.g-credit-badge-widget {
  display: inline-block;
  max-width: ${width}px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: ${colors.bg};
  border: 2px solid ${colors.border};
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.g-credit-badge-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.g-credit-badge-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.g-credit-badge-image {
  width: 100%;
  height: ${height}px;
  object-fit: cover;
  display: block;
}

.g-credit-badge-details {
  padding: 12px;
  text-align: center;
  background: ${colors.bg};
  color: ${colors.text};
}

.g-credit-badge-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.g-credit-badge-issuer {
  font-size: 12px;
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 768px) {
  .g-credit-badge-widget {
    max-width: 100%;
  }
}`.trim();

    // JavaScript (minimal - just for tracking)
    const script = `
(function() {
  const widget = document.querySelector('[data-badge-id="${badge.badgeId}"]');
  if (widget) {
    widget.addEventListener('click', function() {
      console.log('G-Credit badge clicked:', '${badge.badgeId}');
    });
  }
})();`.trim();

    return { html, css, script };
  }

  /**
   * Record widget embed for analytics
   * AC #6: Widget records share in BadgeShare table
   */
  private async recordWidgetEmbed(
    badgeId: string,
    referer?: string,
  ): Promise<void> {
    try {
      await this.badgeAnalyticsService.recordShare(
        badgeId,
        'widget',
        null, // Anonymous - no user ID for public widget
        {
          referrerUrl: referer || 'unknown',
        },
      );
      this.logger.log(`Recorded widget embed for badge ${badgeId}`);
    } catch (error) {
      this.logger.error(
        `Failed to record widget embed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
