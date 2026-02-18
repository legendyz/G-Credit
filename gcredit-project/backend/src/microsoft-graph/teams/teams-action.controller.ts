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
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
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
export class TeamsActionController {
  private readonly logger = new Logger(TeamsActionController.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle Claim Badge action from Teams Adaptive Card
   *
   * Story 11.25 AC-C2: Switched from JWT auth to @Public() + claimToken validation.
   * Teams server-to-server callbacks don't carry browser cookies or user JWTs.
   * The one-time claimToken (embedded in the Adaptive Card) provides authorization.
   *
   * @param dto - Contains claimToken (one-time use, validates the claim)
   * @returns Updated Adaptive Card JSON showing claimed status
   */
  @Public()
  @Post('claim-badge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim badge from Teams notification (public, token-validated)',
    description:
      'Updates badge status to CLAIMED using one-time claim token. No JWT required.',
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
    status: 404,
    description: 'Invalid claim token or badge not found',
  })
  async claimBadge(@Body() dto: ClaimBadgeActionDto) {
    // 1. Find badge by claimToken (this IS the authorization)
    const badge = await this.prisma.badge.findUnique({
      where: { claimToken: dto.claimToken },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });

    if (!badge) {
      throw new NotFoundException(
        'This claim link is invalid or has already been used. ' +
          'If you have already claimed this badge, you can find it in your wallet.',
      );
    }

    // 2. Check badge status
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

    // 4. Update badge status to CLAIMED (keep token for accurate error messages on re-visit)
    const updatedBadge = await this.prisma.badge.update({
      where: { id: badge.id },
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
