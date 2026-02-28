import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MANAGER_KEY = 'requireManager';

/**
 * RequireManager Decorator — ADR-017 §4.5
 *
 * Marks an endpoint as requiring manager identity (isManager: true in JWT).
 * Must be used with ManagerGuard:
 *
 *   @RequireManager()
 *   @UseGuards(JwtAuthGuard, ManagerGuard)
 *
 * ADMIN users bypass this check automatically.
 */
export const RequireManager = () => SetMetadata(REQUIRE_MANAGER_KEY, true);
