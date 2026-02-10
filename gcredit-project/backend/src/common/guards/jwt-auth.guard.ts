import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Validates JWT tokens on protected routes.
 * Public routes marked with @Public() decorator are excluded,
 * but will still populate req.user if a valid Bearer token is present.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Still try to authenticate if a Bearer token is present (best-effort)
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          await super.canActivate(context);
        } catch {
          // Token invalid or expired — allow access as public route
        }
      }
      return true;
    }

    // Call parent AuthGuard to validate JWT
    return super.canActivate(context);
  }
}
