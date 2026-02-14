import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
}

/**
 * Validate and retrieve JWT_SECRET from environment
 * SEC-P0-003: Fail fast at startup if JWT_SECRET is missing or too short
 */
function getJwtSecret(config: ConfigService): string {
  const jwtSecret = config.get<string>('JWT_SECRET');

  if (!jwtSecret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is required. ' +
        'Please set it in your .env file or environment.',
    );
  }

  if (jwtSecret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET must be at least 32 characters for security. ' +
        `Current length: ${jwtSecret.length}`,
    );
  }

  return jwtSecret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    const jwtSecret = getJwtSecret(config);

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Prefer httpOnly cookie (Story 11.6 - SEC-002)
        (req: Request) => (req?.cookies?.access_token as string) || null,
        // 2. Fallback to Authorization header (dual-write transition period)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    // This method is called after JWT signature verification
    // The payload is automatically verified by passport-jwt
    // We return the user object that will be attached to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
