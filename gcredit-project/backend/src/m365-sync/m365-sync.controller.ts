/**
 * M365 Sync Controller - Story 8.9
 *
 * Admin-only endpoints for Microsoft 365 user synchronization:
 * - POST /api/admin/m365-sync - Trigger sync
 * - GET /api/admin/m365-sync/logs - Get sync history
 * - GET /api/admin/m365-sync/logs/:id - Get sync log details
 * - GET /api/admin/m365-sync/status - Get integration status
 *
 * All endpoints require ADMIN role.
 *
 * @see Story 8.9: M365 Production Hardening
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { M365SyncService } from './m365-sync.service';
import {
  TriggerSyncDto,
  SyncResultDto,
  SyncLogDto,
  IntegrationStatusDto,
} from './dto';

@ApiTags('m365-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin/m365-sync')
export class M365SyncController {
  private readonly logger = new Logger(M365SyncController.name);

  constructor(private readonly m365SyncService: M365SyncService) {}

  /**
   * Trigger M365 user sync
   * POST /api/admin/m365-sync
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Trigger M365 user synchronization' })
  @ApiResponse({
    status: 201,
    description: 'Sync completed successfully',
    type: SyncResultDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 500,
    description: 'Graph API not configured or sync failed',
  })
  async triggerSync(
    @Body() dto: TriggerSyncDto,
    @Req() req: { user: { email?: string; id?: string } },
  ): Promise<SyncResultDto> {
    const syncedBy = req.user?.email || req.user?.id || 'UNKNOWN';
    this.logger.log(
      `Triggering ${dto.syncType || 'FULL'} M365 sync by ${syncedBy}`,
    );
    return this.m365SyncService.runSync(dto.syncType, syncedBy);
  }

  /**
   * Get sync history
   * GET /api/admin/m365-sync/logs
   */
  @Get('logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get M365 sync history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of logs to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sync logs',
    type: [SyncLogDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async getSyncLogs(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<SyncLogDto[]> {
    return this.m365SyncService.getSyncLogs(limit);
  }

  /**
   * Get sync log by ID
   * GET /api/admin/m365-sync/logs/:id
   */
  @Get('logs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get M365 sync log details' })
  @ApiParam({
    name: 'id',
    description: 'Sync log ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Sync log details',
    type: SyncLogDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Sync log not found',
  })
  async getSyncLogById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SyncLogDto> {
    return this.m365SyncService.getSyncLogById(id);
  }

  /**
   * Get M365 integration status
   * GET /api/admin/m365-sync/status
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get M365 integration status' })
  @ApiResponse({
    status: 200,
    description: 'Integration status',
    type: IntegrationStatusDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async getIntegrationStatus(): Promise<IntegrationStatusDto> {
    return this.m365SyncService.getIntegrationStatus();
  }
}
