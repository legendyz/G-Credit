import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MANAGER_KEY } from '../decorators/require-manager.decorator';
import type { AuthenticatedUser } from '../interfaces/request-with-user.interface';

/**
 * ManagerGuard — ADR-017 §4.5: Organization Dimension
 *
 * Checks the `isManager` claim from the JWT token (set in Story 14.3).
 * This is the ORGANIZATION dimension of the dual-dimension identity model:
 * - Permission dimension: RolesGuard checks role (ADMIN/ISSUER/EMPLOYEE)
 * - Organization dimension: ManagerGuard checks isManager (true/false)
 *
 * ADMIN always bypasses this guard (consistent with RolesGuard).
 *
 * Usage:
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, ManagerGuard)
 *   async getTeamDashboard() { ... }
 *
 * Composition (both dimensions):
 *   @Roles('ISSUER')
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, RolesGuard, ManagerGuard)
 *   async issuerManagerEndpoint() { ... }
 */
@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireManager = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MANAGER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If @RequireManager() not applied, allow through
    if (!requireManager) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();

    // ADMIN bypasses manager check (consistent with RolesGuard)
    if (user.role === 'ADMIN') return true;

    // Check JWT claim (computed at login/refresh in auth.service.ts)
    if (user.isManager !== true) {
      throw new ForbiddenException('Manager access required');
    }
    return true;
  }
}
