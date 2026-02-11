import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
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

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Still try to authenticate if a Bearer token is present (best-effort)
      const request = context.switchToHttp().getRequest<Request>();
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const result = super.canActivate(context);
        if (result instanceof Promise) {
          // Wait for JWT validation to populate req.user, but always allow access
          return result.then(() => true).catch(() => true);
        }
      }
      return true;
    }

    // Call parent AuthGuard to validate JWT
    return super.canActivate(context);
  }
}
