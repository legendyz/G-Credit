import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Usage: @Roles('ADMIN', 'ISSUER')
 * Restricts endpoint access to specified roles.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
