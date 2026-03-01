/**
 * PermissionsController
 *
 * Dedicated permissions endpoint for frontend dashboard/sidebar rendering.
 * Pure JWT claim-based computation — no database queries.
 *
 * Story 15.2: GET /api/users/me/permissions
 * @see ADR-016 DEC-016-01, DEC-016-02
 * @see ADR-015/017 Dual-dimension identity model
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/request-with-user.interface';
import { UserPermissionsDto } from './dto/user-permissions.dto';
import { computePermissions } from './utils/compute-permissions';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/users/me')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  /**
   * GET /api/users/me/permissions
   *
   * Returns the user's effective permissions computed from JWT claims.
   * No database queries — fast (<50ms).
   * Does NOT return PII (email, userId).
   *
   * AC #1, #2, #3, #4, #5, #6, #7
   */
  @Get('permissions')
  @ApiOperation({
    summary: 'Get current user permissions',
    description:
      'Returns computed dashboard tabs, sidebar groups, and permission flags based on JWT claims (role + isManager). No PII included.',
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions computed from JWT claims',
    type: UserPermissionsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — JWT required' })
  getPermissions(@CurrentUser() user: AuthenticatedUser): UserPermissionsDto {
    return computePermissions(user.role, user.isManager);
  }
}
