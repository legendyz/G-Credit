import { UserRole } from '@prisma/client';

/**
 * Typed request interface for authenticated endpoints.
 * Matches the shape returned by JwtStrategy.validate():
 *   { userId: payload.sub, email: payload.email, role: payload.role }
 *
 * TD-015: Extracted as shared interface to replace `req: any` across controllers.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
