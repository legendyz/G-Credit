import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Usage: @Public()
 * Marks a route as publicly accessible (skips JWT validation).
 * Use for login, register, verification endpoints, etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
