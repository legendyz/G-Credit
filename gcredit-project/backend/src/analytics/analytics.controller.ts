import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  SystemOverviewDto,
  IssuanceTrendsDto,
  IssuanceTrendsQueryDto,
  TopPerformersDto,
  TopPerformersQueryDto,
  SkillsDistributionDto,
  RecentActivityDto,
  RecentActivityQueryDto,
} from './dto';

// Cache TTL: 15 minutes = 900000 milliseconds (cache-manager v3 uses ms!)
const CACHE_TTL_15_MIN = 900000;

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('api/analytics')
@UseInterceptors(CacheInterceptor)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * AC1: System Overview API
   * Returns system-wide statistics for Admin dashboard
   */
  @Get('system-overview')
  @Roles('ADMIN')
  @CacheKey('analytics:system-overview')
  @CacheTTL(CACHE_TTL_15_MIN)
  @ApiOperation({
    summary: 'Get system overview statistics',
    description:
      'Returns user counts, badge statistics, template counts, and system health. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'System overview statistics',
    type: SystemOverviewDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getSystemOverview(): Promise<SystemOverviewDto> {
    return this.analyticsService.getSystemOverview();
  }

  /**
   * AC2: Badge Issuance Trends API
   * Returns badge issuance data over time for charts
   * Note: No auto-cache - user-scoped data requires manual cache with user-specific keys
   */
  @Get('issuance-trends')
  @Roles('ADMIN', 'ISSUER')
  @ApiOperation({
    summary: 'Get badge issuance trends',
    description:
      'Returns daily badge issuance statistics for specified period. Admin can filter by issuer, Issuer sees only their own data.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period in days (7, 30, 90, 365)',
    example: 30,
  })
  @ApiQuery({
    name: 'issuerId',
    required: false,
    description: 'Filter by issuer ID (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Issuance trend data',
    type: IssuanceTrendsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Issuer only' })
  async getIssuanceTrends(
    @Query() query: IssuanceTrendsQueryDto,
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<IssuanceTrendsDto> {
    // Issuer cannot filter by other issuerId
    if (
      user.role === 'ISSUER' &&
      query.issuerId &&
      query.issuerId !== user.userId
    ) {
      throw new ForbiddenException('Issuers can only view their own data');
    }

    return this.analyticsService.getIssuanceTrends(
      query.period,
      query.issuerId,
      user.userId,
      user.role,
    );
  }

  /**
   * AC3: Top Performers API
   * Returns ranked list of employees by badge count
   * Note: No auto-cache - user-scoped data requires manual cache with user-specific keys
   */
  @Get('top-performers')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Get top performers by badge count',
    description:
      'Returns employees ranked by claimed badge count. Manager sees only their team, Admin sees all.',
  })
  @ApiQuery({
    name: 'teamId',
    required: false,
    description: 'Filter by team/department (Manager must use own team)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results (1-100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top performers list',
    type: TopPerformersDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager only',
  })
  async getTopPerformers(
    @Query() query: TopPerformersQueryDto,
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<TopPerformersDto> {
    return this.analyticsService.getTopPerformers(
      query.teamId,
      query.limit,
      user.userId,
      user.role,
    );
  }

  /**
   * AC4: Skills Distribution API
   * Returns aggregated skills statistics
   */
  @Get('skills-distribution')
  @Roles('ADMIN')
  @CacheKey('analytics:skills-distribution')
  @CacheTTL(CACHE_TTL_15_MIN)
  @ApiOperation({
    summary: 'Get skills distribution statistics',
    description:
      'Returns skills ranked by badge count and grouped by category. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Skills distribution data',
    type: SkillsDistributionDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getSkillsDistribution(): Promise<SkillsDistributionDto> {
    return this.analyticsService.getSkillsDistribution();
  }

  /**
   * AC5: Recent Activity Feed API
   * Returns system-wide activity log
   */
  @Get('recent-activity')
  @Roles('ADMIN')
  @CacheTTL(CACHE_TTL_15_MIN)
  @ApiOperation({
    summary: 'Get recent system activity',
    description:
      'Returns paginated system activity feed from audit log. Admin only.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max results (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Pagination offset',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity list',
    type: RecentActivityDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getRecentActivity(
    @Query() query: RecentActivityQueryDto,
  ): Promise<RecentActivityDto> {
    return this.analyticsService.getRecentActivity(query.limit, query.offset);
  }
}
