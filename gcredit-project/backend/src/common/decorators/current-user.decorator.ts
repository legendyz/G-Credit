import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/request-with-user.interface';

/**
 * CurrentUser Decorator
 *
 * Usage: getProfile(@CurrentUser() user: AuthenticatedUser)
 * Extracts the authenticated user from the request object.
 * User is populated by JwtStrategy after token validation.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
