import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator
 *
 * Usage: getProfile(@CurrentUser() user: any)
 * Extracts the authenticated user from the request object.
 * User is populated by JwtStrategy after token validation.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
