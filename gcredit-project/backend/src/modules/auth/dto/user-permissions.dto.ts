/**
 * UserPermissionsDto
 *
 * Response DTO for GET /api/users/me/permissions
 * Contains computed permission arrays and flat booleans.
 *
 * NOTE-15.2-003: Response includes both computed arrays AND flat booleans for flexibility.
 * Security: Does NOT include PII (email, userId) — only permission flags.
 *
 * @see Story 15.2 AC #2, #7, #8
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class FlatPermissionsDto {
  @ApiProperty({
    description: 'Whether user can view team data',
    example: true,
  })
  @IsBoolean()
  canViewTeam: boolean;

  @ApiProperty({ description: 'Whether user can issue badges', example: true })
  @IsBoolean()
  canIssueBadges: boolean;

  @ApiProperty({ description: 'Whether user can manage users', example: false })
  @IsBoolean()
  canManageUsers: boolean;
}

export class UserPermissionsDto {
  @ApiProperty({
    description: 'User role (permission dimension)',
    enum: UserRole,
    example: 'ISSUER',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Whether user is a manager (organization dimension, ADR-017)',
    example: true,
  })
  @IsBoolean()
  isManager: boolean;

  @ApiProperty({
    description: 'Dashboard tabs the user can access (DEC-016-01)',
    type: [String],
    example: ['my-badges', 'team', 'issuance'],
  })
  @IsArray()
  @IsString({ each: true })
  dashboardTabs: string[];

  @ApiProperty({
    description: 'Sidebar navigation groups the user can access (DEC-016-02)',
    type: [String],
    example: ['base', 'team', 'issuance'],
  })
  @IsArray()
  @IsString({ each: true })
  sidebarGroups: string[];

  @ApiProperty({
    description: 'Flat permission booleans for convenience (NOTE-15.2-003)',
    type: FlatPermissionsDto,
  })
  @ValidateNested()
  @Type(() => FlatPermissionsDto)
  permissions: FlatPermissionsDto;
}
