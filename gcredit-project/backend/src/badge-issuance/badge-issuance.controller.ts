import { Controller, Post, Body, UseGuards, Request, Param, Get, Query, NotFoundException, GoneException, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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
import { ReportBadgeIssueDto } from './dto/report-badge-issue.dto';
import { SimilarBadgesQueryDto } from '../badge-templates/dto/similar-badges-query.dto';
import { RecommendationsService } from '../badge-templates/recommendations.service';

@ApiTags('Badge Issuance')
@Controller('api/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BadgeIssuanceController {
  constructor(
    private readonly badgeService: BadgeIssuanceService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Get badge details by ID' })
  @ApiResponse({ status: 200, description: 'Badge details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own badges or issued badges' })
  async getBadgeById(@Param('id') id: string, @Request() req: any) {
    const badge = await this.badgeService.findOne(id);
    
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Check authorization: user can view if they are recipient or issuer
    if (badge.recipientId !== req.user.userId && badge.issuerId !== req.user.userId) {
      throw new NotFoundException('Badge not found'); // Don't reveal existence
    }

    return badge;
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN, UserRole.ISSUER) // Sprint 7: Allow ISSUER to revoke own badges
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Revoke a badge (ADMIN can revoke any, ISSUER can revoke their own)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge revoked successfully',
    schema: {
      example: {
        id: 'badge-uuid',
        status: 'REVOKED',
        revokedAt: '2026-02-01T10:30:00.000Z',
        revokedBy: 'admin-user-id',
        revocationReason: 'Policy Violation',
        revocationNotes: 'Detailed explanation'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Insufficient permissions' })
  @ApiResponse({ status: 403, description: 'Cannot revoke others badges (ISSUER)' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async revokeBadge(
    @Param('id') id: string,
    @Body() dto: RevokeBadgeDto,
    @Request() req: any,
  ) {
    const badge = await this.badgeService.revokeBadge(id, {
      reason: dto.reason,
      notes: dto.notes,
      actorId: req.user.userId,
    });

    // LOW #9 fix: Check for alreadyRevoked using 'in' operator for type safety
    const alreadyRevoked = 'alreadyRevoked' in badge && badge.alreadyRevoked === true;

    return {
      success: true,
      message: alreadyRevoked
        ? 'Badge was already revoked'
        : 'Badge revoked successfully',
      badge,
    };
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

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar badge recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Similar badges retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          category: { type: 'string' },
          issuerName: { type: 'string' },
          badgeCount: { type: 'number' },
          similarityScore: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async getSimilarBadges(
    @Param('id') badgeId: string,
    @Query() query: SimilarBadgesQueryDto,
    @Request() req: any,
  ) {
    return this.recommendationsService.getSimilarBadges(
      badgeId,
      req.user.userId,
      query.limit,
    );
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report an issue with a badge' })
  @ApiResponse({
    status: 201,
    description: 'Issue report submitted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: "Report submitted. We'll review within 2 business days." },
        reportId: { type: 'string', example: 'report-uuid-123' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or not badge owner' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async reportBadgeIssue(
    @Param('id') badgeId: string,
    @Body() dto: ReportBadgeIssueDto,
    @Request() req: any,
  ) {
    return this.badgeService.reportBadgeIssue(badgeId, dto, req.user.userId);
  }

  /**
   * Story 6.4: Download baked badge PNG with embedded Open Badges 2.0 assertion
   * Returns PNG with assertion in iTXt chunk - compatible with Credly, Badgr
   */
  @Get(':id/download/png')
  @ApiOperation({ 
    summary: 'Download baked badge PNG (Open Badges 2.0)',
    description: 'Downloads badge image with embedded JSON-LD assertion in PNG metadata. Compatible with Open Badge validators, Credly, and Badgr. Only badge recipient can download.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Baked badge PNG with embedded assertion',
    headers: {
      'Content-Type': {
        description: 'image/png',
        schema: { type: 'string' }
      },
      'Content-Disposition': {
        description: 'attachment; filename="badge-{name}-{date}.png"',
        schema: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Not badge recipient or no image available' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async downloadBakedBadge(
    @Param('id') badgeId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.badgeService.generateBakedBadge(badgeId, req.user.userId);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 24h
    res.send(buffer);
  }

  /**
   * Story 6.5: Verify badge assertion integrity
   * Check if badge metadata has been tampered with
   */
  @Get(':id/integrity')
  @Public() // Public endpoint for transparency
  @ApiOperation({ 
    summary: 'Verify badge assertion integrity (Story 6.5)',
    description: 'Checks if badge assertion data has been tampered with by comparing stored hash with computed hash. Returns integrity status and hash details.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Integrity verification result',
    schema: {
      example: {
        integrityVerified: true,
        storedHash: 'abc123...',
        computedHash: 'abc123...',
        tampered: false
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  async verifyIntegrity(@Param('id') badgeId: string) {
    return this.badgeService.verifyBadgeIntegrity(badgeId);
  }
}

