import { Controller, Post, Body, UseGuards, Request, Param, Get, Query, NotFoundException, GoneException, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole, BadgeStatus } from '@prisma/client';
import { BadgeIssuanceService } from './badge-issuance.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { ClaimBadgeDto } from './dto/claim-badge.dto';
import { QueryBadgeDto } from './dto/query-badge.dto';
import { RevokeBadgeDto } from './dto/revoke-badge.dto';
import { WalletQueryDto } from './dto/wallet-query.dto';

@ApiTags('Badge Issuance')
@Controller('api/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BadgeIssuanceController {
  constructor(private readonly badgeService: BadgeIssuanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Issue a single badge' })
  @ApiResponse({ status: 201, description: 'Badge issued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Template or recipient not found' })
  async issueBadge(@Body() dto: IssueBadgeDto, @Request() req: any) {
    return this.badgeService.issueBadge(dto, req.user.userId);
  }

  @Post(':id/claim')
  @Public() // No authentication required - anyone with token can claim
  @ApiOperation({ summary: 'Claim a badge using claim token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge claimed successfully',
    schema: {
      example: {
        id: 'badge-uuid',
        status: 'CLAIMED',
        claimedAt: '2026-01-27T12:00:00.000Z',
        badge: {
          name: 'Outstanding Performance',
          description: 'Awarded for exceptional work',
          imageUrl: 'https://example.com/badge.png'
        },
        assertionUrl: 'http://localhost:3000/api/badges/badge-uuid/assertion',
        message: 'Badge claimed successfully! You can now view it in your wallet.'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Badge already claimed' })
  @ApiResponse({ status: 404, description: 'Invalid claim token' })
  @ApiResponse({ status: 410, description: 'Badge expired or revoked' })
  async claimBadge(@Param('id') id: string, @Body() dto: ClaimBadgeDto) {
    return this.badgeService.claimBadge(dto.claimToken);
  }

  @Get('my-badges')
  @ApiOperation({ summary: 'Get badges received by current user' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  async getMyBadges(@Request() req: any, @Query() query: QueryBadgeDto) {
    return this.badgeService.getMyBadges(req.user.userId, query);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet badges with timeline view (Story 4.1)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet badges retrieved with date groups',
    schema: {
      example: {
        badges: [],
        pagination: { page: 1, limit: 50, total: 100, totalPages: 2 },
        dateGroups: [
          { label: 'January 2026', count: 12, startIndex: 0 },
          { label: 'December 2025', count: 15, startIndex: 12 }
        ]
      }
    }
  })
  async getWallet(@Request() req: any, @Query() query: WalletQueryDto) {
    return this.badgeService.getWalletBadges(req.user.userId, query);
  }

  @Get('issued')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get badges issued by current user (ISSUER) or all badges (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getIssuedBadges(@Request() req: any, @Query() query: QueryBadgeDto) {
    return this.badgeService.getIssuedBadges(req.user.userId, req.user.role, query);
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a badge (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Badge revoked successfully' })
  @ApiResponse({ status: 400, description: 'Badge already revoked' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async revokeBadge(
    @Param('id') id: string,
    @Body() dto: RevokeBadgeDto,
    @Request() req: any,
  ) {
    return this.badgeService.revokeBadge(id, dto.reason, req.user.userId);
  }

  @Get(':id/assertion')
  @Public()
  @ApiOperation({ summary: 'Get Open Badges 2.0 assertion (public)' })
  @ApiResponse({ status: 200, description: 'Assertion retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  @ApiResponse({ status: 410, description: 'Badge revoked' })
  async getAssertion(@Param('id') id: string) {
    const badge = await this.badgeService.findOne(id);

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    if (badge.status === BadgeStatus.REVOKED) {
      throw new GoneException('Badge has been revoked');
    }

    return badge.assertionJson;
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk issue badges from CSV file' })
  @ApiBody({
    description: 'CSV file with columns: recipientEmail, templateId, evidenceUrl (optional), expiresIn (optional)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bulk issuance completed' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkIssueBadges(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    return this.badgeService.bulkIssueBadges(file.buffer, req.user.userId);
  }
}
