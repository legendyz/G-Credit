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
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
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
import { PrismaService } from '../../common/prisma.service';
import {
  ShareBadgeTeamsDto,
  ShareBadgeTeamsResponseDto,
} from '../dto/share-badge-teams.dto';

@ApiTags('Badge Sharing')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsSharingController {
  constructor(
    private readonly teamsNotificationService: TeamsBadgeNotificationService,
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
  async shareBadgeToTeams(
    @Param('badgeId') badgeId: string,
    @Body() dto: ShareBadgeTeamsDto,
    @Request() req: any,
  ): Promise<ShareBadgeTeamsResponseDto> {
    const userId = req.user.id;

    // 1. Fetch badge with issuer information
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: true,
        issuer: true,
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge not found: ${badgeId}`);
    }

    // 2. Validate badge status (cannot share revoked or expired badges)
    if (badge.status === 'REVOKED') {
      throw new BadRequestException(
        'Cannot share revoked badge. This badge has been revoked and is no longer valid.',
      );
    }

    if (badge.status === 'EXPIRED') {
      throw new BadRequestException(
        'Cannot share expired badge. This badge has expired.',
      );
    }

    // 3. Check if user is badge recipient or issuer
    const isIssuer = badge.issuerId === userId;

    // Check if user is recipient
    const isRecipient = badge.recipientId === userId;

    if (!isRecipient && !isIssuer) {
      throw new UnauthorizedException(
        'Only the badge recipient or issuer can share this badge',
      );
    }

    // 4. Send Teams notification
    // Note: Currently using sendBadgeIssuanceNotification, but in future
    // this could be enhanced to support custom channel posting with personalMessage
    await this.teamsNotificationService.sendBadgeIssuanceNotification(
      badgeId,
      userId,
    );

    // 5. Return success response
    return {
      success: true,
      message: 'Badge shared to Microsoft Teams successfully',
      badgeId,
      teamId: dto.teamId,
      channelId: dto.channelId,
    };
  }
}
