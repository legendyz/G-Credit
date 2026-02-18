/**
 * Teams Sharing Controller
 *
 * Story 7.4 - Microsoft Teams Notifications
 * REST API endpoint for sharing badges to Microsoft Teams
 */

import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TeamsBadgeNotificationService } from '../../microsoft-graph/teams/teams-badge-notification.service';
import { BadgeAnalyticsService } from '../services/badge-analytics.service';
import { PrismaService } from '../../common/prisma.service';
import {
  ShareBadgeTeamsDto,
  ShareBadgeTeamsResponseDto,
} from '../dto/share-badge-teams.dto';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('Badge Sharing')
@Controller('api/badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsSharingController {
  private readonly logger = new Logger(TeamsSharingController.name);
  constructor(
    private readonly teamsNotificationService: TeamsBadgeNotificationService,
    private readonly badgeAnalyticsService: BadgeAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Share badge to Microsoft Teams
   *
   * Story 7.4 - AC #3: Create REST API endpoint for badge sharing
   *
   * @param badgeId - Badge ID to share
   * @param dto - Teams sharing details (team ID, channel ID, optional message)
   * @param req - Request object with authenticated user
   * @returns Success response with share details
   */
  @Post(':badgeId/share/teams')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Share badge to Microsoft Teams',
    description:
      'Share a badge to a Microsoft Teams channel. Only the badge recipient or issuer can share the badge.',
  })
  @ApiParam({
    name: 'badgeId',
    description: 'Badge ID to share',
    example: 'badge-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Badge shared successfully',
    type: ShareBadgeTeamsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not the badge recipient or issuer',
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Badge is revoked or expired',
  })
  shareBadgeToTeams(
    @Param('badgeId') _badgeId: string,
    @Body() _dto: ShareBadgeTeamsDto,
    @Request() _req: RequestWithUser,
  ): ShareBadgeTeamsResponseDto {
    // ADR: Teams Channel Sharing deferred — requires ChannelMessage.Send Graph API
    // permission (pending tenant admin approval). See TD-006 in Post-MVP Backlog.
    // Current behavior: returns BadRequestException instructing user to use email sharing.

    throw new BadRequestException({
      message:
        'Teams channel sharing is not yet implemented. Please use email sharing instead.',
      alternative: 'POST /api/badges/share/email',
      technicalDebt:
        'Teams integration requires additional Graph API permissions and configuration',
    });
  }
}
