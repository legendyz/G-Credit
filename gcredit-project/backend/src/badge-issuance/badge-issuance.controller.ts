import { Controller, Post, Body, UseGuards, Request, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { BadgeIssuanceService } from './badge-issuance.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { ClaimBadgeDto } from './dto/claim-badge.dto';
import { QueryBadgeDto } from './dto/query-badge.dto';

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

  @Get('issued')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get badges issued by current user (ISSUER) or all badges (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getIssuedBadges(@Request() req: any, @Query() query: QueryBadgeDto) {
    return this.badgeService.getIssuedBadges(req.user.userId, req.user.role, query);
  }
}
