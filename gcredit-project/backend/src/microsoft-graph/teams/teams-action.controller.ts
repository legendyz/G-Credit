/**
 * Teams Action Controller
 *
 * Story 7.4 Task 5
 * Handles Adaptive Card action button callbacks from Microsoft Teams
 *
 * @see docs/sprints/sprint-6/adaptive-card-specs.md
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/prisma.service';
import { ClaimBadgeActionDto } from './dto/claim-badge-action.dto';
import { BadgeStatus } from '@prisma/client';
import type { Badge, BadgeTemplate, User } from '@prisma/client';

/** Badge with included template, recipient, and issuer relations */
type BadgeWithRelations = Badge & {
  template: BadgeTemplate;
  recipient: User;
  issuer: User;
};

@ApiTags('Teams Actions')
@Controller('api/teams/actions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsActionController {
  private readonly logger = new Logger(TeamsActionController.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle Claim Badge action from Teams Adaptive Card
   *
   * When user clicks "Claim Badge" button in Teams notification,
   * this endpoint updates badge status from PENDING to CLAIMED.
   *
   * @param dto - Contains badgeId and userId
   * @returns Updated Adaptive Card JSON showing claimed status
   */
  @Post('claim-badge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim badge from Teams notification',
    description:
      'Updates badge status to CLAIMED when user clicks action button in Teams',
  })
  @ApiResponse({
    status: 200,
    description: 'Badge claimed successfully, returns updated Adaptive Card',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Badge claimed successfully!' },
        badge: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'CLAIMED' },
            claimedAt: { type: 'string', format: 'date-time' },
          },
        },
        adaptiveCard: {
          type: 'object',
          description: 'Updated Adaptive Card JSON to replace original message',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Badge already claimed or revoked' })
  @ApiResponse({
    status: 403,
    description: 'User not authorized to claim this badge',
  })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async claimBadge(
    @Body() dto: ClaimBadgeActionDto,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    // 1. Validate badge exists
    const badge = await this.prisma.badge.findUnique({
      where: { id: dto.badgeId },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${dto.badgeId} not found`);
    }

    // 2. Validate user is the recipient (SEC-P0-001: Use JWT user.userId, not dto.userId)
    // This prevents IDOR attacks where attackers could claim badges for other users
    if (badge.recipientId !== user.userId) {
      throw new ForbiddenException(
        'Only the badge recipient can claim this badge',
      );
    }

    // 3. Check badge status
    if (badge.status === BadgeStatus.CLAIMED) {
      throw new BadRequestException('Badge has already been claimed');
    }

    if (badge.status === BadgeStatus.REVOKED) {
      throw new BadRequestException(
        'Badge has been revoked and cannot be claimed',
      );
    }

    if (badge.status !== BadgeStatus.PENDING) {
      throw new BadRequestException(
        `Badge status is ${badge.status}, expected PENDING`,
      );
    }

    // 4. Update badge status to CLAIMED
    const updatedBadge = await this.prisma.badge.update({
      where: { id: dto.badgeId },
      data: {
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date(),
      },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });

    // 5. Build updated Adaptive Card showing claimed status
    const updatedCard = this.buildClaimedBadgeCard(updatedBadge);

    return {
      success: true,
      message: 'Badge claimed successfully!',
      badge: {
        id: updatedBadge.id,
        status: updatedBadge.status,
        claimedAt: updatedBadge.claimedAt,
      },
      adaptiveCard: updatedCard,
    };
  }

  /**
   * Build Adaptive Card showing badge has been claimed
   * Replaces action buttons with "Claimed" status badge
   */
  private buildClaimedBadgeCard(badge: BadgeWithRelations) {
    const recipientName =
      badge.recipient.firstName && badge.recipient.lastName
        ? `${badge.recipient.firstName} ${badge.recipient.lastName}`
        : badge.recipient.email;

    const issuerName =
      badge.issuer.firstName && badge.issuer.lastName
        ? `${badge.issuer.firstName} ${badge.issuer.lastName}`
        : badge.issuer.email;

    return {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'auto',
              items: [
                {
                  type: 'Image',
                  url:
                    badge.template.imageUrl || 'https://via.placeholder.com/80',
                  size: 'Medium',
                  style: 'default',
                },
              ],
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: badge.template.name,
                  weight: 'Bolder',
                  size: 'Large',
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: `Issued by ${issuerName}`,
                  spacing: 'Small',
                  isSubtle: true,
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: badge.template.description || '',
                  spacing: 'Small',
                  wrap: true,
                },
              ],
            },
          ],
        },
        {
          type: 'FactSet',
          facts: [
            {
              title: 'Recipient',
              value: recipientName,
            },
            {
              title: 'Issued Date',
              value: new Date(
                badge.issuedAt as string | number | Date,
              ).toLocaleDateString(),
            },
            {
              title: 'Status',
              value: '✅ **CLAIMED**',
            },
            {
              title: 'Claimed Date',
              value: new Date(
                badge.claimedAt as string | number | Date,
              ).toLocaleDateString(),
            },
          ],
        },
        {
          type: 'Container',
          style: 'accent',
          items: [
            {
              type: 'TextBlock',
              text: '🎉 Badge claimed successfully!',
              weight: 'Bolder',
              color: 'Good',
              wrap: true,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View in Wallet',
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet`,
        },
      ],
    };
  }
}
