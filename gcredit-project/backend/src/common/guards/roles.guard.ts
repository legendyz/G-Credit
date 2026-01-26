import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard
 *
 * Enforces role-based access control (RBAC).
 * Checks if user's role matches the roles specified in @Roles() decorator.
 *
 * Role Hierarchy:
 * - ADMIN: Full system access (can access all endpoints)
 * - ISSUER: Badge management and issuance
 * - MANAGER: Team visibility and approvals
 * - EMPLOYEE: Personal badge wallet
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // ADMIN has access to everything
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => user.role === role);
  }
}
