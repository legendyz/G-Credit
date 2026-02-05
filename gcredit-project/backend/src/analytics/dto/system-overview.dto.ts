import { ApiProperty } from '@nestjs/swagger';

export class UsersByRoleDto {
  @ApiProperty({ example: 5 })
  ADMIN: number;

  @ApiProperty({ example: 20 })
  ISSUER: number;

  @ApiProperty({ example: 45 })
  MANAGER: number;

  @ApiProperty({ example: 380 })
  EMPLOYEE: number;
}

export class UsersOverviewDto {
  @ApiProperty({ example: 450, description: 'Total registered users' })
  total: number;

  @ApiProperty({ example: 320, description: 'Users active this month' })
  activeThisMonth: number;

  @ApiProperty({ example: 25, description: 'New users this month' })
  newThisMonth: number;

  @ApiProperty({ type: UsersByRoleDto })
  byRole: UsersByRoleDto;
}

export class BadgesOverviewDto {
  @ApiProperty({ example: 1234, description: 'Total badges issued' })
  totalIssued: number;

  @ApiProperty({ example: 1015, description: 'Claimed badges' })
  claimedCount: number;

  @ApiProperty({ example: 189, description: 'Pending (unclaimed) badges' })
  pendingCount: number;

  @ApiProperty({ example: 30, description: 'Revoked badges' })
  revokedCount: number;

  @ApiProperty({ example: 0.82, description: 'Claim rate (claimed/issued)' })
  claimRate: number;
}

export class TemplatesOverviewDto {
  @ApiProperty({ example: 23, description: 'Total templates' })
  total: number;

  @ApiProperty({ example: 18, description: 'Active templates' })
  active: number;

  @ApiProperty({ example: 3, description: 'Draft templates' })
  draft: number;

  @ApiProperty({ example: 2, description: 'Archived templates' })
  archived: number;
}

export class SystemHealthDto {
  @ApiProperty({
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy'],
  })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({
    example: '2026-02-02T09:00:00Z',
    description: 'Last sync timestamp',
  })
  lastSync: string;

  @ApiProperty({ example: '120ms', description: 'Average API response time' })
  apiResponseTime: string;
}

export class SystemOverviewDto {
  @ApiProperty({ type: UsersOverviewDto })
  users: UsersOverviewDto;

  @ApiProperty({ type: BadgesOverviewDto })
  badges: BadgesOverviewDto;

  @ApiProperty({ type: TemplatesOverviewDto })
  badgeTemplates: TemplatesOverviewDto;

  @ApiProperty({ type: SystemHealthDto })
  systemHealth: SystemHealthDto;
}
