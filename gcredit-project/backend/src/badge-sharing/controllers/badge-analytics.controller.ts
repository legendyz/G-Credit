/**
 * Badge Analytics Controller
 * Story 7.5 - Sharing Analytics
 *
 * Provides REST API endpoints for badge sharing analytics
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  BadgeAnalyticsService,
  ShareStatsDto,
  ShareHistoryDto,
} from '../services/badge-analytics.service';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('Badge Analytics')
@Controller('api/badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgeAnalyticsController {
  private readonly logger = new Logger(BadgeAnalyticsController.name);
  constructor(private readonly badgeAnalyticsService: BadgeAnalyticsService) {}

  /**
   * Get share statistics for a badge
   * AC #5: Badge detail page shows share counts by platform
   * AC #7: Only badge owner/issuer can view analytics
   *
   * @param badgeId Badge ID
   * @param req Request with authenticated user
   * @returns Share counts by platform
   */
  @Get(':badgeId/analytics/shares')
  @ApiOperation({
    summary: 'Get badge share statistics',
    description:
      'Returns share counts by platform (email, teams, widget). Only accessible by badge owner or issuer.',
  })
  @ApiParam({
    name: 'badgeId',
    description: 'Badge ID',
    example: 'badge-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Share statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        badgeId: { type: 'string', example: 'badge-123' },
        total: { type: 'number', example: 20 },
        byPlatform: {
          type: 'object',
          properties: {
            email: { type: 'number', example: 8 },
            teams: { type: 'number', example: 7 },
            widget: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not badge owner or issuer',
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found',
  })
  async getShareStats(
    @Param('badgeId') badgeId: string,
    @Request() req: RequestWithUser,
  ): Promise<ShareStatsDto> {
    const userId = req.user.userId;
    return this.badgeAnalyticsService.getShareStats(badgeId, userId);
  }

  /**
   * Get recent share history for a badge
   * AC #6: Badge detail page shows share history (last 10 shares)
   * AC #7: Only badge owner/issuer can view analytics
   *
   * @param badgeId Badge ID
   * @param limit Maximum number of records to return (default: 10)
   * @param req Request with authenticated user
   * @returns Array of recent share records
   */
  @Get(':badgeId/analytics/shares/history')
  @ApiOperation({
    summary: 'Get badge share history',
    description:
      'Returns recent share history with timestamps and platform details. Only accessible by badge owner or issuer.',
  })
  @ApiParam({
    name: 'badgeId',
    description: 'Badge ID',
    example: 'badge-123',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of records to return',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Share history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'share-1' },
          platform: {
            type: 'string',
            example: 'teams',
            enum: ['email', 'teams', 'widget'],
          },
          sharedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-30T14:30:00Z',
          },
          sharedBy: { type: 'string', nullable: true, example: 'user-123' },
          recipientEmail: {
            type: 'string',
            nullable: true,
            example: 'john@example.com',
          },
          metadata: {
            type: 'object',
            nullable: true,
            example: { channelName: 'Engineering' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not badge owner or issuer',
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found',
  })
  async getShareHistory(
    @Param('badgeId') badgeId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req: RequestWithUser,
  ): Promise<ShareHistoryDto[]> {
    const userId = req.user.userId;
    return this.badgeAnalyticsService.getShareHistory(badgeId, userId, limit);
  }

  /**
   * Story 11.5: Record LinkedIn share analytics
   */
  @Post(':badgeId/share/linkedin')
  @ApiOperation({ summary: 'Record LinkedIn share for analytics' })
  @ApiResponse({ status: 201, description: 'Share recorded' })
  async recordLinkedInShare(
    @Param('badgeId') badgeId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.badgeAnalyticsService.recordShare(
      badgeId,
      'linkedin',
      req.user.userId,
    );
    return { success: true };
  }

  /**
   * Record widget link copy for analytics
   */
  @Post(':badgeId/share/widget')
  @ApiOperation({ summary: 'Record widget link copy for analytics' })
  @ApiResponse({ status: 201, description: 'Widget copy recorded' })
  async recordWidgetCopy(
    @Param('badgeId') badgeId: string,
    @Request() req: RequestWithUser,
  ) {
    await this.badgeAnalyticsService.recordShare(
      badgeId,
      'widget',
      req.user.userId,
    );
    return { success: true };
  }
}
