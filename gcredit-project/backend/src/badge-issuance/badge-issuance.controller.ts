import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BadgeIssuanceService } from './badge-issuance.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';

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
}
