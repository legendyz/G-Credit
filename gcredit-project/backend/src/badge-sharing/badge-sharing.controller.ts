import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BadgeSharingService } from './badge-sharing.service';
import {
  ShareBadgeEmailDto,
  ShareBadgeEmailResponseDto,
} from './dto/share-badge-email.dto';

@ApiTags('Badge Sharing')
@Controller('api/badges/share')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgeSharingController {
  private readonly logger = new Logger(BadgeSharingController.name);

  constructor(private readonly badgeSharingService: BadgeSharingService) {}

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Share badge via email',
    description:
      'Send a badge notification to a recipient via email using Microsoft Graph API. The sender must be either the badge recipient or issuer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Badge shared successfully via email',
    type: ShareBadgeEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid badge state or permissions',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found',
  })
  async shareBadgeViaEmail(
    @Body() dto: ShareBadgeEmailDto,
    @CurrentUser('userId') userId: string,
  ): Promise<ShareBadgeEmailResponseDto> {
    this.logger.log(
      `User ${userId} sharing badge ${dto.badgeId} via email to ${dto.recipientEmail}`,
    );

    return this.badgeSharingService.shareBadgeViaEmail(dto, userId);
  }
}
